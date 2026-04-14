import { CiFilter } from "react-icons/ci";
import { Avatar, Box, Button, ButtonGroup, CircularProgress, IconButton, OutlinedInput, TextField, Typography } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from "react";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import DataTable from "react-data-table-component";
import { columns, deleteAttandence, submitAttandence } from "./attandencehelper";
import { useCustomStyles } from "./attandencehelper";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MdClear, MdOutlineModeEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import { IoSearch, IoSearchCircle } from "react-icons/io5";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { FiDownload } from "react-icons/fi";
import { BiGroup } from "react-icons/bi";
import { GoPlus } from "react-icons/go";
import { BiMessageRoundedError } from "react-icons/bi";
import { useEffect, useMemo, useState, useCallback } from "react";
import MarkAttandence from "./MarkAttandence";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useSelector } from "react-redux";
import { IoMdTime } from "react-icons/io";
import BulkMark from "./BulkMark";
import { FaRegUser, FaFileCsv, FaFilePdf } from "react-icons/fa";
import { useDispatch } from "react-redux";
import MarkAttandenceedit from "./MarkAttandenceedit";
import CheckPermission from "../../../utils/CheckPermission";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { SearchIcon } from "lucide-react";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

const Attandence = () => {
  const [markattandence, setmarkattandence] = useState(false);
  const [isUpdate, setisUpdate] = useState(false);
  const [isload, setisload] = useState(false);
  const [openmodal, setopenmodal] = useState(false);
  const [isPunchIn, setisPunchIn] = useState(true);
  const [atteneditmodal, setatteneditmodal] = useState(false);
  const [bulkmodal, setbulkmodal] = useState(false);
  const { branch, attandence, department, company, profile } = useSelector(
    (state) => state.user
  );
  const [selectedRows, setselectedRows] = useState([]);
  const dispatch = useDispatch();
  const customStyles = useCustomStyles();
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const initLibs = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
      } catch (e) {
        console.error("PDF libraries failed to load", e);
      }
    };
    initLibs();
  }, []);


  const init = {
    employeeId: "",
    date: dayjs(),
    punchIn: null,
    punchOut: null,
    status: "",
    reason: '',
  };

  const init2 = {
    id: '',
    employeeName: '',
    date: dayjs(),
    punchIn: null,
    punchOut: null,
    status: '',
    leaveid: '',
    leaveReason: ''
  }

  useEffect(() => {
    // console.log(selectedRows)
  }, [selectedRows])

  const [inp, setinp] = useState(init);
  const [editinp, seteditinp] = useState(init2)

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // const minutesinhours = useCallback((minutes) => {
  //   const hour = Math.floor(minutes / 60);
  //   const minute = minutes % 60;
  //   return `${hour}h ${minute}m`;
  // }, []);
  const minutesinhours = useCallback((minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    if (hour === 0) {
      return `${minute}m`;
    }

    return `${hour}h ${minute}m`;
  }, []);

  const canAdd = CheckPermission("attandence", 2);
  const canEdit = CheckPermission("attandence", 3);
  const canDelete = CheckPermission("attandence", 4);

  // Transform raw attendance → display-ready list
  const attandencelist = useMemo(() => {
    if (!attandence) return [];
    const today = dayjs().startOf("day");

    return attandence
      .map(emp => ({
        ...emp,
        parsedDate: dayjs(emp.date),
        rawname: emp?.employeeId?.userid?.name || "",
        rawpunchIn: emp.punchIn ? dayjs(emp.punchIn).format('hh:mm A') : "",
        rawpunchOut: emp.punchOut ? dayjs(emp.punchOut).format('hh:mm A') : "",
        rawworkingHour: emp.workingMinutes ? minutesinhours(emp.workingMinutes) : ""
      }))
      .filter((emp) => !dayjs(emp.date).isAfter(today, "day"));
  }, [attandence]);


  // Filters
  const [filtere, setfiltere] = useState({
    fromDate: "",
    toDate: "",
    branch: "all",
    departmente: "all",
    employee: "",
    status: "all",
    month: "all",
    year: "all",
  });

  const filteredData = useMemo(() => {
    const today = dayjs();

    return attandencelist.filter((val) => {
      const recordDate = val.parsedDate;
      if (recordDate.isAfter(today, "day")) return false;

      // Date range match
      const from = filtere.fromDate ? dayjs(filtere.fromDate).startOf('day') : null;
      const to = filtere.toDate ? dayjs(filtere.toDate).endOf('day') : null;
      let matchDate = true;
      if (from && to) {
        matchDate = recordDate.isSameOrAfter(from) && recordDate.isSameOrBefore(to);
      } else if (from) {
        matchDate = recordDate.isSameOrAfter(from);
      } else if (to) {
        matchDate = recordDate.isSameOrBefore(to);
      }

      const matchMonth = filtere.month === "all" || recordDate.month() === Number(filtere.month);
      const matchYear = filtere.year === "all" || recordDate.year() === Number(filtere.year);
      const matchBranch = filtere.branch === "all" || val.branchId === filtere.branch;
      const matchDept = filtere.departmente === "all" || val?.employeeId?.department === filtere.departmente;
      const matchStatus = filtere.status === "all" || val.status === filtere.status;
      const matchEmployee =
        !filtere.employee.trim() ||
        val?.employeeId?.userid?.name?.toLowerCase().includes(filtere.employee.trim().toLowerCase());
      return matchDate && matchBranch && matchDept && matchStatus && matchEmployee && matchMonth && matchYear;
    });
  }, [attandencelist, filtere]);

  // Sorting
  const finalData = useMemo(() => {
    if (!sortConfig.column) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];
      return sortConfig.direction === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });
  }, [filteredData, sortConfig]);

  const multidelete = () => {
    // return console.log(selectedRows)
    let multideletearray = selectedRows.map(id => id._id);
    swal({
      title: `Are you sure you want to Delete these ${multideletearray.length} record?`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (proceed) => {
      if (proceed) {
        await deleteAttandence({ attandanceId: multideletearray, setselectedRows, setisload, dispatch });

        // Remove deleted rows from finalData
        const newData = finalData.filter(d => !multideletearray.includes(d._id));

        setselectedRows([]);
      }
    });
  }

  const handleSort = useCallback((column, sortDirection) => {
    setSortConfig({ column: column.id, direction: sortDirection });
  }, []);

  const handleRowSelect = useCallback(({ selectedRows }) => {
    // console.log(selectedRows)
    setselectedRows(selectedRows);
  }, []);

  const edite = (atten) => {
    // console.log(atten)
    seteditinp({
      id: atten._id,
      employeeName: atten?.employeeId?.userid?.name || "",
      date: dayjs(atten.date).format('DD MMM, YYYY'),
      punchIn: atten.punchIn ? dayjs(atten.punchIn) : null,
      punchOut: atten.punchOut ? dayjs(atten.punchOut) : null,
      status: atten.status || "",
      leaveid: atten?.leave?._id,
      leaveReason: atten?.leave?.reason,
    });
    setatteneditmodal(true);
  };

  const deletee = async (id) => {
    swal({
      title: "Are you sure you want to Delete this record?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (proceed) => {
      if (proceed) {
        await deleteAttandence({ attandanceId: [id], setisload, dispatch });
        setselectedRows([]);
      }
    });
  };

  const conditionalRowStyles = [
    {
      when: (row) => row.dayType === 'holiday',
      style: { backgroundColor: "rgba(21, 233, 233, 0.1)", color: "teal" },
    },
    {
      when: (row) => row.dayType === 'weekoff',
      style: { backgroundColor: "rgba(128, 0, 128, 0.05)", color: "purple" },
    },
  ];

  const exportCSV = () => {
    const headers = ["S.no", "Name", "Date", "Punch In", "Punch Out", "Status", "Working Hours"];
    const rows = finalData.map((e, idx) => [
      idx + 1,
      e.rawname,
      dayjs(e.date).format('DD-MM-YYYY'),
      e.rawpunchIn || '-',
      e.rawpunchOut || '-',
      e.status,
      e.rawworkingHour || '-'
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF libraries are still loading. Please try again in a few seconds.");
      return;
    }

    setIsGeneratingPdf(true);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text('Attendance Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${dayjs().format('DD MMM YYYY, hh:mm A')}`, 14, 28);

    const headers = [["S.no", "Name", "Date", "Punch In", "Punch Out", "Status", "Working Hours"]];
    const rows = finalData.map((e, idx) => [
      idx + 1,
      e.rawname,
      dayjs(e.date).format('DD-MM-YYYY'),
      e.rawpunchIn || '-',
      e.rawpunchOut || '-',
      e.status,
      e.rawworkingHour || '-'
    ]);

    doc.autoTable({
      startY: 35,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      styles: { fontSize: 9 }
    });

    doc.save(`Attendance_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    setIsGeneratingPdf(false);
  };

  const submitHandle = async (e) => {
    e.preventDefault();
    const res = await submitAttandence({ isPunchIn, inp, setisload, dispatch });
    // console.log(res)
    if (res) {
      setopenmodal(false);
      setinp(init);
    }
  }

  const [inputValue, setInputValue] = useState(filtere.employee || "");

  useEffect(() => {
    if (inputValue === filtere.employee) return; // skip if same value

    setLoading(true);
    const handler = setTimeout(() => {
      setfiltere((prev) => ({ ...prev, employee: inputValue }));
      setLoading(false);
    }, 700); // debounce delay (500ms)

    return () => clearTimeout(handler);
  }, [inputValue, setfiltere]);

  const openModal = useCallback(() => {
    setopenmodal(true)
  }, [])
  const openBulkModal = useCallback(() => {
    setbulkmodal(true)
  }, [])

  const memoColumns = useMemo(() => columns({
    minutesinhours,
    canEdit,
    canDelete,
    edite,
    deletee,
  }), [
    minutesinhours,
    canEdit,
    canDelete,
    edite,
    deletee,
  ]);



  return (
    <div className='p-1 max-w-6xl mx-auto '>

      {/* control component */}
      <AttendanceControls
        markattandence={markattandence}
        setmarkattandence={setmarkattandence}
        canAdd={canAdd}
        selectedRows={selectedRows}
        multidelete={multidelete}
        exportCSV={exportCSV}
        openModal={openModal}
        openBulkModal={openBulkModal}
        filtere={filtere}
        setfiltere={setfiltere}
        branch={branch}
        department={department}
        profile={profile}
        months={months}
        inputValue={inputValue}
        setInputValue={setInputValue}
        loading={loading}
        isload={isload}
        exportPDF={exportPDF}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* tabledata */}
      <div className="capitalize ">
        <AttendanceTableSection
          memoColumns={memoColumns}
          finalData={finalData}
          handleSort={handleSort}
          customStyles={customStyles}
          conditionalRowStyles={conditionalRowStyles}
          handleRowSelect={handleRowSelect}
          selectedRows={selectedRows}
        />
      </div>

      <MarkAttandence isPunchIn={isPunchIn} setisPunchIn={setisPunchIn} submitHandle={submitHandle} init={init} openmodal={openmodal} inp={inp} setinp={setinp}
        setopenmodal={setopenmodal} isUpdate={isUpdate} setisUpdate={setisUpdate} isload={isload}
      />
      <MarkAttandenceedit dispatch={dispatch} setisload={setisload} submitHandle={submitHandle} init={init2} openmodal={atteneditmodal} inp={editinp} setinp={seteditinp}
        setopenmodal={setatteneditmodal} isUpdate={isUpdate} setisUpdate={setisUpdate} isload={isload}
      />
      <BulkMark isPunchIn={isPunchIn} dispatch={dispatch} setisPunchIn={setisPunchIn} submitHandle={submitHandle} init={init} openmodal={bulkmodal} inp={inp} setinp={setinp}
        setopenmodal={setbulkmodal} isUpdate={isUpdate} setisUpdate={setisUpdate} isload={isload} setisload={setisload}
      />
    </div>
  )
}

const AttendanceControls = React.memo(({
  markattandence,
  setmarkattandence,
  canAdd,
  selectedRows,
  multidelete,
  exportCSV,
  openModal,
  openBulkModal,
  filtere,
  setfiltere,
  branch,
  department,
  profile,
  months,
  inputValue,
  setInputValue,
  loading,
  isload,
  exportPDF,
  isGeneratingPdf
}) => {

  return (
    <div className="bg-white flex flex-col rounded-lg mb-4 shadow-xl p-4">

      {/* top buttons */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <div className="flex w-full md:w-auto p-1 items-center gap-2 rounded bg-primary text-white">
          <p
            onClick={() => setmarkattandence(false)}
            className={`px-2 py-1 rounded cursor-pointer ${!markattandence && "text-primary bg-white"}`}
          >
            View Attendance
          </p>

          {canAdd && (
            <p
              onClick={() => setmarkattandence(true)}
              className={`px-2 py-1 rounded cursor-pointer ${markattandence && "text-primary bg-white"}`}
            >
              Mark Attendance
            </p>
          )}
        </div>

        <div className="flex w-full md:w-[320px] gap-2">
          {selectedRows.length > 0 && (
            <Button
              className="flex-1"
              variant="contained"
              onClick={multidelete}
              color="error"
              loading={selectedRows.length > 0 && isload}
            >
              Delete ({selectedRows.length})
            </Button>
          )}

          <ButtonGroup className="flex-1" variant="outlined" size="small">
            <Button
              onClick={exportCSV}
              startIcon={<FaFileCsv />}
              fullWidth
            >
              CSV
            </Button>
            <Button
              onClick={exportPDF}
              startIcon={<FaFilePdf />}
              fullWidth
              loading={isGeneratingPdf}
            >
              PDF
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* conditional section */}
      {markattandence ? (
        <div className="flex gap-2">
          <Button variant="contained" onClick={openModal}>
            Mark Individual
          </Button>

          <Button variant="outlined" onClick={openBulkModal}>
            Mark Bulk
          </Button>
        </div>
      ) : (
        <div className="border border-gray-400 rounded p-3 md:p-0 md:border-0 
grid grid-cols-2 md:grid-cols-6 gap-3 w-full">

          <TextField
            size="small"
            type="date"
            className="w-full"
            value={filtere.fromDate}
            onChange={(e) => setfiltere({ ...filtere, fromDate: e.target.value })}
            label="From Date"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            type="date"
            className="w-full"
            value={filtere.toDate}
            onChange={(e) => setfiltere({ ...filtere, toDate: e.target.value })}
            label="To Date"
            InputLabelProps={{ shrink: true }}
          />

          <FormControl size="small" className="w-full">
            <InputLabel>Branch</InputLabel>
            <Select
              value={filtere.branch}
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
              onChange={(e) => setfiltere({ ...filtere, branch: e.target.value })}
            >
              <MenuItem value="all">All</MenuItem>
              {profile?.role === 'manager'
                ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
                  ?.map((list) => (
                    <MenuItem key={list._id} value={list._id}>
                      {list.name}
                    </MenuItem>
                  ))
                :
                branch?.map((list) => (
                  <MenuItem key={list._id} value={list._id}>{list.name}</MenuItem>
                ))
              }
            </Select>
          </FormControl>

          <FormControl size="small" className="w-full">
            <InputLabel>Department</InputLabel>
            <Select
              value={filtere.departmente}
              disabled={filtere.branch === "all"}
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
              onChange={(e) => setfiltere({ ...filtere, departmente: e.target.value })}
            >
              <MenuItem value="all">All</MenuItem>
              {department
                ?.filter((e) => e.branchId?._id === filtere.branch)
                .map((val) => (
                  <MenuItem key={val._id} value={val._id}>
                    {val.department}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="w-full">
            <InputLabel>Status</InputLabel>
            <Select
              value={filtere.status}
              input={
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">
                      <CiFilter fontSize="small" />
                    </InputAdornment>
                  }
                  label="Status"
                />
              }
              onChange={(e) => setfiltere({ ...filtere, status: e.target.value })}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="present">Present</MenuItem>
              <MenuItem value="leave">Leave</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="weekly off">Weekly off</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
              <MenuItem value="half day">Half Day</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" className="w-full">
            <InputLabel>Month</InputLabel>
            <Select
              value={filtere.month}
              input={
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">
                      <CiFilter fontSize="small" />
                    </InputAdornment>
                  }
                  label="Month"
                />
              }
              onChange={(e) => setfiltere({ ...filtere, month: e.target.value })}
            >
              <MenuItem value="all">All</MenuItem>
              {months.map((m, idx) => (
                <MenuItem key={idx} value={idx}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="w-full">
            <InputLabel>Year</InputLabel>
            <Select
              value={filtere.year}
              input={
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">
                      <CiFilter fontSize="small" />
                    </InputAdornment>
                  }
                  label="Year"
                />
              }
              onChange={(e) => setfiltere({ ...filtere, year: e.target.value })}
            >
              <MenuItem value="all">All</MenuItem>
              {Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            className="w-full md:col-span-2"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            label="Search Employee"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IoSearch />
                  </InputAdornment>
                ),
              },
            }}
          />
        </div>
      )}

    </div>
  );
});

const AttendanceTableSection = React.memo(({
  memoColumns,
  finalData,
  handleSort,
  customStyles,
  conditionalRowStyles,
  handleRowSelect,
  selectedRows
}) => {

  return (
    <div className="capitalize">
      <DataTable
        columns={memoColumns}
        data={finalData}
        pagination
        onSort={handleSort}
        selectableRows
        customStyles={customStyles}
        conditionalRowStyles={conditionalRowStyles}
        onSelectedRowsChange={handleRowSelect}
        selectedRows={selectedRows}
        highlightOnHover
        paginationPerPage={20}
      />
    </div>
  );
});


export default Attandence
