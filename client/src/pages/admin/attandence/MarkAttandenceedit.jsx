import React, { useEffect } from 'react';
import Modalbox from '../../../components/custommodal/Modalbox';
import { Send } from "lucide-react";
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { FirstFetch } from '../../../../store/userSlice';

// Custom UI Components
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const MarkAttandenceedit = ({ openmodal, setisload, dispatch, isPunchIn, init, setisPunchIn, submitHandle, setopenmodal, isUpdate, isload, inp, setinp, setisUpdate, onSuccess }) => {

    const editattandence = async (e) => {
        e.preventDefault();

        try {
            setisload(true);
            const data = await apiClient({
                url: "editattandence",
                method: "POST",
                body: inp
            });

            toast.success(data.message, { autoClose: 1800 });
            setinp(init);
            setopenmodal(false);
            if (onSuccess) onSuccess();
            else if (dispatch) dispatch(FirstFetch());
            return true;
        } catch (error) {
            console.error('Error editing attendance:', error);
            toast.error(error.message);
        } finally {
            setisload(false);
        }
    };

    useEffect(() => {
        if (!['weekly off', 'holiday', 'half day'].includes(inp.status)) {
            if (inp.punchIn || inp.punchOut) {
                setinp(prev => ({ ...prev, status: 'present' }));
            }
        }
    }, [inp.punchIn, inp.punchOut]);

    if (!openmodal) return null;

    const formattedDate = inp.date ? (dayjs.isDayjs(inp.date) ? inp.date.format('YYYY-MM-DD') : dayjs(inp.date).format('YYYY-MM-DD')) : '';

    return (
        <Modalbox
            open={openmodal}
            onClose={() => {
                setopenmodal(false);
                setisUpdate(false);
                setinp(init);
            }}
            title="Edit Attendance Record"
            subtitle="Update punch times, status, or leave notes"
            size="md"
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
                    <Button
                        size="sm"
                        variant="primary"
                        loading={isload}
                        icon={<Send size={14} />}
                        type="submit"
                        form="edit-attendance-form"
                    >
                        Update Attendance
                    </Button>
                </>
            }
        >
            <form id="edit-attendance-form" onSubmit={editattandence} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                        size="sm"
                        label="Attendance Date"
                        value={formattedDate}
                        readOnly
                    />
                    <Input
                        size="sm"
                        label="Employee Name"
                        value={inp.employeeName || ''}
                        readOnly
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Punch In Time</label>
                        <input
                            type="time"
                            disabled={["absent", 'leave'].includes(inp.status)}
                            className="w-full h-8 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-800 shadow-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                            value={inp.punchIn ? (dayjs.isDayjs(inp.punchIn) ? inp.punchIn.format('HH:mm') : dayjs(inp.punchIn).format('HH:mm')) : ''}
                            onChange={(e) => {
                                const timeStr = e.target.value;
                                setinp({
                                    ...inp,
                                    punchIn: timeStr ? dayjs(`${formattedDate}T${timeStr}`) : null
                                });
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Punch Out Time</label>
                        <input
                            type="time"
                            disabled={["absent", 'leave'].includes(inp.status)}
                            className="w-full h-8 rounded-lg border border-slate-300 px-2.5 text-xs text-slate-800 shadow-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
                            value={inp.punchOut ? (dayjs.isDayjs(inp.punchOut) ? inp.punchOut.format('HH:mm') : dayjs(inp.punchOut).format('HH:mm')) : ''}
                            onChange={(e) => {
                                const timeStr = e.target.value;
                                setinp({
                                    ...inp,
                                    punchOut: timeStr ? dayjs(`${formattedDate}T${timeStr}`) : null
                                });
                            }}
                        />
                    </div>
                </div>

                <Select
                    size="sm"
                    label="Attendance Status"
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

                {inp.status === 'leave' && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1">Leave Reason</label>
                        <textarea
                            rows={2}
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 outline-none placeholder:text-slate-400 resize-none transition-colors"
                            value={inp.leaveReason || ''}
                            onChange={(e) => setinp({ ...inp, leaveReason: e.target.value })}
                            placeholder="Provide leave reason..."
                        />
                    </div>
                )}
            </form>
        </Modalbox>
    );
};

export default MarkAttandenceedit;
