/**
 * In-memory ring buffer for recording system runtime errors.
 * Exposes errors for developer inspection in the developer portal.
 */

const MAX_ERROR_LOGS = 100;
const errorLogs = [];

function recordError({ status, message, stack, method, path, body, query, user, ip }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: status || 500,
    message: message || 'Internal Server Error',
    stack: stack || null,
    method: method || 'UNKNOWN',
    path: path || 'UNKNOWN',
    body: sanitizePayload(body),
    query: query || {},
    user: user ? { id: user._id || user.id, email: user.email, role: user.role } : null,
    ip: ip || null
  };

  errorLogs.unshift(entry);

  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.pop();
  }

  return entry;
}

function sanitizePayload(data) {
  if (!data || typeof data !== 'object') return data;
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'refreshToken', 'secret', 'apiKey', 'authorization'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }
  return sanitized;
}

function getErrorLogs() {
  return errorLogs;
}

function clearErrorLogs() {
  errorLogs.length = 0;
  return true;
}

module.exports = {
  recordError,
  getErrorLogs,
  clearErrorLogs
};
