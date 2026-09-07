import React, { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from '@/components/common/DataTable';
import { columns, deleteAttandence, submitAttandence, useCustomStyles } from "./attandencehelper";
import { getAttendanceListApi } from "../../../api/attendance.api";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useSelector, useDispatch } from "react-redux";
import BulkMark from "./BulkMark";
import MarkAttandence from "./MarkAttandence";
import MarkAttandenceedit from "./MarkAttandenceedit";
import CheckPermission from "../../../utils/CheckPermission";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { Search, Filter, FileSpreadsheet, FileText, X, Trash2, Edit2, Clock, User } from "lucide-react";
import { TableRowSkeleton } from "../../../components/skeletons";
import DateInput from "@/components/ui/DateInput";
import Select from "@/components/ui/Select";

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
  const { branch, department, company, profile } = useSelector(
    (state) => state.user
  );
  const [selectedRows, setselectedRows] = useState([]);
  const dispatch = useDispatch();
  const customStyles = useCustomStyles();
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // ── Server-side paginated attendance data ────────────────────────────────
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [refreshTick, setRefreshTick] = useState(0);

  // Bump this after any mutation (mark/edit/delete) or SSE live event to refetch just the
  // current page - instead of reloading the whole app's redux state.
  const refreshList = useCallback(() => setRefreshTick((t) => t + 1), []);

  // Real-time auto-reload: when any punch in/out happens via SSE, refresh the current page
  useEffect(() => {
    const handleAttendanceUpdated = () => {
      refreshList();
    };

    window.addEventListener('attendance_updated', handleAttendanceUpdated);
    return () => {
      window.removeEventListener('attendance_updated', handleAttendanceUpdated);
    };
  }, [refreshList]);

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
  };

  const [inp, setinp] = useState(init);
  const [editinp, seteditinp] = useState(init2);

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

  // Transform raw attendance (current page only) → display-ready list.
  // This used to run over the entire company's history on every render;
  // now it only ever runs over one page (<=200 rows).
  const attandencelist = useMemo(() => {
    return rows.map(emp => ({
      ...emp,
      parsedDate: dayjs(emp.date),
      rawname: emp?.employeeId?.userid?.name || "",
      rawpunchIn: emp.punchIn ? dayjs(emp.punchIn).format('hh:mm A') : "",
      rawpunchOut: emp.punchOut ? dayjs(emp.punchOut).format('hh:mm A') : "",
      rawworkingHour: emp.workingMinutes ? minutesinhours(emp.workingMinutes) : ""
    }));
  }, [rows, minutesinhours]);

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

  // Shared filter -> query params builder, used both for the live table
  // fetch and for CSV/PDF export (which needs every matching row, not just
  // the current page).
  const buildQueryParams = useCallback(() => {
    const params = {
      branchId: filtere.branch,
      departmentId: filtere.departmente,
      employee: filtere.employee || undefined,
      status: filtere.status,
      month: filtere.month,
      year: filtere.year,
    };
    if (filtere.fromDate) params.fromDate = filtere.fromDate;
    if (filtere.toDate) params.toDate = filtere.toDate;
    // Preserve old default behaviour: with no date/month/year filter at
    // all, never show future-dated records.
    if (!filtere.fromDate && !filtere.toDate && filtere.month === 'all' && filtere.year === 'all') {
      params.toDate = dayjs().format('YYYY-MM-DD');
    }
    return params;
  }, [filtere]);

  // Reset to page 1 whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [filtere.fromDate, filtere.toDate, filtere.branch, filtere.departmente, filtere.employee, filtere.status, filtere.month, filtere.year]);

  useEffect(() => {
    let cancelled = false;
    const fetchPage = async () => {
      setPageLoading(true);
      try {
        const res = await getAttendanceListApi({
          ...buildQueryParams(),
          page,
          limit: perPage,
          sortDir: sortConfig.column === 'date' && sortConfig.direction === 'asc' ? 'asc' : 'desc',
        });
        if (cancelled) return;
        setRows(res.data || []);
        setTotalRows(res.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        if (!cancelled) {
          setRows([]);
          setTotalRows(0);
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };
    fetchPage();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildQueryParams, page, perPage, refreshTick, sortConfig.column, sortConfig.direction]);

  // Current page, already sorted by the server for the "date" column.
  // Other columns still sort within the visible page only (sorting the
  // full filtered dataset for arbitrary columns would need a heavier
  // backend change - the date sort covers the common case).
  const finalData = useMemo(() => {
    if (!sortConfig.column || sortConfig.column === 'date') return attandencelist;
    return [...attandencelist].sort((a, b) => {
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
  }, [attandencelist, sortConfig]);

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
        await deleteAttandence({ attandanceId: multideletearray, setselectedRows, setisload, onSuccess: refreshList });
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
        await deleteAttandence({ attandanceId: [id], setisload, onSuccess: refreshList });
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

  // Export needs every row matching the current filters, not just the
  // current page - fetch it directly from the server (paginated in the
  // background) instead of relying on a giant array already sitting in
  // memory/redux.
  const EXPORT_PAGE_LIMIT = 200;
  const EXPORT_MAX_PAGES = 25; // safety cap: 5000 rows
  const fetchAllForExport = useCallback(async () => {
    const params = buildQueryParams();
    let all = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const res = await getAttendanceListApi({ ...params, page: currentPage, limit: EXPORT_PAGE_LIMIT });
      all = all.concat(res.data || []);
      totalPages = res.pagination?.pages || 1;
      currentPage += 1;
    } while (currentPage <= totalPages && currentPage <= EXPORT_MAX_PAGES);

    return all.map(e => ({
      rawname: e?.employeeId?.userid?.name || "",
      date: e.date,
      rawpunchIn: e.punchIn ? dayjs(e.punchIn).format('hh:mm A') : "",
      rawpunchOut: e.punchOut ? dayjs(e.punchOut).format('hh:mm A') : "",
      status: e.status,
      rawworkingHour: e.workingMinutes ? minutesinhours(e.workingMinutes) : ""
    }));
  }, [buildQueryParams, minutesinhours]);

  const exportCSV = async () => {
    setIsExportingCsv(true);
    try {
      const exportRows = await fetchAllForExport();
      const headers = ["S.no", "Name", "Date", "Punch In", "Punch Out", "Status", "Working Hours"];
      const csvRows = exportRows.map((e, idx) => [
        idx + 1,
        e.rawname,
        dayjs(e.date).format('DD-MM-YYYY'),
        e.rawpunchIn || '-',
        e.rawpunchOut || '-',
        e.status,
        e.rawworkingHour || '-'
      ]);

      const csvContent = [headers.join(","), ...csvRows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_Report_${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const exportPDF = async () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF libraries are still loading. Please try again in a few seconds.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const exportRows = await fetchAllForExport();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('l', 'mm', 'a4');

      doc.setFontSize(22);
      doc.setTextColor(44, 62, 80);
      doc.text('Attendance Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${dayjs().format('DD MMM YYYY, hh:mm A')}`, 14, 28);

      const headers = [["S.no", "Name", "Date", "Punch In", "Punch Out", "Status", "Working Hours"]];
      const pdfRows = exportRows.map((e, idx) => [
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
        body: pdfRows,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
        styles: { fontSize: 9 }
      });

      doc.save(`Attendance_Report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const submitHandle = async (e) => {
    e.preventDefault();
    const res = await submitAttandence({ isPunchIn, inp, setisload, onSuccess: refreshList });
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
    <div className='p-3 md:p-4 max-w-7xl mx-auto space-y-3.5'>

      {/* Header & Controls Panel */}
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
        isExportingCsv={isExportingCsv}
      />

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <AttendanceTableSection
          memoColumns={memoColumns}
          finalData={finalData}
          handleSort={handleSort}
          customStyles={customStyles}
          conditionalRowStyles={conditionalRowStyles}
          handleRowSelect={handleRowSelect}
          selectedRows={selectedRows}
          pageLoading={pageLoading}
          totalRows={totalRows}
          perPage={perPage}
          onChangePage={setPage}
          onChangeRowsPerPage={(newPerPage, newPage) => { setPerPage(newPerPage); setPage(newPage); }}
        />
      </div>

      <MarkAttandence isPunchIn={isPunchIn} setisPunchIn={setisPunchIn} submitHandle={submitHandle} init={init} openmodal={openmodal} inp={inp} setinp={setinp}
        setopenmodal={setopenmodal} isUpdate={isUpdate} setisUpdate={setisUpdate} isload={isload}
      />
      <MarkAttandenceedit dispatch={dispatch} setisload={setisload} submitHandle={submitHandle} init={init2} openmodal={atteneditmodal} inp={editinp} setinp={seteditinp}
        setopenmodal={setatteneditmodal} isUpdate={isUpdate} setisUpdate={setisUpdate} isload={isload} onSuccess={refreshList}
      />
      <BulkMark isPunchIn={isPunchIn} dispatch={dispatch} setisPunchIn={setisPunchIn} submitHandle={submitHandle} init={init} openmodal={bulkmodal} inp={inp} setinp={setinp}
        setopenmodal={setbulkmodal} isUpdate={isUpdate} setisUpdate={setisUpdate} isload={isload} setisload={setisload} onSuccess={refreshList}
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
  isGeneratingPdf,
  isExportingCsv
}) => {

  const handleResetFilters = () => {
    setfiltere({
      fromDate: "",
      toDate: "",
      branch: "all",
      departmente: "all",
      employee: "",
      status: "all",
      month: "all",
      year: "all",
    });
    setInputValue("");
  };

  const isFiltered = filtere.fromDate || filtere.toDate || filtere.branch !== 'all' || filtere.departmente !== 'all' || filtere.status !== 'all' || filtere.month !== 'all' || filtere.year !== 'all' || inputValue;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-3 md:p-3.5 space-y-2.5">

      {/* Top Bar: Title / Segmented Tab Switcher / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Segmented View Switcher */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setmarkattandence(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                !markattandence
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Attendance Logs
            </button>

            {canAdd && (
              <button
                type="button"
                onClick={() => setmarkattandence(true)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  markattandence
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mark Actions
              </button>
            )}
          </div>

          {isFiltered && !markattandence && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={13} /> Reset Filters
            </button>
          )}
        </div>

        {/* Action Buttons: Multi-Delete & Exports */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedRows.length > 0 && (
            <button
              type="button"
              onClick={multidelete}
              disabled={isload}
              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete Selected ({selectedRows.length})
            </button>
          )}

          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={exportCSV}
              disabled={isExportingCsv}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-white rounded-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              {isExportingCsv ? 'Exporting...' : 'CSV'}
            </button>
            <div className="w-[1px] h-4 bg-slate-200 my-auto" />
            <button
              type="button"
              onClick={exportPDF}
              disabled={isGeneratingPdf}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-white rounded-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText size={14} className="text-rose-600" />
              {isGeneratingPdf ? 'Generating...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Section: Mark Attendance Actions or Filter Bar */}
      {markattandence ? (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-teal-50/50 border border-teal-100 rounded-lg">
          <button
            type="button"
            onClick={openModal}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            Mark Individual Attendance
          </button>

          <button
            type="button"
            onClick={openBulkModal}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            Bulk Mark Attendance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Employee Search */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={13} />
            </div>
            <input
              type="text"
              placeholder="Search employee name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <Select
              size="sm"
              value={filtere.branch}
              onChange={(e) => setfiltere({ ...filtere, branch: e.target.value })}
              options={[
                { label: "All Branches", value: "all" },
                ...(profile?.role === 'manager'
                  ? (branch?.filter((e) => profile?.branchIds?.includes(e._id)) || []).map((list) => ({ label: list.name, value: list._id }))
                  : (branch || []).map((list) => ({ label: list.name, value: list._id }))
                )
              ]}
              className="!py-1 !text-xs !bg-slate-50/50"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Select
              size="sm"
              value={filtere.departmente}
              disabled={filtere.branch === "all"}
              onChange={(e) => setfiltere({ ...filtere, departmente: e.target.value })}
              options={[
                { label: "All Departments", value: "all" },
                ...(department?.filter((e) => e.branchId?._id === filtere.branch) || []).map((val) => ({
                  label: val.department,
                  value: val._id
                }))
              ]}
              className="!py-1 !text-xs !bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Select
              size="sm"
              value={filtere.status}
              onChange={(e) => setfiltere({ ...filtere, status: e.target.value })}
              options={[
                { label: "All Status", value: "all" },
                { label: "Present", value: "present" },
                { label: "Leave", value: "leave" },
                { label: "Absent", value: "absent" },
                { label: "Weekly off", value: "weekly off" },
                { label: "Holiday", value: "holiday" },
                { label: "Half Day", value: "half day" },
              ]}
              className="!py-1 !text-xs !bg-slate-50/50"
            />
          </div>

          {/* Month Filter */}
          <div className="relative">
            <Select
              size="sm"
              value={filtere.month}
              onChange={(e) => setfiltere({ ...filtere, month: e.target.value })}
              options={[
                { label: "All Months", value: "all" },
                ...months.map((m, idx) => ({ label: m, value: idx }))
              ]}
              className="!py-1 !text-xs !bg-slate-50/50"
            />
          </div>

          {/* From Date */}
          <div className="relative flex flex-col">
            <DateInput
              size="sm"
              placeholder="From Date"
              value={filtere.fromDate}
              onChange={(e) => setfiltere({ ...filtere, fromDate: e.target.value })}
              className="!py-1 !text-xs !rounded-lg !bg-slate-50/50"
            />
          </div>

          {/* To Date */}
          <div className="relative flex flex-col">
            <DateInput
              size="sm"
              placeholder="To Date"
              value={filtere.toDate}
              onChange={(e) => setfiltere({ ...filtere, toDate: e.target.value })}
              className="!py-1 !text-xs !rounded-lg !bg-slate-50/50"
            />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <Select
              size="sm"
              value={filtere.year}
              onChange={(e) => setfiltere({ ...filtere, year: e.target.value })}
              options={[
                { label: "All Years", value: "all" },
                ...Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i).map(y => ({ label: String(y), value: y }))
              ]}
              className="!py-1 !text-xs !bg-slate-50/50"
            />
          </div>
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
  selectedRows,
  pageLoading,
  totalRows,
  perPage,
  onChangePage,
  onChangeRowsPerPage,
}) => {

  return (
    <DataTable
      columns={memoColumns}
      data={finalData}
      progressPending={pageLoading}
      progressComponent={<TableRowSkeleton rows={8} />}
      pagination
      paginationServer
      paginationTotalRows={totalRows}
      paginationPerPage={perPage}
      paginationDefaultPage={1}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      onSort={handleSort}
      selectableRows
      customStyles={customStyles}
      conditionalRowStyles={conditionalRowStyles}
      onSelectedRowsChange={handleRowSelect}
      selectedRows={selectedRows}
      highlightOnHover
    />
  );
});

export default Attandence;
