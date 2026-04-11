import React from 'react';
import { TextField, Button, IconButton } from '@mui/material';
import { FaWifi, FaTrash } from 'react-icons/fa';
import { MdOutlineWifiOff } from "react-icons/md";
import { FiRefreshCw } from 'react-icons/fi';
import dayjs from 'dayjs';

const DeviceManager = ({ companyinp, setcompany, isOnline, deviceRefresh, refreshload, removeDevice, addDevice, handleSubmit, isload }) => {
    
    const updateDevice = (index, field, value) => {
        const newDevices = [...companyinp.devices];
        newDevices[index][field] = value;
        setcompany({ ...companyinp, devices: newDevices });
    };

    return (
        <div className='space-y-4'>
            <div className='space-y-2'>
                {companyinp?.devices?.map((device, index) => {
                    const online = isOnline(device?.lastHeartbeat);

                    return (
                        <div key={index} className='flex flex-wrap w-full gap-4 items-center mb-2'>
                            <TextField
                                label="S.No"
                                variant="standard"
                                disabled
                                size="small"
                                value={index + 1}
                                className='w-10'
                            />
                            <TextField
                                label="Device Name"
                                variant="standard"
                                size="small"
                                value={device.name}
                                onChange={(e) => updateDevice(index, "name", e.target.value)}
                            />
                            <TextField
                                label="Device SN"
                                variant="standard"
                                size="small"
                                value={device.SN}
                                onChange={(e) => updateDevice(index, "SN", e.target.value)}
                            />
                            <TextField
                                label="Last Sync"
                                variant="standard"
                                size="small"
                                disabled
                                value={!device?.lastHeartbeat ? 'N/A' : dayjs(device?.lastHeartbeat).format("DD/MM/YY, hh:mm:ss A")}
                            />

                            {online ? (
                                <FaWifi title="Device Online" style={{ color: "green", fontSize: "1.6rem" }} />
                            ) : (
                                <MdOutlineWifiOff title="Device Offline" style={{ color: "red", fontSize: "1.6rem" }} />
                            )}

                            <IconButton color="primary" onClick={() => deviceRefresh(device?.SN)}>
                                <FiRefreshCw className={refreshload ? "animate-spin" : ""} />
                            </IconButton>

                            <IconButton color="error" onClick={() => removeDevice(index)}>
                                <FaTrash />
                            </IconButton>
                        </div>
                    );
                })}

                <Button variant="contained" onClick={addDevice}>Add More Device</Button>
            </div>
            <Button className='float-end' variant="contained" loading={isload} onClick={handleSubmit}>
                Save Changes
            </Button>
        </div>
    );
};

export default DeviceManager;
