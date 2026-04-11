const mongoose = require('mongoose');

const leaveTransactionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true },
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeavePolicy' },
  type: { type: String, enum: ['credit', 'debit', 'adjustment'], required: true },
  days: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  source: { type: String, enum: ['allocation', 'approval', 'manual', 'reset'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // e.g. LeaveRequest ID or Policy ID
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LeaveTransaction', leaveTransactionSchema);
