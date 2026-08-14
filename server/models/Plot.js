const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema(
  {
    plotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotSeriesMaster',
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    plotSize: {
      type: Number,
      required: true,
      min: 1,
    },
    plotType: {
      type: String,
      enum: ['NORMAL', 'CORNER'],
      default: 'NORMAL',
    },
    baseRate: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPlotValue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'HOLD', 'BOOKED', 'CANCELLED', 'REGISTERED'],
      default: 'AVAILABLE',
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

plotSchema.index({ status: 1 });
plotSchema.index({ seriesId: 1 });

module.exports = mongoose.model('Plot', plotSchema);
