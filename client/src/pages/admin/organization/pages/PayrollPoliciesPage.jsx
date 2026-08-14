import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import PayrollPolicies from '../components/PayrollPolicies';
import { useOrganization } from '../useOrganization';

const PayrollPoliciesPage = () => {
    const {
        companyinp,
        setcompany,
        handleSubmit
    } = useOrganization();

    return (
        <OrganizationLayout title="Payroll Policies (applies to all Employee)">
            <div className='border shadow-lg bg-purple-50 border-dashed border-purple-400 rounded-md p-4'>
                <PayrollPolicies
                    companyinp={companyinp}
                    setcompany={setcompany}
                    handleSubmit={handleSubmit}
                />
            </div>
        </OrganizationLayout>
    );
};

export default PayrollPoliciesPage;
