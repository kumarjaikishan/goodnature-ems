import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../../utils/apiClient';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material';
import { BiMessageRoundedError } from 'react-icons/bi';
import DataTable from 'react-data-table-component';
import { useSelector } from 'react-redux';
import { RxReset } from 'react-icons/rx';
import { IoMdTime } from 'react-icons/io';
import EmployeeProfileCard from '../../../components/performanceCard';
import { useCustomStyles } from './attandencehelper';
import { IoInformationCircleOutline } from 'react-icons/io5';

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

const AttenPerformance = () => {
    const { userid } = useParams();
    const navigate = useNavigate();
    const customStyles = useCustomStyles();
    const { company, holidays } = useSelector((state) => state.user);

    const [user, setuser] = useState(null);
    const [employee, setemployee] = useState({});
    const [attandence, setattandence] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const currentYear = dayjs().year();
    const yearOptions = useMemo(
        () => Array.from({ length: 8 }, (_, i) => currentYear + 1 - i),
        [currentYear]
    );
    const monthOptions = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                label: dayjs().month(i).format('MMMM'),
                value: i,
            })),
        []
    );

    const setting = useMemo(() => {
        if (!company) return null;

        if (employee?.branchId?.defaultsetting === false) {
            return {
                attendanceRules: employee?.branchId?.setting?.attendanceRules,
                workingMinutes: employee?.branchId?.setting?.workingMinutes,
                weeklyOffs: employee?.branchId?.setting?.weeklyOffs || [],
            };
        }

        return {
            attendanceRules: company?.attendanceRules,
            workingMinutes: company?.workingMinutes,
            weeklyOffs: company?.weeklyOffs || [],
        };
    }, [company, employee]);


    useEffect(() => {
        if (!userid) return;

        const fetchPerformanceData = async () => {
            try {
                setLoading(true);
                const result = await apiClient({
                    url: 'employeeAttandence',
                    params: { userid },
                });

                setemployee(result?.employee || {});
                setuser(result?.user || null);
                setattandence(result?.attandence || []);
            } catch (err) {
                console.error('Failed to fetch performance data:', err);
                if (err?.status === 403) {
                    swal({
                        title: 'Access Denied',
                        text: err?.payload?.message || 'You are not authorized to manage this tournament.',
                        icon: 'warning',
                    });
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPerformanceData();
    }, [userid, navigate]);

    const normalizedAttendance = useMemo(() => {
        if (!attandence?.length) return [];

        return attandence.map((entry) => {
            const dateObj = dayjs(entry.date);
            const dateKey = dateObj.format('YYYY-MM-DD');
            const isPresent = entry.status === 'present';
            const hasWorkingData =
                Boolean(entry.punchIn) &&
                Boolean(entry.punchOut) &&
                typeof entry.workingMinutes === 'number';

            const isSpecialDay = entry.dayType === 'holiday' || entry.dayType === 'weekoff';

            const isOvertime =
                isPresent && hasWorkingData
                    ? isSpecialDay
                        ? entry.workingMinutes > 0
                        : (entry.overtimeMinutes || 0) > 0
                    : false;

            return {
                ...entry,
                dateObj,
                dateKey,
                isShort: isPresent && !isSpecialDay && (entry.shortMinutes || 0) > 0,
                isOvertime,
                isEarlyArrival: entry.punchInStatus === 'early',
                isLateArrival: entry.punchInStatus === 'late',
                isEarlyLeave: entry.punchOutStatus === 'early',
                isLateLeave: entry.punchOutStatus === 'late',
            };
        });
    }, [attandence]);

    const periodFilteredAttendance = useMemo(() => {
        return normalizedAttendance.filter((entry) => {
            const matchYear = entry.dateObj.year() === selectedYear;
            const matchMonth = selectedMonth === 'all' || entry.dateObj.month() === selectedMonth;
            return matchYear && matchMonth;
        });
    }, [normalizedAttendance, selectedYear, selectedMonth]);

    const hell = useMemo(() => {
        if (!periodFilteredAttendance.length || !setting) return initialHell;

        const present = [];
        const absent = [];
        const leave = [];
        const holiday = [];
        const short = [];
        const overtime = [];
        const latearrival = [];
        const earlyarrival = [];
        const earlyLeave = [];
        const lateleave = [];

        let shorttimemin = 0;
        let overtimemin = 0;

        periodFilteredAttendance.forEach((entry) => {
            switch (entry.status) {
                case 'present':
                    present.push(entry.dateKey);
                    break;
                case 'absent':
                    absent.push(entry.dateKey);
                    break;
                case 'leave':
                    leave.push(entry.dateKey);
                    break;
                case 'holiday':
                    holiday.push(entry.dateKey);
                    break;
                default:
                    break;
            }

            if (entry.isEarlyArrival) earlyarrival.push(entry.dateKey);
            if (entry.isLateArrival) latearrival.push(entry.dateKey);
            if (entry.isEarlyLeave) earlyLeave.push(entry.dateKey);
            if (entry.isLateLeave) lateleave.push(entry.dateKey);

            if (entry.status !== 'present') return;
            if (!entry.punchIn || !entry.punchOut || typeof entry.workingMinutes !== 'number') return;

            if (entry.dayType === 'holiday' || entry.dayType === 'weekoff') {
                if (entry.workingMinutes > 0) {
                    overtime.push(entry.dateKey);
                    overtimemin += entry.workingMinutes;
                }
                return;
            }

            if ((entry.shortMinutes || 0) > 0) {
                short.push(entry.dateKey);
                shorttimemin += entry.shortMinutes || 0;
            }

            if ((entry.overtimeMinutes || 0) > 0) {
                overtime.push(entry.dateKey);
                overtimemin += entry.overtimeMinutes || 0;
            }
        });

        const salary = Number(employee?.salary || 0);
        const overtimeAfterMinutes = Number(setting?.workingMinutes?.overtimeAfterMinutes || 0);
        const daysInMonth =
            selectedMonth === 'all'
                ? 0
                : dayjs(new Date(selectedYear, Number(selectedMonth), 1)).daysInMonth();

        const overtimesalary =
            selectedMonth !== 'all' && salary > 0 && overtimeAfterMinutes > 0 && daysInMonth > 0
                ? Math.floor((overtimemin - shorttimemin) * (salary / daysInMonth / overtimeAfterMinutes))
                : null;

        return {
            present,
            absent,
            leave,
            holiday,
            short,
            overtime,
            shorttimemin,
            overtimemin,
            latearrival,
            earlyarrival,
            earlyLeave,
            lateleave,
            overtimesalary,
        };
    }, [periodFilteredAttendance, setting, employee?.salary, selectedMonth, selectedYear]);

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
                const timeMatch =
                    (timeFilter === 'short' && entry.isShort) ||
                    (timeFilter === 'overtime' && entry.isOvertime);

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
        <div className="p-1 md:p-4 capitalize bg-gray-200">
            {loading && <p>Loading performance data...</p>}

            <div className="p-1 py-3 md:p-3 flex flex-wrap gap-1 md:gap-3 items-center justify-between rounded shadow bg-white mb-4">
                <div className="gap-3 md:gap-3 flex">
                    <FormControl className="w-[90px] md:w-[120px]" size="small">
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            {yearOptions.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" className="w-[130px] md:w-[160px]">
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            {monthOptions.map((month) => (
                                <MenuItem key={month.label} value={month.value}>
                                    {month.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>

                <div className="text-end">
                    <p className="font-semibold text-sm md:text-lg">{user?.name}</p>
                    <p className="text-[12px] md:text-sm text-gray-600">({employee?.branchId?.name})</p>
                </div>
            </div>

            {attandence && (
                <>
                    <EmployeeProfileCard
                        employee={employee}
                        user={user}
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
                            <TextField
                                label="From Date"
                                type="date"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <TextField
                                label="To Date"
                                type="date"
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </FormControl>

                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={resetFilters}
                            sx={{ alignSelf: 'flex-end', minWidth: 100 }}
                            startIcon={<RxReset />}
                        >
                            Reset
                        </Button>
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
                </>
            )}
        </div>
    );
};

export default AttenPerformance;

const minutesinhours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h == 0) {
        return `${m}m`
    }
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
        style: {
            minWidth: '100px',
        },
    },
    {
        name: 'Punch In',
        style: {
            minWidth: '140px',
        },
        selector: (row) => row.punchIn,
        cell: (emp) => {
            if (!emp.punchIn) return '-';

            return (
                <span className="flex items-center gap-1">
                    <IoMdTime className="text-[16px] text-blue-700" />
                    {dayjs(emp.punchIn).format('hh:mm A')}

                    {emp.punchInStatus === 'early' && (
                        <span className="px-2 py-0.5 ml-2 rounded bg-sky-100 text-sky-800 text-xs">Early</span>
                    )}
                    {emp.punchInStatus === 'late' && (
                        <span className="px-2 py-0.5 ml-2 rounded bg-amber-100 text-amber-800 text-xs">Late</span>
                    )}
                </span>
            );
        },
    },
    {
        name: 'Punch Out',
        style: {
            minWidth: '140px',
        },
        selector: (row) => row.punchOut,
        cell: (emp) => {
            if (!emp.punchOut) return '-';
            return (
                <span className="flex items-center gap-1">
                    <IoMdTime className="text-[16px] text-blue-700" />
                    {dayjs(emp.punchOut).format('hh:mm A')}
                    {emp.punchOutStatus === 'early' && (
                        <span className="px-2 py-0.5 ml-2 rounded bg-amber-100 text-amber-800 text-xs">Early</span>
                    )}
                    {emp.punchOutStatus === 'late' && (
                        <span className="px-2 py-0.5 ml-2 rounded bg-sky-100 text-sky-800 text-xs">Late</span>
                    )}
                </span>
            );
        },
    },
    {
        name: 'Status',
        selector: (emp) => emp.status,
        cell: (emp) => {
            const { status } = emp;
            const { leave } = emp;
            const colorMap = {
                absent: 'bg-red-100 text-red-800',
                leave: 'bg-violet-100 text-violet-800',
                present: 'bg-green-100 text-green-800',
                holiday: 'bg-blue-100 text-blue-800',
            };
            const classes = colorMap[status] || 'bg-gray-100 text-gray-800';

            return (
                <>
                    <span className={`${classes} px-2 py-1 rounded text-xs`}>{status}</span>
                    {leave && leave?.reason && (
                        <span title={leave?.reason} className="ml-1 text-blue-600 text-lg font-bold">
                            <IoInformationCircleOutline />
                        </span>
                    )}
                </>
            );
        },
        style: {
            minWidth: '120px',
        },
    },
    {
        name: 'Working Hours',
        style: {
            minWidth: '180px',
        },
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
                        {(emp.shortMinutes > 0 && !isSpecialDay) && (
                            <span className="ml-2 px-1 py-1 rounded bg-amber-100 text-amber-800">
                                Short {minutesinhours(emp.shortMinutes)}
                            </span>
                        )}
                        {(emp.overtimeMinutes > 0 || isSpecialDay) && (
                            <span className="ml-2 p-1 rounded bg-green-100 text-green-800">
                                Overtime {minutesinhours(emp.overtimeMinutes) || emp.workingMinutes}
                            </span>
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
