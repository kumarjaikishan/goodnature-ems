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
      required: false,
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
    // Tiered Rate & Commission Snapshots locked at booking time
    tenureMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    basePlotRate: {
      type: Number,
      default: 1000,
      min: 0,
    },
    promoterCommissionPercent: {
      type: Number,
      default: 10.0,
      min: 0,
    },
    developerCommissionPercent: {
      type: Number,
      default: 2.0,
      min: 0,
    },
    downpaymentMonths: {
      type: Number,
      default: 1,
      min: 1,
    },
    downpaymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    emiPrincipalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    emiMonthlyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downpaymentCalculationBase: {
      type: String,
      enum: ['AFTER_DISCOUNT', 'BEFORE_DISCOUNT'],
      default: 'BEFORE_DISCOUNT',
    },
  },
  {
    timestamps: true,
  }
);

plotBookingSchema.index({ customerId: 1 });
plotBookingSchema.index({ plotId: 1 });
plotBookingSchema.index({ status: 1 });
// Reports/list views sort by createdAt; without this index Mongo has to
// load and in-memory-sort the whole matching set as bookings accumulate.
plotBookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PlotBooking', plotBookingSchema);
