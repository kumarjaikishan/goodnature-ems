const mongoose = require('mongoose');

const sponsorSummarySchema = new mongoose.Schema(
  {
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sponsorName: {
      type: String,
      default: '',
    },
    sponsorCode: {
      type: String,
      default: '',
    },
    customerId: {
      type: String,
      default: '',
    },
    mobile: {
      type: String,
      default: '',
    },
    isDeveloper: {
      type: Boolean,
      default: false,
    },
    directBusiness: {
      type: Number,
      default: 0,
      min: 0,
    },
    directCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    indirectBusiness: {
      type: Number,
      default: 0,
      min: 0,
    },
    indirectCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalBusiness: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    directRatesStr: {
      type: String,
      default: '',
    },
    directEffectivePct: {
      type: Number,
      default: 0,
    },
    indirectRatesStr: {
      type: String,
      default: '',
    },
    indirectEffectivePct: {
      type: Number,
      default: 0,
    },
    totalEffectivePct: {
      type: Number,
      default: 0,
    },
    transactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const plotClosingSchema = new mongoose.Schema(
  {
    closingName: {
      type: String,
      required: true,
      trim: true,
    },
    closingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalCollection: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    directBusinessTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    directCommissionTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    indirectBusinessTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    indirectCommissionTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    sponsorCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sponsors: [sponsorSummarySchema],
    status: {
      type: String,
      enum: ['CLOSED', 'REVERSED'],
      default: 'CLOSED',
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

plotClosingSchema.index({ status: 1, createdAt: -1 });
plotClosingSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('PlotClosing', plotClosingSchema);
