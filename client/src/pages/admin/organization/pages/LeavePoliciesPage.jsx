import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import LeavePolicyManager from '../components/LeavePolicyManager';

const LeavePoliciesPage = () => {
    return (
        <OrganizationLayout title="Leave Policies">
            <div className="w-full">
                <LeavePolicyManager />
            </div>
        </OrganizationLayout>
    );
};

export default LeavePoliciesPage;
