const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true },
  date: { type: Date, required: true },
  particular: String,
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  balance: Number,
  source: { type: String, enum: ['ledger', 'salary', 'advance', 'adjustment', 'manual', 'payroll'], default: 'ledger' },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // Link to Advance, Payroll, etc.
  status: { type: String, enum: ['active', 'reversed'], default: 'active' },
  reversalReference: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry' }
}, { timestamps: true });

// Support "latest entry per ledger" lookups (ledger balance) without a full scan
entrySchema.index({ ledgerId: 1, date: -1, createdAt: -1 });

module.exports = mongoose.model('Entry', entrySchema);
