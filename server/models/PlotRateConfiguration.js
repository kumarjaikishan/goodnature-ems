const mongoose = require('mongoose');

const plotRateConfigurationSchema = new mongoose.Schema(
  {
    baseSqFtRate: {
      type: Number,
      required: true,
      default: 500,
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

module.exports = mongoose.model('PlotRateConfiguration', plotRateConfigurationSchema);
