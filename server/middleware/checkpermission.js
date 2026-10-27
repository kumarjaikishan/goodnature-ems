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

            const checkPermKey = (perms) => {
                if (!perms) return false;
                const names = Array.isArray(permissionName) ? permissionName : [permissionName];
                for (const name of names) {
                    // Direct permission check
                    if (perms.hasOwnProperty(name) && Array.isArray(perms[name]) && perms[name].includes(key)) {
                        return true;
                    }
                    // Fallback for ledger sub-modules -> master "ledger"
                    const LEDGER_SUBMODULES = ['bank_ledger', 'cash_ledger', 'fund_transfer', 'employee_ledger', 'kisan_ledger', 'associate_ledger', 'partner_ledger', 'branch_ledger'];
                    if (LEDGER_SUBMODULES.includes(name) && perms.hasOwnProperty('ledger') && Array.isArray(perms.ledger) && perms.ledger.includes(key)) {
                        return true;
                    }
                }
                return false;
            };

            // Always fetch fresh permissions to ensure newly revoked permissions are strictly enforced
            const freshPermissions = await getFreshUserPermissions(userId);
            req.user.permissions = freshPermissions;

            if (checkPermKey(freshPermissions)) {
                return next();
            } else {
                const displayName = Array.isArray(permissionName) ? permissionName.join(' or ') : permissionName;
                return res.status(403).json({
                    message: `Permission denied: You can't ${legends[key - 1]} ${displayName}`
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

