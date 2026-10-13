import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Unlock,
    KeyRound,
    Building2,
    ShieldCheck,
    CheckSquare,
    Square,
    Eye,
    EyeOff,
    Edit2,
    Save,
    CheckCircle2,
    XCircle,
    Search,
    Sparkles,
    AlertCircle,
    HelpCircle,
    Landmark,
    ArrowDownLeft,
    ArrowUpRight,
    Globe,
    Ban,
    CreditCard
} from 'lucide-react';
import OrganizationLayout from '../OrganizationLayout';
import { useOrganization } from '../useOrganization';
import useImageUpload from '../../../../utils/imageresizer';
import { apiClient } from '../../../../utils/apiClient';
import { toast } from '../../../../utils/toast';
import { FirstFetch } from '../../../../../store/userSlice';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import PageLoader from '../../../../components/common/PageLoader';
import {
    PERMISSION_LABELS,
    MODULE_CATEGORIES,
    MODULE_DISPLAY_NAMES,
    ROLE_OPTIONS,
    AllPermissionNames,
    adminPermission,
    getRoleDisplayLabel,
    getPresetPermissions,
    managerPermission,
    accountantPermission,
    cashierPermission,
    hrPermission,
    salesPermission,
    auditorPermission
} from '../components/admin/userPermissionsConfig';

const AdminUserFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { profile } = useOrganization();
    const { branch: branchList } = useSelector((state) => state.user || {});

    const isEditMode = Boolean(id);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [moduleSearch, setModuleSearch] = useState('');
    const [activePermTab, setActivePermTab] = useState('all');
    const [newModule, setNewModule] = useState('');

    // Company Bank Accounts Master
    const [bankList, setBankList] = useState([]);
    const [bankListLoading, setBankListLoading] = useState(false);

    // Optional password change in Edit mode
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);

    const inputRef = useRef(null);
    const { handleImage } = useImageUpload();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        branchIds: [],
        isBlocked: false,
        profileImage: null,
        profilePreview: '',
        permissions: { ...adminPermission },
        bankPermissions: {
            accessScope: 'all', // 'all' | 'selected' | 'none'
            allowedBankIds: [],
            allowReceipts: true,
            allowPayments: true,
        },
    });

    // Check permission
    if (profile?.role && !['superadmin'].includes(profile.role)) {
        return (
            <OrganizationLayout>
                <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl max-w-xl mx-auto mt-10">
                    <p className="font-bold text-sm">Access Denied</p>
                    <p className="text-xs mt-1">You do not have administrative privileges to manage user accounts.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </OrganizationLayout>
        );
    }

    // Load registered company bank accounts
    useEffect(() => {
        const fetchBanks = async () => {
            setBankListLoading(true);
            try {
                const res = await apiClient({ url: 'ledger/banks' });
                const banks = res?.bankLedgers || res?.bankAccounts || res?.data?.bankAccounts || [];
                setBankList(banks);
            } catch (err) {
                console.error('Failed to load bank accounts:', err);
            } finally {
                setBankListLoading(false);
            }
        };
        fetchBanks();
    }, []);

    // Load admin data if edit mode
    useEffect(() => {
        if (!isEditMode) return;

        const fetchAdminDetails = async () => {
            setInitialLoading(true);
            try {
                let userRecord = null;

                // Try direct single-user endpoint
                try {
                    const res = await apiClient({ url: `getAdmin/${id}` });
                    if (res && res._id) {
                        userRecord = res;
                    }
                } catch {
                    // Fallback to getAdmin array
                }

                if (!userRecord) {
                    const allAdmins = await apiClient({ url: 'getAdmin' });
                    if (Array.isArray(allAdmins)) {
                        userRecord = allAdmins.find((a) => a._id === id);
                    }
                }

                if (!userRecord) {
                    toast.error('User account not found');
                    navigate('/dashboard/organization/users');
                    return;
                }

                const assignedBranchIds = (userRecord.branchIds || []).map((b) =>
                    typeof b === 'object' ? b._id : b
                );
                const fallbackPerms = getPresetPermissions(userRecord.role);

                const loadedBankPerms = userRecord.bankPermissions ? {
                    accessScope: userRecord.bankPermissions.accessScope || 'all',
                    allowedBankIds: (userRecord.bankPermissions.allowedBankIds || []).map((b) =>
                        typeof b === 'object' ? b._id : b
                    ),
                    allowReceipts: userRecord.bankPermissions.allowReceipts !== false,
                    allowPayments: userRecord.bankPermissions.allowPayments !== false,
                } : {
                    accessScope: 'all',
                    allowedBankIds: [],
                    allowReceipts: true,
                    allowPayments: true,
                };

                setForm({
                    name: userRecord.name || '',
                    email: userRecord.email || '',
                    password: '',
                    role: userRecord.role || 'admin',
                    branchIds: assignedBranchIds,
                    isBlocked: Boolean(userRecord.isBlocked),
                    profilePreview: userRecord.profileImage || '',
                    profileImage: null,
                    permissions: userRecord.permissions ? { ...userRecord.permissions } : fallbackPerms,
                    bankPermissions: loadedBankPerms,
                });
            } catch (err) {
                console.error('Failed to load user details:', err);
                toast.error('Failed to load user details');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchAdminDetails();
    }, [id, isEditMode, navigate]);

    // Profile photo upload
    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm((prev) => ({
            ...prev,
            profileImage: file,
            profilePreview: URL.createObjectURL(file),
        }));
    };

    // Role change
    const handleRoleChange = (role) => {
        const defaultPermissions = getPresetPermissions(role);
        setForm((prev) => ({
            ...prev,
            role,
            permissions: defaultPermissions,
        }));
        toast.info(`Permissions preset updated for ${getRoleDisplayLabel(role)}`, { autoClose: 1500 });
    };

    // Branches
    const allBranchesSelected =
        branchList &&
        branchList.length > 0 &&
        branchList.every((b) => form.branchIds?.includes(b._id));

    const toggleBranchSelection = (branchId) => {
        setForm((prev) => {
            const current = prev.branchIds || [];
            const exists = current.includes(branchId);
            return {
                ...prev,
                branchIds: exists
                    ? current.filter((bId) => bId !== branchId)
                    : [...current, branchId],
            };
        });
    };

    const handleSelectAllBranches = () => {
        if (!branchList || branchList.length === 0) return;
        setForm((prev) => ({
            ...prev,
            branchIds: branchList.map((b) => b._id),
        }));
    };

    const handleClearBranches = () => {
        setForm((prev) => ({
            ...prev,
            branchIds: [],
        }));
    };

    // Bank Permissions Helpers
    const handleBankScopeChange = (scope) => {
        setForm((prev) => ({
            ...prev,
            bankPermissions: {
                ...prev.bankPermissions,
                accessScope: scope,
                // If switching to selected for first time and empty, keep existing or pre-select all
                allowedBankIds: scope === 'selected' && (!prev.bankPermissions.allowedBankIds || prev.bankPermissions.allowedBankIds.length === 0)
                    ? bankList.map(b => b._id)
                    : prev.bankPermissions.allowedBankIds || [],
            },
        }));
    };

    const toggleAllowedBank = (bankId) => {
        setForm((prev) => {
            const current = prev.bankPermissions.allowedBankIds || [];
            const exists = current.includes(bankId);
            const updated = exists
                ? current.filter((id) => id !== bankId)
                : [...current, bankId];
            return {
                ...prev,
                bankPermissions: {
                    ...prev.bankPermissions,
                    allowedBankIds: updated,
                },
            };
        });
    };

    const handleSelectAllBanks = () => {
        setForm((prev) => ({
            ...prev,
            bankPermissions: {
                ...prev.bankPermissions,
                allowedBankIds: bankList.map((b) => b._id),
            },
        }));
    };

    const handleClearBanks = () => {
        setForm((prev) => ({
            ...prev,
            bankPermissions: {
                ...prev.bankPermissions,
                allowedBankIds: [],
            },
        }));
    };

    const toggleBankTransactionType = (field) => {
        setForm((prev) => ({
            ...prev,
            bankPermissions: {
                ...prev.bankPermissions,
                [field]: !prev.bankPermissions[field],
            },
        }));
    };

    // RBAC Presets
    const handleApplyPreset = (presetType) => {
        if (presetType === 'all') {
            const fullAccess = {};
            AllPermissionNames.forEach((mod) => {
                fullAccess[mod] = [1, 2, 3, 4];
            });
            setForm((prev) => ({ ...prev, permissions: fullAccess }));
            toast.success('Applied Full Access to all modules');
        } else if (presetType === 'manager') {
            setForm((prev) => ({ ...prev, permissions: { ...managerPermission } }));
            toast.info('Applied Manager permissions');
        } else if (presetType === 'accountant') {
            setForm((prev) => ({ ...prev, permissions: { ...accountantPermission } }));
            toast.info('Applied Accountant permissions');
        } else if (presetType === 'cashier') {
            setForm((prev) => ({ ...prev, permissions: { ...cashierPermission } }));
            toast.info('Applied Cashier permissions');
        } else if (presetType === 'hr') {
            setForm((prev) => ({ ...prev, permissions: { ...hrPermission } }));
            toast.info('Applied HR & Payroll permissions');
        } else if (presetType === 'sales') {
            setForm((prev) => ({ ...prev, permissions: { ...salesPermission } }));
            toast.info('Applied Sales Desk permissions');
        } else if (presetType === 'auditor') {
            setForm((prev) => ({ ...prev, permissions: { ...auditorPermission } }));
            toast.info('Applied Auditor permissions');
        } else if (presetType === 'readonly') {
            const readOnly = {};
            AllPermissionNames.forEach((mod) => {
                readOnly[mod] = [1];
            });
            setForm((prev) => ({ ...prev, permissions: readOnly }));
            toast.info('Applied Read-Only to all modules');
        } else if (presetType === 'clear') {
            const cleared = {};
            AllPermissionNames.forEach((mod) => {
                cleared[mod] = [];
            });
            setForm((prev) => ({ ...prev, permissions: cleared }));
            toast.warn('Cleared all permissions');
        }
    };

    // Toggle single permission
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

    // Custom Module addition
    const availableModulesToAdd = useMemo(() => {
        const existing = Object.keys(form.permissions || {});
        return AllPermissionNames.filter((m) => !existing.includes(m));
    }, [form.permissions]);

    const handleAddModule = () => {
        if (!newModule) return;
        setForm((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [newModule]: [],
            },
        }));
        setNewModule('');
        toast.success(`Module ${newModule} added to permissions matrix`);
    };

    // Filter modules by category and search keyword
    const visibleModules = useMemo(() => {
        const allKeys = Array.from(new Set([...AllPermissionNames, ...Object.keys(form.permissions || {})]));
        return allKeys.filter((module) => {
            if (activePermTab !== 'all') {
                const cat = MODULE_CATEGORIES.find((c) => c.id === activePermTab);
                if (cat && !cat.modules.includes(module)) return false;
            }
            if (moduleSearch.trim()) {
                const q = moduleSearch.toLowerCase();
                const displayName = (MODULE_DISPLAY_NAMES[module] || '').toLowerCase();
                if (!module.toLowerCase().includes(q) && !displayName.includes(q)) return false;
            }
            return true;
        });
    }, [form.permissions, activePermTab, moduleSearch]);

    // Handle Form Submit
    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (!form.name.trim()) {
            toast.error('Please enter full name');
            return;
        }
        if (!form.email.trim()) {
            toast.error('Please enter valid email address');
            return;
        }
        if (!isEditMode && !form.password) {
            toast.error('Please set an initial password');
            return;
        }

        const formData = new FormData();
        setSaving(true);

        try {
            const resizedFile = form.profileImage
                ? await handleImage(240, form.profileImage)
                : null;

            if (resizedFile) {
                formData.append('photo', resizedFile);
            }

            formData.append('name', form.name.trim());
            formData.append('email', form.email.trim());
            formData.append('role', form.role);
            if (!isEditMode && form.password) {
                formData.append('password', form.password);
            }
            formData.append('isBlocked', form.isBlocked ? 'true' : 'false');
            formData.append('branchIds', JSON.stringify(form.branchIds || []));
            formData.append('permissions', JSON.stringify(form.permissions || {}));
            formData.append('bankPermissions', JSON.stringify(form.bankPermissions || {}));

            const url = isEditMode ? `editAdmin/${id}` : 'addAdmin';

            const data = await apiClient({
                url,
                method: 'POST',
                body: formData,
            });

            toast.success(data.message || (isEditMode ? 'User updated successfully!' : 'User created successfully!'), {
                autoClose: 1500,
            });

            dispatch(FirstFetch());
            navigate('/dashboard/organization/users');
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(error.message || 'Failed to save user account');
        } finally {
            setSaving(false);
        }
    };

    // Quick password update for existing user
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!newPasswordValue.trim() || newPasswordValue.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setUpdatingPassword(true);
        try {
            const data = await apiClient({
                url: 'updatepassword',
                method: 'POST',
                body: {
                    userid: id,
                    pass: newPasswordValue,
                },
            });
            toast.success(data.message || 'Password updated successfully!');
            setNewPasswordValue('');
            setChangePasswordOpen(false);
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.message || 'Failed to update password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (initialLoading) {
        return (
            <OrganizationLayout>
                <div className="py-24">
                    <PageLoader message="Loading user account details..." />
                </div>
            </OrganizationLayout>
        );
    }

    const roleDisplayName = getRoleDisplayLabel(form.role);
    const bankScope = form.bankPermissions?.accessScope || 'all';
    const allowedBanks = form.bankPermissions?.allowedBankIds || [];
    const allBanksSelected = bankList.length > 0 && bankList.every((b) => allowedBanks.includes(b._id));

    return (
        <OrganizationLayout>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                {/* Header & Breadcrumb Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/organization/users')}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition shadow-xs cursor-pointer"
                            title="Back to User Management"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400">Organization / Users</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-xs font-bold text-teal-800">
                                    {isEditMode ? `Edit ${roleDisplayName}` : 'New User'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                                {isEditMode ? `Edit ${form.name || roleDisplayName}` : 'Create New System User'}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Configure credentials, branch operational scopes, bank financial authorities, and granular module permissions.
                            </p>
                        </div>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/dashboard/organization/users')}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleSave}
                            loading={saving}
                            className="flex items-center gap-1.5 shadow-xs"
                        >
                            <Save size={15} />
                            <span>{isEditMode ? 'Update Account' : 'Create Account'}</span>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* SECTION 1: Identity & Credentials Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm pb-3 border-b border-slate-100">
                            <User size={16} className="text-teal-700" />
                            <span>Account Identity & Credentials</span>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Profile Image Uploader */}
                            <div className="flex flex-col items-center gap-2 self-center md:self-start">
                                <div className="relative w-28 h-28">
                                    <input
                                        type="file"
                                        onChange={handleProfileImageChange}
                                        ref={inputRef}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    {form.profilePreview ? (
                                        <img
                                            src={form.profilePreview}
                                            alt={form.name}
                                            className="w-full h-full rounded-2xl object-cover border-2 border-teal-600 shadow-md"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-black text-3xl border-2 border-dashed border-teal-300 shadow-inner">
                                            {form.name ? form.name.charAt(0).toUpperCase() : <User size={40} />}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current && inputRef.current.click()}
                                        className="absolute -bottom-1.5 -right-1.5 p-2 bg-teal-800 text-white rounded-xl shadow-md hover:bg-teal-900 transition cursor-pointer"
                                        title="Upload profile picture"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400">Profile Photo</span>
                            </div>

                            {/* Details Fields */}
                            <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        required
                                        placeholder="e.g. John Doe"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />

                                    <Input
                                        label="Email Address (Login Username)"
                                        type="email"
                                        required
                                        placeholder="e.g. user@goodnature.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    <Select
                                        label="Role Assignment"
                                        options={ROLE_OPTIONS}
                                        value={form.role}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                    />

                                    {/* Account Status Toggle */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                                            Account Status
                                        </label>
                                        <div
                                            onClick={() => setForm({ ...form, isBlocked: !form.isBlocked })}
                                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                                                form.isBlocked
                                                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                                                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {form.isBlocked ? (
                                                    <XCircle size={16} className="text-rose-600" />
                                                ) : (
                                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                                )}
                                                <span className="text-xs font-bold">
                                                    {form.isBlocked ? 'Account Disabled (Login Blocked)' : 'Active (Login Permitted)'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-current shadow-2xs">
                                                {form.isBlocked ? 'Disabled' : 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Password: Create vs Edit Mode */}
                                {!isEditMode ? (
                                    <div className="relative max-w-md pt-1">
                                        <Input
                                            label="Initial Password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Enter secure initial password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-[29px] p-1 text-slate-400 hover:text-teal-700 transition cursor-pointer rounded"
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-2 border-t border-slate-100">
                                        {!changePasswordOpen ? (
                                            <button
                                                type="button"
                                                onClick={() => setChangePasswordOpen(true)}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
                                            >
                                                <KeyRound size={13} />
                                                <span>Need to reset or change password for this account?</span>
                                            </button>
                                        ) : (
                                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 max-w-md space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        <KeyRound size={13} className="text-teal-700" />
                                                        Reset Account Password
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setChangePasswordOpen(false);
                                                            setNewPasswordValue('');
                                                        }}
                                                        className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="password"
                                                        placeholder="Enter new password (min 6 chars)"
                                                        value={newPasswordValue}
                                                        onChange={(e) => setNewPasswordValue(e.target.value)}
                                                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={handleUpdatePassword}
                                                        loading={updatingPassword}
                                                    >
                                                        Update Password
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Assigned Operating Branch Scopes */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-teal-700" />
                                <span className="text-slate-800 font-bold text-sm">Assigned Operating Branch(es)</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold font-mono">
                                    {(form.branchIds || []).length} / {(branchList || []).length} selected
                                </span>
                            </div>

                            {branchList && branchList.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={allBranchesSelected ? handleClearBranches : handleSelectAllBranches}
                                        className="text-teal-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        {allBranchesSelected ? (
                                            <>
                                                <Square size={13} /> Clear All Branches
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare size={13} /> Select All Branches
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-500">
                            Select which branch offices this <span className="font-bold text-slate-700">{roleDisplayName}</span> has operational authority under. If no branches are selected and role is Administrator, authority spans all branches.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                            {branchList && branchList.length > 0 ? (
                                branchList.map((b) => {
                                    const isSelected = form.branchIds?.includes(b._id);
                                    return (
                                        <button
                                            type="button"
                                            key={b._id}
                                            onClick={() => toggleBranchSelection(b._id)}
                                            className={`flex items-center justify-between p-3 rounded-xl text-left border transition-all cursor-pointer select-none ${
                                                isSelected
                                                    ? 'bg-teal-50/70 border-teal-500 text-teal-950 font-bold shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="w-4 h-4 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 pointer-events-none"
                                                />
                                                <span className="text-xs truncate">{b.name}</span>
                                            </div>
                                            {b.branchCode && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 ml-2 shrink-0">
                                                    {b.branchCode}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="col-span-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                                    No branches configured in organization master.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: Bank Account & Financial Transaction Permissions */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Landmark size={17} className="text-teal-700" />
                                <span className="text-slate-800 font-bold text-sm">Financial & Corporate Bank Authority</span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                    bankScope === 'all'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : bankScope === 'selected'
                                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                    {bankScope === 'all' ? 'All Banks' : bankScope === 'selected' ? `${allowedBanks.length} Selected` : 'No Bank Access'}
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                                Controls bank visibility across Collections, Plot Receipts & Payment Vouchers
                            </span>
                        </div>

                        {/* Part A: Bank Scope Radio Options */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 tracking-wide block">
                                Corporate Bank Visibility & Access Scope
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Option 1: All Company Banks */}
                                <div
                                    onClick={() => handleBankScopeChange('all')}
                                    className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                        bankScope === 'all'
                                            ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Globe size={16} className={bankScope === 'all' ? 'text-teal-800' : 'text-slate-400'} />
                                            <span className="text-xs font-bold text-slate-900">All Company Banks</span>
                                        </div>
                                        <input
                                            type="radio"
                                            name="bankScope"
                                            checked={bankScope === 'all'}
                                            onChange={() => handleBankScopeChange('all')}
                                            className="accent-teal-700"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Full authority across all present & future corporate bank accounts.
                                    </p>
                                </div>

                                {/* Option 2: Selected Banks Only */}
                                <div
                                    onClick={() => handleBankScopeChange('selected')}
                                    className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                        bankScope === 'selected'
                                            ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Landmark size={16} className={bankScope === 'selected' ? 'text-teal-800' : 'text-slate-400'} />
                                            <span className="text-xs font-bold text-slate-900">Selected Banks Only</span>
                                        </div>
                                        <input
                                            type="radio"
                                            name="bankScope"
                                            checked={bankScope === 'selected'}
                                            onChange={() => handleBankScopeChange('selected')}
                                            className="accent-teal-700"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Restrict this user to specifically designated bank accounts only.
                                    </p>
                                </div>

                                {/* Option 3: No Bank Access */}
                                <div
                                    onClick={() => handleBankScopeChange('none')}
                                    className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                                        bankScope === 'none'
                                            ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Ban size={16} className={bankScope === 'none' ? 'text-rose-700' : 'text-slate-400'} />
                                            <span className="text-xs font-bold text-slate-900">No Bank Access</span>
                                        </div>
                                        <input
                                            type="radio"
                                            name="bankScope"
                                            checked={bankScope === 'none'}
                                            onChange={() => handleBankScopeChange('none')}
                                            className="accent-rose-600"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Cannot view or select any bank accounts (cash-only operator or non-financial).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Part B: Selected Bank Checklist (Only visible when scope is 'selected') */}
                        {bankScope === 'selected' && (
                            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-800">
                                            Designated Bank Accounts
                                        </label>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold">
                                            {allowedBanks.length} of {bankList.length} banks selected
                                        </span>
                                    </div>
                                    {bankList.length > 0 && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <button
                                                type="button"
                                                onClick={allBanksSelected ? handleClearBanks : handleSelectAllBanks}
                                                className="text-teal-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                            >
                                                {allBanksSelected ? (
                                                    <>
                                                        <Square size={13} /> Clear All
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckSquare size={13} /> Select All Banks
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {bankListLoading ? (
                                    <div className="py-4 text-center text-xs text-slate-400">Loading bank master...</div>
                                ) : bankList.length === 0 ? (
                                    <div className="py-4 text-center text-xs text-slate-400 italic">
                                        No bank accounts found in company master. Please add bank accounts in Ledger &gt; Bank Accounts first.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {bankList.map((b) => {
                                            const isChecked = allowedBanks.includes(b._id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={b._id}
                                                    onClick={() => toggleAllowedBank(b._id)}
                                                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                                        isChecked
                                                            ? 'bg-teal-50/90 border-teal-500 shadow-xs'
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                readOnly
                                                                className="w-4 h-4 accent-teal-700 text-teal-700 rounded focus:ring-teal-600 border-slate-300 pointer-events-none"
                                                            />
                                                            <div className="truncate">
                                                                <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                                                                    {b.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 font-medium">
                                                                    {b.bankName || 'Corporate Bank'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                                            {b.accountType || 'CURRENT'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 flex justify-between items-center">
                                                        <span>A/C: {b.accountNumber || '—'}</span>
                                                        {b.ifscCode && (
                                                            <span className="text-[10px] text-slate-400">IFSC: {b.ifscCode}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Part C: Financial Transaction Purpose Permissions */}
                        <div className="pt-2 border-t border-slate-100 space-y-2.5">
                            <label className="text-xs font-bold text-slate-700 tracking-wide block">
                                Financial Operations Authorization
                            </label>
                            <p className="text-[11px] text-slate-500">
                                Specify whether this user can select and use the authorized bank account(s) during receipt collections, payment vouchers, or both:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {/* Perm 1: Receipts & Customer Collections */}
                                <div
                                    onClick={() => toggleBankTransactionType('allowReceipts')}
                                    className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                                        form.bankPermissions?.allowReceipts
                                            ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                                            : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-80'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        form.bankPermissions?.allowReceipts
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        <ArrowDownLeft size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900">
                                                Allow in Receipts & Customer Collections
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(form.bankPermissions?.allowReceipts)}
                                                onChange={() => toggleBankTransactionType('allowReceipts')}
                                                className="w-4 h-4 accent-emerald-700 text-emerald-700 rounded cursor-pointer"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            User can select authorized bank accounts while collecting customer plot bookings, product payments, and installments.
                                        </p>
                                    </div>
                                </div>

                                {/* Perm 2: Payments & Vouchers */}
                                <div
                                    onClick={() => toggleBankTransactionType('allowPayments')}
                                    className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                                        form.bankPermissions?.allowPayments
                                            ? 'bg-amber-50/60 border-amber-400 shadow-2xs'
                                            : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-80'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        form.bankPermissions?.allowPayments
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900">
                                                Allow in Payments & Expense Vouchers
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(form.bankPermissions?.allowPayments)}
                                                onChange={() => toggleBankTransactionType('allowPayments')}
                                                className="w-4 h-4 accent-amber-700 text-amber-700 rounded cursor-pointer"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                            User can select authorized bank accounts while creating payment vouchers, reimbursing expenses, and disbursing funds.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: Granular Module Permissions (RBAC) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-teal-700" />
                                <span className="text-slate-800 font-bold text-sm">Granular Module Permissions (RBAC)</span>
                            </div>

                            {/* Quick Presets Toolbar */}
                            <div className="flex items-center gap-1.5 text-xs flex-wrap">
                                <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
                                    <Sparkles size={12} className="text-amber-500" /> Presets:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('all')}
                                    className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg font-bold border border-teal-200 hover:bg-teal-100 transition cursor-pointer text-xs"
                                >
                                    Full Access
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('manager')}
                                    className="px-2.5 py-1 bg-sky-50 text-sky-800 rounded-lg font-bold border border-sky-200 hover:bg-sky-100 transition cursor-pointer text-xs"
                                >
                                    Manager
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('accountant')}
                                    className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-bold border border-amber-200 hover:bg-amber-100 transition cursor-pointer text-xs"
                                >
                                    Accountant
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('cashier')}
                                    className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer text-xs"
                                >
                                    Cashier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('hr')}
                                    className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg font-bold border border-teal-200 hover:bg-teal-100 transition cursor-pointer text-xs"
                                >
                                    HR & Payroll
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('sales')}
                                    className="px-2.5 py-1 bg-violet-50 text-violet-800 rounded-lg font-bold border border-violet-200 hover:bg-violet-100 transition cursor-pointer text-xs"
                                >
                                    Sales Desk
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('auditor')}
                                    className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-lg font-bold border border-rose-200 hover:bg-rose-100 transition cursor-pointer text-xs"
                                >
                                    Auditor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('readonly')}
                                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200 hover:bg-slate-200 transition cursor-pointer text-xs"
                                >
                                    Read-Only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPreset('clear')}
                                    className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-bold border border-rose-200 hover:bg-rose-100 transition cursor-pointer text-xs"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Category Navigation Pills & Realtime Search Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                {MODULE_CATEGORIES.map((cat) => {
                                    const isActive = activePermTab === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setActivePermTab(cat.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                                                isActive
                                                    ? 'bg-teal-800 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search modules */}
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    value={moduleSearch}
                                    onChange={(e) => setModuleSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-700 transition"
                                />
                            </div>
                        </div>

                        {/* Add Custom Module Selector if any missing */}
                        {availableModulesToAdd.length > 0 && (
                            <div className="flex items-end gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                                <div className="flex-1">
                                    <Select
                                        label="Grant Additional Module to Matrix"
                                        placeholder="Select module to add to permissions list..."
                                        options={availableModulesToAdd.map((m) => ({
                                            label: MODULE_DISPLAY_NAMES[m] || m.replace(/_/g, ' ').toUpperCase(),
                                            value: m,
                                        }))}
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

                        {/* Permissions Matrix Full-Width Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner bg-white">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                                    <tr>
                                        <th className="py-3 px-4 min-w-[220px]">
                                            Module Name ({visibleModules.length})
                                        </th>
                                        {Object.entries(PERMISSION_LABELS).map(([code, label]) => {
                                            const numCode = Number(code);
                                            const allChecked =
                                                visibleModules.length > 0 &&
                                                visibleModules.every((m) =>
                                                    form.permissions[m]?.includes(numCode)
                                                );

                                            return (
                                                <th key={code} className="py-3 px-3 text-center min-w-[100px]">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span className="font-bold text-slate-800">{label}</span>
                                                        <button
                                                            type="button"
                                                            title={`Toggle ${label} for all visible modules`}
                                                            onClick={() => {
                                                                setForm((prev) => {
                                                                    const nextPerms = { ...prev.permissions };
                                                                    visibleModules.forEach((m) => {
                                                                        const existing = nextPerms[m] || [];
                                                                        if (allChecked) {
                                                                            nextPerms[m] = existing.filter((l) => l !== numCode);
                                                                        } else {
                                                                            if (!existing.includes(numCode)) {
                                                                                nextPerms[m] = [...existing, numCode].sort();
                                                                            }
                                                                        }
                                                                    });
                                                                    return { ...prev, permissions: nextPerms };
                                                                });
                                                            }}
                                                            className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition border cursor-pointer ${
                                                                allChecked
                                                                    ? 'bg-teal-800 text-white border-teal-800'
                                                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {allChecked ? 'All ON' : 'Toggle'}
                                                        </button>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {visibleModules.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-400">
                                                No modules found matching &ldquo;{moduleSearch}&rdquo;.
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleModules.map((module) => (
                                            <tr key={module} className="hover:bg-teal-50/30 transition-colors">
                                                <td className="py-3 px-4 font-semibold text-slate-800 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {MODULE_DISPLAY_NAMES[module] || module.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                                                            ({module})
                                                        </span>
                                                    </div>
                                                </td>
                                                {Object.keys(PERMISSION_LABELS).map((level) => {
                                                    const numLevel = Number(level);
                                                    const isGranted =
                                                        form.permissions[module]?.includes(numLevel) || false;
                                                    return (
                                                        <td key={level} className="py-3 px-3 text-center">
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-3 pt-3 pb-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/dashboard/organization/users')}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={saving}
                            className="flex items-center gap-1.5 shadow-md px-6 py-2"
                        >
                            <Save size={16} />
                            <span>{isEditMode ? 'Update Account' : 'Create Account'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </OrganizationLayout>
    );
};

export default AdminUserFormPage;
