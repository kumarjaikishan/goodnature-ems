const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // Optional for custom/sponsor ledgers
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For sponsor ledgers
  empId: { type: String }, // Human readable ID for employee ledgers or sponsorCode
  name: { type: String, required: true },
  profileImage: { type: String },
  ledgerType: { type: String, enum: ['employee', 'custom', 'sponsor'], default: 'custom' },
  isVoucherLedger: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Creator/Owner
  // Summary field for quick access
  advance: { type: Number, default: 0 }
}, { timestamps: true });

ledgerSchema.index({ employeeId: 1 });
ledgerSchema.index({ sponsorId: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
