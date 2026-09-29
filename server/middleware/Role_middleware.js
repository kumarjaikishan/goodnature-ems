const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (['superadmin', 'developer', 'grant'].includes(role)) {
      return next();
    }

    if (allowedRoles.includes(role)) {
      return next();
    }

    // Operational roles can access manager/admin endpoints subject to checkPermission
    const operationalRoles = ['accountant', 'cashier', 'operator', 'hr', 'sales', 'auditor', 'staff', 'other'];
    if ((allowedRoles.includes('manager') || allowedRoles.includes('admin')) && operationalRoles.includes(role)) {
      return next();
    }

    return res.status(401).json({ message: 'Role - Access Denied!' });
  };
};

module.exports = authorizeRoles; 
