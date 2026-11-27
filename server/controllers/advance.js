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

const calculateAdvanceInterest = (principal, rate, interestType, installments) => {
  const p = Number(principal) || 0;
  const r = Number(rate) || 0;
  const inst = Math.max(1, Number(installments) || 1);
  if (p <= 0 || r <= 0 || !interestType || interestType === 'none') return 0;
  if (interestType === 'yearly') return Math.round(p * (r / 100) * (inst / 12));
  if (interestType === 'monthly') return Math.round(p * (r / 100) * inst);
  if (interestType === 'flat') return Math.round(p * (r / 100));
  return 0;
};

exports.syncEmployeeAdvanceBalance = syncEmployeeAdvanceBalance;

// Add new advance
exports.addAdvance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      employeeId,
      branchId,
      amount,
      principalAmount,
      interestRate,
      interestType,
      type = "given",
      remarks,
      reason,
      date,
      monthlyDeductionAmount,
      installments,
      deductionStartMonth
    } = req.body;
    const amountNum = Number(amount) || 0;
    const installNum = Math.max(1, Number(installments) || 1);
    const principalNum = type === "given"
      ? (Number(principalAmount) > 0 ? Number(principalAmount) : amountNum)
      : amountNum;
    const rateNum = type === "given" ? (Number(interestRate) || 0) : 0;
    const effInterestType = (type === "given" && rateNum > 0)
      ? (interestType && interestType !== 'none' ? interestType : 'yearly')
      : 'none';
    const interestAmt = type === "given"
      ? calculateAdvanceInterest(principalNum, rateNum, effInterestType, installNum)
      : 0;
    const totalAmount = type === "given" ? (principalNum + interestAmt) : amountNum;
    const monthlyDedNum = Number(monthlyDeductionAmount) || 0;

    const advanceDate = date ? new Date(date) : new Date();
    advanceDate.setHours(0, 0, 0, 0);

    const startMonthDate = deductionStartMonth ? new Date(deductionStartMonth) : advanceDate;

    // 1. Create the Advance Record
    const newAdvance = new Advance({
      employeeId,
      branchId,
      type,
      amount: totalAmount,
      principalAmount: type === "given" ? principalNum : 0,
      interestRate: rateNum,
      interestType: effInterestType,
      interestAmount: interestAmt,
      initialAmount: type === "given" ? totalAmount : 0,
      remainingBalance: type === "given" ? totalAmount : 0,
      monthlyDeductionAmount: type === "given" ? (monthlyDedNum > 0 ? monthlyDedNum : Math.ceil(totalAmount / installNum)) : 0,
      installments: type === "given" ? installNum : 1,
      deductionStartMonth: type === "given" ? startMonthDate : null,
      remarks,
      reason,
      date: advanceDate,
      status: type === "given" ? "open" : "closed"
    });

    await newAdvance.save({ session });

    // 2. If it's an adjustment/repayment, apply FIFO deduction to existing advances
    if (type === "adjusted" || type === "repaid") {
      let remainingToAdjust = totalAmount;
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

    const interestLabel = interestAmt > 0
      ? ` + Interest ₹${interestAmt} (${rateNum}% ${effInterestType})`
      : '';

    // 3. Create Ledger Entry for General Accounting (DEBIT - Reduces payable/Increases debt)
    await accountingService.recordLedgerEntry({
      employeeId,
      companyId: req.user?.companyId,
      date: advanceDate,
      type: type === "given" ? 'DEBIT' : 'CREDIT',
      amount: totalAmount,
      source: 'advance',
      referenceId: newAdvance._id,
      remarks: remarks || `${type === 'given' ? `Advance granted (₹${principalNum}${interestLabel}, EMI: ₹${newAdvance.monthlyDeductionAmount}/mo)` : 'Advance adjustment'}: ${reason || 'No reason'}`
    }, session);

    // 4. Synchronize Running Balances and Employee Summary
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
    await accountingService.recordLedgerEntry({
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
    const {
      amount,
      principalAmount,
      interestRate,
      interestType,
      remarks,
      reason,
      date,
      monthlyDeductionAmount,
      installments,
      deductionStartMonth
    } = req.body;

    const advance = await Advance.findById(id).session(session);
    if (!advance) {
      throw new Error("Advance not found");
    }

    if (advance.type === 'adjusted' && advance.payrollId) {
      throw new Error("Payroll-adjusted advances cannot be edited from here. Please edit the corresponding Payroll instead.");
    }

    const effInstallments = installments !== undefined ? Math.max(1, Number(installments) || 1) : (advance.installments || 1);
    let effectiveNewAmount = amount !== undefined ? Number(amount) || 0 : advance.amount;

    if (advance.type === 'given') {
      const principalNum = principalAmount !== undefined
        ? (Number(principalAmount) || 0)
        : (amount !== undefined ? (Number(amount) || 0) : (advance.principalAmount || advance.amount));
      const rateNum = interestRate !== undefined ? (Number(interestRate) || 0) : (advance.interestRate || 0);
      const effInterestType = rateNum > 0
        ? (interestType && interestType !== 'none'
          ? interestType
          : (advance.interestType && advance.interestType !== 'none' ? advance.interestType : 'yearly'))
        : 'none';
      const interestAmt = calculateAdvanceInterest(principalNum, rateNum, effInterestType, effInstallments);

      advance.principalAmount = principalNum;
      advance.interestRate = rateNum;
      advance.interestType = effInterestType;
      advance.interestAmount = interestAmt;
      effectiveNewAmount = principalNum + interestAmt;
    }

    // 🔹 Synchronize with Ledger via accountingService, which properly
    // shifts the running balance of this entry AND every entry after it.
    const ledgerEntry = await Entry.findOne({ referenceId: advance._id }).session(session);

    if (ledgerEntry) {
      const amountChanged = effectiveNewAmount !== advance.amount;
      if (amountChanged || date || remarks) {
        const type = (advance.type === 'given' ? 'DEBIT' : 'CREDIT');
        const effectiveAmount = amountChanged ? effectiveNewAmount : (ledgerEntry.debit || ledgerEntry.credit);
        await accountingService.updateLedgerEntry(ledgerEntry._id, {
          debit: type === 'DEBIT' ? effectiveAmount : 0,
          credit: type === 'CREDIT' ? effectiveAmount : 0,
          particular: remarks || ledgerEntry.particular,
          date: date ? new Date(date) : ledgerEntry.date,
        }, session);
      }
    } else if (effectiveNewAmount !== advance.amount) {
      // Fallback: create if missing
      await accountingService.recordLedgerEntry({
        employeeId: advance.employeeId,
        companyId: advance.companyId,
        date: date ? new Date(date) : advance.date,
        type: advance.type === 'given' ? 'DEBIT' : 'CREDIT',
        amount: effectiveNewAmount,
        source: advance.type === 'repaid' ? 'manual' : 'advance',
        referenceId: advance._id,
        remarks: remarks || `Advance entry updated`
      }, session);
    }

    if (monthlyDeductionAmount !== undefined) {
      advance.monthlyDeductionAmount = Number(monthlyDeductionAmount) || 0;
    }
    if (installments !== undefined) {
      advance.installments = effInstallments;
    }
    if (deductionStartMonth !== undefined) {
      advance.deductionStartMonth = deductionStartMonth ? new Date(deductionStartMonth) : null;
    }

    if (effectiveNewAmount !== advance.amount) {
      if (advance.type === 'given') {
        const previousInitial = Number(advance.initialAmount ?? advance.amount) || 0;
        const alreadyRecovered = Math.max(0, previousInitial - (Number(advance.remainingBalance) || 0));
        if (effectiveNewAmount < alreadyRecovered) {
          throw new Error(`Cannot reduce advance to ₹${effectiveNewAmount} because ₹${alreadyRecovered} has already been recovered.`);
        }
        advance.amount = effectiveNewAmount;
        advance.initialAmount = effectiveNewAmount;
        advance.remainingBalance = effectiveNewAmount - alreadyRecovered;
      } else {
        advance.amount = effectiveNewAmount;
      }
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

// 🔹 Get active advances and recommended EMI for an employee (Used in Payroll Creation)
exports.getEmployeeActiveAdvance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const month = Number(req.query.month);
    const year = Number(req.query.year);
    const periodEnd = (month >= 1 && month <= 12 && year >= 2000)
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : null;

    const openAdvances = await Advance.find({
      employeeId,
      remainingBalance: { $gt: 0 },
      type: "given"
    }).sort({ date: 1, createdAt: 1 });

    const totalRemaining = openAdvances.reduce((sum, a) => sum + (a.remainingBalance || 0), 0);

    // Filter out advances scheduled to start in a future payroll month
    const dueAdvances = periodEnd
      ? openAdvances.filter(a => !a.deductionStartMonth || new Date(a.deductionStartMonth) <= periodEnd)
      : openAdvances;

    // Sum of scheduled monthly EMIs across due active advances (or the remaining balance if less)
    const suggestedMonthlyEMI = dueAdvances.reduce((sum, a) => {
      const emi = a.monthlyDeductionAmount > 0 ? a.monthlyDeductionAmount : a.remainingBalance;
      return sum + Math.min(emi, a.remainingBalance);
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        employeeId,
        totalRemainingBalance: totalRemaining,
        suggestedMonthlyDeduction: suggestedMonthlyEMI,
        activeAdvancesCount: openAdvances.length,
        dueAdvancesCount: dueAdvances.length,
        openAdvances
      }
    });
  } catch (err) {
    console.error("Error fetching employee active advance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
