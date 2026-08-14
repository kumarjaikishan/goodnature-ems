import React from 'react';
import { Button, Avatar } from '@mui/material';
import DataTable from 'react-data-table-component';
import { FaRegUser } from 'react-icons/fa';
import { MdOutlineModeEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";

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
                                            {!manager?.profileImage && <FaRegUser />}
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
                            <div className="action flex gap-2.5">
                                <span className="edit text-[18px] text-blue-500 cursor-pointer" title="Edit" onClick={() => handleEditBranch(row)}><MdOutlineModeEdit /></span>
                                <span className="delete text-[18px] text-red-500 cursor-pointer" onClick={() => handleEditBranch(row)}><AiOutlineDelete /></span>
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
