const FundTransfer = require('../models/FundTransfer');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const Counter = require('../models/Counter');
const accountingService = require('../services/accountingService');
const { withTransaction } = require('../utils/transaction');
const cloudinary = require('../utils/cloudinary');

/**
 * 1. Request a Fund Transfer (Inter-Ledger / Cash to Bank / Cashier to Cashier / Bank to Bank)
 */
exports.requestTransfer = async (req, res, next) => {
  try {
    const { fromLedgerId, toLedgerId, amount, transferMode, referenceNo, narration, transferDate } = req.body;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ message: "Transfer amount must be greater than 0" });
    }

    if (!fromLedgerId || !toLedgerId) {
      return res.status(400).json({ message: "Source and Destination ledgers are required" });
    }

    if (String(fromLedgerId) === String(toLedgerId)) {
      return res.status(400).json({ message: "Source and Destination ledgers cannot be the same" });
    }

    const fromLedger = await Ledger.findById(fromLedgerId);
    if (!fromLedger) {
      return res.status(404).json({ message: "Source ledger not found" });
    }

    const toLedger = await Ledger.findById(toLedgerId);
    if (!toLedger) {
      return res.status(404).json({ message: "Destination ledger not found" });
    }

    // Security: Only the assigned cashier can transfer funds OUT of their personal cash drawer
    if (fromLedger.ledgerType === 'user_cash') {
      const isOwner = String(fromLedger.assignedUserId) === String(req.user.id || req.user._id);
      if (!isOwner) {
        return res.status(403).json({ message: "You can only initiate transfers from your own personal cash ledger" });
      }
    } else if (fromLedger.ledgerType === 'bank') {
      const isSuperAdmin = ['superadmin', 'admin', 'developer', 'grant'].includes(String(req.user.role).toLowerCase());
      if (!isSuperAdmin) {
        return res.status(403).json({ message: "Only administrators can initiate transfers directly from corporate bank accounts" });
      }
    }

    // Check available balance (Current balance - sum of other pending transfers from this source)
    const pendingTransfers = await FundTransfer.find({
      fromLedgerId: fromLedger._id,
      status: 'PENDING'
    });
    const heldBalance = pendingTransfers.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const availableBalance = (Number(fromLedger.advance) || 0) - heldBalance;

    if (amountNum > availableBalance) {
      return res.status(400).json({
        message: `Insufficient available balance in ${fromLedger.name}. Current: ₹${(fromLedger.advance || 0).toLocaleString('en-IN')}, Held in pending requests: ₹${heldBalance.toLocaleString('en-IN')}, Available: ₹${availableBalance.toLocaleString('en-IN')}`
      });
    }

    // Upload deposit slip / challan photo if attached
    let depositSlipUrl = '';
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: 'ems/transfers'
      });
      depositSlipUrl = uploadRes.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    // Generate sequence number TRF-2627-XXX (auto-recovering counter from highest DB entry)
    const now = new Date();
    const curYear = now.getFullYear() % 100;
    const nextYear = (curYear + 1) % 100;
    const fyKey = `${curYear}${nextYear}`;
    const sequenceKey = `TRF-${fyKey}`;

    let transfer = null;
    let transferNo = '';
    let attempts = 0;

    while (!transfer && attempts < 5) {
      attempts++;
      let seq = await Counter.getNextSequence(sequenceKey, null, 0);

      // Check if this transferNo already exists in database (e.g. from manual inserts / legacy DB restore)
      let candidateNo = `TRF-${fyKey}-${String(seq).padStart(3, '0')}`;
      const exists = await FundTransfer.findOne({ transferNo: candidateNo });
      if (exists) {
        // Find highest existing sequence for this prefix and sync counter forward
        const highestTransfer = await FundTransfer.findOne({
          transferNo: new RegExp(`^TRF-${fyKey}-\\d+`)
        }).sort({ transferNo: -1 }).select('transferNo').lean();

        if (highestTransfer?.transferNo) {
          const parts = highestTransfer.transferNo.split('-');
          const lastNum = parseInt(parts[parts.length - 1], 10) || 0;
          await Counter.findByIdAndUpdate(
            sequenceKey,
            { $set: { sequence: Math.max(seq, lastNum) + 1 } },
            { upsert: true }
          );
          seq = Math.max(seq, lastNum) + 1;
          candidateNo = `TRF-${fyKey}-${String(seq).padStart(3, '0')}`;
        }
      }

      transferNo = candidateNo;

      try {
        const newTransfer = new FundTransfer({
          transferNo,
          fromLedgerId: fromLedger._id,
          toLedgerId: toLedger._id,
          fromUserId: req.user.id,
          toUserId: toLedger.assignedUserId || null,
          amount: amountNum,
          transferDate: transferDate ? new Date(transferDate) : new Date(),
          transferMode: transferMode || 'CASH_DEPOSIT',
          referenceNo: referenceNo || '',
          depositSlipUrl,
          narration: narration || `Transfer from ${fromLedger.name} to ${toLedger.name}`,
          status: 'PENDING',
          branchId: req.user.branchIds?.[0] || null
        });

        await newTransfer.save();
        transfer = newTransfer;
      } catch (saveErr) {
        if (saveErr.code === 11000 && attempts < 5) {
          // Increment counter and retry loop
          await Counter.findByIdAndUpdate(sequenceKey, { $inc: { sequence: 1 } }, { upsert: true });
        } else {
          throw saveErr;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Transfer request ${transferNo} submitted successfully and is awaiting approval.`,
      transfer
    });
  } catch (error) {
    console.error("Transfer request error:", error);
    return next({ status: 500, message: error.message });
  }
};

/**
 * 2. Approve Transfer (Maker-Checker Sign-off)
 */
exports.approveTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const result = await withTransaction(async (session) => {
      const transfer = await FundTransfer.findById(id).session(session);
      if (!transfer) {
        throw new Error("Transfer request not found");
      }

      if (transfer.status !== 'PENDING') {
        throw new Error(`Transfer request is already ${transfer.status}`);
      }

      const fromLedger = await Ledger.findById(transfer.fromLedgerId).session(session);
      const toLedger = await Ledger.findById(transfer.toLedgerId).session(session);

      if (!fromLedger || !toLedger) {
        throw new Error("One or both associated ledgers were not found");
      }

      // Permissions check: Superadmin, Admin, Developer, or the assigned user of toLedger
      const isSuperOrAdmin = ['superadmin', 'admin', 'developer'].includes(req.user.role);
      const isRecipientUser = toLedger.assignedUserId && String(toLedger.assignedUserId) === String(req.user.id);

      if (!isSuperOrAdmin && !isRecipientUser) {
        throw new Error("Unauthorized. Only Admin or the receiving account holder can approve this transfer.");
      }

      // Re-verify balance
      if (Number(fromLedger.advance) < Number(transfer.amount)) {
        throw new Error(`Source account ${fromLedger.name} does not have sufficient balance (Current: ₹${fromLedger.advance}).`);
      }

      // 1. Debit Source Ledger (Money Out)
      const debitEntry = await accountingService.recordLedgerEntry({
        ledgerId: fromLedger._id,
        employeeId: fromLedger.employeeId,
        sponsorId: fromLedger.sponsorId,
        date: transfer.transferDate || new Date(),
        type: 'DEBIT',
        amount: transfer.amount,
        source: 'transfer',
        referenceId: transfer._id,
        remarks: `Transferred to ${toLedger.name} (Ref: ${transfer.transferNo}${transfer.referenceNo ? ' / ' + transfer.referenceNo : ''})`
      }, session);

      // 2. Credit Destination Ledger (Money In)
      const creditEntry = await accountingService.recordLedgerEntry({
        ledgerId: toLedger._id,
        employeeId: toLedger.employeeId,
        sponsorId: toLedger.sponsorId,
        date: transfer.transferDate || new Date(),
        type: 'CREDIT',
        amount: transfer.amount,
        source: 'transfer',
        referenceId: transfer._id,
        remarks: `Received from ${fromLedger.name} (Ref: ${transfer.transferNo}${transfer.referenceNo ? ' / ' + transfer.referenceNo : ''})`
      }, session);

      transfer.status = 'APPROVED';
      transfer.approvedBy = req.user.id;
      transfer.approvedAt = new Date();
      transfer.debitEntryId = debitEntry._id;
      transfer.creditEntryId = creditEntry._id;
      if (remarks) {
        transfer.narration = transfer.narration ? `${transfer.narration} | Approval Note: ${remarks}` : remarks;
      }
      await transfer.save({ session });

      return transfer;
    });

    return res.status(200).json({
      success: true,
      message: `Transfer ${result.transferNo} approved successfully. ₹${result.amount.toLocaleString('en-IN')} transferred.`,
      transfer: result
    });
  } catch (error) {
    console.error("Approve transfer error:", error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * 3. Reject Transfer
 */
exports.rejectTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const transfer = await FundTransfer.findById(id);
    if (!transfer) return res.status(404).json({ message: "Transfer request not found" });

    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ message: `Transfer request is already ${transfer.status}` });
    }

    transfer.status = 'REJECTED';
    transfer.rejectionReason = reason.trim();
    transfer.rejectedBy = req.user.id;
    transfer.rejectedAt = new Date();
    await transfer.save();

    return res.status(200).json({
      success: true,
      message: `Transfer request ${transfer.transferNo} has been rejected.`,
      transfer
    });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

/**
 * 4. Cancel Transfer (By Maker)
 */
exports.cancelTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await FundTransfer.findById(id);
    if (!transfer) return res.status(404).json({ message: "Transfer request not found" });

    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ message: `Transfer request is already ${transfer.status}` });
    }

    if (String(transfer.fromUserId) !== String(req.user.id) && !['superadmin', 'admin', 'developer'].includes(req.user.role)) {
      return res.status(403).json({ message: "You can only cancel your own pending transfer requests" });
    }

    transfer.status = 'CANCELLED';
    transfer.cancelledAt = new Date();
    await transfer.save();

    return res.status(200).json({
      success: true,
      message: `Transfer request ${transfer.transferNo} cancelled.`,
      transfer
    });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

/**
 * 5. Get Transfers List with Filters & Pagination
 */
exports.getTransfers = async (req, res, next) => {
  try {
    const { status, search, fromDate, toDate, ledgerId, page = 1, limit = 25 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (ledgerId) {
      query.$or = [{ fromLedgerId: ledgerId }, { toLedgerId: ledgerId }];
    }

    // Role Scoping
    if (!['superadmin', 'admin', 'developer'].includes(req.user.role)) {
      const userLedger = await Ledger.findOne({ assignedUserId: req.user.id, ledgerType: 'user_cash' });
      const ledgerIds = userLedger ? [userLedger._id] : [];
      query.$or = [
        { fromUserId: req.user.id },
        { toUserId: req.user.id },
        ...(ledgerIds.length ? [{ fromLedgerId: { $in: ledgerIds } }, { toLedgerId: { $in: ledgerIds } }] : [])
      ];
    }

    if (fromDate && toDate) {
      query.transferDate = {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999))
      };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { transferNo: searchRegex },
        { referenceNo: searchRegex },
        { narration: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;

    const total = await FundTransfer.countDocuments(query);
    const transfers = await FundTransfer.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('fromLedgerId', 'name ledgerType bankName accountNumber profileImage advance')
      .populate('toLedgerId', 'name ledgerType bankName accountNumber profileImage advance')
      .populate('fromUserId', 'name email role')
      .populate('toUserId', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role');

    return res.status(200).json({
      transfers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

/**
 * 6. Get Transfer Stats & Pending Approvals Count
 */
exports.getTransferStats = async (req, res, next) => {
  try {
    const isSuperOrAdmin = ['superadmin', 'admin', 'developer'].includes(req.user.role);
    let pendingCount = 0;
    if (isSuperOrAdmin) {
      pendingCount = await FundTransfer.countDocuments({ status: 'PENDING' });
    } else {
      const userLedger = await Ledger.findOne({ assignedUserId: req.user.id, ledgerType: 'user_cash' });
      pendingCount = await FundTransfer.countDocuments({
        status: 'PENDING',
        $or: [
          { toUserId: req.user.id },
          ...(userLedger ? [{ toLedgerId: userLedger._id }] : [])
        ]
      });
    }

    const totalApproved = await FundTransfer.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalPending = await FundTransfer.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      pendingCount,
      totalApprovedAmount: totalApproved[0]?.totalAmount || 0,
      totalApprovedCount: totalApproved[0]?.count || 0,
      totalPendingAmount: totalPending[0]?.totalAmount || 0,
      totalPendingCount: totalPending[0]?.count || 0,
    });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};
