import { useEffect, useState } from 'react';
import { apiClient } from '../../../utils/apiClient';
import { RotateCcw, Download, Wallet } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { useSelector } from 'react-redux';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import dayjs from 'dayjs';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import Loader from '../../../utils/loader';
import Select from '@/components/ui/Select';
import DateInput from '@/components/ui/DateInput';
import Button from '@/components/ui/Button';

const SummaryBox = ({ label, value }) => {
    const isNegative = parseFloat(value) < 0;
    return (
        <div className="bg-teal-50/60 border border-teal-200 rounded-xl px-5 py-3.5 min-w-[150px] text-center shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">{label}</span>
            <div className="h-px bg-teal-200/60 my-2" />
            <span className={`text-xl font-bold font-mono block ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
                ₹ {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
        </div>
    );
};

const EmployeeFinancialLedger = () => {
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const { profile: empProfile } = useSelector((state) => state.employee);

    const [filterYear, setFilterYear] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [totalBalance, setTotalBalance] = useState(0);

    useEffect(() => {
        fetchLedger();
    }, []);

    useEffect(() => {
        if (!entries) return;

        const filteredData = entries.filter(e => {
            const d = dayjs(e.date);
            const yearMatch = filterYear !== 'all' ? d.year() === Number(filterYear) : true;
            const monthMatch = filterMonth !== 'all' ? d.month() + 1 === Number(filterMonth) : true;
            const dateMatch = filterDate ? d.format('YYYY-MM-DD') === filterDate : true;
            return yearMatch && monthMatch && dateMatch;
        });

        setFiltered(filteredData);

        const deb = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.debit) || 0), 0);
        const cred = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.credit) || 0), 0);
        setTotalDebit(deb);
        setTotalCredit(cred);

        const lastEntry = filteredData[filteredData.length - 1];
        setTotalBalance(lastEntry?.balance ?? (cred - deb));

    }, [entries, filterYear, filterMonth, filterDate]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const data = await apiClient({ url: "my-ledger" });
            const list = data?.entries || [];
            setEntries(list);
            setFiltered(list);
        } catch (err) {
            console.error("Error fetching financial ledger:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilterYear('all');
        setFilterMonth('all');
        setFilterDate('');
    };

    const exportCSV = () => {
        if (!filtered.length) return;
        const headers = ["Date", "Particulars", "Credit", "Debit", "Balance"];
        const rows = filtered.map(e => [
            dayjs(e.date).format("YYYY-MM-DD"),
            `"${e.particulars || ''}"`,
            e.credit || 0,
            e.debit || 0,
            e.balance || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `My_Financial_Ledger_${dayjs().format("YYYYMMDD")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        {
            name: "Date",
            selector: (row) => row.date,
            sortable: true,
            width: "120px",
            cell: (row) => dayjs(row.date).format("DD MMM YYYY")
        },
        {
            name: "Particulars",
            selector: (row) => row.particulars,
            wrap: true,
            minWidth: "220px"
        },
        {
            name: "Credit (+)",
            selector: (row) => row.credit || 0,
            sortable: true,
            right: true,
            cell: (row) => {
                const val = parseFloat(row.credit) || 0;
                return val > 0 ? (
                    <span className="font-mono font-bold text-emerald-700 whitespace-nowrap">
                        +₹{val.toLocaleString('en-IN')}
                    </span>
                ) : (
                    <span className="text-slate-400 font-bold">-</span>
                );
            }
        },
        {
            name: "Debit (-)",
            selector: (row) => row.debit || 0,
            sortable: true,
            right: true,
            cell: (row) => {
                const val = parseFloat(row.debit) || 0;
                return val > 0 ? (
                    <span className="font-mono font-bold text-rose-700 whitespace-nowrap">
                        -₹{val.toLocaleString('en-IN')}
                    </span>
                ) : (
                    <span className="text-slate-400 font-bold">-</span>
                );
            }
        },
        {
            name: "Balance (₹)",
            selector: (row) => row.balance || 0,
            sortable: true,
            right: true,
            cell: (row) => {
                if (row.balance === null || row.balance === undefined || row.balance === '') {
                    return <span className="text-slate-400 font-bold">-</span>;
                }
                const val = parseFloat(row.balance) || 0;
                return (
                    <span className="font-mono font-black text-slate-900 whitespace-nowrap">
                        ₹{val.toLocaleString('en-IN')}
                    </span>
                );
            }
        }
    ];

    const yearOptions = [
        { label: 'All Years', value: 'all' },
        ...[...new Set(entries.map(e => dayjs(e.date).year()))].map(y => ({ label: `${y}`, value: y }))
    ];

    const monthOptions = [
        { label: 'All Months', value: 'all' },
        ...Array.from({ length: 12 }, (_, i) => ({
            label: dayjs().month(i).format("MMMM"),
            value: i + 1
        }))
    ];

    return (
        <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header / Summary Card */}
            <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    {empProfile?.profileimage ? (
                        <img
                            src={cloudinaryUrl(empProfile?.profileimage, {
                                format: "webp",
                                width: 100,
                                height: 100,
                            })}
                            alt="Profile"
                            className="w-14 h-14 rounded-full object-cover border border-teal-200"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                            <Wallet size={24} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 capitalize">
                            {empProfile?.employeeName || 'Personal Account Ledger'}
                        </h3>
                        <p className="text-xs text-slate-500">Track salary credits, advances, and expense deductions</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-6 flex justify-center">
                        <Loader />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryBox label="Total Debit" value={totalDebit} />
                        <SummaryBox label="Total Credit" value={totalCredit} />
                        <SummaryBox label="Net Balance" value={totalBalance.toFixed(2)} />
                    </div>
                )}
            </div>

            {/* Filters Row */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="w-32">
                        <Select
                            size="sm"
                            options={yearOptions}
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                        />
                    </div>

                    <div className="w-36">
                        <Select
                            size="sm"
                            options={monthOptions}
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                        />
                    </div>

                    <div className="w-40">
                        <DateInput
                            size="sm"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        startIcon={RotateCcw}
                        onClick={resetFilters}
                    >
                        Reset
                    </Button>
                </div>

                <div>
                    <Button 
                        variant="outline"
                        size="sm"
                        startIcon={Download} 
                        onClick={exportCSV}
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filtered}
                    pagination
                    customStyles={useCustomStyles()}
                    highlightOnHover
                    noDataComponent={
                        <div className="py-12 text-center text-slate-500 font-medium text-sm">
                            No transactions found
                        </div>
                    }
                    paginationPerPage={10}
                />
            </div>
        </div>
    );
};

export default EmployeeFinancialLedger;
