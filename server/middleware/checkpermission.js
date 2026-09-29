const usermodel = require('../models/user');

const legends = ['Read', 'Create', 'Update', 'Delete'];

const checkPermission = (permissionName, key) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            if (req.user.role === 'superadmin' || req.user.role === 'grant' || req.user.role === 'developer') {
                return next();
            }

            let userPermissions = null;
            if (req.user.permissions) {
                userPermissions = req.user.permissions instanceof Map
                    ? Object.fromEntries(req.user.permissions)
                    : req.user.permissions;
            }

            if (!userPermissions || Object.keys(userPermissions).length === 0) {
                const userapply = await usermodel.findById(userId).lean();
                userPermissions = userapply?.permissions ? (userapply.permissions instanceof Map ? Object.fromEntries(userapply.permissions) : userapply.permissions) : {};
            }

            if (
                userPermissions.hasOwnProperty(permissionName) &&
                Array.isArray(userPermissions[permissionName]) &&
                userPermissions[permissionName].includes(key)
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

module.exports = checkPermission;

