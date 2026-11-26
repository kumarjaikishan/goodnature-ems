import React, { useEffect, useState, useMemo, useCallback } from "react";
import DataTable from '@/components/common/DataTable';
import { apiClient } from "../../utils/apiClient";
import { Trash2, Edit2, ExternalLink, Eye, Search, Plus, User, X, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import { confirmDialog } from "../../utils/confirmDialog";
import { useNavigate } from "react-router-dom";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import { setEmployees } from "../../../store/userSlice";
import LeaveHistoryModal from "./components/LeaveHistoryModal";
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import { usePermission } from "../../utils/CheckPermission";
import Input from "@/components/ui/Input";
import NumberInput from "@/components/ui/NumberInput";
import Select from "@/components/ui/Select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Button from "@/components/ui/Button";
import Modalbox from "@/components/custommodal/Modalbox";

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

const Leaveledger = () => {
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyEmployee, setHistoryEmployee] = useState(null);
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
    });
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState(null);
    const [isBulk, setIsBulk] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { employee, branch, leavePolicies } = useSelector((state) => state.user);

    const canCreate = usePermission("leave", 2);
    const canEdit = usePermission("leave", 3);
    const canDelete = usePermission("leave", 4);

    const [policies, setPolicies] = useState([]);
    const customTableStyles = useCustomStyles();

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const fetchLeaveLedgerData = useCallback(async () => {
        try {
            setTableLoading(true);
            const [lbRes, polRes, empRes] = await Promise.all([
                apiClient({ url: "leave-balances" }),
                apiClient({ url: "leave-policies" }),
                apiClient({ url: "getemployee" })
            ]);
            const lbList = Array.isArray(lbRes) ? lbRes : (lbRes?.data || []);
            const polList = Array.isArray(polRes) ? polRes : (polRes?.data || []);
            const empList = Array.isArray(empRes) ? empRes : (empRes?.data || []);

            setRows(lbList);
            if (polList.length > 0 || Array.isArray(polRes)) setPolicies(polList);
            if (empList.length > 0 || Array.isArray(empRes)) dispatch(setEmployees(empList));
        } catch (err) {
            toast.error(err.message || "Failed to load leave balances");
        } finally {
            setTableLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchLeaveLedgerData();
    }, [fetchLeaveLedgerData]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleOpen = useCallback((row = null) => {
        setIsBulk(false);
        if (row) {
            setForm({
                employeeId: row.employeeId?._id || "",
                companyId: row.companyId || "",
                branchId: row.branchId || "",
                type: "credit",
                amount: 0,
                policyId: row.policyId?._id || row.policyId || "",
                remarks: "",
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
    }, []);

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

    const filteredEmployees = useMemo(() => {
        const q = filters.searchText.trim().toLowerCase();
        return (rows || []).filter(emp => {
            const name = emp.employeeId?.userid?.name?.toLowerCase() || '';
            const empId = emp.employeeId?.empId?.toLowerCase() || '';
            const policyName = emp.policyId?.name?.toLowerCase() || '';
            const branchId = emp.branchId || '';

            const nameMatch = !q || name.includes(q) || empId.includes(q) || policyName.includes(q);
            const branchMatch = filters.branch === 'all' || String(branchId) === String(filters.branch);

            return nameMatch && branchMatch;
        });
    }, [rows, filters]);

    const handleClose = () => setOpen(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isBulk && !form.employeeId) return toast.warning("Please select Employee");
        if (!form.policyId) return toast.warning("Please select Leave Policy");
        if (!form.amount || Number(form.amount) < 1) return toast.warning("Please enter No. of Leaves (at least 1)");

        try {
            setSubmitting(true);
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
                    body: {
                        type: form.type,
                        amount: form.amount,
                        remarks: form.remarks
                    }
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
            fetchLeaveLedgerData();
            handleClose();
        } catch (error) {
            toast.error(error.message || "Failed to save leave balance");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = useCallback(async (id) => {
        const proceed = await confirmDialog({
            title: "Delete Summary Record?",
            text: "This will delete the leave balance summary and its transaction history for this policy.",
            confirmText: "Delete",
            cancelText: "Cancel",
            isDanger: true,
        });
        if (!proceed) return;

        try {
            await apiClient({
                url: `leave-balances/${id}`,
                method: "DELETE"
            });
            toast.success("Leave balance deleted");
            fetchLeaveLedgerData();
        } catch (error) {
            toast.error(error.message || "Failed to delete");
        }
    }, [fetchLeaveLedgerData]);

    const setEmployeeId = (empId) => {
        const emp = employee?.find((e) => e._id === empId);
        if (emp) {
            setForm(prev => ({
                ...prev,
                employeeId: emp._id,
                companyId: emp.companyId,
                branchId: emp.branchId,
            }));
        }
    };

    const columns = useMemo(() => [
        { name: "S.no", selector: (_row, ind) => ind + 1, width: '60px' },
        {
            name: "Employee",
            selector: (row) => row?.employeeId?.userid?.name || "",
            sortable: true,
            minWidth: '210px',
            cell: (row) => {
                const name = row?.employeeId?.userid?.name || "N/A";
                const profileImg = row?.employeeId?.profileimage;
                return (
                    <div className="flex items-center gap-2.5 py-1">
                        {profileImg ? (
                            <img
                                src={cloudinaryUrl(profileImg, {
                                    format: "webp",
                                    width: 100,
                                    height: 100,
                                })}
                                alt={name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                        ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getInitialBg(name)}`}>
                                {name ? name.charAt(0).toUpperCase() : <User size={14} />}
                            </div>
                        )}
                        <div>
                            <span className="font-semibold text-xs text-slate-800 block capitalize">{name}</span>
                            <span className="text-[10px] text-slate-500 block">
                                {row?.employeeId?.empId ? `${row.employeeId.empId} • ` : ''}
                                {row?.employeeId?.designation || 'Staff'}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            name: "Leave Policy",
            selector: (row) => row?.policyId?.name || "",
            sortable: true,
            minWidth: '150px',
            cell: (row) => (
                <span className="text-xs font-medium text-slate-700">
                    {row?.policyId?.name || 'General'}
                </span>
            )
        },
        {
            name: "Total Allotted",
            selector: (row) => row.totalAllocated,
            sortable: true,
            cell: (row) => <span className="font-semibold text-slate-700">{row.totalAllocated}</span>
        },
        {
            name: "Used",
            selector: (row) => row.used,
            sortable: true,
            cell: (row) => <span className="font-semibold text-slate-600">{row.used}</span>
        },
        {
            name: "Remaining",
            selector: (row) => row.remaining,
            sortable: true,
            cell: (row) => (
                <span
                    className={`font-semibold text-xs ${
                        row.remaining < 0
                            ? 'text-rose-600'
                            : row.remaining === 0
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                    }`}
                >
                    {row.remaining} days
                </span>
            )
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    {!row?.payrollId && (
                        <>
                            <button
                                type="button"
                                title="View Leave History"
                                className="p-1 rounded text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                                onClick={() => {
                                    setHistoryEmployee(row.employeeId);
                                    setHistoryOpen(true);
                                }}
                            >
                                <Eye size={16} />
                            </button>
                            {canEdit && (
                                <button
                                    type="button"
                                    title="Adjust Balance"
                                    className="p-1 rounded text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                                    onClick={() => handleOpen(row)}
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    type="button"
                                    title="Delete Summary"
                                    className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
                                    onClick={() => handleDelete(row._id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </>
                    )}
                    {row.payrollId && (
                        <button
                            type="button"
                            title="Open Payroll"
                            className="p-1 rounded text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                            onClick={() => navigate(`/dashboard/payroll/print/${row.payrollId}`)}
                        >
                            <ExternalLink size={16} />
                        </button>
                    )}
                </div>
            ),
            width: '120px'
        },
    ], [canEdit, canDelete, handleOpen, handleDelete, navigate]);

    const branchOptions = [
        { label: 'All Branches', value: 'all' },
        ...(branch || []).map(b => ({ label: b.name, value: b._id }))
    ];

    const employeeOptions = (employee || [])
        .filter(emp => emp.status !== false)
        .map(emp => ({
            label: `${emp.userid?.name || 'Unknown'} (${emp.empId || 'No ID'})`,
            value: emp._id
        }));

    const activePolicies = policies?.length > 0 ? policies : (leavePolicies || []);

    const policyOptions = activePolicies.map(p => ({
        label: `${p.name} (${p.allocationType})`,
        value: p._id
    }));

    return (
        <div className="max-w-7xl mx-auto w-full p-2 md:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search employee or policy..."
                            value={filters.searchText}
                            onChange={(e) => handleFilterChange("searchText", e.target.value)}
                            className="w-full h-9 pl-8 pr-7 text-xs text-slate-600 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                        />
                        {filters.searchText && (
                            <button
                                type="button"
                                onClick={() => handleFilterChange("searchText", "")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="w-full sm:w-48">
                        <Select
                            size="sm"
                            options={branchOptions}
                            value={filters.branch}
                            onChange={(e) => handleFilterChange("branch", e.target.value)}
                        />
                    </div>
                </div>

                {canCreate && (
                    <div className="w-full md:w-auto flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkOpen}
                        >
                            Bulk Add Leave
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            startIcon={Plus}
                            onClick={() => handleOpen()}
                        >
                            Add Leave Balance
                        </Button>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <DataTable
                    columns={columns}
                    data={filteredEmployees}
                    progressPending={tableLoading}
                    pagination
                    highlightOnHover
                    customStyles={customTableStyles}
                    noDataComponent={
                        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                            <AlertCircle size={26} className="text-slate-400 mb-2" />
                            <p className="text-sm font-medium">No leave balance records found</p>
                            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or add a leave balance.</p>
                        </div>
                    }
                />
            </div>

            {/* Add / Edit / Bulk Modal */}
            <Modalbox
                open={open}
                onClose={handleClose}
                title={isBulk ? "Bulk Add Leave Balance" : editingId ? "Adjust Leave Balance" : "Add Leave Balance"}
                subtitle={editingId ? "Credit or debit leave days for this employee & policy" : "Allot or debit employee leave balances"}
                maxWidth="max-w-lg"
                footer={
                    <>
                        <Button variant="outline" size="sm" type="button" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button form="leave-ledger-form" variant="primary" size="sm" type="submit" loading={submitting}>
                            {editingId ? "Adjust Balance" : "Save Balance"}
                        </Button>
                    </>
                }
            >
                <form id="leave-ledger-form" onSubmit={handleSubmit} className="space-y-4">
                    {isBulk ? (
                        <Input
                            label="Target Employees"
                            disabled
                            value="All Active Employees"
                        />
                    ) : (
                        <SearchableSelect
                            label="Select Employee"
                            required
                            disabled={Boolean(editingId)}
                            options={employeeOptions}
                            placeholder="Select Employee..."
                            searchPlaceholder="Search employee name or ID..."
                            value={form.employeeId}
                            onChange={(val) => setEmployeeId(val)}
                            allowClear={false}
                        />
                    )}

                    <Select
                        label="Leave Policy"
                        required
                        disabled={Boolean(editingId)}
                        options={policyOptions}
                        placeholder="Select Policy..."
                        value={form.policyId}
                        onChange={(e) => handleChange('policyId', e.target.value)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                            label="Transaction Type"
                            options={[
                                { label: 'Credit (+)', value: 'credit' },
                                { label: 'Debit (-)', value: 'debit' }
                            ]}
                            value={form.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        />

                        <NumberInput
                            label="No. of Leaves"
                            required
                            min="1"
                            placeholder="e.g. 1"
                            value={form.amount}
                            onChange={(e) => handleChange('amount', Number(e.target.value))}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">Remarks</label>
                        <textarea
                            rows={2}
                            placeholder="Reason for leave allotment or deduction..."
                            className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
                            value={form.remarks}
                            onChange={(e) => handleChange('remarks', e.target.value)}
                        />
                    </div>
                </form>
            </Modalbox>

            <LeaveHistoryModal
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                employee={historyEmployee}
                canDelete={canDelete}
                onDeleted={fetchLeaveLedgerData}
            />
        </div>
    );
};

export default Leaveledger;
