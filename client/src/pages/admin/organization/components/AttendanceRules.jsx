import React from 'react';
import {
    Clock, Sliders, Hourglass, Fingerprint, CalendarCheck,
    Save, ShieldCheck, Info, CheckSquare, Sparkles, Check
} from 'lucide-react';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import Button from '@/components/ui/Button';

const weekdays = [
    { label: 'Monday', short: 'Mon', value: 1 },
    { label: 'Tuesday', short: 'Tue', value: 2 },
    { label: 'Wednesday', short: 'Wed', value: 3 },
    { label: 'Thursday', short: 'Thu', value: 4 },
    { label: 'Friday', short: 'Fri', value: 5 },
    { label: 'Saturday', short: 'Sat', value: 6 },
    { label: 'Sunday', short: 'Sun', value: 0 },
];

const AttendanceRules = ({
    companyinp,
    setcompany,
    handleChange,
    handleNestedChange,
    handleSubmit,
    isload
}) => {
    const handleWeeklyOffToggle = (dayVal) => {
        const currentOffs = companyinp?.weeklyOffs || [];
        const isSelected = currentOffs.includes(dayVal);
        const updated = isSelected
            ? currentOffs.filter(v => v !== dayVal)
            : [...currentOffs, dayVal];
        setcompany({ ...companyinp, weeklyOffs: updated });
    };

    return (
        <div className="w-full space-y-6">
            {/* 1. Standard Office Timings & Working Hours */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Working Hours & Shift Timings</h4>
                        <p className="text-xs text-slate-500">Define office shift timing, lunch breaks, and standard full/half day thresholds.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                        label="Office Time In"
                        type="time"
                        value={companyinp.officeTime?.in || '10:00'}
                        onChange={e => handleChange('officeTime', 'in', e.target.value)}
                    />

                    <Input
                        label="Office Time Out"
                        type="time"
                        value={companyinp.officeTime?.out || '18:00'}
                        onChange={e => handleChange('officeTime', 'out', e.target.value)}
                    />

                    <NumberInput
                        label="Break Minutes"
                        value={companyinp.officeTime?.breakMinutes || 30}
                        onChange={e => handleChange('officeTime', 'breakMinutes', Number(e.target.value))}
                    />

                    <NumberInput
                        label="Full Day Minutes"
                        value={companyinp.workingMinutes?.fullDay || 480}
                        onChange={e => handleChange('workingMinutes', 'fullDay', Number(e.target.value))}
                        helperText="e.g. 480 min = 8 hours"
                    />

                    <NumberInput
                        label="Half Day Minutes"
                        value={companyinp.workingMinutes?.halfDay || 240}
                        onChange={e => handleChange('workingMinutes', 'halfDay', Number(e.target.value))}
                        helperText="e.g. 240 min = 4 hours"
                    />

                    <NumberInput
                        label="Short Day Threshold (Min)"
                        value={companyinp.workingMinutes?.shortDayThreshold || 360}
                        onChange={e => handleChange('workingMinutes', 'shortDayThreshold', Number(e.target.value))}
                        helperText="Marked short day if below this"
                    />

                    <NumberInput
                        label="Overtime After (Min)"
                        value={companyinp.workingMinutes?.overtimeAfterMinutes || 490}
                        onChange={e => handleChange('workingMinutes', 'overtimeAfterMinutes', Number(e.target.value))}
                        helperText="OT counted after this limit"
                    />

                    {/* Weekly Off Days Multi-select pills */}
                    <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">
                            Company Weekly Off Days
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {weekdays.map(day => {
                                const isSelected = (companyinp.weeklyOffs || []).includes(day.value);
                                return (
                                    <button
                                        type="button"
                                        key={day.value}
                                        onClick={() => handleWeeklyOffToggle(day.value)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer select-none inline-flex items-center gap-1.5 ${isSelected
                                            ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        {isSelected && <Check size={13} className="text-white" />}
                                        <span>{day.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Overtime calculation mode box */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-amber-900">
                        <Sliders size={15} className="text-amber-800" />
                        <h5 className="text-xs font-bold uppercase tracking-wider">Overtime & Shortage Calculation Mode</h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer select-none hover:bg-amber-50/40 transition">
                            <input
                                type="checkbox"
                                className="w-4 h-4 mt-0.5 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 cursor-pointer"
                                checked={companyinp.workingMinutes?.allowFullOvertime || false}
                                onChange={e => handleChange('workingMinutes', 'allowFullOvertime', e.target.checked)}
                            />
                            <div className="text-xs">
                                <strong className="text-slate-800 block font-bold">Full Overtime Mode</strong>
                                <span className="text-slate-500 leading-relaxed text-[11px] block mt-0.5">
                                    Calculate OT minutes strictly from Full Day baseline (e.g. 480m) rather than the OT threshold margin.
                                </span>
                            </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-200 cursor-pointer select-none hover:bg-amber-50/40 transition">
                            <input
                                type="checkbox"
                                className="w-4 h-4 mt-0.5 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 cursor-pointer"
                                checked={companyinp.workingMinutes?.allowFullShort || false}
                                onChange={e => handleChange('workingMinutes', 'allowFullShort', e.target.checked)}
                            />
                            <div className="text-xs">
                                <strong className="text-slate-800 block font-bold">Full Shortage Mode</strong>
                                <span className="text-slate-500 leading-relaxed text-[11px] block mt-0.5">
                                    Calculate short minutes strictly from Full Day baseline rather than the short-day threshold margin.
                                </span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* 2. Punctuality, Grace & Early/Late Thresholds */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                        <Hourglass size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Early & Late Entry/Exit Thresholds</h4>
                        <p className="text-xs text-slate-500">Configure cutoff times for flagging early punch-ins, late arrivals, and early departures.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        type="time"
                        label="Consider Early Entry Before"
                        value={companyinp.attendanceRules?.considerEarlyEntryBefore || '09:50'}
                        onChange={e => handleChange('attendanceRules', 'considerEarlyEntryBefore', e.target.value)}
                        helperText="Punches before this time are flagged as early arrival"
                    />

                    <Input
                        type="time"
                        label="Consider Late Entry After"
                        value={companyinp.attendanceRules?.considerLateEntryAfter || '10:10'}
                        onChange={e => handleChange('attendanceRules', 'considerLateEntryAfter', e.target.value)}
                        helperText="Punches after this time trigger a late mark"
                    />

                    <Input
                        type="time"
                        label="Consider Early Exit Before"
                        value={companyinp.attendanceRules?.considerEarlyExitBefore || '17:50'}
                        onChange={e => handleChange('attendanceRules', 'considerEarlyExitBefore', e.target.value)}
                        helperText="Leaving before this time triggers an early exit mark"
                    />

                    <Input
                        type="time"
                        label="Consider Late Exit After"
                        value={companyinp.attendanceRules?.considerLateExitAfter || '18:15'}
                        onChange={e => handleChange('attendanceRules', 'considerLateExitAfter', e.target.value)}
                        helperText="Leaving after this time starts counting towards overtime"
                    />
                </div>
            </div>

            {/* 3. Biometric ESSL Device Punch Windows */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                        <Fingerprint size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Biometric ESSL Punch Windows</h4>
                        <p className="text-xs text-slate-500">Define valid time boundaries within which employee punches are recorded.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        type="time"
                        label="ESSL Punch-In Window Start"
                        value={companyinp.attendanceRules?.esslPunchInStart || "00:00"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchInStart', e.target.value)}
                        helperText="Punch-in will be accepted only after this time"
                    />

                    <Input
                        type="time"
                        label="ESSL Punch-In Window End"
                        value={companyinp.attendanceRules?.esslPunchInEnd || "23:59"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchInEnd', e.target.value)}
                        helperText="Punch-in will be accepted only up to this time"
                    />

                    <Input
                        type="time"
                        label="ESSL Punch-Out Window Start"
                        value={companyinp.attendanceRules?.esslPunchOutStart || "00:00"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchOutStart', e.target.value)}
                        helperText="Punch-out will be accepted only after this time"
                    />

                    <Input
                        type="time"
                        label="ESSL Punch-Out Window End"
                        value={companyinp.attendanceRules?.esslPunchOutEnd || "23:59"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchOutEnd', e.target.value)}
                        helperText="Punch-out will be accepted only up to this time"
                    />
                </div>
            </div>

            {/* 4. Holiday & Weekly Off Overtime Rules */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                        <CalendarCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Holiday & Weekly Off-Day Overtime Rules</h4>
                        <p className="text-xs text-slate-500">Configure overtime calculation and minimum presence requirements on non-working days.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Holiday Overtime Box */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            National & Festival Holidays
                        </span>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 cursor-pointer"
                                checked={companyinp.overtimeRules?.holiday?.treatAllAsOvertime || false}
                                onChange={(e) =>
                                    handleNestedChange('overtimeRules', 'holiday', 'treatAllAsOvertime', e.target.checked)
                                }
                            />
                            <span className="text-xs font-semibold text-slate-700">Treat all work on holidays as overtime</span>
                        </label>
                        <NumberInput
                            label="Min Minutes Required"
                            value={companyinp.overtimeRules?.holiday?.minMinutesRequired || 0}
                            onChange={(e) =>
                                handleNestedChange('overtimeRules', 'holiday', 'minMinutesRequired', Number(e.target.value))
                            }
                            helperText="Minimum minutes employee must log on holidays"
                        />
                    </div>

                    {/* Weekly Off Overtime Box */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                            Weekly Off Days (Sundays/Custom)
                        </span>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 cursor-pointer"
                                checked={companyinp.overtimeRules?.weeklyOff?.treatAllAsOvertime || false}
                                onChange={(e) =>
                                    handleNestedChange('overtimeRules', 'weeklyOff', 'treatAllAsOvertime', e.target.checked)
                                }
                            />
                            <span className="text-xs font-semibold text-slate-700">Treat all work on weekly offs as overtime</span>
                        </label>
                        <NumberInput
                            label="Min Minutes Required"
                            value={companyinp.overtimeRules?.weeklyOff?.minMinutesRequired || 0}
                            onChange={(e) =>
                                handleNestedChange('overtimeRules', 'weeklyOff', 'minMinutesRequired', Number(e.target.value))
                            }
                            helperText="Minimum minutes employee must log on off-days"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Changes will apply across all branches unless branch-specific timing overrides are enabled.
                </span>
                <Button
                    variant="primary"
                    loading={isload}
                    startIcon={Save}
                    onClick={handleSubmit}
                >
                    Save Attendance Settings
                </Button>
            </div>
        </div>
    );
};

export default AttendanceRules;
