import React, { useEffect, useState } from "react";
import DataTable from '@/components/common/DataTable';
import { apiClient } from "../../utils/apiClient";
import { Trash2, Edit2, ExternalLink, History, Search, Plus, Filter, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import { FirstFetch } from "../../../store/userSlice";
import LeaveHistoryModal from "./components/LeaveHistoryModal";
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import Input from "@/components/ui/Input";
import NumberInput from "@/components/ui/NumberInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

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
    const [loading, setLoading] = useState(false);
    const { company, employee, leaveBalance, branch, leavePolicies } = useSelector((state) => state.user);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    useEffect(() => {
        if (leaveBalance) setRows(leaveBalance);
    }, [leaveBalance]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleOpen = (row = null) => {
        setIsBulk(false);
        if (row) {
            setForm({
                employeeId: row.employeeId?._id || "",
                companyId: row.companyId || "",
                branchId: row.branchId || "",
                type: row.type || "credit",
                amount: row.amount || 0,
                policyId: row.policyId?._id || row.policyId || "",
                remarks: row.remarks || "",
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

        const nameMatch = filters.searchText.trim() === '' || name.includes(filters.searchText.toLowerCase());
        const branchMatch = filters.branch === 'all' || branchId === filters.branch;

        return nameMatch && branchMatch;
    });

    const handleClose = () => setOpen(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isBulk && !form.employeeId) return toast.warning("Please select Employee");
        if (form.amount < 1) return toast.warning("Please enter No. of Leaves");
        try {
            setLoading(true);
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
            dispatch(FirstFetch());
            handleClose();
        } catch (error) {
            console.error("Error saving leave balance:", error);
            toast.error(error.message || "Failed to save leave balance");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this summary record?")) {
            try {
                await apiClient({
                    url: `leave-balances/${id}`,
                    method: "DELETE"
                });
                toast.success("Leave balance deleted");
                dispatch(FirstFetch());
            } catch (error) {
                console.error("Error deleting leave balance:", error);
                toast.error(error.message || "Failed to delete");
            }
        }
    };

    const setEmployeeId = (empId) => {
        const emp = employee?.find((e) => e._id === empId);
        if (emp) {
            setForm({
                ...form,
                employeeId: emp._id,
                companyId: emp.companyId,
                branchId: emp.branchId,
            });
        }
    };

    const columns = [
        { name: "S.no", selector: (row, ind) => ind + 1, width: '60px' },
        {
            name: "Employee",
            selector: (row) => row?.employeeId?.userid?.name || "",
            sortable: true,
            minWidth: '200px',
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
                            <span className="text-[10px] text-slate-500 block">({row?.employeeId?.designation || 'Staff'})</span>
                        </div>
                    </div>
                );
            },
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
                <Badge
                    size="sm"
                    variant={row.remaining < 0 ? 'danger' : row.remaining === 0 ? 'warning' : 'success'}
                >
                    {row.remaining} days
                </Badge>
            )
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-1.5">
                    {!row?.payrollId && (
                        <>
                            <button
                                title="View Leave History"
                                className="p-1 rounded text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                                onClick={() => {
                                    setHistoryEmployee(row.employeeId);
                                    setHistoryOpen(true);
                                }}
                            >
                                <History size={16} />
                            </button>
                            <button
                                title="Adjust Balance"
                                className="p-1 rounded text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                                onClick={() => handleOpen(row)}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                title="Delete Summary"
                                className="p-1 rounded text-red-500 hover:bg-red-50 transition cursor-pointer"
                                onClick={() => handleDelete(row._id)}
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                    {row.payrollId && (
                        <button
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
    ];

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

    const policyOptions = (leavePolicies || []).map(p => ({
        label: `${p.name} (${p.allocationType})`,
        value: p._id
    }));

    return (
        <div className="max-w-7xl mx-auto w-full p-2 md:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="w-full sm:w-64">
                        <Input
                            size="sm"
                            startIcon={Search}
                            placeholder="Search employee name..."
                            value={filters.searchText}
                            onChange={(e) => handleFilterChange("searchText", e.target.value)}
                        />
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
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <DataTable
                    columns={columns}
                    data={filteredEmployees}
                    pagination
                    highlightOnHover
                    customStyles={useCustomStyles()}
                />
            </div>

            {/* Add / Edit / Bulk Modal */}
            <Modal
                open={open}
                onClose={handleClose}
                title={isBulk ? "Bulk Add Leave Balance" : editingId ? "Edit Leave Balance" : "Add Leave Balance"}
                subtitle="Allot or debit employee leave balances"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isBulk ? (
                        <Input
                            label="Target Employees"
                            disabled
                            value="All Active Employees"
                        />
                    ) : (
                        <Select
                            label="Select Employee"
                            required
                            options={employeeOptions}
                            placeholder="Select Employee..."
                            value={form.employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                        />
                    )}

                    <Select
                        label="Leave Policy"
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

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={loading}>
                            {editingId ? "Update Balance" : "Save Balance"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <LeaveHistoryModal 
                open={historyOpen} 
                onClose={() => setHistoryOpen(false)} 
                employee={historyEmployee} 
            />
        </div>
    );
};

export default Leaveledger;
