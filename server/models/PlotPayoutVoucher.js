const mongoose = require('mongoose');

const plotPayoutVoucherSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      unique: true,
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'bank', 'upi', 'cheque', 'other'],
      default: 'cash',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    payoutDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

plotPayoutVoucherSchema.index({ bookingId: 1 });
plotPayoutVoucherSchema.index({ customerId: 1 });
plotPayoutVoucherSchema.index({ payoutDate: 1 });

module.exports = mongoose.model('PlotPayoutVoucher', plotPayoutVoucherSchema);
