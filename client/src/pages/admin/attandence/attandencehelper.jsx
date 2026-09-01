import dayjs from "dayjs";
import { toast } from "../../../utils/toast";
import { FirstFetch } from "../../../../store/userSlice";
import { useSelector } from "react-redux";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
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

export const columns = ({
  minutesinhours,
  canEdit,
  canDelete,
  edite,
  deletee,
}) => [
    {
      name: "Name",
      selector: (row) => row?.employeeId?.userid?.name || row?.employeeId?.employeeName || '',
      sortable: true,
      style: { minWidth: "180px" },
      cell: (row) => {
        const empName = row?.employeeId?.userid?.name || row?.employeeId?.employeeName || '—';
        return (
          <div className="flex items-center gap-2.5">
            <Avatar
              alt={empName}
              sx={{ width: 32, height: 32 }}
              src={cloudinaryUrl(row?.employeeId?.profileimage, {
                format: "webp",
                width: 80,
                height: 80,
              })}
            >
              {!row?.employeeId?.profileimage && <User size={16} />}
            </Avatar>
            <p className="font-semibold text-slate-800 text-xs">{empName}</p>
          </div>
        );
      },
    },
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
      width: "110px",
      cell: (row) => dayjs(row.date).format("DD MMM, YYYY"),
    },

    {
      name: "Punch In",
      width: '140px',
      cell: (row) => {
        if (!row.punchIn) return "- : -";

        const isSpecialDay = row.dayType === 'holiday' || row.dayType === 'weekoff';

        return (
          <div className="flex items-center gap-1">
            <Clock size={15} className="text-blue-700" />
            {dayjs(row.punchIn).format("hh:mm A")}
            {!isSpecialDay && (
              <>
                {row.punchInStatus == 'late' && (
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">Late</span>
                )}
                {row.punchInStatus == 'early' && (
                  <span className="px-2 py-1 rounded bg-sky-100 text-sky-800">Early</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      name: "Punch Out",
      width: '140px',
      cell: (row) => {
        if (!row.punchOut) return "- : -";

        const isSpecialDay = row.dayType === 'holiday' || row.dayType === 'weekoff';

        return (
          <div className="flex  items-center gap-1">
            <Clock size={15} className="text-blue-700" />
            {dayjs(row.punchOut).format("hh:mm A")}
            {!isSpecialDay && (
              <>
                {row.punchOutStatus == 'early' && (
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">Early</span>
                )}
                {row.punchOutStatus == 'late' && (
                  <span className="px-2 py-1 rounded bg-sky-100 text-sky-800">Late</span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      name: "Status",
      width: "100px",
      cell: (row) => {
        const absent = row.status === "absent";
        const leave = row.status === "leave";
        const holiday = row.status === "holiday" || row.dayType === 'holiday';
        const weeklyoff = row.status === "weekly off" || row.dayType === 'weekoff';
        return (
          <>
            <span
              title={leave ? row?.leave?.reason : ""}
              className={`px-2 py-1 rounded
             ${absent ? "bg-red-100 text-red-800"
                  : leave ? "bg-amber-100 text-amber-800"
                    : holiday ? "bg-blue-50 text-blue-800"
                      : weeklyoff ? "bg-gray-50 text-gray-800"
                        : "bg-green-100 text-green-800"
                }`}
            >
              {row.status}
            </span>
            {leave && row?.leave?.reason &&
              <span title={row?.leave?.reason} className="ml-1 text-blue-600 inline-flex items-center"> <Info size={16} /> </span>
            }
          </>
        );
      },
    },
    {
      name: "Working Hours",
      width: "210px",
      cell: (row) => {
        const isSpecialDay = row.dayType === 'holiday' || row.dayType === 'weekoff';

        return row.workingMinutes ? (
          <div>
            <p>
              <span className="inline-block w-[50px]">
                {minutesinhours(row?.workingMinutes)}
              </span>
              {row.dayType === 'holiday' ? (
                <span className="ml-2 px-1 py-1 rounded bg-green-100 text-green-800">
                  Overtime {minutesinhours(row.workingMinutes)}
                </span>
              ) : (row.dayType === 'weekoff' || (row.weeklyOffMinutes && row.weeklyOffMinutes > 0)) ? (
                <span className="ml-2 px-1 py-1 rounded bg-purple-100 text-purple-800">
                  WO Work {minutesinhours(row.weeklyOffMinutes || row.workingMinutes)}
                </span>
              ) : (
                <>
                  {row.shortMinutes > 0 && (
                    <span className="ml-2 px-1 py-1 rounded bg-amber-100 text-amber-800">
                      Short {minutesinhours(row.shortMinutes)}
                    </span>
                  )}
                  {row.overtimeMinutes > 0 && (
                    <span className="ml-2 p-1 rounded bg-green-100 text-green-800">
                      Overtime {minutesinhours(row.overtimeMinutes)}
                    </span>
                  )}
                </>
              )}
            </p>
            <p className="text-[12px] mt-1 font-medium italic">
              {row.dayType === 'holiday' ? (
                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Holiday</span>
              ) : row.dayType === 'weekoff' ? (
                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Weekly Off</span>
              ) : ""}
            </p>
          </div>
        ) : (
          "- : -"
        );
      },
    },
    {
      name: "Action",
      width: "110px",
      cell: (row) => (
        <div className="action flex gap-2.5 items-center">
          {canEdit && (
            <span
              className="edit text-teal-600 hover:text-teal-700 cursor-pointer p-1"
              title="Edit"
              onClick={() => edite(row)}
            >
              <Edit2 size={16} />
            </span>
          )}
          {canDelete && (
            <span
              className="delete text-red-500 hover:text-red-600 cursor-pointer p-1"
              title="Delete"
              onClick={() => deletee(row._id)}
            >
              <Trash2 size={16} />
            </span>
          )}
        </div>
      ),
    },
  ];

export const useCustomStyles = () => {
  const primaryColor = useSelector((state) => state.user.primaryColor) || "#115e59";

  return {
    headCells: {
      style: {
        backgroundColor: primaryColor,
        fontWeight: "bold",
        fontSize: "14px",
        color: "white",
        paddingLeft: "12px",
        paddingRight: "12px",
      },
    },
    headRow: {
      style: {
        borderBottom: "2px solid #ccc",
      },
    },
    rows: {
      style: {
        minHeight: "48px",
        borderBottom: "1px solid #eee",
      },
    },
    cells: {
      style: {
        paddingLeft: "12px",
        paddingRight: "12px",
      },
    },
  };
};
