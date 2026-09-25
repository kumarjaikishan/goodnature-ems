const mongoose = require('mongoose');

const paymentTrancheSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMode: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'NEFT_RTGS'], default: 'CASH' },
  referenceNo: { type: String, default: '' },
  remarks: { type: String, default: '' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const voucherSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  voucherNo: { type: String, unique: true, required: true },
  type: { type: String, enum: ['SALARY', 'LEAVE_DEDUCTION', 'LEAVE_ENCASHMENT', 'ADJUSTMENT', 'MANUAL'], required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger' },
  date: { type: Date, default: Date.now },
  
  // Total bill/voucher amount
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },

  // Workflow status
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'REJECTED'],
    default: 'PENDING'
  },

  // Approval audit trail
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },

  // Maker audit trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Partial / split payment disbursement tranches
  paymentTranches: [paymentTrancheSchema],

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
voucherSchema.index({ status: 1 });
voucherSchema.index({ ledgerId: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);

