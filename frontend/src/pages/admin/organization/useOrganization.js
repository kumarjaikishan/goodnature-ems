import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { apiClient } from '../../../utils/apiClient';
import { FirstFetch } from '../../../../store/userSlice';
import useImageUpload from "../../../utils/imageresizer";
import swal from 'sweetalert';

export const useOrganization = () => {
    const dispatch = useDispatch();
    const { employee, company, branch, profile } = useSelector((state) => state.user);
    const [isload, setisload] = useState(false);
    const { handleImage } = useImageUpload();
    const [refreshload, setrefreshload] = useState(false);
    const [teleloading, setteleloading] = useState(false);
    const [companyinp, setcompany] = useState({
        name: '',
        address: '',
        contact: '',
        fullname: '',
        deviceSN: '',
        devices: [
            { SN: 'BJ2C194460597', name: 'Head Branch', online: false }
        ],
        telegram: {
            token: '',
            groupId: '',
        },
        telegramNotifcation: false,
        officeTime: { in: '10:00', out: '18:00', breakMinutes: 30 },
        gracePeriod: { lateEntryMinutes: 10, earlyExitMinutes: 10 },
        workingMinutes: {
            fullDay: 480,
            halfDay: 240,
            shortDayThreshold: 360,
            overtimeAfterMinutes: 490
        },
        weeklyOffs: [0],
        attendanceRules: {
            considerEarlyEntryBefore: '09:50',
            considerLateEntryAfter: '10:10',
            considerEarlyExitBefore: '17:50',
            considerLateExitAfter: '18:15',
            esslPunchInStart: '00:00',
            esslPunchInEnd: '23:59',
            esslPunchOutStart: '00:00',
            esslPunchOutEnd: '23:59'
        },
        payrollPolicies: {
            allowances: [],
            bonuses: [],
            deductions: []
        },
        leaveSettings: {
            allowEmployeeToSeeLedger: false
        }
    });

    useEffect(() => {
        if (company) {
            setcompany(company);
        }
    }, [company]);

    const handleChange = (section, fieldOrValue, value) => {
        if (typeof fieldOrValue === 'object') {
            setcompany(prev => ({
                ...prev,
                [section]: fieldOrValue
            }));
        } else {
            setcompany(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [fieldOrValue]: value
                }
            }));
        }
    };

    const handleNestedChange = (parent, child, key, value) => {
        setcompany(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: {
                    ...prev[parent]?.[child],
                    [key]: value
                }
            }
        }));
    };

    const addDevice = () => {
        setcompany({
            ...companyinp,
            devices: [...companyinp.devices, { SN: '', name: '', online: false }]
        });
    };

    const removeDevice = (index) => {
        swal({
            title: "Delete this device?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willLogout) => {
            if (willLogout) {
                const newDevices = companyinp.devices.filter((_, i) => i !== index);
                setcompany({ ...companyinp, devices: newDevices });
            }
        });
    };

    const isOnline = (lastHeartbeat) => {
        if (!lastHeartbeat) return false;
        const diff = Date.now() - new Date(lastHeartbeat).getTime();
        return diff < 60000;
    };

    const deviceRefresh = async (deviceSN) => {
        try {
            setrefreshload(true);
            const data = await apiClient({
                url: `refreshDevice/${deviceSN}`
            });
            setcompany((prev) => ({ ...prev, devices: data.devices }));
        } catch (error) {
            console.error('Error refreshing device:', error);
        } finally {
            setrefreshload(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            setisload(true);
            const data = await apiClient({
                url: "updateCompany",
                method: "POST",
                body: companyinp
            });
            dispatch(FirstFetch());
            toast.success(data.message, { autoClose: 1800 });
        } catch (error) {
            console.error('Error updating company:', error);
        } finally {
            setisload(false);
        }
    };

    return {
        companyinp,
        setcompany,
        handleChange,
        handleNestedChange,
        addDevice,
        removeDevice,
        isOnline,
        deviceRefresh,
        handleSubmit,
        isload,
        setisload,
        refreshload,
        setrefreshload,
        teleloading,
        setteleloading,
        handleImage,
        employee,
        company,
        branch,
        profile,
        dispatch
    };
};
