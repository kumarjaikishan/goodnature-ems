import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import TelegramSettings from '../components/TelegramSettings';
import { useOrganization } from '../useOrganization';
import { toast } from 'react-toastify';
import swal from 'sweetalert';

const TelegramIntegrationPage = () => {
    const { 
        companyinp, 
        setcompany, 
        handleChange, 
        teleloading, 
        setteleloading, 
        isload, 
        handleSubmit,
        fetchgroup
    } = useOrganization();

    return (
        <OrganizationLayout title="Telegram Integration">
            <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md p-4'>
                <TelegramSettings
                    companyinp={companyinp}
                    setcompany={setcompany}
                    handleChange={handleChange}
                    fetchgroup={fetchgroup}
                    teleloading={teleloading}
                    isload={isload}
                    handleSubmit={handleSubmit}
                />
            </div>
        </OrganizationLayout>
    );
};

export default TelegramIntegrationPage;
