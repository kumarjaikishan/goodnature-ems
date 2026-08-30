import { IconButton } from "@mui/material";
import dayjs from "dayjs";
import { Edit2, Trash2 } from "lucide-react";


export const getLedgerColumns = (handleEdit, handleDelete, employee, navigate) => [
    {
        name: "S.No",
        selector: (row, index) => index + 1,
        width: "50px",
    },
    {
        name: 'Date',
        selector: row => dayjs(row.date).format('DD MMM, YYYY'),
        sortable: true,
        width: "110px",
    },
    {
        name: 'Particular',
        selector: row => row.particular,
        wrap: true,
    },
    {
        name: 'Debit',
        selector: row => (parseFloat(row.debit) === 0 ? "" : row.debit), //row.debit.toFixed(2)
        width: '90px'
    },
    {
        name: 'Credit',
        selector: row => (parseFloat(row.credit) === 0 ? "" : row.credit),
        width: '90px'
    },
    {
        name: 'Balance',
        selector: row => row.balance,
        width: '90px'
    },
    {
        name: 'Actions',
        cell: (row) => {
            if (row.source === 'advance') {
                return (
                    <span
                        className="text-blue-600 text-sm cursor-pointer underline"
                        onClick={() => {
                            const emp = employee.find(
                                (val) => val?.ledgerId === row.ledgerId
                            );

                            if (!emp) return;

                            navigate(
                                `/dashboard/advance?employeeId=${emp._id}`,
                                { replace: true }
                            );
                        }}
                    >
                        View Advance
                    </span>
                )
            }
            // 🔹 If salary/payroll → redirect to payroll edit page
            if (row.source === "payroll" || row.source === "salary") {
                return (
                    <Edit2
                        size={16}
                        className="edit text-teal-600 hover:text-teal-700 cursor-pointer"
                        title="Edit Salary Payroll (Redirect)"
                        onClick={() => {
                            if (row.referenceId) {
                                navigate(`/dashboard/payroll/edit/${row.referenceId}`);
                            }
                        }}
                    />
                );
            }

            // 🔹 Default edit/delete
            return (
                <div className="flex items-center gap-2">
                    <Edit2
                        size={16}
                        className="edit text-blue-500 hover:text-blue-600 cursor-pointer"
                        title="Edit Entry"
                        onClick={() => handleEdit(row)}
                    />
                    <Trash2
                        size={16}
                        className="delete text-red-500 hover:text-red-600 cursor-pointer"
                        title="Delete Entry"
                        onClick={() => handleDelete(row._id)}
                    />
                </div>
            );
        },
        width: '120px',
    }
];
