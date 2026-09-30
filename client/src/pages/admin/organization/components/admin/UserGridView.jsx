import React from "react";
import {
    Edit2, Trash2, ChevronUp, ChevronDown, KeyRound, User,
    Building2, CheckCircle2, XCircle, Shield,
    Lock, Unlock, Mail, Copy, Check
} from "lucide-react";
import { PERMISSION_LABELS, getRoleBadgeStyle, getRoleDisplayLabel, AllPermissionNames, MODULE_DISPLAY_NAMES } from "./userPermissionsConfig";

export default function UserGridView({
    admins,
    expandedIndex,
    onToggleExpand,
    onToggleStatus,
    onEdit,
    onResetPassword,
    onDelete,
    copiedEmail,
    onCopyEmail,
    canUpdate = true,
    canDelete = true,
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {admins.map((admin, index) => {
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
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(admin.role)}`}>
                                                {getRoleDisplayLabel(admin.role)}
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
                                                onClick={() => onCopyEmail(admin.email)}
                                                className="text-slate-400 hover:text-teal-700 p-0.5 rounded transition cursor-pointer"
                                                title="Copy email"
                                            >
                                                {copiedEmail === admin.email ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                {(canUpdate || canDelete) && (
                                    <div className="flex items-center gap-1">
                                        {canUpdate && (
                                            <button
                                                type="button"
                                                title={admin.isBlocked ? "Activate Account" : "Disable / Revoke Access"}
                                                onClick={() => onToggleStatus(admin)}
                                                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                                    admin.isBlocked
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                }`}
                                            >
                                                {admin.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                                            </button>
                                        )}

                                        {canUpdate && (
                                            <button
                                                type="button"
                                                title="Edit Account & Permissions"
                                                onClick={() => onEdit(index)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 hover:border-teal-200 transition cursor-pointer"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        )}

                                        {canUpdate && (
                                            <button
                                                type="button"
                                                title="Reset Password"
                                                onClick={() => onResetPassword(admin)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer"
                                            >
                                                <KeyRound size={14} />
                                            </button>
                                        )}

                                        {canDelete && (
                                            <button
                                                type="button"
                                                title="Delete User"
                                                onClick={() => onDelete(admin._id)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
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
                                onClick={() => onToggleExpand(index)}
                                className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 text-teal-900 text-xs font-bold transition cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Shield size={13} className="text-teal-700" />
                                    {expandedIndex === index ? "Collapse Permission Matrix" : "View Granular RBAC Permissions"}
                                </span>
                                {expandedIndex === index ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>

                            {expandedIndex === index && (
                                <div className="mt-2.5 overflow-x-auto rounded-xl border border-slate-200 max-h-64 overflow-y-auto shadow-inner">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-slate-100 z-10">
                                            <tr>
                                                <th className="py-2.5 px-3">Module</th>
                                                {Object.values(PERMISSION_LABELS).map((label) => (
                                                    <th key={label} className="py-2 px-2 text-center">
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {AllPermissionNames.map((module) => {
                                                const levels = admin.permissions?.[module] || [];
                                                return (
                                                    <tr key={module} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-2 px-3 font-semibold text-slate-800 text-[11px]">
                                                            <span>{MODULE_DISPLAY_NAMES[module] || module.replace(/_/g, ' ')}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono font-normal ml-1">({module})</span>
                                                        </td>
                                                        {Object.keys(PERMISSION_LABELS).map((permKey) => (
                                                            <td key={permKey} className="py-2 px-2 text-center">
                                                                {levels.includes(Number(permKey)) ? (
                                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200">
                                                                        ✓
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-300">-</span>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
