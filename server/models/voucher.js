const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  voucherNo: { type: String, unique: true, required: true },
  type: { type: String, enum: ['SALARY', 'LEAVE_DEDUCTION', 'LEAVE_ENCASHMENT', 'ADJUSTMENT'], required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
  date: { type: Date, default: Date.now },
  entries: [{
    accountName: { type: String, required: true }, // e.g. "Salary Expense", "Employee Payable"
    type: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    amount: { type: Number, required: true },
  }],
  referenceType: { type: String, enum: ['PAYROLL', 'LEAVE', 'MANUAL'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
