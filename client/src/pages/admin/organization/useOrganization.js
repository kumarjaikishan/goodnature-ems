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
            individualNotification: false
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

    const fetchgroup = async () => {
        if (!companyinp.telegram.token) {
            toast.warn("Please enter a Bot Token first");
            return;
        }

        setteleloading(true);
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${companyinp.telegram.token}/getUpdates`
            );
            const data = await response.json();

            if (!data.ok) {
                if (data.error_code === 409) {
                    toast.error("Telegram API Conflict: A webhook is active on this bot. Please remove the webhook to use the refresh feature.");
                } else {
                    toast.error(`Telegram Error: ${data.description || "Unknown error"}`);
                }
                return;
            }

            if (data.result && data.result.length > 0) {
                let groups = {};
                data.result.forEach((m) => {
                    const chat = m.message?.chat || m.my_chat_member?.chat;
                    if (chat && (chat.type === "group" || chat.type === "supergroup")) {
                        let groupId = chat.id;
                        if (!groups.hasOwnProperty(groupId)) {
                            groups[groupId] = {
                                groupId: Math.abs(chat.id),
                                groupName: chat.title || "Unnamed Group",
                            };
                        }
                    }
                });

                if (Object.keys(groups).length === 0) {
                    toast.info("No groups found. Make sure the bot is added to a group and you've sent a message or added the bot recently.");
                    return;
                }

                let html = Object.values(groups)
                    .map((g, i) =>
                        `<label style="display:block;margin:5px 0">
                            <input type="radio" name="groupRadio" value="${g.groupId}" ${i === 0 ? "checked" : ""} />
                            ${g.groupName}
                        </label>`
                    )
                    .join("");

                swal({
                    title: "Select a Group",
                    content: {
                        element: "div",
                        attributes: { innerHTML: html },
                    },
                    buttons: {
                        cancel: "Cancel",
                        confirm: { text: "Select", closeModal: true },
                    },
                }).then((willConfirm) => {
                    if (willConfirm) {
                        const selected = document.querySelector("input[name='groupRadio']:checked")?.value;
                        if (selected) {
                            setcompany(prev => ({
                                ...prev,
                                telegram: {
                                    ...prev.telegram,
                                    groupId: selected,
                                },
                            }));
                        }
                    }
                });
            } else {
                toast.info("No new updates found from Telegram. Try adding the bot to a new group and refresh again.");
            }
        } catch (error) {
            toast.warn("Error fetching telegram groups");
            console.error('Telegram API error:', error);
        } finally {
            setteleloading(false);
        }
    };

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
        fetchgroup,
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
