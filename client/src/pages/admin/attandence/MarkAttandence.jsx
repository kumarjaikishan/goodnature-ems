import React, { useEffect, useMemo, useState } from 'react';
import Modalbox from '../../../components/custommodal/Modalbox';
import { Send, User, X, AlertCircle, Search } from "lucide-react";
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import EmployeeAvatar from '../../../components/common/EmployeeAvatar';
import { getSingleEmployeeAttendanceApi } from '../../../api/attendance.api';

// Custom UI Components
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DateInput from '../../../components/ui/DateInput';
import Select from '../../../components/ui/Select';

const MarkAttandence = ({ openmodal, isPunchIn, init, setisPunchIn, submitHandle, setopenmodal, isUpdate, isload, inp, setinp, setisUpdate }) => {
    const isDevMode = import.meta.env.DEV;
    const { department, employee } = useSelector((state) => state.user);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);
    const [existingRecord, setExistingRecord] = useState(null);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

    // Fetch existing attendance record when modal is open, employeeId is selected, and date is present
    useEffect(() => {
        let isCancelled = false;

        const checkExistingAttendance = async () => {
            if (!openmodal || !inp?.employeeId || !inp?.date) {
                setExistingRecord(null);
                return;
            }

            try {
                setFetchingAttendance(true);
                const formattedDate = dayjs(inp.date).format('YYYY-MM-DD');
                const res = await getSingleEmployeeAttendanceApi(inp.employeeId, formattedDate);
                
                if (isCancelled) return;

                if (res?.success && res?.data) {
                    const rec = res.data;
                    setExistingRecord(rec);

                    setinp(prev => ({
                        ...prev,
                        punchIn: rec.punchIn ? dayjs(rec.punchIn).format('HH:mm') : (prev.punchIn || ''),
                        punchOut: rec.punchOut ? dayjs(rec.punchOut).format('HH:mm') : (prev.punchOut || ''),
                        status: rec.status || prev.status || 'present',
                        reason: rec.remarks || prev.reason || '',
                    }));
                } else {
                    setExistingRecord(null);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Error fetching single employee attendance:", err);
                    setExistingRecord(null);
                }
            } finally {
                if (!isCancelled) {
                    setFetchingAttendance(false);
                }
            }
        };

        checkExistingAttendance();

        return () => {
            isCancelled = true;
        };
    }, [openmodal, inp?.employeeId, inp?.date]);

    // Keep attendance date locked to today in production; allow choosing date in development
    useEffect(() => {
        if (openmodal) {
            setinp(prev => {
                if (isDevMode) {
                    return prev?.date ? prev : { ...prev, date: dayjs() };
                }
                return prev?.date && dayjs(prev.date).isSame(dayjs(), 'day')
                    ? prev
                    : { ...prev, date: dayjs() };
            });
        } else {
            setExistingRecord(null);
            setEmployeeSearch('');
            setEmployeeDropdownOpen(false);
        }
    }, [openmodal, setinp, isDevMode]);

    const activeEmployees = useMemo(
        () => (employee || []).filter(e => e.status !== false),
        [employee]
    );
    const selectedEmp = useMemo(
        () => activeEmployees.find(e => e._id === inp.employeeId),
        [activeEmployees, inp.employeeId]
    );

    const filteredEmployees = useMemo(() => {
        const search = employeeSearch.toLowerCase().trim();
        if (!search) return activeEmployees;
        return activeEmployees.filter(e => {
            const name = e.userid?.name?.toLowerCase() || '';
            const desig = e.designation?.toLowerCase() || '';
            const empId = String(e.empId || '').toLowerCase();
            return name.includes(search) || desig.includes(search) || empId.includes(search);
        });
    }, [activeEmployees, employeeSearch]);

    if (!openmodal) return null;

    return (
        <Modalbox
            open={openmodal}
            onClose={() => setopenmodal(false)}
            title="Mark Individual Attendance"
            subtitle="Record live punch in/out timestamps or status manually"
            size="lg"
            footer={
                <>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setopenmodal(false);
                            setisUpdate(false);
                            setinp(init);
                        }}
                    >
                        Cancel
                    </Button>
                    {!isUpdate && (
                        <Button
                            size="sm"
                            variant="primary"
                            loading={isload}
                            icon={<Send size={14} />}
                            onClick={submitHandle}
                            type="button"
                        >
                            Submit Attendance
                        </Button>
                    )}
                </>
            }
        >
            <form onSubmit={submitHandle} className="space-y-4">
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            size="sm"
                            label="Action Type"
                            required
                            value={isPunchIn}
                            onChange={(e) => setisPunchIn(e.target.value === 'true' || e.target.value === true)}
                            options={[
                                { value: true, label: "Punch In (Check-in)" },
                                { value: false, label: "Punch Out (Check-out)" }
                            ]}
                        />

                        <DateInput
                            size="sm"
                            label="Attendance Date"
                            required
                            disabled={!isDevMode}
                            value={inp?.date ? dayjs(inp.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}
                            onChange={(e) => {
                                if (!isDevMode) return;
                                const val = e?.target?.value;
                                setinp((prev) => ({
                                    ...prev,
                                    date: val ? dayjs(val) : dayjs()
                                }));
                            }}
                        />
                    </div>

                    {/* Custom Searchable Employee Picker */}
                    <div className="relative">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            Select Employee <span className="text-rose-500">*</span>
                        </label>
                        
                        {/* Selector Trigger Button */}
                        <button
                            type="button"
                            onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-left shadow-xs hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                        >
                            {selectedEmp ? (
                                <div className="flex items-center gap-2 min-w-0">
                                    <EmployeeAvatar
                                        src={selectedEmp.profileimage}
                                        name={selectedEmp.userid?.name || ''}
                                        initials={selectedEmp.userid?.name?.charAt(0)?.toUpperCase() || 'E'}
                                        bgColor="#ccfbf1"
                                        textColor="#115e59"
                                        sizeClass="w-6 h-6"
                                        textClass="text-[10px]"
                                        width={80}
                                        height={80}
                                    />
                                    <span className="font-semibold text-slate-800 truncate">{selectedEmp.userid?.name}</span>
                                    <span className="text-slate-500 text-[11px] truncate">({selectedEmp.designation || 'Staff'})</span>
                                </div>
                            ) : (
                                <span className="text-slate-400">Choose an employee...</span>
                            )}
                            <Search size={14} className="text-slate-400 ml-2 shrink-0" />
                        </button>

                        {/* Searchable Dropdown Menu */}
                        {employeeDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                    <Search size={13} className="text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search by name or designation..."
                                        className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                                        value={employeeSearch}
                                        onChange={(e) => setEmployeeSearch(e.target.value)}
                                    />
                                    {employeeSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setEmployeeSearch('')}
                                            className="text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-48 overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
                                    {filteredEmployees.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-xs text-slate-400">
                                            No matching employees found
                                        </div>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <button
                                                key={emp._id}
                                                type="button"
                                                onClick={() => {
                                                    setinp({ ...inp, employeeId: emp._id });
                                                    setEmployeeDropdownOpen(false);
                                                    setEmployeeSearch('');
                                                }}
                                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 text-left transition-colors cursor-pointer ${
                                                    inp.employeeId === emp._id
                                                        ? 'bg-teal-50 text-teal-900 font-semibold'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <EmployeeAvatar
                                                    src={emp.profileimage}
                                                    name={emp.userid?.name || ''}
                                                    initials={emp.userid?.name?.charAt(0)?.toUpperCase() || 'E'}
                                                    bgColor="#ccfbf1"
                                                    textColor="#115e59"
                                                    sizeClass="w-7 h-7"
                                                    textClass="text-xs"
                                                    width={80}
                                                    height={80}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 truncate">{emp.userid?.name}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{emp.designation || 'Staff'}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Existing Record Info Card */}
                    {existingRecord && (
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-slate-700 flex flex-col gap-1">
                            <div className="font-semibold text-sky-900 flex items-center justify-between">
                                <span>Existing Attendance Found</span>
                                <span className="capitalize px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 font-bold text-[10px]">
                                    {existingRecord.status}
                                </span>
                            </div>
                            <div className="flex gap-4 mt-1 text-[11px]">
                                <span>Punch In: <strong>{existingRecord.punchIn ? dayjs(existingRecord.punchIn).format('hh:mm A') : 'Not marked'}</strong></span>
                                <span>Punch Out: <strong>{existingRecord.punchOut ? dayjs(existingRecord.punchOut).format('hh:mm A') : 'Not marked'}</strong></span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                {isPunchIn ? "Punch In Time" : "Punch Out Time"}
                            </label>
                            <input
                                type="time"
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                                value={isPunchIn ? (inp.punchIn ? (dayjs.isDayjs(inp.punchIn) ? inp.punchIn.format('HH:mm') : inp.punchIn) : '') : (inp.punchOut ? (dayjs.isDayjs(inp.punchOut) ? inp.punchOut.format('HH:mm') : inp.punchOut) : '')}
                                onChange={(e) => {
                                    const timeStr = e.target.value;
                                    if (isPunchIn) {
                                        setinp({ ...inp, punchIn: timeStr ? dayjs(`${dayjs(inp.date).format('YYYY-MM-DD')}T${timeStr}`) : null });
                                    } else {
                                        setinp({ ...inp, punchOut: timeStr ? dayjs(`${dayjs(inp.date).format('YYYY-MM-DD')}T${timeStr}`) : null });
                                    }
                                }}
                            />
                        </div>

                        {isPunchIn && (
                            <Select
                                size="sm"
                                label="Status"
                                required
                                value={inp.status || 'present'}
                                onChange={(e) => setinp({ ...inp, status: e.target.value })}
                                options={[
                                    { value: 'present', label: 'Present' },
                                    { value: 'leave', label: 'Leave' },
                                    { value: 'absent', label: 'Absent' },
                                    { value: 'weekly off', label: 'Weekly off' },
                                    { value: 'holiday', label: 'Holiday' },
                                    { value: 'half day', label: 'Half Day' }
                                ]}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Notes (Optional)</label>
                        <textarea
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 resize-none transition-colors"
                            value={inp.reason || ''}
                            onChange={(e) => setinp({ ...inp, reason: e.target.value })}
                            placeholder="Any additional notes..."
                        />
                    </div>
                </div>
            </form>
        </Modalbox>
    );
};

export default MarkAttandence;
