import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { MessageSquareWarning, RotateCcw, Clock, Info } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import EmployeeProfileCard from '../../../components/performanceCard';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import Select from '@/components/ui/Select';
import DateInput from '@/components/ui/DateInput';
import Button from '@/components/ui/Button';

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
    const yearOptions = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
        label: `${currentYear + 1 - i}`,
        value: currentYear + 1 - i
    })), [currentYear]);

    const monthOptions = useMemo(() => [
        { label: 'All Months', value: 'all' },
        ...Array.from({ length: 12 }, (_, i) => ({
            label: dayjs().month(i).format('MMMM'),
            value: i,
        }))
    ], []);

    const normalizedAttendance = useMemo(() => {
        if (!attendance?.length) return [];
        return attendance.map((entry) => {
            const dateObj = dayjs(entry.date);
            const dateKey = dateObj.format('YYYY-MM-DD');
            const isSpecialDay = entry.dayType === 'holiday';

            return {
                ...entry,
                dateKey,
                dayName: dateObj.format('dddd'),
                rawDate: dateObj,
                isSpecialDay,
            };
        });
    }, [attendance]);

    const periodFilteredAttendance = useMemo(() => {
        if (!normalizedAttendance.length) return [];

        return normalizedAttendance.filter((entry) => {
            const entryDate = entry.rawDate;
            const matchesYear = selectedYear === 'all' || entryDate.year() === Number(selectedYear);
            const matchesMonth = selectedMonth === 'all' || entryDate.month() === Number(selectedMonth);
            return matchesYear && matchesMonth;
        });
    }, [normalizedAttendance, selectedYear, selectedMonth]);

    const hell = useMemo(() => {
        const stats = {
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

        periodFilteredAttendance.forEach((entry) => {
            if (entry.status === 'present') stats.present.push(entry);
            if (entry.status === 'absent') stats.absent.push(entry);
            if (entry.status === 'leave') stats.leave.push(entry);
            if (entry.status === 'holiday') stats.holiday.push(entry);

            if (entry.shortMinutes > 0) {
                stats.short.push(entry);
                stats.shorttimemin += entry.shortMinutes;
            }
            if (entry.overtimeMinutes > 0) {
                stats.overtime.push(entry);
                stats.overtimemin += entry.overtimeMinutes;
            }
            if (entry.weeklyOffMinutes > 0) {
                stats.weeklyoffwork.push(entry);
                stats.weeklyoffworkmin += entry.weeklyOffMinutes;
            }
            if (entry.lateArrival) stats.latearrival.push(entry);
            if (entry.earlyArrival) stats.earlyarrival.push(entry);
            if (entry.earlyLeave) stats.earlyLeave.push(entry);
            if (entry.lateLeave) stats.lateleave.push(entry);
        });

        return stats;
    }, [periodFilteredAttendance]);

    const filteredData = useMemo(() => {
        return periodFilteredAttendance.filter((entry) => {
            if (statusFilter !== 'all' && entry.status !== statusFilter) return false;

            if (typeFilter === 'earlyLeave' && !entry.earlyLeave) return false;
            if (typeFilter === 'lateleave' && !entry.lateLeave) return false;
            if (typeFilter === 'earlyarrival' && !entry.earlyArrival) return false;
            if (typeFilter === 'latearrival' && !entry.lateArrival) return false;

            if (timeFilter === 'overtime' && !(entry.overtimeMinutes > 0)) return false;
            if (timeFilter === 'short' && !(entry.shortMinutes > 0)) return false;

            if (fromDate && entry.rawDate.isBefore(dayjs(fromDate), 'day')) return false;
            if (toDate && entry.rawDate.isAfter(dayjs(toDate), 'day')) return false;

            return true;
        });
    }, [periodFilteredAttendance, statusFilter, typeFilter, timeFilter, fromDate, toDate]);

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
        <div className="p-2 md:p-6 space-y-4 max-w-7xl mx-auto">
            <div className="p-4 flex flex-wrap gap-3 items-center justify-between rounded-xl shadow-xs border border-slate-200/80 bg-white">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="w-28">
                        <Select
                            size="sm"
                            label="Year"
                            options={yearOptions}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        />
                    </div>

                    <div className="w-40">
                        <Select
                            size="sm"
                            label="Month"
                            options={monthOptions}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="text-right">
                    <p className="font-bold text-sm md:text-base text-slate-800">{profile?.userid?.name}</p>
                    <p className="text-xs text-slate-500">{profile?.branchId?.name || 'Main Branch'}</p>
                </div>
            </div>

            <EmployeeProfileCard
                employee={profile}
                attandence={periodFilteredAttendance}
                hell={hell}
            />

            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 rounded-xl shadow-xs border border-slate-200/80 bg-white">
                <Select
                    size="sm"
                    label="Punch Type"
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Early Leave', value: 'earlyLeave' },
                        { label: 'Late Leave', value: 'lateleave' },
                        { label: 'Early Arrival', value: 'earlyarrival' },
                        { label: 'Late Arrival', value: 'latearrival' }
                    ]}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                />

                <Select
                    size="sm"
                    label="Status"
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Present', value: 'present' },
                        { label: 'Leave', value: 'leave' },
                        { label: 'Absent', value: 'absent' },
                        { label: 'Weekly Off', value: 'weekly off' },
                        { label: 'Holiday', value: 'holiday' },
                        { label: 'Half Day', value: 'half day' }
                    ]}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                />

                <Select
                    size="sm"
                    label="Over / Short"
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Overtime', value: 'overtime' },
                        { label: 'Short Time', value: 'short' }
                    ]}
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                />

                <DateInput
                    size="sm"
                    label="From Date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                />

                <DateInput
                    size="sm"
                    label="To Date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                />

                <div className="flex items-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        startIcon={RotateCcw}
                        className="w-full"
                    >
                        Reset
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <DataTable
                    columns={columns()}
                    data={filteredData}
                    pagination
                    customStyles={customStyles}
                    conditionalRowStyles={conditionalRowStyles}
                    highlightOnHover
                    noDataComponent={
                        <div className="flex items-center gap-2 py-8 justify-center text-slate-500 text-sm">
                            <MessageSquareWarning size={18} /> No records found matching your criteria.
                        </div>
                    }
                />
            </div>
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
        when: row => row.status === 'absent',
        style: {
            backgroundColor: '#fef2f2',
            color: '#991b1b',
        },
    },
    {
        when: row => row.status === 'holiday',
        style: {
            backgroundColor: '#eff6ff',
            color: '#1e40af',
        },
    },
    {
        when: row => row.status === 'weekly off',
        style: {
            backgroundColor: '#fefce8',
            color: '#854d0e',
        },
    },
];

const columns = () => [
    {
        name: 'Date',
        selector: (row) => row.dateKey,
        sortable: true,
        width: '120px',
        cell: (row) => dayjs(row.date).format('DD MMM YYYY')
    },
    {
        name: 'Day',
        selector: (row) => row.dayName,
        width: '100px'
    },
    {
        name: 'In Time',
        selector: (row) => row.inTime || '-',
        width: '100px'
    },
    {
        name: 'Out Time',
        selector: (row) => row.outTime || '-',
        width: '100px'
    },
    {
        name: 'Work Hours',
        selector: (row) => minutesinhours(row.workingMinutes || 0),
        width: '110px'
    },
    {
        name: 'Overtime',
        selector: (row) => row.overtimeMinutes > 0 ? `+${minutesinhours(row.overtimeMinutes)}` : '-',
        width: '100px',
        cell: (row) => row.overtimeMinutes > 0 ? (
            <span className="text-emerald-700 font-bold">+{minutesinhours(row.overtimeMinutes)}</span>
        ) : '-'
    },
    {
        name: 'Short Time',
        selector: (row) => row.shortMinutes > 0 ? `-${minutesinhours(row.shortMinutes)}` : '-',
        width: '100px',
        cell: (row) => row.shortMinutes > 0 ? (
            <span className="text-red-700 font-bold">-{minutesinhours(row.shortMinutes)}</span>
        ) : '-'
    },
    {
        name: 'Status',
        selector: (row) => row.status,
        width: '120px',
        cell: (row) => (
            <span className="capitalize font-semibold text-xs">{row.status}</span>
        )
    }
];
