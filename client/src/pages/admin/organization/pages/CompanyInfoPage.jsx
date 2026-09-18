import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import CompanyInfo from '../components/CompanyInfo';
import { useOrganization } from '../useOrganization';

const CompanyInfoPage = () => {
    const { 
        companyinp, 
        setcompany, 
        isload, 
        setisload, 
        handleImage
    } = useOrganization();

    return (
        <OrganizationLayout title="Company Information">
            <div className="w-full">
                <CompanyInfo
                    companyinp={companyinp}
                    setcompany={setcompany}
                    isload={isload}
                    setisload={setisload}
                    handleImage={handleImage}
                />
            </div>
        </OrganizationLayout>
    );
};

export default CompanyInfoPage;
