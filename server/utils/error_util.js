const { recordError } = require('./errorLogger');

const SENSITIVE_KEYS = new Set([
    'password', 'pass', 'token', 'secret', 'pin', 'temptoken',
    'newpassword', 'confirmpassword', 'currentpassword', 'oldpassword'
]);

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            clean[key] = '[REDACTED]';
        } else if (val && typeof val === 'object') {
            clean[key] = sanitizeObject(val);
        } else {
            clean[key] = val;
        }
    }
    return clean;
};

const errorHandle = (err, req, res, next) => {
    const status = err.status || 500;
    const msg = err.message || "Backend Error";

    // Record into developer in-memory error buffer (with sensitive fields redacted)
    recordError({
        status,
        message: msg,
        stack: err.stack,
        method: req?.method,
        path: req?.originalUrl || req?.url,
        body: sanitizeObject(req?.body),
        query: sanitizeObject(req?.query),
        user: req?.user ? { id: req.user.id || req.user._id, role: req.user.role } : undefined,
        ip: req?.ip || req?.headers?.['x-forwarded-for']
    });

    // Log error with path and stack for observability
    console.error(`❌ [Error ${status}] ${req?.method || ''} ${req?.originalUrl || req?.url || ''}:`, err);

    return res.status(status).json({ message: msg });
};

module.exports = errorHandle;
