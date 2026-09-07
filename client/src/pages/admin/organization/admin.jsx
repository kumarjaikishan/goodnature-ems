import { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, ChevronUp, ChevronDown, KeyRound, User, Plus } from "lucide-react";
import useImageUpload from "../../../utils/imageresizer";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useDispatch } from "react-redux";
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
    "branch", "department", "employee", "attandence",
    "ledger", "ledger_entry", "holiday", "leave", "notification", "salary",
    "plot_inventory", "plot_booking", "plot_collection", "plot_sponsor", "plot_customer", "plot_payout", "plot_reports"
];

const adminPermission = {
    branch: [1, 2, 3, 4],
    department: [1, 2, 3, 4],
    employee: [1, 2, 3, 4],
    attandence: [1, 2, 3, 4],
    ledger: [1, 2, 3, 4],
    ledger_entry: [1, 2, 3, 4],
    holiday: [1, 2, 3, 4],
    leave: [1, 3, 4],
    notification: [1, 2, 3, 4],
    salary: [1, 2, 3],
    plot_inventory: [1, 2, 3, 4],
    plot_booking: [1, 2, 3, 4],
    plot_collection: [1, 2, 3, 4],
    plot_sponsor: [1, 2, 3, 4],
    plot_customer: [1, 2, 3, 4],
    plot_payout: [1, 2, 3, 4],
    plot_reports: [1, 2, 3, 4],
};

const managerPermission = {
    department: [1, 2, 3],
    employee: [1, 2, 3],
    attandence: [1, 2, 3],
    ledger: [1, 2, 3, 4],
    ledger_entry: [1, 2, 3, 4],
    holiday: [1, 2],
    leave: [1, 3],
    notification: [1, 2],
    salary: [1],
    plot_inventory: [1],
    plot_booking: [1, 2, 3],
    plot_collection: [1, 2],
    plot_sponsor: [1],
    plot_customer: [1, 2, 3],
    plot_payout: [1],
    plot_reports: [1],
};

export default function SuperAdminDashboard() {
    const [admins, setAdmins] = useState([]);
    const [isload, setisload] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "admin",
        profileImage: null,
        profilePreview: "",
        permissions: { ...adminPermission },
    });
    const dispatch = useDispatch();

    useEffect(() => {
        fetech();
    }, []);
    const inputref = useRef(null);

    const { handleImage } = useImageUpload();
    const [editingIndex, setEditingIndex] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newModule, setNewModule] = useState("");
    const [passmodal, setpassmodal] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const toggleExpand = (index) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
    };

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            password: "",
            role: "admin",
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
            formData.append("password", newEntry.password);
            formData.append("permissions", JSON.stringify(newEntry.permissions));

            const url = editingIndex !== null
                ? `editAdmin/${admins[editingIndex]._id}`
                : `addAdmin`;

            const data = await apiClient({
                url,
                method: "POST",
                body: formData
            });

            toast.success(data.message || "Admin saved successfully!", { autoClose: 1200 });

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

    const handleEdit = (index) => {
        const current = admins[index];
        setForm({
            ...current,
            profilePreview: current.profileImage || "",
            profileImage: null,
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
            title: `Are you sure you want to delete this administrator?`,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                let toastId;
                try {
                    setisload(true);
                    toastId = toast.loading("Deleting...");

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
                        render: error.message || 'Error deleting admin',
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

    const currentModules = Array.from(new Set([
        ...(form.role === "admin" ? AllPermissionNames : Object.keys(form.permissions)),
        ...Object.keys(form.permissions),
    ]));

    const availableModulesToAdd = AllPermissionNames.filter(
        (mod) => !currentModules.includes(mod)
    );

    return (
        <div className="p-2 w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Administrators & Branch Managers
                </h3>
                <Button
                    variant="primary"
                    size="sm"
                    startIcon={Plus}
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    Add Admin / Manager
                </Button>
            </div>

            {admins.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-medium text-sm">
                    No administrators or managers found.
                </div>
            ) : (
                <div className="space-y-3">
                    {admins.map((admin, index) => (
                        <div
                            key={admin._id || index}
                            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3"
                        >
                            <div className="flex flex-wrap justify-between items-center gap-3">
                                <div className="flex items-center gap-3">
                                    {admin?.profileImage ? (
                                        <img
                                            src={admin.profileImage}
                                            alt={admin.name}
                                            className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base border border-teal-200">
                                            {admin.name ? admin.name.charAt(0).toUpperCase() : <User size={20} />}
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 text-sm">{admin.name}</span>
                                            <Badge
                                                size="sm"
                                                variant={admin.role === 'admin' ? 'primary' : 'info'}
                                            >
                                                {admin.role}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">{admin.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        title="Edit Profile"
                                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                        onClick={() => handleEdit(index)}
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    <button
                                        title="Reset Password"
                                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                        onClick={() => {
                                            setpass({ ...pass, userid: admin._id });
                                            setpassmodal(true);
                                        }}
                                    >
                                        <KeyRound size={16} />
                                    </button>

                                    <button
                                        title="Delete Admin"
                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        onClick={() => handleDelete(admin._id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-2">
                                <button
                                    type="button"
                                    className="flex w-full justify-between items-center text-xs font-bold text-teal-800 bg-teal-50/60 hover:bg-teal-50 py-2 px-3 rounded-lg transition cursor-pointer"
                                    onClick={() => toggleExpand(index)}
                                >
                                    <span>{expandedIndex === index ? "Hide Role Permissions" : "View Assigned Permissions"}</span>
                                    {expandedIndex === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {expandedIndex === index && (
                                    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200/80">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
                                                <tr>
                                                    <th className="py-2 px-3">Module</th>
                                                    {Object.values(PERMISSION_LABELS).map((label) => (
                                                        <th key={label} className="py-2 px-3 text-center">
                                                            {label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {Object.entries(admin.permissions || {}).map(([module, levels]) => (
                                                    <tr key={module} className="hover:bg-slate-50/60">
                                                        <td className="py-2 px-3 font-semibold text-slate-800 capitalize">
                                                            {module.replace('_', ' ')}
                                                        </td>
                                                        {Object.keys(PERMISSION_LABELS).map((permKey) => (
                                                            <td key={permKey} className="py-2 px-3 text-center">
                                                                {levels.includes(Number(permKey)) ? (
                                                                    <span className="text-emerald-600 font-bold">✓</span>
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
                    ))}
                </div>
            )}

            {/* Add / Edit Admin Modal */}
            <Modal
                open={showForm}
                onClose={() => setShowForm(false)}
                title={editingIndex !== null ? "Edit Administrator" : "Add Administrator / Manager"}
                subtitle="Configure user credentials and granular feature permissions"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSave} className="space-y-4">
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
                                    className="w-full h-full rounded-full object-cover border-2 border-teal-200"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl border-2 border-dashed border-teal-300">
                                    {form.name ? form.name.charAt(0).toUpperCase() : <User size={28} />}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => inputref.current.click()}
                                className="absolute bottom-0 right-0 p-1.5 bg-teal-700 text-white rounded-full shadow hover:bg-teal-800 transition cursor-pointer"
                            >
                                <Edit2 size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            required
                            helperText="e.g. xyz@goodnature.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    {editingIndex === null && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Initial Password"
                                type="password"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />

                            <Select
                                label="Role Assignment"
                                options={[
                                    { label: 'Admin', value: 'admin' },
                                    { label: 'Manager', value: 'manager' }
                                ]}
                                value={form.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Add Module (Manager only) */}
                    {form.role === "manager" && (
                        <div className="flex items-end gap-2 pt-2">
                            <div className="flex-1">
                                <Select
                                    label="Add Custom Module Permission"
                                    placeholder="Select module to grant..."
                                    options={availableModulesToAdd.map(m => ({ label: m.replace('_', ' '), value: m }))}
                                    value={newModule}
                                    onChange={(e) => setNewModule(e.target.value)}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddModule}
                                disabled={!newModule}
                            >
                                Add Module
                            </Button>
                        </div>
                    )}

                    {/* Permissions Table */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">Granular Permissions</label>
                        <div className="overflow-x-auto rounded-xl border border-slate-200/80 max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-slate-50">
                                    <tr>
                                        <th className="py-2 px-3">Module</th>
                                        {Object.entries(PERMISSION_LABELS).map(([code, label]) => (
                                            <th key={code} className="py-2 px-3 text-center">{label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentModules.map((module) => (
                                        <tr key={module} className="hover:bg-slate-50/50">
                                            <td className="py-2 px-3 capitalize font-medium text-slate-800">
                                                {module.replace('_', ' ')}
                                            </td>
                                            {Object.keys(PERMISSION_LABELS).map((level) => (
                                                <td key={level} className="py-2 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300 cursor-pointer"
                                                        checked={form.permissions[module]?.includes(Number(level)) || false}
                                                        onChange={() => togglePermission(module, Number(level))}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

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
                            {editingIndex !== null ? "Update Admin" : "Create Admin"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Password Reset Modal */}
            <Modal
                open={passmodal}
                onClose={() => setpassmodal(false)}
                title="Reset Administrator Password"
                subtitle="Assign a new secure password for this user"
                maxWidth="max-w-md"
            >
                <form onSubmit={updatePassword} className="space-y-4">
                    <Input
                        label="New Password"
                        type="password"
                        required
                        minLength={3}
                        maxLength={20}
                        placeholder="Enter new password"
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
                            Reset Password
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
