const mongoose = require("mongoose");
const Payroll = require("../models/payroll");
const Employee = require("../models/employee");
const Entry = require("../models/entry");
const Advance = require("../models/advance");
const LeaveBalance = require("../models/leavebalance");
const { recalculateLeaveBalances } = require("./leaveBalance");
const LedgerController = require("./ledger");
const leaveService = require("../services/leaveService");
const accountingService = require("../services/accountingService");
const AdvanceController = require("./advance");

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
    const netSalary = grossSalary - taxAmount;

    if (isNaN(grossSalary) || isNaN(taxAmount) || isNaN(netSalary)) {
      throw new Error("Salary calculation resulted in NaN — check input data");
    }

    // 🔹 Create payroll
    const payroll = new Payroll({
      companyId, branchId, employeeId, month, year, name, profileimage, phone, email, address, guardian,
      department: department?.department || "", designation, present, leave, absent,
      overtime: basic?.overtime, shortTime: basic?.shortmin, monthDays: basic?.totalDays,
      holidays: basic?.holidaysCount, weekOffs: basic?.weeklyOff, workingDays: basic?.workingDays,
      options, baseSalary: salary, allowances, bonuses, deductions, taxRate,
      status: "pending", grossSalary, taxAmount, netSalary
    });

    await payroll.save({ session });

    // 🔹 Handle leave adjustment
    if (options.adjustLeave && options.adjustedLeaveCount > 0) {
      const latestLeave = await LeaveBalance.findOne({
        employeeId,
        companyId,
      })
        .sort({ date: -1, createdAt: -1 })
        .session(session);

      const availableLeaves = latestLeave?.balance || 0;

      if (options.adjustedLeaveCount > availableLeaves) {
        throw new Error("Adjusted Leave can't be more than available leaves");
      }

      const newBalance = availableLeaves - options.adjustedLeaveCount;

      await LeaveBalance.create(
        [
          {
            employeeId,
            companyId,
            branchId,
            type: "debit",
            period: `${month}-${year}`,
            balance: newBalance,
            amount: options.adjustedLeaveCount,
            remarks: `Leave adjusted in Payroll ${month}-${year}`,
            payrollId: payroll._id,
            date: new Date().setHours(0, 0, 0, 0),
          },
        ],
        { session }
      );

      await recalculateLeaveBalances(employeeId, companyId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDate = new Date(today);

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

      // Record in Ledger (DEBIT - Reduces the liability to pay salary)
      await LedgerController.recordLedgerEntry({
        employeeId,
        companyId,
        date: entryDate,
        type: 'CREDIT',
        amount: amountToAdjust,
        source: 'adjustment',
        referenceId: payroll._id,
        remarks: `Advance adjusted in Payroll ${month}-${year}`
      }, session);

      // 4. Create an 'adjusted' record in Advance collection for history visibility
      const adjustmentRecord = new Advance({
        employeeId,
        companyId,
        branchId,
        type: "adjusted",
        amount: amountToAdjust,
        remarks: `Deducted in Payroll ${month}-${year}`,
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
        remarks: `Leave adjustment (quota exhausted) in Payroll ${month}-${year}`,
        date: entryDate,
        status: "open",
        payrollId: payroll._id
      });
      await newAdvance.save({ session });

      await LedgerController.recordLedgerEntry({
        employeeId,
        companyId,
        date: entryDate,
        type: 'DEBIT',
        amount: options.unpaidLeaveCost,
        source: 'advance',
        referenceId: newAdvance._id,
        remarks: `Advance created for leave adjustment (Payroll ${month}-${year})`
      }, session);
    }

    // 🔹 Create Salary Voucher & Ledger Entry via AccountingService
    const salaryVoucherData = {
      companyId,
      branchId,
      type: 'SALARY',
      employeeId,
      entries: [
        { accountName: 'Salary Expense', type: 'DEBIT', amount: grossSalary },
        { accountName: 'Employee Payable', type: 'CREDIT', amount: netSalary },
        // If there's tax/deductions, they should be separate entries that don't hit the employee ledger
        ...(taxAmount > 0 ? [{ accountName: 'Tax Payable', type: 'CREDIT', amount: taxAmount }] : []),
        ...(deductionTotal > 0 ? [{ accountName: 'Deductions Recovery', type: 'CREDIT', amount: deductionTotal }] : [])
      ],
      referenceType: 'PAYROLL',
      referenceId: payroll._id,
      remarks: `Salary Voucher for ${month}-${year}`
    };

    const salaryVoucher = await accountingService.createVoucher(salaryVoucherData, session);

    // 🔹 Handle Leave Deduction Voucher if there are unpaid leaves
    // (Assuming unpaid leaves are calculated and passed or detected here)
    // For this demonstration, if deductions include something like "Unpaid Leave", we create a voucher
    const leaveDeduction = deductions.find(d => d.name.toLowerCase().includes('leave') || d.name.toLowerCase().includes('absent'));
    if (leaveDeduction && leaveDeduction.amount > 0) {
      await accountingService.createVoucher({
        companyId,
        branchId,
        type: 'LEAVE_DEDUCTION',
        employeeId,
        entries: [
          { accountName: 'Employee Payable', type: 'DEBIT', amount: leaveDeduction.amount },
          { accountName: 'Leave Deduction Account', type: 'CREDIT', amount: leaveDeduction.amount }
        ],
        referenceType: 'PAYROLL',
        referenceId: payroll._id,
        remarks: `Leave Deduction Voucher for ${month}-${year}`
      }, session);
    }

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
      options, basic, allowances = [], bonuses = [], deductions = [], taxRate = 0
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

    // 🔹 Calculate salary
    const salary = basic?.salary || payroll.baseSalary || 0;
    const allowanceTotal = allowances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const bonusTotal = bonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const deductionTotal = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const grossSalary = Number(salary) + allowanceTotal + bonusTotal - deductionTotal;
    const taxAmount = (grossSalary * Number(taxRate || 0)) / 100;
    const netSalary = grossSalary - taxAmount;

    if (isNaN(grossSalary) || isNaN(taxAmount) || isNaN(netSalary)) {
      throw new Error("Salary calculation resulted in NaN — check input data");
    }

    // 🔹 Update payroll fields
    Object.assign(payroll, {
      employeeId, month, year, name, present, leave, absent, options, basic, allowances, bonuses, deductions, taxRate,
      grossSalary, taxAmount, netSalary, branchId,
      department: department?.department || "",
      designation, profileimage, phone, email, address, guardian,
    });
    await payroll.save({ session });

    // 🔹 Handle leave adjustment
    let leaveAdjustment = await LeaveBalance.findOne({ payrollId: payroll._id }).session(session);

    if (options?.adjustLeave && options.adjustedLeaveCount > 0) {
      const latestLeave = await LeaveBalance.findOne({
        employeeId: payroll.employeeId,
        companyId: payroll.companyId,
        _id: { $ne: leaveAdjustment?._id }
      }).sort({ date: -1, createdAt: -1 }).session(session);

      const availableLeaves = latestLeave?.balance || 0;
      const adjusted = options.adjustedLeaveCount;
      if (adjusted > availableLeaves) throw new Error("Adjusted Leave can't be more than available leaves");
      const newBalance = availableLeaves - adjusted;

      if (leaveAdjustment) {
        leaveAdjustment.amount = adjusted;
        leaveAdjustment.balance = newBalance;
        leaveAdjustment.remarks = `Leave adjusted in Payroll ${payroll.month}-${payroll.year}`;
        leaveAdjustment.date = new Date().setHours(0, 0, 0, 0);
        await leaveAdjustment.save({ session });
      } else {
        leaveAdjustment = new LeaveBalance({
          employeeId: payroll.employeeId,
          companyId: payroll.companyId,
          branchId: payroll.branchId,
          type: "debit",
          amount: adjusted,
          balance: newBalance,
          remarks: `Leave adjusted in Payroll ${payroll.month}-${payroll.year}`,
          payrollId: payroll._id,
          date: new Date().setHours(0, 0, 0, 0),
        });
        await leaveAdjustment.save({ session });
      }
      await recalculateLeaveBalances(payroll.employeeId, payroll.companyId);
    } else if (leaveAdjustment) {
      await leaveAdjustment.deleteOne({ session });
      await recalculateLeaveBalances(payroll.employeeId, payroll.companyId);
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
        mainAdjEntry.particular = `Advance adjusted in Payroll ${payroll.month}-${payroll.year} (Edited)`;
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
          adjustmentRecord.remarks = `Deducted in Payroll ${payroll.month}-${payroll.year} (Edited)`;
          await adjustmentRecord.save({ session });
        } else {
          adjustmentRecord = new Advance({
            employeeId: payroll.employeeId,
            companyId: payroll.companyId,
            branchId: payroll.branchId,
            type: "adjusted",
            amount: newAdjustment,
            remarks: `Deducted in Payroll ${payroll.month}-${payroll.year} (Edited)`,
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
    if (payroll.voucherId) {
      await accountingService.syncSalaryVoucher(payroll.voucherId, grossSalary, session);
    }

    // Note: Net Salary Payout (Debit) is no longer automatically recorded during generation/edit.
    // This allows for separate payment tracking and avoids "duplicate" entries in history.
    
    // Ensure existing payout entries are removed if they exist to clean up history after the refactor
    await Entry.deleteMany({ referenceId: payroll._id, source: 'salary' }).session(session);
    payroll.ledgerEntryId = undefined;


    await LedgerController.recalculateBalances(whichEmployee.ledgerId, req.user.id);

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
    const payroll = await Payroll.findById(id);

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

    // 🔹 Rollback Advance adjustments
    // Find all advances that were potentially modified by this payroll
    // (In our new system, we don't have a direct link from Advance to Payroll adjustment except for the 'repaid' records or finding what was deducted)
    // Actually, finding the Ledger entry for adjustment is the best way to know the amount.
    const ledgerEntry = await Entry.findOne({
      referenceId: payroll._id,
      source: 'adjustment'
    }).session(session);

    if (ledgerEntry) {
      // 🔹 Record rollback in ledger for audit
      await LedgerController.recordLedgerEntry({
        employeeId: payroll.employeeId,
        companyId: payroll.companyId,
        type: 'CREDIT', // Reversing the deduction DEBIT
        amount: ledgerEntry.amount,
        source: 'adjustment',
        referenceId: payroll._id,
        remarks: `Rollback: Advance adjustment from deleted Payroll ${payroll.month}-${payroll.year}`
      }, session);

      // 🔹 Delete the 'adjusted' history record record
      // Calling syncEmployeeAdvanceBalance later will auto-restore the 'remainingBalance' on 'given' records
      await Advance.deleteMany({ payrollId: payroll._id, type: "adjusted" }).session(session);
    }

    // 🔹 Delete linked advance if it was created from leave adjustment
    const leaveToAdvance = await Advance.findOne({ payrollId: payroll._id, type: "given" }).session(session);
    if (leaveToAdvance) {
      // Reverse ledger entry
      await LedgerController.recordLedgerEntry({
        employeeId: payroll.employeeId,
        companyId: payroll.companyId,
        type: 'CREDIT',
        amount: leaveToAdvance.amount,
        source: 'adjustment',
        remarks: `Rollback: Leave-to-Advance from deleted Payroll ${payroll.month}-${payroll.year}`
      }, session);
      await leaveToAdvance.deleteOne({ session });
    }

    // 🔹 Delete linked leave adjustment if exists
    await LeaveBalance.deleteOne({ payrollId: payroll._id }).session(session);

    // 🔹 Delete payroll entry from Ledger (Salary Entry)
    await LedgerController.recordLedgerEntry({
      employeeId: payroll.employeeId,
      companyId: payroll.companyId,
      type: 'CREDIT', // Reversing the salary payout DEBIT
      amount: payroll.netSalary,
      source: 'salary',
      remarks: `Rollback: Net Salary from deleted Payroll ${payroll.month}-${payroll.year}`
    }, session);

    // 🔹 Delete payroll
    await payroll.deleteOne({ session });

    // 🔹 Sync Advance Balances
    await AdvanceController.syncEmployeeAdvanceBalance(payroll.employeeId, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, message: "Payroll deleted and ledger adjusted" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next({ status: 500, message: error.message });
  }
};


