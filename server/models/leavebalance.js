const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employee", required: true },
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: "LeavePolicy", required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  totalAllocated: { type: Number, default: 0 },
  used: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure unique index per employee and policy
leaveBalanceSchema.index({ employeeId: 1, policyId: 1 }, { unique: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
