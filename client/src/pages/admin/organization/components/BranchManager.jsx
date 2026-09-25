import React, { useState, useMemo } from 'react';
import DataTable from '@/components/common/DataTable';
import {
    Building2, MapPin, User, Edit2, Trash2, Plus,
    Search, LayoutGrid, List, Clock
} from 'lucide-react';
import Button from '@/components/ui/Button';

const getInitialBg = (name) => {
    const colors = [
        'bg-teal-700 text-white',
        'bg-emerald-700 text-white',
        'bg-sky-700 text-white',
        'bg-indigo-700 text-white',
        'bg-violet-700 text-white',
        'bg-amber-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const BranchManager = ({ branch, setopenviewmodal, handleEditBranch, handleDeleteBranch, styles }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [managerFilter, setManagerFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
    const [timingFilter, setTimingFilter] = useState('all'); // 'all' | 'custom' | 'default'
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('branchMgmt_viewMode') || 'grid'); // 'grid' | 'table'

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('branchMgmt_viewMode', mode);
        } catch (e) {
            console.error('Failed to save branch view mode:', e);
        }
    };


    // Filtered branches
    const filteredBranches = useMemo(() => {
        if (!branch || !Array.isArray(branch)) return [];

        return branch.filter((b) => {
            // Search text
            if (searchTerm.trim()) {
                const search = searchTerm.toLowerCase();
                const matchName = b.name?.toLowerCase().includes(search);
                const matchCode = b.branchCode?.toLowerCase().includes(search);
                const matchLocation = b.location?.toLowerCase().includes(search);
                const matchManager = (b.managerIds || []).some(m => m.name?.toLowerCase().includes(search));
                if (!matchName && !matchCode && !matchLocation && !matchManager) return false;
            }

            // Manager filter
            if (managerFilter === 'assigned' && (!b.managerIds || b.managerIds.length === 0)) return false;
            if (managerFilter === 'unassigned' && b.managerIds && b.managerIds.length > 0) return false;

            // Timing filter
            if (timingFilter === 'custom' && b.defaultsetting) return false;
            if (timingFilter === 'default' && !b.defaultsetting) return false;

            return true;
        });
    }, [branch, searchTerm, managerFilter, timingFilter]);

    const columns = [
        {
            name: "Branch Code",
            selector: row => row.branchCode,
            sortable: true,
            width: "140px",
            cell: row => (
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-xs shadow-xs">
                    {row.branchCode || '-'}
                </span>
            )
        },
        {
            name: "Name & Location",
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="py-1">
                    <span className="font-bold text-slate-800 text-xs block">{row.name}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400" />
                        {row.location || 'Location unassigned'}
                    </span>
                </div>
            )
        },
        {
            name: "Office Timings",
            cell: row => (
                <div>
                    {!row.defaultsetting && row.setting?.officeTime ? (
                        <span className="text-[10px] font-bold text-teal-900 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Clock size={11} className="text-teal-700" />
                            {row.setting.officeTime.in || '10:00'} - {row.setting.officeTime.out || '18:00'}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            Company Default
                        </span>
                    )}
                </div>
            )
        },
        {
            name: "Manager(s)",
            cell: row => (
                <div className="flex flex-col gap-1.5 py-1">
                    {row?.managerIds?.length > 0 ? (
                        row.managerIds.map((manager, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2"
                            >
                                {manager?.profileImage ? (
                                    <img
                                        src={manager.profileImage}
                                        alt={manager.name}
                                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${getInitialBg(manager?.name)}`}>
                                        {manager?.name ? manager.name.charAt(0).toUpperCase() : <User size={12} />}
                                    </div>
                                )}
                                <span className="text-xs text-slate-700 font-medium">{manager?.name}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-xs text-slate-400 italic">No manager assigned</span>
                    )}
                </div>
            )
        },
        {
            name: "Actions",
            width: "100px",
            cell: row => (
                <div className="flex gap-1.5 items-center">
                    <button
                        type="button"
                        className="text-slate-500 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 border border-slate-200 transition cursor-pointer"
                        title="Edit Branch"
                        onClick={() => handleEditBranch(row)}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        type="button"
                        className="text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                        title="Delete Branch"
                        onClick={() => handleDeleteBranch ? handleDeleteBranch(row) : handleEditBranch(row)}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="w-full space-y-6">

            {/* Toolbar & Search Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by branch name, code, city, or manager..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all text-slate-800"
                        />
                    </div>

                    {/* View Switcher and Add Branch Button */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("grid")}
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
                                onClick={() => handleViewModeChange("table")}
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

                        {/* Add Branch Button */}
                        <Button
                            variant="primary"
                            size="sm"
                            startIcon={Plus}
                            onClick={() => setopenviewmodal(true)}
                        >
                            Add Branch
                        </Button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 text-[11px] font-medium mr-1">Filter by:</span>

                    {/* Manager Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                        {["all", "assigned", "unassigned"].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setManagerFilter(m)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                    managerFilter === m
                                        ? "bg-teal-800 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {m === "all" ? "All Managers" : m === "assigned" ? "With Managers" : "No Managers"}
                            </button>
                        ))}
                    </div>

                    {/* Policy Override Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
                        {["all", "custom", "default"].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTimingFilter(t)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                                    timingFilter === t
                                        ? "bg-teal-800 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {t === "all" ? "All Timings" : t === "custom" ? "Custom Timings" : "Company Default"}
                            </button>
                        ))}
                    </div>

                    {(searchTerm || managerFilter !== "all" || timingFilter !== "all") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setManagerFilter("all");
                                setTimingFilter("all");
                            }}
                            className="text-[11px] text-teal-700 font-bold hover:underline ml-auto cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Content: Grid Cards vs Table View */}
            {filteredBranches.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-100">
                        <Building2 size={28} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">No Branches Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        {searchTerm || managerFilter !== "all" || timingFilter !== "all"
                            ? "No branches match your search or filter criteria."
                            : "Click '+ Add Branch' above to set up your primary office or secondary branches."}
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBranches.map((b, index) => {
                        const managers = b.managerIds || [];
                        return (
                            <div
                                key={b._id || index}
                                className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                            >
                                <div className="space-y-3">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg text-xs">
                                                    {b.branchCode || 'BR-LOC'}
                                                </span>
                                                <h3 className="font-bold text-slate-800 text-sm">{b.name}</h3>
                                            </div>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                                <MapPin size={12} className="text-slate-400" />
                                                {b.location || 'Location unspecified'}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleEditBranch(b)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                                                title="Edit Branch"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteBranch ? handleDeleteBranch(b) : handleEditBranch(b)}
                                                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                title="Delete Branch"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Office Timings Pill */}
                                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={13} className="text-teal-700" />
                                            <span className="text-slate-600 font-medium text-[11px]">Timings:</span>
                                        </div>
                                        {!b.defaultsetting && b.setting?.officeTime ? (
                                            <span className="text-[10px] font-bold text-teal-900 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-md">
                                                {b.setting.officeTime.in || '10:00'} - {b.setting.officeTime.out || '18:00'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                                Company Default
                                            </span>
                                        )}
                                    </div>

                                    {/* Assigned Managers */}
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                            Assigned Managers ({managers.length})
                                        </span>
                                        {managers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {managers.map((m, mIdx) => (
                                                    <div
                                                        key={mIdx}
                                                        className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl text-xs"
                                                    >
                                                        {m?.profileImage ? (
                                                            <img
                                                                src={m.profileImage}
                                                                alt={m.name}
                                                                className="w-4.5 h-4.5 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px] ${getInitialBg(m?.name)}`}>
                                                                {m?.name?.charAt(0)?.toUpperCase() || 'M'}
                                                            </div>
                                                        )}
                                                        <span className="text-slate-700 font-semibold text-[11px]">{m?.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic block">
                                                No manager currently assigned to this branch.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Data Table View */
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <DataTable
                        customStyles={styles}
                        columns={columns}
                        data={filteredBranches}
                        pagination
                        highlightOnHover
                    />
                </div>
            )}
        </div>
    );
};

export default BranchManager;
