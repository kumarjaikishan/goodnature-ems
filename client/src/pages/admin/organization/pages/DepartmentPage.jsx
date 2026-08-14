import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import Department from '../department/Department';

const DepartmentPage = () => {
    return (
        <OrganizationLayout title="Departments">
            <div className='border shadow-lg bg-teal-50 border-dashed border-teal-400 rounded-md p-4'>
                <Department />
            </div>
        </OrganizationLayout>
    );
};

export default DepartmentPage;
