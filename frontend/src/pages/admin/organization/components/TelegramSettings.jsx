import React from 'react';
import { TextField, Button, IconButton, InputAdornment } from '@mui/material';
import { FaTrash } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';

const TelegramSettings = ({ companyinp, setcompany, handleChange, fetchgroup, teleloading, isload, handleSubmit }) => {
    return (
        <div className='space-y-4'>
            <div className='flex flex-wrap w-full gap-4 items-center mb-2'>
                <TextField
                    label="Telegram Bot Token"
                    variant="standard"
                    size="small"
                    className='w-full md:w-[350px]'
                    slotProps={{
                        input: {
                            readOnly: true
                        }
                    }}
                    value={companyinp?.telegram?.token || ""}
                    onChange={e => handleChange('telegram', 'token', e.target.value)}
                />

                <TextField
                    label="Group Id"
                    variant="standard"
                    size="small"
                    className='w-full md:w-[150px]'
                    value={companyinp?.telegram?.groupId || ""}
                    onChange={e => handleChange('telegram', 'groupId', e.target.value)}
                    slotProps={{
                        input: {
                            readOnly: true, // 🔒 makes field readonly
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={fetchgroup}
                                        edge="end"
                                        disabled={teleloading}
                                    >
                                        <FiRefreshCw className={teleloading ? "animate-spin" : ""} />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                />

                <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={companyinp?.telegramNotifcation || false}
                            onChange={e =>
                                setcompany(prev => ({
                                    ...prev,
                                    telegramNotifcation: e.target.checked
                                }))
                            }
                            className="w-5 h-5 text-blue-600 bg-gray-200 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-gray-700 font-medium">Enable Notifications</span>
                    </label>
                    <label className="flex items-center cursor-pointer select-none ml-4">
                        <input
                            type="checkbox"
                            checked={companyinp?.telegram?.individualNotification || false}
                            onChange={e =>
                                setcompany(prev => ({
                                    ...prev,
                                    telegram: {
                                        ...prev.telegram,
                                        individualNotification: e.target.checked
                                    }
                                }))
                            }
                            className="w-5 h-5 text-blue-600 bg-gray-200 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-gray-700 font-medium whitespace-nowrap">Individual Notifications</span>
                    </label>
                </div>
            </div>

            <Button className='float-end' variant="contained" loading={isload} onClick={handleSubmit}>
                Save Changes
            </Button>
        </div>
    );
};

export default TelegramSettings;
