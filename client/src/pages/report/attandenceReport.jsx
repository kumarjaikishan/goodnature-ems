import { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import localeData from "dayjs/plugin/localeData";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Download, X } from 'lucide-react';
import RegisterView from './registerView';
import { apiClient } from '../../utils/apiClient';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

dayjs.extend(localeData);
dayjs.extend(isBetween);

const AttendanceReport = () => {
    const [departmentlist, setdepartmentlist] = useState([]);
    const [theme, setTheme] = useState(true);
    const [csvcall, setcsvcall] = useState(false);
    const [reportAttendance, setReportAttendance] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const queryMonth = searchParams.get('month');
    const queryYear = searchParams.get('year');

    const [filters, setFilters] = useState({
        searchText: '',
        branch: 'all',
        department: 'all',
        month: queryMonth ? parseInt(queryMonth, 10) : dayjs().month() + 1,
        year: queryYear ? parseInt(queryYear, 10) : dayjs().year()
    });

    const { department, branch, profile } = useSelector(e => e.user);

    // Fetch month & year specific attendance report from backend API
    useEffect(() => {
        const fetchReport = async () => {
            try {
                setReportLoading(true);
                const res = await apiClient({
                    url: 'attendanceReport',
                    params: {
                        month: filters.month,
                        year: filters.year,
                        branchId: filters.branch,
                        departmentId: filters.department,
                    }
                });
                setReportAttendance(res?.attendance || []);
            } catch (err) {
                console.error("Error fetching attendance report:", err);
                setReportAttendance([]);
            } finally {
                setReportLoading(false);
            }
        };
        fetchReport();
    }, [filters.month, filters.year, filters.branch, filters.department]);

    // update department list when branch changes
    useEffect(() => {
        if (filters.branch === "all") {
            setdepartmentlist([]);
        } else {
            setdepartmentlist(department.filter(dep => dep?.branchId?._id === filters.branch));
        }
    }, [filters.branch, department]);

    useEffect(() => {
        if (!searchParams.get('month') || !searchParams.get('year')) {
            setSearchParams({ month: filters.month, year: filters.year });
        }
    }, []);

    // handle filters
    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'month' || key === 'year') {
                setSearchParams({ month: next.month, year: next.year });
            }
            return next;
        });
    };

    const exportCSV2call = () => {
        setcsvcall(true);
    };

    const branchOptions = [
        { label: 'All Branches', value: 'all' },
        ...(profile?.role === 'manager'
            ? (branch || []).filter(e => profile?.branchIds?.includes(e._id))
            : (branch || [])
        ).map(b => ({ label: b.name, value: b._id }))
    ];

    const departmentOptions = [
        { label: 'All Departments', value: 'all' },
        ...departmentlist.map(d => ({ label: d.department, value: d._id }))
    ];

    const yearOptions = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(y => ({
        label: `${y}`,
        value: y
    }));

    const monthOptions = dayjs.months().map((m, idx) => ({
        label: m,
        value: idx + 1
    }));

    return (
        <div className='p-2 md:p-6 space-y-4 max-w-full'>
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="w-full sm:w-56">
                        <Input
                            size="sm"
                            startIcon={Search}
                            placeholder="Search employee..."
                            value={filters.searchText}
                            onChange={(e) => handleFilterChange("searchText", e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-44">
                        <Select
                            size="sm"
                            options={branchOptions}
                            value={filters.branch}
                            onChange={(e) => handleFilterChange("branch", e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-44">
                        <Select
                            size="sm"
                            disabled={filters.branch === "all"}
                            options={departmentOptions}
                            value={filters.department}
                            onChange={(e) => handleFilterChange("department", e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-28">
                        <Select
                            size="sm"
                            options={yearOptions}
                            value={filters.year}
                            onChange={(e) => handleFilterChange("year", Number(e.target.value))}
                        />
                    </div>

                    <div className="w-full sm:w-36">
                        <Select
                            size="sm"
                            options={monthOptions}
                            value={filters.month}
                            onChange={(e) => handleFilterChange("month", Number(e.target.value))}
                        />
                    </div>
                </div>

                <div>
                    <Button
                        onClick={exportCSV2call}
                        variant="outline"
                        size="sm"
                        startIcon={Download}
                    >
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Attendance Matrix Register */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
                <div className="flex flex-wrap justify-between items-center mb-4 pb-3 border-b border-slate-100 gap-2">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">
                            Monthly Attendance Register
                        </h3>
                        <p className="text-xs text-slate-500">
                            Period: {dayjs(`${filters.year}-${filters.month}-01`).format("MMMM YYYY")}
                        </p>
                    </div>

                    {/* Toggle Switch */}
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-xs font-semibold text-slate-600">
                            {theme ? "Executive Matrix" : "High Contrast"}
                        </span>
                        <input
                            type="checkbox"
                            checked={theme}
                            onChange={() => setTheme(!theme)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                    </label>
                </div>

                <RegisterView
                    csvcall={csvcall}
                    filters={filters}
                    setcsvcall={setcsvcall}
                    theme={theme}
                    reportAttendance={reportAttendance}
                    reportLoading={reportLoading}
                />
            </div>
        </div>
    );
};

export default AttendanceReport;
