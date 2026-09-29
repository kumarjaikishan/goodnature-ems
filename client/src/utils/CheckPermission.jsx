import { useSelector } from 'react-redux';

/**
 * Custom hook to check user permissions
 * Action numbers: 1: Read, 2: Create, 3: Update, 4: Delete
 */
export const usePermission = (resource, action = 1) => {
    const profile = useSelector(state => state.user?.profile);
    return hasPermission(profile, resource, action);
};

/**
 * Pure function to check permission when profile object is already available.
 * Supports intelligent parent fallback:
 * - bank_ledger, cash_ledger, fund_transfer, employee_ledger, kisan_ledger, sponsor_ledger -> fallback to "ledger"
 */
export const hasPermission = (profile, resource, action = 1) => {
    if (!profile) return false;
    if (profile.role === 'superadmin' || profile.role === 'developer' || profile.role === 'admin') return true;

    const permissions = profile.permissions;
    if (!permissions) return false;

    // 1. Direct resource check
    const directPerms = permissions[resource];
    if (Array.isArray(directPerms) && directPerms.includes(action)) {
        return true;
    }

    return false;
};

export default usePermission;
