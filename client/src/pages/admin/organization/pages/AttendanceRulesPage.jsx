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
            <div className="w-full">
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
