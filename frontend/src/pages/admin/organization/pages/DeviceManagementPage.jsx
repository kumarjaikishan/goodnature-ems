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
            <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md p-4'>
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
            </div>
        </OrganizationLayout>
    );
};

export default DeviceManagementPage;
