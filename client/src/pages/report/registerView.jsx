import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FileText, User } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import { TableRowSkeleton } from "../../components/skeletons";

const RegisterView = ({ filters, setcsvcall, csvcall, reportAttendance, reportLoading }) => {
  const monthStart = dayjs(`${filters.year}-${filters.month}-01`);
  const isCurrentMonth = monthStart.isSame(dayjs(), "month");
  const monthEnd = isCurrentMonth ? dayjs() : monthStart.endOf("month");
  const totalDays = monthEnd.date();
  const [employeeleavesadjusted, setemployeeleavesadjusted] = useState([]);

  // Generate all days for header
  const days = Array.from({ length: totalDays }, (_, i) =>
    monthStart.date(i + 1)
  );

  const { employee, attandence, holidays, company, leaveBalance } = useSelector((e) => e.user || {});
  const employeeList = Array.isArray(employee) ? employee : [];

  useEffect(() => {
    if (!csvcall) return;
    exportCSV2();
    setcsvcall(false);
  }, [csvcall]);

  useEffect(() => {
    const selectedPeriod = dayjs(`${filters.year}-${filters.month}-01`);
    const thisMonthLeaves = (leaveBalance || []).filter((e) => {
      if (e.type !== "debit" || !e.period) return false;

      const [m, y] = e.period.split("-");
      const periodDate = dayjs(`${y}-${m}-01`, "YYYY-M-DD");

      return periodDate.isSame(selectedPeriod, "month");
    });

    setemployeeleavesadjusted(thisMonthLeaves);
  }, [filters, leaveBalance]);

  // Apply filters
  const filteredEmployees = employeeList.filter((emp) => {
    if (!emp || !emp.status) return false;

    const nameMatch =
      filters.searchText.trim() === "" ||
      emp.userid?.name
        ?.toLowerCase()
        .includes(filters.searchText.toLowerCase());

    const deptMatch =
      filters.department === "all" ||
      emp?.department?._id === filters.department;
    const branchMatch =
      filters.branch === "all" || emp?.branchId === filters.branch;

    return nameMatch && deptMatch && branchMatch;
  });

  const navigate = useNavigate();

  // Active attendance list from API prop (or fallback to redux state)
  const activeAttendance = reportAttendance || attandence || [];

  // Pre-group attendance
  const attendanceByEmp = {};
  activeAttendance?.forEach((a) => {
    const empId = a.employeeId?._id || a.employeeId;
    if (!attendanceByEmp[empId]) attendanceByEmp[empId] = {};
    attendanceByEmp[empId][dayjs(a.date).date()] = a;
  });

  // Holidays + Weekly Offs
  const holidayDates = new Set();
  const holidayNames = {};
  holidays?.forEach((h) => {
    const start = dayjs(h.fromDate);
    const end = dayjs(h.toDate);
    for (
      let d = start;
      d.isBefore(end) || d.isSame(end, "day");
      d = d.add(1, "day")
    ) {
      if (d.isSame(monthStart, "month")) {
        holidayDates.add(d.date());
        holidayNames[d.date()] = h.name || h.title || "Holiday";
      }
    }
  });

  const weeklyOffDays = company?.weeklyOffs || [];

  const renderStatus = (empId, dayObj) => {
    const day = dayObj.date();
    const entry = attendanceByEmp[empId]?.[day];
    let status = entry?.status || "-";

    // Map attendance to short codes
    if (status === "present") status = "P";
    else if (status === "leave") status = "L";
    else if (status === "absent") status = "A";
    else if (status === "weekly off") status = "W";
    else if (status === "holiday") status = "H";

    const isWeekend = dayObj.day() === 0; // Sunday

    // Build hover tooltip ONLY for Absent ('A') and Leave ('L')
    let tooltipTitle = undefined;

    if (status === "A" || status === "L") {
      const header = `${dayObj.format("DD MMM YYYY")} (${dayObj.format("dddd")})`;
      const details = [];

      const statusLabel = status === "A" ? "Absent" : "Leave";
      details.push(`Status: ${statusLabel}`);

      if (entry) {
        const leaveType = entry.leave?.policyId?.name || entry.leave?.type;
        if (leaveType) {
          details.push(`Leave Type: ${leaveType}`);
        }

        const leaveReason = (entry.leave?.reason || "").trim();
        const attendanceRemarks = (entry.remarks || "").trim();

        if (leaveReason) {
          details.push(`Reason: ${leaveReason}`);
        }

        if (attendanceRemarks && attendanceRemarks.toLowerCase() !== leaveReason.toLowerCase()) {
          details.push(`Remarks: ${attendanceRemarks}`);
        }
      }

      tooltipTitle = `${header}\n• ${details.join("\n• ")}`;
    }

    // Light dashed-border theme badges
    const badgeStyles = {
      P: "bg-green-200 text-green-900 border border-green-500 border-dashed",
      A: "bg-red-200 text-red-900 border border-red-500 border-dashed",
      L: "bg-red-200 text-red-900 border border-red-400 border-dashed",
      W: "bg-yellow-200 text-yellow-900 border border-yellow-500 border-dashed",
      H: "bg-blue-200 text-blue-900 border border-blue-500 border-dashed",
      "-": "text-slate-300 font-normal",
    };

    return (
      <td
        key={day}
        className={`w-9 min-w-[34px] p-1 text-center border-r border-slate-200 transition-colors ${
          isWeekend ? "bg-amber-50/20" : ""
        }`}
      >
        <div
          title={tooltipTitle}
          className={`w-7 h-7 flex items-center justify-center mx-auto text-xs font-semibold rounded cursor-pointer transition-transform hover:scale-110 ${
            badgeStyles[status] || "text-slate-400"
          }`}
        >
          {status}
        </div>
      </td>
    );
  };

  // Helper for counting totals per employee
  const getEmployeeTotals = (empId) => {
    const totals = { P: 0, A: 0, L: 0, W: 0, H: 0, LA: 0, NW: 0, OT: 0, ST: 0, WOW: 0 };

    days.forEach((d) => {
      const entry = attendanceByEmp[empId]?.[d.date()];
      let status = entry?.status || "-";

      if (holidayDates.has(d.date())) {
        status = "H";
      } else {
        const weekday = monthStart.date(d.date()).day();
        if (weeklyOffDays.includes(weekday)) status = "W";
      }

      if (status === "present") status = "P";
      if (status === "leave") status = "L";
      if (status === "absent") status = "A";

      if (totals[status] !== undefined) {
        totals[status]++;
      }
    });

    const totalAdjustedLeaves = employeeleavesadjusted
      .filter((e) => e.employeeId?._id === empId)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    totals.LA += totalAdjustedLeaves;
    totals.NW = totals.P + totals.W + totals.H + totals.LA;

    // Calculate total overtime, shorttime, and weekly off work minutes for this month
    const empAttendanceMonth =
      (activeAttendance || []).filter(
        (a) =>
          (a.employeeId?._id || a.employeeId) === empId &&
          dayjs(a.date).isSame(monthStart, "month")
      ) || [];

    empAttendanceMonth.forEach((entry) => {
      if (entry.status !== "present" && entry.status !== "half day" && entry.status !== "weekly off") return;

      if (entry.dayType === "weekoff" || (entry.weeklyOffMinutes && entry.weeklyOffMinutes > 0)) {
        totals.WOW += entry.weeklyOffMinutes || entry.workingMinutes || 0;
        return;
      }

      if (entry.dayType === "holiday") {
        if (entry.workingMinutes > 0) {
          totals.OT += entry.workingMinutes;
        }
        return;
      }

      if ((entry.shortMinutes || 0) > 0) {
        totals.ST += entry.shortMinutes || 0;
      }

      if ((entry.overtimeMinutes || 0) > 0) {
        totals.OT += entry.overtimeMinutes || 0;
      }
    });

    return totals;
  };

  const exportCSV2 = () => {
    const titleRow = [`Attendance Register - ${dayjs(`${filters.year}-${filters.month}-01`).format("MMMM-YYYY")}`];

    const headers = [
      "Employee",
      ...days.map((d) => d.format("DD")),
      "Present",
      "Absent",
      "Leave",
      "Weekly Off",
      "Holiday",
      "Leave Adjusted",
      "Net Payable Days",
      "Overtime (Minutes)",
      "Shorttime (Minutes)",
      "Net OT/ST (Minutes)",
      "Work on Weekly Off (Minutes)",
    ];

    const rows = filteredEmployees.map((emp) => {
      const totals = getEmployeeTotals(emp._id);

      const dailyStatus = days.map((d) => {
        const entry = attendanceByEmp[emp._id]?.[d.date()];
        let status = entry?.status || "-";

        if (status === "present") status = "P";
        if (status === "leave") status = "L";
        if (status === "absent") status = "A";
        if (status === "weekly off") status = "W";
        if (status === "holiday") status = "H";

        return status;
      });

      return [
        emp?.userid?.name || "Unknown",
        ...dailyStatus,
        totals.P,
        totals.A,
        totals.L,
        totals.W,
        totals.H,
        totals.LA,
        totals.NW,
        totals.OT,
        totals.ST,
        totals.OT - totals.ST,
        totals.WOW,
      ];
    });

    const csv = [titleRow, headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance Register ${dayjs(`${filters.year}-${filters.month}-01`).format("MMMM-YYYY")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const defaultEmployeePic =
    "https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp";

  if (reportLoading || !employee) {
    return (
      <div className="p-4">
        <TableRowSkeleton rows={8} columns={10} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-xs bg-white">
        {filteredEmployees?.length === 0 ? (
          <div className="text-center py-12 px-4">
            <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No Employees Found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your branch or department filter.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs select-none">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                {/* Sticky Employee Header */}
                <th className="sticky left-0 z-20 bg-slate-50/95 px-3 py-2 min-w-[190px] text-left border-r border-slate-200 backdrop-blur-xs">
                  Employee
                </th>

                {/* Day Headers */}
                {days.map((d) => {
                  const isSunday = d.day() === 0;
                  return (
                    <th
                      key={d.date()}
                      className={`w-9 min-w-[34px] py-1.5 text-center border-r border-slate-200 ${
                        isSunday ? "bg-amber-50/70 text-amber-900 font-bold" : "text-slate-600"
                      }`}
                    >
                      <div className="text-[11px] font-bold leading-tight">{d.format("DD")}</div>
                      <div className="text-[9px] font-medium opacity-75">{d.format("ddd")}</div>
                    </th>
                  );
                })}

                {/* Summary Totals Headers */}
                <th title="Present" className="px-2 py-2 border-r border-slate-200 text-emerald-800 bg-emerald-50/40 text-center font-bold">
                  P
                </th>
                <th title="Absent" className="px-2 py-2 border-r border-slate-200 text-rose-800 bg-rose-50/40 text-center font-bold">
                  A
                </th>
                <th title="Leave" className="px-2 py-2 border-r border-slate-200 text-amber-800 bg-amber-50/40 text-center font-bold">
                  L
                </th>
                <th title="Weekly Off" className="px-2 py-2 border-r border-slate-200 text-purple-800 bg-purple-50/40 text-center font-bold">
                  W
                </th>
                <th title="Holiday" className="px-2 py-2 border-r border-slate-200 text-sky-800 bg-sky-50/40 text-center font-bold">
                  H
                </th>
                <th title="Leave Availed/Adjusted" className="px-2 py-2 border-r border-slate-200 text-slate-700 bg-slate-100/50 text-center font-bold">
                  LA
                </th>
                <th title="Net Payable Days" className="px-2 py-2 border-r border-slate-200 text-teal-800 bg-teal-50/60 text-center font-bold">
                  NP
                </th>
                <th title="Net Overtime / Shorttime (Minutes)" className="px-2 py-2 border-r border-slate-200 text-slate-700 bg-slate-50 text-center font-semibold whitespace-nowrap text-[11px]">
                  Net OT/ST
                </th>
                <th title="Work on Weekly Off (Minutes)" className="px-2 py-2 border-r border-slate-200 text-purple-800 bg-purple-50/40 text-center font-semibold whitespace-nowrap text-[11px]">
                  WO Work
                </th>
                <th className="px-2 py-2 text-center text-slate-600 bg-slate-50 font-semibold text-[11px]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEmployees?.map((emp) => {
                const totals = getEmployeeTotals(emp._id);
                return (
                  <tr
                    key={emp._id}
                    className="hover:bg-teal-50/20 transition-colors group"
                  >
                    {/* Sticky Employee Row */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 py-1.5 px-2.5 min-w-[190px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2">
                        {emp?.profileimage ? (
                          <img
                            src={cloudinaryUrl(emp.profileimage, {
                              format: "webp",
                              width: 100,
                              height: 100,
                            })}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                            alt={emp?.userid?.name || "Employee"}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : null}

                        <div
                          className={`w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-500 items-center justify-center shrink-0 shadow-2xs ${
                            emp?.profileimage ? "hidden" : "flex"
                          }`}
                        >
                          <User size={14} className="text-slate-500" />
                        </div>

                        <div className="min-w-0 pr-1">
                          <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">
                            {emp?.userid?.name}
                          </p>
                          <p className="text-[9.5px] font-medium text-slate-500 truncate">
                            {emp?.designation || "Staff"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Day Cells */}
                    {days.map((d) => renderStatus(emp._id, d))}

                    {/* Totals Summary */}
                    <td className="text-center font-bold text-emerald-700 bg-emerald-50/20 border-r border-slate-100 py-1">
                      {totals.P}
                    </td>
                    <td className="text-center font-bold text-rose-700 bg-rose-50/20 border-r border-slate-100 py-1">
                      {totals.A}
                    </td>
                    <td className="text-center font-bold text-amber-700 bg-amber-50/20 border-r border-slate-100 py-1">
                      {totals.L}
                    </td>
                    <td className="text-center font-bold text-purple-700 bg-purple-50/20 border-r border-slate-100 py-1">
                      {totals.W}
                    </td>
                    <td className="text-center font-bold text-sky-700 bg-sky-50/20 border-r border-slate-100 py-1">
                      {totals.H}
                    </td>
                    <td className="text-center font-bold text-slate-700 bg-slate-50/30 border-r border-slate-100 py-1">
                      {totals.LA}
                    </td>
                    <td className="text-center font-bold text-teal-800 bg-teal-50/40 border-r border-slate-100 py-1">
                      {totals.NW}
                    </td>
                    <td
                      className={`text-center font-bold border-r border-slate-100 px-1.5 py-1 text-[11px] ${
                        totals.OT - totals.ST >= 0 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {totals.OT - totals.ST}m
                    </td>
                    <td className="text-center font-bold border-r border-slate-100 px-1.5 py-1 text-[11px] text-purple-700">
                      {totals.WOW}m
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <button
                        type="button"
                        className="p-1 rounded-md text-teal-700 hover:text-teal-900 hover:bg-teal-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="View Attendance Performance"
                        onClick={() =>
                          navigate(
                            `/dashboard/performance/${emp.userid?._id || emp.userid}?month=${filters.month}&year=${filters.year}`
                          )
                        }
                      >
                        <FileText size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend Bar */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5">
        <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-green-200 text-green-900 border border-green-500 border-dashed">
              P
            </span>
            <span className="text-slate-700 font-medium">Present</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-red-200 text-red-900 border border-red-500 border-dashed">
              A
            </span>
            <span className="text-slate-700 font-medium">Absent</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-red-200 text-red-900 border border-red-400 border-dashed">
              L
            </span>
            <span className="text-slate-700 font-medium">Leave</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-yellow-200 text-yellow-900 border border-yellow-500 border-dashed">
              W
            </span>
            <span className="text-slate-700 font-medium">Weekly Off</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded bg-blue-200 text-blue-900 border border-blue-500 border-dashed">
              H
            </span>
            <span className="text-slate-700 font-medium">Holiday</span>
          </div>

          <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
            <span className="font-bold text-slate-800">LA:</span> Leave Availed/Adjusted
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
            <span className="font-bold text-teal-800">NP:</span> Net Payable Days
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
            <span className="font-bold text-slate-800">Net OT/ST:</span> Net Overtime / Shorttime
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
            <span className="font-bold text-purple-800">WO Work:</span> Work on Weekly Off
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
