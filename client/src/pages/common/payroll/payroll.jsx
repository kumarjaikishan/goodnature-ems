import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from "../../admin/attandence/attandencehelper";
import { Eye, Edit2, Trash2, MessageSquareWarning, Search, Filter, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import CheckPermission from "../../../utils/CheckPermission";
import { setpayroll, FirstFetch } from "../../../../store/userSlice";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { swal } from "../../../utils/confirmDialog";

// Custom UI Components
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

export default function PayrollPage() {
  const { employeeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMonth = Number(searchParams.get("month"));
  const urlYear = Number(searchParams.get("year"));

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [payroll, setPayroll] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const themes = useCustomStyles();
  const dispatch = useDispatch();

  const [filters, setFilters] = useState({
    searchText: '',
    branch: 'all',
    month: urlMonth || new Date().getMonth() + 1,
    year: urlYear || new Date().getFullYear(),
  });

  const { employee, branch, profile } = useSelector((state) => state.user);

  useEffect(() => {
    fetchPayroll(filters.month, filters.year);
  }, [filters.month, filters.year]);

  useEffect(() => {
    if (!searchParams.get("month") || !searchParams.get("year")) {
      setSearchParams(params => {
        const newParams = new URLSearchParams(params);
        if (!newParams.get("month")) newParams.set("month", filters.month);
        if (!newParams.get("year")) newParams.set("year", filters.year);
        return newParams;
      });
    }
  }, []);

  useEffect(() => {
    const m = Number(searchParams.get("month"));
    const y = Number(searchParams.get("year"));
    if (m || y) {
      setFilters(prev => ({
        ...prev,
        month: m || prev.month,
        year: y || prev.year,
      }));
    }
  }, [searchParams]);

  const fetchPayroll = async (mVal, yVal) => {
    try {
      setLoading(true);
      const targetMonth = mVal || filters.month;
      const targetYear = yVal || filters.year;
      const data = await apiClient({
        url: "payroll",
        params: { month: targetMonth, year: targetYear }
      });
      setPayroll(data.payrolls || []);
      dispatch(setpayroll(data.payrolls || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'month' || key === 'year') {
        setSearchParams(params => {
          const newParams = new URLSearchParams(params);
          newParams.set(key, value);
          return newParams;
        });
      }
      return newFilters;
    });
  };

  // Filter employees based on search and branch
  const filteredEmployees = employee?.filter(emp => {
    const name = emp.userid?.name?.toLowerCase() || '';
    const branchId = emp.branchId || '';
    const nameMatch = filters.searchText.trim() === '' || name.includes(filters.searchText.toLowerCase());
    const branchMatch = filters.branch === 'all' || branchId === filters.branch;
    return nameMatch && branchMatch && emp.status;
  });

  // Map payrolls for quick lookup
  const payrollMap = {};
  payroll?.forEach(p => {
    const key = `${p.employeeId?._id}-${p.month}-${p.year}`;
    payrollMap[key] = true;
  });

  // Action handlers
  const handleGenerate = (emp) => {
    navigate(`/dashboard/payroll/add?employeeId=${emp._id}&month=${filters.month}&year=${filters.year}`, {
      state: { employeee: emp, month: filters.month, year: filters.year }
    });
  };

  const handleView = (emp) => {
    const existingPayroll = payroll.find(p => p.employeeId?._id === emp._id && p.month === filters.month && p.year === filters.year);
    if (!existingPayroll) return toast.info("Payroll not generated yet for this period");
    navigate(`/dashboard/payroll/print/${existingPayroll._id}`);
  };

  const handleEdit = (emp) => {
    const existingPayroll = payroll.find(p => p.employeeId?._id === emp._id && p.month === filters.month && p.year === filters.year);
    if (!existingPayroll) return toast.info("Payroll not generated yet for this period");
    navigate(`/dashboard/payroll/edit/${existingPayroll._id}`);
  };

  const handleDelete = async (empId) => {
    const existingPayroll = payroll.find(p => p.employeeId?._id === empId && p.month === filters.month && p.year === filters.year);
    if (!existingPayroll) return toast.info("No payroll to delete for this period");

    swal({
      title: `Are you sure you want to Delete?`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (proceed) => {
      if (proceed) {
        try {
          setDeletingId(empId);
          setError(null);

          const result = await apiClient({
            url: `payroll/${existingPayroll._id}`,
            method: "DELETE"
          });

          toast.success(result.message || 'Successfully deleted');
          fetchPayroll();
          dispatch(FirstFetch());
        } catch (error) {
          console.error(error);
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const canGenerate = CheckPermission('salary', 2);
  const canView = CheckPermission('salary', 1);
  const canEdit = CheckPermission('salary', 3);
  const canDelete = CheckPermission('salary', 4);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const branchOptions = [
    { value: 'all', label: 'All Branches' },
    ...((profile?.role === 'manager'
      ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
      : branch) || []).map((list) => ({ value: list._id, label: list.name }))
  ];

  const monthOptions = months.map((m, idx) => ({ value: idx + 1, label: m }));
  const yearOptions = ["2024", "2025", "2026", "2027"].map(y => ({ value: y, label: y }));

  if (!employee) return <p className="p-4 text-slate-500">No employee data found</p>;

  const columns = [
    {
      name: "S.no",
      selector: (row, ind) => ind + 1,
      width: "60px",
    },
    {
      name: "Employee",
      selector: (row) => (
        <div className="flex items-center capitalize gap-3 py-1">
          {row?.profileimage ? (
            <img
              src={cloudinaryUrl(row?.profileimage, {
                format: "webp",
                width: 100,
                height: 100,
              })}
              alt={row?.userid?.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-semibold flex items-center justify-center text-xs border border-teal-200">
              {row?.userid?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-900">{row?.userid?.name}</p>
            <p className="text-[11px] text-slate-500 font-normal">
              {row?.designation || "-"}
            </p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Email',
      selector: row => row.userid?.email || '-',
      width: "200px"
    },
    {
      name: "Department",
      selector: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.department?.department || "-"}
        </span>
      ),
      width: "140px",
    },
    {
      name: 'Actions',
      width: "360px",
      cell: (row) => {
        const key = `${row._id}-${filters.month}-${filters.year}`;
        const exists = payrollMap[key];
        return (
          <div className="flex items-center gap-1.5 py-1">
            {canGenerate && (
              <Button
                size="sm"
                variant={exists ? "ghost" : "primary"}
                icon={<Play size={13} />}
                disabled={exists}
                title={exists ? 'Already Generated' : 'Generate Payroll'}
                onClick={() => handleGenerate(row)}
              >
                {exists ? 'Generated' : 'Generate'}
              </Button>
            )}
            <Button
              size="sm"
              disabled={!exists}
              variant="outline"
              icon={<Eye size={13} />}
              onClick={() => handleView(row)}
            >
              View
            </Button>
            {canEdit && (
              <Button
                size="sm"
                disabled={!exists}
                variant="outline"
                icon={<Edit2 size={13} />}
                onClick={() => handleEdit(row)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                loading={deletingId === row._id}
                disabled={!exists}
                variant="danger"
                icon={<Trash2 size={13} />}
                onClick={() => handleDelete(row._id)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="w-full sm:w-[200px]">
            <Input
              size="sm"
              icon={<Search size={14} className="text-slate-400" />}
              value={filters.searchText}
              onChange={(e) => handleFilterChange("searchText", e.target.value)}
              placeholder="Search employee..."
            />
          </div>

          <div className="w-full sm:w-[160px]">
            <Select
              size="sm"
              value={filters.branch}
              onChange={(e) => handleFilterChange("branch", e.target.value)}
              options={branchOptions}
            />
          </div>

          <div className="w-full sm:w-[140px]">
            <Select
              size="sm"
              value={filters.month}
              onChange={(e) => handleFilterChange("month", Number(e.target.value))}
              options={monthOptions}
            />
          </div>

          <div className="w-full sm:w-[110px]">
            <Select
              size="sm"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", Number(e.target.value))}
              options={yearOptions}
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredEmployees}
          pagination
          customStyles={themes}
          highlightOnHover
          paginationPerPage={20}
          paginationRowsPerPageOptions={[20, 50, 100, 300]}
          noDataComponent={
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
              <MessageSquareWarning size={28} className="text-slate-400 mb-2" />
              <p className="text-sm font-medium">No employee records found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching with a different keyword or filter.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
