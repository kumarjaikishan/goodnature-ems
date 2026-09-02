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
      required: false,
    },
    sequenceNumber: {
      type: Number,
      required: false,
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
    // Dimensions in Ft: North, South, East, West
    dimensions: {
      north: { type: Number, default: 0 },
      south: { type: Number, default: 0 },
      east: { type: Number, default: 0 },
      west: { type: Number, default: 0 },
    },
    // Boundaries / Chaudhi (What is on North, South, East, West e.g. Road, Plot No, Green Belt, etc.)
    boundaries: {
      north: { type: String, default: '' },
      south: { type: String, default: '' },
      east: { type: String, default: '' },
      west: { type: String, default: '' },
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
