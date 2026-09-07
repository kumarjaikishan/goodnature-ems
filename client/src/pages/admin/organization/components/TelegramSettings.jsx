import React from 'react';
import { Send } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const TelegramSettings = ({ companyinp, setcompany, handleChange, fetchgroup, teleloading, isload, handleSubmit }) => {
    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                    <Send size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-800">Telegram Bot Configuration</h3>
                    <p className="text-xs text-slate-500">Automate real-time attendance alerts to Telegram channels and employees</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Telegram Bot Token"
                    readOnly
                    disabled
                    value={companyinp?.telegram?.token || ""}
                />

                <Input
                    label="Group Chat ID"
                    placeholder="e.g. -10012345678"
                    value={companyinp?.telegram?.groupId || ""}
                    onChange={e => handleChange('telegram', 'groupId', e.target.value)}
                />
            </div>

            <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Main Channel Notifications</h4>
                        <p className="text-xs text-slate-500">Broadcast punch and daily summary alerts to the configured group</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={companyinp?.telegramNotifcation || false}
                            onChange={e =>
                                setcompany(prev => ({
                                    ...prev,
                                    telegramNotifcation: e.target.checked
                                }))
                            }
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Individual Alerts</h4>
                        <p className="text-xs text-slate-500">Send private direct messages to each employee's linked Telegram chat</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
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
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    variant="primary"
                    loading={isload}
                    onClick={handleSubmit}
                >
                    Update Integration
                </Button>
            </div>
        </div>
    );
};

export default TelegramSettings;
