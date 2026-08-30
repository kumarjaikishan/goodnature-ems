import React from 'react';
import { Button, Avatar } from '@mui/material';
import DataTable from '@/components/common/DataTable';
import { User, Edit2, Trash2 } from 'lucide-react';

const BranchManager = ({ branch, setopenviewmodal, handleEditBranch, styles }) => {
    return (
        <div className="space-y-1">
            <div className="flex justify-end items-center">
                <Button
                    variant="contained"
                    onClick={() => setopenviewmodal(true)}
                >
                    + Add Branch
                </Button>
            </div>

            <DataTable
                customStyles={styles}
                columns={[
                    {
                        name: "Name",
                        selector: row => row.name,
                        sortable: true
                    },
                    {
                        name: "Location",
                        selector: row => row.location,
                        sortable: true
                    },
                    {
                        name: "Manager(s)",
                        cell: row => (
                            <div className="flex flex-col gap-2">
                                {row?.managerIds?.map((manager, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Avatar src={manager?.profileImage} alt={manager.name}>
                                            {!manager?.profileImage && <User size={18} />}
                                        </Avatar>
                                        <span>{manager.name}</span>
                                    </div>
                                ))}
                            </div>
                        )
                    },
                    {
                        name: "Actions",
                        width: "120px",
                        cell: row => (
                            <div className="action flex gap-2.5 items-center">
                                <span className="edit text-teal-600 hover:text-teal-700 cursor-pointer p-1" title="Edit" onClick={() => handleEditBranch(row)}><Edit2 size={16} /></span>
                                <span className="delete text-red-500 hover:text-red-600 cursor-pointer p-1" title="Delete" onClick={() => handleEditBranch(row)}><Trash2 size={16} /></span>
                            </div>
                        )
                    },
                ]}
                data={branch || []}
                pagination
                highlightOnHover
                noDataComponent="No branches found"
            />
        </div>
    );
};

export default BranchManager;
