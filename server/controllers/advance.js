const Advance = require("../models/advance");
const Employee = require("../models/employee");
const Entry = require("../models/entry");
const LedgerController = require("./ledger");
const accountingService = require("../services/accountingService");
const mongoose = require("mongoose");

const syncEmployeeAdvanceBalance = async (employeeId, session = null) => {
  // 1. Fetch ALL advance records for this employee, sorted by chronological order
  const allAdvances = await Advance.find({ employeeId }).sort({ date: 1, createdAt: 1 }).session(session);

  // 2. Identification and Reset:
  // Separate into 'given' (debits) and 'credits' (repaid/adjusted)
  // We reset 'given' records to their initial state to re-apply deductions
  const givenAdvances = allAdvances.filter(a => a.type === 'given');
  for (let adv of givenAdvances) {
    adv.remainingBalance = adv.initialAmount;
    adv.status = "open";
  }

  const credits = allAdvances.filter(a => a.type === 'repaid' || a.type === 'adjusted');
  
  // 3. Re-apply Credits (FIFO)
  for (let credit of credits) {
    let amountToApply = credit.amount;
    for (let given of givenAdvances) {
      if (amountToApply <= 0) break;
      if (given.remainingBalance > 0) {
        const canDeduct = Math.min(given.remainingBalance, amountToApply);
        given.remainingBalance -= canDeduct;
        amountToApply -= canDeduct;
        given.status = given.remainingBalance <= 0 ? "closed" : "partially_paid";
      }
    }
  }

  // 4. Update Running Balances and Save All (single bulk write instead of
  // one round trip per advance record - same fix applied to the ledger
  // balance-propagation loops elsewhere in this pass)
  let runningTotal = 0;
  const bulkOps = [];
  for (let adv of allAdvances) {
    if (adv.type === 'given') {
      runningTotal += adv.amount;
    } else {
      runningTotal -= adv.amount;
    }
    adv.balance = runningTotal;
    bulkOps.push({
      updateOne: {
        filter: { _id: adv._id },
        update: {
          $set: {
            balance: adv.balance,
            remainingBalance: adv.remainingBalance,
            status: adv.status,
          },
        },
      },
    });
  }
  if (bulkOps.length) {
    await Advance.bulkWrite(bulkOps, { session });
  }

  // 5. Update Employee Summary
  await Employee.findByIdAndUpdate(employeeId, { advance: runningTotal }).session(session);
  
  return runningTotal;
};

exports.syncEmployeeAdvanceBalance = syncEmployeeAdvanceBalance;

// Add new advance
exports.addAdvance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { employeeId, branchId, amount, type = "given", remarks, reason, date } = req.body;
    const amountNum = Number(amount) || 0;

    const advanceDate = date ? new Date(date) : new Date();
    advanceDate.setHours(0, 0, 0, 0);

    // 1. Create the Advance Record
    const newAdvance = new Advance({
      employeeId,
      branchId,
      type,
      amount: amountNum,
      initialAmount: type === "given" ? amountNum : 0,
      remainingBalance: type === "given" ? amountNum : 0,
      remarks,
      reason,
      date: advanceDate,
      status: type === "given" ? "open" : "closed"
    });

    await newAdvance.save({ session });

    // 2. If it's an adjustment/repayment, apply FIFO deduction to existing advances
    if (type === "adjusted" || type === "repaid") {
      let remainingToAdjust = amountNum;
      const openAdvances = await Advance.find({
        employeeId,
        remainingBalance: { $gt: 0 },
        type: "given"
      }).sort({ date: 1, createdAt: 1 }).session(session);

      for (const adv of openAdvances) {
        if (remainingToAdjust <= 0) break;
        const canDeduct = Math.min(adv.remainingBalance, remainingToAdjust);
        adv.remainingBalance -= canDeduct;
        adv.status = adv.remainingBalance === 0 ? "closed" : "partially_paid";
        await adv.save({ session });
        remainingToAdjust -= canDeduct;
      }
    }

    // 3. Create Ledger Entry for General Accounting (DEBIT - Reduces payable/Increases debt)
    await LedgerController.recordLedgerEntry({
      employeeId,
      companyId,
      date: advanceDate,
      type: type === "given" ? 'DEBIT' : 'CREDIT',
      amount: amountNum,
      source: 'advance',
      referenceId: newAdvance._id,
      remarks: remarks || `${type === 'given' ? 'Advance granted' : 'Advance adjustment'}: ${reason || 'No reason'}`
    }, session);

    // 4. Sycnronize Running Balances and Employee Summary
    await syncEmployeeAdvanceBalance(employeeId, session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Advance ${type === 'given' ? 'Granted' : 'Adjusted'} Successfully`,
      data: newAdvance,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error adding advance:", err.message);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// Manual Repayment
exports.repayAdvanceManual = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { advanceId, amount, remarks, date } = req.body;

    const advance = await Advance.findById(advanceId).session(session);
    if (!advance) {
      throw new Error("Advance record not found");
    }

    if (amount > advance.remainingBalance) {
      throw new Error("Repayment amount exceeds remaining balance");
    }

    const repayDate = date ? new Date(date) : new Date();
    repayDate.setHours(0, 0, 0, 0);

    // 1. Update Advance record
    advance.remainingBalance -= amount;
    advance.status = advance.remainingBalance === 0 ? "closed" : "partially_paid";
    await advance.save({ session });

    // 2. Create a "repaid" transaction record for tracking
    const repaymentRecord = new Advance({
      employeeId: advance.employeeId,
      companyId: advance.companyId,
      branchId: advance.branchId,
      type: "repaid",
      amount,
      remarks: remarks || `Manual repayment for advance ${advanceId}`,
      date: repayDate,
      status: "closed", // Individual transaction is always closed
      payrollId: null
    });
    await repaymentRecord.save({ session });

    // 3. Create Ledger Entry (CREDIT - Increases what company owes as it's a repayment)
    await LedgerController.recordLedgerEntry({
      employeeId: advance.employeeId,
      companyId: advance.companyId,
      date: repayDate,
      type: 'CREDIT',
      amount,
      source: 'manual',
      referenceId: repaymentRecord._id,
      remarks: remarks || `Manual repayment of advance (Ref: ${advanceId})`
    }, session);

    // 4. Synchronize Running Balances and Employee Summary
    await syncEmployeeAdvanceBalance(advance.employeeId, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Repayment recorded successfully",
      balance: advance.remainingBalance
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in manual repayment:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Edit advance
exports.editAdvance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { amount, remarks, reason, date } = req.body;

    const advance = await Advance.findById(id).session(session);
    if (!advance) {
      throw new Error("Advance not found");
    }

    if (advance.type === 'adjusted' && advance.payrollId) {
      throw new Error("Payroll-adjusted advances cannot be edited from here. Please edit the corresponding Payroll instead.");
    }

    // 🔹 Synchronize with Ledger via accountingService, which properly
    // shifts the running balance of this entry AND every entry after it.
    // (This used to manually patch debit/credit on the Entry directly and
    // then call LedgerController.recalculateBalances() to fix up running
    // balances afterward - but that function is a no-op stub (it just
    // logs a warning), so every edited advance was silently leaving stale
    // running balances on itself and every later ledger entry.)
    const ledgerEntry = await Entry.findOne({ referenceId: advance._id }).session(session);

    if (ledgerEntry) {
      const amountChanged = amount !== undefined && amount !== advance.amount;
      if (amountChanged || date || remarks) {
        const type = (advance.type === 'given' ? 'DEBIT' : 'CREDIT');
        const effectiveAmount = amountChanged ? amount : (ledgerEntry.debit || ledgerEntry.credit);
        await accountingService.updateLedgerEntry(ledgerEntry._id, {
          debit: type === 'DEBIT' ? effectiveAmount : 0,
          credit: type === 'CREDIT' ? effectiveAmount : 0,
          particular: remarks || ledgerEntry.particular,
          date: date ? new Date(date) : ledgerEntry.date,
        }, session);
      }
    } else if (amount !== undefined && amount !== advance.amount) {
      // Fallback: create if missing
      await LedgerController.recordLedgerEntry({
        employeeId: advance.employeeId,
        companyId: advance.companyId,
        date: date ? new Date(date) : advance.date,
        type: advance.type === 'given' ? 'DEBIT' : 'CREDIT',
        amount: amount,
        source: advance.type === 'repaid' ? 'manual' : 'advance',
        referenceId: advance._id,
        remarks: remarks || `Advance entry updated`
      }, session);
    }

    if (amount !== undefined && amount !== advance.amount) {
      const difference = amount - advance.amount;
      advance.amount = amount;
      advance.initialAmount = amount;
      advance.remainingBalance += difference;
    }

    if (remarks) advance.remarks = remarks;
    if (reason) advance.reason = reason;
    if (date) advance.date = new Date(date);

    await advance.save({ session });

    // 🔹 Recalculate all balances to ensure consistency after edit
    await syncEmployeeAdvanceBalance(advance.employeeId, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Advance updated successfully", data: advance });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all advances
exports.getAllAdvances = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "manager" && Array.isArray(req.user.branchIds)) {
      query.branchId = { $in: req.user.branchIds };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;

    let advanceQuery = Advance.find(query)
      .populate({
        path: "employeeId",
        select: "userid profileimage empId",
        populate: { path: "userid", select: "name" },
      })
      .sort({ date: -1, createdAt: -1 });

    let total = 0;
    let pages = 1;

    if (limit > 0) {
      total = await Advance.countDocuments(query);
      pages = Math.ceil(total / limit);
      advanceQuery = advanceQuery.skip((page - 1) * limit).limit(limit);
    }

    const advances = await advanceQuery;

    res.status(200).json({
      success: true,
      count: advances.length,
      data: advances,
      ...(limit > 0 ? { pagination: { page, limit, total, pages } } : {})
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// ❌ Delete advance (Soft delete or rollback logic)
exports.deleteAdvance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const advance = await Advance.findById(id).session(session);

    if (!advance) {
      throw new Error("Advance not found");
    }

    // 🔹 Delete linked Ledger Entry via accountingService, which shifts the
    // running balance of every later entry to compensate. (The previous
    // version did a raw Entry.deleteMany() here, which removes the entry
    // but leaves every later entry's running balance wrong - the same
    // class of bug as the editAdvance one above. It also only matched
    // source:'advance', but a 'repaid' advance's entry is recorded with
    // source:'manual' (see repayAdvanceManual below), so deleting a repaid
    // record never cleaned up its ledger entry at all.)
    const linkedEntry = await Entry.findOne({ referenceId: id }).session(session);
    if (linkedEntry) {
      await accountingService.deleteLedgerEntry(linkedEntry._id, session);
    }

    await advance.deleteOne({ session });

    // 🔹 Recalculate all balances to ensure consistency after delete
    await syncEmployeeAdvanceBalance(advance.employeeId, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Advance deleted and ledger adjusted" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: err.message });
  }
};
