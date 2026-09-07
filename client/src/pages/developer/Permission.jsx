import React, { useEffect, useState } from "react";
import { apiClient } from "../../utils/apiClient";
import { ChevronUp, ChevronDown, Trash2, Edit2, Plus } from "lucide-react";
import Modalbox from "../../components/custommodal/Modalbox";
import { toast } from "../../utils/toast";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const Permission = () => {
    const [permission, setPermission] = useState([]);
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
    
    const AllPermissionNames = modules;

    const PERMISSION_LABELS = {
        1: "Read", 2: "Create", 3: "Update", 4: "Delete",
    };

    const fetche = async () => {
        try {
            const data = await apiClient({
                url: "permission"
            });
            setPermission(data?.permission || []);
            setModules(data.permissionnames?.AllPermissionNames || []);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    useEffect(() => {
        fetche();
    }, []);

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
            console.error('Error saving permission:', error);
        }
    };

    const cancel = () => {
        setPassmodal(false);
        setSelectedRole(null);
    };

    const addModulee = () => {
        if (!newModule.trim()) return;
        if (modules.includes(newModule.trim())) return toast.warn("Already exists!");
        setModules([...modules, newModule.trim()]);
        setNewModule("");
    };

    const deleteModule = (index) => {
        const updated = [...modules];
        updated.splice(index, 1);
        setModules(updated);
    };

    const saveEdit = (index) => {
        if (!editValue.trim()) return;
        const updated = [...modules];
        updated[index] = editValue.trim();
        setModules(updated);
        setEditingIndex(null);
        setEditValue("");
    };

    const saveModule = async () => {
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
            console.error('Error saving module:', error);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
            {/* Permission Modules accordion */}
            <div className="border border-amber-300 bg-amber-50/50 rounded-2xl overflow-hidden shadow-xs">
                <button
                    type="button"
                    className="w-full flex justify-between items-center px-4 py-3 bg-amber-500 text-white font-bold text-xs tracking-wider cursor-pointer"
                    onClick={() => toggleSection('module')}
                >
                    <span>PERMISSION MODULES DIRECTORY</span>
                    {openSection === 'module' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {openSection === 'module' && (
                    <div className="p-4 space-y-4 bg-white">
                        <div className="flex flex-wrap gap-2 items-center">
                            <input
                                placeholder="New Module Name"
                                value={newModule}
                                onChange={(e) => setNewModule(e.target.value)}
                                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
                            />
                            <Button variant="secondary" onClick={addModulee}>
                                <Plus size={16} /> Add
                            </Button>
                            <Button variant="primary" onClick={saveModule}>
                                Save Directory
                            </Button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-3 font-bold text-slate-700">Module Name</th>
                                        <th className="p-3 font-bold text-slate-700 text-center w-28">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {modules?.map((mod, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 capitalize font-semibold text-slate-800">
                                                {editingIndex === i ? (
                                                    <input
                                                        className="h-8 px-2 rounded-lg border border-slate-200 text-xs font-medium outline-none"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                    />
                                                ) : (
                                                    mod
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {editingIndex === i ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => saveEdit(i)}
                                                        className="px-2.5 py-1 bg-teal-700 text-white font-bold text-xs rounded-lg hover:bg-teal-800 cursor-pointer"
                                                    >
                                                        Save
                                                    </button>
                                                ) : (
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            className="text-teal-600 hover:text-teal-800 p-1 cursor-pointer"
                                                            onClick={() => { setEditingIndex(i); setEditValue(mod); }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                                            onClick={() => deleteModule(i)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Role List */}
            <div className="space-y-3">
                {permission?.map((per) => (
                    <div key={per._id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                        <div
                            className="flex justify-between items-center px-4 py-3 bg-slate-800 text-white font-bold text-xs tracking-wider cursor-pointer capitalize"
                            onClick={() => toggleSection(per.role)}
                        >
                            <span>{per.role} Role Permissions</span>
                            {openSection === per.role ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>

                        {openSection === per.role && (
                            <div className="p-4 space-y-3">
                                <div className="flex justify-end">
                                    <Button variant="primary" onClick={() => edite(per)}>
                                        <Edit2 size={14} /> Edit Permissions
                                    </Button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-2.5 font-bold text-slate-700">Module</th>
                                                {Object.values(PERMISSION_LABELS).map((label) => (
                                                    <th key={label} className="p-2.5 font-bold text-slate-700 text-center">
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {Object.entries(per.modules || {}).map(([module, levels]) => (
                                                <tr key={module} className="hover:bg-slate-50">
                                                    <td className="p-2.5 font-semibold capitalize text-slate-800">
                                                        {module}
                                                    </td>
                                                    {Object.keys(PERMISSION_LABELS).map((permKey) => (
                                                        <td key={permKey} className="p-2.5 text-center">
                                                            {levels.includes(Number(permKey)) ? "✅" : "—"}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal - Edit Role Permissions */}
            <Modalbox open={passmodal} onClose={cancel}>
                <div className="w-[680px] max-w-[92vw] p-6 bg-white rounded-2xl space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-800">Edit Permission — {selectedRole?.role}</h2>
                        <button type="button" onClick={cancel} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <select
                            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
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
                        <Button variant="secondary" onClick={addModule} disabled={!moduleToAdd}>
                            + Add Module
                        </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                <tr>
                                    <th className="p-2.5 font-bold text-slate-700">Module</th>
                                    {Object.entries(PERMISSION_LABELS).map(([code, label]) => (
                                        <th key={code} className="p-2.5 font-bold text-slate-700 text-center">
                                            {label}
                                        </th>
                                    ))}
                                    <th className="p-2.5 font-bold text-slate-700 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.keys(form.modules || {})
                                    .sort(
                                        (a, b) =>
                                            AllPermissionNames?.indexOf(a) - AllPermissionNames?.indexOf(b)
                                    )
                                    .map((module) => {
                                        const levels = form.modules[module] || [];
                                        return (
                                            <tr key={module} className="hover:bg-slate-50">
                                                <td className="p-2.5 capitalize font-semibold text-slate-800">{module}</td>
                                                {Object.keys(PERMISSION_LABELS).map((level) => (
                                                    <td key={level} className="p-2.5 text-center">
                                                        <input
                                                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                                                            type="checkbox"
                                                            checked={levels.includes(Number(level))}
                                                            onChange={() => togglePermission(module, Number(level))}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                                        onClick={() => removeModule(module)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button variant="secondary" onClick={cancel}>Cancel</Button>
                        <Button variant="primary" onClick={saveedit}>Save Permissions</Button>
                    </div>
                </div>
            </Modalbox>
        </div>
    );
};

export default Permission;
