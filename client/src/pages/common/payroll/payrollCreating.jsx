import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Button,
  Grid,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Box,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { AiOutlinePlus } from "react-icons/ai";
import { useSelector, useDispatch } from "react-redux";
import { MdDelete } from "react-icons/md";
import { FaArrowLeft, FaCalendarAlt, FaUserAlt, FaBuilding, FaBriefcase, FaMoneyBillWave, FaClock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import localeData from "dayjs/plugin/localeData";
import { toast } from "react-toastify";
import numberToWords from "../../../utils/numToWord";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { FirstFetch } from "../../../../store/userSlice";
import WeeklyOffLedgerModal from "../../admin/employee/WeeklyOffLedgerModal";

dayjs.extend(localeData);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

export default function PayrollCreatePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id, employeeId } = useParams();
  const [employees, setEmployees] = useState([]);
  const [editPayrollData, setEditPayrollData] = useState(null);

  const stateEmployee = location.state?.employeee;
  const stateMonth = location.state?.month;
  const stateYear = location.state?.year;

  const urlEmployeeId = searchParams.get("employeeId");
  const urlMonth = Number(searchParams.get("month"));
  const urlYear = Number(searchParams.get("year"));

  const month = editPayrollData?.month || stateMonth || urlMonth || (new Date().getMonth() + 1);
  const year = editPayrollData?.year || stateYear || urlYear || new Date().getFullYear();

  const [selectedEmployee, setSelectedEmployee] = useState(stateEmployee?._id || employeeId || urlEmployeeId || "");
  const [selectedEmployeedetail, setSelectedEmployeedetail] = useState(stateEmployee || null);
  const [perminuteRate, setminuteRate] = useState(0)
  const [perDayRate, setPerDayRate] = useState(0)
  const [holidaydate, setholidaydate] = useState([]);
  const [taxrate, settaxrate] = useState(0);
  const [employeeleavebal, setemployeeleavebal] = useState(0);
  const [previousAdvance, setpreviousAdvance] = useState(0);
  const [previousWeeklyOffAccumulated, setPreviousWeeklyOffAccumulated] = useState(0);

  const { holidays, company, employee, attandence, leaveBalance, advance, payroll } = useSelector(
    (state) => state.user
  );

  // Compute accumulated carry-forward weekly off work minutes from previous months and manual ledger entries
  useEffect(() => {
    if (!selectedEmployee) return;

    const empIdStr = selectedEmployee.toString();

    // 1. Fetch live ledger balance from server to get accurate accumulation (including manual adjustments)
    apiClient({ url: `weekly-off-ledger/${empIdStr}` })
      .then((res) => {
        if (res.success && res.ledger) {
          // Calculate accumulation excluding the current month if not yet closed
          const prevEntries = res.ledger.filter((item) => {
            if (id && item.payrollId?.toString() === id.toString()) return false;
            const itemYear = item.year || (item.date ? new Date(item.date).getFullYear() : new Date(item.createdAt).getFullYear());
            const itemMonth = item.month || (item.date ? new Date(item.date).getMonth() + 1 : new Date(item.createdAt).getMonth() + 1);

            if (itemYear < year) return true;
            if (itemYear === year && itemMonth < month) return true;
            return false;
          });

          let acc = 0;
          prevEntries.forEach((item) => {
            if (item.type === "EARNED" || item.type === "MANUAL_ADD") {
              acc += item.minutes;
            } else if (item.type === "PAYROLL_PAID" || item.type === "MANUAL_DEDUCT") {
              acc -= item.minutes;
            }
          });
          setPreviousWeeklyOffAccumulated(Math.max(0, acc));
        }
      })
      .catch(() => {
        // Fallback to local payroll calculation if network fails
        if (!payroll || !month || !year) return;
        const prevPayrolls = payroll.filter((p) => {
          const pEmpId = p.employeeId?._id?.toString() || p.employeeId?.toString();
          if (pEmpId !== empIdStr) return false;
          if (id && p._id?.toString() === id.toString()) return false;
          if (p.year < year) return true;
          if (p.year === year && p.month < month) return true;
          return false;
        });

        let accumulated = 0;
        prevPayrolls.forEach((p) => {
          const earnedWO = p.weeklyOffWork || 0;
          let paidWO = 0;
          if (p.options?.addWeeklyOffWork) {
            paidWO = p.options?.adjustedWeeklyOffMin !== undefined ? Number(p.options.adjustedWeeklyOffMin) || 0 : earnedWO;
          }
          accumulated += (earnedWO - paidWO);
        });

        setPreviousWeeklyOffAccumulated(Math.max(0, accumulated));
      });
  }, [selectedEmployee, month, year, payroll, id]);

  // Fetch existing payroll if in Edit mode (id is provided)
  useEffect(() => {
    if (!id) return;
    const fetchPayroll = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient({
          url: `payroll/${id}`
        });
        if (result.payroll) {
          setEditPayrollData(result.payroll);
        }
      } catch (err) {
        console.error("Failed to fetch existing payroll:", err);
        setError("Failed to fetch payroll for editing");
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, [id]);

  useEffect(() => {
    if (!stateEmployee && urlEmployeeId && employees.length > 0) {
      const found = employees.find(e => e._id === urlEmployeeId);
      if (found) {
        setSelectedEmployeedetail(found);
      }
    }
  }, [selectedEmployee, employees, stateEmployee, urlEmployeeId]);

  useEffect(() => {
    if (!stateEmployee && !urlEmployeeId && !id) {
      console.error("No employee data provided");
    } else {
      console.log(location.state || { id, employeeId: urlEmployeeId, month, year });
    }
  }, [stateEmployee, urlEmployeeId, id]);



  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Populate form & options when editPayrollData loads
  useEffect(() => {
    if (!editPayrollData) return;

    const autoBonusNames = ["Overtime", "Net Overtime", "Work on Weekly Off"];
    const autoDeductionNames = ["Short Time", "Net Short Time", "Absent", "Advance", "Paid Leave Adjustment", "Unpaid Leave"];

    const loadedAllowances = (editPayrollData.allowances || []).map(a => ({ ...a, inputDisabled: false }));
    const loadedBonuses = (editPayrollData.bonuses || []).map(b => ({
      ...b,
      inputDisabled: autoBonusNames.includes(b.name)
    }));
    const loadedDeductions = (editPayrollData.deductions || []).map(d => ({
      ...d,
      inputDisabled: autoDeductionNames.includes(d.name)
    }));

    setForm(prev => ({
      ...prev,
      month: editPayrollData.month,
      year: editPayrollData.year,
      calculationBasis: editPayrollData.calculationBasis || "monthDays",
      allowances: loadedAllowances,
      bonuses: loadedBonuses,
      deductions: loadedDeductions,
      leaveDays: editPayrollData.leave,
      absentDays: editPayrollData.absent,
      presentDays: editPayrollData.present,
      paidDays: 0,
      adjustPaidLeave: false,
    }));

    if (editPayrollData.issueDate) {
      setIssueDate(dayjs(editPayrollData.issueDate).format("YYYY-MM-DD"));
    }
    if (editPayrollData.options) {
      setOptions(editPayrollData.options);
    }

    const empId = editPayrollData.employeeId?._id || editPayrollData.employeeId;
    if (empId) {
      setSelectedEmployee(empId);
      if (employees && employees.length > 0) {
        const found = employees.find(e => e._id === empId);
        if (found) setSelectedEmployeedetail(found);
      }
    }
  }, [editPayrollData, employees]);

  const handleSubmit = async () => {
    if (!selectedEmployeedetail) return toast.error("Employee details missing");

    const fields = {
      employeeId: selectedEmployeedetail._id,
      calculationBasis: form.calculationBasis,
      options,
      basic,
      month: id ? (editPayrollData?.month || month) : month,
      year: id ? (editPayrollData?.year || year) : year,
      issueDate: issueDate || undefined,
      present: form.presentDays,
      leave: form.leaveDays,
      absent: form.absentDays,
      allowances: form.allowances,
      bonuses: form.bonuses,
      deductions: form.deductions,
      taxRate: taxrate,
      name: selectedEmployeedetail?.userid?.name,
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await apiClient({
        url: id ? `payroll/${id}` : "payroll",
        method: id ? "PUT" : "POST",
        body: fields
      });

      // Post PAYROLL_PAID entry to WeeklyOffLedger if weekly off work was paid
      if (options.addWeeklyOffWork) {
        const paidMin = Number(options.adjustedWeeklyOffMin !== undefined ? options.adjustedWeeklyOffMin : totalAvailableWeeklyOffMin) || 0;
        if (paidMin > 0) {
          try {
            await apiClient({
              url: "weekly-off-ledger",
              method: "POST",
              body: {
                employeeId: selectedEmployee,
                type: "PAYROLL_PAID",
                minutes: paidMin,
                particulars: `Paid in ${months[month - 1]} ${year} Payroll`,
                month,
                year,
                payrollId: data.payroll?._id || data._id || id,
              }
            });
          } catch (e) {
            console.error("Failed to post weekly off ledger entry:", e);
          }
        }
      }

      toast.success(data.message || (id ? "Payroll updated successfully!" : "Payroll created successfully!"));
      dispatch(FirstFetch());
      setSuccess(id ? "Payroll updated successfully!" : "Payroll created successfully!");
      setTimeout(() => navigate(-1), 1500);

    } catch (error) {
      console.error(id ? 'Error updating payroll:' : 'Error creating payroll:', error);
      toast.error(error?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEmployeedetail || !leaveBalance) return;

    const employeeBalances = leaveBalance.filter(
      (e) => e.employeeId?._id?.toString() === selectedEmployeedetail._id?.toString()
    );
    const totalRemaining = employeeBalances.reduce((sum, item) => sum + (item.remaining || 0), 0);

    setemployeeleavebal(totalRemaining);
  }, [leaveBalance, selectedEmployeedetail]);

  const alredyPayroll = useMemo(() => {
    let hey = {};
    payroll.forEach((p) => {
      let empId = p.employeeId._id;
      if (hey.hasOwnProperty(empId)) {
        hey[empId].push(`${p.month}-${p.year}`)
      } else {
        hey[empId] = [`${p.month}-${p.year}`]
      }
    })
    // console.log(hey)
    return hey;
  }, [payroll])

  useEffect(() => {
    if (!selectedEmployeedetail) return;
    setpreviousAdvance(selectedEmployeedetail.advance || 0);
  }, [selectedEmployeedetail]);

  function formatRupee(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    calculationBasis: "monthDays", // ✅ new: monthDays | workingDays
    allowances: [], //{ name: "HRA", amount: 0, extraInfo: '', inputDisabled: false }
    bonuses: [], //{ name: "Performance", amount: 0, extraInfo: '', inputDisabled: false }
    deductions: [], // { name: "PF", amount: 0, extraInfo: '', inputDisabled: false }
    leaveDays: 0,
    absentDays: 0,
    presentDays: 0,
    paidDays: 0,
    adjustPaidLeave: false, // ✅ toggle for paid leave adjustment
  });

  const [basic, setBasic] = useState({
    totalDays: 0,
    holidaysCount: 0,
    weeklyOff: 0,
    workingDays: 0,
    overtime: 0,
    shortmin: 0,
  });

  const [showWOLedgerModal, setShowWOLedgerModal] = useState(false);

  const totalAvailableWeeklyOffMin = useMemo(() => {
    return (previousWeeklyOffAccumulated || 0) + (basic?.weeklyOffWork || 0);
  }, [previousWeeklyOffAccumulated, basic?.weeklyOffWork]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const optionsinit = {
    addOvertime: false,
    addWeeklyOffWork: false,
    adjustedWeeklyOffMin: undefined, // custom minutes user wants to adjust/pay
    deductShortTime: false,
    deductAbsent: false,
    adjustLeave: false,
    adjustAdvance: false,
    adjustedLeaveCount: 0, // how many leaves user wants to adjust
    adjustedAdvance: 0, // how many leaves user wants to adjust
  };

  const [options, setOptions] = useState(optionsinit);

  // Load employees
  useEffect(() => {
    if (employee && employee.length > 0) {
      setEmployees(employee);
    } else {
      const fetchEmployeesList = async () => {
        try {
          const res = await apiClient({ url: 'employeelist' });
          const empList = res.list || res.employees || res.data || (Array.isArray(res) ? res : []);
          setEmployees(empList);
        } catch (err) {
          console.error("Failed to load employees for payroll creation:", err);
        }
      };
      fetchEmployeesList();
    }
  }, [employee]);

  useEffect(() => {
    if (!selectedEmployeedetail || !basic?.totalDays || !company?.workingMinutes) return;

    let divisor =
      form.calculationBasis === "monthDays"
        ? basic.totalDays || 1
        : basic.totalDays - (basic.holidaysCount + basic.weeklyOff) || 1;

    const perDay = selectedEmployeedetail.salary / divisor;
    const perMinute = perDay / company.workingMinutes.fullDay;

    setminuteRate(Number(perMinute.toFixed(5)));
    setPerDayRate(Number(perDay.toFixed(5)));
  }, [form.calculationBasis, basic, selectedEmployeedetail, company]);

  useEffect(() => {
    if (!holidays) return;
    // console.log(holidays)

    const dateObjects = [];
    holidays.forEach(holiday => {
      let current = dayjs(holiday.fromDate);
      const end = holiday.toDate ? dayjs(holiday.toDate) : current;

      while (current.isSameOrBefore(end, 'day')) {
        dateObjects.push(current.format('DD/MM/YYYY'));
        current = current.add(1, 'day');
      }

    });
    setholidaydate(dateObjects);
  }, [holidays]);

  const [targetAttendance, setTargetAttendance] = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(false);

  const targetUserId = selectedEmployeedetail?.userid?._id || selectedEmployeedetail?.userid || stateEmployee?.userid?._id || stateEmployee?.userid;

  // Fetch target month attendance for the selected employee from API (strictly once per employee/month/year)
  useEffect(() => {
    if (!selectedEmployee || !targetUserId) return;

    const fetchTargetAttendance = async () => {
      try {
        setLoadingAtt(true);
        const res = await apiClient({
          url: 'employeeAttandence',
          params: {
            userid: targetUserId,
            month: month - 1, // backend accepts 0-indexed month
            year: year
          }
        });
        setTargetAttendance(res?.attandence || res?.attendance || []);
      } catch (err) {
        console.error("Error fetching target attendance for payroll:", err);
        setTargetAttendance([]);
      } finally {
        setLoadingAtt(false);
      }
    };

    fetchTargetAttendance();
  }, [selectedEmployee, targetUserId, month, year]);

  // Compute attendance
  useEffect(() => {
    if (!selectedEmployee) return;
    setError(null)

    if (!id && alredyPayroll[selectedEmployee] && alredyPayroll[selectedEmployee].includes(`${month}-${year}`)) {
      return setError(`Payroll for this employee is already generated for: ${dayjs(`${year}-${month}-01`).format("MMM-YYYY")}`)
    }

    const selected = employees.find((e) => e._id === selectedEmployee);
    if (!id) {
      setOptions(optionsinit);
    }
    setSelectedEmployeedetail(selected);

    const monthStart = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const isCurrentMonth = monthStart.isSame(dayjs(), "month");
    const monthEnd = monthStart.endOf("month");
    const totalDays = monthEnd.date();

    // Use targetAttendance fetched from backend for this specific month & year
    const filteredAttendance = targetAttendance;

    const { present, absent, leaves, overtime, shortmin, weeklyOffWork } = filteredAttendance.reduce(
      (acc, atten) => {
        if (atten.status === "present") acc.present++;
        if (atten.status === "absent") acc.absent++;
        if (atten.status === "leave") acc.leaves++;
        if (atten.status === "half day") {
          acc.present += 0.5;
          acc.absent += 0.5;
        }

        const { workingMinutes, overtimeMinutes, shortMinutes, weeklyOffMinutes, dayType } = atten;

        if (dayType === "weekoff" || (weeklyOffMinutes && weeklyOffMinutes > 0)) {
          const wMin = weeklyOffMinutes || workingMinutes || 0;
          if (wMin > 0) {
            acc.weeklyOffWork += wMin;
          }
        } else if (atten.status === "present") {
          if (dayType === "holiday") {
            if (workingMinutes > 0) {
              acc.overtime += workingMinutes;
            }
          } else {
            if ((shortMinutes || 0) > 0) {
              acc.shortmin += shortMinutes;
            }
            if ((overtimeMinutes || 0) > 0) {
              acc.overtime += overtimeMinutes;
            }
          }
        }
        return acc;
      },
      { present: 0, absent: 0, leaves: 0, overtime: 0, shortmin: 0, weeklyOffWork: 0 }
    );

    setForm((prev) => ({
      ...prev,
      leaveDays: leaves,
      absentDays: absent,
      presentDays: present,
      paidDays: present,
    }));

    // Weekly offs
    let weeklyOffCount = 0;
    for (let i = 1; i <= totalDays; i++) {
      const currentDate = monthStart.date(i);
      if (company?.weeklyOffs?.includes(currentDate.day())) {
        weeklyOffCount++;
      }
    }

    // Holidays
    let holidayCount = 0;
    holidays?.forEach((h) => {
      const holidayStart = dayjs(h.fromDate);
      const holidayEnd = dayjs(h.toDate);
      for (let i = 1; i <= totalDays; i++) {
        const currentDate = monthStart.date(i);
        if (isCurrentMonth && currentDate.isAfter(dayjs(), "day")) break;
        if (currentDate.isBetween(holidayStart, holidayEnd, "day", "[]")) {
          holidayCount++;
        }
      }
    });

    setBasic({
      // monthDays,
      totalDays,
      workingDays: totalDays - (weeklyOffCount + holidayCount),
      weeklyOff: weeklyOffCount,
      holidaysCount: holidayCount,
      overtime,
      shortmin,
      weeklyOffWork,
    });
  }, [selectedEmployee, targetAttendance, month, year, employees, company, holidays]);

  // ✅ Leave deduction logic
  const effectiveLeaveDays = useMemo(() => {
    if (form.adjustPaidLeave) {
      // Leaves covered by available paid leaves
      return Math.max(form.leaveDays - employeeleavebal, 0);
    }
    return form.leaveDays;
  }, [form.leaveDays, form.adjustPaidLeave, employeeleavebal]);

  const leaveDeduction = useMemo(() => {
    return effectiveLeaveDays * perDayRate;
  }, [effectiveLeaveDays, perDayRate]);

  const totalAllowances = useMemo(
    () => form.allowances.reduce((acc, e) => acc + Number(e.amount), 0),
    [form.allowances]
  );

  const totalBonuses = useMemo(
    () => form.bonuses.reduce((acc, e) => acc + Number(e.amount), 0),
    [form.bonuses]
  );

  const totalDeductions = useMemo(
    () => form.deductions.reduce((acc, e) => acc + Number(e.amount), 0),
    [form.deductions, leaveDeduction]
  );

  const grossSalary = useMemo(() => {
    return (
      // perDayRate * form.paidDays || 0) +
      selectedEmployeedetail?.salary +
      totalAllowances +
      totalBonuses
    );
  }, [perDayRate, form.paidDays, totalAllowances, totalBonuses]);

  const tax = useMemo(() => {
    return (
      ((grossSalary * taxrate) / 100).toFixed(2)
    );
  }, [grossSalary, taxrate]);

  const minutesinhours = useCallback((minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour}h ${minute}m`;
  }, []);

  const netSalary = useMemo(() => {
    // return grossSalary - tax;
    // return Math.floor(grossSalary - tax);
    return Math.round(grossSalary - totalDeductions);
  }, [grossSalary, totalDeductions]);

  // const netSalary = useMemo(() => {
  //   return selectedEmployeedetail?.salary - totalDeductions;
  // }, [grossSalary, totalDeductions]);

  const handleArrayChange = (field, index, key, value) => {
    const updated = [...form[field]];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, [field]: updated }));
  };

  // ✅ Effect 1: Initialize policies when employee changes
  useEffect(() => {
    if (!selectedEmployeedetail) return;

    let initialAllowances = [];
    let initialBonuses = [];
    let initialDeductions = [];

    if (selectedEmployeedetail?.defaultPolicies) {
      initialAllowances = selectedEmployeedetail.allowances?.map(e => ({
        name: e.name, amount: e.value, extraInfo: '', inputDisabled: false
      })) || [];
      initialBonuses = selectedEmployeedetail.bonuses?.map(e => ({
        name: e.name, amount: e.value, extraInfo: '', inputDisabled: false
      })) || [];
      initialDeductions = selectedEmployeedetail.deductions?.map(e => ({
        name: e.name, amount: e.value, extraInfo: '', inputDisabled: false
      })) || [];
    } else if (company?.payrollPolicies) {
      initialAllowances = company.payrollPolicies?.allowances?.map(e => ({
        name: e.name, amount: e.value, extraInfo: '', inputDisabled: false
      })) || [];
      initialBonuses = company.payrollPolicies?.bonuses?.map(e => ({
        name: e.name, amount: e.value, extraInfo: '', inputDisabled: false
      })) || [];
      initialDeductions = company.payrollPolicies?.deductions?.map(e => ({
        name: e.name, amount: e.value, extraInfo: '', inputDisabled: false
      })) || [];
    }

    setForm(prev => ({
      ...prev,
      allowances: initialAllowances,
      bonuses: initialBonuses,
      deductions: initialDeductions,
    }));
  }, [selectedEmployeedetail, company]);

  // ✅ Effect 2: Inject/Update Adjustment rows without overwriting manual entries
  useEffect(() => {
    if (!selectedEmployeedetail) return;

    setForm(prev => {
      // 1. Keep manual entries, remove all auto-generated ones
      let updatedBonuses = prev.bonuses.filter(b => !b.inputDisabled);
      let updatedDeductions = prev.deductions.filter(d => !d.inputDisabled);

      // 2. Inject current Adjustments
      if (options.addOvertime && basic.overtime > basic.shortmin) {
        const netOvertime = basic.overtime - basic.shortmin;
        updatedBonuses.push({
          name: "Net Overtime", amount: (netOvertime * perminuteRate).toFixed(2),
          extraInfo: `${netOvertime} Min @ ₹${Number(perminuteRate).toFixed(2)}/min (OT: ${basic.overtime}m, ST: ${basic.shortmin}m)`,
          inputDisabled: true
        });
      }

      if (options.addWeeklyOffWork) {
        const woMinToPay = Number(options.adjustedWeeklyOffMin !== undefined ? options.adjustedWeeklyOffMin : totalAvailableWeeklyOffMin) || 0;
        if (woMinToPay > 0) {
          const remainingWO = Math.max(0, totalAvailableWeeklyOffMin - woMinToPay);

          updatedBonuses.push({
            name: "Work on Weekly Off",
            amount: (woMinToPay * perminuteRate).toFixed(2),
            extraInfo: `${woMinToPay} Min (${(woMinToPay / 60).toFixed(1)} hrs) @ ₹${Number(perminuteRate).toFixed(2)}/min | Carry Forward: ${remainingWO} Min`,
            inputDisabled: true
          });
        }
      }

      if (options.deductShortTime && basic.shortmin > basic.overtime) {
        const netShortTime = basic.shortmin - basic.overtime;
        updatedDeductions.push({
          name: "Net Short Time", amount: (netShortTime * perminuteRate).toFixed(2),
          extraInfo: `${netShortTime} Min @ ₹${Number(perminuteRate).toFixed(2)}/min (OT: ${basic.overtime}m, ST: ${basic.shortmin}m)`,
          inputDisabled: true
        });
      }

      if (options.deductAbsent && prev.absentDays > 0) {
        updatedDeductions.push({
          name: "Absent", amount: (prev.absentDays * perDayRate).toFixed(2),
          extraInfo: `${prev.absentDays} Day(s) @ ₹${Number(perDayRate).toFixed(2)}/day`,
          inputDisabled: true
        });
      }

      if (options.adjustAdvance && previousAdvance > 0 && options.adjustedAdvance > 0) {
        updatedDeductions.push({
          name: "Advance", amount: (options.adjustedAdvance).toFixed(2),
          extraInfo: `Adj: ${options.adjustedAdvance}, Rem: ${previousAdvance - options.adjustedAdvance}`,
          inputDisabled: true
        });
      }

      if (options.adjustLeave && prev.leaveDays > 0) {
        const adjusted = Math.min(options.adjustedLeaveCount, employeeleavebal, prev.leaveDays);
        const unadjusted = prev.leaveDays - adjusted;
        if (adjusted > 0) {
          updatedDeductions.push({
            name: "Paid Leave Adjustment", amount: (adjusted * perDayRate).toFixed(2),
            extraInfo: `${adjusted} Paid Leave(s) Adjusted`,
            inputDisabled: true
          });
        }
        if (unadjusted > 0) {
          updatedDeductions.push({
            name: "Unpaid Leave", amount: (unadjusted * perDayRate).toFixed(2),
            extraInfo: `${unadjusted} Unpaid Leave(s)`,
            inputDisabled: true
          });
        }
      }

      return { ...prev, bonuses: updatedBonuses, deductions: updatedDeductions };
    });
  }, [options, perDayRate, perminuteRate, basic.overtime, basic.shortmin, previousAdvance, employeeleavebal, form, company, selectedEmployeedetail, totalAvailableWeeklyOffMin]);


  const addArrayItem = (field, item) =>
    setForm((prev) => ({ ...prev, [field]: [...prev[field], item] }));

  const removeArrayItem = (field, index) =>
    setForm((prev) => {
      const updated = [...prev[field]];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });



  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 text-slate-800">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outlined"
            size="small"
            startIcon={<FaArrowLeft />}
            className="!border-slate-300 !text-slate-700 hover:!bg-slate-50 text-xs"
          >
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{id ? "Edit Payroll" : "Generate Payroll"}</h1>
            <p className="text-xs text-slate-500">Period: {months[month - 1]} {year}</p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-700">
          {months[month - 1]} {year}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 1. Employee Details Section */}
      {selectedEmployeedetail && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Employee Details</h2>
          <Divider className="!mb-4" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div className="flex items-center gap-4">
              <Avatar
                src={cloudinaryUrl(selectedEmployeedetail?.profileimage, {
                  format: "webp",
                  width: 100,
                  height: 100,
                })}
                sx={{ width: 52, height: 52 }}
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedEmployeedetail?.userid?.name || "Employee"}
                  </h3>

                </div>
                <p className="text-xs text-slate-600">
                  {selectedEmployeedetail?.designation || "N/A"} • {selectedEmployeedetail?.department?.department || selectedEmployeedetail?.department || "N/A"}
                </p>
                <p className="text-xs font-semibold text-slate-700 pt-0.5">
                  Base Salary: {formatRupee(selectedEmployeedetail?.salary || 0)} / month
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 md:pt-0">
              <TextField
                size="small"
                type="date"
                label="Issue Date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                className="w-40"
              />
              <FormControl size="small" className="w-40">
                <InputLabel>Calc. Basis</InputLabel>
                <Select
                  label="Calc. Basis"
                  value={form.calculationBasis}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, calculationBasis: e.target.value }))
                  }
                >
                  <MenuItem value="monthDays">Month Days</MenuItem>
                  <MenuItem value="workingDays">Working Days</MenuItem>
                </Select>
              </FormControl>
            </div>

          </div>
        </div>
      )}

      {/* 2. Attendance & Rate Summary */}
      {selectedEmployeedetail && !error && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Attendance Summary</h2>
          <Divider />

          {/* Attendance Days Pills */}
          <div className="grid p-1 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Total Days</span>
              <span className="text-base font-bold text-slate-800">{basic.totalDays}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Holidays</span>
              <span className="text-base font-bold text-slate-800">{basic.holidaysCount}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Weekly Offs</span>
              <span className="text-base font-bold text-slate-800">{basic.weeklyOff}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Working Days</span>
              <span className="text-base font-bold text-slate-800">{basic.workingDays}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Present</span>
              <span className="text-base font-bold text-slate-800">{form.presentDays || 0}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Leave</span>
              <span className="text-base font-bold text-slate-800">{form.leaveDays || 0}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Absent</span>
              <span className="text-base font-bold text-slate-800">{form.absentDays || 0}</span>
            </div>
          </div>

          <Divider />

          {/* Financial Rates */}
          <div className="grid grid-cols-2 p-1 mt-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Per Day Rate</span>
              <span className="text-lg font-bold text-blue-700 block">{formatRupee(perDayRate)}</span>
              <span className="text-[10px] text-blue-500 italic block">For Absent/Leave</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Per Minute Rate</span>
              <span className="text-lg font-bold text-indigo-700 block">{formatRupee(perminuteRate)}</span>
              <span className="text-[10px] text-indigo-500 italic block">For OT/Short-time</span>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Overtime</span>
              <span className="text-lg font-bold text-green-700 block">{basic.overtime || 0} min</span>
              <span className="text-[10px] text-green-600 font-medium block">Est: +{formatRupee(basic.overtime * perminuteRate)}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Short-time</span>
              <span className="text-lg font-bold text-red-700 block">{basic.shortmin || 0} min</span>
              <span className="text-[10px] text-red-600 font-medium block">Est: -{formatRupee(basic.shortmin * perminuteRate)}</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 col-span-2 md:col-span-1">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Weekly Off Work</span>
              <span className="text-lg font-bold text-purple-700 block">{basic.weeklyOffWork || 0} min</span>
              <span className="text-[10px] text-purple-600 font-medium block">
                {previousWeeklyOffAccumulated > 0 ? `+${previousWeeklyOffAccumulated}m prev | ` : ''}Total: {totalAvailableWeeklyOffMin}m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Adjustments */}
      {selectedEmployeedetail && !error && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Adjustments</h2>
          <Divider />

          <div className="flex flex-col gap-2 pt-1">
            {basic?.overtime > basic?.shortmin && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.addOvertime}
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        addOvertime: e.target.checked,
                        deductShortTime: false,
                      }))
                    }
                    size="small"
                  />
                }
                label={<span className="text-xs font-medium text-slate-700">Add Net Overtime ({basic.overtime - basic.shortmin} min)</span>}
              />
            )}

            {totalAvailableWeeklyOffMin > 0 && (
              <div className="flex flex-col gap-1 border border-purple-200 bg-purple-50/60 p-3 rounded-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={options.addWeeklyOffWork || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setOptions((p) => ({
                            ...p,
                            addWeeklyOffWork: checked,
                            adjustedWeeklyOffMin: checked
                              ? (p.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin)
                              : (p.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin),
                          }));
                        }}
                        size="small"
                      />
                    }
                    label={
                      <span className="text-xs font-bold text-slate-800">
                        Add Work on Weekly Off
                        <span className="text-purple-700 font-extrabold ml-1">
                          (Total Available: {totalAvailableWeeklyOffMin} min / {(totalAvailableWeeklyOffMin / 60).toFixed(1)} hrs)
                        </span>
                      </span>
                    }
                  />

                  {options.addWeeklyOffWork && (
                    <div className="flex items-center gap-2">
                      <TextField
                        type="tel"
                        size="small"
                        className="w-32 bg-white"
                        label="Min to Pay"
                        value={options.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/\D/g, "");
                          const val = sanitized === "" ? 0 : Number(sanitized);
                          setOptions((p) => ({
                            ...p,
                            adjustedWeeklyOffMin: val,
                          }));
                        }}
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "[0-9]*"
                        }}
                      />
                      <span className="text-xs font-bold text-purple-800 whitespace-nowrap">
                        = {(((options.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin) || 0) / 60).toFixed(1)} hrs
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 pl-7 flex items-center justify-between flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-purple-100/60 mt-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>This Month: <strong className="text-slate-800">{basic?.weeklyOffWork || 0} min</strong></span>
                    <span>Previous Carry Forward: <strong className="text-slate-800">{previousWeeklyOffAccumulated || 0} min</strong></span>
                    {options.addWeeklyOffWork && (
                      <span className="text-purple-700 font-semibold">
                        Remaining Carry Forward: <strong>{Math.max(0, totalAvailableWeeklyOffMin - ((options.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin) || 0))} min</strong>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWOLedgerModal(true)}
                    className="text-purple-700 font-bold hover:underline text-[11px] cursor-pointer"
                  >
                    View Ledger History →
                  </button>
                </div>
              </div>
            )}

            {basic?.shortmin > basic?.overtime && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.deductShortTime}
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        deductShortTime: e.target.checked,
                        addOvertime: false,
                      }))
                    }
                    size="small"
                  />
                }
                label={<span className="text-xs font-medium text-slate-700">Deduct Net Short Time ({basic.shortmin - basic.overtime} min)</span>}
              />
            )}

            {form?.absentDays > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.deductAbsent}
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        deductAbsent: e.target.checked,
                      }))
                    }
                    size="small"
                  />
                }
                label={<span className="text-xs font-medium text-slate-700">Deduct Absent Days ({form.absentDays} days)</span>}
              />
            )}

            {form?.leaveDays > 0 && (
              <div className="flex items-center flex-wrap gap-3 pt-1">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.adjustLeave}
                      onChange={(e) =>
                        setOptions((p) => ({
                          ...p,
                          adjustLeave: e.target.checked,
                        }))
                      }
                      size="small"
                    />
                  }
                  label={<span className="text-xs font-medium text-slate-700">Adjust Paid Leaves (Available: {employeeleavebal})</span>}
                />
                {options.adjustLeave && (
                  <TextField
                    type="number"
                    size="small"
                    className="w-28"
                    label="Count"
                    inputProps={{
                      min: 0,
                      max: Math.min(employeeleavebal, form.leaveDays),
                    }}
                    value={options.adjustedLeaveCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const max = Math.min(employeeleavebal, form.leaveDays);
                      setOptions((p) => ({
                        ...p,
                        adjustedLeaveCount: Math.max(0, Math.min(val, max)),
                      }));
                    }}
                  />
                )}
              </div>
            )}

            {previousAdvance > 0 && (
              <div className="flex items-center flex-wrap gap-3 pt-1">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.adjustAdvance}
                      onChange={(e) =>
                        setOptions((p) => ({
                          ...p,
                          adjustAdvance: e.target.checked,
                        }))
                      }
                      size="small"
                    />
                  }
                  label={<span className="text-xs font-medium text-slate-700">Adjust Advance (Balance: {formatRupee(previousAdvance)})</span>}
                />
                {options.adjustAdvance && (
                  <TextField
                    type="number"
                    size="small"
                    className="w-32"
                    label="Amount"
                    inputProps={{
                      min: 0,
                      max: previousAdvance,
                    }}
                    value={options.adjustedAdvance}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < 0) {
                        setOptions((p) => ({ ...p, adjustedAdvance: 0 }));
                      } else if (val > previousAdvance) {
                        setOptions((p) => ({ ...p, adjustedAdvance: previousAdvance }));
                      } else {
                        setOptions((p) => ({ ...p, adjustedAdvance: val }));
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 & 5. Allowances, Bonuses, Deductions & Salary Summary (2 sections per row) */}
      {selectedEmployeedetail && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Allowances Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-bold text-slate-800 text-sm">Allowances</h3>
                <span className="font-bold text-slate-700 text-xs">{formatRupee(totalAllowances)}</span>
              </div>
              <Divider />
              <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                {form?.allowances?.map((allowance, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <TextField
                      size="small"
                      label="Name"
                      className="flex-1"
                      value={allowance.name}
                      onChange={(e) => handleArrayChange("allowances", index, "name", e.target.value)}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Amount"
                      className="w-24"
                      InputProps={{ readOnly: allowance.inputDisabled || false }}
                      value={allowance.amount}
                      onChange={(e) => handleArrayChange("allowances", index, "amount", e.target.value)}
                    />
                    <IconButton size="small" onClick={() => removeArrayItem("allowances", index)}>
                      <MdDelete />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
            <Button
              startIcon={<AiOutlinePlus />}
              variant="outlined"
              size="small"
              onClick={() => addArrayItem("allowances", { name: "", amount: 0, extraInfo: '', inputDisabled: false })}
              className="w-full !mt-2"
            >
              Add Allowance
            </Button>
          </div>

          {/* Bonuses Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-bold text-slate-800 text-sm">Bonuses</h3>
                <span className="font-bold text-slate-700 text-xs">{formatRupee(totalBonuses)}</span>
              </div>
              <Divider />
              <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                {form?.bonuses?.map((bonus, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <TextField
                        size="small"
                        label="Name"
                        className="flex-1"
                        value={bonus.name}
                        onChange={(e) => handleArrayChange("bonuses", index, "name", e.target.value)}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Amount"
                        className="w-24"
                        InputProps={{ readOnly: bonus.inputDisabled || false }}
                        value={bonus.amount}
                        onChange={(e) => handleArrayChange("bonuses", index, "amount", e.target.value)}
                      />
                      <IconButton size="small" onClick={() => removeArrayItem("bonuses", index)}>
                        <MdDelete />
                      </IconButton>
                    </div>
                    {bonus.extraInfo && (
                      <span className="text-[10px] text-slate-500">{bonus.extraInfo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              startIcon={<AiOutlinePlus />}
              variant="outlined"
              size="small"
              onClick={() => addArrayItem("bonuses", { name: "", amount: 0, extraInfo: '', inputDisabled: false })}
              className="w-full !mt-2"
            >
              Add Bonus
            </Button>
          </div>

          {/* Deductions Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-bold text-slate-800 text-sm">Deductions</h3>
                <span className="font-bold text-slate-700 text-xs">{formatRupee(totalDeductions)}</span>
              </div>
              <Divider />
              <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                {form?.deductions?.map((deduction, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <TextField
                        size="small"
                        label="Deduction"
                        className="flex-1"
                        value={deduction.name}
                        onChange={(e) => handleArrayChange("deductions", index, "name", e.target.value)}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Amount"
                        className="w-24"
                        InputProps={{ readOnly: deduction?.inputDisabled || false }}
                        value={deduction.amount}
                        onChange={(e) => handleArrayChange("deductions", index, "amount", e.target.value)}
                      />
                      <IconButton size="small" onClick={() => removeArrayItem("deductions", index)}>
                        <MdDelete />
                      </IconButton>
                    </div>
                    {deduction.extraInfo && (
                      <span className="text-[10px] text-slate-500">{deduction.extraInfo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              startIcon={<AiOutlinePlus />}
              variant="outlined"
              size="small"
              onClick={() => addArrayItem("deductions", { name: "", amount: 0, extraInfo: '', inputDisabled: false })}
              className="w-full !mt-2"
            >
              Add Deduction
            </Button>
          </div>

          {/* Salary Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-bold text-slate-800 text-sm">Salary Summary</h3>
              </div>
              <Divider />
              <div className="space-y-2 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Base Salary :</span>
                  <span className="font-semibold text-slate-800">{formatRupee(selectedEmployeedetail?.salary || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Allowances :</span>
                  <span className="font-semibold text-slate-800">+{formatRupee(totalAllowances)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Bonuses :</span>
                  <span className="font-semibold text-slate-800">+{formatRupee(totalBonuses)}</span>
                </div>
                <Divider className="!my-1.5" />
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Gross Salary :</span>
                  <span>{formatRupee(grossSalary)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1">
                  <span>Deductions :</span>
                  <span className="font-semibold text-rose-700">-{formatRupee(totalDeductions)}</span>
                </div>
                <Divider className="!my-1.5" />
                <div className="flex justify-between items-center font-extrabold text-slate-900 text-sm pt-0.5">
                  <span>Net Salary :</span>
                  <span className="text-base text-slate-900">{formatRupee(netSalary)}</span>
                </div>
                <div className="text-[11px] text-slate-500 italic capitalize pt-1">
                  In Words: {numberToWords(netSalary)}
                </div>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="col-span-1 md:col-span-2 flex justify-start pt-2">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmit}
              disabled={loading || !selectedEmployee}
              className="!px-8 !py-2.5 !rounded-lg"
            >
              {loading ? "Saving..." : id ? "Update Payroll" : "Save Payroll"}
            </Button>
          </div>

        </div>
      )}

      {/* Weekly Off Work Ledger History Modal (Shared Component) */}
      <WeeklyOffLedgerModal
        open={showWOLedgerModal}
        onClose={() => setShowWOLedgerModal(false)}
        employee={selectedEmployeedetail}
      />

      {success && <p className="text-emerald-600 font-semibold text-center mt-2 text-sm">{success}</p>}
    </div>
  );
}
