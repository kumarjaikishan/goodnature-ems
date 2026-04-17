import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import SuperAdminDashboard from '../admin';
import { useOrganization } from '../useOrganization';

const AdminManagerPage = () => {
    const { profile } = useOrganization();

    if (!['superadmin'].includes(profile?.role)) {
        return (
            <OrganizationLayout title="Admin/Manager">
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    You do not have permission to view this page.
                </div>
            </OrganizationLayout>
        );
    }

    return (
        <OrganizationLayout title="Admin/Manager Management">
            <div className='border shadow-lg bg-slate-50 border-dashed border-slate-400 rounded-md p-4'>
                <SuperAdminDashboard />
            </div>
        </OrganizationLayout>
    );
};

export default AdminManagerPage;
