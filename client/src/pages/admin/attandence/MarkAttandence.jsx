import React, { useEffect, useState, useRef } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Autocomplete, Avatar, Box, Typography, CircularProgress, Chip } from '@mui/material';
import { Button, OutlinedInput } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { Send, User } from "lucide-react";
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { useSelector } from 'react-redux';
import Modalbox from '../../../components/custommodal/Modalbox';
import dayjs from 'dayjs';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import { getSingleEmployeeAttendanceApi } from '../../../api/attendance.api';

const MarkAttandence = ({ openmodal, isPunchIn, init, setisPunchIn, submitHandle, setopenmodal, isUpdate, isload, inp, setinp, setisUpdate }) => {

    const { department, employee } = useSelector((state) => state.user);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);
    const [existingRecord, setExistingRecord] = useState(null);

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

                    // Auto-fill form state based on existing record and action
                    setinp(prev => ({
                        ...prev,
                        punchIn: rec.punchIn ? dayjs(rec.punchIn) : (prev.punchIn || null),
                        punchOut: rec.punchOut ? dayjs(rec.punchOut) : (prev.punchOut || null),
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
        }
    }, [openmodal]);

    return (
        <Modalbox open={openmodal} onClose={() => setopenmodal(false)}>
            <div className="membermodal w-[500px]">
                <form onSubmit={submitHandle}>
                    <div className="flex items-center justify-between">
                        <h2>Mark Attendance</h2>
                        {fetchingAttendance && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                <CircularProgress size={14} />
                                <span>Checking attendance...</span>
                            </div>
                        )}
                    </div>

                    <span className="modalcontent">
                        <div className='flex flex-col gap-3'>
                            <FormControl sx={{ width: '100%' }} size="small">
                                <InputLabel id="demo-simple-select-helper-label">Action</InputLabel>
                                <Select
                                    labelId="demo-simple-select-helper-label"
                                    id="demo-simple-select-helper"
                                    value={isPunchIn}
                                    label="Action"
                                    required
                                    onChange={(e) => {
                                        setisPunchIn(e.target.value)
                                    }}
                                >
                                    <MenuItem value={true}>Punch In</MenuItem>
                                    <MenuItem value={false}>Punch Out</MenuItem>
                                </Select>
                            </FormControl>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                        },
                                    }}
                                    onChange={(newValue) => {
                                        setinp({
                                            ...inp, ['date']: newValue
                                        })
                                    }}
                                    format="DD-MM-YYYY"
                                    value={inp?.date}
                                    sx={{ width: '100%' }}
                                    label="Select date"
                                    maxDate={dayjs()}
                                />
                            </LocalizationProvider>

                            <Autocomplete
                                size="small"
                                fullWidth
                                value={employee?.find(emp => emp._id === inp.employeeId) || null}
                                options={employee?.filter(e => e.status !== false) || []}
                                getOptionLabel={(option) => option.userid.name} // still needed for filtering
                                onChange={(event, newValue) => {
                                    setinp({
                                        ...inp,
                                        employeeId: newValue ? newValue._id : '',
                                    })
                                }}
                                renderOption={(props, option) => {
                                    const { key, ...rest } = props; // destructure key out

                                    return (
                                        <Box key={option._id} // pass key directly
                                            component="li"
                                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                            {...rest} // spread the rest
                                        >
                                            <Avatar
                                                src={cloudinaryUrl(option.profileimage, {
                                                    format: "webp",
                                                    width: 100,
                                                    height: 100,
                                                })}
                                                alt={option.userid.name}>
                                                {!option.profileimage && <User size={16} />}
                                            </Avatar>
                                            <Box className=' capitalize'>
                                                <Typography variant="body2">{option.userid.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(option.designation)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                }}

                                renderInput={(params) => (
                                    <TextField {...params} label="Select Employee" required />
                                )}
                            />

                            {/* Existing Record Info Card */}
                            {existingRecord && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 text-xs text-gray-700 flex flex-col gap-1">
                                    <div className="font-semibold text-blue-800 flex items-center justify-between">
                                        <span>Existing Attendance Found</span>
                                        <span className="capitalize px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-medium">
                                            {existingRecord.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mt-0.5">
                                        <span>Punch In: <strong>{existingRecord.punchIn ? dayjs(existingRecord.punchIn).format('hh:mm A') : 'Not marked'}</strong></span>
                                        <span>Punch Out: <strong>{existingRecord.punchOut ? dayjs(existingRecord.punchOut).format('hh:mm A') : 'Not marked'}</strong></span>
                                    </div>
                                </div>
                            )}

                            <div className='flex gap-2 justify-between'>
                                {isPunchIn ?
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <TimePicker
                                            disabled={["absent", 'leave'].includes(inp.status)}
                                            value={inp.punchIn}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',

                                                },
                                            }}
                                            onChange={(newValue) => {
                                                setinp({
                                                    ...inp,
                                                    punchIn: newValue
                                                })
                                            }}
                                            sx={{ width: '100%' }}
                                            label="Punch In"
                                        />
                                    </LocalizationProvider> :
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <TimePicker
                                            value={inp.punchOut}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',

                                                },
                                            }}
                                            onChange={(newValue) => {
                                                setinp({
                                                    ...inp,
                                                    punchOut: newValue
                                                })
                                            }} sx={{ width: '100%' }} label="Punch Out" />
                                    </LocalizationProvider>
                                }
                                {isPunchIn &&
                                    <FormControl sx={{ width: '100%' }} size="small">
                                        <InputLabel id="demo-simple-select-helper-label">Status</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-helper-label"
                                            id="demo-simple-select-helper"
                                            value={inp.status}
                                            label="Status"
                                            required
                                            onChange={(e) => {
                                                setinp({
                                                    ...inp,
                                                    status: e.target.value
                                                });
                                            }}
                                        >
                                            <MenuItem value={'present'}>Present</MenuItem>
                                            <MenuItem value={'leave'}>Leave</MenuItem>
                                            <MenuItem value={'absent'}>Absent</MenuItem>
                                            <MenuItem value={'weekly off'}>Weekly off</MenuItem>
                                            <MenuItem value={'holiday'}>Holiday</MenuItem>
                                            <MenuItem value={'half day'}>Half Day</MenuItem>
                                        </Select>
                                    </FormControl>}
                            </div>
                            <TextField fullWidth multiline
                                onChange={(e) => {
                                    setinp({
                                        ...inp,
                                        reason: e.target.value
                                    });
                                }}
                                minRows={2} value={inp.reason || ''} label="Reason / Notes (Optional)" size="small" />

                            <div className='w-full flex gap-2'>
                                <Button size="small"
                                    onClick={() => {
                                        setopenmodal(false); setisUpdate(false); setinp(init)
                                    }}
                                    variant="outlined"> cancel</Button>
                                {!isUpdate && <Button

                                    loading={isload}
                                    loadingPosition="end"
                                    endIcon={<Send size={16} />}
                                    variant="contained"
                                    type="submit"
                                >
                                    Add
                                </Button>}
                            </div>
                        </div>
                    </span>
                </form>
            </div>
        </Modalbox>
    )
}

export default MarkAttandence

