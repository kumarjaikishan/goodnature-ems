const mongoose = require('mongoose');

const investmentInstallmentSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentAccount',
      required: true,
      index: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE', 'PARTIAL'],
      default: 'PENDING',
      index: true,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentReceipt',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvestmentInstallment', investmentInstallmentSchema);
