import React from "react";
import {
    Edit2, Trash2, KeyRound, User,
    CheckCircle2, XCircle,
    Lock, Unlock
} from "lucide-react";
import { getRoleBadgeStyle, getRoleDisplayLabel } from "./userPermissionsConfig";

export default function UserTableView({
    admins,
    onToggleStatus,
    onEdit,
    onResetPassword,
    onDelete,
    canUpdate = true,
    canDelete = true,
}) {
    return (
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
                            {(canUpdate || canDelete) && (
                                <th className="p-3.5 text-right min-w-[140px]">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        {admins.map((admin, index) => {
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
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(admin.role)}`}>
                                            {getRoleDisplayLabel(admin.role)}
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
                                    {(canUpdate || canDelete) && (
                                        <td className="p-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        title={admin.isBlocked ? "Activate Account" : "Disable Account"}
                                                        onClick={() => onToggleStatus(admin)}
                                                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
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
                                                        title="Edit Account"
                                                        onClick={() => onEdit(index)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        title="Reset Password"
                                                        onClick={() => onResetPassword(admin)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                                                    >
                                                        <KeyRound size={14} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        title="Delete User"
                                                        onClick={() => onDelete(admin._id)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
