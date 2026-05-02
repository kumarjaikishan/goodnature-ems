import { useEffect, useState, useMemo } from 'react';
import {
    Avatar, Box, Typography, TextField,
    InputAdornment, FormControl, InputLabel, OutlinedInput,
    Select, MenuItem,
    Button,
    IconButton
} from '@mui/material';
import { IoSearch } from "react-icons/io5";
import { CiFilter } from "react-icons/ci";
import DataTable from 'react-data-table-component';
import { BiMessageRoundedError } from "react-icons/bi";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween'
import localeData from "dayjs/plugin/localeData";
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { FiDownload } from 'react-icons/fi';
import RegisterView from './registerView';
import { MdClear } from 'react-icons/md';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
dayjs.extend(localeData);
dayjs.extend(isBetween);

const AttendanceReport = () => {
    const [employeelist, setemployeelist] = useState([]);
    const [departmentlist, setdepartmentlist] = useState([]);
    const [theme, setTheme] = useState(true);
    const [csvcall, setcsvcall] = useState(false);
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
    let navigate = useNavigate();


    const { department, branch, employee, attandence, holidays, company, profile } = useSelector(e => e.user);
    const employepic = 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp';

    // update department list when branch changes
    useEffect(() => {
        if (filters.branch === "all") {
            setdepartmentlist([]);
        } else {
            setdepartmentlist(department.filter(dep => dep?.branchId?._id === filters.branch));
        }
    }, [filters.branch, department]);

    // build report data

    const [basic, setbasic] = useState({
        totalDays: 0,
        holidaysCount: 0,
        weeklyOff: 0,
        workingDays: 0,
    })

    useEffect(() => {
        if (employee?.length < 1) return;

        const monthStart = dayjs(`${filters.year}-${filters.month}-01`);
        const isCurrentMonth = monthStart.isSame(dayjs(), "month");
        const monthEnd = isCurrentMonth ? dayjs() : monthStart.endOf("month");
        const totalDays = monthEnd.date();

        // ✅ Weekly off calculation
        let weeklyOffCount = 0;
        for (let i = 1; i <= totalDays; i++) {
            const currentDate = monthStart.date(i);
            if (company?.weeklyOffs?.includes(currentDate.day())) {
                weeklyOffCount++;
            }
        }

        // ✅ Holidays calculation
        let holidayCount = 0;
        holidays?.forEach(h => {
            const holidayStart = dayjs(h.fromDate);
            const holidayEnd = dayjs(h.toDate);

            for (let i = 1; i <= totalDays; i++) {
                const currentDate = monthStart.date(i);

                // only count holidays till today if current month
                if (isCurrentMonth && currentDate.isAfter(dayjs(), "day")) break;

                if (currentDate.isBetween(holidayStart, holidayEnd, "day", "[]")) {
                    holidayCount++;
                }
            }
        });

        const totalworkingdays = totalDays - (weeklyOffCount + holidayCount);

        setbasic({
            totalDays,
            workingDays: totalworkingdays,
            weeklyOff: weeklyOffCount,
            holidaysCount: holidayCount,
        });

        // ✅ Pre-group attendance by employeeId
        const attendanceByEmp = {};
        attandence
            ?.filter(a => dayjs(a.date).isSame(monthStart, "month"))
            .forEach(a => {
                const empId = a.employeeId._id;
                if (!attendanceByEmp[empId]) {
                    attendanceByEmp[empId] = [];
                }
                attendanceByEmp[empId].push(a);
            });
        //   console.log(employee)
        const data = employee.filter(e => e.status).map((emp, idx) => {
            const empAttendance = attendanceByEmp[emp._id] || [];

            const present = empAttendance.filter(a => a.status === "present").length;
            const absent = empAttendance.filter(a => a.status === "absent").length;
            const leave = empAttendance.filter(a => a.status === "leave").length;

            return {
                id: emp._id,
                rawname: emp?.userid?.name,
                branch: emp?.branchId,
                department: emp?.department?._id,
                name: (
                    <div className="flex items-center capitalize gap-3">
                        <Avatar
                            src={cloudinaryUrl(emp.profileimage, {
                                format: "webp",
                                width: 100,
                                height: 100,
                            }) || employepic}
                            alt={emp.employeename} />
                        <Box>
                            <Typography variant="body2">{emp?.userid?.name}</Typography>
                            <p className="text-[10px] text-gray-600">({emp?.designation})</p>
                        </Box>
                    </div>
                ),
                totalDays: present + absent + leave + holidayCount + weeklyOffCount,
                weeklyOff: weeklyOffCount,
                holidayCount: holidayCount,
                leave,
                absent,
                present,
                action: (
                    <div className="action flex gap-2.5">
                        <span className="text-[18px] text-amber-500 cursor-pointer" title="Attandence Report" onClick={() => navigate(`/dashboard/performance/${emp.userid._id}?month=${filters.month - 1}&year=${filters.year}`)} ><HiOutlineDocumentReport /></span>
                    </div>
                )
            };
        });

        setemployeelist(data);
    }, [employee, attandence, holidays, filters.month, filters.year, company.weeklyoff]);


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
        setcsvcall(true)
    };


    return (
        <div className='employee p-2 '>
            {/* Filters */}
            <div className="flex  flex-wrap gap-3 items-center justify-between mb-3">
                <div className="flex  flex-wrap gap-3 items-center">
                    <TextField
                        size="small"
                        className='md:w-[160px] w-full'
                        value={filters.searchText}
                        onChange={(e) => handleFilterChange("searchText", e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start"><IoSearch /></InputAdornment>
                            ),
                            endAdornment: filters.searchText && (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => handleFilterChange("searchText", '')}
                                        edge="end"
                                        size="small"
                                    >
                                        <MdClear />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        label="Search Employee"
                    />

                    {/* Branch */}
                    <FormControl size="small" className="md:w-[140px] w-[47%]">
                        <InputLabel>Branch</InputLabel>
                        <Select
                            value={filters.branch}
                            onChange={(e) => handleFilterChange("branch", e.target.value)}
                            input={
                                <OutlinedInput
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <CiFilter fontSize="small" />
                                        </InputAdornment>
                                    }
                                    label="Branch"
                                />
                            }

                        >
                            <MenuItem value="all">All</MenuItem>
                            {/* {branch?.map((list) => (
                                <MenuItem key={list._id} value={list._id}>{list.name}</MenuItem>
                            ))} */}

                            {profile?.role === 'manager'
                                ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
                                    ?.map((list) => (
                                        <MenuItem key={list._id} value={list._id}>
                                            {list.name}
                                        </MenuItem>
                                    ))
                                :
                                branch?.map((list) => (
                                    <MenuItem key={list._id} value={list._id}> {list.name} </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>

                    {/* Department */}
                    <FormControl size="small" className="md:w-[140px] w-[47%]">
                        <InputLabel>Department</InputLabel>
                        <Select
                            disabled={filters.branch === "all"}
                            value={filters.department}
                            input={
                                <OutlinedInput
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <CiFilter fontSize="small" />
                                        </InputAdornment>
                                    }
                                    label="Department"
                                />
                            }
                            onChange={(e) => handleFilterChange("department", e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            {departmentlist.length > 0 ? (
                                departmentlist.map((list) => (
                                    <MenuItem key={list._id} value={list._id}>{list.department}</MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No departments found</MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {/* Year */}
                    <FormControl size="small" className="md:w-[100px] w-[47%]">
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={filters.year}
                            label="Year"
                            onChange={(e) => handleFilterChange("year", e.target.value)}
                        >
                            {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Month */}
                    <FormControl size="small" className="md:w-[130px] w-[47%]">
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={filters.month}
                            label="Month"
                            onChange={(e) => handleFilterChange("month", e.target.value)}
                        >
                            {dayjs.months().map((m, idx) => (
                                <MenuItem key={idx + 1} value={idx + 1}>{m}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </div>
                <div className=" w-full md:w-fit">
                    <Button onClick={exportCSV2call} className="flex-1" variant='outlined' startIcon={<FiDownload />} >Export</Button>
                </div>
            </div>

            <div className="mt-4 bg-white rounded shadow p-1 md:p-3">
                <div className="text-xl relative font-semibold flex justify-between mb-5">
                    <p className="text-gray-700">
                        Daily Attendance Report -{" "}
                        {dayjs(`${filters.year}-${filters.month}-01`).format("MMMM YYYY")}
                    </p>

                    {/* Toggle Switch */}
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={theme}
                            onChange={() => setTheme(!theme)}
                            className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 relative transition-colors">
                            {/* <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-6"></div> */}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                            {theme ? "Light Theme" : "Dark Theme"}
                        </span>
                    </label>

                </div>

                <RegisterView csvcall={csvcall} filters={filters} setcsvcall={setcsvcall} theme={theme} />
            </div>

        </div>
    );
};

export default AttendanceReport;
