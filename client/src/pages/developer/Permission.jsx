import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../utils/apiClient";
import {
    ChevronUp,
    ChevronDown,
    Trash2,
    Edit2,
    Plus,
    Layers,
    ShieldCheck,
    Check,
    Search,
    RefreshCw,
    Save
} from "lucide-react";
import Modalbox from "../../components/custommodal/Modalbox";
import { toast } from "../../utils/toast";
import Button from "../../components/ui/Button";

const PERMISSION_LABELS = {
    1: "Read",
    2: "Create",
    3: "Update",
    4: "Delete",
};

const Permission = () => {
    const [permission, setPermission] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingPerms, setSavingPerms] = useState(false);
    const [savingModules, setSavingModules] = useState(false);
    const [passmodal, setPassmodal] = useState(false);
    const [openSection, setOpenSection] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [form, setForm] = useState({
        roleid: "",
        modules: {},
    });

    const [moduleToAdd, setModuleToAdd] = useState("");
    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [dirSearch, setDirSearch] = useState("");
    const [modalSearch, setModalSearch] = useState("");

    const AllPermissionNames = modules;

    const fetche = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient({
                url: "permission"
            });
            setPermission(data?.permission || []);
            setModules(data.permissionnames?.AllPermissionNames || []);
        } catch (error) {
            toast.error(error.message || "Error fetching permissions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetche();
    }, [fetche]);

    const toggleSection = (section) => {
        setOpenSection((prev) => (prev === section ? null : section));
    };

    const edite = (per) => {
        setSelectedRole(per);
        const sanitized = Object.fromEntries(
            Object.entries(per.modules || {}).filter(([m]) =>
                AllPermissionNames?.includes(m)
            )
        );
        setForm({
            roleid: per._id,
            modules: { ...sanitized },
        });
        setModalSearch("");
        setModuleToAdd("");
        setPassmodal(true);
    };

    const togglePermission = (module, level) => {
        setForm((prev) => {
            const currentLevels = prev.modules[module] || [];
            const exists = currentLevels.includes(level);
            const newLevels = exists
                ? currentLevels.filter((l) => l !== level)
                : [...currentLevels, level].sort();

            return {
                ...prev,
                modules: {
                    ...prev.modules,
                    [module]: newLevels,
                },
            };
        });
    };

    const availableModules = AllPermissionNames?.filter(
        (m) => !Object.prototype.hasOwnProperty.call(form.modules, m)
    );

    const addModule = () => {
        if (!moduleToAdd) {
            toast.warn("Please select a module to add");
            return;
        }
        if (!AllPermissionNames?.includes(moduleToAdd)) {
            toast.warn("Invalid module (not allowed)");
            return;
        }
        if (form.modules[moduleToAdd]) {
            toast.warn("Module already exists");
            return;
        }
        setForm((prev) => ({
            ...prev,
            modules: {
                ...prev.modules,
                [moduleToAdd]: [],
            },
        }));
        setModuleToAdd("");
    };

    const removeModule = (module) => {
        const updated = { ...form.modules };
        delete updated[module];
        setForm((prev) => ({ ...prev, modules: updated }));
    };

    const saveedit = async () => {
        setSavingPerms(true);
        try {
            const cleanedModules = Object.fromEntries(
                Object.entries(form.modules)
                    .filter(
                        ([m, levels]) => AllPermissionNames?.includes(m) && levels.length > 0
                    )
                    .map(([m, levels]) => [m, [...new Set(levels)].sort()])
            );

            const result = await apiClient({
                url: `permission/${form.roleid}`,
                method: "PUT",
                body: { modules: cleanedModules }
            });
            toast.success(result.message || "Updated successfully", {
                autoClose: 2000,
            });
            setPassmodal(false);
            setSelectedRole(null);
            fetche();
        } catch (error) {
            toast.error(error.message || "Error saving permission");
        } finally {
            setSavingPerms(false);
        }
    };

    const cancel = () => {
        setPassmodal(false);
        setSelectedRole(null);
        setModalSearch("");
    };

    const addModulee = () => {
        const trimmed = newModule.trim();
        if (!trimmed) return;
        if (modules.includes(trimmed)) return toast.warn("Already exists!");
        setModules([...modules, trimmed]);
        setNewModule("");
    };

    const deleteModule = (index) => {
        const updated = [...modules];
        updated.splice(index, 1);
        setModules(updated);
    };

    const saveEdit = (index) => {
        const trimmed = editValue.trim();
        if (!trimmed) return;
        const updated = [...modules];
        updated[index] = trimmed;
        setModules(updated);
        setEditingIndex(null);
        setEditValue("");
    };

    const saveModule = async () => {
        setSavingModules(true);
        try {
            const result = await apiClient({
                url: "saveModule",
                method: "PUT",
                body: { modules }
            });
            toast.success(result.message || "Updated successfully", {
                autoClose: 2000,
            });
            fetche();
        } catch (error) {
            toast.error(error.message || "Error saving module");
        } finally {
            setSavingModules(false);
        }
    };

    const filteredDirectoryModules = modules
        ?.map((mod, originalIdx) => ({ mod, originalIdx }))
        .filter(({ mod }) => !dirSearch.trim() || mod.toLowerCase().includes(dirSearch.trim().toLowerCase()));

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                        Role Permissions &amp; Module Directory
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage system permission modules and default CRUD access templates for each role.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                        {modules.length} Modules
                    </span>
                    <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                        {permission.length} Roles
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw size={13} />}
                        onClick={fetche}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Permission Modules Directory Accordion */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                    type="button"
                    className="w-full flex justify-between items-center px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
                    onClick={() => toggleSection("module")}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80">
                            <Layers size={16} />
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-slate-800 block">
                                Permission Modules Directory
                            </span>
                            <span className="text-[11px] text-slate-500">
                                Master list of resource keys available across role templates
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-[11px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                            {modules.length} items
                        </span>
                        {openSection === "module" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </button>

                {openSection === "module" && (
                    <div className="p-4 space-y-4 border-t border-slate-200 bg-white">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex flex-wrap gap-2 items-center">
                                <input
                                    placeholder="New module key (e.g. holiday)"
                                    value={newModule}
                                    onChange={(e) => setNewModule(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addModulee()}
                                    className="h-9 w-56 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                                />
                                <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addModulee}>
                                    Add
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<Save size={14} />}
                                    loading={savingModules}
                                    onClick={saveModule}
                                >
                                    Save Directory
                                </Button>
                            </div>

                            <div className="relative w-full sm:w-56">
                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Filter modules..."
                                    value={dirSearch}
                                    onChange={(e) => setDirSearch(e.target.value)}
                                    className="h-9 w-full pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-80 rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">Module Name</th>
                                        <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px] text-center w-28">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDirectoryModules.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="py-8 text-center text-slate-400 text-xs">
                                                No modules match your filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDirectoryModules.map(({ mod, originalIdx: i }) => (
                                            <tr key={`${mod}-${i}`} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-3.5 py-2.5 font-medium text-slate-800">
                                                    {editingIndex === i ? (
                                                        <input
                                                            className="h-8 px-2.5 rounded-lg border border-teal-500 text-xs font-medium outline-none w-60"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === "Enter" && saveEdit(i)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-xs text-slate-700">{mod}</span>
                                                    )}
                                                </td>
                                                <td className="px-3.5 py-2.5 text-center">
                                                    {editingIndex === i ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => saveEdit(i)}
                                                            className="px-2.5 py-1 bg-teal-700 text-white font-semibold text-xs rounded-md hover:bg-teal-800 cursor-pointer transition"
                                                        >
                                                            Save
                                                        </button>
                                                    ) : (
                                                        <div className="flex justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                title="Rename module"
                                                                className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-1 rounded-md cursor-pointer transition-colors"
                                                                onClick={() => { setEditingIndex(i); setEditValue(mod); }}
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Remove module"
                                                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md cursor-pointer transition-colors"
                                                                onClick={() => deleteModule(i)}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Role Templates List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-14 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                    ))}
                </div>
            ) : permission.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-xs">
                    No role permission templates found.
                </div>
            ) : (
                <div className="space-y-3">
                    {permission.map((per) => {
                        const moduleEntries = Object.entries(per.modules || {});
                        const isExpanded = openSection === per.role;
                        return (
                            <div key={per._id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                                <div
                                    className="flex justify-between items-center px-4 py-3.5 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer"
                                    onClick={() => toggleSection(per.role)}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-800 capitalize block">
                                                {per.role} Role Permissions
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                {moduleEntries.length} configured module{moduleEntries.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            icon={<Edit2 size={13} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                edite(per);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <span className="text-slate-400 p-1">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/30">
                                        {moduleEntries.length === 0 ? (
                                            <p className="text-xs text-slate-500 py-4 text-center">
                                                No modules assigned to this role yet.
                                            </p>
                                        ) : (
                                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                                <table className="w-full text-xs text-left border-collapse">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">Module</th>
                                                            {Object.values(PERMISSION_LABELS).map((label) => (
                                                                <th key={label} className="px-3.5 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px] text-center">
                                                                    {label}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {moduleEntries.map(([module, levels]) => (
                                                            <tr key={module} className="hover:bg-slate-50/70 transition-colors">
                                                                <td className="px-3.5 py-2.5 font-medium capitalize text-slate-800">
                                                                    {module.replace(/_/g, " ")}
                                                                </td>
                                                                {Object.keys(PERMISSION_LABELS).map((permKey) => {
                                                                    const granted = levels.includes(Number(permKey));
                                                                    return (
                                                                        <td key={permKey} className="px-3.5 py-2.5 text-center">
                                                                            {granted ? (
                                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                                    <Check size={13} strokeWidth={2.5} />
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-300 font-medium">—</span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal - Edit Role Permissions */}
            <Modalbox
                open={passmodal}
                onClose={cancel}
                title={`Edit Permission — ${selectedRole?.role || ""}`}
                subtitle="Toggle Read, Create, Update, and Delete access per module"
                maxWidth="max-w-2xl"
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
                        <Button variant="primary" size="sm" loading={savingPerms} onClick={saveedit}>Save Permissions</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                            <select
                                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                                value={moduleToAdd}
                                onChange={(e) => setModuleToAdd(e.target.value)}
                            >
                                <option value="">Select Module to Add</option>
                                {availableModules?.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <Button variant="secondary" size="sm" onClick={addModule} disabled={!moduleToAdd}>
                                + Add Module
                            </Button>
                        </div>

                        <div className="relative w-full sm:w-48">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={modalSearch}
                                onChange={(e) => setModalSearch(e.target.value)}
                                className="h-9 w-full pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">Module</th>
                                    {Object.entries(PERMISSION_LABELS).map(([code, label]) => (
                                        <th key={code} className="px-3 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px] text-center">
                                            {label}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2.5 font-semibold text-slate-600 uppercase tracking-wider text-[11px] text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.keys(form.modules || {})
                                    .filter((m) => !modalSearch.trim() || m.toLowerCase().includes(modalSearch.trim().toLowerCase()))
                                    .sort(
                                        (a, b) =>
                                            AllPermissionNames?.indexOf(a) - AllPermissionNames?.indexOf(b)
                                    )
                                    .map((module) => {
                                        const levels = form.modules[module] || [];
                                        return (
                                            <tr key={module} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-3 py-2.5 capitalize font-medium text-slate-800">
                                                    {module.replace(/_/g, " ")}
                                                </td>
                                                {Object.keys(PERMISSION_LABELS).map((level) => (
                                                    <td key={level} className="px-3 py-2.5 text-center">
                                                        <input
                                                            className="w-4 h-4 accent-teal-700 rounded border-slate-300 cursor-pointer"
                                                            type="checkbox"
                                                            checked={levels.includes(Number(level))}
                                                            onChange={() => togglePermission(module, Number(level))}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md cursor-pointer transition-colors"
                                                        onClick={() => removeModule(module)}
                                                        title="Remove module"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modalbox>
        </div>
    );
};

export default Permission;
