const mongoose = require('mongoose');

const plotProductSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      default: 'MICRO_PLOT',
      trim: true,
    },
    dimensions: {
      north: {
        type: Number,
        default: 1, // e.g. 1 ft
        min: 0,
      },
      south: {
        type: Number,
        default: 1, // e.g. 1 ft
        min: 0,
      },
      east: {
        type: Number,
        default: 2, // e.g. 2 ft
        min: 0,
      },
      west: {
        type: Number,
        default: 2, // e.g. 2 ft
        min: 0,
      },
      unit: {
        type: String,
        default: 'feet',
      },
    },
    dimensionLabel: {
      type: String,
      default: '1 ft x 2 ft',
    },
    areaSqFt: {
      type: Number,
      required: true,
      default: 2,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 5000,
    },
    totalUnitsAvailable: {
      type: Number,
      default: 1000,
      min: 0,
    },
    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.PlotProduct || mongoose.model('PlotProduct', plotProductSchema);
