import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material';
import { BiMessageRoundedError } from 'react-icons/bi';
import DataTable from 'react-data-table-component';
import { RxReset } from 'react-icons/rx';
import { IoMdTime } from 'react-icons/io';
import { IoInformationCircleOutline } from 'react-icons/io5';
import EmployeeProfileCard from '../../../components/performanceCard';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';

dayjs.extend(isSameOrBefore);

const initialHell = {
    present: [],
    absent: [],
    leave: [],
    holiday: [],
    short: [],
    overtime: [],
    latearrival: [],
    earlyarrival: [],
    earlyLeave: [],
    lateleave: [],
    shorttimemin: 0,
    overtimemin: 0,
    overtimesalary: 0,
};

const EmpAttenPerformance = () => {
    const navigate = useNavigate();
    const customStyles = useCustomStyles();
    const { attendance, companysetting, profile } = useSelector((state) => state.employee);
    const { holidays } = useSelector((state) => state.user);

    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const currentYear = dayjs().year();
    const yearOptions = useMemo(() => Array.from({ length: 8 }, (_, i) => currentYear + 1 - i), [currentYear]);
    const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
        label: dayjs().month(i).format('MMMM'),
        value: i,
    })), []);


    const normalizedAttendance = useMemo(() => {
        if (!attendance?.length) return [];
        return attendance.map((entry) => {
            const dateObj = dayjs(entry.date);
            const dateKey = dateObj.format('YYYY-MM-DD');
            const isPresent = entry.status === 'present' || entry.status === 'half day';

            const isSpecialDay = entry.dayType === 'holiday' || entry.dayType === 'weekoff';

            return {
                ...entry,
                dateObj,
                dateKey,
                isShort: isPresent && !isSpecialDay && (entry.shortMinutes || 0) > 0,
                isOvertime: isPresent && ((entry.overtimeMinutes || 0) > 0 || isSpecialDay),
                isEarlyArrival: entry.punchInStatus === 'early',
                isLateArrival: entry.punchInStatus === 'late',
                isEarlyLeave: entry.punchOutStatus === 'early',
                isLateLeave: entry.punchOutStatus === 'late',
            };
        });
    }, [attendance]);

    const periodFilteredAttendance = useMemo(() => {
        return normalizedAttendance.filter((entry) => {
            const matchYear = entry.dateObj.year() === selectedYear;
            const matchMonth = selectedMonth === 'all' || entry.dateObj.month() === selectedMonth;
            return matchYear && matchMonth;
        });
    }, [normalizedAttendance, selectedYear, selectedMonth]);

    const hell = useMemo(() => {
        if (!periodFilteredAttendance.length) return initialHell;

        const results = { ...initialHell, present: [], absent: [], leave: [], holiday: [], short: [], overtime: [], latearrival: [], earlyarrival: [], earlyLeave: [], lateleave: [] };
        let shorttimemin = 0;
        let overtimemin = 0;

        periodFilteredAttendance.forEach((entry) => {
            if (entry.status === 'present' || entry.status === 'half day') {
                results.present.push(entry.dateKey);
            } else if (entry.status === 'absent') {
                results.absent.push(entry.dateKey);
            } else if (entry.status === 'leave') {
                results.leave.push(entry.dateKey);
            }
            if (entry.status === 'holiday' || entry.dayType === 'holiday') {
                results.holiday.push(entry.dateKey);
            }

            if (entry.isEarlyArrival) results.earlyarrival.push(entry.dateKey);
            if (entry.isLateArrival) results.latearrival.push(entry.dateKey);
            if (entry.isEarlyLeave) results.earlyLeave.push(entry.dateKey);
            if (entry.isLateLeave) results.lateleave.push(entry.dateKey);

            if (entry.status === 'present' || entry.status === 'half day') {
                if (entry.shortMinutes > 0) {
                    results.short.push(entry.dateKey);
                    shorttimemin += entry.shortMinutes;
                }
                if (entry.overtimeMinutes > 0) {
                    results.overtime.push(entry.dateKey);
                    overtimemin += entry.overtimeMinutes;
                }
            }
        });

        const salary = Number(profile?.salary || 0);
        const overtimeAfterMinutes = Number(companysetting?.workingMinutes?.overtimeAfterMinutes || 0);
        const daysInMonth = selectedMonth === 'all' ? 30 : dayjs(new Date(selectedYear, Number(selectedMonth), 1)).daysInMonth();

        const overtimesalary = (selectedMonth !== 'all' && salary > 0 && overtimeAfterMinutes > 0)
            ? Math.floor((overtimemin - shorttimemin) * (salary / daysInMonth / overtimeAfterMinutes))
            : 0;

        return { ...results, shorttimemin, overtimemin, overtimesalary };
    }, [periodFilteredAttendance, profile?.salary, companysetting, selectedMonth, selectedYear]);

    const filteredData = useMemo(() => {
        const from = fromDate ? dayjs(fromDate).startOf('day') : null;
        const to = toDate ? dayjs(toDate).endOf('day') : null;

        return periodFilteredAttendance.filter((entry) => {
            if (from && entry.dateObj.isBefore(from)) return false;
            if (to && entry.dateObj.isAfter(to)) return false;
            if (statusFilter !== 'all' && entry.status !== statusFilter) return false;

            if (typeFilter !== 'all') {
                const typeMatch =
                    (typeFilter === 'earlyLeave' && entry.isEarlyLeave) ||
                    (typeFilter === 'lateleave' && entry.isLateLeave) ||
                    (typeFilter === 'earlyarrival' && entry.isEarlyArrival) ||
                    (typeFilter === 'latearrival' && entry.isLateArrival);
                if (!typeMatch) return false;
            }

            if (timeFilter !== 'all') {
                const timeMatch = (timeFilter === 'short' && entry.isShort) || (timeFilter === 'overtime' && entry.isOvertime);
                if (!timeMatch) return false;
            }

            return true;
        });
    }, [periodFilteredAttendance, fromDate, toDate, statusFilter, typeFilter, timeFilter]);

    const resetFilters = () => {
        setSelectedYear(dayjs().year());
        setSelectedMonth(dayjs().month());
        setStatusFilter('all');
        setTypeFilter('all');
        setTimeFilter('all');
        setFromDate('');
        setToDate('');
    };

    return (
        <div className="p-1 md:p-4 capitalize ">
            <div className="p-1 py-3 md:p-3 flex flex-wrap gap-1 md:gap-3 items-center justify-between rounded shadow bg-white mb-4">
                <div className="gap-3 md:gap-3 flex">
                    <FormControl className="w-[90px] md:w-[120px]" size="small">
                        <InputLabel>Year</InputLabel>
                        <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                            {yearOptions.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" className="w-[130px] md:w-[160px]">
                        <InputLabel>Month</InputLabel>
                        <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                            <MenuItem value="all">All</MenuItem>
                            {monthOptions.map((month) => <MenuItem key={month.label} value={month.value}>{month.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                </div>
                <div className="text-end">
                    <p className="font-semibold text-sm md:text-lg">{profile?.userid?.name}</p>
                    <p className="text-[12px] md:text-sm text-gray-600">({profile?.branchId?.name})</p>
                </div>
            </div>

            <EmployeeProfileCard
                employee={profile}
                attandence={periodFilteredAttendance}
                hell={hell}
            />

            <div className="p-1 py-4 md:p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 rounded shadow bg-white my-4">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="earlyLeave">Early Leave</MenuItem>
                        <MenuItem value="lateleave">Late Leave</MenuItem>
                        <MenuItem value="earlyarrival">Early Arrival</MenuItem>
                        <MenuItem value="latearrival">Late Arrival</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="present">Present</MenuItem>
                        <MenuItem value="leave">Leave</MenuItem>
                        <MenuItem value="absent">Absent</MenuItem>
                        <MenuItem value="weekly off">Weekly off</MenuItem>
                        <MenuItem value="holiday">Holiday</MenuItem>
                        <MenuItem value="half day">Half Day</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Over/Short</InputLabel>
                    <Select value={timeFilter} label="Over/Short" onChange={(e) => setTimeFilter(e.target.value)}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="overtime">Overtime</MenuItem>
                        <MenuItem value="short">Short Time</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <TextField label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <TextField label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </FormControl>

                <Button variant="outlined" color="secondary" onClick={resetFilters} sx={{ alignSelf: 'flex-end', minWidth: 100 }} startIcon={<RxReset />}>Reset</Button>
            </div>

            <DataTable
                columns={columns()}
                data={filteredData}
                pagination
                customStyles={customStyles}
                conditionalRowStyles={conditionalRowStyles}
                highlightOnHover
                noDataComponent={
                    <div className="flex items-center gap-2 py-6 text-center text-gray-600 text-sm">
                        <BiMessageRoundedError className="text-xl" /> No records found matching your criteria.
                    </div>
                }
            />
        </div>
    );
};

export default EmpAttenPerformance;

const minutesinhours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};

const conditionalRowStyles = [
    {
        when: (row) => row.dayType === 'holiday',
        style: {
            backgroundColor: 'rgba(59, 130, 246, 0.08)', // Light blue for holiday
        },
    },
    {
        when: (row) => row.dayType === 'weekoff',
        style: {
            backgroundColor: 'rgba(147, 51, 234, 0.08)', // Light purple for weekoff
        },
    },
];

const columns = () => [
    {
        name: 'Date',
        selector: (row) => dayjs(row.date).format('DD MMM, YYYY'),
        sortable: true,
        style: { minWidth: '100px' },
    },
    {
        name: 'Punch In',
        style: { minWidth: '140px' },
        selector: (row) => row.punchIn,
        cell: (emp) => {
            if (!emp.punchIn) return '-';
            return (
                <span className="flex items-center gap-1">
                    <IoMdTime className="text-[16px] text-blue-700" />
                    {dayjs(emp.punchIn).format('hh:mm A')}
                    {emp.punchInStatus === 'early' && <span className="px-2 py-0.5 ml-2 rounded bg-sky-100 text-sky-800 text-xs">Early</span>}
                    {emp.punchInStatus === 'late' && <span className="px-2 py-0.5 ml-2 rounded bg-amber-100 text-amber-800 text-xs">Late</span>}
                </span>
            );
        },
    },
    {
        name: 'Punch Out',
        style: { minWidth: '140px' },
        selector: (row) => row.punchOut,
        cell: (emp) => {
            if (!emp.punchOut) return '-';
            return (
                <span className="flex items-center gap-1">
                    <IoMdTime className="text-[16px] text-blue-700" />
                    {dayjs(emp.punchOut).format('hh:mm A')}
                    {emp.punchOutStatus === 'early' && <span className="px-2 py-0.5 ml-2 rounded bg-amber-100 text-amber-800 text-xs">Early</span>}
                    {emp.punchOutStatus === 'late' && <span className="px-2 py-0.5 ml-2 rounded bg-sky-100 text-sky-800 text-xs">Late</span>}
                </span>
            );
        },
    },
    {
        name: 'Status',
        selector: (emp) => emp.status,
        cell: (emp) => {
            const { status, leave } = emp;
            const colorMap = { absent: 'bg-red-100 text-red-800', leave: 'bg-violet-100 text-violet-800', present: 'bg-green-100 text-green-800', holiday: 'bg-blue-100 text-blue-800' };
            const classes = colorMap[status] || 'bg-gray-100 text-gray-800';
            return (
                <>
                    <span className={`${classes} px-2 py-1 rounded text-xs`}>{status}</span>
                    {leave?.reason && (
                        <span title={leave.reason} className="ml-1 text-blue-600 text-lg font-bold">
                            <IoInformationCircleOutline />
                        </span>
                    )}
                </>
            );
        },
       width: "120px",
    },
    {
        name: 'Working Hours',
        style: { minWidth: '180px' },
        selector: (emp) => emp.workingMinutes,
        cell: (emp) => {
            const wm = emp.workingMinutes;
            const isSpecialDay = emp.dayType === 'holiday' || emp.dayType === 'weekoff';

            if (!wm) {
                return (
                    <p className="text-[11px] mt-1 font-medium italic">
                        {emp.dayType === 'holiday' ? (
                            <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">Holiday</span>
                        ) : emp.dayType === 'weekoff' ? (
                            <span className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded border border-purple-100">Weekly Off</span>
                        ) : "-"}
                    </p>
                );
            }
            return (
                <div className="flex flex-col">
                    <span className="flex">
                        <span className="block w-[60px]">{minutesinhours(wm)}</span>
                        {emp.shortMinutes > 0 && !isSpecialDay && (
                            <span className="ml-2 px-1 py-1 rounded bg-amber-100 text-amber-800 text-xs">Short {emp.shortMinutes} min</span>
                        )}
                        {(emp.overtimeMinutes > 0 || isSpecialDay) && (
                            <span className="ml-2 p-1 rounded bg-green-100 text-green-800 text-xs">Overtime {emp.overtimeMinutes || emp.workingMinutes} min</span>
                        )}
                    </span>
                    <p className="text-[11px] mt-1 font-medium italic">
                        {emp.dayType === 'holiday' ? (
                            <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">Holiday</span>
                        ) : emp.dayType === 'weekoff' ? (
                            <span className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded border border-purple-100">Weekly Off</span>
                        ) : ""}
                    </p>
                </div>
            );
        },
    },
    {
        name: 'Remarks',
        selector: (emp) => emp.remarks,
    },
];
