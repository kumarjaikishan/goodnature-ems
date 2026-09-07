import React, { useEffect, useState } from 'react';
import Modalbox from '../../../components/custommodal/Modalbox';
import { Send, User, X, AlertCircle } from "lucide-react";
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import { getSingleEmployeeAttendanceApi } from '../../../api/attendance.api';

// Custom UI Components
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DateInput from '../../../components/ui/DateInput';
import Select from '../../../components/ui/Select';

const MarkAttandence = ({ openmodal, isPunchIn, init, setisPunchIn, submitHandle, setopenmodal, isUpdate, isload, inp, setinp, setisUpdate }) => {
    const { department, employee } = useSelector((state) => state.user);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);
    const [existingRecord, setExistingRecord] = useState(null);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

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

    // Reset existing record when modal closes
    useEffect(() => {
        if (!openmodal) {
            setExistingRecord(null);
            setEmployeeSearch('');
            setShowDropdown(false);
        }
    }, [openmodal]);

    const activeEmployees = (employee || []).filter(e => e.status !== false);
    const selectedEmp = activeEmployees.find(e => e._id === inp.employeeId);

    const filteredEmployees = activeEmployees.filter(e => {
        const name = e.userid?.name?.toLowerCase() || '';
        const desig = e.designation?.toLowerCase() || '';
        const search = employeeSearch.toLowerCase();
        return name.includes(search) || desig.includes(search);
    });

    if (!openmodal) return null;

    return (
        <Modalbox open={openmodal} onClose={() => setopenmodal(false)}>
            <div className="w-full max-w-lg p-6 space-y-4 bg-white rounded-2xl">
                <form onSubmit={submitHandle} className="space-y-4">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Mark Individual Attendance</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Record live punch in/out timestamps or status manually</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setopenmodal(false)}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-3">
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
                            value={inp?.date ? (dayjs.isDayjs(inp.date) ? (inp.date.isValid() ? inp.date.format('YYYY-MM-DD') : '') : dayjs(inp.date).isValid() ? dayjs(inp.date).format('YYYY-MM-DD') : '') : ''}
                            onChange={(e) => {
                                const val = e?.target?.value !== undefined ? e.target.value : e;
                                setinp({ ...inp, date: val ? dayjs(val) : null });
                            }}
                        />

                        {/* Custom Searchable Employee Picker */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                                Select Employee <span className="text-rose-500">*</span>
                            </label>
                            
                            {selectedEmp ? (
                                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-300 bg-slate-50">
                                    <div className="flex items-center gap-2.5">
                                        {selectedEmp.profileimage ? (
                                            <img
                                                src={cloudinaryUrl(selectedEmp.profileimage, { format: "webp", width: 80, height: 80 })}
                                                alt={selectedEmp.userid?.name}
                                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                                                {selectedEmp.userid?.name?.charAt(0) || 'E'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">{selectedEmp.userid?.name}</p>
                                            <p className="text-[10px] text-slate-500">{selectedEmp.designation || 'Staff'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setinp({ ...inp, employeeId: '' });
                                            setEmployeeSearch('');
                                        }}
                                        className="text-xs text-rose-600 hover:underline font-medium"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Input
                                        size="sm"
                                        placeholder="Search employee by name..."
                                        value={employeeSearch}
                                        onChange={(e) => {
                                            setEmployeeSearch(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                    {showDropdown && (
                                        <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-30 divide-y divide-slate-100">
                                            {filteredEmployees.length === 0 ? (
                                                <div className="p-3 text-xs text-slate-400 text-center">No employee found</div>
                                            ) : (
                                                filteredEmployees.map(emp => (
                                                    <button
                                                        key={emp._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setinp({ ...inp, employeeId: emp._id });
                                                            setShowDropdown(false);
                                                        }}
                                                        className="w-full text-left p-2 hover:bg-teal-50/50 flex items-center gap-2.5 transition-colors"
                                                    >
                                                        {emp.profileimage ? (
                                                            <img
                                                                src={cloudinaryUrl(emp.profileimage, { format: "webp", width: 80, height: 80 })}
                                                                alt={emp.userid?.name}
                                                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                                                                {emp.userid?.name?.charAt(0) || 'E'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">{emp.userid?.name}</p>
                                                            <p className="text-[10px] text-slate-500 truncate">{emp.designation || 'Staff'}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
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

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
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
                                type="submit"
                            >
                                Submit Attendance
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Modalbox>
    );
};

export default MarkAttandence;
