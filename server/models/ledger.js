const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // Optional for custom ledgers
  empId: { type: String }, // Human readable ID for employee ledgers
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  profileImage: { type: String },
  ledgerType: { type: String, enum: ['employee', 'custom'], default: 'custom' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Creator/Owner
  // Summary field for quick access
  advance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
