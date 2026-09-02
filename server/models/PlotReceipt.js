const mongoose = require('mongoose');

const plotReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    receiptType: {
      type: String,
      enum: ['BOOKING', 'INSTALLMENT', 'DOWNPAYMENT', 'FULL_PAYMENT'],
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotInstallment',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    lateFineRebate: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFinePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    transactionReference: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'APPROVED', // Default to APPROVED for cash / legacy receipts
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

plotReceiptSchema.index({ bookingId: 1 });
// Receipt reports/lists sort by createdAt.
plotReceiptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PlotReceipt', plotReceiptSchema);
