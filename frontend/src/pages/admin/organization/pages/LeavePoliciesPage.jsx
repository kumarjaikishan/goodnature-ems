import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import LeavePolicyManager from '../components/LeavePolicyManager';

const LeavePoliciesPage = () => {
    return (
        <OrganizationLayout title="Leave Policies">
            <div className='border shadow-lg bg-white border-dashed border-blue-300 rounded-md p-4'>
                <LeavePolicyManager />
            </div>
        </OrganizationLayout>
    );
};

export default LeavePoliciesPage;
