const jwt = require('jsonwebtoken');
const usermodel = require('../models/user');

// Fast in-memory user active/blocked cache to avoid DB roundtrip on every API request
const userStatusCache = new Map();
const USER_CACHE_TTL = 30000; // 30 seconds

const authmiddlewre = async (req, res, next) => {
    const bearertoken = req.header('Authorization');
    if (!bearertoken) {
        return next({ status: 401, message: "Unauthorizes HTTP, token not provided" });
    }

    try {
        const token = bearertoken.replace("Bearer", "").trim();
        const verified = jwt.verify(token, process.env.JWT_Key);

        const userId = verified.id;
        const now = Date.now();
        const cached = userStatusCache.get(String(userId));

        let isBlocked = false;
        let userExists = true;

        if (cached && cached.expiry > now) {
            isBlocked = cached.isBlocked;
            userExists = cached.userExists;
        } else {
            const dbUser = await usermodel.findById(userId).select('isBlocked').lean();
            if (!dbUser) {
                userExists = false;
            } else {
                isBlocked = Boolean(dbUser.isBlocked);
            }
            userStatusCache.set(String(userId), { isBlocked, userExists, expiry: now + USER_CACHE_TTL });
        }

        if (!userExists || isBlocked) {
            return res.status(401).json({ message: "Your account is blocked or inactive. Please contact administrator." });
        }

        req.user = verified;
        req.userid = verified.id;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'jwt expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid Token' });
        }
        res.status(401).json({ message: error.message || 'Authentication failed' });
    }
}

module.exports = authmiddlewre;
