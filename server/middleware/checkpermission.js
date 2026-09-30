const usermodel = require('../models/user');

const legends = ['Read', 'Create', 'Update', 'Delete'];

// Fast in-memory cache to prevent excessive DB queries while ensuring freshness
const permCache = new Map();

const getFreshUserPermissions = async (userId) => {
    const now = Date.now();
    const cached = permCache.get(String(userId));
    if (cached && cached.expiry > now) {
        return cached.perms;
    }
    const userapply = await usermodel.findById(userId).select('permissions role isBlocked').lean();
    const perms = userapply?.permissions ? (userapply.permissions instanceof Map ? Object.fromEntries(userapply.permissions) : userapply.permissions) : {};
    permCache.set(String(userId), { perms, expiry: now + 30000 }); // 30 sec TTL
    return perms;
};

const invalidatePermissionCache = (userId) => {
    if (userId) {
        permCache.delete(String(userId));
    } else {
        permCache.clear();
    }
};

const checkPermission = (permissionName, key) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) {
                return res.status(401).json({ message: "Authentication required" });
            }

            if (['superadmin', 'grant', 'developer'].includes(req.user.role)) {
                return next();
            }

            let userPermissions = null;
            if (req.user.permissions) {
                userPermissions = req.user.permissions instanceof Map
                    ? Object.fromEntries(req.user.permissions)
                    : req.user.permissions;
            }

            // If token has the permission, proceed immediately
            if (
                userPermissions &&
                userPermissions.hasOwnProperty(permissionName) &&
                Array.isArray(userPermissions[permissionName]) &&
                userPermissions[permissionName].includes(key)
            ) {
                return next();
            }

            // Fallback: Check fresh permissions from database in case permissions were recently updated
            const freshPermissions = await getFreshUserPermissions(userId);
            req.user.permissions = freshPermissions;

            if (
                freshPermissions.hasOwnProperty(permissionName) &&
                Array.isArray(freshPermissions[permissionName]) &&
                freshPermissions[permissionName].includes(key)
            ) {
                return next();
            } else {
                return res.status(403).json({
                    message: `Permission denied: You can't ${legends[key - 1]} ${permissionName}`
                });
            }
        } catch (error) {
            console.error("Permission check error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};

checkPermission.invalidatePermissionCache = invalidatePermissionCache;

module.exports = checkPermission;

