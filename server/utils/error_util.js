const { recordError } = require('./errorLogger');

const errorHandle = (err, req, res, next) => {
    const status = err.status || 500;
    const msg = err.message || "Backend Error";

    // Record into developer in-memory error buffer
    recordError({
        status,
        message: msg,
        stack: err.stack,
        method: req?.method,
        path: req?.originalUrl || req?.url,
        body: req?.body,
        query: req?.query,
        user: req?.user,
        ip: req?.ip || req?.headers?.['x-forwarded-for']
    });

    // Log error with path and stack for observability
    console.error(`❌ [Error ${status}] ${req?.method || ''} ${req?.originalUrl || req?.url || ''}:`, err);

    return res.status(status).json({ message: msg });
};

module.exports = errorHandle;