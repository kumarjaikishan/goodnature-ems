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
    numberFormat: {
      type: String,
      default: 'A000', // e.g. A001, A002
    },
    remarks: {
      type: String,
      default: '',
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
