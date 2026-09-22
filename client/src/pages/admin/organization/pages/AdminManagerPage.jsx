import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import SuperAdminDashboard from '../admin';
import { useOrganization } from '../useOrganization';

const AdminManagerPage = () => {
    const { profile } = useOrganization();

    if (!['superadmin'].includes(profile?.role)) {
        return (
            <OrganizationLayout title="User Management">
                <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
                    <p className="font-bold text-sm">Access Denied</p>
                    <p className="text-xs mt-1">You do not have administrative privileges to manage system accounts.</p>
                </div>
            </OrganizationLayout>
        );
    }

    return (
        <OrganizationLayout title="User Management">
            <div className="w-full">
                <SuperAdminDashboard />
            </div>
        </OrganizationLayout>
    );
};

export default AdminManagerPage;
