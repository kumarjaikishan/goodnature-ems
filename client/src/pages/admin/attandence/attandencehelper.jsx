import dayjs from "dayjs";
import { toast } from "../../../utils/toast";
import { FirstFetch } from "../../../../store/userSlice";
import { useSelector } from "react-redux";

import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { Clock, Edit2, Trash2, User, Info } from "lucide-react";

import { apiClient } from "../../../utils/apiClient";


export const submitAttandence = async ({ isPunchIn, inp, setisload, dispatch, onSuccess }) => {
  setisload(true);

  const basePayload = {
    employeeId: inp.employeeId,
    date: dayjs(inp.date).toDate(),
    reason: inp.reason || '',
  }

  const payload = isPunchIn
    ? {
      ...basePayload,
      ...(inp.punchIn ? { punchIn: dayjs(inp.punchIn).toDate() } : {}),
      status: inp.status,
    }
    : {
      ...basePayload,
      ...(inp.punchOut ? { punchOut: dayjs(inp.punchOut).toDate() } : {}),
    };

  const url = isPunchIn ? "checkin" : "checkout"

  try {
    const data = await apiClient({
      url,
      method: "POST",
      body: payload
    });

    toast.success(data.message, { autoClose: 1800 });
    // Only refresh the attendance list (current page/filters), not the
    // entire app state - avoids re-downloading the whole company's history
    // on every single mark.
    if (onSuccess) onSuccess();
    else if (dispatch) dispatch(FirstFetch());
    return true;
  } catch (error) {
    console.error('Error submitting attendance:', error);
    toast.error(error.message);
  } finally {
    setisload(false);
  }
}

export const deleteAttandence = async ({ attandanceId, setselectedRows, setisload, dispatch, onSuccess }) => {
  if (!attandanceId) return toast.warning('Attandance Id is needed');

  try {
    setisload(true);
    const data = await apiClient({
      url: "deleteattandence",
      method: "POST",
      body: { attandanceId }
    });

    toast.success(data.message, { autoClose: 1800 });
    if (onSuccess) onSuccess();
    else if (dispatch) dispatch(FirstFetch());
    if (setselectedRows) setselectedRows([]);
    return true;
  } catch (error) {
    console.error('Error deleting attendance:', error);
    toast.error(error.message);
  } finally {
    setisload(false);
  }
}

const AVATAR_PALETTES = [
  { bg: '#dbeafe', text: '#1d4ed8' }, // Sky Blue
  { bg: '#e0e7ff', text: '#4338ca' }, // Indigo
  { bg: '#dcfce7', text: '#15803d' }, // Emerald Green
  { bg: '#fef3c7', text: '#b45309' }, // Amber / Warm Orange
  { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
  { bg: '#ccfbf1', text: '#0f766e' }, // Deep Teal
  { bg: '#ffe4e6', text: '#be123c' }, // Rose Pink
  { bg: '#fae8ff', text: '#a21caf' }, // Fuchsia
  { bg: '#e0f2fe', text: '#0369a1' }, // Cyan
  { bg: '#fef9c3', text: '#854d0e' }, // Yellow Gold
  { bg: '#ffedd5', text: '#c2410c' }, // Coral
  { bg: '#e2e8f0', text: '#334155' }, // Slate Blue
];

const getAvatarColor = (name = '') => {
  if (!name || name === '—') return AVATAR_PALETTES[0];
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) + name.charCodeAt(i);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

const getInitials = (name = '') => {
  if (!name || name === '—') return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const columns = ({
  minutesinhours,
  canEdit,
  canDelete,
  edite,
  deletee,
}) => [
    {
      name: "EMPLOYEE NAME",
      selector: (row) => row?.employeeId?.userid?.name || row?.employeeId?.employeeName || '',
      sortable: true,
      style: { minWidth: "220px" },
      cell: (row) => {
        const empName = row?.employeeId?.userid?.name || row?.employeeId?.employeeName || '—';
        const rawDept = row?.employeeId?.departmentId?.department || row?.employeeId?.department?.name || (typeof row?.employeeId?.department === 'string' && !/^[0-9a-fA-F]{24}$/.test(row?.employeeId?.department) ? row?.employeeId?.department : '');
        const deptName = typeof rawDept === 'string' && !/^[0-9a-fA-F]{24}$/.test(rawDept) ? rawDept : '';
        const initials = getInitials(empName);
        const palette = getAvatarColor(empName);
        const hasPhoto = Boolean(row?.employeeId?.profileimage);

        return (
          <div className="flex items-center gap-3 py-1.5">
            {hasPhoto ? (
              <img
                alt={empName}
                className="w-[38px] h-[38px] rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                src={cloudinaryUrl(row?.employeeId?.profileimage, {
                  format: "webp",
                  width: 90,
                  height: 90,
                })}
              />
            ) : (
              <div
                style={{ backgroundColor: palette.bg, color: palette.text }}
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-xs tracking-wider shrink-0 select-none shadow-2xs"
              >
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-slate-800 text-xs truncate leading-tight">
                {empName}
              </span>
              {deptName ? (
                <span className="text-[11px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                  {deptName}
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
      width: "115px",
      cell: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {dayjs(row.date).format("DD MMM, YYYY")}
        </span>
      ),
    },
    {
      name: "Punch In",
      width: '145px',
      cell: (row) => {
        if (!row.punchIn) return <span className="text-slate-400 font-mono text-xs">- : -</span>;

        const isSpecialDay = row.dayType === 'holiday' || row.dayType === 'weekoff';
        const isLate = !isSpecialDay && row.punchInStatus === 'late';
        const isEarly = !isSpecialDay && row.punchInStatus === 'early';

        const clockColor = isLate
          ? "text-amber-500"
          : isEarly
            ? "text-sky-500"
            : "text-emerald-600";

        return (
          <div className="flex items-center gap-1.5">
            <Clock size={13} className={`${clockColor} shrink-0`} />
            <span className="text-xs font-medium text-slate-800 font-mono">
              {dayjs(row.punchIn).format("hh:mm A")}
            </span>
            {!isSpecialDay && (
              <>
                {isLate && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Late</span>
                )}
                {isEarly && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">Early</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      name: "Punch Out",
      width: '145px',
      cell: (row) => {
        if (!row.punchOut) return <span className="text-slate-400 font-mono text-xs">- : -</span>;

        const isSpecialDay = row.dayType === 'holiday' || row.dayType === 'weekoff';
        const isEarly = !isSpecialDay && row.punchOutStatus === 'early';
        const isLate = !isSpecialDay && row.punchOutStatus === 'late';

        const clockColor = isEarly
          ? "text-amber-500"
          : isLate
            ? "text-sky-500"
            : "text-emerald-600";

        return (
          <div className="flex items-center gap-1.5">
            <Clock size={13} className={`${clockColor} shrink-0`} />
            <span className="text-xs font-medium text-slate-800 font-mono">
              {dayjs(row.punchOut).format("hh:mm A")}
            </span>
            {!isSpecialDay && (
              <>
                {isEarly && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Early</span>
                )}
                {isLate && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">Late</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      width: "115px",
      cell: (row) => {
        const isAbsent = row.status === "absent";
        const isLeave = row.status === "leave";
        const isHoliday = row.status === "holiday" || row.dayType === 'holiday';
        const isWeeklyOff = row.status === "weekly off" || row.dayType === 'weekoff';
        const isHalfDay = row.status === "half day";

        let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (isAbsent) badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
        else if (isLeave || isHalfDay) badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        else if (isHoliday) badgeClass = "bg-teal-50 text-teal-700 border-teal-200";
        else if (isWeeklyOff) badgeClass = "bg-slate-100 text-slate-700 border-slate-200";

        return (
          <div className="flex items-center gap-1">
            <span
              title={isLeave ? row?.leave?.reason : ""}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border capitalize ${badgeClass}`}
            >
              {row.status}
            </span>
            {isLeave && row?.leave?.reason && (
              <span title={row?.leave?.reason} className="text-teal-600 cursor-pointer inline-flex items-center">
                <Info size={14} />
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Working Hours",
      width: "210px",
      cell: (row) => {
        return row.workingMinutes ? (
          <div>
            <p className="flex items-center text-xs font-medium text-slate-700">
              <span className="inline-block font-mono min-w-[48px]">
                {minutesinhours(row?.workingMinutes)}
              </span>
              {row.dayType === 'holiday' ? (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OT {minutesinhours(row.workingMinutes)}
                </span>
              ) : (row.dayType === 'weekoff' || (row.weeklyOffMinutes && row.weeklyOffMinutes > 0)) ? (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  WO Work {minutesinhours(row.weeklyOffMinutes || row.workingMinutes)}
                </span>
              ) : (
                <>
                  {row.shortMinutes > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Short {minutesinhours(row.shortMinutes)}
                    </span>
                  )}
                  {row.overtimeMinutes > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      OT {minutesinhours(row.overtimeMinutes)}
                    </span>
                  )}
                </>
              )}
            </p>
            <p className="text-[11px] mt-0.5 font-medium">
              {row.dayType === 'holiday' ? (
                <span className="text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">Holiday</span>
              ) : row.dayType === 'weekoff' ? (
                <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">Weekly Off</span>
              ) : ""}
            </p>
          </div>
        ) : (
          <span className="text-slate-400 font-mono text-xs">- : -</span>
        );
      },
    },
    {
      name: "Actions",
      width: "90px",
      cell: (row) => (
        <div className="flex gap-1 items-center">
          {canEdit && (
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
              title="Edit Attendance"
              onClick={() => edite(row)}
            >
              <Edit2 size={15} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              title="Delete Record"
              onClick={() => deletee(row._id)}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

export const useCustomStyles = () => {
  return {
    headCells: {
      style: {
        backgroundColor: "#134e4a", // Deep Teal 900
        fontWeight: "600",
        fontSize: "12px",
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        color: "#ffffff",
        paddingLeft: "14px",
        paddingRight: "14px",
        minHeight: "44px",
      },
    },
    headRow: {
      style: {
        borderBottom: "1px solid #0f766e",
      },
    },
    rows: {
      style: {
        minHeight: "42px",
        borderBottom: "1px solid #f1f5f9",
        "&:hover": {
          backgroundColor: "#f8fafc",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "14px",
        paddingRight: "14px",
        paddingTop: "4px",
        paddingBottom: "4px",
      },
    },
  };
};
