import React, { useEffect, useState, useMemo } from "react";
import { Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import { FirstFetch } from "../../../../store/userSlice";
import { swal } from "../../../utils/confirmDialog";
import usePermission from "../../../utils/CheckPermission";

import {
    UserFilterBar,
    UserGridView,
    UserTableView,
    ResetPasswordModal,
} from "./components/admin";

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [isload, setisload] = useState(false);
    const { branch: branchList } = useSelector((state) => state.user || {});
    const dispatch = useDispatch();

    const canCreate = usePermission('admin', 2);
    const canUpdate = usePermission('admin', 3);
    const canDelete = usePermission('admin', 4);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [branchFilter, setBranchFilter] = useState("all");
    const [viewMode, setViewMode] = useState(() => localStorage.getItem("userMgmt_viewMode") || "table"); // 'table' | 'grid'

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem("userMgmt_viewMode", mode);
        } catch (e) {
            console.error("Failed to save view mode:", e);
        }
    };

    const [passmodal, setpassmodal] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [copiedEmail, setCopiedEmail] = useState(null);

    const [pass, setpass] = useState({
        userid: '',
        pass: ''
    });

    useEffect(() => {
        fetech();
    }, []);

    const toggleExpand = (index) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

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

    const handleEdit = (target) => {
        const admin = typeof target === 'object' ? target : admins[target];
        if (admin && admin._id) {
            navigate(`/dashboard/organization/users/${admin._id}/edit`);
        }
    };

    const updatePassword = async (e) => {
        e.preventDefault();
        const targetUserId = pass.userid || targetUser?._id;
        if (!targetUserId || !pass.pass) {
            toast.error("User ID and new password are required");
            return;
        }
        try {
            const data = await apiClient({
                url: "updatepassword",
                method: "POST",
                body: {
                    userid: targetUserId,
                    pass: pass.pass
                }
            });
            setpass({
                userid: '',
                pass: ''
            });
            setTargetUser(null);
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

    const copyEmail = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

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

    const hasActiveFilters = Boolean(searchTerm || roleFilter !== "all" || statusFilter !== "all" || branchFilter !== "all");

    return (
        <div className="w-full space-y-6">
            {/* Action Bar & Filter Toolbar */}
            <UserFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                branchFilter={branchFilter}
                setBranchFilter={setBranchFilter}
                branchList={branchList}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                canCreate={canCreate}
                onAddUser={() => {
                    navigate('/dashboard/organization/users/new');
                }}
                onResetFilters={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setBranchFilter("all");
                }}
                hasActiveFilters={hasActiveFilters}
            />

            {/* List / Card View */}
            {filteredAdmins.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-100">
                        <Users size={28} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">No Administrators Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        {hasActiveFilters
                            ? "No accounts match the selected filters. Try clearing your search or filter options."
                            : "Click '+ Add System User / Operator' above to register your first administrative account."}
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                <UserGridView
                    admins={filteredAdmins}
                    expandedIndex={expandedIndex}
                    onToggleExpand={toggleExpand}
                    onToggleStatus={toggleUserStatus}
                    onEdit={handleEdit}
                    onResetPassword={(admin) => {
                        setTargetUser(admin);
                        setpass({ userid: admin._id, pass: '' });
                        setpassmodal(true);
                    }}
                    onDelete={handleDelete}
                    copiedEmail={copiedEmail}
                    onCopyEmail={copyEmail}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                />
            ) : (
                <UserTableView
                    admins={filteredAdmins}
                    onToggleStatus={toggleUserStatus}
                    onEdit={handleEdit}
                    onResetPassword={(admin) => {
                        setTargetUser(admin);
                        setpass({ userid: admin._id, pass: '' });
                        setpassmodal(true);
                    }}
                    onDelete={handleDelete}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                />
            )}

            {/* Quick Password Reset Modal */}
            <ResetPasswordModal
                isOpen={passmodal}
                onClose={() => {
                    setpassmodal(false);
                    setTargetUser(null);
                    setpass({ userid: '', pass: '' });
                }}
                user={targetUser}
                pass={pass}
                setPass={setpass}
                onSubmit={updatePassword}
            />
        </div>
    );
}
