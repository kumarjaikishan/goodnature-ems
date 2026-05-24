const mongoose = require("mongoose");
const Payroll = require("../models/payroll");
const Employee = require("../models/employee");
const Entry = require("../models/entry");
const Advance = require("../models/advance");
const LeaveBalance = require("../models/leavebalance");
const LeaveTransaction = require("../models/leaveTransaction");
const Voucher = require("../models/voucher");
const { recalculateLeaveBalances } = require("./leaveBalance");
const LedgerController = require("./ledger");
const AdvanceController = require("./advance");
const leaveService = require("../services/leaveService");
const accountingService = require("../services/accountingService");

const getMonthName = (m) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] || m;

const toUtcDateOnly = (input) => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

exports.createPayroll = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      employeeId,
      month,
      year,
      name,
      present = 0,
      leave = 0,
      absent = 0,
      options,
      basic,
      allowances = [],
      bonuses = [],
      deductions = [],
      taxRate = 0,
      issueDate,
    } = req.body;

    // 🔹 Check if payroll already exists for employee in given month & year
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year,
    }).session(session);

    if (existingPayroll) {
      throw new Error(
        `Payroll already exists for this employee in ${month}-${year}`
      );
    }

    // 🔹 Find employee
    const whichEmployee = await Employee.findById(employeeId)
      .populate("department", "department")
      .session(session);

    if (!whichEmployee) {
      throw new Error("Employee not found");
    }

    const {
      companyId,
      branchId,
      department,
      salary = 0,
      designation,
      profileimage,
      phone,
      email,
      address,
      guardian = { name: "", relation: "" },
    } = whichEmployee;

    // ---- Salary Computation ----
    const allowanceTotal = allowances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const bonusTotal = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const deductionTotal = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const grossSalary = Number(salary) + allowanceTotal + bonusTotal - deductionTotal;
    const taxAmount = (grossSalary * Number(taxRate || 0)) / 100;
    const netSalary = Math.round(grossSalary - taxAmount);

    if (isNaN(grossSalary) || isNaN(taxAmount) || isNaN(netSalary)) {
      throw new Error("Salary calculation resulted in NaN — check input data");
    }

    // 🔹 Create payroll
    const entryDate = toUtcDateOnly(issueDate || new Date());

    const payroll = new Payroll({
      companyId, branchId, employeeId, month, year, name, profileimage, phone, email, address, guardian,
      department: department?.department || "", designation, present, leave, absent,
      overtime: basic?.overtime, shortTime: basic?.shortmin, monthDays: basic?.totalDays,
      holidays: basic?.holidaysCount, weekOffs: basic?.weeklyOff, workingDays: basic?.workingDays,
      options, baseSalary: salary, allowances, bonuses, deductions, taxRate,
      status: "pending", grossSalary, taxAmount, netSalary,
      issueDate: entryDate
    });

    await payroll.save({ session });

    // 🔹 Handle leave adjustment
    if (options.adjustLeave && options.adjustedLeaveCount > 0) {
      const balances = await LeaveBalance.find({
        employeeId,
        companyId,
        remaining: { $gt: 0 }
      }).session(session);

      const totalAvailable = balances.reduce((sum, b) => sum + (b.remaining || 0), 0);

      if (options.adjustedLeaveCount > totalAvailable) {
        throw new Error("Adjusted Leave can't be more than available leaves");
      }

      let remainingToDeduct = options.adjustedLeaveCount;
      for (const bal of balances) {
        if (remainingToDeduct <= 0) break;
        const deductAmount = Math.min(bal.remaining, remainingToDeduct);

        const tx = new LeaveTransaction({
          employeeId,
          policyId: bal.policyId,
          type: "debit",
          days: deductAmount,
          balanceBefore: bal.remaining,
          balanceAfter: bal.remaining - deductAmount,
          source: "manual",
          referenceId: payroll._id,
          remarks: `Leave adjusted in Payroll ${month}-${year}`
        });
        await tx.save({ session });

        remainingToDeduct -= deductAmount;

        // Recalculate summary balance
        await recalculateLeaveBalances(employeeId, bal.policyId, session);
      }
    }

    // 🔹 Handle advance adjustment
    if (options.adjustAdvance && options.adjustedAdvance > 0) {
      const amountToAdjust = options.adjustedAdvance;

      // Fetch open advances (FIFO)
      const openAdvances = await Advance.find({
        employeeId,
        remainingBalance: { $gt: 0 },
        type: "given"
      }).sort({ date: 1, createdAt: 1 }).session(session);

      let remainingToAdjust = amountToAdjust;

      for (const adv of openAdvances) {
        if (remainingToAdjust <= 0) break;

        const deduction = Math.min(adv.remainingBalance, remainingToAdjust);
        adv.remainingBalance -= deduction;
        adv.status = adv.remainingBalance === 0 ? "closed" : "partially_paid";
        await adv.save({ session });

        remainingToAdjust -= deduction;
      }

      // Record in Ledger (CREDIT - Reduces the liability to pay salary)
      await accountingService.recordLedgerEntry({
        employeeId,
        companyId,
        date: entryDate,
        type: 'CREDIT',
        amount: amountToAdjust,
        source: 'adjustment',
        referenceId: payroll._id,
        remarks: `Advance adjusted in Payroll ${getMonthName(month)}-${year}`
      }, session);

      // 4. Create an 'adjusted' record in Advance collection for history visibility
      const adjustmentRecord = new Advance({
        employeeId,
        companyId,
        branchId,
        type: "adjusted",
        amount: amountToAdjust,
        remarks: `Deducted in Payroll ${getMonthName(month)}-${year}`,
        date: entryDate,
        payrollId: payroll._id,
        status: "closed" // History records are always closed
      });
      await adjustmentRecord.save({ session });
    }

    // 🔹 Handle Leave Adjustment against Advance
    // If leave quota exhausted, and policy is adjust against advance
    if (options.leaveExhaustedAdjustment === 'advance' && options.unpaidLeaveCost > 0) {
      const newAdvance = new Advance({
        employeeId,
        companyId,
        branchId,
        type: "given",
        amount: options.unpaidLeaveCost,
        initialAmount: options.unpaidLeaveCost,
        remainingBalance: options.unpaidLeaveCost,
        remarks: `Leave adjustment (quota exhausted) in Payroll ${getMonthName(month)}-${year}`,
        date: entryDate,
        status: "open",
        payrollId: payroll._id
      });
      await newAdvance.save({ session });

      await accountingService.recordLedgerEntry({
        employeeId,
        companyId,
        date: entryDate,
        type: 'DEBIT',
        amount: options.unpaidLeaveCost,
        source: 'advance',
        referenceId: newAdvance._id,
        remarks: `Advance created for leave adjustment (Payroll ${getMonthName(month)}-${year})`
      }, session);
    }

    // 🔹 Create Salary Voucher & Ledger Entry via AccountingService
    const salaryVoucherData = {
      companyId,
      branchId,
      type: 'SALARY',
      employeeId,
      date: entryDate,
      entries: [
        { accountName: 'Salary Expense', type: 'DEBIT', amount: grossSalary },
        { accountName: 'Employee Payable', type: 'CREDIT', amount: netSalary },
        // If there's tax/deductions, they should be separate entries that don't hit the employee ledger
        ...(taxAmount > 0 ? [{ accountName: 'Tax Payable', type: 'CREDIT', amount: taxAmount }] : []),
        ...(deductionTotal > 0 ? [{ accountName: 'Deductions Recovery', type: 'CREDIT', amount: deductionTotal }] : [])
      ],
      referenceType: 'PAYROLL',
      referenceId: payroll._id,
      remarks: `Salary Voucher for ${getMonthName(month)}-${year}`
    };

    const salaryVoucher = await accountingService.createVoucher(salaryVoucherData, session);



    // keeping record of salary voucher id in payroll entry
    payroll.voucherId = salaryVoucher._id;
    await payroll.save({ session });

    await whichEmployee.save({ session });
    
    // 🔹 Sync Advance Balances
    await AdvanceController.syncEmployeeAdvanceBalance(employeeId, session);

    // 🔹 Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Payroll Created",
      payroll,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in createPayroll:", error);
    return next({ status: 500, message: error.message });
  }
};

exports.editPayroll = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      employeeId, month, year, name, present = 0, leave = 0, absent = 0,
      options, basic, allowances = [], bonuses = [], deductions = [], taxRate = 0,
      issueDate
    } = req.body;

    const whichEmployee = await Employee.findById(employeeId)
      .populate("department", "department")
      .session(session);

    if (!whichEmployee) {
      throw new Error("Employee not found");
    }

    const {
      branchId,
      department,
      designation,
      profileimage,
      phone,
      email,
      address,
      guardian = { relation: "", name: "" },
    } = whichEmployee;

    // 🔹 Find payroll
    const payroll = await Payroll.findById(id).session(session);
    if (!payroll) throw new Error("Payroll not found");

    const postingDate = toUtcDateOnly(issueDate || payroll.issueDate || new Date());

    // 🔹 Calculate salary
    const salary = basic?.salary || payroll.baseSalary || 0;
    const allowanceTotal = allowances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const bonusTotal = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const deductionTotal = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const grossSalary = Number(salary) + allowanceTotal + bonusTotal - deductionTotal;
    const taxAmount = (grossSalary * Number(taxRate || 0)) / 100;
    const netSalary = Math.round(grossSalary - taxAmount);

    if (isNaN(grossSalary) || isNaN(taxAmount) || isNaN(netSalary)) {
      throw new Error("Salary calculation resulted in NaN — check input data");
    }

    // 🔹 Update payroll fields
    Object.assign(payroll, {
      employeeId, month, year, name, present, leave, absent, options, basic, allowances, bonuses, deductions, taxRate,
      grossSalary, taxAmount, netSalary, branchId,
      department: department?.department || "",
      designation, profileimage, phone, email, address, guardian,
      issueDate: postingDate
    });
    await payroll.save({ session });

    // 🔹 Handle leave adjustment rollback/sync
    const existingLeaveTx = await LeaveTransaction.find({ referenceId: payroll._id }).session(session);
    const previouslyAffectedPolicies = [...new Set(existingLeaveTx.map(tx => tx.policyId.toString()))];

    // Delete existing transactions
    await LeaveTransaction.deleteMany({ referenceId: payroll._id }).session(session);

    // Delete any old direct LeaveBalance records if they exist (backward compatibility)
    await LeaveBalance.deleteMany({ payrollId: payroll._id }).session(session);

    // Recalculate balances for previously affected policies to restore them first
    for (const policyId of previouslyAffectedPolicies) {
      await recalculateLeaveBalances(payroll.employeeId, policyId, session);
    }

    // Now apply new leave adjustments if requested
    if (options?.adjustLeave && options.adjustedLeaveCount > 0) {
      // Find all leave balances with remaining > 0 (reflecting the restored balances)
      const balances = await LeaveBalance.find({
        employeeId: payroll.employeeId,
        companyId: payroll.companyId,
        remaining: { $gt: 0 }
      }).session(session);

      const totalAvailable = balances.reduce((sum, b) => sum + (b.remaining || 0), 0);
      const adjusted = options.adjustedLeaveCount;
      if (adjusted > totalAvailable) {
        throw new Error("Adjusted Leave can't be more than available leaves");
      }

      let remainingToDeduct = adjusted;
      for (const bal of balances) {
        if (remainingToDeduct <= 0) break;
        const deductAmount = Math.min(bal.remaining, remainingToDeduct);

        const tx = new LeaveTransaction({
          employeeId: payroll.employeeId,
          policyId: bal.policyId,
          type: "debit",
          days: deductAmount,
          balanceBefore: bal.remaining,
          balanceAfter: bal.remaining - deductAmount,
          source: "manual",
          referenceId: payroll._id,
          remarks: `Leave adjusted in Payroll ${payroll.month}-${payroll.year}`
        });
        await tx.save({ session });

        remainingToDeduct -= deductAmount;

        // Recalculate summary balance
        await recalculateLeaveBalances(payroll.employeeId, bal.policyId, session);
      }
    }

    // 🔹 Handle advance adjustment
    if (options?.adjustAdvance !== undefined) {
      const oldAdjustment = payroll.options?.adjustedAdvance || 0;
      const newAdjustment = options.adjustedAdvance || 0;
      const difference = newAdjustment - oldAdjustment;

      if (difference > 0) {
        // Deduct more (FIFO)
        const openAdvances = await Advance.find({
          employeeId: payroll.employeeId,
          remainingBalance: { $gt: 0 },
          type: "given"
        }).sort({ date: 1, createdAt: 1 }).session(session);

        let remainingToAdjust = difference;
        for (const adv of openAdvances) {
          if (remainingToAdjust <= 0) break;
          const deduction = Math.min(adv.remainingBalance, remainingToAdjust);
          adv.remainingBalance -= deduction;
          adv.status = adv.remainingBalance === 0 ? "closed" : "partially_paid";
          await adv.save({ session });
          remainingToAdjust -= deduction;
        }
      } 
      
      // 🔹 Update the main adjustment entry directly to avoid "new entry" spam
      const mainAdjEntry = await Entry.findOne({ referenceId: payroll._id, source: 'adjustment' }).session(session);
      if (mainAdjEntry) {
        mainAdjEntry.credit = newAdjustment;
        mainAdjEntry.debit = 0;
        mainAdjEntry.particular = `Advance adjusted in Payroll ${getMonthName(payroll.month)}-${payroll.year} (Edited)`;
        await mainAdjEntry.save({ session });
      }

      // 🔹 Sync the 'adjusted' record in Advance collection for history visibility
      let adjustmentRecord = await Advance.findOne({
        payrollId: payroll._id,
        type: "adjusted"
      }).session(session);

      if (newAdjustment > 0) {
        if (adjustmentRecord) {
          adjustmentRecord.amount = newAdjustment;
          adjustmentRecord.remarks = `Deducted in Payroll ${getMonthName(payroll.month)}-${payroll.year} (Edited)`;
          await adjustmentRecord.save({ session });
        } else {
          adjustmentRecord = new Advance({
            employeeId: payroll.employeeId,
            companyId: payroll.companyId,
            branchId: payroll.branchId,
            type: "adjusted",
            amount: newAdjustment,
            remarks: `Deducted in Payroll ${getMonthName(payroll.month)}-${payroll.year} (Edited)`,
            date: new Date(),
            payrollId: payroll._id,
            status: "closed"
          });
          await adjustmentRecord.save({ session });
        }
      } else if (adjustmentRecord) {
        await adjustmentRecord.deleteOne({ session });
      }
    }
    
    // 🔹 Sync Salary Voucher (Accrual side)
    const voucher = await Voucher.findOne({ referenceId: payroll._id, referenceType: 'PAYROLL' }).session(session);
    if (voucher) {
      const newEntries = [
        { accountName: 'Salary Expense', type: 'DEBIT', amount: grossSalary },
        { accountName: 'Employee Payable', type: 'CREDIT', amount: netSalary },
        ...(taxAmount > 0 ? [{ accountName: 'Tax Payable', type: 'CREDIT', amount: taxAmount }] : []),
        ...(deductionTotal > 0 ? [{ accountName: 'Deductions Recovery', type: 'CREDIT', amount: deductionTotal }] : [])
      ];
      voucher.date = postingDate;
      await voucher.save({ session });
      await accountingService.syncSalaryVoucher(
        voucher._id, 
        newEntries, 
        `Salary Voucher for ${getMonthName(payroll.month)}-${payroll.year}`, 
        postingDate,
        session
      );
    }

    // Note: Net Salary Payout (Debit) is no longer automatically recorded during generation/edit.
    // This allows for separate payment tracking and avoids "duplicate" entries in history.
    
    // Ensure existing payout entries are removed if they exist to clean up history after the refactor
    await Entry.deleteMany({ referenceId: payroll._id, source: 'salary' }).session(session);
    payroll.ledgerEntryId = undefined;



    // 🔹 Sync Advance Balances
    await AdvanceController.syncEmployeeAdvanceBalance(payroll.employeeId, session);

    // 🔹 Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, payroll, message: 'Payroll Edited Successfully' });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    return next({ status: 500, message: error.message });
  }
};


exports.allPayroll = async (req, res, next) => {
  try {
    // 🔹 Find employee
    let payrolls;

    if (req.user.role == 'manager') {
      payrolls = await Payroll.find({ companyId: req.user.companyId, branchId: { $in: req.user.branchIds } })
        .select('branchId companyId department employeeId month year name status')
        .populate({
          path: "employeeId",
          select: "userid profileimage empId designation",
          populate: { path: "userid", select: "name", },
        })
    } else {
      payrolls = await Payroll.find({ companyId: req.user.companyId })
        .select('branchId companyId department employeeId month year name status')
        .populate({
          path: "employeeId",
          select: "userid profileimage empId designation",
          populate: { path: "userid", select: "name", },
        })
    }

    return res.status(201).json({ payrolls });
  } catch (error) {
    console.error(error);
    return next({ status: 500, message: error.message });
  }
};

exports.getPayroll = async (req, res, next) => {
  const { id } = req.params;
  try {
    const payroll = await Payroll.findById(id).populate("employeeId").populate("companyId");

    if (!payroll) {
      return next({ status: 404, message: "Payroll not found" });
    }

    // Manager role restriction
    if (req.user.role === "manager") {
      if (!req.user.branchIds.includes(payroll?.branchId?.toString())) {
        return next({ status: 403, message: "You are not authorized" });
      }
    }

    return res.status(200).json({ payroll });
  } catch (error) {
    console.error(error);
    return next({ status: 500, message: "Internal Server Error" });
  }
};

exports.deletePayroll = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id).session(session);
    if (!payroll) {
      return next({ status: 404, message: "Payroll not found" });
    }

    // 1. Find all ledger entries for this payroll and delete them with balance propagation
    const entries = await Entry.find({ referenceId: payroll._id }).session(session);
    for (const entry of entries) {
      await accountingService.deleteLedgerEntry(entry._id, session);
    }

    // 2. Rollback Advance adjustments
    await Advance.deleteMany({ payrollId: payroll._id, type: "adjusted" }).session(session);
    
    // 3. Delete linked advance if it was created from leave adjustment
    const leaveToAdvance = await Advance.findOne({ payrollId: payroll._id, type: "given" }).session(session);
    if (leaveToAdvance) {
      await leaveToAdvance.deleteOne({ session });
    }

    // 4. Delete linked leave adjustment transactions if exists
    const leaveTransactions = await LeaveTransaction.find({ referenceId: payroll._id }).session(session);
    const affectedPolicies = [...new Set(leaveTransactions.map(tx => tx.policyId.toString()))];
    
    await LeaveTransaction.deleteMany({ referenceId: payroll._id }).session(session);
    
    // Also delete any direct LeaveBalance summary entries if they were wrongly created previously (backward compatibility)
    await LeaveBalance.deleteMany({ payrollId: payroll._id }).session(session);

    // Recalculate balances for all affected policies
    for (const policyId of affectedPolicies) {
      await recalculateLeaveBalances(payroll.employeeId, policyId, session);
    }

    // 5. Delete associated Salary Voucher
    await Voucher.deleteOne({ referenceId: payroll._id, referenceType: 'PAYROLL' }).session(session);

    // 6. Delete payroll
    await payroll.deleteOne({ session });

    // 6. Sync Advance Balances
    await AdvanceController.syncEmployeeAdvanceBalance(payroll.employeeId, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, message: "Payroll deleted and ledger reversed successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next({ status: 500, message: error.message });
  }
};


