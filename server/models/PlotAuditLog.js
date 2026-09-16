const mongoose = require('mongoose');

const plotAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      default: 'PLOTS',
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
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'system',
    },
    description: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'auditlogs', // Shares the same unified collection
  }
);

plotAuditLogSchema.index({ userId: 1 });
plotAuditLogSchema.index({ documentId: 1 });
plotAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PlotAuditLog', plotAuditLogSchema);

