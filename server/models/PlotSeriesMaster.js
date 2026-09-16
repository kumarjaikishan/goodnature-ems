const mongoose = require('mongoose');

const plotSeriesMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Series Name is required'],
      trim: true,
    },
    prefix: {
      type: String,
      required: [true, 'Prefix is required'],
      uppercase: true,
      trim: true,
    },
    startNumber: {
      type: Number,
      required: [true, 'Start Number is required'],
      min: 1,
    },
    endNumber: {
      type: Number,
      required: [true, 'End Number is required'],
      min: 1,
    },
    plotArea: {
      type: Number,
      required: [true, 'Plot Area in Sq Ft is required'],
      min: 1,
    },
    defaultPlotType: {
      type: String,
      enum: ['NORMAL', 'CORNER'],
      default: 'NORMAL',
    },
    defaultPremiumHeads: [
      {
        name: { type: String, required: true },
        extraPercent: { type: Number, required: true, default: 0 },
      },
    ],
    numberFormat: {
      type: String,
      default: 'A000', // e.g. A001, A002
    },
    // Default dimensions for plots generated in this series
    defaultDimensions: {
      north: { type: Number, default: 0 },
      south: { type: Number, default: 0 },
      east: { type: Number, default: 0 },
      west: { type: Number, default: 0 },
    },
    // Default boundaries / Chaudhi for plots generated in this series
    defaultBoundaries: {
      north: { type: String, default: '' },
      south: { type: String, default: '' },
      east: { type: String, default: '' },
      west: { type: String, default: '' },
    },
    remarks: {
      type: String,
      default: '',
    },
    dpGracePeriodDays: {
      type: Number,
      min: 0,
    },
    emiGracePeriodDays: {
      type: Number,
      min: 0,
    },
    gracePeriodDays: {
      type: Number,
      min: 0,
    },
    lateFineFrequency: {
      type: String,
      enum: ['DAILY', 'MONTHLY', 'YEARLY'],
    },
    lateFineRate: {
      type: Number,
      min: 0,
    },
    lateFineDailyPercent: {
      type: Number,
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

module.exports = mongoose.model('PlotSeriesMaster', plotSeriesMasterSchema);
