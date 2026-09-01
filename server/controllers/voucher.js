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

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;

    let voucherQuery = Voucher.find(query)
      .sort({ voucherNo: -1 })
      .populate('employeeId')
      .populate('sponsorId', 'name sponsorCode customerId email mobile');

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
      .populate('sponsorId', 'name sponsorCode customerId email mobile');
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
    let { ledgerId, newLedgerName, date, amount, narration } = req.body;
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
      if (emp) {
        branchId = emp.branchId;
      }
    }
    if (!branchId) {
      if (req.user.branchIds && req.user.branchIds.length > 0) {
        branchId = req.user.branchIds[0];
      } else {
        const defaultBranch = await Branch.findOne().session(session);
        if (defaultBranch) {
          branchId = defaultBranch._id;
        }
      }
    }
    if (!branchId) {
      return res.status(400).json({ message: "No branch found. Please create a branch first." });
    }

    const voucherNo = await generateVoucherNo(date ? new Date(date) : new Date(), session);

    const voucher = new Voucher({
      branchId,
      voucherNo,
      type: 'MANUAL',
      employeeId: targetLedger.employeeId || null,
      sponsorId: targetLedger.sponsorId || null,
      date: date ? new Date(date) : new Date(),
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

    await accountingService.recordLedgerEntry({
      ledgerId: targetLedger._id,
      employeeId: targetLedger.employeeId,
      sponsorId: targetLedger.sponsorId,
      branchId,
      date: date ? new Date(date) : new Date(),
      type: 'DEBIT',
      amount: amountNum,
      source: 'manual',
      voucherId: voucher._id,
      referenceId: voucher._id,
      remarks: narration || `Voucher ${voucherNo}`
    }, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      voucher
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Voucher creation error:", error);
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
          amount: amountNum,
          source: 'manual',
          voucherId: voucher._id,
          referenceId: voucher._id,
          remarks: narration || `Voucher ${voucher.voucherNo}`
        }, session);
      } else {
        await accountingService.updateLedgerEntry(entry._id, {
          debit: amountNum,
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
        amount: amountNum,
        source: 'manual',
        voucherId: voucher._id,
        referenceId: voucher._id,
        remarks: narration || `Voucher ${voucher.voucherNo}`
      }, session);
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
