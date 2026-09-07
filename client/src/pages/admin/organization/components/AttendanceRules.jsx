import React from 'react';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import Button from '@/components/ui/Button';

const weekdays = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
];

const AttendanceRules = ({ companyinp, setcompany, handleChange, handleNestedChange, handleSubmit, isload }) => {
    const handleWeeklyOffToggle = (dayVal) => {
        const currentOffs = companyinp?.weeklyOffs || [];
        const isSelected = currentOffs.includes(dayVal);
        const updated = isSelected
            ? currentOffs.filter(v => v !== dayVal)
            : [...currentOffs, dayVal];
        setcompany({ ...companyinp, weeklyOffs: updated });
    };

    return (
        <div className="space-y-6">
            {/* ================= OFFICE + WORKING ================= */}
            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Office & Working Hours</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Office Time In"
                        type="time"
                        value={companyinp.officeTime.in}
                        onChange={e => handleChange('officeTime', 'in', e.target.value)}
                    />

                    <Input
                        label="Office Time Out"
                        type="time"
                        value={companyinp.officeTime.out}
                        onChange={e => handleChange('officeTime', 'out', e.target.value)}
                    />

                    <NumberInput
                        label="Break Minutes"
                        value={companyinp.officeTime.breakMinutes}
                        onChange={e => handleChange('officeTime', 'breakMinutes', Number(e.target.value))}
                    />

                    <NumberInput
                        label="Full Day Minutes"
                        value={companyinp.workingMinutes.fullDay}
                        onChange={e => handleChange('workingMinutes', 'fullDay', Number(e.target.value))}
                    />

                    <NumberInput
                        label="Half Day Minutes"
                        value={companyinp.workingMinutes.halfDay}
                        onChange={e => handleChange('workingMinutes', 'halfDay', Number(e.target.value))}
                    />

                    <NumberInput
                        label="Short Day Threshold (Min)"
                        value={companyinp.workingMinutes.shortDayThreshold}
                        onChange={e => handleChange('workingMinutes', 'shortDayThreshold', Number(e.target.value))}
                    />

                    <NumberInput
                        label="Overtime After (Min)"
                        value={companyinp.workingMinutes.overtimeAfterMinutes}
                        onChange={e => handleChange('workingMinutes', 'overtimeAfterMinutes', Number(e.target.value))}
                    />

                    {/* Weekly Off Days Multi-select pills */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">Weekly Offs</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {weekdays.map(day => {
                                const isSelected = (companyinp.weeklyOffs || []).includes(day.value);
                                return (
                                    <button
                                        type="button"
                                        key={day.value}
                                        onClick={() => handleWeeklyOffToggle(day.value)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer select-none ${isSelected
                                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Overtime calculation mode */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Overtime & Short Calculation Mode</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                                checked={companyinp.workingMinutes?.allowFullOvertime || false}
                                onChange={e => handleChange('workingMinutes', 'allowFullOvertime', e.target.checked)}
                            />
                            <div className="text-xs">
                                <strong className="text-slate-800">Full Overtime</strong>
                                <span className="text-slate-500 ml-1">(Counted from Full Day, not OT threshold)</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                                checked={companyinp.workingMinutes?.allowFullShort || false}
                                onChange={e => handleChange('workingMinutes', 'allowFullShort', e.target.checked)}
                            />
                            <div className="text-xs">
                                <strong className="text-slate-800">Full Short</strong>
                                <span className="text-slate-500 ml-1">(Shortage counted from Full Day, not Short threshold)</span>
                            </div>
                        </label>
                    </div>
                    <p className="text-xs text-amber-800">
                        Example: Worked 495 min, Full Day=480, OT Threshold=490 →
                        Full OFF: 495−490 = 5 min OT | Full ON: 495−480 = 15 min OT
                    </p>
                </div>
            </div>

            {/* ================= ATTENDANCE RULES ================= */}
            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Early / Late Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="time"
                        label="Consider Early Entry Before"
                        value={companyinp.attendanceRules.considerEarlyEntryBefore}
                        onChange={e => handleChange('attendanceRules', 'considerEarlyEntryBefore', e.target.value)}
                    />
                    <Input
                        type="time"
                        label="Consider Late Entry After"
                        value={companyinp.attendanceRules.considerLateEntryAfter}
                        onChange={e => handleChange('attendanceRules', 'considerLateEntryAfter', e.target.value)}
                    />
                    <Input
                        type="time"
                        label="Consider Early Exit Before"
                        value={companyinp.attendanceRules.considerEarlyExitBefore}
                        onChange={e => handleChange('attendanceRules', 'considerEarlyExitBefore', e.target.value)}
                    />
                    <Input
                        type="time"
                        label="Consider Late Exit After"
                        value={companyinp.attendanceRules.considerLateExitAfter}
                        onChange={e => handleChange('attendanceRules', 'considerLateExitAfter', e.target.value)}
                    />
                </div>
            </div>

            {/* ================= ESSL PUNCH WINDOW ================= */}
            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Biometric Device Punch Windows</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="time"
                        label="ESSL Punch-In Start"
                        value={companyinp.attendanceRules.esslPunchInStart || "00:00"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchInStart', e.target.value)}
                        helperText="Punch-in will be accepted only after this time."
                    />

                    <Input
                        type="time"
                        label="ESSL Punch-In End"
                        value={companyinp.attendanceRules.esslPunchInEnd || "23:59"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchInEnd', e.target.value)}
                        helperText="Punch-in will be accepted only up to this time."
                    />

                    <Input
                        type="time"
                        label="ESSL Punch-Out Start"
                        value={companyinp.attendanceRules.esslPunchOutStart || "00:00"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchOutStart', e.target.value)}
                        helperText="Punch-out will be accepted only after this time."
                    />

                    <Input
                        type="time"
                        label="ESSL Punch-Out End"
                        value={companyinp.attendanceRules.esslPunchOutEnd || "23:59"}
                        onChange={e => handleChange('attendanceRules', 'esslPunchOutEnd', e.target.value)}
                        helperText="Punch-out will be accepted only up to this time."
                    />
                </div>
            </div>

            {/* ================= OVERTIME RULES ================= */}
            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Holiday & Off-day Overtime Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Holiday */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-slate-800 uppercase">Holidays</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                                checked={companyinp.overtimeRules?.holiday?.treatAllAsOvertime || false}
                                onChange={(e) =>
                                    handleNestedChange('overtimeRules', 'holiday', 'treatAllAsOvertime', e.target.checked)
                                }
                            />
                            <span className="text-xs font-medium text-slate-700">Treat all work on holidays as overtime</span>
                        </label>
                        <NumberInput
                            label="Min Minutes Required"
                            value={companyinp.overtimeRules?.holiday?.minMinutesRequired || 0}
                            onChange={(e) =>
                                handleNestedChange('overtimeRules', 'holiday', 'minMinutesRequired', Number(e.target.value))
                            }
                        />
                    </div>

                    {/* Weekly Off */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-slate-800 uppercase">Weekly Offs</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                                checked={companyinp.overtimeRules?.weeklyOff?.treatAllAsOvertime || false}
                                onChange={(e) =>
                                    handleNestedChange('overtimeRules', 'weeklyOff', 'treatAllAsOvertime', e.target.checked)
                                }
                            />
                            <span className="text-xs font-medium text-slate-700">Treat all work on weekly offs as overtime</span>
                        </label>
                        <NumberInput
                            label="Min Minutes Required"
                            value={companyinp.overtimeRules?.weeklyOff?.minMinutesRequired || 0}
                            onChange={(e) =>
                                handleNestedChange('overtimeRules', 'weeklyOff', 'minMinutesRequired', Number(e.target.value))
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button variant="primary" loading={isload} onClick={handleSubmit}>
                    Update Attendance Setting
                </Button>
            </div>
        </div>
    );
};

export default AttendanceRules;
