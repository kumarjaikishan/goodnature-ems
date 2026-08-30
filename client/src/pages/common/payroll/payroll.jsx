import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Divider,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Select,
  OutlinedInput,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Box,
} from "@mui/material";
import { toast } from "../../../utils/toast";
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from "../../admin/attandence/attandencehelper";
import { Eye, Edit2, Trash2, MessageSquareWarning, Search, Filter } from "lucide-react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import CheckPermission from "../../../utils/CheckPermission";
import { setpayroll, FirstFetch } from "../../../../store/userSlice";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import swal from "sweetalert";

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
    // return console.log(empId)
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

          toast.success(result.message || 'Successfull deleted')
          fetchPayroll();
          dispatch(FirstFetch());
        } catch (error) {
          console.error(error);
          setPayroll(employee); // fallback
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

  if (!employee) return <p className="p-4 text-gray-500">No employee data found</p>;

  const columns = [
    {
      name: "S.no",
      selector: (row, ind) => ind + 1,
      width: "60px",
    },
    {
      name: "Employee",
      selector: (row) => (
        <div className="flex items-center capitalize gap-3">
          <Avatar
            src={
              cloudinaryUrl(row?.profileimage, {
                format: "webp",
                width: 100,
                height: 100,
              })
            }
            alt={row?.userid?.name}
          >

          </Avatar>
          <Box>
            <Typography variant="body2">{row?.userid?.name}</Typography>
            <p className="text-[10px] text-gray-600">
              ({row?.designation || "-"})
            </p>
          </Box>
        </div>
      ),
      sortable: true,
    },
    { name: 'Email', selector: row => row.userid?.email, width: "180px", },
    {
      name: "Department",
      selector: (row) => row.department?.department || "-", // <-- get the string
      width: "120px",
    },
    {
      name: 'Actions',
      width: "450px",
      cell: (row) => {
        const key = `${row._id}-${filters.month}-${filters.year}`;
        const exists = payrollMap[key];
        return (
          <div className="flex gap-2">
            {canGenerate && (
              <Button
                size="small"
                variant="contained"
                startIcon={<Eye size={16} />}
                disabled={exists}
                title={exists ? 'Already Generated' : 'Generate Payroll'}
                onClick={() => handleGenerate(row)}
              >
                Generate
              </Button>
            )}
            {/* {canView && ( */}
            <Button size="small" disabled={!exists} variant="outlined" startIcon={<Eye size={16} />} onClick={() => handleView(row)}>View</Button>
            {/* )} */}
            {canEdit && (
              <Button size="small" disabled={!exists} variant="outlined" startIcon={<Edit2 size={16} />} onClick={() => handleEdit(row)}>Edit</Button>
            )}
            {canDelete && (
              <Button size="small" loading={deletingId == row._id} disabled={!exists} color="error" variant="outlined" startIcon={<Trash2 size={16} />} onClick={() => handleDelete(row._id)}>Delete</Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="w-full max-w-7xl  mx-auto p-1 md:p-4">
      <div className="flex my-3 items-center flex-wrap justify-between gap-2 mt-1 w-full">
        <div className="flex flex-wrap gap-3 justify-between w-full md:w-fit">
          <TextField
            size="small"
            className="w-[100%] md:w-[160px]"
            value={filters.searchText}
            onChange={(e) => handleFilterChange("searchText", e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
            label="Search Employee"
          />

          <FormControl size="small" className="w-[47%] md:w-[160px]">
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={filters.branch}
              input={
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">
                      <Filter size={16} />
                    </InputAdornment>
                  }
                  label="Branch"
                />
              }
              onChange={(e) => handleFilterChange("branch", e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {profile?.role === 'manager'
                ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
                  ?.map((list) => (
                    <MenuItem key={list._id} value={list._id}>{list.name}</MenuItem>
                  ))
                : branch?.map((list) => (
                  <MenuItem key={list._id} value={list._id}>{list.name}</MenuItem>
                ))
              }
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Month</InputLabel>
            <Select
              label="Month"
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
            >
              {months.map((month, ind) => (
                <MenuItem key={ind} value={ind + 1}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Year</InputLabel>
            <Select
              label="Year"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              {["2024", "2025", "2026"].map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredEmployees}
        pagination
        customStyles={themes}
        highlightOnHover
        paginationPerPage={20}
        paginationRowsPerPageOptions={[20, 50, 100, 300]}
        noDataComponent={
          <div className="flex items-center gap-2 py-6 text-center text-gray-600 text-sm">
            <MessageSquareWarning size={20} /> No Employee records found.
          </div>
        }
      />
    </div>
  );
}
