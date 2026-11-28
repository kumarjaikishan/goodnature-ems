import React, { useMemo, useState } from 'react';
import {
    Clock, Sliders, Hourglass, Fingerprint, CalendarCheck,
    Save, AlertTriangle, RefreshCw, Check
} from 'lucide-react';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

const weekdays = [
    { label: 'Monday', short: 'Mon', value: 1 },
    { label: 'Tuesday', short: 'Tue', value: 2 },
    { label: 'Wednesday', short: 'Wed', value: 3 },
    { label: 'Thursday', short: 'Thu', value: 4 },
    { label: 'Friday', short: 'Fri', value: 5 },
    { label: 'Saturday', short: 'Sat', value: 6 },
    { label: 'Sunday', short: 'Sun', value: 0 },
];

const parseTimeToMinutes = (timeStr, fallback = 0) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return fallback;
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
    return h * 60 + m;
};

const minutesToTimeStr = (totalMins) => {
    const wrapped = ((Math.round(totalMins) % 1440) + 1440) % 1440;
    const h = String(Math.floor(wrapped / 60)).padStart(2, '0');
    const m = String(wrapped % 60).padStart(2, '0');
    return `${h}:${m}`;
};

const formatTime12h = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return timeStr || '—';
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

const formatDuration = (mins) => {
    const num = Number(mins);
    if (!Number.isFinite(num) || num <= 0) return '0m';
    const h = Math.floor(num / 60);
    const m = Math.round(num % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
};

const computeShiftMinutes = (inTime, outTime) => {
    const inMins = parseTimeToMinutes(inTime, 600);
    const outMins = parseTimeToMinutes(outTime, 1080);
    return outMins >= inMins ? outMins - inMins : (1440 - inMins) + outMins;
};

const AttendanceRules = ({
    companyinp,
    setcompany,
    handleChange,
    handleNestedChange,
    handleSubmit,
    isload
}) => {
    const [autoSync, setAutoSync] = useState(true);
    const [deductBreak, setDeductBreak] = useState(false);

    const officeIn = companyinp.officeTime?.in || '10:00';
    const officeOut = companyinp.officeTime?.out || '18:00';
    const breakMins = Number(companyinp.officeTime?.breakMinutes ?? 30);
    const lateGrace = Number(companyinp.gracePeriod?.lateEntryMinutes ?? 10);
    const earlyGrace = Number(companyinp.gracePeriod?.earlyExitMinutes ?? 10);

    const shiftDuration = useMemo(() => computeShiftMinutes(officeIn, officeOut), [officeIn, officeOut]);
    const expectedFullDay = useMemo(
        () => Math.max(60, deductBreak ? shiftDuration - breakMins : shiftDuration),
        [shiftDuration, breakMins, deductBreak]
    );

    const applyShiftCalculations = (nextIn, nextOut, nextBreak, nextDeductBreak, nextLateGrace, nextEarlyGrace) => {
        const gross = computeShiftMinutes(nextIn, nextOut);
        const fullDay = Math.max(60, nextDeductBreak ? gross - nextBreak : gross);
        const halfDay = Math.round(fullDay / 2);
        const shortDayThreshold = Math.max(0, fullDay - 10);
        const overtimeAfterMinutes = fullDay + 10;

        const inMins = parseTimeToMinutes(nextIn, 600);
        const outMins = parseTimeToMinutes(nextOut, 1080);

        setcompany((prev) => ({
            ...prev,
            officeTime: {
                ...prev.officeTime,
                in: nextIn,
                out: nextOut,
                breakMinutes: nextBreak,
            },
            gracePeriod: {
                ...prev.gracePeriod,
                lateEntryMinutes: nextLateGrace,
                earlyExitMinutes: nextEarlyGrace,
            },
            workingMinutes: {
                ...prev.workingMinutes,
                fullDay,
                halfDay,
                shortDayThreshold,
                overtimeAfterMinutes,
            },
            attendanceRules: {
                ...prev.attendanceRules,
                considerEarlyEntryBefore: minutesToTimeStr(inMins - 10),
                considerLateEntryAfter: minutesToTimeStr(inMins + nextLateGrace),
                considerEarlyExitBefore: minutesToTimeStr(outMins - nextEarlyGrace),
                considerLateExitAfter: minutesToTimeStr(outMins + 15),
            },
        }));
    };

    const handleShiftFieldChange = (field, value) => {
        const nextIn = field === 'in' ? value : officeIn;
        const nextOut = field === 'out' ? value : officeOut;
        const nextBreak = field === 'breakMinutes' ? Number(value) : breakMins;

        if (autoSync) {
            applyShiftCalculations(nextIn, nextOut, nextBreak, deductBreak, lateGrace, earlyGrace);
        } else {
            handleChange('officeTime', field, value);
        }
    };

    const handleFullDayChange = (value) => {
        const nextFull = Math.max(0, Number(value) || 0);
        if (autoSync) {
            setcompany((prev) => ({
                ...prev,
                workingMinutes: {
                    ...prev.workingMinutes,
                    fullDay: nextFull,
                    halfDay: Math.round(nextFull / 2),
                    shortDayThreshold: Math.max(0, nextFull - 10),
                    overtimeAfterMinutes: nextFull + 10,
                },
            }));
        } else {
            handleChange('workingMinutes', 'fullDay', nextFull);
        }
    };

    const handleGraceChange = (field, value) => {
        const num = Math.max(0, Number(value) || 0);
        const nextLate = field === 'lateEntryMinutes' ? num : lateGrace;
        const nextEarly = field === 'earlyExitMinutes' ? num : earlyGrace;
        const inMins = parseTimeToMinutes(officeIn, 600);
        const outMins = parseTimeToMinutes(officeOut, 1080);

        setcompany((prev) => ({
            ...prev,
            gracePeriod: {
                ...prev.gracePeriod,
                [field]: num,
            },
            ...(autoSync ? {
                attendanceRules: {
                    ...prev.attendanceRules,
                    considerLateEntryAfter: minutesToTimeStr(inMins + nextLate),
                    considerEarlyExitBefore: minutesToTimeStr(outMins - nextEarly),
                },
            } : {}),
        }));
    };

    const fullDayVal = Number(companyinp.workingMinutes?.fullDay ?? 480);
    const halfDayVal = Number(companyinp.workingMinutes?.halfDay ?? 240);
    const shortDayVal = Number(companyinp.workingMinutes?.shortDayThreshold ?? 360);
    const otAfterVal = Number(companyinp.workingMinutes?.overtimeAfterMinutes ?? 490);

    const validationIssues = useMemo(() => {
        const errors = [];
        const warnings = [];

        if (halfDayVal >= fullDayVal) {
            errors.push(`Half Day (${halfDayVal}m) must be less than Full Day (${fullDayVal}m).`);
        }
        if (shortDayVal > fullDayVal) {
            warnings.push(`Short Day threshold (${shortDayVal}m) is higher than Full Day (${fullDayVal}m).`);
        }
        if (shortDayVal < halfDayVal) {
            warnings.push(`Short Day threshold (${shortDayVal}m) is lower than Half Day (${halfDayVal}m).`);
        }
        if (otAfterVal < fullDayVal) {
            warnings.push(`Overtime After (${otAfterVal}m) is lower than Full Day (${fullDayVal}m).`);
        }
        if (Math.abs(fullDayVal - expectedFullDay) > 0) {
            warnings.push(
                `Shift duration is ${shiftDuration}m (${formatDuration(shiftDuration)}), while Full Day is set to ${fullDayVal}m (${formatDuration(fullDayVal)}).`
            );
        }

        const inStart = parseTimeToMinutes(companyinp.attendanceRules?.esslPunchInStart || '00:00');
        const inEnd = parseTimeToMinutes(companyinp.attendanceRules?.esslPunchInEnd || '23:59');
        const outStart = parseTimeToMinutes(companyinp.attendanceRules?.esslPunchOutStart || '00:00');
        const outEnd = parseTimeToMinutes(companyinp.attendanceRules?.esslPunchOutEnd || '23:59');
        if (inStart >= inEnd) errors.push('ESSL Punch-In Window Start must be before End.');
        if (outStart >= outEnd) errors.push('ESSL Punch-Out Window Start must be before End.');

        return { errors, warnings };
    }, [fullDayVal, halfDayVal, shortDayVal, otAfterVal, expectedFullDay, shiftDuration, companyinp.attendanceRules]);

    const onSaveClick = (e) => {
        if (validationIssues.errors.length > 0) {
            toast.error(validationIssues.errors[0]);
            return;
        }
        handleSubmit(e);
    };

    const handleWeeklyOffToggle = (dayVal) => {
        const currentOffs = companyinp?.weeklyOffs || [];
        const isSelected = currentOffs.includes(dayVal);
        const updated = isSelected
            ? currentOffs.filter(v => v !== dayVal)
            : [...currentOffs, dayVal];
        setcompany({ ...companyinp, weeklyOffs: updated });
    };

    return (
        <div className="w-full space-y-4">
            {/* Live Shift Summary Strip */}
            <div className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
                <div className="p-3 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Shift Window</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                        {formatTime12h(officeIn)} – {formatTime12h(officeOut)}
                    </span>
                    <span className="text-[11px] text-slate-500">{formatDuration(shiftDuration)} · {breakMins}m break</span>
                </div>
                <div className="p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Full Day</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{fullDayVal} min</span>
                    <span className="text-[11px] text-slate-500">{formatDuration(fullDayVal)}</span>
                </div>
                <div className="p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Half Day</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{halfDayVal} min</span>
                    <span className="text-[11px] text-slate-500">{formatDuration(halfDayVal)}</span>
                </div>
                <div className="p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Late After</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                        {formatTime12h(companyinp.attendanceRules?.considerLateEntryAfter || '10:10')}
                    </span>
                    <span className="text-[11px] text-slate-500">{lateGrace}m grace</span>
                </div>
                <div className="p-3">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Overtime After</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">{otAfterVal} min</span>
                    <span className="text-[11px] text-slate-500">{formatDuration(otAfterVal)}</span>
                </div>
            </div>

            {/* Validation Warnings / Mismatch Alert */}
            {(validationIssues.errors.length > 0 || validationIssues.warnings.length > 0) && (
                <div className={`rounded-lg border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    validationIssues.errors.length > 0
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                    <div className="flex items-start gap-2.5 text-xs">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            {validationIssues.errors.map((err, i) => (
                                <p key={`err-${i}`} className="font-semibold">{err}</p>
                            ))}
                            {validationIssues.warnings.map((warn, i) => (
                                <p key={`warn-${i}`} className="font-medium">{warn}</p>
                            ))}
                        </div>
                    </div>
                    {Math.abs(fullDayVal - expectedFullDay) > 0 && (
                        <button
                            type="button"
                            onClick={() => applyShiftCalculations(officeIn, officeOut, breakMins, deductBreak, lateGrace, earlyGrace)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold shrink-0 cursor-pointer transition"
                        >
                            <RefreshCw size={12} />
                            Sync to {expectedFullDay}m
                        </button>
                    )}
                </div>
            )}

            {/* 1. Standard Office Timings & Working Hours */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                            <Clock size={15} className="text-teal-700" />
                            Working Hours &amp; Shift Timings
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Define office shift timing, lunch breaks, and standard full/half day thresholds.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 accent-teal-700 rounded cursor-pointer"
                                checked={deductBreak}
                                onChange={(e) => {
                                    const nextDeduct = e.target.checked;
                                    setDeductBreak(nextDeduct);
                                    if (autoSync) {
                                        applyShiftCalculations(officeIn, officeOut, breakMins, nextDeduct, lateGrace, earlyGrace);
                                    }
                                }}
                            />
                            <span>Deduct Break</span>
                        </label>

                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 accent-teal-700 rounded cursor-pointer"
                                checked={autoSync}
                                onChange={(e) => setAutoSync(e.target.checked)}
                            />
                            <span>Auto-Sync from Shift</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                        label="Office Time In"
                        type="time"
                        value={officeIn}
                        onChange={e => handleShiftFieldChange('in', e.target.value)}
                    />

                    <Input
                        label="Office Time Out"
                        type="time"
                        value={officeOut}
                        onChange={e => handleShiftFieldChange('out', e.target.value)}
                    />

                    <NumberInput
                        label="Break Minutes"
                        value={breakMins}
                        onChange={e => handleShiftFieldChange('breakMinutes', Number(e.target.value))}
                        helperText={deductBreak ? 'Subtracted from Full Day' : 'Included in shift hours'}
                    />

                    <NumberInput
                        label="Full Day Minutes"
                        value={fullDayVal}
                        onChange={e => handleFullDayChange(e.target.value)}
                        helperText={`${fullDayVal} min = ${formatDuration(fullDayVal)}`}
                    />

                    <NumberInput
                        label="Half Day Minutes"
                        value={halfDayVal}
                        onChange={e => handleChange('workingMinutes', 'halfDay', Number(e.target.value))}
                        helperText={`${halfDayVal} min = ${formatDuration(halfDayVal)}`}
                    />

                    <NumberInput
                        label="Short Day Threshold (Min)"
                        value={shortDayVal}
                        onChange={e => handleChange('workingMinutes', 'shortDayThreshold', Number(e.target.value))}
                        helperText={`${formatDuration(shortDayVal)} — short day if below`}
                    />

                    <NumberInput
                        label="Overtime After (Min)"
                        value={otAfterVal}
                        onChange={e => handleChange('workingMinutes', 'overtimeAfterMinutes', Number(e.target.value))}
                        helperText={`${formatDuration(otAfterVal)} — OT starts after this`}
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
                        <p className="text-xs text-slate-500">Configure grace minutes and cutoff times for flagging early punch-ins, late arrivals, and early departures.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NumberInput
                        label="Late Entry Grace (Minutes)"
                        value={lateGrace}
                        onChange={e => handleGraceChange('lateEntryMinutes', e.target.value)}
                        helperText={`Auto-sets Late Entry After = ${formatTime12h(minutesToTimeStr(parseTimeToMinutes(officeIn, 600) + lateGrace))}`}
                    />

                    <NumberInput
                        label="Early Exit Grace (Minutes)"
                        value={earlyGrace}
                        onChange={e => handleGraceChange('earlyExitMinutes', e.target.value)}
                        helperText={`Auto-sets Early Exit Before = ${formatTime12h(minutesToTimeStr(parseTimeToMinutes(officeOut, 1080) - earlyGrace))}`}
                    />

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
                    onClick={onSaveClick}
                >
                    Save Attendance Settings
                </Button>
            </div>
        </div>
    );
};

export default AttendanceRules;
