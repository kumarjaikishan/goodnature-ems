const mongoose = require('mongoose');

const plotBookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotCustomer',
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plot',
      required: true,
    },
    plotValue: {
      type: Number,
      required: true,
      min: 0,
    },
    scheme: {
      type: String,
      enum: ['FULL_PAYMENT', 'MONTHLY_INSTALLMENT'],
      required: true,
    },
    bookingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['HOLD', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    holdExpiryDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['INACTIVE', 'ACTIVE', 'COMPLETED'],
      default: 'INACTIVE',
    },
    payoutStartDate: {
      type: Date,
    },
    payoutWeeklyAmount: {
      type: Number,
      default: 1200,
      min: 0,
    },
    payoutNextDueDate: {
      type: Date,
    },
    oneTimeMonths: {
      type: Number,
      default: 1,
      min: 1,
    },
    agreementNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

plotBookingSchema.index({ customerId: 1 });
plotBookingSchema.index({ plotId: 1 });
plotBookingSchema.index({ status: 1 });

module.exports = mongoose.model('PlotBooking', plotBookingSchema);
