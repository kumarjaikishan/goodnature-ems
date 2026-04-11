const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  allocationType: { type: String, enum: ['monthly', 'yearly'], required: true },
  totalLeaves: { type: Number, required: true },
  carryForward: {
    enabled: { type: Boolean, default: false },
    maxLimit: { type: Number, default: 0 }
  },
  encashable: { type: Boolean, default: false },
  probationRule: {
    allowed: { type: Boolean, default: false },
    afterDays: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
