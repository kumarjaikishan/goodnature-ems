import React from "react";
import { Search, LayoutGrid, List, Plus } from "lucide-react";
import Button from "@/components/ui/Button";

const ROLE_FILTERS = [
    { key: "all", label: "All Roles" },
    { key: "admin", label: "Admins" },
    { key: "manager", label: "Managers" },
    { key: "accountant", label: "Accountants" },
    { key: "cashier", label: "Cashiers" },
    { key: "hr", label: "HR" },
    { key: "sales", label: "Sales" },
    { key: "operator", label: "Operators" },
];

export default function UserFilterBar({
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    branchList,
    viewMode,
    onViewModeChange,
    canCreate = true,
    onAddUser,
    onResetFilters,
    hasActiveFilters
}) {
    return (
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
                            onClick={() => onViewModeChange("grid")}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
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
                            onClick={() => onViewModeChange("table")}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                viewMode === "table"
                                    ? "bg-white text-teal-800 shadow-xs font-bold"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                            title="Table View"
                        >
                            <List size={15} />
                        </button>
                    </div>

                    {/* Add User Button */}
                    {canCreate && (
                        <Button
                            variant="primary"
                            size="sm"
                            startIcon={Plus}
                            onClick={onAddUser}
                        >
                            Add System User / Operator
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Filter by:</span>

                {/* Role Filter */}
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80 flex-wrap">
                    {ROLE_FILTERS.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setRoleFilter(r.key)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                roleFilter === r.key
                                    ? "bg-teal-800 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {r.label}
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

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-[11px] text-teal-700 font-bold hover:underline ml-auto cursor-pointer"
                    >
                        Reset Filters
                    </button>
                )}
            </div>
        </div>
    );
}
