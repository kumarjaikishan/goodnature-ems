const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
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

module.exports = mongoose.model('Leave', leaveSchema);
