const LeaveBalance = require("../models/leavebalance");
const LeaveTransaction = require("../models/leaveTransaction");
const Employee = require("../models/employee");
const Company = require("../models/company");
const mongoose = require('mongoose');

// 🔄 Recalculate summary balance for one employee and policy
const recalculateLeaveBalances = async (employeeId, policyId, session = null) => {
  const txQuery = LeaveTransaction.find({ employeeId, policyId }).sort({ createdAt: 1 });
  if (session) txQuery.session(session);
  const transactions = await txQuery;

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

  const empQuery = Employee.findById(employeeId).select("branchId");
  if (session) empQuery.session(session);
  const emp = await empQuery;
  if (!emp) return;

  const updateQuery = LeaveBalance.findOneAndUpdate(
    { employeeId, policyId },
    {
      totalAllocated,
      used,
      remaining: totalAllocated - used,
      branchId: emp.branchId
    },
    { upsert: true, new: true }
  );
  if (session) updateQuery.session(session);
  await updateQuery;
};

const addleavebalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { employeeId, branchId, policyId, type, amount: rawAmount, remarks } = req.body;
    const amount = Number(rawAmount);

    if (isNaN(amount)) {
      throw new Error("Invalid amount provided");
    }

    if (!policyId) {
      throw new Error("Policy ID is required");
    }

    const currentBalance = await LeaveBalance.findOne({ employeeId, policyId }).session(session);
    const balanceBefore = currentBalance ? currentBalance.remaining : 0;

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

const getallleavebalnce = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "manager" && Array.isArray(req.user.branchIds)) {
      query.branchId = { $in: req.user.branchIds };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0;

    let balanceQuery = LeaveBalance.find(query)
      .populate({
        path: "employeeId",
        select: "userid",
        populate: { path: "userid", select: "name" },
      })
      .populate("policyId", "name")
      .sort({ createdAt: -1 });

    let total = 0;
    let pages = 1;

    if (limit > 0) {
      total = await LeaveBalance.countDocuments(query);
      pages = Math.ceil(total / limit);
      balanceQuery = balanceQuery.skip((page - 1) * limit).limit(limit);
    }

    const leaveBalances = await balanceQuery;

    res.status(200).json({
      count: leaveBalances.length,
      data: leaveBalances,
      ...(limit > 0 ? { pagination: { page, limit, total, pages } } : {})
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

const deleteleavebalance = async (req, res) => {
  try {
    const { id } = req.params;

    const summary = await LeaveBalance.findById(id);
    if (summary) {
      const { employeeId, policyId } = summary;
      
      await summary.deleteOne();
      await LeaveTransaction.deleteMany({ employeeId, policyId });

      return res.status(200).json({ 
        success: true, 
        message: "Leave summary and history deleted successfully" 
      });
    }

    const tx = await LeaveTransaction.findById(id);
    if (!tx) {
      return res.status(404).json({ success: false, message: "Record not found (Checked Balance and Transactions)" });
    }

    const { employeeId, policyId } = tx;
    await tx.deleteOne();

    await recalculateLeaveBalances(employeeId, policyId);

    res.status(200).json({ success: true, message: "Transaction deleted and balance recalculated" });
  } catch (err) {
    console.error("Error deleting leave record:", err.message);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

const getMyLeaveBalance = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: "Employee profile not found" });
        }

        const leaveBalances = await LeaveBalance.find({ employeeId })
            .populate("policyId", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(leaveBalances);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

const getMyLeaveTransactions = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: "Employee profile not found" });
        }

        const transactions = await LeaveTransaction.find({ employeeId })
            .populate("policyId", "name")
            .sort({ createdAt: -1 });
        
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

const updateleavebalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { type, amount: rawAmount, remarks } = req.body;
    const amount = Number(rawAmount);

    if (isNaN(amount)) {
      throw new Error("Invalid amount provided");
    }

    const summary = await LeaveBalance.findById(id).session(session);
    if (!summary) {
      return res.status(404).json({ success: false, message: "Leave balance record not found" });
    }

    const { employeeId, policyId } = summary;
    const balanceBefore = summary.remaining;

    const tx = await LeaveTransaction.create([{
      employeeId,
      policyId,
      type: type === "credit" ? "credit" : "debit",
      days: amount,
      balanceBefore,
      balanceAfter: type === "credit" ? balanceBefore + amount : balanceBefore - amount,
      source: 'manual',
      remarks: remarks || "Balance adjustment"
    }], { session });

    await session.commitTransaction();

    await recalculateLeaveBalances(employeeId, policyId);

    res.status(200).json({
      success: true,
      message: "Leave balance adjusted successfully",
      data: tx[0],
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error updating leave balance:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};

const bulkAddLeaveBalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { policyId, type, amount: rawAmount, remarks } = req.body;
    const amount = Number(rawAmount);

    if (isNaN(amount)) {
      throw new Error("Invalid amount provided");
    }

    if (!policyId) {
      throw new Error("Policy ID is required");
    }

    const Employee = require("../models/employee");
    const activeEmployees = await Employee.find({ status: { $ne: false } }).session(session);

    if (activeEmployees.length === 0) {
      return res.status(400).json({ success: false, message: "No active employees found" });
    }

    for (const emp of activeEmployees) {
      // Get current balance
      const currentBalance = await LeaveBalance.findOne({ employeeId: emp._id, policyId }).session(session);
      const balanceBefore = currentBalance ? currentBalance.remaining : 0;

      // Create Transaction
      await LeaveTransaction.create([{
        employeeId: emp._id,
        policyId,
        type: type === "credit" ? "credit" : "debit",
        days: amount,
        balanceBefore,
        balanceAfter: type === "credit" ? balanceBefore + amount : balanceBefore - amount,
        source: 'manual',
        remarks: remarks || "Bulk leave adjustment"
      }], { session });
    }

    await session.commitTransaction();

    // Recalculate summaries asynchronously
    for (const emp of activeEmployees) {
      recalculateLeaveBalances(emp._id, policyId).catch((err) =>
        console.error(`Error recalculating leave for employee ${emp._id}:`, err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: `Leave balance added to ${activeEmployees.length} employees successfully`,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in bulk add leave balance:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
    recalculateLeaveBalances,
    addleavebalance,
    getallleavebalnce,
    getLeaveTransactions,
    deleteleavebalance,
    getMyLeaveBalance,
    getMyLeaveTransactions,
    updateleavebalance,
    bulkAddLeaveBalance
};