import { useDispatch, useSelector } from "react-redux";
import { toogleextendedonMobile, toogleliveAttandence, togglenotificationSound } from "../../store/userSlice";
import { Volume2, VolumeX, Bell, Play } from "lucide-react";
import { notificationSound } from "../utils/sound";

const Settings = () => {
    const dispatch = useDispatch();
    const extendedMobile = useSelector((state) => state.user.extendedonMobile);
    const user = useSelector((state) => state.user);
    const liveAttandence = useSelector((state) => state.user.liveAttandence);
    const soundEnabled = useSelector((state) => state.user.notificationSoundEnabled ?? true);

    const handleTestSound = () => {
        notificationSound.playSuccess();
    };

    return (
        <div className="p-2 sm:p-6 flex flex-col gap-5 max-w-4xl mx-auto">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
                <p className="text-xs text-slate-500 mt-0.5">Manage your application and notification preferences.</p>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                        <Bell size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Notification Preferences</h2>
                        <p className="text-xs text-slate-500">Configure alerts and audio feedback for system events.</p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {/* Live Attendance Notifications (Admins & Managers) */}
                    {user?.profile?.role && ["admin", "superadmin", "manager"].includes(user?.profile?.role) && (
                        <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/60 transition">
                            <div className="pr-4">
                                <span className="text-sm font-semibold text-slate-800 block">Live Attendance Popups</span>
                                <span className="text-xs text-slate-500">Show real-time toast alerts when employees punch in or out.</span>
                            </div>
                            <label className="inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={liveAttandence}
                                    onChange={() => dispatch(toogleliveAttandence())}
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700 relative"></div>
                            </label>
                        </div>
                    )}

                    {/* Notification Sound */}
                    <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/60 transition">
                        <div className="pr-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800">Notification Sound</span>
                                {soundEnabled ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/80">
                                        <Volume2 size={12} /> Enabled
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                        <VolumeX size={12} /> Muted
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                Play chime sound for attendance punch alerts, vouchers, and action confirmations.
                            </span>
                            {soundEnabled && (
                                <button
                                    type="button"
                                    onClick={handleTestSound}
                                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50/80 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition cursor-pointer"
                                >
                                    <Play size={11} className="fill-teal-700" /> Test Sound
                                </button>
                            )}
                        </div>
                        <label className="inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={soundEnabled}
                                onChange={() => dispatch(togglenotificationSound())}
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700 relative"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Display & Layout Preferences */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                        <span className="text-sm font-semibold text-slate-800 block">Extended Sidebar on Mobile</span>
                        <span className="text-xs text-slate-500">Keep navigation sidebar expanded when viewing on mobile screens.</span>
                    </div>
                    <label className="inline-flex items-center cursor-pointer shrink-0">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={extendedMobile}
                            onChange={() => dispatch(toogleextendedonMobile())}
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700 relative"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Settings;
