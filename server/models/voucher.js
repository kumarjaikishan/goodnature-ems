const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  voucherNo: { type: String, unique: true, required: true },
  type: { type: String, enum: ['SALARY', 'LEAVE_DEDUCTION', 'LEAVE_ENCASHMENT', 'ADJUSTMENT', 'MANUAL'], required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  entries: [{
    accountName: { type: String, required: true }, // e.g. "Salary Expense", "Employee Payable"
    type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    amount: { type: Number, required: true },
  }],
  referenceType: { type: String, enum: ['PAYROLL', 'LEAVE', 'MANUAL', 'COMMISSION'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  remarks: { type: String }
}, { timestamps: true });

voucherSchema.index({ type: 1, voucherNo: -1 });
voucherSchema.index({ branchId: 1, type: 1 });
voucherSchema.index({ referenceId: 1, referenceType: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
