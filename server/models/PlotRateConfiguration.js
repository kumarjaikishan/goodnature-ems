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
    required: true,
    min: 0,
  },
  developerCommissionPercent: {
    type: Number,
    required: true,
    default: 2.0,
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
  effectiveLabel: {
    type: String,
    default: '',
  },
}, { _id: true });

const defaultRateSlabs = [
  { tenureMonths: 0, plotRate: 1000, promoterCommissionPercent: 10.0, developerCommissionPercent: 2.0, downpaymentPercent: 100, emiPercent: 0, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 3, plotRate: 1050, promoterCommissionPercent: 10.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 6, plotRate: 1100, promoterCommissionPercent: 11.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 9, plotRate: 1150, promoterCommissionPercent: 11.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 12, plotRate: 1200, promoterCommissionPercent: 12.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 15, plotRate: 1250, promoterCommissionPercent: 12.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 18, plotRate: 1300, promoterCommissionPercent: 13.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 21, plotRate: 1350, promoterCommissionPercent: 13.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 24, plotRate: 1400, promoterCommissionPercent: 14.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 27, plotRate: 1450, promoterCommissionPercent: 14.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
  { tenureMonths: 30, plotRate: 1500, promoterCommissionPercent: 15.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60, effectiveLabel: 'Jul 26 - Sept 26' },
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
    interestRatePercent: {
      type: Number,
      default: 10.88,
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

module.exports = mongoose.model('PlotRateConfiguration', plotRateConfigurationSchema);
