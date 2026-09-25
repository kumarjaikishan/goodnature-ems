const mongoose = require('mongoose');

const plotProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project Name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

plotProjectSchema.index({ name: 1 });
plotProjectSchema.index({ status: 1 });

module.exports = mongoose.models.PlotProject || mongoose.model('PlotProject', plotProjectSchema);
