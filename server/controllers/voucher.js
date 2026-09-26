const Voucher = require('../models/voucher');
const Ledger = require('../models/ledger');
const employee = require('../models/employee');
const Entry = require('../models/entry');
const Branch = require('../models/branch');
const accountingService = require('../services/accountingService');
const mongoose = require('mongoose');
const { generateVoucherNo } = require('../utils/voucherHelper');

exports.getVouchers = async (req, res, next) => {
  try {
    const query = { type: 'MANUAL' };
    if (req.user.role === 'manager' && Array.isArray(req.user.branchIds)) {
      query.branchId = { $in: req.user.branchIds };
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;

    let voucherQuery = Voucher.find(query)
      .sort({ voucherNo: -1, createdAt: -1 })
      .populate('employeeId')
      .populate('ledgerId', 'name ledgerType profileImage')
      .populate('sponsorId', 'name sponsorCode customerId email mobile')
      .populate('approvedBy', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('paymentTranches.paidBy', 'name email');

    let total = 0;
    let pages = 1;

    if (limit > 0) {
      total = await Voucher.countDocuments(query);
      pages = Math.ceil(total / limit);
      voucherQuery = voucherQuery.skip((page - 1) * limit).limit(limit);
    }

    const vouchers = await voucherQuery;
    return res.status(200).json({
      list: vouchers,
      ...(limit > 0 ? { pagination: { page, limit, total, pages } } : {})
    });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

exports.getVoucherDetails = async (req, res, next) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('employeeId')
      .populate('ledgerId')
      .populate('sponsorId', 'name sponsorCode customerId email mobile')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('paymentTranches.paidBy', 'name email role');

    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    return res.status(200).json(voucher);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

exports.createVoucher = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { ledgerId, newLedgerName, date, amount, narration, autoApprove = false, initialPayment = 0, paymentMode = 'CASH', referenceNo = '' } = req.body;
    const amountNum = Number(amount) || 0;
    if (amountNum <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    let targetLedger;
    if (newLedgerName) {
      const cleanName = newLedgerName.trim();
      if (!cleanName) return res.status(400).json({ message: "Ledger name cannot be empty" });

      targetLedger = await Ledger.findOne({
        name: cleanName,
        ledgerType: 'custom'
      }).session(session);

      if (!targetLedger) {
        targetLedger = new Ledger({
          name: cleanName,
          ledgerType: 'custom',
          userId: req.userid,
          isVoucherLedger: true,
          advance: 0
        });
        await targetLedger.save({ session });
      }
    } else if (ledgerId) {
      targetLedger = await Ledger.findById(ledgerId).session(session);
    }

    if (!targetLedger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    let branchId;
    if (targetLedger.ledgerType === 'employee' && targetLedger.employeeId) {
      const emp = await employee.findById(targetLedger.employeeId).session(session);
      if (emp) branchId = emp.branchId;
    }
    if (!branchId) {
      if (req.user?.branchIds && req.user.branchIds.length > 0) {
        branchId = req.user.branchIds[0];
      } else {
        const defaultBranch = await Branch.findOne().session(session);
        if (defaultBranch) branchId = defaultBranch._id;
      }
    }
    if (!branchId) {
      return res.status(400).json({ message: "No branch found. Please create a branch first." });
    }

    const voucherNo = await generateVoucherNo(date ? new Date(date) : new Date(), session);

    // Initial status: PENDING unless autoApprove is explicitly requested by superadmin/admin
    const initialStatus = autoApprove ? 'APPROVED' : 'PENDING';
    const initPaidNum = Math.min(Math.max(Number(initialPayment) || 0, 0), amountNum);
    const remainingNum = amountNum - initPaidNum;

    let tranches = [];
    if (initPaidNum > 0 && initialStatus !== 'PENDING') {
      tranches.push({
        amount: initPaidNum,
        paymentDate: date ? new Date(date) : new Date(),
        paymentMode,
        referenceNo,
        remarks: 'Initial disbursement on creation',
        paidBy: req.userid
      });
    }

    const finalStatus = initialStatus === 'PENDING' 
      ? 'PENDING' 
      : (initPaidNum >= amountNum ? 'PAID' : (initPaidNum > 0 ? 'PARTIALLY_PAID' : 'APPROVED'));

    const voucher = new Voucher({
      branchId,
      voucherNo,
      type: 'MANUAL',
      employeeId: targetLedger.employeeId || null,
      sponsorId: targetLedger.sponsorId || null,
      ledgerId: targetLedger._id,
      date: date ? new Date(date) : new Date(),
      totalAmount: amountNum,
      paidAmount: initPaidNum,
      remainingAmount: remainingNum,
      status: finalStatus,
      createdBy: req.userid,
      approvedBy: autoApprove ? req.userid : null,
      approvedAt: autoApprove ? new Date() : null,
      paymentTranches: tranches,
      entries: [
        {
          accountName: targetLedger.name,
          type: 'DEBIT',
          amount: amountNum
        },
        {
          accountName: 'Cash/Bank',
          type: 'CREDIT',
          amount: amountNum
        }
      ],
      referenceType: 'MANUAL',
      remarks: narration
    });

    await voucher.save({ session });

    // If auto-approved or initial payment made, record ledger entry
    if (finalStatus !== 'PENDING') {
      const ledgerDebitAmount = initPaidNum > 0 ? initPaidNum : amountNum;
      await accountingService.recordLedgerEntry({
        ledgerId: targetLedger._id,
        employeeId: targetLedger.employeeId,
        sponsorId: targetLedger.sponsorId,
        branchId,
        date: date ? new Date(date) : new Date(),
        type: 'DEBIT',
        amount: ledgerDebitAmount,
        source: 'manual',
        voucherId: voucher._id,
        referenceId: voucher._id,
        remarks: narration || `Voucher ${voucherNo}`
      }, session);
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: initialStatus === 'PENDING' ? "Voucher submitted for approval" : "Voucher created & approved successfully",
      voucher
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher creation error:", error);
    return next({ status: 500, message: error.message });
  }
};

// ── Voucher Approval & Edit-on-Approval Handler ──
exports.approveVoucher = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { approvedAmount, date, narration, ledgerId, disbursementAmount = 0, paymentMode = 'CASH', referenceNo = '' } = req.body;

    const voucher = await Voucher.findById(id).session(session);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    if (voucher.status === 'PAID') {
      return res.status(400).json({ message: "Voucher is already fully paid" });
    }

    // Target ledger update if modified during approval
    let targetLedger = null;
    if (ledgerId) {
      targetLedger = await Ledger.findById(ledgerId).session(session);
    }
    if (!targetLedger && voucher.ledgerId) {
      targetLedger = await Ledger.findById(voucher.ledgerId).session(session);
    }
    if (!targetLedger) {
      const debitEntry = voucher.entries?.find(e => e.type === 'DEBIT');
      if (debitEntry) {
        targetLedger = await Ledger.findOne({ name: debitEntry.accountName }).session(session);
      }
    }

    const finalTotal = approvedAmount ? Number(approvedAmount) : (voucher.totalAmount || voucher.entries?.[0]?.amount || 0);
    const disbNum = Math.max(Number(disbursementAmount) || 0, 0);

    const prevPaid = Number(voucher.paidAmount) || 0;
    const newPaid = Math.min(prevPaid + disbNum, finalTotal);
    const newRemaining = finalTotal - newPaid;

    let newStatus = 'APPROVED';
    if (newPaid >= finalTotal && finalTotal > 0) {
      newStatus = 'PAID';
    } else if (newPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    // Add disbursement tranche if payment amount > 0
    if (disbNum > 0) {
      voucher.paymentTranches.push({
        amount: disbNum,
        paymentDate: date ? new Date(date) : new Date(),
        paymentMode: paymentMode || 'CASH',
        referenceNo: referenceNo || '',
        remarks: `Disbursement approved by ${req.user?.name || 'Admin'}`,
        paidBy: req.userid
      });
    }

    voucher.totalAmount = finalTotal;
    voucher.paidAmount = newPaid;
    voucher.remainingAmount = newRemaining;
    voucher.status = newStatus;
    voucher.approvedBy = req.userid;
    voucher.approvedAt = new Date();
    voucher.date = date ? new Date(date) : voucher.date;
    voucher.remarks = narration || voucher.remarks;

    if (targetLedger) {
      voucher.ledgerId = targetLedger._id;
      voucher.employeeId = targetLedger.employeeId || null;
      voucher.sponsorId = targetLedger.sponsorId || null;
      voucher.entries = [
        { accountName: targetLedger.name, type: 'DEBIT', amount: finalTotal },
        { accountName: 'Cash/Bank', type: 'CREDIT', amount: finalTotal }
      ];
    }

    await voucher.save({ session });

    // Sync financial ledger with disbursed amount or approved total
    if (targetLedger) {
      const existingEntry = await Entry.findOne({ referenceId: voucher._id }).session(session);
      const ledgerAmountToRecord = newPaid > 0 ? newPaid : finalTotal;

      if (existingEntry) {
        await accountingService.updateLedgerEntry(existingEntry._id, {
          debit: ledgerAmountToRecord,
          credit: 0,
          particular: voucher.remarks || `Voucher ${voucher.voucherNo} (${newStatus})`,
          date: voucher.date
        }, session);
      } else {
        await accountingService.recordLedgerEntry({
          ledgerId: targetLedger._id,
          employeeId: targetLedger.employeeId,
          sponsorId: targetLedger.sponsorId,
          branchId: voucher.branchId,
          date: voucher.date,
          type: 'DEBIT',
          amount: ledgerAmountToRecord,
          source: 'manual',
          voucherId: voucher._id,
          referenceId: voucher._id,
          remarks: voucher.remarks || `Voucher ${voucher.voucherNo} (${newStatus})`
        }, session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `Voucher ${voucher.voucherNo} approved successfully`,
      voucher
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher approval error:", error);
    return next({ status: 500, message: error.message });
  }
};

// ── Reject Voucher Handler ──
exports.rejectVoucher = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const voucher = await Voucher.findById(id).session(session);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    if (voucher.status === 'PAID') {
      return res.status(400).json({ message: "Cannot reject a fully paid voucher" });
    }

    voucher.status = 'REJECTED';
    voucher.rejectedBy = req.userid;
    voucher.rejectedAt = new Date();
    voucher.rejectionReason = rejectionReason || 'Rejected by authorized manager';

    await voucher.save({ session });

    // Clean up any ledger entry if previously recorded
    const existingEntry = await Entry.findOne({ referenceId: voucher._id }).session(session);
    if (existingEntry) {
      await accountingService.deleteLedgerEntry(existingEntry._id, session);
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `Voucher ${voucher.voucherNo} rejected`,
      voucher
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher reject error:", error);
    return next({ status: 500, message: error.message });
  }
};

// ── Record Additional Payment Tranche for Voucher ──
exports.recordVoucherPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMode = 'CASH', referenceNo = '', remarks = '' } = req.body;
    const payNum = Number(amount) || 0;

    if (payNum <= 0) {
      return res.status(400).json({ message: "Disbursement amount must be greater than 0" });
    }

    const voucher = await Voucher.findById(id).session(session);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    if (voucher.status === 'PENDING') {
      return res.status(400).json({ message: "Voucher must be approved before recording payments" });
    }

    if (voucher.status === 'REJECTED') {
      return res.status(400).json({ message: "Cannot disburse funds for a rejected voucher" });
    }

    const total = Number(voucher.totalAmount) || voucher.entries?.[0]?.amount || 0;
    const currentPaid = Number(voucher.paidAmount) || 0;
    const remaining = total - currentPaid;

    if (payNum > remaining) {
      return res.status(400).json({ message: `Amount exceeds remaining balance of ₹${remaining.toLocaleString('en-IN')}` });
    }

    const updatedPaid = currentPaid + payNum;
    const updatedRemaining = total - updatedPaid;
    const newStatus = updatedPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

    voucher.paymentTranches.push({
      amount: payNum,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode,
      referenceNo,
      remarks,
      paidBy: req.userid
    });

    voucher.paidAmount = updatedPaid;
    voucher.remainingAmount = updatedRemaining;
    voucher.status = newStatus;

    await voucher.save({ session });

    // Update financial ledger
    let targetLedger = voucher.ledgerId ? await Ledger.findById(voucher.ledgerId).session(session) : null;
    if (targetLedger) {
      const existingEntry = await Entry.findOne({ referenceId: voucher._id }).session(session);
      if (existingEntry) {
        await accountingService.updateLedgerEntry(existingEntry._id, {
          debit: updatedPaid,
          particular: `Voucher ${voucher.voucherNo} (Paid ₹${updatedPaid.toLocaleString('en-IN')} of ₹${total.toLocaleString('en-IN')})`
        }, session);
      } else {
        await accountingService.recordLedgerEntry({
          ledgerId: targetLedger._id,
          employeeId: targetLedger.employeeId,
          sponsorId: targetLedger.sponsorId,
          branchId: voucher.branchId,
          date: paymentDate ? new Date(paymentDate) : new Date(),
          type: 'DEBIT',
          amount: updatedPaid,
          source: 'manual',
          voucherId: voucher._id,
          referenceId: voucher._id,
          remarks: `Voucher ${voucher.voucherNo} (Paid ₹${updatedPaid.toLocaleString('en-IN')} of ₹${total.toLocaleString('en-IN')})`
        }, session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: `Disbursement of ₹${payNum.toLocaleString('en-IN')} recorded successfully`,
      voucher
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher payment record error:", error);
    return next({ status: 500, message: error.message });
  }
};

exports.editVoucher = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { ledgerId, date, amount, narration } = req.body;
    const amountNum = Number(amount) || 0;
    if (amountNum <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const voucher = await Voucher.findById(id).session(session);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    if (voucher.referenceType !== 'MANUAL') {
      return res.status(400).json({ message: "Only manual vouchers can be edited" });
    }

    const targetLedger = await Ledger.findById(ledgerId).session(session);
    if (!targetLedger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    const entry = await Entry.findOne({ referenceId: voucher._id }).session(session);

    // Update Voucher details
    voucher.date = date ? new Date(date) : voucher.date;
    voucher.remarks = narration || voucher.remarks;
    voucher.totalAmount = amountNum;
    voucher.remainingAmount = Math.max(amountNum - (voucher.paidAmount || 0), 0);
    voucher.ledgerId = targetLedger._id;
    voucher.employeeId = targetLedger.employeeId || null;
    voucher.sponsorId = targetLedger.sponsorId || null;
    voucher.entries = [
      {
        accountName: targetLedger.name,
        type: 'DEBIT',
        amount: amountNum
      },
      {
        accountName: 'Cash/Bank',
        type: 'CREDIT',
        amount: amountNum
      }
    ];
    await voucher.save({ session });

    if (voucher.status !== 'PENDING' && voucher.status !== 'REJECTED') {
      const ledgerAmountToRecord = voucher.paidAmount > 0 ? voucher.paidAmount : amountNum;
      if (entry) {
        if (entry.ledgerId.toString() !== targetLedger._id.toString()) {
          // Old ledger: remove entry
          await accountingService.deleteLedgerEntry(entry._id, session);
          // New ledger: add entry
          await accountingService.recordLedgerEntry({
            ledgerId: targetLedger._id,
            employeeId: targetLedger.employeeId,
            sponsorId: targetLedger.sponsorId,
            branchId: voucher.branchId,
            date: date ? new Date(date) : new Date(),
            type: 'DEBIT',
            amount: ledgerAmountToRecord,
            source: 'manual',
            voucherId: voucher._id,
            referenceId: voucher._id,
            remarks: narration || `Voucher ${voucher.voucherNo}`
          }, session);
        } else {
          await accountingService.updateLedgerEntry(entry._id, {
            debit: ledgerAmountToRecord,
            credit: 0,
            particular: narration || entry.particular,
            date: date ? new Date(date) : entry.date
          }, session);
        }
      } else {
        await accountingService.recordLedgerEntry({
          ledgerId: targetLedger._id,
          employeeId: targetLedger.employeeId,
          sponsorId: targetLedger.sponsorId,
          branchId: voucher.branchId,
          date: date ? new Date(date) : new Date(),
          type: 'DEBIT',
          amount: ledgerAmountToRecord,
          source: 'manual',
          voucherId: voucher._id,
          referenceId: voucher._id,
          remarks: narration || `Voucher ${voucher.voucherNo}`
        }, session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Voucher updated successfully",
      voucher
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher edit error:", error);
    return next({ status: 500, message: error.message });
  }
};

exports.deleteVoucher = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const voucher = await Voucher.findById(id).session(session);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    if (voucher.referenceType !== 'MANUAL') {
      return res.status(400).json({ message: "Only manual vouchers can be deleted" });
    }

    const entry = await Entry.findOne({ referenceId: voucher._id }).session(session);
    if (entry) {
      await accountingService.deleteLedgerEntry(entry._id, session);
    }

    await voucher.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Voucher deleted successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher deletion error:", error);
    return next({ status: 500, message: error.message });
  }
};
