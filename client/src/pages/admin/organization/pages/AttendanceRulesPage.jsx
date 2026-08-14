import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import AttendanceRules from '../components/AttendanceRules';
import { useOrganization } from '../useOrganization';

const AttendanceRulesPage = () => {
    const { 
        companyinp, 
        setcompany, 
        handleChange, 
        handleNestedChange, 
        handleSubmit, 
        isload 
    } = useOrganization();

    return (
        <OrganizationLayout title="Attendance & Overtime Rules">
            <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md p-4'>
                <AttendanceRules
                    companyinp={companyinp}
                    setcompany={setcompany}
                    handleChange={handleChange}
                    handleNestedChange={handleNestedChange}
                    handleSubmit={handleSubmit}
                    isload={isload}
                />
            </div>
        </OrganizationLayout>
    );
};

export default AttendanceRulesPage;
