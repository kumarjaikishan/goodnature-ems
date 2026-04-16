import React, { useEffect, useState } from 'react';
import {
  Box, Button, TextField, MenuItem,
  FormControl, InputLabel, Select, OutlinedInput, Checkbox,
  ListItemText, Grid, Avatar, FormControlLabel
} from '@mui/material';
import { toast } from 'react-toastify';
import { FaRegUser } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { FirstFetch } from '../../../../store/userSlice';
import { apiClient } from '../../../utils/apiClient';

const weekdays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const Addbranch = ({ setopenviewmodal, employee, company, editbranch, editbranchdata }) => {

  const init = {
    id: '',
    name: '',
    location: '',
    companyId: '',
    managerIds: [],
    defaultsetting: true,
    setting: {
      officeTime: { in: '10:00', out: '18:00', breakMinutes: 30 },
      gracePeriod: { lateEntryMinutes: 10, earlyExitMinutes: 10 },
      workingMinutes: {
        fullDay: 480,
        halfDay: 240,
        shortDayThreshold: 270,
        overtimeAfterMinutes: 480
      },
      weeklyOffs: [0],
      attendanceRules: {
        considerEarlyEntryBefore: '09:50',
        considerLateEntryAfter: '10:10',
        considerEarlyExitBefore: '17:50',
        considerLateExitAfter: '18:15',
        esslPunchInStart: '00:00',
        esslPunchInEnd: '23:59',
        esslPunchOutStart: '00:00',
        esslPunchOutEnd: '23:59'
      }
    }
  }
  const [branch, setBranch] = useState(init);
  const dispatch = useDispatch();

  const { adminManager } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('emstoken');

  // Fetch companies and users
  useEffect(() => {
    // console.log(employee)
    // setUsers(employee)
    setBranch(prev => ({ ...prev, companyId: company._id }))
    // if (editbranch) setBranch(editbranchdata)
    if (editbranch) {
      setBranch(prev => ({
        ...prev,
        ...editbranchdata,
        setting: {
          ...prev.setting,
          ...(editbranchdata?.setting || {}),
          attendanceRules: {
            ...prev.setting.attendanceRules,
            ...(editbranchdata?.setting?.attendanceRules || {})
          }
        }
      }))
    }
  }, [company, editbranch]);

  useEffect(() => {
    // console.log(adminManager)
    if (adminManager?.length > 0) {
      setUsers(adminManager.filter(e => e.role === 'manager'))
    }
  }, [adminManager]);

  const cancele = () => {
    setopenviewmodal(false)
    setBranch(init)
  }

  // Field handler
  const handleFieldChange = (field, value) => {
    setBranch(prev => ({ ...prev, [field]: value }));
  };

  // Nested handler (for setting fields)
  const handleSettingChange = (section, key, value) => {
    setBranch(prev => ({
      ...prev,
      setting: {
        ...prev.setting,
        [section]: { ...prev.setting[section], [key]: value }
      }
    }));
  };

  // Submit handler
  const handleSubmit = async () => {
    try {
      const data = await apiClient({
        url: "addBranch",
        method: "POST",
        body: branch
      });
      toast.success(data.message);
      setopenviewmodal(false)
      dispatch(FirstFetch());
      cancele();
    } catch (err) {
      console.error('Error adding branch:', err);
    }
  };

  const edite = async () => {
    try {
      const data = await apiClient({
        url: "editBranch",
        method: "POST",
        body: branch
      });
      toast.success(data.message);
      dispatch(FirstFetch());
      setopenviewmodal(false)
      cancele();
    } catch (err) {
      console.error('Error editing branch:', err);
    }
  };

  return (
    <div className='whole'>
      <div className='modalhead'>{editbranch ? 'Edit Branch' : 'Add New Branch'}</div>
      <span className="modalcontent">
        <div className='flex flex-col gap-3 w-full'>
          <TextField
            label="Branch Name"
            fullWidth
            size='small'
            value={branch.name}
            onChange={e => handleFieldChange('name', e.target.value)}
            required
            helperText="Enter the official branch name"
          />

          <TextField
            label="Location"
            fullWidth
            size='small'
            value={branch.location}
            onChange={e => handleFieldChange('location', e.target.value)}
            helperText="City, State or Address"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Managers</InputLabel>
            <Select
              multiple
              value={branch?.managerIds || []}   // ✅ safe fallback
              onChange={(e) => handleFieldChange('managerIds', e.target.value)}
              input={<OutlinedInput label="Managers" />}
              renderValue={(selected) =>
                selected
                  .map((id) => users.find((user) => user._id === id)?.name || "Unknown")
                  .join(", ")
              }
            >
              {users && users.length > 0 ? (
                users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    <Checkbox checked={branch?.managerIds?.includes(user._id)} />
                    <Avatar src={user?.profileImage} alt={user?.name}>
                      {!user?.profileImage && <FaRegUser />}
                    </Avatar>
                    <ListItemText className="ml-2 capitalize" primary={user?.name} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  <ListItemText className="ml-2 capitalize" primary="No Manager Found" />
                </MenuItem>
              )}
            </Select>
          </FormControl>

        </div>

        {/* Attendance Override */}
        <FormControlLabel
          control={
            <Checkbox
              checked={!branch.defaultsetting}
              onChange={e => setBranch(prev => ({ ...prev, defaultsetting: !e.target.checked }))}
            />
          }
          label="Override company default attendance settings"
          sx={{ mt: 2 }}
        />

        {!branch.defaultsetting && (
          <div className="border-primary border-2 border-dashed rounded mt-3 py-3 px-1">
            <Box className="mt-1 p-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextField
                label="Office Time In"
                type="time"
                fullWidth
                size='small'
                value={branch.setting.officeTime.in}
                InputLabelProps={{ shrink: true }}
                onChange={e => handleSettingChange('officeTime', 'in', e.target.value)}
                helperText="Time when office hours begin"
              />

              <TextField
                label="Office Time Out"
                type="time"
                fullWidth
                size='small'
                value={branch.setting.officeTime.out}
                InputLabelProps={{ shrink: true }}
                onChange={e => handleSettingChange('officeTime', 'out', e.target.value)}
                helperText="Time when office hours end"
              />

              <TextField
                label="Break Minutes"
                fullWidth
                type="number"
                size='small'
                value={branch.setting.officeTime.breakMinutes}
                onChange={e => handleSettingChange('officeTime', 'breakMinutes', Number(e.target.value))}
                helperText="Total break time allowed during the day"
              />

              <TextField
                label="Full Day Minutes"
                fullWidth
                type="number"
                size='small'
                value={branch.setting.workingMinutes.fullDay}
                onChange={e => handleSettingChange('workingMinutes', 'fullDay', Number(e.target.value))}
                helperText="Total working minutes required for a full day"
              />

              <TextField
                label="Half Day Minutes"
                fullWidth
                type="number"
                size='small'
                value={branch.setting.workingMinutes.halfDay}
                onChange={e => handleSettingChange('workingMinutes', 'halfDay', Number(e.target.value))}
                helperText="Minimum minutes required for marking a half-day"
              />

              <TextField
                label="Short Day Threshold (min)"
                fullWidth
                type="number"
                size='small'
                value={branch.setting.workingMinutes.shortDayThreshold}
                onChange={e => handleSettingChange('workingMinutes', 'shortDayThreshold', Number(e.target.value))}
                helperText="Below this time is considered a short day"
              />

              <TextField
                label="Overtime After Minutes"
                fullWidth
                type="number"
                size='small'
                value={branch.setting.workingMinutes.overtimeAfterMinutes}
                onChange={e => handleSettingChange('workingMinutes', 'overtimeAfterMinutes', Number(e.target.value))}
                helperText="Time after which overtime calculation begins"
              />

              <FormControl size='small' fullWidth>
                <InputLabel>Weekly Offs</InputLabel>
                <Select
                  multiple
                  value={branch.setting.weeklyOffs}
                  onChange={e =>
                    setBranch(prev => ({
                      ...prev,
                      setting: { ...prev.setting, weeklyOffs: e.target.value }
                    }))
                  }
                  input={<OutlinedInput label="Weekly Offs" />}
                  renderValue={(selected) =>
                    selected.map(v => weekdays.find(w => w.value === v)?.label).join(', ')
                  }
                >
                  {weekdays.map(day => (
                    <MenuItem key={day.value} value={day.value}>
                      <Checkbox checked={branch.setting.weeklyOffs.includes(day.value)} />
                      <ListItemText primary={day.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size='small'
                label="Consider Early Entry Before"
                type="time"
                value={branch.setting.attendanceRules.considerEarlyEntryBefore}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        considerEarlyEntryBefore: e.target.value
                      }
                    }
                  }))
                }
                helperText="Considered early if punched before this time"
              />

              <TextField
                fullWidth
                size='small'
                label="Consider Late Entry After"
                type="time"
                value={branch.setting.attendanceRules.considerLateEntryAfter}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        considerLateEntryAfter: e.target.value
                      }
                    }
                  }))
                }
                helperText="Considered late if punched after this time"
              />

              <TextField
                fullWidth
                size='small'
                label="Consider Early Exit Before"
                type="time"
                value={branch.setting.attendanceRules.considerEarlyExitBefore}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        considerEarlyExitBefore: e.target.value
                      }
                    }
                  }))
                }
                helperText="Considered early exit if leaving before this time"
              />

              <TextField
                fullWidth
                size='small'
                label="Consider Late Exit After"
                type="time"
                value={branch.setting.attendanceRules.considerLateExitAfter}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        considerLateExitAfter: e.target.value
                      }
                    }
                  }))
                }
                helperText="Considered late exit if leaving after this time"
              />

              <TextField
                fullWidth
                size='small'
                label="ESSL Punch-In Start"
                type="time"
                value={branch?.setting?.attendanceRules?.esslPunchInStart || '00:00'}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        esslPunchInStart: e.target.value
                      }
                    }
                  }))
                }
                helperText="ESSL punch-in will be accepted only after this time."
              />

              <TextField
                fullWidth
                size='small'
                label="ESSL Punch-In End"
                type="time"
                value={branch?.setting?.attendanceRules?.esslPunchInEnd || '23:59'}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        esslPunchInEnd: e.target.value
                      }
                    }
                  }))
                }
                helperText="ESSL punch-in will be accepted only up to this time."
              />

              <TextField
                fullWidth
                size='small'
                label="ESSL Punch-Out Start"
                type="time"
                value={branch?.setting?.attendanceRules?.esslPunchOutStart || '00:00'}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        esslPunchOutStart: e.target.value
                      }
                    }
                  }))
                }
                helperText="ESSL punch-out will be accepted only after this time."
              />

              <TextField
                fullWidth
                size='small'
                label="ESSL Punch-Out End"
                type="time"
                value={branch?.setting?.attendanceRules?.esslPunchOutEnd || '23:59'}
                onChange={e =>
                  setBranch(prev => ({
                    ...prev,
                    setting: {
                      ...prev.setting,
                      attendanceRules: {
                        ...prev.setting.attendanceRules,
                        esslPunchOutEnd: e.target.value
                      }
                    }
                  }))
                }
                helperText="ESSL punch-out will be accepted only up to this time."
              />
            </Box>
          </div>
        )}
      </span>
      <div className='modalfooter'>
        <Button variant="outlined" onClick={cancele}>
          Cancel
        </Button>
        {editbranch ? (
          <Button variant="contained" onClick={edite}>
            Save
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit}>
            Add Branch
          </Button>
        )}
      </div>
    </div>
  );
};

export default Addbranch;
