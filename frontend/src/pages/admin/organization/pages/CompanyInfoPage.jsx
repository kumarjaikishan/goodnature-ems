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
        handleImage, 
        profile 
    } = useOrganization();

    const addCompany = () => {};

    return (
        <OrganizationLayout title="Company Information">
            <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md p-4'>
                <CompanyInfo
                    companyinp={companyinp}
                    setcompany={setcompany}
                    isload={isload}
                    setisload={setisload}
                    handleImage={handleImage}
                    addCompany={addCompany}
                    profile={profile}
                />
            </div>
        </OrganizationLayout>
    );
};

export default CompanyInfoPage;
