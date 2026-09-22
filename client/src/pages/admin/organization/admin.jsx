import { useEffect, useRef, useState, useMemo } from "react";
import {
    Edit2, Trash2, ChevronUp, ChevronDown, KeyRound, User, Plus,
    Building2, CheckCircle2, XCircle, ShieldCheck, Shield, Users,
    Search, LayoutGrid, List, Lock, Unlock, Mail, Copy, Check,
    Sparkles, ShieldAlert, CheckSquare, Square
} from "lucide-react";
import useImageUpload from "../../../utils/imageresizer";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useDispatch, useSelector } from "react-redux";
import { FirstFetch } from "../../../../store/userSlice";
import { swal } from "../../../utils/confirmDialog";

// Permission labels
const PERMISSION_LABELS = {
    1: "Read",
    2: "Create",
    3: "Update",
    4: "Delete",
};

const AllPermissionNames = [
    "branch",
    "department",
    "employee",
    "attandence",
    "holiday",
    "leave",
    "salary",
    "advance",
    "voucher",
    "ledger",
    "ledger_entry",
    "weekly_off_ledger",
    "plot_inventory",
    "plot_booking",
    "plot_collection",
    "plot_sponsor",
    "plot_customer",
    "plot_payout",
    "plot_reports",
    "investment",
    "audit_log",
    "notification"
];

// Module Categorization for Enterprise UX
const MODULE_CATEGORIES = [
    {
        id: "all",
        label: "All Modules",
        modules: AllPermissionNames
    },
    {
        id: "hrms",
        label: "HRMS & Staff",
        modules: ["employee", "attandence", "leave", "salary", "holiday", "weekly_off_ledger"]
    },
    {
        id: "finance",
        label: "Finance & Accounts",
        modules: ["ledger", "ledger_entry", "voucher", "advance"]
    },
    {
        id: "realestate",
        label: "Real Estate & Plots",
        modules: ["plot_inventory", "plot_booking", "plot_collection", "plot_sponsor", "plot_customer", "plot_payout", "plot_reports"]
    },
    {
        id: "admin",
        label: "Admin & Settings",
        modules: ["investment", "branch", "department", "audit_log", "notification"]
    }
];

const adminPermission = {
    branch: [1, 2, 3, 4],
    department: [1, 2, 3, 4],
    employee: [1, 2, 3, 4],
    attandence: [1, 2, 3, 4],
    holiday: [1, 2, 3, 4],
    leave: [1, 2, 3, 4],
    salary: [1, 2, 3, 4],
    advance: [1, 2, 3, 4],
    voucher: [1, 2, 3, 4],
    ledger: [1, 2, 3, 4],
    ledger_entry: [1, 2, 3, 4],
    weekly_off_ledger: [1, 2, 3, 4],
    plot_inventory: [1, 2, 3, 4],
    plot_booking: [1, 2, 3, 4],
    plot_collection: [1, 2, 3, 4],
    plot_sponsor: [1, 2, 3, 4],
    plot_customer: [1, 2, 3, 4],
    plot_payout: [1, 2, 3, 4],
    plot_reports: [1, 2, 3, 4],
    investment: [1, 2, 3, 4],
    audit_log: [1],
    notification: [1, 2, 3, 4],
};

const managerPermission = {
    branch: [1],
    department: [1, 2, 3],
    employee: [1, 2, 3],
    attandence: [1, 2, 3],
    holiday: [1, 2],
    leave: [1, 2, 3],
    salary: [1],
    advance: [1, 2, 3],
    voucher: [1, 2, 3, 4],
    ledger: [1, 2, 3, 4],
    ledger_entry: [1, 2, 3, 4],
    weekly_off_ledger: [1, 2, 3],
    plot_inventory: [1],
    plot_booking: [1, 2, 3],
    plot_collection: [1, 2, 3],
    plot_sponsor: [1],
    plot_customer: [1, 2, 3],
    plot_payout: [1],
    plot_reports: [1],
    investment: [1, 2, 3],
    audit_log: [1],
    notification: [1, 2],
};


export default function SuperAdminDashboard() {
    const [admins, setAdmins] = useState([]);
    const [isload, setisload] = useState(false);
    const { branch: branchList } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [branchFilter, setBranchFilter] = useState("all");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "admin",
        branchIds: [],
        isBlocked: false,
        profileImage: null,
        profilePreview: "",
        permissions: { ...adminPermission },
    });

    const inputref = useRef(null);
    const { handleImage } = useImageUpload();
    const [editingIndex, setEditingIndex] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newModule, setNewModule] = useState("");
    const [activePermTab, setActivePermTab] = useState("all");
    const [passmodal, setpassmodal] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [copiedEmail, setCopiedEmail] = useState(null);

    useEffect(() => {
        fetech();
    }, []);

    const toggleExpand = (index) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            password: "",
            role: "admin",
            branchIds: [],
            isBlocked: false,
            profileImage: null,
            profilePreview: "",
            permissions: { ...adminPermission },
        });
        setNewModule("");
        setEditingIndex(null);
        setShowForm(false);
    };

    const [pass, setpass] = useState({
        userid: '',
        pass: ''
    });

    const fetech = async () => {
        try {
            setisload(true);
            const data = await apiClient({
                url: "getAdmin"
            });
            setAdmins(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setisload(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const newEntry = { ...form };
        const formData = new FormData();
        setisload(true);
        try {
            const resizedFile = newEntry.profileImage
                ? await handleImage(240, newEntry.profileImage)
                : null;

            if (resizedFile) {
                formData.append("photo", resizedFile);
            }

            formData.append("name", newEntry.name);
            formData.append("email", newEntry.email);
            formData.append("role", newEntry.role);
            if (newEntry.password) {
                formData.append("password", newEntry.password);
            }
            formData.append("isBlocked", newEntry.isBlocked ? "true" : "false");
            formData.append("branchIds", JSON.stringify(newEntry.branchIds || []));
            formData.append("permissions", JSON.stringify(newEntry.permissions));

            const url = editingIndex !== null
                ? `editAdmin/${admins[editingIndex]._id}`
                : `addAdmin`;

            const data = await apiClient({
                url,
                method: "POST",
                body: formData
            });

            toast.success(data.message || "Saved successfully!", { autoClose: 1200 });

            resetForm();
            fetech();
            dispatch(FirstFetch());

        } catch (error) {
            console.error('Error saving admin:', error);
            toast.error(error.message || "Failed to save admin");
        } finally {
            setisload(false);
        }
    };

    const toggleUserStatus = async (admin) => {
        const nextBlockedStatus = !admin.isBlocked;
        const actionName = nextBlockedStatus ? "disable" : "activate";

        swal({
            title: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} account for ${admin.name}?`,
            text: nextBlockedStatus
                ? "This user will not be able to log into the EMS dashboard."
                : "This user will regain full access with their assigned permissions.",
            icon: "warning",
            buttons: true,
            dangerMode: nextBlockedStatus,
        }).then(async (proceed) => {
            if (proceed) {
                try {
                    setisload(true);
                    const formData = new FormData();
                    formData.append("name", admin.name);
                    formData.append("email", admin.email);
                    formData.append("role", admin.role);
                    formData.append("isBlocked", nextBlockedStatus ? "true" : "false");
                    if (admin.branchIds) {
                        const bIds = admin.branchIds.map(b => b._id || b);
                        formData.append("branchIds", JSON.stringify(bIds));
                    }

                    await apiClient({
                        url: `editAdmin/${admin._id}`,
                        method: "POST",
                        body: formData
                    });

                    toast.success(`Account ${nextBlockedStatus ? 'disabled' : 'activated'} successfully!`, { autoClose: 1500 });
                    fetech();
                    dispatch(FirstFetch());
                } catch (err) {
                    console.error("Error updating user status:", err);
                    toast.error(err.message || "Failed to update status");
                } finally {
                    setisload(false);
                }
            }
        });
    };

    const handleEdit = (index) => {
        const current = admins[index];
        const assignedBranchIds = (current.branchIds || []).map(b => (typeof b === 'object' ? b._id : b));
        setForm({
            ...current,
            branchIds: assignedBranchIds,
            isBlocked: !!current.isBlocked,
            profilePreview: current.profileImage || "",
            profileImage: null,
            permissions: current.permissions || (current.role === 'admin' ? { ...adminPermission } : { ...managerPermission }),
        });
        setEditingIndex(index);
        setShowForm(true);
    };

    const updatePassword = async (e) => {
        e.preventDefault();
        try {
            const data = await apiClient({
                url: "updatepassword",
                method: "POST",
                body: { pass }
            });
            setpass({
                userid: '',
                pass: ''
            });
            setpassmodal(false);
            toast.success(data.message || "Password updated successfully!", { autoClose: 1200 });
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.message || "Failed to update password");
        }
    };

    const handleDelete = async (id) => {
        swal({
            title: `Are you sure you want to permanently delete this user?`,
            text: "This action cannot be undone. Consider disabling the account instead if audit history is required.",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                let toastId;
                try {
                    setisload(true);
                    toastId = toast.loading("Deleting account...");

                    const data = await apiClient({
                        url: `deleteAdmin/${id}`,
                        method: "DELETE"
                    });

                    toast.update(toastId, {
                        render: data.message || "Deleted successfully",
                        type: "success",
                        isLoading: false,
                        autoClose: 1800,
                    });
                    fetech();
                    dispatch(FirstFetch());
                } catch (error) {
                    console.error('Error deleting admin:', error);
                    toast.update(toastId, {
                        render: error.message || 'Error deleting account',
                        type: "warning",
                        isLoading: false,
                        autoClose: 2500,
                    });
                } finally {
                    setisload(false);
                }
            }
        });
    };

    const togglePermission = (module, level) => {
        setForm((prev) => {
            const currentLevels = prev.permissions[module] || [];
            const exists = currentLevels.includes(level);
            const newLevels = exists
                ? currentLevels.filter((l) => l !== level)
                : [...currentLevels, level].sort();
            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [module]: newLevels,
                },
            };
        });
    };

    const handleApplyPreset = (presetType) => {
        if (presetType === "all") {
            const fullAccess = {};
            AllPermissionNames.forEach(mod => {
                fullAccess[mod] = [1, 2, 3, 4];
            });
            setForm(prev => ({ ...prev, permissions: fullAccess }));
        } else if (presetType === "manager") {
            setForm(prev => ({ ...prev, permissions: { ...managerPermission } }));
        } else if (presetType === "readonly") {
            const readOnly = {};
            AllPermissionNames.forEach(mod => {
                readOnly[mod] = [1];
            });
            setForm(prev => ({ ...prev, permissions: readOnly }));
        } else if (presetType === "clear") {
            const cleared = {};
            AllPermissionNames.forEach(mod => {
                cleared[mod] = [];
            });
            setForm(prev => ({ ...prev, permissions: cleared }));
        }
    };

    const handleRoleChange = (role) => {
        const defaultPermissions = role === "admin"
            ? { ...adminPermission }
            : { ...managerPermission };
        setForm({
            ...form,
            role,
            permissions: defaultPermissions,
        });
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm((prev) => ({
            ...prev,
            profileImage: file,
            profilePreview: URL.createObjectURL(file),
        }));
    };

    const handleAddModule = () => {
        if (!newModule) return;
        setForm((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [newModule]: [],
            },
        }));
        setNewModule("");
    };

    const toggleBranchSelection = (branchId) => {
        setForm((prev) => {
            const currentBranches = prev.branchIds || [];
            const exists = currentBranches.includes(branchId);
            return {
                ...prev,
                branchIds: exists
                    ? currentBranches.filter(id => id !== branchId)
                    : [...currentBranches, branchId]
            };
        });
    };

    const copyEmail = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const total = admins.length;
        const totalAdmins = admins.filter(a => a.role === 'admin').length;
        const totalManagers = admins.filter(a => a.role === 'manager').length;
        const totalBlocked = admins.filter(a => a.isBlocked).length;
        const totalActive = total - totalBlocked;
        return { total, totalAdmins, totalManagers, totalBlocked, totalActive };
    }, [admins]);

    // Filtered Admins
    const filteredAdmins = useMemo(() => {
        return admins.filter((admin) => {
            // Search text
            if (searchTerm.trim()) {
                const search = searchTerm.toLowerCase();
                const matchName = admin.name?.toLowerCase().includes(search);
                const matchEmail = admin.email?.toLowerCase().includes(search);
                if (!matchName && !matchEmail) return false;
            }

            // Role filter
            if (roleFilter !== "all" && admin.role !== roleFilter) {
                return false;
            }

            // Status filter
            if (statusFilter === "active" && admin.isBlocked) return false;
            if (statusFilter === "blocked" && !admin.isBlocked) return false;

            // Branch filter
            if (branchFilter !== "all") {
                const assigned = (admin.branchIds || []).map(b => (typeof b === 'object' ? b._id : b));
                if (!assigned.includes(branchFilter) && admin.role !== 'admin') {
                    return false;
                }
            }

            return true;
        });
    }, [admins, searchTerm, roleFilter, statusFilter, branchFilter]);

    const currentModules = Array.from(new Set([
        ...(form.role === "admin" ? AllPermissionNames : Object.keys(form.permissions)),
        ...Object.keys(form.permissions),
    ]));

    const availableModulesToAdd = AllPermissionNames.filter(
        (mod) => !currentModules.includes(mod)
    );

    return (
        <div className="w-full space-y-6">
            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
                        <h4 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h4>
                        <span className="text-[11px] text-teal-600 font-medium">{stats.totalActive} active in system</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                        <Users size={22} />
                    </div>
                </div>

                {/* Administrators */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrators</p>
                        <h4 className="text-2xl font-bold text-emerald-800 mt-1">{stats.totalAdmins}</h4>
                        <span className="text-[11px] text-emerald-600 font-medium">Full organization scope</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                        <ShieldCheck size={22} />
                    </div>
                </div>

                {/* Branch Managers */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Managers</p>
                        <h4 className="text-2xl font-bold text-sky-800 mt-1">{stats.totalManagers}</h4>
                        <span className="text-[11px] text-sky-600 font-medium">Branch oversight</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                        <Building2 size={22} />
                    </div>
                </div>

                {/* Inactive / Blocked */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disabled Accounts</p>
                        <h4 className="text-2xl font-bold text-rose-700 mt-1">{stats.totalBlocked}</h4>
                        <span className="text-[11px] text-rose-500 font-medium">Access revoked</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
                        <ShieldAlert size={22} />
                    </div>
                </div>
            </div>

            {/* Action Bar & Filter Toolbar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all text-slate-800"
                        />
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === "grid"
                                        ? "bg-white text-teal-800 shadow-xs font-bold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === "table"
                                        ? "bg-white text-teal-800 shadow-xs font-bold"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                                title="Table View"
                            >
                                <List size={15} />
                            </button>
                        </div>

                        {/* Add Admin / Manager Button */}
                        <Button
                            variant="primary"
                            size="sm"
                            startIcon={Plus}
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            Add Administrator / Manager
                        </Button>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 text-[11px] font-medium mr-1">Filter by:</span>

                    {/* Role Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                        {["all", "admin", "manager"].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRoleFilter(r)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                    roleFilter === r
                                        ? "bg-teal-800 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {r === "all" ? "All Roles" : r === "admin" ? "Admins" : "Managers"}
                            </button>
                        ))}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                        {["all", "active", "blocked"].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatusFilter(s)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                    statusFilter === s
                                        ? "bg-teal-800 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {s === "all" ? "All Status" : s === "active" ? "Active" : "Disabled"}
                            </button>
                        ))}
                    </div>

                    {/* Branch Filter if branches exist */}
                    {branchList && branchList.length > 0 && (
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 border border-slate-200/80 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
                        >
                            <option value="all">All Branches</option>
                            {branchList.map((b) => (
                                <option key={b._id} value={b._id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {(searchTerm || roleFilter !== "all" || statusFilter !== "all" || branchFilter !== "all") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setRoleFilter("all");
                                setStatusFilter("all");
                                setBranchFilter("all");
                            }}
                            className="text-[11px] text-teal-700 font-bold hover:underline ml-auto cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* List / Card View */}
            {filteredAdmins.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-100">
                        <Users size={28} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">No Administrators Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        {searchTerm || roleFilter !== "all" || statusFilter !== "all" || branchFilter !== "all"
                            ? "No accounts match the selected filters. Try clearing your search or filter options."
                            : "Click '+ Add Administrator / Manager' above to register your first administrative account."}
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredAdmins.map((admin, index) => {
                        const assignedBranches = Array.isArray(admin.branchIds) ? admin.branchIds : [];
                        const activePermissionsCount = Object.values(admin.permissions || {}).filter(levels => levels && levels.length > 0).length;

                        return (
                            <div
                                key={admin._id || index}
                                className={`bg-white border rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                                    admin.isBlocked ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200/90'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="relative">
                                                {admin?.profileImage ? (
                                                    <img
                                                        src={admin.profileImage}
                                                        alt={admin.name}
                                                        className={`w-13 h-13 rounded-2xl object-cover border-2 shadow-xs ${
                                                            admin.isBlocked ? 'border-rose-300 opacity-60' : 'border-teal-500'
                                                        }`}
                                                    />
                                                ) : (
                                                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-lg border-2 shadow-xs ${
                                                        admin.isBlocked
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-teal-50 text-teal-800 border-teal-200'
                                                    }`}>
                                                        {admin.name ? admin.name.charAt(0).toUpperCase() : <User size={24} />}
                                                    </div>
                                                )}
                                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                                                    admin.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'
                                                }`} title={admin.isBlocked ? "Blocked" : "Active"}></span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-slate-800 text-sm">{admin.name}</h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                        admin.role === 'admin'
                                                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                                                            : 'bg-sky-50 text-sky-800 border-sky-200'
                                                    }`}>
                                                        {admin.role}
                                                    </span>
                                                    {admin.isBlocked ? (
                                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <XCircle size={10} /> Disabled
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> Active
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Email with copy button */}
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                    <Mail size={12} className="text-slate-400" />
                                                    <span>{admin.email}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyEmail(admin.email)}
                                                        className="text-slate-400 hover:text-teal-700 p-0.5 rounded transition cursor-pointer"
                                                        title="Copy email"
                                                    >
                                                        {copiedEmail === admin.email ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                title={admin.isBlocked ? "Activate Account" : "Disable / Revoke Access"}
                                                onClick={() => toggleUserStatus(admin)}
                                                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                                    admin.isBlocked
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                }`}
                                            >
                                                {admin.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                                            </button>

                                            <button
                                                type="button"
                                                title="Edit Account & Permissions"
                                                onClick={() => handleEdit(index)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-200 transition cursor-pointer"
                                            >
                                                <Edit2 size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Reset Password"
                                                onClick={() => {
                                                    setpass({ ...pass, userid: admin._id });
                                                    setpassmodal(true);
                                                }}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer"
                                            >
                                                <KeyRound size={14} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Delete User"
                                                onClick={() => handleDelete(admin._id)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Assigned Branches Section */}
                                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Building2 size={13} className="text-teal-700 shrink-0" />
                                            <span className="font-semibold text-slate-600 text-[11px]">Branches:</span>
                                            {assignedBranches.length > 0 ? (
                                                assignedBranches.map((b, bIdx) => (
                                                    <span
                                                        key={bIdx}
                                                        className="text-[10px] font-bold text-teal-900 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-md"
                                                    >
                                                        {b?.name || b?.branchCode || b}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">
                                                    {admin.role === 'admin' ? 'Universal Oversight (All Branches)' : 'No specific branch assigned'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {activePermissionsCount} modules active
                                        </span>
                                    </div>
                                </div>

                                {/* Permissions Collapsible Drawer */}
                                <div className="border-t border-slate-100 pt-2.5">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(index)}
                                        className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 text-teal-900 text-xs font-bold transition cursor-pointer"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Shield size={13} className="text-teal-700" />
                                            {expandedIndex === index ? "Collapse Permission Matrix" : "View Granular RBAC Permissions"}
                                        </span>
                                        {expandedIndex === index ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>

                                    {expandedIndex === index && (
                                        <div className="mt-2.5 overflow-x-auto rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-slate-50">
                                                    <tr>
                                                        <th className="py-2 px-3">Module</th>
                                                        {Object.values(PERMISSION_LABELS).map((label) => (
                                                            <th key={label} className="py-2 px-3 text-center">
                                                                {label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {Object.entries(admin.permissions || {}).map(([module, levels]) => (
                                                        <tr key={module} className="hover:bg-slate-50/60">
                                                            <td className="py-2 px-3 font-semibold text-slate-800 capitalize text-[11px]">
                                                                {module.replace('_', ' ')}
                                                            </td>
                                                            {Object.keys(PERMISSION_LABELS).map((permKey) => (
                                                                <td key={permKey} className="py-2 px-3 text-center">
                                                                    {levels.includes(Number(permKey)) ? (
                                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200">
                                                                            ✓
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-300">-</span>
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider select-none">
                                <tr>
                                    <th className="p-3.5">User</th>
                                    <th className="p-3.5">Role</th>
                                    <th className="p-3.5">Assigned Branches</th>
                                    <th className="p-3.5">Status</th>
                                    <th className="p-3.5 text-center">Active Modules</th>
                                    <th className="p-3.5 text-right min-w-[140px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium bg-white">
                                {filteredAdmins.map((admin, index) => {
                                    const assignedBranches = Array.isArray(admin.branchIds) ? admin.branchIds : [];
                                    const activePermissionsCount = Object.values(admin.permissions || {}).filter(levels => levels && levels.length > 0).length;

                                    return (
                                        <tr key={admin._id || index} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-3">
                                                    {admin?.profileImage ? (
                                                        <img
                                                            src={admin.profileImage}
                                                            alt={admin.name}
                                                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                                                            {admin.name ? admin.name.charAt(0).toUpperCase() : <User size={14} />}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-bold text-slate-800 block">{admin.name}</span>
                                                        <span className="text-[11px] text-slate-400">{admin.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                    admin.role === 'admin'
                                                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                                                        : 'bg-sky-50 text-sky-800 border-sky-200'
                                                }`}>
                                                    {admin.role}
                                                </span>
                                            </td>
                                            <td className="p-3.5">
                                                {assignedBranches.length > 0 ? (
                                                    <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                                        {assignedBranches.map((b, bIdx) => (
                                                            <span
                                                                key={bIdx}
                                                                className="text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded"
                                                            >
                                                                {b?.name || b?.branchCode || b}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">
                                                        {admin.role === 'admin' ? 'All Branches' : 'None'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                {admin.isBlocked ? (
                                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <XCircle size={10} /> Disabled
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                                    {activePermissionsCount} modules
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        title={admin.isBlocked ? "Activate Account" : "Disable Account"}
                                                        onClick={() => toggleUserStatus(admin)}
                                                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                                            admin.isBlocked
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                        }`}
                                                    >
                                                        {admin.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Edit Account"
                                                        onClick={() => handleEdit(index)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Reset Password"
                                                        onClick={() => {
                                                            setpass({ ...pass, userid: admin._id });
                                                            setpassmodal(true);
                                                        }}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                                                    >
                                                        <KeyRound size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Delete User"
                                                        onClick={() => handleDelete(admin._id)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add / Edit Admin Modal */}
            <Modal
                open={showForm}
                onClose={() => setShowForm(false)}
                title={editingIndex !== null ? "Edit Administrator / Manager" : "Create Administrator / Manager"}
                subtitle="Configure credentials, operational branch scopes, and granular RBAC permissions"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    {/* Profile Photo */}
                    <div className="flex justify-center">
                        <div className="relative w-20 h-20">
                            <input
                                type="file"
                                onChange={handleProfileImageChange}
                                ref={inputref}
                                accept="image/*"
                                className="hidden"
                            />

                            {form.profilePreview ? (
                                <img
                                    src={form.profilePreview}
                                    alt={form.name}
                                    className="w-full h-full rounded-2xl object-cover border-2 border-teal-500 shadow-md"
                                />
                            ) : (
                                <div className="w-full h-full rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-2xl border-2 border-dashed border-teal-300 shadow-inner">
                                    {form.name ? form.name.charAt(0).toUpperCase() : <User size={30} />}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => inputref.current.click()}
                                className="absolute -bottom-1 -right-1 p-1.5 bg-teal-800 text-white rounded-xl shadow-md hover:bg-teal-900 transition cursor-pointer"
                                title="Upload profile picture"
                            >
                                <Edit2 size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Basic Info Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            required
                            placeholder="e.g. John Doe"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            required
                            placeholder="e.g. user@goodnature.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editingIndex === null ? (
                            <Input
                                label="Initial Password"
                                type="password"
                                required
                                placeholder="Enter secure password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                        ) : (
                            <div className="flex flex-col justify-center">
                                <label className="text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer select-none bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 cursor-pointer"
                                        checked={!form.isBlocked}
                                        onChange={(e) => setForm({ ...form, isBlocked: !e.target.checked })}
                                    />
                                    <span>Active (Login Permitted)</span>
                                </label>
                            </div>
                        )}

                        <Select
                            label="Role Assignment"
                            options={[
                                { label: 'Administrator (Full Organizational Scope)', value: 'admin' },
                                { label: 'Branch Manager (Branch Operations)', value: 'manager' }
                            ]}
                            value={form.role}
                            onChange={(e) => handleRoleChange(e.target.value)}
                        />
                    </div>

                    {/* Assigned Branches Multi-Select */}
                    <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                            <Building2 size={14} className="text-teal-700" />
                            Assigned Branches
                        </label>
                        <p className="text-[11px] text-slate-500">Select which branch(es) this manager has operational authority on:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            {branchList && branchList.length > 0 ? (
                                branchList.map((b) => {
                                    const isSelected = form.branchIds?.includes(b._id);
                                    return (
                                        <button
                                            type="button"
                                            key={b._id}
                                            onClick={() => toggleBranchSelection(b._id)}
                                            className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium border transition-all cursor-pointer select-none ${
                                                isSelected
                                                    ? 'bg-teal-50 border-teal-400 text-teal-950 font-bold shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="w-3.5 h-3.5 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 pointer-events-none"
                                            />
                                            <span className="truncate">{b.name}</span>
                                        </button>
                                    );
                                })
                            ) : (
                                <span className="text-xs text-slate-400 italic p-2 col-span-3">No branches found. Please add branches in Organization settings first.</span>
                            )}
                        </div>
                    </div>

                    {/* Permission Presets Toolbar */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-xs font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-teal-700" />
                                Granular Module Permissions
                            </label>
                            <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-400 font-medium mr-1">Presets:</span>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset("all")}
                                    className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-bold border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
                                >
                                    Full Access
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset("manager")}
                                    className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-bold border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
                                >
                                    Manager Default
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset("readonly")}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
                                >
                                    Read-Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset("clear")}
                                    className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-bold border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Add Custom Module Selector (Manager) */}
                        {form.role === "manager" && availableModulesToAdd.length > 0 && (
                            <div className="flex items-end gap-2 pt-1">
                                <div className="flex-1">
                                    <Select
                                        label="Grant Additional Module"
                                        placeholder="Select module to add to permissions list..."
                                        options={availableModulesToAdd.map(m => ({ label: m.replace('_', ' ').toUpperCase(), value: m }))}
                                        value={newModule}
                                        onChange={(e) => setNewModule(e.target.value)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddModule}
                                    disabled={!newModule}
                                >
                                    Add Module
                                </Button>
                            </div>
                        )}

                        {/* Category Navigation Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
                            {MODULE_CATEGORIES.map(cat => {
                                const isActive = activePermTab === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActivePermTab(cat.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                            isActive
                                                ? "bg-teal-700 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Permissions Matrix Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-64 overflow-y-auto shadow-inner">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-slate-100 z-10">
                                    <tr>
                                        <th className="py-2.5 px-3">Module Name</th>
                                        {Object.entries(PERMISSION_LABELS).map(([code, label]) => {
                                            const numCode = Number(code);
                                            const activeCat = MODULE_CATEGORIES.find(c => c.id === activePermTab);
                                            const displayedModules = currentModules.filter(m => activePermTab === "all" || (activeCat && activeCat.modules.includes(m)));
                                            const allChecked = displayedModules.length > 0 && displayedModules.every(m => form.permissions[m]?.includes(numCode));
                                            
                                            return (
                                                <th key={code} className="py-2 px-2 text-center select-none">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span>{label}</span>
                                                        <button
                                                            type="button"
                                                            title={`Toggle ${label} for visible modules`}
                                                            onClick={() => {
                                                                setForm(prev => {
                                                                    const nextPerms = { ...prev.permissions };
                                                                    displayedModules.forEach(m => {
                                                                        const existing = nextPerms[m] || [];
                                                                        if (allChecked) {
                                                                            nextPerms[m] = existing.filter(l => l !== numCode);
                                                                        } else {
                                                                            if (!existing.includes(numCode)) {
                                                                                nextPerms[m] = [...existing, numCode].sort();
                                                                            }
                                                                        }
                                                                    });
                                                                    return { ...prev, permissions: nextPerms };
                                                                });
                                                            }}
                                                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                                                allChecked
                                                                    ? "bg-teal-700 text-white border-teal-700"
                                                                    : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            {allChecked ? "All" : "Toggle"}
                                                        </button>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {currentModules
                                        .filter(module => {
                                            if (activePermTab === "all") return true;
                                            const cat = MODULE_CATEGORIES.find(c => c.id === activePermTab);
                                            return cat ? cat.modules.includes(module) : true;
                                        })
                                        .map((module) => (
                                            <tr key={module} className="hover:bg-teal-50/40 transition-colors">
                                                <td className="py-2.5 px-3 font-semibold text-slate-800 text-xs">
                                                    <span className="capitalize">{module.replace(/_/g, ' ')}</span>
                                                </td>
                                                {Object.keys(PERMISSION_LABELS).map((level) => {
                                                    const numLevel = Number(level);
                                                    const isGranted = form.permissions[module]?.includes(numLevel) || false;
                                                    return (
                                                        <td key={level} className="py-2.5 px-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 cursor-pointer transition-all"
                                                                checked={isGranted}
                                                                onChange={() => togglePermission(module, numLevel)}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isload}
                        >
                            {editingIndex !== null ? "Update Account" : "Create Account"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Password Reset Modal */}
            <Modal
                open={passmodal}
                onClose={() => setpassmodal(false)}
                title="Reset User Password"
                subtitle="Set a new secure password for this administrative account"
                maxWidth="max-w-md"
            >
                <form onSubmit={updatePassword} className="space-y-4">
                    <Input
                        label="New Password"
                        type="password"
                        required
                        minLength={4}
                        maxLength={20}
                        placeholder="Enter new password (min 4 characters)"
                        value={pass.pass}
                        onChange={(e) => setpass({ ...pass, pass: e.target.value })}
                    />

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setpassmodal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            Update Password
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
