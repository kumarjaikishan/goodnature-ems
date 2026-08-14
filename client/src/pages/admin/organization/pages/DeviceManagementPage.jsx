import React from 'react';
import OrganizationLayout from '../OrganizationLayout';
import DeviceManager from '../components/DeviceManager';
import { useOrganization } from '../useOrganization';

const DeviceManagementPage = () => {
    const {
        companyinp,
        setcompany,
        isOnline,
        deviceRefresh,
        refreshload,
        removeDevice,
        addDevice,
        handleSubmit,
        isload
    } = useOrganization();

    return (
        <OrganizationLayout title="Device Management">
            <DeviceManager
                companyinp={companyinp}
                setcompany={setcompany}
                isOnline={isOnline}
                deviceRefresh={deviceRefresh}
                refreshload={refreshload}
                removeDevice={removeDevice}
                addDevice={addDevice}
                handleSubmit={handleSubmit}
                isload={isload}
            />
        </OrganizationLayout>
    );
};

export default DeviceManagementPage;
