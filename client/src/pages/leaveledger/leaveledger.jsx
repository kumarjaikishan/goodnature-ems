import React, { useEffect, useState } from "react";
import DataTable from '@/components/common/DataTable';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    MenuItem,
    IconButton,
    Box,
    FormControl,
    InputLabel,
    Select,
    Avatar,
    InputAdornment,
    OutlinedInput,
    Typography,
    Tooltip
} from "@mui/material";
import { apiClient } from "../../utils/apiClient";
import { MdClear, MdDelete, MdEdit, MdOpenInNew } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Modalbox from "../../components/custommodal/Modalbox";
import { CiFilter } from "react-icons/ci";
import { IoSearch } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import { FirstFetch } from "../../../store/userSlice";
import LeaveHistoryModal from "./components/LeaveHistoryModal";
import { MdHistory } from "react-icons/md";
import { useCustomStyles } from "../admin/attandence/attandencehelper";

const Leaveledger = () => {
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyEmployee, setHistoryEmployee] = useState(null);
    const [departmentlist, setdepartmentlist] = useState([]);
    const dispatch = useDispatch();
    const [form, setForm] = useState({
        employeeId: "",
        companyId: "",
        branchId: "",
        type: "credit",
        amount: 0,
        policyId: "",
        remarks: "",
    });
    const [filters, setFilters] = useState({
        searchText: '',
        branch: 'all',
        department: 'all'
    });
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState(null);
    const [isBulk, setIsBulk] = useState(false);
    const { company, employee, leaveBalance, branch, department, leavePolicies } = useSelector((state) => state.user);

    useEffect(() => {
        department.length > 0 && setdepartmentlist(department.filter((dep) => dep?.branchId?._id == filters.branch))
    }, [filters.branch]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    useEffect(() => {
        if (leaveBalance) setRows(leaveBalance)
        // console.log(leaveBalance)
    }, [leaveBalance]);

    // ✅ Handle form change
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleOpen = (row = null) => {
        setIsBulk(false);
        if (row) {
            setForm({
                employeeId: row.employeeId?._id || "",
                companyId: row.companyId || "",
                branchId: row.branchId || "",
                type: row.type,
                amount: row.amount,
                policyId: row.policyId?._id || row.policyId || "",
                remarks: row.remarks,
            });
            setEditingId(row._id);
        } else {
            setForm({
                employeeId: "",
                companyId: "",
                branchId: "",
                type: "credit",
                amount: 0,
                policyId: "",
                remarks: "",
            });
            setEditingId(null);
        }
        setOpen(true);
    };

    const handleBulkOpen = () => {
        setIsBulk(true);
        setForm({
            employeeId: "all",
            companyId: "",
            branchId: "",
            type: "credit",
            amount: 0,
            policyId: "",
            remarks: "",
        });
        setEditingId(null);
        setOpen(true);
    };

    const filteredEmployees = rows?.filter(emp => {
        const name = emp.employeeId?.userid?.name?.toLowerCase() || '';
        const branchId = emp.branchId || '';
        // const deptId = emp.departmentid || '';

        const nameMatch = filters.searchText.trim() === '' || name.includes(filters.searchText.toLowerCase());
        const branchMatch = filters.branch === 'all' || branchId === filters.branch;
        // const deptMatch = filters.department === 'all' || deptId === filters.department;

        return nameMatch && branchMatch;
    });

    const handleClose = () => setOpen(false);

    // ✅ Submit (Create or Update)
    const handleSubmit = async () => {
        if (!isBulk && !form.employeeId) return toast.warning("Please select Employee")
        if (form.amount < 1) return toast.warning("Please enter No. of Leaves")
        try {
            if (isBulk) {
                await apiClient({
                    url: `leave-balances/bulk`,
                    method: "POST",
                    body: {
                        policyId: form.policyId,
                        type: form.type,
                        amount: form.amount,
                        remarks: form.remarks
                    }
                });
                toast.success("Bulk leave balance added successfully");
            } else if (editingId) {
                await apiClient({
                    url: `leave-balances/${editingId}`,
                    method: "PUT",
                    body: form
                });
                toast.success("Leave balance updated");
            } else {
                await apiClient({
                    url: `leave-balances`,
                    method: "POST",
                    body: form
                });
                toast.success("Leave balance added");
            }
            dispatch(FirstFetch())
            handleClose();
        } catch (error) {
            console.error("Error saving leave balance:", error);
        }
    };

    // ✅ Delete record
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await apiClient({
                    url: `leave-balances/${id}`,
                    method: "DELETE"
                });
                toast.success("Leave balance deleted");
                dispatch(FirstFetch())
            } catch (error) {
                console.error("Error deleting leave balance:", error);
            }
        }
    };

    // ✅ Set employee selection
    const setEmployee = (e) => {
        const empId = e.target.value;
        const emp = employee.find((emp) => emp._id === empId);
        if (emp) {
            setForm({
                ...form,
                employeeId: emp._id,
                companyId: emp.companyId,
                branchId: emp.branchId,
            });
        }
    };
    const employepic = 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp'

    // ✅ DataTable columns
    const columns = [
        { name: "S.no", selector: (row, ind) => ind + 1, width: '60px' },
        {
            name: "Employee",
            selector: (row) => row?.employeeId?.userid?.name || "",
            sortable: true,
            minWidth: '160px',
            cell: (row) => (<div className="flex items-center capitalize gap-2">
                <Avatar
                    // src={row?.employeeId?.profileimage || employepic} 
                    src={cloudinaryUrl(row?.employeeId?.profileimage, {
                        format: "webp",
                        width: 100,
                        height: 100,
                    }) || employepic}
                    alt={row?.employeeId?.userid?.name}
                    sx={{ width: 32, height: 32 }}
                >
                    {!row?.employeeId?.profileimage && employepic}
                </Avatar>
                <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>{row?.employeeId?.userid?.name}</Typography>
                    <p className="text-[10px] text-gray-500">({row?.employeeId?.designation})</p>
                </Box>
            </div>),
        },
        // { name: "Type", selector: (row) => row.type, sortable: true, width: '90px' },
        { name: "Total Allotted", selector: (row) => row.totalAllocated, sortable: true },
        { name: "Used", selector: (row) => row.used, sortable: true },
        { 
            name: "Remaining", 
            selector: (row) => row.remaining, 
            sortable: true, 
            cell: (row) => (
                <Typography sx={{ fontWeight: 'bold', color: row.remaining < 0 ? 'red' : 'green' }}>
                    {row.remaining}
                </Typography>
            )
        },
        {
            name: "Actions",
            cell: (row) => (
                <>
                    {!row?.payrollId && <>
                        <Tooltip title="View History">
                            <IconButton color="info" onClick={() => {
                                setHistoryEmployee(row.employeeId);
                                setHistoryOpen(true);
                            }}>
                                <MdHistory />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Adjustment">
                            <IconButton color="primary" onClick={() => handleOpen(row)}>
                                <MdEdit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Summary">
                            <IconButton color="error" onClick={() => handleDelete(row._id)}>
                                <MdDelete />
                            </IconButton>
                        </Tooltip>
                    </>
                    }
                    {row.payrollId && <>
                        <IconButton title="Open Payroll" color="primary" onClick={() => navigate(`/dashboard/payroll/print/${row.payrollId}`)}>
                            <MdOpenInNew />
                        </IconButton>
                    </>}
                </>
            ),
            width: '120px'
        },
    ];

    return (
        <div className="max-w-6xl mx-auto w-full min-w-0 md:p-3 p-1">
            {/* <h2>Leave Balance Management</h2> */}
            <div className="flex my-3 items-center flex-wrap justify-between gap-2 mt-1 w-full">
                {/* Search (full on small, shrink on md+) */}
                <div className="flex flex-wrap gap-3 justify-between w-full md:w-fit">
                    <TextField
                        size="small"
                        className="w-[100%] md:w-[160px]"
                        value={filters.searchText}
                        onChange={(e) => handleFilterChange("searchText", e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IoSearch />
                                </InputAdornment>
                            ),
                            endAdornment: filters.searchText && (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => handleFilterChange("searchText", '')}
                                        edge="end"
                                        size="small"
                                    >
                                        <MdClear />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        label="Search Employee"
                    />

                    {/* Branch (50% on small, shrink on md+) */}
                    <FormControl
                        size="small"
                        className="w-[47%] md:w-[160px]"
                    >
                        <InputLabel>Branch</InputLabel>
                        <Select
                            label="Branch"
                            value={filters.branch}
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
                            onChange={(e) => handleFilterChange("branch", e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            {branch?.map((list) => (
                                <MenuItem key={list._id} value={list._id}>
                                    {list.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Department (50% on small, shrink on md+) */}
                    {/* <FormControl
                        size="small"
                        className="w-[47%] md:w-[160px]"
                    >
                        <InputLabel>Department</InputLabel>
                        <Select
                            label="Department"
                            disabled={filters.branch === "all"}
                            value={filters.department}
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
                            onChange={(e) =>
                                handleFilterChange("department", e.target.value)
                            }
                        >
                            <MenuItem value="all">All</MenuItem>
                            {departmentlist.length > 0 ? (
                                departmentlist.map((list) => (
                                    <MenuItem key={list._id} value={list._id}>
                                        {list.department}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>No departments found</MenuItem>
                            )}
                        </Select>
                    </FormControl> */}
                </div>
                <div className="w-full md:w-fit flex flex-wrap gap-2">
                    <Button
                        className="w-full md:w-fit"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleBulkOpen()}
                    >
                        Bulk Add Leave
                    </Button>
                    <Button
                        className="w-full md:w-fit"
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpen()}
                    >
                        Add Leave Balance
                    </Button>
                </div>
            </div>

            <div className="w-full rounded-lg shadow border border-gray-100 bg-white">
                <DataTable
                    columns={columns}
                    data={filteredEmployees}
                    pagination
                    highlightOnHover
                    striped
                    responsive
                    customStyles={useCustomStyles()}
                />
            </div>

            <Modalbox open={open} outside={false} onClose={handleClose}>
                <div className="membermodal w-[500px]">
                    <div className='whole'>
                        <div className='modalhead'> {isBulk ? "Bulk Add Leave Balance" : editingId ? "Edit Leave Balance" : "Add Leave Balance"}</div>
                        <form onSubmit={handleSubmit}>
                            <span className="modalcontent ">
                                <div className='flex flex-col gap-3 w-full'>
                                    {isBulk ? (
                                        <TextField
                                            disabled
                                            size="small"
                                            label="Select Employee"
                                            value="All Active Employees"
                                            fullWidth
                                            className="mt-4"
                                        />
                                    ) : (
                                        <FormControl className="w-full mt-4" >
                                            <InputLabel>Select Employee</InputLabel>
                                            <Select
                                                label="Select Employee"
                                                value={form.employeeId}
                                                onChange={setEmployee}
                                                MenuProps={{
                                                    PaperProps: {
                                                        style: {
                                                            maxHeight: 250,
                                                        },
                                                    },
                                                }}
                                            >
                                                <MenuItem value="">Select Employee</MenuItem>
                                                {employee?.filter(emp => emp.status !== false).map((emp) => (
                                                    <MenuItem key={emp._id} value={emp._id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar
                                                                // src={emp?.profileimage}
                                                                src={cloudinaryUrl(emp?.profileimage, {
                                                                    format: "webp",
                                                                    width: 100,
                                                                    height: 100,
                                                                })}
                                                                sx={{ width: 24, height: 24 }}
                                                            />
                                                            {emp.userid?.name}
                                                        </div>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    <FormControl className="w-full" size="small">
                                        <InputLabel>Leave Policy</InputLabel>
                                        <Select
                                            label="Leave Policy"
                                            name="policyId"
                                            value={form.policyId}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="">Select Policy</MenuItem>
                                            {leavePolicies?.map((policy) => (
                                                <MenuItem key={policy._id} value={policy._id}>
                                                    {policy.name} ({policy.allocationType})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <div className="w-full flex justify-between gap-3">
                                        <TextField
                                            margin="dense"
                                            select
                                            size="small"
                                            label="Type"
                                            name="type"
                                            fullWidth
                                            value={form.type}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="credit">Credit</MenuItem>
                                            <MenuItem value="debit">Debit</MenuItem>
                                        </TextField>

                                        <TextField
                                            margin="dense"
                                            label="No. of Allotted Leaves"
                                            name="amount"
                                            size="small"
                                            type="number"
                                            fullWidth
                                            value={form.amount}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <TextField
                                        margin="dense"
                                        label="Remarks"
                                        name="remarks"
                                        size="small"
                                        multiline
                                        minRows={2}
                                        fullWidth
                                        value={form.remarks}
                                        onChange={handleChange}
                                    />
                                </div>
                            </span>
                        </form>
                        <div className='modalfooter'>
                            <Button variant="outlined" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handleSubmit} variant="contained" color="primary">
                                {editingId ? "Update" : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modalbox>

            <LeaveHistoryModal 
                open={historyOpen} 
                onClose={() => setHistoryOpen(false)} 
                employee={historyEmployee} 
            />
        </div>
    );
};

export default Leaveledger;
