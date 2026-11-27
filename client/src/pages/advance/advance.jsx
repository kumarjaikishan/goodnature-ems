import React, { useEffect, useState } from "react";
import DataTable from '@/components/common/DataTable';
import { apiClient } from "../../utils/apiClient";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import { FirstFetch } from "../../../store/userSlice";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import dayjs from "dayjs";
import { Edit2, Trash2, Plus, User, Search, Wallet } from "lucide-react";
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DateInput from "@/components/ui/DateInput";
import NumberInput from "@/components/ui/NumberInput";
import Modalbox from "@/components/custommodal/Modalbox";
import { swal } from "../../utils/confirmDialog";
import { usePermission } from "../../utils/CheckPermission";

const calculateAdvanceInterest = (principal, rate, interestType, installments) => {
    const p = Number(principal) || 0;
    const r = Number(rate) || 0;
    const inst = Math.max(1, Number(installments) || 1);
    if (p <= 0 || r <= 0 || !interestType || interestType === 'none') return 0;
    if (interestType === 'yearly') return Math.round(p * (r / 100) * (inst / 12));
    if (interestType === 'monthly') return Math.round(p * (r / 100) * inst);
    if (interestType === 'flat') return Math.round(p * (r / 100));
    return 0;
};

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

    // Granular RBAC Permissions: 1=Read, 2=Create, 3=Update, 4=Delete
    const canCreate = usePermission('advance', 2);
    const canUpdate = usePermission('advance', 3);
    const canDelete = usePermission('advance', 4);

    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [repayModal, setRepayModal] = useState({
        open: false,
        advanceId: "",
        maxAmount: 0,
        amount: 0,
        date: dayjs().format("YYYY-MM-DD"),
        remarks: "",
    });
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
        applyInterest: false,
        interestRate: 0,
        interestType: "yearly",
        monthlyDeductionAmount: 0,
        installments: 1,
        deductionStartMonth: dayjs().format("YYYY-MM"),
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

    const calculatedInterest = form.type === 'given' && form.applyInterest
        ? calculateAdvanceInterest(form.amount, form.interestRate, form.interestType, form.installments)
        : 0;
    const totalPayableWithInterest = (Number(form.amount) || 0) + calculatedInterest;

    const handleChange = (field, rawValue) => {
        const raw = (rawValue !== null && typeof rawValue === 'object' && rawValue.target !== undefined)
            ? (rawValue.target.type === 'checkbox' ? rawValue.target.checked : rawValue.target.value)
            : rawValue;

        setForm(prev => {
            const next = { ...prev, [field]: raw };
            if (next.type === 'given') {
                const principal = Number(next.amount) || 0;
                const inst = Math.max(1, Number(next.installments) || 1);
                const interest = next.applyInterest
                    ? calculateAdvanceInterest(principal, next.interestRate, next.interestType, inst)
                    : 0;
                const totalPayable = principal + interest;

                if (['amount', 'installments', 'applyInterest', 'interestRate', 'interestType'].includes(field)) {
                    next.monthlyDeductionAmount = totalPayable > 0 ? Math.ceil(totalPayable / inst) : 0;
                } else if (field === 'monthlyDeductionAmount') {
                    const emi = Number(raw) || 0;
                    if (emi > 0 && totalPayable > 0) {
                        next.installments = Math.ceil(totalPayable / emi);
                    }
                }
            }
            return next;
        });
    };

    const handleOpen = (row = null) => {
        if (row && !canUpdate) {
            return toast.warn("You do not have permission to edit advance entries");
        }
        if (!row && !canCreate) {
            return toast.warn("You do not have permission to record advance entries");
        }
        if (row) {
            const hasInterest = Number(row.interestRate) > 0 || Number(row.interestAmount) > 0;
            const principalVal = row.principalAmount > 0
                ? row.principalAmount
                : Math.max(0, (Number(row.amount) || 0) - (Number(row.interestAmount) || 0));
            setForm({
                employeeId: row.employeeId?._id || row.employeeId || "",
                companyId: row.companyId || "",
                branchId: row.branchId || "",
                empId: row.empId || "",
                amount: principalVal || "",
                applyInterest: hasInterest,
                interestRate: row.interestRate || 0,
                interestType: row.interestType && row.interestType !== 'none' ? row.interestType : 'yearly',
                monthlyDeductionAmount: row.monthlyDeductionAmount || row.amount || "",
                installments: row.installments || 1,
                deductionStartMonth: row.deductionStartMonth
                    ? dayjs(row.deductionStartMonth).format("YYYY-MM")
                    : dayjs(row.date).format("YYYY-MM"),
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
                applyInterest: false,
                interestRate: 0,
                interestType: "yearly",
                monthlyDeductionAmount: "",
                installments: 1,
                deductionStartMonth: dayjs().format("YYYY-MM"),
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
        if (editingId && !canUpdate) {
            return toast.error("You do not have permission to update advance entries");
        }
        if (!editingId && !canCreate) {
            return toast.error("You do not have permission to create advance entries");
        }
        if (!form.employeeId) {
            return toast.error("Please select an employee");
        }
        if (!form.amount || Number(form.amount) <= 0) {
            return toast.error("Please enter a valid advance amount");
        }
        if (form.type === 'given' && form.applyInterest && Number(form.interestRate) < 0) {
            return toast.error("Interest rate cannot be negative");
        }

        const principalNum = Number(form.amount) || 0;
        const rateNum = (form.type === 'given' && form.applyInterest) ? (Number(form.interestRate) || 0) : 0;
        const effInterestType = (form.type === 'given' && form.applyInterest && rateNum > 0) ? form.interestType : 'none';
        const payload = {
            ...form,
            principalAmount: form.type === 'given' ? principalNum : 0,
            amount: form.type === 'given' ? totalPayableWithInterest : principalNum,
            interestRate: rateNum,
            interestType: effInterestType,
            deductionStartMonth: form.type === 'given' && form.deductionStartMonth
                ? `${form.deductionStartMonth}-01`
                : null,
        };

        try {
            setloading(true);
            if (editingId) {
                await apiClient({
                    url: `advance/${editingId}`,
                    method: "PUT",
                    body: payload
                });
                toast.success("Advance updated successfully");
            } else {
                await apiClient({
                    url: `advance`,
                    method: "POST",
                    body: payload
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
        if (!canDelete) {
            return toast.warn("You do not have permission to delete advance entries");
        }
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

    const handleOpenRepay = (row) => {
        if (!canCreate && !canUpdate) {
            return toast.warn("You do not have permission to record advance repayments");
        }
        const maxAmt = Number(row.remainingBalance ?? row.amount ?? 0);
        setRepayModal({
            open: true,
            advanceId: row._id,
            maxAmount: maxAmt,
            amount: maxAmt,
            date: dayjs().format("YYYY-MM-DD"),
            remarks: "",
        });
    };

    const handleRepaySubmit = async (e) => {
        if (e) e.preventDefault();
        const repayAmt = Number(repayModal.amount) || 0;
        if (repayAmt <= 0) {
            return toast.error("Please enter a valid repayment amount");
        }
        if (repayAmt > repayModal.maxAmount) {
            return toast.error(`Repayment amount cannot exceed ₹${repayModal.maxAmount.toLocaleString('en-IN')}`);
        }
        try {
            setloading(true);
            await apiClient({
                url: "advance/repay",
                method: "POST",
                body: {
                    advanceId: repayModal.advanceId,
                    amount: repayAmt,
                    date: repayModal.date,
                    remarks: repayModal.remarks,
                },
            });
            toast.success("Repayment recorded successfully");
            setRepayModal((p) => ({ ...p, open: false }));
            fetchAdvanceData();
            dispatch(FirstFetch());
        } catch (error) {
            console.error("Error recording repayment:", error);
            toast.error(error.message || "Failed to record repayment");
        } finally {
            setloading(false);
        }
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
            width: "145px",
            cell: (r) => r.type === "given" ? (
                <div>
                    <span className="font-mono font-bold text-teal-700">₹{r.amount?.toLocaleString('en-IN')}</span>
                    {Number(r.interestAmount) > 0 && (
                        <span className="block text-[10px] text-slate-500 leading-tight">
                            ₹{(r.principalAmount || (r.amount - r.interestAmount))?.toLocaleString('en-IN')} + ₹{r.interestAmount?.toLocaleString('en-IN')} ({r.interestRate}% {r.interestType})
                        </span>
                    )}
                </div>
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
                    {r.deductionStartMonth && (
                        <span className="text-[10px] text-teal-700 block">From {dayjs(r.deductionStartMonth).format('MMM YYYY')}</span>
                    )}
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
        ...(canCreate || canUpdate || canDelete ? [{
            name: "Actions",
            cell: (row) =>
                !row.payrollId && (
                    <div className="flex items-center gap-1.5">
                        {(canCreate || canUpdate) && row.type === 'given' && (Number(row.remainingBalance ?? row.amount ?? 0) > 0) && (
                            <button
                                type="button"
                                title="Repay Advance"
                                onClick={() => handleOpenRepay(row)}
                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                            >
                                <Wallet size={15} />
                            </button>
                        )}
                        {canUpdate && (
                            <button
                                type="button"
                                title="Edit"
                                onClick={() => handleOpen(row)}
                                className="p-1 text-teal-700 hover:bg-teal-50 rounded transition cursor-pointer"
                            >
                                <Edit2 size={15} />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                type="button"
                                title="Delete"
                                onClick={() => handleDelete(row._id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                ),
            width: "110px"
        }] : []),
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
                <div className="flex flex-wrap gap-2.5 items-center flex-1">
                    <div className="w-44">
                        <Select
                            size="sm"
                            className="h-9 text-xs text-slate-600 border-slate-200 rounded-lg"
                            options={branchOptions}
                            value={filters.branch}
                            onChange={(e) => handleFilterChange("branch", e.target.value)}
                        />
                    </div>

                    <div className="w-72">
                        <SearchableSelect
                            size="sm"
                            className="h-9 text-xs text-slate-600 border-slate-200 rounded-lg"
                            options={employeeOptions}
                            placeholder="Select Employee..."
                            searchPlaceholder="Search employee..."
                            value={selectedEmployeeId}
                            onChange={(val) => handleEmployeeSelect(val || 'all')}
                            allowClear={false}
                        />
                    </div>

                    {/* Search in employee advance entries */}
                    <div className="min-w-[220px] max-w-xs flex-1">
                        <Input
                            size="sm"
                            className="h-9 text-xs text-slate-600 placeholder:text-slate-400 border-slate-200 rounded-lg"
                            startIcon={Search}
                            placeholder="Search advance entries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {canCreate && (
                    <Button 
                        variant="primary" 
                        size="md"
                        startIcon={Plus}
                        onClick={() => handleOpen()} 
                    >
                        Record Advance
                    </Button>
                )}
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
            <Modalbox
                open={open}
                onClose={handleClose}
                title={editingId ? "Edit Advance Entry" : "Record Employee Advance"}
                subtitle={
                    form.employeeId
                        ? `Employee: ${employee?.find(e => e._id === form.employeeId)?.userid?.name || selectedEmployee?.userid?.name || 'Selected Employee'}`
                        : "Grant or recover advance for an employee"
                }
                maxWidth="max-w-xl"
                footer={
                    <>
                        <Button variant="outline" type="button" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button form="advance-form" variant="primary" type="submit" loading={loading}>
                            {editingId ? "Update Advance" : "Save Advance"}
                        </Button>
                    </>
                }
            >
                <form id="advance-form" onSubmit={handleSubmit} className="space-y-4">
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
                                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-teal-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                                        checked={Boolean(form.applyInterest)}
                                        onChange={(e) => handleChange('applyInterest', e.target.checked)}
                                    />
                                    Apply Interest
                                </label>
                            </div>

                            {form.applyInterest && (
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2.5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <NumberInput
                                            label="Interest Rate (%)"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            placeholder="e.g. 12"
                                            value={form.interestRate}
                                            onChange={(val) => handleChange('interestRate', val)}
                                        />
                                        <Select
                                            label="Rate Basis"
                                            options={[
                                                { label: 'Yearly (% p.a.)', value: 'yearly' },
                                                { label: 'Monthly (% / mo)', value: 'monthly' },
                                                { label: 'Flat (%)', value: 'flat' }
                                            ]}
                                            value={form.interestType}
                                            onChange={(e) => handleChange('interestType', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px] text-slate-600">
                                        <span>
                                            Principal: <strong className="font-mono text-slate-800">₹{(Number(form.amount) || 0).toLocaleString('en-IN')}</strong>
                                            {' '}+ Interest: <strong className="font-mono text-amber-700">₹{calculatedInterest.toLocaleString('en-IN')}</strong>
                                        </span>
                                        <span>
                                            Total Payable: <strong className="font-mono text-teal-800">₹{totalPayableWithInterest.toLocaleString('en-IN')}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <NumberInput
                                    label="Installments (Months)"
                                    min="1"
                                    max="60"
                                    placeholder="e.g. 6"
                                    value={form.installments}
                                    onChange={(val) => handleChange('installments', val)}
                                />

                                <NumberInput
                                    label="Monthly EMI (₹)"
                                    currency
                                    disabled
                                    readOnly
                                    placeholder="Auto-calculated"
                                    value={form.monthlyDeductionAmount}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                                    Recovery Start Month
                                </label>
                                <input
                                    type="month"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 transition"
                                    value={form.deductionStartMonth || ""}
                                    onChange={(e) => handleChange('deductionStartMonth', e.target.value)}
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
                </form>
            </Modalbox>

            {/* Direct Repay Advance Modal */}
            <Modalbox
                open={repayModal.open}
                onClose={() => setRepayModal((p) => ({ ...p, open: false }))}
                title="Repay Employee Advance"
                subtitle={`Remaining Balance: ₹${repayModal.maxAmount.toLocaleString('en-IN')}`}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setRepayModal((p) => ({ ...p, open: false }))}
                        >
                            Cancel
                        </Button>
                        <Button form="repay-advance-form" variant="primary" type="submit" loading={loading}>
                            Confirm Repayment
                        </Button>
                    </>
                }
            >
                <form id="repay-advance-form" onSubmit={handleRepaySubmit} className="space-y-4">
                    <DateInput
                        label="Repayment Date"
                        required
                        value={repayModal.date}
                        onChange={(e) => setRepayModal((p) => ({ ...p, date: e?.target?.value || e }))}
                    />
                    <NumberInput
                        label="Repayment Amount (₹)"
                        currency
                        required
                        min="1"
                        max={repayModal.maxAmount}
                        value={repayModal.amount}
                        onChange={(val) => setRepayModal((p) => ({ ...p, amount: val }))}
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">Remarks</label>
                        <textarea
                            rows={2}
                            placeholder="Optional repayment remarks..."
                            className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-2.5 text-sm text-slate-800 outline-none transition"
                            value={repayModal.remarks}
                            onChange={(e) => setRepayModal((p) => ({ ...p, remarks: e.target.value }))}
                        />
                    </div>
                </form>
            </Modalbox>
        </div>
    );
};

export default EmployeeAdvancePage;
