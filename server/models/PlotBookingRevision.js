const mongoose = require('mongoose');

const plotBookingRevisionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
      index: true,
    },
    bookingNumber: {
      type: String,
      required: true,
      trim: true,
    },
    revisionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    revisionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    // Admin / User provided editable narration for why the change was made
    adminNarration: {
      type: String,
      default: '',
      trim: true,
    },
    // Automatic system-generated audit log detailing every changed field
    systemLog: {
      type: String,
      default: '',
      trim: true,
    },
    // Previous State Snapshot
    previousSnapshot: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlotCustomer' },
      customerName: String,
      customerMobile: String,
      sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sponsorName: String,
      plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot' },
      plotNumber: String,
      plotSize: Number,
      scheme: String,
      tenureMonths: Number,
      basePlotRate: Number,
      downpaymentRate: Number,
      emiRate: Number,
      effectiveRate: Number,
      govtRate: Number,
      plotValue: Number,
      discount: Number,
      remainingAmount: Number,
      downpaymentAmount: Number,
      downpaymentMonths: Number,
      downpaymentDays: Number,
      oneTimeMonths: Number,
      emiMonthlyAmount: Number,
      promoterCommissionPercent: Number,
      developerCommissionPercent: Number,
      agreementNumber: String,
      bookingDate: Date,
      bookingType: String,
      status: String,
      paymentMode: String,
      transactionReference: String,
      landSourcing: Array,
      paidInstallmentsCount: Number,
      totalPaidAmount: Number,
    },
    // New State Snapshot
    newSnapshot: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlotCustomer' },
      customerName: String,
      customerMobile: String,
      sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sponsorName: String,
      plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot' },
      plotNumber: String,
      plotSize: Number,
      scheme: String,
      tenureMonths: Number,
      basePlotRate: Number,
      effectiveRate: Number,
      govtRate: Number,
      plotValue: Number,
      discount: Number,
      remainingAmount: Number,
      downpaymentAmount: Number,
      downpaymentMonths: Number,
      downpaymentDays: Number,
      oneTimeMonths: Number,
      emiMonthlyAmount: Number,
      promoterCommissionPercent: Number,
      developerCommissionPercent: Number,
      agreementNumber: String,
      bookingDate: Date,
      bookingType: String,
      status: String,
      paymentMode: String,
      transactionReference: String,
      landSourcing: Array,
      paidInstallmentsCount: Number,
      totalPaidAmount: Number,
    },
    // Detailed list of changed fields in this edit
    changedFields: [
      {
        field: String,
        label: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],
    // Calculated Deltas
    deltas: {
      deltaPlotSize: Number,
      deltaPlotValue: Number,
      deltaDiscount: Number,
      deltaRemainingAmount: Number,
      deltaEmiMonthlyAmount: Number,
      deltaDownpaymentAmount: Number,
      deltaPromoterCommissionPercent: Number,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

plotBookingRevisionSchema.index({ bookingId: 1, revisionNumber: -1 });

module.exports = mongoose.model('PlotBookingRevision', plotBookingRevisionSchema);
