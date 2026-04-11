import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, OutlinedInput, MenuItem, Checkbox, ListItemText, FormControlLabel, Button } from '@mui/material';

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
    return (
        <Box className="space-y-5">
            {/* ================= OFFICE + WORKING ================= */}
            <Box className="p-4 bg-white rounded shadow grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextField
                    label="Office Time In"
                    type="time"
                    fullWidth
                    value={companyinp.officeTime.in}
                    onChange={e => handleChange('officeTime', 'in', e.target.value)}
                />

                <TextField
                    label="Office Time Out"
                    type="time"
                    fullWidth
                    value={companyinp.officeTime.out}
                    onChange={e => handleChange('officeTime', 'out', e.target.value)}
                />

                <TextField
                    label="Break Minutes"
                    type="number"
                    fullWidth
                    value={companyinp.officeTime.breakMinutes}
                    onChange={e => handleChange('officeTime', 'breakMinutes', Number(e.target.value))}
                />

                <TextField
                    label="Full Day Minutes"
                    type="number"
                    fullWidth
                    value={companyinp.workingMinutes.fullDay}
                    onChange={e => handleChange('workingMinutes', 'fullDay', Number(e.target.value))}
                />

                <TextField
                    label="Half Day Minutes"
                    type="number"
                    fullWidth
                    value={companyinp.workingMinutes.halfDay}
                    onChange={e => handleChange('workingMinutes', 'halfDay', Number(e.target.value))}
                />

                <TextField
                    label="Short Day Threshold"
                    type="number"
                    fullWidth
                    value={companyinp.workingMinutes.shortDayThreshold}
                    onChange={e => handleChange('workingMinutes', 'shortDayThreshold', Number(e.target.value))}
                />

                <TextField
                    label="Overtime After Minutes"
                    type="number"
                    fullWidth
                    value={companyinp.workingMinutes.overtimeAfterMinutes}
                    onChange={e => handleChange('workingMinutes', 'overtimeAfterMinutes', Number(e.target.value))}
                />

                {/* Weekly Off */}
                <FormControl fullWidth className="md:col-span-2">
                    <InputLabel>Weekly Offs</InputLabel>
                    <Select
                        multiple
                        value={companyinp.weeklyOffs}
                        onChange={e => setcompany({ ...companyinp, weeklyOffs: e.target.value })}
                        input={<OutlinedInput label="Weekly Offs" />}
                        renderValue={(selected) =>
                            selected.map(v => weekdays.find(w => w.value === v)?.label).join(', ')
                        }
                    >
                        {weekdays.map(day => (
                            <MenuItem key={day.value} value={day.value}>
                                <Checkbox checked={companyinp.weeklyOffs.includes(day.value)} />
                                <ListItemText primary={day.label} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* ================= ATTENDANCE RULES ================= */}
            <Box className="p-4 bg-white rounded shadow grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(companyinp.attendanceRules).map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    return (
                        <TextField
                            key={key}
                            fullWidth
                            type="time"
                            label={label}
                            value={value}
                            onChange={e => handleChange('attendanceRules', key, e.target.value)}
                        />
                    );
                })}
            </Box>

            {/* ================= OVERTIME RULES ================= */}
            <Box className="p-4 bg-white rounded shadow">
                <h3 className="text-lg font-semibold mb-4">Overtime Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Holiday */}
                    <Box className="p-3 border rounded space-y-2">
                        <p className="font-medium">Holiday</p>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={companyinp.overtimeRules?.holiday?.treatAllAsOvertime || false}
                                    onChange={(e) =>
                                        handleNestedChange('overtimeRules', 'holiday', 'treatAllAsOvertime', e.target.checked)
                                    }
                                />
                            }
                            label="Treat all work as overtime"
                        />
                        <TextField
                            label="Min Minutes Required"
                            type="number"
                            fullWidth
                            value={companyinp.overtimeRules?.holiday?.minMinutesRequired || 0}
                            onChange={(e) =>
                                handleNestedChange('overtimeRules', 'holiday', 'minMinutesRequired', Number(e.target.value))
                            }
                        />
                    </Box>

                    {/* Weekly Off */}
                    <Box className="p-3 border rounded space-y-2">
                        <p className="font-medium">Weekly Off</p>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={companyinp.overtimeRules?.weeklyOff?.treatAllAsOvertime || false}
                                    onChange={(e) =>
                                        handleNestedChange('overtimeRules', 'weeklyOff', 'treatAllAsOvertime', e.target.checked)
                                    }
                                />
                            }
                            label="Treat all work as overtime"
                        />
                        <TextField
                            label="Min Minutes Required"
                            type="number"
                            fullWidth
                            value={companyinp.overtimeRules?.weeklyOff?.minMinutesRequired || 0}
                            onChange={(e) =>
                                handleNestedChange('overtimeRules', 'weeklyOff', 'minMinutesRequired', Number(e.target.value))
                            }
                        />
                    </Box>
                </div>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
                <Button variant="contained" loading={isload} onClick={handleSubmit}>
                    Update Attendance Setting
                </Button>
            </Box>
        </Box>
    );
};

export default AttendanceRules;
