import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Briefcase,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  Check
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import localeData from "dayjs/plugin/localeData";
import { toast } from "../../../utils/toast";
import numberToWords from "../../../utils/numToWord";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { FirstFetch } from "../../../../store/userSlice";
import WeeklyOffLedgerModal from "../../admin/employee/WeeklyOffLedgerModal";

// Custom UI Components
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import NumberInput from "../../../components/ui/NumberInput";
import DateInput from "../../../components/ui/DateInput";
import Select from "../../../components/ui/Select";

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
  const [perminuteRate, setminuteRate] = useState(0);
  const [perDayRate, setPerDayRate] = useState(0);
  const [holidaydate, setholidaydate] = useState([]);
  const [taxrate, settaxrate] = useState(0);
  const [employeeleavebal, setemployeeleavebal] = useState(0);
  const [previousAdvance, setpreviousAdvance] = useState(0);
  const [activeAdvanceInfo, setActiveAdvanceInfo] = useState(null);
  const [previousWeeklyOffAccumulated, setPreviousWeeklyOffAccumulated] = useState(0);

  const { holidays, company, employee, attandence, leaveBalance, advance, payroll } = useSelector(
    (state) => state.user
  );

  // Compute accumulated carry-forward weekly off work minutes from previous months and manual ledger entries
  useEffect(() => {
    if (!selectedEmployee) return;

    const empIdStr = selectedEmployee.toString();

    // 1. Fetch live ledger balance from server to get accurate accumulation
    apiClient({ url: `weekly-off-ledger/${empIdStr}` })
      .then((res) => {
        if (res.success && res.ledger) {
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

  // Fetch existing payroll if in Edit mode
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
    const targetEmpId = selectedEmployee || urlEmployeeId || stateEmployee?._id;
    if (!targetEmpId) return;

    const empIdStr = targetEmpId.toString();

    // Fetch full employee details to guarantee accurate salary, policies, allowances & designations
    apiClient({ url: `getemployee`, params: { empid: empIdStr } })
      .then((res) => {
        if (res && res._id) {
          setSelectedEmployeedetail(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load employee details for payroll:", err);
        if (employees.length > 0) {
          const found = employees.find(e => e._id?.toString() === empIdStr);
          if (found) setSelectedEmployeedetail(found);
        }
      });
  }, [selectedEmployee, urlEmployeeId, stateEmployee, employees]);

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
    };

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await apiClient({
        url: id ? `payroll/${id}` : "payroll",
        method: id ? "PUT" : "POST",
        body: fields
      });

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

  useEffect(() => {
    if (!selectedEmployeedetail?._id) {
      setpreviousAdvance(0);
      setActiveAdvanceInfo(null);
      return;
    }

    const baseAdvance = Number(selectedEmployeedetail.advance || 0);
    setpreviousAdvance(baseAdvance);

    apiClient({ url: `advance/employee/${selectedEmployeedetail._id}` })
      .then((res) => {
        if (res.success && res.data) {
          const advData = res.data;
          setActiveAdvanceInfo(advData);

          const liveBal = advData.totalRemainingBalance !== undefined ? advData.totalRemainingBalance : baseAdvance;
          setpreviousAdvance(liveBal);

          // Auto-adjust advance with scheduled EMI if active advances exist and not in edit mode
          if (!id && liveBal > 0) {
            const suggested = advData.suggestedMonthlyDeduction > 0
              ? Math.min(advData.suggestedMonthlyDeduction, liveBal)
              : liveBal;

            setOptions((prev) => ({
              ...prev,
              adjustAdvance: true,
              adjustedAdvance: suggested,
            }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch employee advance details:", err);
      });
  }, [selectedEmployeedetail?._id, id]);

  function formatRupee(amount) {
    const num = Number(amount);
    const valid = Number.isFinite(num) ? num : 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valid);
  }

  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    calculationBasis: "monthDays",
    allowances: [],
    bonuses: [],
    deductions: [],
    leaveDays: 0,
    absentDays: 0,
    presentDays: 0,
    paidDays: 0,
    adjustPaidLeave: false,
  });

  const [basic, setBasic] = useState({
    totalDays: 0,
    holidaysCount: 0,
    weeklyOff: 0,
    workingDays: 0,
    overtime: 0,
    shortmin: 0,
    weeklyOffWork: 0,
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
    adjustedWeeklyOffMin: undefined,
    deductShortTime: false,
    deductAbsent: false,
    adjustLeave: false,
    adjustAdvance: false,
    adjustedLeaveCount: 0,
    adjustedAdvance: 0,
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
    if (!selectedEmployeedetail) {
      setminuteRate(0);
      setPerDayRate(0);
      return;
    }

    const totalDays = Number(basic?.totalDays) || 30;
    const holidaysCount = Number(basic?.holidaysCount) || 0;
    const weeklyOff = Number(basic?.weeklyOff) || 0;
    const salary = Number(selectedEmployeedetail?.salary) || 0;
    const fullDayMinutes = Number(company?.workingMinutes?.fullDay) || 480;

    let divisor =
      form.calculationBasis === "monthDays"
        ? (totalDays > 0 ? totalDays : 30)
        : Math.max(1, totalDays - (holidaysCount + weeklyOff));

    const perDay = divisor > 0 ? (salary / divisor) : 0;
    const perMinute = fullDayMinutes > 0 ? (perDay / fullDayMinutes) : 0;

    setPerDayRate(Number.isFinite(perDay) ? Number(perDay.toFixed(5)) : 0);
    setminuteRate(Number.isFinite(perMinute) ? Number(perMinute.toFixed(5)) : 0);
  }, [form.calculationBasis, basic, selectedEmployeedetail, company]);

  useEffect(() => {
    if (!holidays) return;
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

  // Attendance fetch
  useEffect(() => {
    if (!targetUserId || !month || !year) return;
    const fetchTargetAttendance = async () => {
      try {
        setLoadingAtt(true);
        const res = await apiClient({
          url: "getAttendanceByUserId",
          params: { userId: targetUserId, month, year }
        });
        setTargetAttendance(res.attendances || []);
      } catch (err) {
        console.error("Error fetching targeted attendance:", err);
        const local = (attandence || []).filter(
          (a) =>
            (a.userId?._id === targetUserId || a.userId === targetUserId) &&
            dayjs(a.date).month() + 1 === Number(month) &&
            dayjs(a.date).year() === Number(year)
        );
        setTargetAttendance(local);
      } finally {
        setLoadingAtt(false);
      }
    };
    fetchTargetAttendance();
  }, [targetUserId, month, year, attandence]);

  // Attendance crunching
  useEffect(() => {
    if (!selectedEmployee) return;

    const monthStart = dayjs(`${year}-${month}-01`);
    const totalDays = monthStart.daysInMonth();
    const isCurrentMonth = monthStart.isSame(dayjs(), "month");
    const daysUpToToday = isCurrentMonth ? dayjs().date() : totalDays;

    const filteredAttendance = targetAttendance.filter((atten) => {
      const d = dayjs(atten.date);
      return d.month() + 1 === Number(month) && d.year() === Number(year);
    });

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
      totalDays,
      workingDays: totalDays - (weeklyOffCount + holidayCount),
      weeklyOff: weeklyOffCount,
      holidaysCount: holidayCount,
      overtime,
      shortmin,
      weeklyOffWork,
    });
  }, [selectedEmployee, targetAttendance, month, year, employees, company, holidays]);

  const effectiveLeaveDays = useMemo(() => {
    if (form.adjustPaidLeave) {
      return Math.max(form.leaveDays - employeeleavebal, 0);
    }
    return form.leaveDays;
  }, [form.leaveDays, form.adjustPaidLeave, employeeleavebal]);

  const leaveDeduction = useMemo(() => {
    return effectiveLeaveDays * perDayRate;
  }, [effectiveLeaveDays, perDayRate]);

  const totalAllowances = useMemo(
    () => form.allowances.reduce((acc, e) => acc + Number(e.amount || 0), 0),
    [form.allowances]
  );

  const totalBonuses = useMemo(
    () => form.bonuses.reduce((acc, e) => acc + Number(e.amount || 0), 0),
    [form.bonuses]
  );

  const totalDeductions = useMemo(
    () => form.deductions.reduce((acc, e) => acc + Number(e.amount || 0), 0),
    [form.deductions, leaveDeduction]
  );

  const grossSalary = useMemo(() => {
    return (
      (selectedEmployeedetail?.salary || 0) +
      totalAllowances +
      totalBonuses
    );
  }, [selectedEmployeedetail?.salary, totalAllowances, totalBonuses]);

  const netSalary = useMemo(() => {
    return Math.round(grossSalary - totalDeductions);
  }, [grossSalary, totalDeductions]);

  const handleArrayChange = (field, index, key, value) => {
    const updated = [...form[field]];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, [field]: updated }));
  };

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

  useEffect(() => {
    if (!selectedEmployeedetail) return;

    setForm(prev => {
      let updatedBonuses = prev.bonuses.filter(b => !b.inputDisabled);
      let updatedDeductions = prev.deductions.filter(d => !d.inputDisabled);

      if (options.addOvertime && basic.overtime > basic.shortmin) {
        const netOvertime = basic.overtime - basic.shortmin;
        updatedBonuses.push({
          name: "Net Overtime",
          amount: (netOvertime * perminuteRate).toFixed(2),
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
          name: "Net Short Time",
          amount: (netShortTime * perminuteRate).toFixed(2),
          extraInfo: `${netShortTime} Min @ ₹${Number(perminuteRate).toFixed(2)}/min (OT: ${basic.overtime}m, ST: ${basic.shortmin}m)`,
          inputDisabled: true
        });
      }

      if (options.deductAbsent && prev.absentDays > 0) {
        updatedDeductions.push({
          name: "Absent",
          amount: (prev.absentDays * perDayRate).toFixed(2),
          extraInfo: `${prev.absentDays} Day(s) @ ₹${Number(perDayRate).toFixed(2)}/day`,
          inputDisabled: true
        });
      }

      if (options.adjustAdvance && previousAdvance > 0 && options.adjustedAdvance > 0) {
        updatedDeductions.push({
          name: "Advance",
          amount: (options.adjustedAdvance).toFixed(2),
          extraInfo: `Adj: ${options.adjustedAdvance}, Rem: ${previousAdvance - options.adjustedAdvance}`,
          inputDisabled: true
        });
      }

      if (options.adjustLeave && prev.leaveDays > 0) {
        const adjusted = Math.min(options.adjustedLeaveCount, employeeleavebal, prev.leaveDays);
        const unadjusted = prev.leaveDays - adjusted;
        if (adjusted > 0) {
          updatedDeductions.push({
            name: "Paid Leave Adjustment",
            amount: (adjusted * perDayRate).toFixed(2),
            extraInfo: `${adjusted} Paid Leave(s) Adjusted`,
            inputDisabled: true
          });
        }
        if (unadjusted > 0) {
          updatedDeductions.push({
            name: "Unpaid Leave",
            amount: (unadjusted * perDayRate).toFixed(2),
            extraInfo: `${unadjusted} Unpaid Leave(s)`,
            inputDisabled: true
          });
        }
      }

      return { ...prev, bonuses: updatedBonuses, deductions: updatedDeductions };
    });
  }, [options, perDayRate, perminuteRate, basic.overtime, basic.shortmin, previousAdvance, employeeleavebal, form.absentDays, form.leaveDays, company, selectedEmployeedetail, totalAvailableWeeklyOffMin]);

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
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
            icon={<ArrowLeft size={15} />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{id ? "Edit Payroll" : "Generate Payroll"}</h1>
            <p className="text-xs text-slate-500">Period: {months[month - 1]} {year}</p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-700">
          {months[month - 1]} {year}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Employee Details Section */}
      {selectedEmployeedetail && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employee Details</h2>
          <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {selectedEmployeedetail?.profileimage ? (
                <img
                  src={cloudinaryUrl(selectedEmployeedetail?.profileimage, {
                    format: "webp",
                    width: 100,
                    height: 100,
                  })}
                  alt={selectedEmployeedetail?.userid?.name}
                  className="w-13 h-13 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm border border-teal-200">
                  {selectedEmployeedetail?.userid?.name?.charAt(0)?.toUpperCase() || 'E'}
                </div>
              )}
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedEmployeedetail?.userid?.name || "Employee"}
                </h3>
                <p className="text-xs text-slate-600">
                  {selectedEmployeedetail?.designation || "N/A"} • {selectedEmployeedetail?.department?.department || selectedEmployeedetail?.department || "N/A"}
                </p>
                <p className="text-xs font-semibold text-teal-700 pt-0.5">
                  Base Salary: {formatRupee(selectedEmployeedetail?.salary || 0)} / month
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 md:pt-0">
              <div className="w-36">
                <DateInput
                  size="sm"
                  label="Issue Date"
                  value={issueDate}
                  onChange={(val) => setIssueDate(val)}
                />
              </div>
              <div className="w-40">
                <Select
                  size="sm"
                  label="Calc. Basis"
                  value={form.calculationBasis}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, calculationBasis: e.target.value }))
                  }
                  options={[
                    { value: "monthDays", label: "Month Days" },
                    { value: "workingDays", label: "Working Days" }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Attendance & Rate Summary */}
      {selectedEmployeedetail && !error && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attendance Summary</h2>

          {/* Attendance Days Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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

          {/* Financial Rates */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Per Day Rate</span>
              <span className="text-lg font-bold text-sky-700 block">{formatRupee(perDayRate)}</span>
              <span className="text-[10px] text-sky-500 italic block">For Absent/Leave</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Per Minute Rate</span>
              <span className="text-lg font-bold text-indigo-700 block">{formatRupee(perminuteRate)}</span>
              <span className="text-[10px] text-indigo-500 italic block">For OT/Short-time</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Overtime</span>
              <span className="text-lg font-bold text-emerald-700 block">{basic.overtime || 0} min</span>
              <span className="text-[10px] text-emerald-600 font-medium block">Est: +{formatRupee(basic.overtime * perminuteRate)}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-xs text-slate-600 uppercase font-semibold block">Short-time</span>
              <span className="text-lg font-bold text-rose-700 block">{basic.shortmin || 0} min</span>
              <span className="text-[10px] text-rose-600 font-medium block">Est: -{formatRupee(basic.shortmin * perminuteRate)}</span>
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
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Adjustments</h2>

          <div className="flex flex-col gap-2.5 pt-1">
            {basic?.overtime > basic?.shortmin && (
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={options.addOvertime}
                  onChange={(e) =>
                    setOptions((p) => ({
                      ...p,
                      addOvertime: e.target.checked,
                      deductShortTime: false,
                    }))
                  }
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                />
                <span>Add Net Overtime ({basic.overtime - basic.shortmin} min)</span>
              </label>
            )}

            {totalAvailableWeeklyOffMin > 0 && (
              <div className="flex flex-col gap-1 border border-purple-200 bg-purple-50/60 p-3 rounded-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
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
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-slate-300"
                    />
                    <span>
                      Add Work on Weekly Off
                      <span className="text-purple-700 font-extrabold ml-1">
                        (Total Available: {totalAvailableWeeklyOffMin} min / {(totalAvailableWeeklyOffMin / 60).toFixed(1)} hrs)
                      </span>
                    </span>
                  </label>

                  {options.addWeeklyOffWork && (
                    <div className="flex items-center gap-2">
                      <div className="w-28">
                        <Input
                          size="sm"
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
                        />
                      </div>
                      <span className="text-xs font-bold text-purple-800 whitespace-nowrap">
                        = {(((options.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin) || 0) / 60).toFixed(1)} hrs
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 pl-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-purple-100/60 mt-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>This Month: <strong className="text-slate-800">{basic?.weeklyOffWork || 0} min</strong></span>
                    <span>Previous Carry Forward: <strong className="text-slate-800">{previousWeeklyOffAccumulated || 0} min</strong></span>
                    {options.addWeeklyOffWork && (
                      <span className="text-purple-700 font-semibold">
                        Remaining: <strong>{Math.max(0, totalAvailableWeeklyOffMin - ((options.adjustedWeeklyOffMin ?? totalAvailableWeeklyOffMin) || 0))} min</strong>
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
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={options.deductShortTime}
                  onChange={(e) =>
                    setOptions((p) => ({
                      ...p,
                      deductShortTime: e.target.checked,
                      addOvertime: false,
                    }))
                  }
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 border-slate-300"
                />
                <span>Deduct Net Short Time ({basic.shortmin - basic.overtime} min)</span>
              </label>
            )}

            {form?.absentDays > 0 && (
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={options.deductAbsent}
                  onChange={(e) =>
                    setOptions((p) => ({
                      ...p,
                      deductAbsent: e.target.checked,
                    }))
                  }
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 border-slate-300"
                />
                <span>Deduct Absent Days ({form.absentDays} days)</span>
              </label>
            )}

            {form?.leaveDays > 0 && (
              <div className="flex items-center flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.adjustLeave}
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        adjustLeave: e.target.checked,
                      }))
                    }
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                  />
                  <span>Adjust Paid Leaves (Available: {employeeleavebal})</span>
                </label>
                {options.adjustLeave && (
                  <div className="w-24">
                    <NumberInput
                      size="sm"
                      label="Count"
                      min={0}
                      max={Math.min(employeeleavebal, form.leaveDays)}
                      value={options.adjustedLeaveCount}
                      onChange={(val) => {
                        const max = Math.min(employeeleavebal, form.leaveDays);
                        setOptions((p) => ({
                          ...p,
                          adjustedLeaveCount: Math.max(0, Math.min(val, max)),
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {previousAdvance > 0 && (
              <div className="flex flex-col gap-1.5 border border-teal-200 bg-teal-50/50 p-3 rounded-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={options.adjustAdvance}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const defaultAmount = activeAdvanceInfo?.suggestedMonthlyDeduction > 0
                          ? Math.min(activeAdvanceInfo.suggestedMonthlyDeduction, previousAdvance)
                          : previousAdvance;
                        setOptions((p) => ({
                          ...p,
                          adjustAdvance: checked,
                          adjustedAdvance: checked
                            ? (p.adjustedAdvance || defaultAmount)
                            : (p.adjustedAdvance || 0),
                        }));
                      }}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                    />
                    <span>
                      Adjust Advance Deduction
                      <span className="text-teal-700 font-extrabold ml-1">
                        (Total Balance Due: {formatRupee(previousAdvance)})
                      </span>
                    </span>
                  </label>

                  {options.adjustAdvance && (
                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <NumberInput
                          size="sm"
                          label="Deduct Amount"
                          min={0}
                          max={previousAdvance}
                          value={options.adjustedAdvance}
                          onChange={(val) => {
                            if (val < 0) {
                              setOptions((p) => ({ ...p, adjustedAdvance: 0 }));
                            } else if (val > previousAdvance) {
                              setOptions((p) => ({ ...p, adjustedAdvance: previousAdvance }));
                            } else {
                              setOptions((p) => ({ ...p, adjustedAdvance: val }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 pl-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-teal-100 mt-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {activeAdvanceInfo?.suggestedMonthlyDeduction > 0 && (
                      <span>
                        Scheduled Monthly EMI: <strong className="text-teal-800 font-semibold">{formatRupee(activeAdvanceInfo.suggestedMonthlyDeduction)}</strong>
                      </span>
                    )}
                    {options.adjustAdvance && (
                      <span className="text-teal-700 font-semibold">
                        Remaining After Deduction: <strong>{formatRupee(Math.max(0, previousAdvance - (options.adjustedAdvance || 0)))}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/advance?employeeId=${selectedEmployeedetail._id}`)}
                    className="text-teal-700 font-bold hover:underline text-[11px] cursor-pointer"
                  >
                    View Advance Records →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 & 5. Allowances, Bonuses, Deductions & Salary Summary */}
      {selectedEmployeedetail && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Allowances Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Allowances</h3>
                <span className="font-bold text-teal-700 text-xs">{formatRupee(totalAllowances)}</span>
              </div>
              <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                {form?.allowances?.map((allowance, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      size="sm"
                      label="Name"
                      value={allowance.name}
                      onChange={(e) => handleArrayChange("allowances", index, "name", e.target.value)}
                    />
                    <div className="w-28">
                      <NumberInput
                        size="sm"
                        label="Amount"
                        disabled={allowance.inputDisabled || false}
                        value={allowance.amount}
                        onChange={(val) => handleArrayChange("allowances", index, "amount", val)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeArrayItem("allowances", index)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <Button
              icon={<Plus size={14} />}
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("allowances", { name: "", amount: 0, extraInfo: '', inputDisabled: false })}
              className="w-full mt-2"
            >
              Add Allowance
            </Button>
          </div>

          {/* Bonuses Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Bonuses</h3>
                <span className="font-bold text-emerald-700 text-xs">{formatRupee(totalBonuses)}</span>
              </div>
              <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                {form?.bonuses?.map((bonus, index) => (
                  <div key={index} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Input
                        size="sm"
                        label="Name"
                        value={bonus.name}
                        onChange={(e) => handleArrayChange("bonuses", index, "name", e.target.value)}
                      />
                      <div className="w-28">
                        <NumberInput
                          size="sm"
                          label="Amount"
                          disabled={bonus.inputDisabled || false}
                          value={bonus.amount}
                          onChange={(val) => handleArrayChange("bonuses", index, "amount", val)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArrayItem("bonuses", index)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {bonus.extraInfo && (
                      <span className="text-[10px] text-slate-500 pl-1">{bonus.extraInfo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              icon={<Plus size={14} />}
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("bonuses", { name: "", amount: 0, extraInfo: '', inputDisabled: false })}
              className="w-full mt-2"
            >
              Add Bonus
            </Button>
          </div>

          {/* Deductions Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Deductions</h3>
                <span className="font-bold text-rose-700 text-xs">{formatRupee(totalDeductions)}</span>
              </div>
              <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                {form?.deductions?.map((deduction, index) => (
                  <div key={index} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Input
                        size="sm"
                        label="Deduction"
                        value={deduction.name}
                        onChange={(e) => handleArrayChange("deductions", index, "name", e.target.value)}
                      />
                      <div className="w-28">
                        <NumberInput
                          size="sm"
                          label="Amount"
                          disabled={deduction?.inputDisabled || false}
                          value={deduction.amount}
                          onChange={(val) => handleArrayChange("deductions", index, "amount", val)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArrayItem("deductions", index)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {deduction.extraInfo && (
                      <span className="text-[10px] text-slate-500 pl-1">{deduction.extraInfo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              icon={<Plus size={14} />}
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("deductions", { name: "", amount: 0, extraInfo: '', inputDisabled: false })}
              className="w-full mt-2"
            >
              Add Deduction
            </Button>
          </div>

          {/* Salary Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Salary Summary</h3>
              </div>
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
                <div className="border-t border-slate-100 my-1.5" />
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Gross Salary :</span>
                  <span>{formatRupee(grossSalary)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1">
                  <span>Deductions :</span>
                  <span className="font-semibold text-rose-700">-{formatRupee(totalDeductions)}</span>
                </div>
                <div className="border-t border-slate-100 my-1.5" />
                <div className="flex justify-between items-center font-extrabold text-slate-900 text-sm pt-0.5">
                  <span>Net Salary :</span>
                  <span className="text-base text-slate-900 font-black">{formatRupee(netSalary)}</span>
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
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || !selectedEmployee}
              className="px-8"
            >
              {id ? "Update Payroll" : "Save Payroll"}
            </Button>
          </div>

        </div>
      )}

      {/* Weekly Off Work Ledger History Modal */}
      <WeeklyOffLedgerModal
        open={showWOLedgerModal}
        onClose={() => setShowWOLedgerModal(false)}
        employee={selectedEmployeedetail}
      />

      {success && <p className="text-emerald-600 font-semibold text-center mt-2 text-sm">{success}</p>}
    </div>
  );
}
