const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true },
  policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeavePolicy', required: true },
  type: { type: String },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  duration: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
}, { timestamps: true });

leaveSchema.index({ createdAt: -1 });
leaveSchema.index({ branchId: 1, createdAt: -1 });
leaveSchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
