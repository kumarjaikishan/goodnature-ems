import React, { useEffect, useState } from "react";
import DataTable from '@/components/common/DataTable';
import { apiClient } from "../../utils/apiClient";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import { FirstFetch } from "../../../store/userSlice";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import dayjs from "dayjs";
import { Edit2, Trash2, Plus, User, Search, X } from "lucide-react";
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import Select from "@/components/ui/Select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DateInput from "@/components/ui/DateInput";
import NumberInput from "@/components/ui/NumberInput";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
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

    const [searchTerm, setSearchTerm] = useState("");

    const [filters, setFilters] = useState({
        branch: "all",
    });

    const [form, setForm] = useState({
        employeeId: "",
        companyId: "",
        branchId: "",
        empId: "",
        amount: 0,
        monthlyDeductionAmount: 0,
        installments: 1,
        type: "given",
        remarks: "",
        date: dayjs().format("YYYY-MM-DD"),
    });

    /* -------------------- LOAD DATA -------------------- */

    const fetchAdvanceData = async () => {
        try {
            setloading(true);
            const [advRes] = await Promise.all([
                apiClient({ url: "advance" }),
            ]);

            setRows(advRes.data || []);
        } catch (err) {
            console.error("Error fetching advance data:", err);
        } finally {
            setloading(false);
        }
    };

    useEffect(() => {
        fetchAdvanceData();
    }, []);

    useEffect(() => {
        if (employee) {
            let filtered = employee;
            if (filters.branch !== "all") {
                filtered = filtered.filter((e) => e.branchId === filters.branch);
            }
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

    const allEmployeeAdvances = rows?.filter((row) => {
        if (selectedEmployeeId === "all") return false;

        const branchMatch =
            filters.branch === "all" || row.branchId === filters.branch;

        const employeeMatch =
            row.employeeId?._id === selectedEmployeeId || row.employeeId === selectedEmployeeId;

        return branchMatch && employeeMatch;
    }) || [];

    const filteredEmployees = allEmployeeAdvances.filter((row) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase().trim();
        const dateStr = dayjs(row.date).format('DD MMM YYYY').toLowerCase();
        const remarksStr = (row.remarks || row.reason || "").toLowerCase();
        const typeStr = (row.type === 'given' ? 'advance granted' : row.type === 'repaid' ? 'repayment' : 'salary deduction').toLowerCase();
        const statusStr = (row.status || "").toLowerCase();
        const amountStr = String(row.amount || "");
        return (
            dateStr.includes(q) ||
            remarksStr.includes(q) ||
            typeStr.includes(q) ||
            statusStr.includes(q) ||
            amountStr.includes(q)
        );
    });

    // Summary calculations for selected employee
    const employeeGivenTotal = allEmployeeAdvances
        .filter(r => r.type === 'given')
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const employeeAdjustedTotal = allEmployeeAdvances
        .filter(r => r.type === 'adjusted' || r.type === 'repaid')
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const employeeActiveAdvances = allEmployeeAdvances
        .filter(r => r.type === 'given' && (r.remainingBalance || 0) > 0);

    const totalScheduledEMI = employeeActiveAdvances
        .reduce((sum, r) => sum + Math.min(r.monthlyDeductionAmount || r.remainingBalance || 0, r.remainingBalance || 0), 0);

    const currentOutstandingBalance = Math.max(0, employeeGivenTotal - employeeAdjustedTotal);

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

    const handleChange = (field, rawValue) => {
        const raw = (rawValue !== null && typeof rawValue === 'object' && rawValue.target !== undefined)
            ? rawValue.target.value
            : rawValue;

        setForm(prev => {
            const next = { ...prev, [field]: raw };
            if (field === 'amount' && next.type === 'given') {
                const amt = Number(raw) || 0;
                const inst = Number(next.installments) || 1;
                if (inst > 0) {
                    next.monthlyDeductionAmount = amt > 0 ? Math.ceil(amt / inst) : 0;
                }
            } else if (field === 'installments' && next.type === 'given') {
                const inst = Number(raw) || 1;
                const amt = Number(next.amount) || 0;
                if (inst > 0) {
                    next.monthlyDeductionAmount = amt > 0 ? Math.ceil(amt / inst) : 0;
                }
            } else if (field === 'monthlyDeductionAmount' && next.type === 'given') {
                const emi = Number(raw) || 0;
                const amt = Number(next.amount) || 0;
                if (emi > 0 && amt > 0) {
                    next.installments = Math.ceil(amt / emi);
                }
            }
            return next;
        });
    };

    const handleOpen = (row = null) => {
        if (row) {
            setForm({
                employeeId: row.employeeId?._id || row.employeeId || "",
                companyId: row.companyId || "",
                branchId: row.branchId || "",
                empId: row.empId || "",
                amount: row.amount || "",
                monthlyDeductionAmount: row.monthlyDeductionAmount || row.amount || "",
                installments: row.installments || 1,
                type: row.type || "given",
                remarks: row.remarks || "",
                date: dayjs(row.date).format("YYYY-MM-DD"),
            });
            setEditingId(row._id);
        } else {
            const defaultEmp = selectedEmployeeId !== "all" ? selectedEmployee : null;
            setForm({
                employeeId: defaultEmp?._id || "",
                companyId: defaultEmp?.companyId || "",
                branchId: defaultEmp?.branchId || "",
                empId: defaultEmp?.empId || "",
                amount: "",
                monthlyDeductionAmount: "",
                installments: 1,
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
        if (!form.employeeId) {
            return toast.error("Please select an employee");
        }
        if (!form.amount || Number(form.amount) <= 0) {
            return toast.error("Please enter a valid advance amount");
        }

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

            // If user recorded advance for an employee, automatically focus on that employee
            if (form.employeeId && selectedEmployeeId !== form.employeeId) {
                handleEmployeeSelect(form.employeeId);
            }

            fetchAdvanceData();
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
                    fetchAdvanceData();
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
            width: "115px", 
            cell: (r) => (
                <div className="font-mono text-xs text-slate-700">
                    {dayjs(r.date).format('DD MMM YYYY')}
                </div>
            )
        },
        { 
            name: "Type & Remarks", 
            selector: (r) => r.remarks || "-", 
            wrap: true,
            cell: (r) => (
                <div className="py-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            r.type === 'given' 
                                ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                                : r.type === 'repaid'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                            {r.type === 'given' ? 'Advance Granted' : r.type === 'repaid' ? 'Repayment' : 'Salary Deduction'}
                        </span>
                        {r.status && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                r.status === 'closed'
                                    ? 'bg-slate-100 text-slate-600'
                                    : r.status === 'partially_paid'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                                {r.status === 'closed' ? 'Closed' : r.status === 'partially_paid' ? 'In Repayment' : 'Active'}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-medium">{r.remarks || r.reason || "-"}</div>
                </div>
            )
        },
        { 
            name: "Given (₹)", 
            selector: (r) => r.type === "given" ? r.amount : 0, 
            width: "110px",
            cell: (r) => r.type === "given" ? (
                <span className="font-mono font-bold text-teal-700">₹{r.amount?.toLocaleString('en-IN')}</span>
            ) : '-'
        },
        { 
            name: "Monthly EMI", 
            selector: (r) => r.monthlyDeductionAmount || 0, 
            width: "120px",
            cell: (r) => r.type === "given" && r.monthlyDeductionAmount > 0 ? (
                <div className="text-xs">
                    <span className="font-mono font-bold text-slate-800">₹{r.monthlyDeductionAmount?.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">/month ({r.installments || 1} inst)</span>
                </div>
            ) : '-'
        },
        { 
            name: "Recovered (₹)", 
            selector: (r) => r.type === "adjusted" || r.type === "repaid" ? r.amount : 0, 
            width: "110px",
            cell: (r) => (r.type === "adjusted" || r.type === "repaid") ? (
                <span className="font-mono font-bold text-rose-700">₹{r.amount?.toLocaleString('en-IN')}</span>
            ) : '-'
        },
        { 
            name: "Remaining (₹)", 
            selector: (r) => r.type === "given" ? (r.remainingBalance ?? r.amount ?? 0) : 0, 
            width: "120px",
            cell: (r) => {
                if (r.type === "given") {
                    const bal = r.remainingBalance ?? r.amount ?? 0;
                    return <span className="font-mono font-black text-slate-800">₹{bal.toLocaleString('en-IN')}</span>;
                }
                return <span className="text-slate-400 font-mono">-</span>;
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
            width: "90px"
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

                    {/* Search in employee advance entries */}
                    <div className="relative min-w-[220px] max-w-xs flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search advance entries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 shadow-2xs transition"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
                                title="Clear search"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                <Button 
                    variant="primary" 
                    size="sm"
                    startIcon={Plus}
                    onClick={() => handleOpen()} 
                >
                    Record Advance
                </Button>
            </div>

            {/* Selected Employee Summary Cards */}
            {selectedEmployee && (
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-teal-200 bg-teal-50/30 shadow-2xs">
                        <div className="flex items-center gap-4">
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
                                    {selectedEmployee.designation || 'Staff'} • Emp ID: {selectedEmployee.empId} • Monthly Salary: ₹{Number(selectedEmployee.salary || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Granted</span>
                                <span className="text-sm font-black text-teal-800">₹{employeeGivenTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Recovered</span>
                                <span className="text-sm font-black text-rose-700">₹{employeeAdjustedTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 shadow-2xs text-center col-span-2 sm:col-span-1">
                                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Balance Due</span>
                                <span className="text-sm font-black text-emerald-700">₹{currentOutstandingBalance.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {totalScheduledEMI > 0 && currentOutstandingBalance > 0 && (
                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between flex-wrap gap-2">
                            <span>
                                <strong>Scheduled Monthly Recovery (EMI):</strong> ₹{totalScheduledEMI.toLocaleString('en-IN')}/month will be auto-deducted during payroll generation.
                            </span>
                            <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                {employeeActiveAdvances.length} Active Advance Plan(s)
                            </span>
                        </div>
                    )}
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
                                : searchTerm
                                    ? `No advance entries matching "${searchTerm}"`
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
                subtitle={
                    form.employeeId
                        ? `Employee: ${employee?.find(e => e._id === form.employeeId)?.userid?.name || selectedEmployee?.userid?.name || 'Selected Employee'}`
                        : "Grant or recover advance for an employee"
                }
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingId && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1">
                                Employee <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <SearchableSelect
                                options={(employee || []).map(e => ({
                                    label: `${e.userid?.name || 'Unknown'} (${e.empId || 'No ID'}) - ${e.designation || 'Staff'}`,
                                    value: e._id
                                }))}
                                placeholder="Select Employee..."
                                searchPlaceholder="Search employee name or ID..."
                                value={form.employeeId}
                                onChange={(empId) => {
                                    const targetEmp = (employee || []).find(e => e._id === empId);
                                    setForm(p => ({
                                        ...p,
                                        employeeId: empId || "",
                                        companyId: targetEmp?.companyId || "",
                                        branchId: targetEmp?.branchId || "",
                                        empId: targetEmp?.empId || "",
                                    }));
                                }}
                            />
                        </div>
                    )}

                    <DateInput
                        label="Advance Date"
                        required
                        value={form.date}
                        onChange={(e) => handleChange('date', e?.target?.value || e)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <NumberInput
                            label="Total Amount"
                            currency
                            required
                            min="1"
                            placeholder="0"
                            value={form.amount}
                            onChange={(val) => handleChange('amount', val)}
                        />

                        <Select
                            label="Transaction Type"
                            options={[
                                { label: 'Given (+ Advance Grant)', value: 'given' },
                                { label: 'Adjusted (- Manual Recovery)', value: 'adjusted' }
                            ]}
                            value={form.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        />
                    </div>

                    {form.type === 'given' && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>Monthly Recovery Schedule (EMI)</span>
                                <span className="text-[11px] text-teal-700 font-semibold">Auto-calculated</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <NumberInput
                                    label="Monthly EMI (₹)"
                                    currency
                                    min="1"
                                    max={Number(form.amount) > 0 ? Number(form.amount) : undefined}
                                    placeholder="e.g. 5000"
                                    value={form.monthlyDeductionAmount}
                                    onChange={(val) => handleChange('monthlyDeductionAmount', val)}
                                />

                                <NumberInput
                                    label="Installments (Months)"
                                    min="1"
                                    max="60"
                                    placeholder="e.g. 6"
                                    value={form.installments}
                                    onChange={(val) => handleChange('installments', val)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">Remarks / Reason</label>
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
