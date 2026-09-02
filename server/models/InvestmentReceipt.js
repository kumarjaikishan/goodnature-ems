const mongoose = require('mongoose');

const investmentReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentAccount',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotCustomer',
      required: true,
      index: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'neft_rtgs'],
      required: true,
    },
    transactionReference: {
      type: String,
      default: '',
      trim: true,
    },
    bankName: {
      type: String,
      default: '',
      trim: true,
    },
    chequeNumber: {
      type: String,
      default: '',
      trim: true,
    },
    chequeDate: {
      type: Date,
      default: null,
    },
    installmentsCovered: {
      type: [Number], // array of installment numbers paid by this receipt
      default: [],
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'APPROVED',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvestmentReceipt', investmentReceiptSchema);
