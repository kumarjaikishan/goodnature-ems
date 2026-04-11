const LeaveBalance = require("../models/leavebalance");
const LeaveTransaction = require("../models/leaveTransaction");
const Employee = require("../models/employee");
const Company = require("../models/company");
const mongoose = require('mongoose');

// 🔄 Recalculate summary balance for one employee and policy
const recalculateLeaveBalances = async (employeeId, policyId) => {
  const transactions = await LeaveTransaction.find({ employeeId, policyId })
    .sort({ createdAt: 1 });

  let totalAllocated = 0;
  let used = 0;

  for (let tx of transactions) {
    if (tx.type === "credit") {
      totalAllocated += Number(tx.days);
    } else if (tx.type === "debit") {
      used += Number(tx.days);
    } else if (tx.type === "adjustment") {
      totalAllocated += Number(tx.days);
    }
  }

  // Update or Create LeaveBalance summary
  // We fetch employee details to ensure companyId and branchId are present if it's a new record
  const emp = await Employee.findById(employeeId).select("companyId branchId");
  if (!emp) return;

  await LeaveBalance.findOneAndUpdate(
    { employeeId, policyId },
    {
      totalAllocated,
      used,
      remaining: totalAllocated - used,
      companyId: emp.companyId,
      branchId: emp.branchId
    },
    { upsert: true, new: true }
  );
};

// ➕ Add new leave balance (Manual Adjustment/Credit)
const addleavebalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { employeeId, companyId, branchId, policyId, type, amount: rawAmount, remarks } = req.body;
    const amount = Number(rawAmount);

    if (isNaN(amount)) {
      throw new Error("Invalid amount provided");
    }

    if (!policyId) {
      throw new Error("Policy ID is required");
    }

    // Get current balance
    const currentBalance = await LeaveBalance.findOne({ employeeId, policyId }).session(session);
    const balanceBefore = currentBalance ? currentBalance.remaining : 0;

    // Create Transaction
    const tx = await LeaveTransaction.create([{
      employeeId,
      policyId,
      type: type === "credit" ? "credit" : "debit",
      days: amount,
      balanceBefore,
      balanceAfter: type === "credit" ? balanceBefore + amount : balanceBefore - amount,
      source: 'manual',
      remarks
    }], { session });

    await session.commitTransaction();

    // Recalculate summary (async)
    await recalculateLeaveBalances(employeeId, policyId);

    res.status(201).json({
      success: true,
      message: "Leave balance adjustment recorded",
      data: tx[0],
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error adding leave balance:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};

// 📑 Get all leave balance summaries
const getallleavebalnce = async (req, res) => {
  try {
    const query = { companyId: req.user.companyId };
    if (req.user.role === "manager") {
      query.branchId = { $in: req.user.branchIds };
    }

    const leaveBalances = await LeaveBalance.find(query)
      .populate({
        path: "employeeId",
        select: "userid",
        populate: { path: "userid", select: "name" },
      })
      .populate("policyId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: leaveBalances.length,
      data: leaveBalances,
    });
  } catch (err) {
    console.error("Error fetching leave balances:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// 📑 Get leave transactions (audit log) for an employee
const getLeaveTransactions = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const transactions = await LeaveTransaction.find({ employeeId })
            .populate("policyId", "name")
            .sort({ createdAt: -1 });
        
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// ❌ Delete leave summary (Cleanup) or specific Transaction
const deleteleavebalance = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Try finding it as a Summary (LeaveBalance) first (Since that's what the main table uses)
    const summary = await LeaveBalance.findById(id);
    if (summary) {
      const { employeeId, policyId } = summary;
      
      // Delete the summary record
      await summary.deleteOne();
      
      // Also delete all manual/allocation transactions for this employee/policy 
      // (Leave transactions from LeaveRequests are usually kept unless the request is deleted)
      // To keep it clean, we delete transactions associated with this summary
      await LeaveTransaction.deleteMany({ employeeId, policyId });

      return res.status(200).json({ 
        success: true, 
        message: "Leave summary and history deleted successfully" 
      });
    }

    // 2. If not found in Summary, try finding it as a specific Transaction (LeaveTransaction)
    const tx = await LeaveTransaction.findById(id);
    if (!tx) {
      return res.status(404).json({ success: false, message: "Record not found (Checked Balance and Transactions)" });
    }

    const { employeeId, policyId } = tx;
    await tx.deleteOne();

    // Recalculate summary after deleting a single transaction
    await recalculateLeaveBalances(employeeId, policyId);

    res.status(200).json({ success: true, message: "Transaction deleted and balance recalculated" });
  } catch (err) {
    console.error("Error deleting leave record:", err.message);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// 📑 Get MY leave balance (For Employee)
const getMyLeaveBalance = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: "Employee profile not found" });
        }

        // Check if allowed by admin
        const company = await Company.findById(req.user.companyId);
        if (!company?.leaveSettings?.allowEmployeeToSeeLedger) {
            return res.status(403).json({ success: false, message: "Leave ledger visibility is disabled by administrator" });
        }

        const leaveBalances = await LeaveBalance.find({ employeeId })
            .populate("policyId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(leaveBalances);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// 📑 Get MY leave transactions (For Employee)
const getMyLeaveTransactions = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: "Employee profile not found" });
        }

        // Check if allowed by admin
        const company = await Company.findById(req.user.companyId);
        if (!company?.leaveSettings?.allowEmployeeToSeeLedger) {
            return res.status(403).json({ success: false, message: "Leave ledger history visibility is disabled by administrator" });
        }

        const transactions = await LeaveTransaction.find({ employeeId })
            .populate("policyId", "name")
            .sort({ createdAt: -1 });
        
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

module.exports = {
    recalculateLeaveBalances,
    addleavebalance,
    getallleavebalnce,
    getLeaveTransactions,
    deleteleavebalance,
    getMyLeaveBalance,
    getMyLeaveTransactions
};