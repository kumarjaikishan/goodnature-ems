import React, { useEffect } from 'react';
import { Wifi, WifiOff, Trash2, Monitor, PlusCircle, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';
import EsslEventLog from './EsslEventLog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const DeviceManager = ({ companyinp, setcompany, isOnline, deviceRefresh, refreshload, removeDevice, addDevice, handleSubmit, isload }) => {
    const updateDevice = (index, field, value) => {
        const newDevices = [...companyinp.devices];
        newDevices[index][field] = value;
        setcompany({ ...companyinp, devices: newDevices });
    };

    useEffect(() => {
        companyinp?.devices?.forEach((elem) => deviceRefresh(elem?.SN));
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                            <Monitor size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Registered Biometric Devices</h3>
                            <p className="text-xs text-slate-500">Configure connected attendance machines</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        startIcon={PlusCircle}
                        onClick={addDevice}
                    >
                        Add Device
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200/80">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                                <th className="py-2.5 px-3 w-12">#</th>
                                <th className="py-2.5 px-3">Device Name</th>
                                <th className="py-2.5 px-3">Serial Number (SN)</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Last Heartbeat</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!companyinp?.devices || companyinp.devices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                        No devices registered yet. Click "Add Device" to configure your first attendance reader.
                                    </td>
                                </tr>
                            ) : (
                                companyinp.devices.map((device, index) => {
                                    const online = isOnline(device?.lastHeartbeat);
                                    return (
                                        <tr key={index} className="hover:bg-slate-50/60 transition">
                                            <td className="py-2.5 px-3 font-semibold text-slate-500">{index + 1}</td>
                                            <td className="py-2.5 px-3">
                                                <Input
                                                    size="sm"
                                                    placeholder="Main Office Gate"
                                                    value={device.name}
                                                    onChange={(e) => updateDevice(index, "name", e.target.value)}
                                                />
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Input
                                                    size="sm"
                                                    placeholder="SN12345678"
                                                    className="font-mono"
                                                    value={device.SN}
                                                    onChange={(e) => updateDevice(index, "SN", e.target.value)}
                                                />
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <Badge
                                                    size="sm"
                                                    variant={online ? 'success' : 'danger'}
                                                    dot
                                                >
                                                    {online ? 'Online' : 'Offline'}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {!device?.lastHeartbeat ? 'Never' : dayjs(device?.lastHeartbeat).format("DD/MM/YY, hh:mm A")}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        title="Ping / Refresh Device"
                                                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                                        onClick={() => deviceRefresh(device?.SN)}
                                                    >
                                                        <RotateCcw size={15} className={refreshload ? "animate-spin" : ""} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete Device"
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        onClick={() => removeDevice(index)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        variant="primary"
                        loading={isload}
                        onClick={handleSubmit}
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>

            <EsslEventLog companyId={companyinp?._id} />
        </div>
    );
};

export default DeviceManager;
