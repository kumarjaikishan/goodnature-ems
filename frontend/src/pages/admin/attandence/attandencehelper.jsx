import dayjs from "dayjs";
import { toast } from "react-toastify";
import { FirstFetch } from "../../../../store/userSlice";
import { useSelector } from "react-redux";

import { IoMdTime } from "react-icons/io";
import { MdOutlineModeEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { FaRegUser } from "react-icons/fa";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { IoInformationCircleOutline } from "react-icons/io5";

import { apiClient } from "../../../utils/apiClient";


export const submitAttandence = async ({ isPunchIn, inp, setisload, dispatch }) => {
  setisload(true);

  const basePayload = {
    employeeId: inp.employeeId,
    date: dayjs(inp.date).toDate(),
  }

  if (inp.status == 'leave') {
    basePayload.reason = inp.reason
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
    dispatch(FirstFetch());
    return true;
  } catch (error) {
    console.error('Error submitting attendance:', error);
    toast.error(error.message);
  } finally {
    setisload(false);
  }
}

export const deleteAttandence = async ({ attandanceId, setselectedRows, setisload, dispatch }) => {
  if (!attandanceId) return toast.warning('Attandance Id is needed');

  try {
    setisload(true);
    const data = await apiClient({
      url: "deleteattandence",
      method: "POST",
      body: { attandanceId }
    });

    toast.success(data.message, { autoClose: 1800 });
    dispatch(FirstFetch());
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
      selector: (row) => row?.employeeId?.userid?.name,
      sortable: true,
      style: { minWidth: "180px" },
      cell: (row) => (
        <div className="flex items-center gap-3 ">
          <Avatar
            src={cloudinaryUrl(row?.employeeId?.profileimage, {
              format: "webp",
              width: 100,
              height: 100,
            })}
            alt={row?.employeeId?.employeename}
          >
            {!row?.employeeId?.profileimage && <FaRegUser />}
          </Avatar>
          <Box>
            <p className="text-[12px] md:text-[14px] text-gray-700 font-semibold">
              {row?.employeeId?.userid?.name}
            </p>
          </Box>
        </div>
      ),
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
          <div className="flex w-full items-center gap-1">
            <IoMdTime className="text-[16px] text-blue-700" />
            {dayjs(row.punchIn).format("hh:mm A")}
            {!isSpecialDay && (
              <>
                {row.punchInStatus == 'early' && (
                  <span className="px-2 py-1 rounded bg-sky-100 text-sky-800">Early</span>
                )}
                {row.punchInStatus == 'late' && (
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">Late</span>
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
            <IoMdTime className="text-[16px] text-blue-700" />
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
              <span title={row?.leave?.reason} className="ml-1 text-blue-600 text-lg font-bold"> <IoInformationCircleOutline /> </span>
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
              {isSpecialDay ? (
                <span className="ml-2 px-1 py-1 rounded bg-green-100 text-green-800">
                  Overtime {minutesinhours(row.workingMinutes)}
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
          <div>
            <p className="text-[12px] mt-1 font-medium italic">
              {row.dayType === 'holiday' ? (
                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Holiday</span>
              ) : row.dayType === 'weekoff' ? (
                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Weekly Off</span>
              ) : "-"}
            </p>
          </div>
        );
      },
    },
    {
      name: "Action",
      width: "80px",
      cell: (row) => (
        <div className="flex gap-2.5">
          {canEdit && (
            <span
              className="text-[18px] text-blue-500 cursor-pointer"
              title="Edit"
              onClick={() => edite(row)}
            >
              <MdOutlineModeEdit />
            </span>
          )}
          {canDelete && (
            <span
              className="text-[18px] text-red-500 cursor-pointer"
              onClick={() => deletee(row._id)}
            >
              <AiOutlineDelete />
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
        justifyContent: "flex-start",
        paddingLeft: "8px",
        paddingRight: "0px",
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
        justifyContent: "flex-start",
        paddingLeft: "8px",
        paddingRight: "0px",
      },
    },
  };
};
