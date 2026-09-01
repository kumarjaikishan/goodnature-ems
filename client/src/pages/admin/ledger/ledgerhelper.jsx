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
        selector: row => row.particular || '-',
        cell: row => (
            <span className="text-slate-800 font-medium">
                {row.particular || '-'}
            </span>
        ),
        wrap: true,
    },
    {
        name: 'Credit (₹)',
        selector: row => row.credit || 0,
        cell: row => {
            const val = parseFloat(row.credit) || 0;
            return val > 0 ? (
                <span className="font-mono font-bold text-emerald-700 whitespace-nowrap">
                    +₹{val.toLocaleString('en-IN')}
                </span>
            ) : (
                <span className="text-slate-400 font-bold">-</span>
            );
        },
        sortable: true,
        right: true,
        width: '130px'
    },
    {
        name: 'Debit (₹)',
        selector: row => row.debit || 0,
        cell: row => {
            const val = parseFloat(row.debit) || 0;
            return val > 0 ? (
                <span className="font-mono font-bold text-rose-700 whitespace-nowrap">
                    -₹{val.toLocaleString('en-IN')}
                </span>
            ) : (
                <span className="text-slate-400 font-bold">-</span>
            );
        },
        sortable: true,
        right: true,
        width: '130px'
    },
    {
        name: 'Balance (₹)',
        selector: row => row.balance || 0,
        cell: row => {
            if (row.balance === null || row.balance === undefined || row.balance === '') {
                return <span className="text-slate-400 font-bold">-</span>;
            }
            const val = parseFloat(row.balance) || 0;
            return (
                <span className="font-mono font-black text-slate-900 whitespace-nowrap">
                    ₹{val.toLocaleString('en-IN')}
                </span>
            );
        },
        sortable: true,
        right: true,
        width: '140px'
    },
    {
        name: 'Actions',
        width: '100px',
        cell: (row) => {
            if (row.source === 'advance') {
                return (
                    <div className="flex items-center justify-start w-full">
                        <span
                            className="text-blue-600 text-xs font-semibold hover:text-blue-800 cursor-pointer underline whitespace-nowrap"
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
                    </div>
                );
            }
            // 🔹 If salary/payroll → redirect to payroll edit page
            if (row.source === "payroll" || row.source === "salary") {
                return (
                    <div className="flex items-center justify-start gap-2 w-full">
                        <button
                            type="button"
                            className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition cursor-pointer"
                            title="Edit Salary Payroll (Redirect)"
                            onClick={() => {
                                if (row.referenceId) {
                                    navigate(`/dashboard/payroll/edit/${row.referenceId}`);
                                }
                            }}
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                );
            }

            // 🔹 Default edit/delete
            return (
                <div className="flex items-center justify-start gap-2 w-full">
                    <button
                        type="button"
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition cursor-pointer"
                        title="Edit Entry"
                        onClick={() => handleEdit(row)}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        type="button"
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete Entry"
                        onClick={() => handleDelete(row._id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            );
        },
    }
];
