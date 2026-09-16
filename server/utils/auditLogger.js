const AuditLog = require('../models/AuditLog');

/**
 * Non-blocking centralized audit logger utility.
 * Records actions taken across the system without blocking main request lifecycle.
 *
 * @param {Object} options
 * @param {Object} [options.req] - Express request object (extracts user, IP)
 * @param {String} options.action - Short action name (e.g. 'UPDATE_ATTENDANCE', 'RECEIVE_PAYMENT')
 * @param {String} options.module - 'PLOTS'|'ATTENDANCE'|'LEAVE'|'PAYROLL'|'EMPLOYEE'|'ORGANIZATION'|'INVESTMENTS'|'AUTH'|'VOUCHER'|'SYSTEM'
 * @param {String} [options.modelName] - Name of affected mongoose model
 * @param {String|ObjectId} [options.documentId] - ID of affected document
 * @param {String} [options.description] - Human-readable summary of the action
 * @param {Object} [options.details] - Detailed payload, diffs, or snapshot
 * @param {String} [options.status] - 'SUCCESS'|'FAILURE'|'WARNING'
 * @param {String|ObjectId} [options.userId] - Explicit user ID if req not provided
 * @param {String} [options.userName] - Explicit user name
 * @param {String} [options.userRole] - Explicit user role
 * @param {String} [options.userEmail] - Explicit user email
 * @param {Object} [options.session] - Optional Mongo session if part of transaction
 */
const logActivity = async (options = {}) => {
  try {
    const {
      req,
      action,
      module: logModule,
      modelName = '',
      documentId = null,
      description = '',
      details = {},
      status = 'SUCCESS',
      session = null,
    } = options;

    let userId = options.userId || null;
    let userName = options.userName || 'System';
    let userEmail = options.userEmail || '';
    let userRole = options.userRole || 'system';
    let ipAddress = '';

    if (req) {
      if (req.user) {
        userId = req.user.id || req.user._id || userId;
        userName = req.user.name || req.user.username || userName;
        userEmail = req.user.email || userEmail;
        userRole = req.user.role || userRole;
      }
      ipAddress =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '';
    }

    const logEntry = new AuditLog({
      userId,
      userName,
      userEmail,
      userRole,
      action,
      module: logModule,
      modelName,
      documentId,
      description,
      details,
      ipAddress,
      status,
    });

    if (session) {
      await logEntry.save({ session });
    } else {
      // Async non-blocking save
      await logEntry.save();
    }
  } catch (err) {
    // Fail-safe: Logging failure should never crash normal business execution
    console.error('⚠️ [AuditLogger Error]:', err?.message || err);
  }
};

module.exports = {
  logActivity,
};
