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
    let status = err.status || 500;
    let msg = err.message || "Backend Error";

    // Convert raw MongoDB duplicate key (E11000) errors into clean, user-friendly messages
    if (err.code === 11000 || (err.message && err.message.includes('E11000 duplicate key error'))) {
        status = 400;
        const keyPattern = err.keyPattern || err.keyValue;
        let fieldName = 'field';
        if (keyPattern && typeof keyPattern === 'object') {
            fieldName = Object.keys(keyPattern)[0] || 'field';
        } else if (err.message) {
            const match = err.message.match(/index:\s+([a-zA-Z0-9_]+)_1/);
            if (match && match[1]) {
                fieldName = match[1];
            }
        }

        const friendlyNames = {
            email: 'email address',
            mobile: 'mobile number',
            phone: 'phone number',
            panCard: 'PAN Card number',
            panNumber: 'PAN number',
            aadhaarCard: 'Aadhaar Card number',
            aadhaarNumber: 'Aadhaar number',
            customerCode: 'customer ID',
            sponsorCode: 'developer ID',
            employeeId: 'employee ID',
            code: 'code',
        };

        const label = friendlyNames[fieldName] || fieldName;
        msg = `A record with this ${label} already exists. Please choose a different one.`;
    }

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
