import React, {
  useEffect, useMemo, useState, useCallback,
  useReducer,
} from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import Modalbox from '../../../components/custommodal/Modalbox';
import dayjs from 'dayjs';
import { FirstFetch } from '../../../../store/userSlice';
import { toast } from '../../../utils/toast';
import { bulkMarkAttendanceApi, getBulkMarkDataApi } from '../../../api/attendance.api';
import BulkEmployeeRow from './BulkEmployeeRow';

// Custom UI Components
import Button from '../../../components/ui/Button';
import DateInput from '../../../components/ui/DateInput';
import Select from '../../../components/ui/Select';

// Reducer for rowData
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

const BulkMark = ({
  openmodal,
  init,
  setopenmodal,
  isUpdate,
  isload,
  setisload,
  dispatch,
  onSuccess,
}) => {
  const { branch, department, profile } = useSelector(state => state.user);

  const [toall, settoall] = useState({ punchIn: '', punchOut: '', status: '' });
  const [selectedBranch, setselectedBranch] = useState('all');
  const [selecteddepartment, setselecteddepartment] = useState('all');
  const [attandenceDate, setattandenceDate] = useState(dayjs());
  const [checkedemployee, setcheckedemployee] = useState([]);

  const [apiEmployees, setApiEmployees] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [rowData, rowDispatch] = useReducer(rowDataReducer, {});

  const employeeMap = useMemo(() => {
    const map = new Map();
    apiEmployees.forEach(emp => map.set(emp._id, emp));
    return map;
  }, [apiEmployees]);

  useEffect(() => {
    if (!openmodal) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const formattedDate = attandenceDate.format('YYYY-MM-DD');
        const res = await getBulkMarkDataApi({
          date: formattedDate,
          branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
          departmentId: selecteddepartment !== 'all' ? selecteddepartment : undefined,
        });

        if (!isMounted) return;

        if (res.success) {
          const empList = res.employees || [];
          setApiEmployees(empList);

          const initialRowData = {};
          empList.forEach(emp => {
            const att = emp.todayAttendance;
            initialRowData[emp._id] = {
              punchIn: att?.punchIn ? dayjs(att.punchIn).format('HH:mm') : '',
              punchOut: att?.punchOut ? dayjs(att.punchOut).format('HH:mm') : '',
              status: att?.status || 'absent',
            };
          });

          rowDispatch({ type: 'INIT', payload: initialRowData });
          setcheckedemployee([]);
        }
      } catch (err) {
        console.error('Failed to fetch bulk mark data:', err);
        if (isMounted) toast.error('Failed to load employee attendance data.');
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [openmodal, attandenceDate, selectedBranch, selecteddepartment]);

  const employees = apiEmployees;

  const filteredEmpIds = useMemo(() => employees.map(e => e._id), [employees]);

  const applyToAll = useCallback(() => {
    rowDispatch({
      type: 'APPLY_TO_ALL',
      payload: { empIds: filteredEmpIds, ...toall },
    });
    setcheckedemployee(filteredEmpIds);
  }, [toall, filteredEmpIds]);

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

  const filteredDepartments = useMemo(() => {
    if (selectedBranch === 'all') return department;
    return department?.filter(d => d.branchId?._id === selectedBranch);
  }, [department, selectedBranch]);

  const checkedSet = useMemo(() => new Set(checkedemployee), [checkedemployee]);

  if (!openmodal) return null;

  return (
    <Modalbox open={openmodal} outside={false} onClose={() => setopenmodal(false)}>
      <div className="w-full max-w-4xl p-6 space-y-4 bg-white rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Bulk Mark Attendance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Apply timestamps, status, and department filters in batch</p>
            </div>
            <button
              type="button"
              onClick={() => setopenmodal(false)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                size="sm"
                label="Branch"
                disabled={isLoadingData}
                value={selectedBranch}
                onChange={(e) => {
                  setselectedBranch(e.target.value);
                  setselecteddepartment('all');
                }}
                options={[
                  { value: "all", label: "All Branches" },
                  ...((profile?.role === 'manager'
                    ? branch?.filter(b => profile?.branchIds?.includes(b._id))
                    : branch
                  ) || []).map(b => ({ value: b._id, label: b.name }))
                ]}
              />

              <Select
                size="sm"
                label="Department"
                disabled={selectedBranch === 'all' || isLoadingData}
                value={selecteddepartment}
                onChange={(e) => setselecteddepartment(e.target.value)}
                options={[
                  { value: "all", label: "All Departments" },
                  ...(filteredDepartments || []).map(d => ({ value: d._id, label: d.department }))
                ]}
              />

              <DateInput
                size="sm"
                label="Attendance Date"
                disabled={isLoadingData}
                value={attandenceDate ? attandenceDate.format('YYYY-MM-DD') : ''}
                onChange={(val) => setattandenceDate(val ? dayjs(val) : dayjs())}
              />
            </div>

            {/* Apply to All */}
            <div className="relative border border-dashed border-teal-300 bg-teal-50/40 rounded-xl p-3.5 pt-4">
              <span className="absolute top-0 left-3 -translate-y-1/2 bg-white border border-teal-200 px-2 py-0.5 rounded text-[11px] font-bold text-teal-800">
                Apply To All Selected
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Punch In</label>
                  <input
                    type="time"
                    disabled={isLoadingData}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                    value={toall.punchIn}
                    onChange={(e) => settoall(prev => ({ ...prev, punchIn: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Punch Out</label>
                  <input
                    type="time"
                    disabled={isLoadingData}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                    value={toall.punchOut}
                    onChange={(e) => settoall(prev => ({ ...prev, punchOut: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    disabled={isLoadingData}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors cursor-pointer"
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

                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={applyToAll}
                    disabled={isLoadingData}
                    className="w-full"
                  >
                    Apply All
                  </Button>
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          onChange={handleAllSelect}
                          checked={
                            checkedemployee.length > 0 &&
                            checkedemployee.length === employees.length
                          }
                          disabled={isLoadingData || employees.length === 0}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300 cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5">Employee Name</th>
                      <th className="p-2.5 w-32">Punch In</th>
                      <th className="p-2.5 w-32">Punch Out</th>
                      <th className="p-2.5 w-36">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingData ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">
                          Fetching employees and attendance...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">
                          No active employees found.
                        </td>
                      </tr>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              size="sm"
              onClick={() => { setopenmodal(false); }}
              variant="outline"
              disabled={isLoadingData}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isload}
              icon={<Send size={14} />}
              variant="primary"
              type="submit"
              disabled={isLoadingData}
            >
              Save Bulk Attendance ({checkedemployee.length})
            </Button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default React.memo(BulkMark);
