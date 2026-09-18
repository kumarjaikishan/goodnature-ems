import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import Department from '../department/Department';

const DepartmentPage = () => {
    return (
        <OrganizationLayout title="Departments">
            <div className="w-full">
                <Department />
            </div>
        </OrganizationLayout>
    );
};

export default DepartmentPage;
