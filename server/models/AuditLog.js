const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    userName: {
      type: String,
      trim: true,
      default: 'System',
    },
    userEmail: {
      type: String,
      trim: true,
      default: '',
    },
    userRole: {
      type: String,
      trim: true,
      default: 'system',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      enum: [
        'PLOTS',
        'ATTENDANCE',
        'LEAVE',
        'PAYROLL',
        'EMPLOYEE',
        'ORGANIZATION',
        'INVESTMENTS',
        'AUTH',
        'VOUCHER',
        'SYSTEM',
      ],
      trim: true,
    },
    modelName: {
      type: String,
      trim: true,
      default: '',
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ documentId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
