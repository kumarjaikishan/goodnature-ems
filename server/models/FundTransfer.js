const mongoose = require('mongoose');

const fundTransferSchema = new mongoose.Schema(
  {
    transferNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fromLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true,
    },
    toLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    transferDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    transferMode: {
      type: String,
      enum: ['CASH_DEPOSIT', 'BANK_TRANSFER', 'NEFT_RTGS', 'CHEQUE', 'INTERNAL_TRANSFER', 'UPI', 'CASH_HANDOVER'],
      default: 'CASH_DEPOSIT',
      required: true,
    },
    referenceNo: {
      type: String,
      default: '',
      trim: true,
    },
    depositSlipUrl: {
      type: String,
      default: '',
    },
    narration: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    // Approver / Checker Details
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    // Rejection Details
    rejectionReason: {
      type: String,
      default: '',
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    // Cancellation Details
    cancelledAt: {
      type: Date,
    },
    // Accounting Entries Links
    debitEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
    },
    creditEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
  },
  {
    timestamps: true,
  }
);

fundTransferSchema.index({ fromLedgerId: 1, status: 1 });
fundTransferSchema.index({ toLedgerId: 1, status: 1 });
fundTransferSchema.index({ fromUserId: 1 });
fundTransferSchema.index({ toUserId: 1 });
fundTransferSchema.index({ transferDate: -1, createdAt: -1 });

module.exports = mongoose.model('FundTransfer', fundTransferSchema);
