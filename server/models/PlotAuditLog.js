const mongoose = require('mongoose');

const plotAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

plotAuditLogSchema.index({ userId: 1 });
plotAuditLogSchema.index({ documentId: 1 });

module.exports = mongoose.model('PlotAuditLog', plotAuditLogSchema);
