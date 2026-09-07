import { useSelector } from 'react-redux';

/**
 * Custom hook to check user permissions
 * Action numbers: 1: Read, 2: Create, 3: Update, 4: Delete
 */
export const usePermission = (resource, action) => {
    const profile = useSelector(state => state.user?.profile);

    if (!profile) return false;
    if (profile.role === 'superadmin' || profile.role === 'developer') return true;

    const resourcePermissions = profile.permissions?.[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
};

/**
 * Pure function to check permission when profile object is already available
 */
export const hasPermission = (profile, resource, action) => {
    if (!profile) return false;
    if (profile.role === 'superadmin' || profile.role === 'developer') return true;

    const resourcePermissions = profile.permissions?.[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
};

export default usePermission;
