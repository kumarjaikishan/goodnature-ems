import React, { useEffect, useState } from "react";
import DataTable from '@/components/common/DataTable';
import { apiClient } from "../../utils/apiClient";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import { FirstFetch } from "../../../store/userSlice";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import dayjs from "dayjs";
import { Edit2, Trash2, Plus, User } from "lucide-react";
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import Select from "@/components/ui/Select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DateInput from "@/components/ui/DateInput";
import NumberInput from "@/components/ui/NumberInput";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { swal } from "../../utils/confirmDialog";

const getInitialBg = (name) => {
    const colors = [
        'bg-teal-600', 'bg-emerald-600', 'bg-sky-600',
        'bg-indigo-600', 'bg-violet-600', 'bg-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const EmployeeAdvancePage = () => {
    const paramEmployeeId = new URLSearchParams(window.location.search).get("employeeId");
    const dispatch = useDispatch();

    const { employee, advance, branch } = useSelector((state) => state.user);

    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [branchEmp, setbranchEmp] = useState([]);
    const [loading, setloading] = useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(
        paramEmployeeId || "all"
    );

    const [filters, setFilters] = useState({
        branch: "all",
    });

    const [form, setForm] = useState({
        employeeId: "",
        companyId: "",
        branchId: "",
        empId: "",
        amount: 0,
        type: "given",
        remarks: "",
        date: dayjs().format("YYYY-MM-DD")
    });

    /* -------------------- LOAD DATA -------------------- */

    useEffect(() => {
        if (advance) setRows(advance);
    }, [advance]);

    useEffect(() => {
        if (filters.branch === 'all') {
            setbranchEmp(employee || []);
        } else {
            const filtered = (employee || []).filter((val) => val.branchId === filters.branch);
            setbranchEmp(filtered);
        }
    }, [filters.branch, employee]);

    useEffect(() => {
        if (paramEmployeeId) {
            setSelectedEmployeeId(paramEmployeeId);
        }
    }, [paramEmployeeId]);

    const selectedEmployee =
        selectedEmployeeId !== "all"
            ? employee?.find((e) => e._id === selectedEmployeeId)
            : null;

    /* -------------------- FILTERING -------------------- */

    const filteredEmployees = rows?.filter((row) => {
        if (selectedEmployeeId === "all") return false;

        const branchMatch =
            filters.branch === "all" || row.branchId === filters.branch;

        const employeeMatch =
            row.employeeId?._id === selectedEmployeeId;

        return branchMatch && employeeMatch;
    });

    /* -------------------- HANDLERS -------------------- */

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleEmployeeSelect = (empId) => {
        setSelectedEmployeeId(empId);

        const url = new URL(window.location.href);

        if (empId === "all") {
            url.searchParams.delete("employeeId");
        } else {
            url.searchParams.set("employeeId", empId);
        }

        window.history.replaceState({}, "", url);
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleOpen = (row = null) => {
        if (row) {
            setForm({
                employeeId: row.employeeId?._id || "",
                companyId: row.companyId || "",
                branchId: row.branchId || "",
                empId: row.empId || "",
                amount: row.amount,
                type: row.type || "given",
                remarks: row.remarks || "",
                date: dayjs(row.date).format("YYYY-MM-DD"),
            });
            setEditingId(row._id);
        } else {
            setForm({
                employeeId: selectedEmployee?._id || "",
                companyId: selectedEmployee?.companyId || "",
                branchId: selectedEmployee?.branchId || "",
                empId: selectedEmployee?.empId || "",
                amount: 0,
                type: "given",
                remarks: "",
                date: dayjs().format("YYYY-MM-DD"),
            });
            setEditingId(null);
        }
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            setloading(true);
            if (editingId) {
                await apiClient({
                    url: `advance/${editingId}`,
                    method: "PUT",
                    body: form
                });
                toast.success("Advance updated successfully");
            } else {
                await apiClient({
                    url: `advance`,
                    method: "POST",
                    body: form
                });
                toast.success("Advance recorded successfully");
            }

            dispatch(FirstFetch());
            handleClose();
        } catch (error) {
            console.error("Error saving advance:", error);
            toast.error(error.message || "Failed to save advance");
        } finally {
            setloading(false);
        }
    };

    const handleDelete = async (id) => {
        swal({
            title: `Are you sure you want to delete this advance entry?`,
            text: 'Once deleted, the outstanding balance will be recalculated.',
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                try {
                    await apiClient({
                        url: `advance/${id}`,
                        method: "DELETE"
                    });
                    toast.success("Advance deleted");
                    dispatch(FirstFetch());
                } catch (error) {
                    console.error("Error deleting advance:", error);
                    toast.error(error.message || "Failed to delete");
                }
            }
        });
    };

    /* -------------------- TABLE -------------------- */

    const columns = [
        { name: "S.no", selector: (_, i) => i + 1, width: "60px" },
        { 
            name: "Date", 
            selector: (r) => r.date, 
            sortable: true,
            width: "120px", 
            cell: (r) => dayjs(r.date).format('DD MMM YYYY') 
        },
        { name: "Remarks", selector: (r) => r.remarks || "-", wrap: true },
        { 
            name: "Given (₹)", 
            selector: (r) => r.type === "given" ? r.amount : 0, 
            width: "110px",
            cell: (r) => r.type === "given" ? (
                <span className="font-mono font-bold text-teal-700">₹{r.amount?.toLocaleString()}</span>
            ) : '-'
        },
        {
            name: "Adjusted (₹)",
            selector: (r) => r.type === "adjusted" ? r.amount : 0,
            width: "110px",
            cell: (r) => r.type === "adjusted" ? (
                <span className="font-mono font-bold text-rose-700">₹{r.amount?.toLocaleString()}</span>
            ) : '-'
        },
        { 
            name: "Balance (₹)", 
            selector: (r) => r.balance ?? r.remainingBalance ?? 0, 
            width: "120px",
            cell: (r) => {
                const bal = r.balance ?? r.remainingBalance ?? 0;
                return <span className="font-mono font-black text-slate-800">₹{bal.toLocaleString()}</span>;
            }
        },
        {
            name: "Actions",
            cell: (row) =>
                !row.payrollId && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            title="Edit"
                            onClick={() => handleOpen(row)}
                            className="p-1 text-teal-700 hover:bg-teal-50 rounded transition cursor-pointer"
                        >
                            <Edit2 size={15} />
                        </button>
                        <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(row._id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ),
            width: "100px"
        },
    ];

    const branchOptions = [
        { label: 'All Branches', value: 'all' },
        ...(branch || []).map(b => ({ label: b.name, value: b._id }))
    ];

    const employeeOptions = [
        { label: '-- Select Employee --', value: 'all' },
        ...(branchEmp || []).map(e => ({
            label: `${e.userid?.name || 'Unknown'} (${e.empId || 'No ID'})`,
            value: e._id
        }))
    ];

    return (
        <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="w-44">
                        <Select
                            size="sm"
                            options={branchOptions}
                            value={filters.branch}
                            onChange={(e) => handleFilterChange("branch", e.target.value)}
                        />
                    </div>

                    <div className="w-72">
                        <SearchableSelect
                            size="sm"
                            options={employeeOptions}
                            placeholder="Select Employee..."
                            searchPlaceholder="Search employee..."
                            value={selectedEmployeeId}
                            onChange={(val) => handleEmployeeSelect(val || 'all')}
                            allowClear={false}
                        />
                    </div>
                </div>

                <Button 
                    variant="primary" 
                    size="sm"
                    startIcon={Plus}
                    onClick={() => handleOpen()} 
                    disabled={selectedEmployeeId === "all"}
                >
                    Record Advance
                </Button>
            </div>

            {/* Selected Employee Card */}
            {selectedEmployee && (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-teal-200 bg-teal-50/30 shadow-2xs">
                    {selectedEmployee.profileimage ? (
                        <img
                            src={cloudinaryUrl(selectedEmployee.profileimage, {
                                format: "webp",
                                width: 100,
                                height: 100,
                            })}
                            alt={selectedEmployee.userid?.name}
                            className="w-12 h-12 rounded-full object-cover border border-teal-200"
                        />
                    ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${getInitialBg(selectedEmployee.userid?.name)}`}>
                            {selectedEmployee.userid?.name ? selectedEmployee.userid.name.charAt(0).toUpperCase() : <User size={20} />}
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="text-base font-bold capitalize text-slate-800">
                            {selectedEmployee.userid?.name}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">
                            {selectedEmployee.designation || 'Staff'} • Emp ID: {selectedEmployee.empId}
                        </span>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <DataTable
                    columns={columns}
                    data={filteredEmployees}
                    pagination
                    customStyles={useCustomStyles()}
                    highlightOnHover
                    noDataComponent={
                        <div className="py-12 text-center text-slate-500 font-medium text-sm">
                            {!selectedEmployee
                                ? "Please select an employee above to view advance ledgers"
                                : "No advance entries recorded for this employee"}
                        </div>
                    }
                />
            </div>

            {/* Add / Edit Advance Modal */}
            <Modal
                open={open}
                onClose={handleClose}
                title={editingId ? "Edit Advance Entry" : "Record Employee Advance"}
                subtitle={`Employee: ${selectedEmployee?.userid?.name || 'Selected Employee'}`}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DateInput
                        label="Date"
                        required
                        value={form.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <NumberInput
                            label="Amount"
                            currency
                            required
                            min="1"
                            placeholder="0"
                            value={form.amount}
                            onChange={(e) => handleChange('amount', Number(e.target.value))}
                        />

                        <Select
                            label="Transaction Type"
                            options={[
                                { label: 'Given (+)', value: 'given' },
                                { label: 'Adjusted (-)', value: 'adjusted' }
                            ]}
                            value={form.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">Remarks</label>
                        <textarea
                            rows={3}
                            placeholder="State reason or description for advance disbursement / recovery..."
                            className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
                            value={form.remarks}
                            onChange={(e) => handleChange('remarks', e.target.value)}
                        />
                    </div>

                    <div className='flex justify-end gap-2 pt-4 border-t border-slate-100'>
                        <Button variant="outline" type="button" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={loading}>
                            {editingId ? "Update Advance" : "Save Advance"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EmployeeAdvancePage;
