import React, { useState } from "react";
import { Edit2, User, Building2, ShieldCheck, CheckSquare, Square, Eye, EyeOff } from "lucide-react";
import Modalbox from "@/components/custommodal/Modalbox";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { PERMISSION_LABELS, MODULE_CATEGORIES, MODULE_DISPLAY_NAMES, ROLE_OPTIONS, getRoleDisplayLabel } from "./userPermissionsConfig";

export default function UserFormModal({
    isOpen,
    onClose,
    editingIndex,
    form,
    setForm,
    branchList,
    isload,
    onSave,
    onRoleChange,
    onProfileImageChange,
    inputRef,
    onToggleBranch,
    onSelectAllBranches,
    onClearBranches,
    onApplyPreset,
    newModule,
    setNewModule,
    onAddModule,
    availableModulesToAdd,
    currentModules,
    activePermTab,
    setActivePermTab,
    onTogglePermission
}) {
    const [showPassword, setShowPassword] = useState(true);
    const roleDisplayName = getRoleDisplayLabel(form.role);
    const allBranchesSelected = branchList && branchList.length > 0 && branchList.every(b => form.branchIds?.includes(b._id));

    return (
        <Modalbox
            open={isOpen}
            onClose={onClose}
            title={editingIndex !== null ? `Edit ${roleDisplayName}` : `Create ${roleDisplayName} / Operator`}
            subtitle="Configure credentials, operational branch scopes, and granular RBAC permissions"
            maxWidth="max-w-2xl"
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isload}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="user-form-modal"
                        variant="primary"
                        loading={isload}
                    >
                        {editingIndex !== null ? "Update Account" : "Create Account"}
                    </Button>
                </>
            }
        >
            <form id="user-form-modal" onSubmit={onSave} className="space-y-4">
                {/* Profile Photo */}
                <div className="flex justify-center">
                    <div className="relative w-20 h-20">
                        <input
                            type="file"
                            onChange={onProfileImageChange}
                            ref={inputRef}
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
                            onClick={() => inputRef.current && inputRef.current.click()}
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
                        <div className="relative">
                            <Input
                                label="Initial Password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Enter secure password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-[27px] p-1 text-slate-400 hover:text-teal-700 transition cursor-pointer rounded"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
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
                        options={ROLE_OPTIONS}
                        value={form.role}
                        onChange={(e) => onRoleChange(e.target.value)}
                    />
                </div>

                {/* Assigned Branches Multi-Select with Dynamic Role Label */}
                <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                            <Building2 size={14} className="text-teal-700" />
                            Assigned Operating Branch(es)
                        </label>
                        {branchList && branchList.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                                <button
                                    type="button"
                                    onClick={allBranchesSelected ? onClearBranches : onSelectAllBranches}
                                    className="text-teal-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    {allBranchesSelected ? (
                                        <>
                                            <Square size={12} /> Clear All
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare size={12} /> Select All Branches
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                        Select which branch(es) this <span className="font-semibold text-slate-700">{roleDisplayName.toLowerCase()}</span> has operational authority under:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        {branchList && branchList.length > 0 ? (
                            branchList.map((b) => {
                                const isSelected = form.branchIds?.includes(b._id);
                                return (
                                    <button
                                        type="button"
                                        key={b._id}
                                        onClick={() => onToggleBranch(b._id)}
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
                        <div className="flex items-center gap-1 text-[11px] flex-wrap">
                            <span className="text-slate-400 font-medium mr-1">Presets:</span>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("all")}
                                className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-bold border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
                            >
                                Full Access
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("manager")}
                                className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-bold border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
                            >
                                Manager
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("accountant")}
                                className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                            >
                                Accountant
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("cashier")}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                            >
                                Cashier
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("hr")}
                                className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded font-bold border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
                            >
                                HR & Payroll
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("sales")}
                                className="px-2 py-0.5 bg-violet-50 text-violet-800 rounded font-bold border border-violet-200 hover:bg-violet-100 transition cursor-pointer"
                            >
                                Sales Desk
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("auditor")}
                                className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded font-bold border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                            >
                                Auditor
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("readonly")}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold border border-slate-200 hover:bg-slate-200 transition cursor-pointer"
                            >
                                Read-Only
                            </button>
                            <button
                                type="button"
                                onClick={() => onApplyPreset("clear")}
                                className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-bold border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Add Custom Module Selector */}
                    {form.role !== "admin" && availableModulesToAdd.length > 0 && (
                        <div className="flex items-end gap-2 pt-1">
                            <div className="flex-1">
                                <Select
                                    label="Grant Additional Module"
                                    placeholder="Select module to add to permissions list..."
                                    options={availableModulesToAdd.map(m => ({ label: MODULE_DISPLAY_NAMES[m] || m.replace(/_/g, ' ').toUpperCase(), value: m }))}
                                    value={newModule}
                                    onChange={(e) => setNewModule(e.target.value)}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onAddModule}
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
                                                <div className="flex items-center gap-1.5">
                                                    <span>{MODULE_DISPLAY_NAMES[module] || module.replace(/_/g, ' ')}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono font-normal">({module})</span>
                                                </div>
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
                                                            onChange={() => onTogglePermission(module, numLevel)}
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
            </form>
        </Modalbox>
    );
}
