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
            <TelegramSettings
                companyinp={companyinp}
                setcompany={setcompany}
                handleChange={handleChange}
                fetchgroup={fetchgroup}
                teleloading={teleloading}
                isload={isload}
                handleSubmit={handleSubmit}
            />
        </OrganizationLayout>
    );
};

export default TelegramIntegrationPage;
