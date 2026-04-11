const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  profileImage: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Creator/Owner
  // Summary field for quick access
  advance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
