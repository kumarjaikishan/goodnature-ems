import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../utils/apiClient';
import {
    Box, Button, FormControl, InputLabel, Select, MenuItem,
    TextField, OutlinedInput, InputAdornment, CircularProgress
} from '@mui/material';
import DataTable from '@/components/common/DataTable';
import { toast } from '../../../utils/toast';
import dayjs from 'dayjs';
import { getLedgerColumns } from './ledgerhelper';
import Modalbox from '../../../components/custommodal/Modalbox';
import { useCustomStyles } from '../attandence/attandencehelper';
import Loader from '../../../utils/loader';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    Filter, RotateCcw, Download, ArrowLeft, Plus,
    TrendingUp, TrendingDown, Wallet, User, Calendar, CreditCard
} from 'lucide-react';
import { swal } from '../../../utils/confirmDialog';

const LedgerDetailPage = () => {
    const { id: ledgerId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const { employee } = useSelector((state) => state.user);

    const ledgerName = searchParams.get('name') || 'Account Ledger';
    const profile = decodeURIComponent(searchParams.get("profileimage") || '');
    const empId = searchParams.get('empid');
    const ledgerType = searchParams.get('ledgertype') || 'employee';

    const [entries, setEntries] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [filterYear, setFilterYear] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [totalBalance, setTotalBalance] = useState(0);

    const init = {
        date: dayjs().format('YYYY-MM-DD'),
        particular: "",
        debit: "",
        credit: ""
    };
    const [open, setOpen] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [entry, setEntry] = useState(init);
    const [savingEntry, setSavingEntry] = useState(false);

    useEffect(() => {
        fetchEnteries();
    }, [ledgerId]);

    useEffect(() => {
        if (!entries) return;

        const filteredData = entries.filter(e => {
            const d = dayjs(e.date);
            const yearMatch = filterYear !== 'all' ? d.year() === Number(filterYear) : true;
            const monthMatch = filterMonth !== "all" ? (d.month() + 1) === Number(filterMonth) : true;
            const dateMatch = filterDate ? d.isSame(filterDate, "day") : true;
            return yearMatch && monthMatch && dateMatch;
        });

        setFiltered(filteredData);

        const debit = filteredData.reduce((sum, e) => sum + (e.debit || 0), 0);
        const credit = filteredData.reduce((sum, e) => sum + (e.credit || 0), 0);
        const balance = credit - debit;

        setTotalDebit(debit);
        setTotalCredit(credit);
        setTotalBalance(balance);
    }, [entries, filterYear, filterMonth, filterDate]);

    const fetchEnteries = async () => {
        setLoading(true);
        try {
            const data = await apiClient({
                url: `entries/${ledgerId}`
            });
            setEntries(data.entries || []);
        } catch (err) {
            console.error('Error fetching entries:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilterYear('all');
        setFilterMonth('all');
        setFilterDate('');
    };

    const handleDeleteEntry = async (idx) => {
        swal({
            title: `Are you sure you want to delete this entry?`,
            text: 'Once deleted, this transaction cannot be recovered.',
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                try {
                    const data = await apiClient({
                        url: `ledgerentry/${idx}`,
                        method: "DELETE"
                    });
                    toast.success(data.message || 'Entry deleted successfully');
                    fetchEnteries();
                } catch (err) {
                    console.error('Error deleting entry:', err);
                }
            }
        });
    };

    const exportCSV = () => {
        const headers = ["S.No", "Date", "Particular", "Credit", "Debit", "Balance"];
        const rows = filtered.map((e, idx) => [
            idx + 1,
            dayjs(e.date).format('YYYY-MM-DD'),
            `"${(e.particular || '').replace(/"/g, '""')}"`,
            e.credit || 0,
            e.debit || 0,
            e.balance || 0
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${ledgerName.replace(/\s+/g, '_')}_ledger.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const saveEntry = async (e) => {
        if (e) e.preventDefault();
        if (savingEntry) return;
        if (!entry.particular || entry.particular.trim() === '') {
            toast.warn("Particular field can't be blank");
            return;
        }

        const debitStr = entry.debit?.toString().trim();
        const creditStr = entry.credit?.toString().trim();

        if (debitStr === '' && creditStr === '') {
            toast.warn("At least one value needed: Debit or Credit");
            return;
        }

        const debit = parseFloat(debitStr || 0);
        const credit = parseFloat(creditStr || 0);

        if (debit && credit) {
            toast.warn("Only one of Debit or Credit is allowed");
            return;
        }

        try {
            setSavingEntry(true);
            const payload = {
                ...entry,
                date: new Date(entry.date),
                ledgerId: ledgerId,
                debit: debit || 0,
                credit: credit || 0
            };

            const data = await apiClient({
                url: editIndex ? `ledgerentry/${editIndex}` : "ledgerentry",
                method: editIndex ? "PUT" : "POST",
                body: payload
            });

            toast.success(data.message || 'Entry saved successfully');
            setEditIndex(null);
            setOpen(false);
            setEntry(init);
            fetchEnteries();
        } catch (error) {
            console.error('Error saving entry:', error);
        } finally {
            setSavingEntry(false);
        }
    };

    const handleEditEntry = (entryItem) => {
        const formattedDate = new Date(entryItem.date).toISOString().split("T")[0];
        setEntry({
            date: formattedDate,
            particular: entryItem.particular || '',
            debit: entryItem.debit > 0 ? entryItem.debit.toString() : "",
            credit: entryItem.credit > 0 ? entryItem.credit.toString() : ""
        });
        setEditIndex(entryItem._id);
        setOpen(true);
    };

    const { user: authUser } = useSelector((state) => state.auth || {});
    const currentUser = useSelector((state) => state.user?.profile || state.user || {});
    const isSponsorUser = currentUser?.role === 'sponsor' || authUser?.role === 'sponsor';

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-5 max-w-7xl mx-auto">
            {/* ── Top Header & Profile Banner ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {profile && profile !== 'null' && profile !== 'undefined' ? (
                        <img
                            src={cloudinaryUrl(profile, { format: "webp", width: 100, height: 100 })}
                            alt={ledgerName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shadow-xs"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-black text-xl shadow-xs">
                            {ledgerName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 capitalize">
                                {ledgerName}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                                {ledgerType === 'employee' ? 'Employee Account' : ledgerType === 'sponsor' ? 'Sponsor Account' : 'Custom Ledger'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                            {empId && empId !== 'null' && (
                                <span>{ledgerType === 'sponsor' ? 'Sponsor ID' : 'Employee ID'}: <strong className="font-mono text-slate-800">{empId}</strong></span>
                            )}
                            <span>Total Transactions: <strong className="text-slate-800 font-bold">{filtered.length}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    {!isSponsorUser && (
                        <>
                            <button
                                onClick={() => navigate('/dashboard/ledger')}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                                <ArrowLeft size={15} /> All Ledgers
                            </button>
                            <button
                                onClick={() => { setOpen(true); setEditIndex(null); setEntry(init); }}
                                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                                <Plus size={15} /> Add Entry
                            </button>
                        </>
                    )}
                    <button
                        onClick={exportCSV}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                        <Download size={15} /> Export CSV
                    </button>
                </div>
            </div>

            {/* ── Summary Financial Metrics Cards (Classic Style) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Credit */}
                <div className="bg-teal-50/60 border border-teal-300 border-dashed rounded-xl px-5 py-3.5 text-center shadow-2xs">
                    <p className="text-xs font-semibold text-slate-600">Total Credit</p>
                    <div className="my-2 border-t border-teal-200" />
                    <p className="text-xl font-bold text-emerald-700 font-mono">
                        {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₹
                    </p>
                </div>

                {/* Total Debit */}
                <div className="bg-teal-50/60 border border-teal-300 border-dashed rounded-xl px-5 py-3.5 text-center shadow-2xs">
                    <p className="text-xs font-semibold text-slate-600">Total Debit</p>
                    <div className="my-2 border-t border-teal-200" />
                    <p className="text-xl font-bold text-rose-700 font-mono">
                        {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₹
                    </p>
                </div>

                {/* Net Balance */}
                <div className="bg-teal-50/60 border border-teal-300 border-dashed rounded-xl px-5 py-3.5 text-center shadow-2xs">
                    <p className="text-xs font-semibold text-slate-600">Net Balance</p>
                    <div className="my-2 border-t border-teal-200" />
                    <p className={`text-xl font-bold font-mono ${totalBalance < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                        {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₹
                    </p>
                </div>
            </div>

            {/* ── Filter Toolbar ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Year Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600">Year:</span>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
                        >
                            <option value="all">All Years</option>
                            {[...new Set(entries.map((e) => dayjs(e.date).year()))].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600">Month:</span>
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
                        >
                            <option value="all">All Months</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i + 1}>{dayjs().month(i).format("MMMM")}</option>
                            ))}
                        </select>
                    </div>

                    {/* Exact Date */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600">Date:</span>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
                        />
                    </div>

                    {(filterYear !== 'all' || filterMonth !== 'all' || filterDate) && (
                        <button
                            onClick={resetFilters}
                            className="h-9 px-3 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                            <RotateCcw size={13} /> Reset
                        </button>
                    )}
                </div>

                <span className="text-xs font-bold text-slate-500">
                    Showing <strong className="text-teal-800 font-bold">{filtered.length}</strong> of {entries.length} records
                </span>
            </div>

            {/* ── Transaction Entries Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <DataTable
                    columns={getLedgerColumns(handleEditEntry, handleDeleteEntry, employee, navigate, isSponsorUser)}
                    data={filtered || []}
                    pagination
                    customStyles={useCustomStyles()}
                    highlightOnHover
                    noDataComponent={
                        <div className="p-12 text-center text-slate-400 text-xs italic font-medium">
                            No ledger transactions found matching the filter criteria.
                        </div>
                    }
                    paginationPerPage={15}
                    paginationRowsPerPageOptions={[10, 15, 25, 50, 100]}
                    paginationComponentOptions={{
                        rowsPerPageText: 'Rows per page:',
                    }}
                />
            </div>

            {/* ── Modal - Add/Edit Transaction Entry ── */}
            <Modalbox
                open={open}
                onClose={() => {
                    if (savingEntry) return;
                    setOpen(false);
                    setEditIndex(null);
                }}
            >
                <div className="p-6 bg-white rounded-2xl w-[420px] max-w-[90vw] space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {editIndex !== null ? "Edit Transaction Entry" : "Add Transaction Entry"}
                            </h3>
                            <p className="text-xs text-slate-400">Record a debit or credit entry in this account ledger.</p>
                        </div>
                        <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
                            onClick={() => { setOpen(false); setEditIndex(null); }}
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={saveEntry} className="flex flex-col gap-3.5">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-600">Transaction Date</label>
                            <input
                                type="date"
                                className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
                                value={entry.date || ''}
                                onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-600">Particular / Description</label>
                            <textarea
                                rows={2}
                                className="w-full p-2.5 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800 resize-none"
                                placeholder="Enter transaction details or notes..."
                                value={entry.particular || ''}
                                onChange={(e) => setEntry({ ...entry, particular: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-rose-700">Debit Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none rounded-xl text-xs font-mono font-bold text-rose-700"
                                    value={entry.debit || ''}
                                    onChange={(e) => setEntry({ ...entry, debit: e.target.value, credit: "" })}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-emerald-700">Credit Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none rounded-xl text-xs font-mono font-bold text-emerald-700"
                                    value={entry.credit || ''}
                                    onChange={(e) => setEntry({ ...entry, credit: e.target.value, debit: "" })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate-100 shrink-0">
                            <button
                                type="button"
                                disabled={savingEntry}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
                                onClick={() => { setOpen(false); setEntry(init); setEditIndex(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingEntry}
                                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[100px] flex items-center justify-center cursor-pointer"
                            >
                                {savingEntry ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    editIndex !== null ? "Update Entry" : "Save Entry"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modalbox>
        </div>
    );
};

export default LedgerDetailPage;



