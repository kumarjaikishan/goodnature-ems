const mongoose = require('mongoose');

const rateSlabSchema = new mongoose.Schema({
  tenureMonths: {
    type: Number,
    required: true,
    min: 0,
  },
  plotRate: {
    type: Number,
    required: true,
    min: 0,
  },
  promoterCommissionPercent: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
  },
  developerCommissionPercent: {
    type: Number,
    required: false,
    default: 0,
    min: 0,
  },
  downpaymentPercent: {
    type: Number,
    default: 40,
    min: 0,
    max: 100,
  },
  emiPercent: {
    type: Number,
    default: 60,
    min: 0,
    max: 100,
  },
  downpaymentRate: {
    type: Number,
    default: 500,
    min: 0,
  },
  emiRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  downpaymentDays: {
    type: Number,
    default: 90,
    min: 1,
  },
  effectiveLabel: {
    type: String,
    default: '',
  },
}, { _id: true });

const defaultRateSlabs = [
  { tenureMonths: 0, plotRate: 1000, downpaymentRate: 1000, emiRate: 0, downpaymentDays: 90, downpaymentPercent: 100, emiPercent: 0, effectiveLabel: 'Full Payment' },
  { tenureMonths: 6, plotRate: 1050, downpaymentRate: 500, emiRate: 550, downpaymentDays: 90, downpaymentPercent: 47.6, emiPercent: 52.4, effectiveLabel: '6 Months EMI' },
  { tenureMonths: 12, plotRate: 1100, downpaymentRate: 500, emiRate: 600, downpaymentDays: 90, downpaymentPercent: 45.5, emiPercent: 54.5, effectiveLabel: '12 Months EMI' },
  { tenureMonths: 18, plotRate: 1150, downpaymentRate: 500, emiRate: 650, downpaymentDays: 90, downpaymentPercent: 43.5, emiPercent: 56.5, effectiveLabel: '18 Months EMI' },
  { tenureMonths: 24, plotRate: 1200, downpaymentRate: 500, emiRate: 700, downpaymentDays: 90, downpaymentPercent: 41.7, emiPercent: 58.3, effectiveLabel: '24 Months EMI' },
  { tenureMonths: 30, plotRate: 1250, downpaymentRate: 500, emiRate: 750, downpaymentDays: 90, downpaymentPercent: 40.0, emiPercent: 60.0, effectiveLabel: '30 Months EMI' },
  { tenureMonths: 36, plotRate: 1300, downpaymentRate: 500, emiRate: 800, downpaymentDays: 90, downpaymentPercent: 38.5, emiPercent: 61.5, effectiveLabel: '36 Months EMI' },
  { tenureMonths: 42, plotRate: 1350, downpaymentRate: 500, emiRate: 850, downpaymentDays: 90, downpaymentPercent: 37.0, emiPercent: 63.0, effectiveLabel: '42 Months EMI' },
  { tenureMonths: 48, plotRate: 1400, downpaymentRate: 500, emiRate: 900, downpaymentDays: 90, downpaymentPercent: 35.7, emiPercent: 64.3, effectiveLabel: '48 Months EMI' },
  { tenureMonths: 54, plotRate: 1450, downpaymentRate: 500, emiRate: 950, downpaymentDays: 90, downpaymentPercent: 34.5, emiPercent: 65.5, effectiveLabel: '54 Months EMI' },
  { tenureMonths: 60, plotRate: 1500, downpaymentRate: 500, emiRate: 1000, downpaymentDays: 90, downpaymentPercent: 33.3, emiPercent: 66.7, effectiveLabel: '60 Months EMI' },
];

const defaultPremiumHeads = [
  { name: 'Corner Plot', extraPercent: 20, description: 'Plot located at corner with two-side open access' },
  { name: 'Park Facing', extraPercent: 10, description: 'Plot directly facing park or green belt' },
  { name: 'Main Road Facing', extraPercent: 15, description: 'Plot situated on wide main sector road' },
  { name: 'East Facing', extraPercent: 5, description: 'Vastu compliant east facing plot orientation' },
];

const plotRateConfigurationSchema = new mongoose.Schema(
  {
    baseSqFtRate: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
    cornerExtraPercent: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
    },
    premiumHeads: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        extraPercent: {
          type: Number,
          required: true,
          default: 0,
          min: 0,
        },
        description: {
          type: String,
          default: '',
        },
      },
    ],
    interestRatePercent: {
      type: Number,
      default: 10.88,
      min: 0,
    },
    dpGracePeriodDays: {
      type: Number,
      default: 15,
      min: 0,
    },
    emiGracePeriodDays: {
      type: Number,
      default: 15,
      min: 0,
    },
    lateFineGraceDays: {
      type: Number,
      default: 15,
      min: 0,
    },
    lateFineFrequency: {
      type: String,
      enum: ['DAILY', 'MONTHLY', 'YEARLY'],
      default: 'YEARLY',
    },
    lateFineRate: {
      type: Number,
      default: 24,
      min: 0,
    },
    lateFineDailyPercent: {
      type: Number,
      default: 24 / 365,
      min: 0,
    },
    rateSlabs: {
      type: [rateSlabSchema],
      default: defaultRateSlabs,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

plotRateConfigurationSchema.statics.getDefaultRateSlabs = function () {
  return defaultRateSlabs;
};

plotRateConfigurationSchema.statics.getDefaultPremiumHeads = function () {
  return defaultPremiumHeads;
};

module.exports = mongoose.model('PlotRateConfiguration', plotRateConfigurationSchema);
