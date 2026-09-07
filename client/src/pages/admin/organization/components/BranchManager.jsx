import React from 'react';
import DataTable from '@/components/common/DataTable';
import { User, Edit2, Trash2, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

const getInitialBg = (name) => {
    const colors = [
        'bg-teal-600', 'bg-emerald-600', 'bg-sky-600',
        'bg-indigo-600', 'bg-violet-600', 'bg-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const BranchManager = ({ branch, setopenviewmodal, handleEditBranch, styles }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <Button
                    variant="primary"
                    size="sm"
                    startIcon={Plus}
                    onClick={() => setopenviewmodal(true)}
                >
                    Add Branch
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                <DataTable
                    customStyles={styles}
                    columns={[
                        {
                            name: "Name",
                            selector: row => row.name,
                            sortable: true,
                            cell: row => <span className="font-bold text-slate-800 text-xs">{row.name}</span>
                        },
                        {
                            name: "Location",
                            selector: row => row.location,
                            sortable: true,
                            cell: row => <span className="text-slate-600 text-xs">{row.location || '-'}</span>
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
                                                        className="w-6 h-6 rounded-full object-cover"
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
                                <div className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        className="text-teal-700 hover:text-teal-800 p-1 rounded hover:bg-teal-50 transition cursor-pointer"
                                        title="Edit Branch"
                                        onClick={() => handleEditBranch(row)}
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                                        title="Delete Branch"
                                        onClick={() => handleEditBranch(row)}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            )
                        },
                    ]}
                    data={branch || []}
                    pagination
                    highlightOnHover
                />
            </div>
        </div>
    );
};

export default BranchManager;
