const mongoose = require('mongoose');

const plotInstallmentSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFine: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFinePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFineRebate: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidDate: {
      type: Date,
    },
    receiptNumber: {
      type: String,
      trim: true,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'neft_rtgs', ''],
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

plotInstallmentSchema.index({ bookingId: 1, installmentNumber: 1 });
plotInstallmentSchema.index({ status: 1 });

module.exports = mongoose.model('PlotInstallment', plotInstallmentSchema);
