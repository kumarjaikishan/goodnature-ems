import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../utils/apiClient';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import DataTable from '@/components/common/DataTable';
import { useSelector } from 'react-redux';
import { RotateCcw, Clock, Info, MessageSquareWarning, User } from 'lucide-react';
import EmployeeProfileCard from '../../../components/performanceCard';
import { useCustomStyles } from './attandencehelper';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

dayjs.extend(isSameOrBefore);

const initialHell = {
    present: [],
    absent: [],
    leave: [],
    holiday: [],
    short: [],
    overtime: [],
    weeklyoffwork: [],
    latearrival: [],
    earlyarrival: [],
    earlyLeave: [],
    lateleave: [],
    shorttimemin: 0,
    overtimemin: 0,
    weeklyoffworkmin: 0,
    overtimesalary: 0,
};

const AttenPerformance = () => {
    const { userid } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const customStyles = useCustomStyles();
    const { company, holidays } = useSelector((state) => state.user);

    const [user, setuser] = useState(null);
    const [employee, setemployee] = useState({});
    const [attandence, setattandence] = useState([]);
    const [loading, setLoading] = useState(true);

    const queryMonth = searchParams.get('month');
    const queryYear = searchParams.get('year');

    const [selectedYear, setSelectedYear] = useState(queryYear ? parseInt(queryYear, 10) : dayjs().year());
    const [selectedMonth, setSelectedMonth] = useState(queryMonth ? parseInt(queryMonth, 10) : dayjs().month());
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
                const params = { userid };
                if (selectedMonth !== 'all') params.month = selectedMonth;
                if (selectedYear !== 'all') params.year = selectedYear;

                const result = await apiClient({
                    url: 'employeeAttandence',
                    params,
                });

                setemployee(result?.employee || {});
                setuser(result?.user || null);
                setattandence(result?.attandence || []);
            } catch (err) {
                console.error('Failed to fetch performance data:', err);
                if (err?.status === 403) {
                    swal({
                        title: 'Access Denied',
                        text: err?.payload?.message || 'You are not authorized to access this data.',
                        icon: 'warning',
                    });
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPerformanceData();
    }, [userid, selectedMonth, selectedYear, navigate]);

    const weeklyOffsList = useMemo(() => {
        if (!setting?.weeklyOffs) return [];
        return setting.weeklyOffs;
    }, [setting]);

    const normalizedAttendance = useMemo(() => {
        if (!attandence?.length) return [];

        return attandence.map((entry) => {
            const dateObj = dayjs(entry.date);
            const dateKey = dateObj.format('YYYY-MM-DD');
            const dayOfWeek = dateObj.day();

            const isPresent = entry.status === 'present' || entry.status === 'half day';
            const isWeeklyOffDay = weeklyOffsList.includes(dayOfWeek) || entry.dayType === 'weekoff' || (entry.weeklyOffMinutes && entry.weeklyOffMinutes > 0) || (entry.remarks && entry.remarks.includes("weekly off"));
            const isHolidayDay = entry.dayType === 'holiday';

            const isWeeklyOffWork = (isPresent || entry.status === 'weekly off' || (entry.workingMinutes > 0)) && isWeeklyOffDay && (entry.workingMinutes > 0 || (entry.weeklyOffMinutes && entry.weeklyOffMinutes > 0));

            const isOvertime = isPresent && !isWeeklyOffDay && (
                isHolidayDay ? (entry.workingMinutes > 0) : ((entry.overtimeMinutes || 0) > 0)
            );

            return {
                ...entry,
                dateObj,
                dateKey,
                isWeeklyOffDay,
                isWeeklyOffWork,
                isShort: isPresent && !isHolidayDay && !isWeeklyOffDay && (entry.shortMinutes || 0) > 0,
                isOvertime,
                isEarlyArrival: entry.punchInStatus === 'early',
                isLateArrival: entry.punchInStatus === 'late',
                isEarlyLeave: entry.punchOutStatus === 'early',
                isLateLeave: entry.punchOutStatus === 'late',
            };
        });
    }, [attandence, weeklyOffsList]);

    const periodFilteredAttendance = useMemo(() => {
        return normalizedAttendance.filter((entry) => {
            const matchYear = selectedYear === 'all' || entry.dateObj.year() === selectedYear;
            const matchMonth = selectedMonth === 'all' || entry.dateObj.month() === selectedMonth;
            return matchYear && matchMonth;
        });
    }, [normalizedAttendance, selectedYear, selectedMonth]);

    const hell = useMemo(() => {
        if (!periodFilteredAttendance.length) return initialHell;

        const present = [];
        const absent = [];
        const leave = [];
        const holiday = [];
        const short = [];
        const overtime = [];
        const weeklyoffwork = [];
        const latearrival = [];
        const earlyarrival = [];
        const earlyLeave = [];
        const lateleave = [];

        let shorttimemin = 0;
        let overtimemin = 0;
        let weeklyoffworkmin = 0;

        periodFilteredAttendance.forEach((entry) => {
            switch (entry.status) {
                case 'present':
                case 'half day':
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

            if (entry.isWeeklyOffWork) {
                const wMin = entry.weeklyOffMinutes || entry.workingMinutes || 0;
                if (wMin > 0) {
                    weeklyoffwork.push(entry.dateKey);
                    weeklyoffworkmin += wMin;
                }
            } else if (entry.status === 'present' || entry.status === 'half day') {
                if (entry.dayType === 'holiday' && entry.workingMinutes > 0) {
                    overtime.push(entry.dateKey);
                    overtimemin += entry.workingMinutes;
                } else {
                    if ((entry.shortMinutes || 0) > 0) {
                        short.push(entry.dateKey);
                        shorttimemin += entry.shortMinutes || 0;
                    }
                    if ((entry.overtimeMinutes || 0) > 0 && !entry.isWeeklyOffDay) {
                        overtime.push(entry.dateKey);
                        overtimemin += entry.overtimeMinutes || 0;
                    }
                }
            }
        });

        const salary = Number(employee?.salary || 0);
        const overtimeAfterMinutes = Number(setting?.workingMinutes?.fullDay || 480);
        const daysInMonth =
            selectedMonth === 'all'
                ? 0
                : dayjs(new Date(selectedYear, Number(selectedMonth), 1)).daysInMonth();

        const netMins = overtimemin - shorttimemin;
        const preciseRate = (salary > 0 && daysInMonth > 0 && overtimeAfterMinutes > 0) ? (salary / daysInMonth / overtimeAfterMinutes) : 0;
        const overtimesalary =
            selectedMonth !== 'all' && salary > 0 && overtimeAfterMinutes > 0 && daysInMonth > 0
                ? (netMins >= 0 ? Math.ceil(netMins * preciseRate) : -Math.ceil(Math.abs(netMins) * preciseRate)).toFixed(2)
                : null;

        return {
            present,
            absent,
            leave,
            holiday,
            short,
            overtime,
            weeklyoffwork,
            shorttimemin,
            overtimemin,
            weeklyoffworkmin,
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

            <div className="p-3 md:p-4 flex flex-wrap gap-3 items-center justify-between rounded-xl border border-slate-200 shadow-xs bg-white mb-4">
                <div className="gap-3 flex items-center">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                    >
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                    >
                        <option value="all">All Months</option>
                        {monthOptions.map((month) => (
                            <option key={month.label} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-end gap-3">
                    {/* Avatar Image */}
                    {employee?.profileimage ? (
                        <img
                            src={cloudinaryUrl(employee?.profileimage, {
                                format: "webp",
                                width: 100,
                                height: 100,
                            })}
                            alt={employee?.name || employee?.userid?.name || "Employee"}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-sm">
                            {user?.name?.charAt(0) || <User size={18} />}
                        </div>
                    )}

                    {/* Employee Info */}
                    <div className="text-end">
                        <p className="font-bold text-sm md:text-base text-slate-800">
                            {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                            {employee?.designation ? `${employee.designation} • ` : ''}({employee?.branchId?.name})
                        </p>
                    </div>
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

                    <div className="p-4 print:hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 rounded-xl border border-slate-200 shadow-xs bg-white my-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                            >
                                <option value="all">All Types</option>
                                <option value="earlyLeave">Early Leave</option>
                                <option value="lateleave">Late Leave</option>
                                <option value="earlyarrival">Early Arrival</option>
                                <option value="latearrival">Late Arrival</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="present">Present</option>
                                <option value="leave">Leave</option>
                                <option value="absent">Absent</option>
                                <option value="weekly off">Weekly off</option>
                                <option value="holiday">Holiday</option>
                                <option value="half day">Half Day</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Over/Short</label>
                            <select
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="overtime">Overtime</option>
                                <option value="short">Short Time</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="w-full h-10 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <RotateCcw size={14} /> Reset
                            </button>
                        </div>
                    </div>

                    <div className='print:hidden'>
                        <DataTable
                            columns={columns()}
                            data={filteredData}
                            pagination
                            customStyles={customStyles}
                            conditionalRowStyles={conditionalRowStyles}
                            highlightOnHover
                            noDataComponent={
                                <div className="flex items-center gap-2 py-6 text-center text-gray-600 text-sm">
                                    <MessageSquareWarning size={18} /> No records found matching your criteria.
                                </div>
                            }
                        />
                    </div>
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
                    <Clock size={16} className="text-blue-700" />
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
                    <Clock size={16} className="text-blue-700" />
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
                            <Info size={16} />
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

            if (!wm) {
                return (
                    <p className="text-[11px] mt-1 font-medium italic">
                        {emp.dayType === 'holiday' ? (
                            <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">Holiday</span>
                        ) : (emp.dayType === 'weekoff' || emp.isWeeklyOffDay) ? (
                            <span className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded border border-purple-100">Weekly Off</span>
                        ) : "-"}
                    </p>
                );
            }
            return (
                <div className="flex flex-col">
                    <span className="flex">
                        <span className="block w-[60px]">{minutesinhours(wm)}</span>
                        {emp.isWeeklyOffWork ? (
                            <span className="ml-2 p-1 rounded bg-purple-100 text-purple-800 text-xs">
                                WO Work {minutesinhours(emp.weeklyOffMinutes || wm)}
                            </span>
                        ) : (
                            <>
                                {emp.shortMinutes > 0 && !emp.isWeeklyOffDay && emp.dayType !== 'holiday' && (
                                    <span className="ml-2 px-1 py-1 rounded bg-amber-100 text-amber-800 text-xs">
                                        Short {minutesinhours(emp.shortMinutes)}
                                    </span>
                                )}
                                {(emp.overtimeMinutes > 0 || emp.dayType === 'holiday') && !emp.isWeeklyOffDay && (
                                    <span className="ml-2 p-1 rounded bg-green-100 text-green-800 text-xs">
                                        Overtime {minutesinhours(emp.overtimeMinutes || wm)}
                                    </span>
                                )}
                            </>
                        )}
                    </span>
                    <p className="text-[11px] mt-1 font-medium italic">
                        {emp.dayType === 'holiday' ? (
                            <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">Holiday</span>
                        ) : (emp.dayType === 'weekoff' || emp.isWeeklyOffDay) ? (
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
