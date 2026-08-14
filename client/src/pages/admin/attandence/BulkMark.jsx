import React, {
  useEffect, useMemo, useState, useCallback,
  useReducer,
} from 'react';
import {
  Paper, Checkbox, Typography, FormControl, Select, MenuItem,
  InputLabel, Button, Avatar, CircularProgress,
} from '@mui/material';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { IoIosSend } from 'react-icons/io';
import { useSelector } from 'react-redux';
import Modalbox from '../../../components/custommodal/Modalbox';
import dayjs from 'dayjs';
import { FirstFetch } from '../../../../store/userSlice';
import { toast } from 'react-toastify';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { bulkMarkAttendanceApi, getBulkMarkDataApi } from '../../../api/attendance.api';
import BulkEmployeeRow from './BulkEmployeeRow';

// ─── Reducer for rowData ────────────────────────────────────────────────────
function rowDataReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return action.payload;
    case 'SET_FIELD': {
      const { empId, field, value } = action.payload;
      const prev = state[empId] || {};
      return {
        ...state,
        [empId]: {
          ...prev,
          [field]: value,
          status: field !== 'status' && !['weekly off', 'holiday', 'half day'].includes(prev.status)
            ? 'present'
            : prev.status,
        },
      };
    }
    case 'SET_STATUS': {
      const { empId, value } = action.payload;
      return {
        ...state,
        [empId]: { ...(state[empId] || {}), status: value },
      };
    }
    case 'APPLY_TO_ALL': {
      const { empIds, punchIn, punchOut, status } = action.payload;
      const next = { ...state };
      empIds.forEach(id => {
        next[id] = {
          ...(next[id] || { status: 'absent' }),
          ...(punchIn ? { punchIn } : {}),
          ...(punchOut ? { punchOut } : {}),
          ...(status ? { status } : {}),
        };
      });
      return next;
    }
    default:
      return state;
  }
}

// ─── BulkMark ───────────────────────────────────────────────────────────────
const BulkMark = ({
  openmodal, init, setopenmodal,
  isUpdate, isload, setisload, setinp, setisUpdate, dispatch, onSuccess,
}) => {
  const profile  = useSelector((state) => state.user.profile);
  const branch     = useSelector((state) => state.user.branch);
  const department = useSelector((state) => state.user.department);

  const [checkedemployee, setcheckedemployee] = useState([]);
  const [rowData, rowDispatch] = useReducer(rowDataReducer, {});
  const [selectedBranch, setselectedBranch] = useState('all');
  const [selecteddepartment, setselecteddepartment] = useState('all');
  const [attandenceDate, setattandenceDate] = useState(dayjs());

  // Local state for fetched employees and loader
  const [employees, setemployees] = useState([]);
  const [isLoadingData, setisLoadingData] = useState(false);

  // "Apply to all" fields — separate from rowData
  const [toall, settoall] = useState({ punchIn: '', punchOut: '', status: '' });

  // ── Fetch employee and attendance data from backend ───────────────────────
  useEffect(() => {
    if (!openmodal) return;

    const fetchData = async () => {
      try {
        setisLoadingData(true);
        const formattedDate = attandenceDate.format('YYYY-MM-DD');
        const res = await getBulkMarkDataApi(formattedDate, selectedBranch, selecteddepartment);
        if (res.success) {
          setemployees(res.data);

          const newRowData = {};
          const newChecked = [];

          res.data.forEach(emp => {
            const existing = emp.existingAttendance;
            if (existing) {
              newChecked.push(emp._id);
              newRowData[emp._id] = {
                punchIn:  existing.punchIn  ? dayjs(existing.punchIn).format('HH:mm')  : null,
                punchOut: existing.punchOut ? dayjs(existing.punchOut).format('HH:mm') : null,
                status: existing.status || 'absent',
              };
            } else {
              newRowData[emp._id] = { punchIn: null, punchOut: null, status: 'absent' };
            }
          });

          rowDispatch({ type: 'INIT', payload: newRowData });
          setcheckedemployee(newChecked);
        }
      } catch (err) {
        console.error("Failed to load bulk mark data:", err);
        toast.error("Failed to load employee list");
      } finally {
        setisLoadingData(false);
      }
    };

    fetchData();
  }, [openmodal, attandenceDate, selectedBranch, selecteddepartment]);

  // ── Employee Map (O(1) lookup) ─────────────────────────────────────────────
  const employeeMap = useMemo(() => {
    const map = new Map();
    employees?.forEach(e => map.set(e._id, e));
    return map;
  }, [employees]);

  // ── Apply-to-all: fires only when toall changes, uses useMemo empIds ───────
  const filteredEmpIds = useMemo(
    () => employees.map(e => e._id),
    [employees]
  );

  const applyToAll = useCallback(() => {
    if (!toall.punchIn && !toall.punchOut && !toall.status) return;
    rowDispatch({
      type: 'APPLY_TO_ALL',
      payload: { empIds: filteredEmpIds, ...toall },
    });
    setcheckedemployee(filteredEmpIds);
  }, [toall, filteredEmpIds]);

  // ── Stable row-level callbacks (dispatch is always stable) ─────────────────
  const handleCheck = useCallback((empId) => {
    setcheckedemployee(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  }, []);

  const handleAllSelect = useCallback((e) => {
    setcheckedemployee(e.target.checked ? filteredEmpIds : []);
  }, [filteredEmpIds]);

  const handleTimeChange = useCallback((empId, field, value) => {
    rowDispatch({ type: 'SET_FIELD', payload: { empId, field, value } });
    setcheckedemployee(prev => prev.includes(empId) ? prev : [...prev, empId]);
  }, []);

  const handleStatusChange = useCallback((empId, value) => {
    rowDispatch({ type: 'SET_STATUS', payload: { empId, value } });
    setcheckedemployee(prev => prev.includes(empId) ? prev : [...prev, empId]);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (checkedemployee.length === 0) {
      toast.info('Please mark at least one employee.');
      return;
    }

    const selectedDateStr = attandenceDate.format('YYYY-MM-DD');

    const selectedData = checkedemployee.map(employeeId => {
      const record = rowData[employeeId];
      if (!record) return null;
      const emp = employeeMap.get(employeeId);
      if (!emp) return null;

      const data = {
        employeeId,
        empId: emp.empId,
        status: record.status,
        branchId: emp.branchId,
        date: attandenceDate.toISOString(),
      };

      if (record.punchIn) {
        data.punchIn = new Date(`${selectedDateStr}T${record.punchIn}`).toISOString();
      }
      if (record.punchOut) {
        data.punchOut = new Date(`${selectedDateStr}T${record.punchOut}`).toISOString();
      }

      return data;
    }).filter(Boolean);

    if (selectedData.length === 0) {
      toast.info('No valid attendance data to submit.');
      return;
    }

    try {
      setisload(true);
      await bulkMarkAttendanceApi(selectedData);
      // Refresh only the attendance view that's actually open, instead of
      // the entire app state (employees, all-time attendance, leave
      // balances, advances, ledger) - that full reload was the main cause
      // of the modal feeling like it hangs on submit.
      if (onSuccess) onSuccess();
      else if (dispatch) dispatch(FirstFetch());
      setcheckedemployee([]);
      setattandenceDate(dayjs());
      setopenmodal(false);
      toast.success('Attendance marked successfully.');
    } catch (error) {
      console.error('Bulk Attendance Error:', error);
      toast.error(error.message || 'Failed to mark attendance.');
    } finally {
      setisload(false);
    }
  }, [checkedemployee, rowData, employeeMap, attandenceDate, dispatch, onSuccess, setopenmodal, setisload]);

  // ── Filtered departments for the selected branch ───────────────────────────
  const filteredDepartments = useMemo(() => {
    if (selectedBranch === 'all') return department;
    return department?.filter(d => d.branchId?._id === selectedBranch);
  }, [department, selectedBranch]);

  // ── Checked set (O(1) lookup for row) ─────────────────────────────────────
  const checkedSet = useMemo(() => new Set(checkedemployee), [checkedemployee]);

  return (
    <Modalbox open={openmodal} outside={false} onClose={() => setopenmodal(false)}>
      <div className="membermodal w-[600px] md:w-[800px]">
        <form onSubmit={handleSubmit}>
          <div className="modalhead">Bulk Mark Attendance</div>

          <span className="modalcontent overflow-x-auto">
            <div className='flex flex-col gap-4'>

              {/* ── Filters ─────────────────────────────────────────────── */}
              <div className='w-full flex justify-between gap-2'>
                <FormControl size="small" fullWidth disabled={isLoadingData}>
                  <InputLabel>Select Branch</InputLabel>
                  <Select
                    label="Select Branch"
                    value={selectedBranch}
                    onChange={(e) => {
                      setselectedBranch(e.target.value);
                      setselecteddepartment('all');
                    }}
                  >
                    <MenuItem value="all"><em>All</em></MenuItem>
                    {(profile?.role === 'manager'
                      ? branch?.filter(b => profile?.branchIds?.includes(b._id))
                      : branch
                    )?.map(b => (
                      <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" disabled={selectedBranch === 'all' || isLoadingData} fullWidth>
                  <InputLabel>Select Department</InputLabel>
                  <Select
                    label="Select Department"
                    value={selecteddepartment}
                    onChange={(e) => setselecteddepartment(e.target.value)}
                  >
                    <MenuItem value="all"><em>All</em></MenuItem>
                    {filteredDepartments?.map(d => (
                      <MenuItem key={d._id} value={d._id}>{d.department}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    slotProps={{ textField: { size: 'small' } }}
                    onChange={(val) => setattandenceDate(val)}
                    format="DD-MM-YYYY"
                    value={attandenceDate}
                    sx={{ width: '100%' }}
                    label="Select date"
                    maxDate={dayjs()}
                    disabled={isLoadingData}
                  />
                </LocalizationProvider>
              </div>

              {/* ── Apply to All ─────────────────────────────────────────── */}
              <div className="relative border-dashed border border-primary rounded-md w-full grid grid-cols-1 md:grid-cols-3 gap-4 p-2 pt-4">
                <span className="absolute top-0 left-3 -translate-y-1/2 bg-white px-2 text-sm font-medium text-primary">
                  Apply To All Fields
                </span>

                <div className="flex flex-col w-full">
                  <label className="text-sm font-medium text-gray-700 mb-1 text-left">Punch In</label>
                  <input
                    type="time"
                    disabled={isLoadingData}
                    className="w-full form-input outline-0 border border-primary border-dashed p-2 rounded"
                    value={toall.punchIn}
                    onChange={(e) => settoall(prev => ({ ...prev, punchIn: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col w-full">
                  <label className="text-sm font-medium text-gray-700 mb-1 text-left">Punch Out</label>
                  <input
                    type="time"
                    disabled={isLoadingData}
                    className="w-full form-input outline-0 border border-primary border-dashed p-2 rounded"
                    value={toall.punchOut}
                    onChange={(e) => settoall(prev => ({ ...prev, punchOut: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col w-full">
                  <label className="text-sm font-medium text-gray-700 mb-1 text-left">Status</label>
                  <select
                    disabled={isLoadingData}
                    className="w-full form-input outline-0 border border-primary border-dashed p-2 rounded text-sm"
                    value={toall.status}
                    onChange={(e) => settoall(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">Select Status</option>
                    <option value="present">Present</option>
                    <option value="leave">Leave</option>
                    <option value="absent">Absent</option>
                    <option value="weekly off">Weekly Off</option>
                    <option value="holiday">Holiday</option>
                    <option value="half day">Half Day</option>
                  </select>
                </div>

                <div className="col-span-full flex justify-end">
                  <Button size="small" variant="outlined" onClick={applyToAll} disabled={isLoadingData}>
                    Apply
                  </Button>
                </div>
              </div>

              {/* ── Employee Table ───────────────────────────────────────── */}
              <div className='border border-dashed border-primary rounded w-full'>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            onChange={handleAllSelect}
                            checked={
                              checkedemployee.length > 0 &&
                              checkedemployee.length === employees.length
                            }
                            indeterminate={
                              checkedemployee.length > 0 &&
                              checkedemployee.length < employees.length
                            }
                            disabled={isLoadingData || employees.length === 0}
                          />
                        </TableCell>
                        <TableCell>Employee Name</TableCell>
                        <TableCell>Punch In</TableCell>
                        <TableCell>Punch Out</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {isLoadingData ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                              <CircularProgress size={30} />
                              <Typography variant="body2" color="textSecondary">
                                Fetching employees and attendance...
                              </Typography>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : employees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="textSecondary" className="py-4">
                              No active employees found.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        employees.map((emp) => (
                          <BulkEmployeeRow
                            key={emp._id}
                            emp={emp}
                            isChecked={checkedSet.has(emp._id)}
                            punchIn={rowData[emp._id]?.punchIn}
                            punchOut={rowData[emp._id]?.punchOut}
                            status={rowData[emp._id]?.status}
                            onCheck={handleCheck}
                            onTimeChange={handleTimeChange}
                            onStatusChange={handleStatusChange}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

            </div>
          </span>

          <div className='modalfooter'>
            <Button
              size="small"
              onClick={() => { setopenmodal(false); setisUpdate(false); setinp(init); }}
              variant="outlined"
              disabled={isLoadingData}
            >
              Cancel
            </Button>
            <Button
              loading={isload}
              loadingPosition="end"
              endIcon={<IoIosSend />}
              variant="contained"
              type="submit"
              disabled={isLoadingData}
            >
              {isUpdate ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default React.memo(BulkMark);
