import { useEffect, useState } from 'react';
import { apiClient } from '../../../utils/apiClient';
import {
    Box, Button, FormControl, InputLabel, Select, MenuItem,
    TextField, Avatar, OutlinedInput, InputAdornment, Paper, Divider, Typography
} from '@mui/material';
import { VscDebugRestart } from 'react-icons/vsc';
import { IoMdCloudDownload } from 'react-icons/io';
import DataTable from 'react-data-table-component';
import { useSelector } from 'react-redux';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import dayjs from 'dayjs';
import { MdHistory, MdAccountBalanceWallet } from 'react-icons/md';
import { CiFilter } from 'react-icons/ci';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import Loader from '../../../utils/loader';

const SummaryBox = ({ label, value }) => {
    const isNegative = parseFloat(value) < 0;
    return (
        <Paper elevation={0} sx={{ 
            bgcolor: '#f0fdfa', 
            border: '1px dashed #5eead4', 
            borderRadius: 2, 
            px: 3, 
            py: 2, 
            minWidth: '150px', 
            textAlign: 'center' 
        }}>
            <Typography variant="body2" color="textSecondary">{label}</Typography>
            <Divider sx={{ my: 1, borderColor: '#ccfbf1' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: isNegative ? '#dc2626' : '#111827' }}>
                ₹ {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
        </Paper>
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
            const monthMatch = filterMonth !== "all" ? (d.month() + 1) === Number(filterMonth) : true;
            const dateMatch = filterDate ? d.isSame(filterDate, "day") : true;
            return yearMatch && monthMatch && dateMatch;
        });

        setFiltered(filteredData);

        const debit = filteredData.reduce((sum, e) => sum + (e.debit || 0), 0);
        const credit = filteredData.reduce((sum, e) => sum + (e.credit || 0), 0);
        const balance = debit - credit;

        setTotalDebit(debit);
        setTotalCredit(credit);
        setTotalBalance(balance);
    }, [entries, filterYear, filterMonth, filterDate]);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const data = await apiClient({ url: "my-ledger" });
            setEntries(data || []);
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

    const exportCSV = () => {
        const headers = ["S.No", "Date", "Particular", "Debit", "Credit", "Balance"];
        const rows = filtered.map((e, idx) => [
            idx + 1, dayjs(e.date).format('YYYY-MM-DD'), e.particular, e.debit, e.credit, e.balance
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my_ledger_${dayjs().format('YYYY-MM-DD')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const columns = [
        {
            name: "S.No",
            selector: (row, index) => index + 1,
            width: '70px',
            sortable: false,
        },
        {
            name: "Date",
            selector: (row) => dayjs(row.date).format('DD MMM, YYYY'),
            sortable: true,
        },
        {
            name: "Particular",
            selector: (row) => row.particular,
            sortable: true,
            grow: 2,
        },
        {
            name: "Debit",
            selector: (row) => row.debit,
            sortable: true,
            cell: (row) => (
                <Typography variant="body2" sx={{ color: row.debit > 0 ? '#dc2626' : 'inherit', fontWeight: row.debit > 0 ? 600 : 400 }}>
                    {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '-'}
                </Typography>
            )
        },
        {
            name: "Credit",
            selector: (row) => row.credit,
            sortable: true,
            cell: (row) => (
                <Typography variant="body2" sx={{ color: row.credit > 0 ? '#16a34a' : 'inherit', fontWeight: row.credit > 0 ? 600 : 400 }}>
                    {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '-'}
                </Typography>
            )
        },
        {
            name: "Balance",
            selector: (row) => row.balance,
            sortable: true,
            cell: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 700, color: row.balance < 0 ? '#dc2626' : '#1a3353' }}>
                    ₹{row.balance.toLocaleString()}
                </Typography>
            )
        }
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', margin: '0 auto', bgcolor: 'white', borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Box sx={{ mb: 4, p: 3, border: '1px dashed #008080', borderRadius: 2, bgcolor: '#fdfdfd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ bgcolor: '#008080', width: 70, height: 70 }}
                          src={cloudinaryUrl(empProfile?.profileimage, {
                              format: "webp",
                              width: 100,
                              height: 100,
                          })}
                        >
                            <MdAccountBalanceWallet size={32} />
                        </Avatar>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#008080', textTransform: 'capitalize' }}>
                            {empProfile?.employeeName || 'Account Ledger'}
                        </Typography>
                    </Box>
                </Box>
                
                {loading ? <Loader /> : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                        <SummaryBox label="Total Debit" value={totalDebit} />
                        <SummaryBox label="Total Credit" value={totalCredit} />
                        <SummaryBox label="Net Balance" value={totalBalance.toFixed(2)} />
                    </Box>
                )}
            </Box>

            {/* Filters Row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 1, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                        value={filterYear}
                        label="Year"
                        onChange={e => setFilterYear(e.target.value)}
                        startAdornment={<CiFilter style={{ marginRight: 8 }} />}
                    >
                        <MenuItem value="all">All</MenuItem>
                        {[...new Set(entries.map(e => dayjs(e.date).year()))].map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={filterMonth}
                        label="Month"
                        onChange={e => setFilterMonth(e.target.value)}
                        startAdornment={<CiFilter style={{ marginRight: 8 }} />}
                    >
                        <MenuItem value="all">All</MenuItem>
                        {Array.from({ length: 12 }, (_, i) => (
                            <MenuItem key={i} value={i + 1}>{dayjs().month(i).format("MMMM")}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    type="date"
                    label="Date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 160 }}
                />

                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<VscDebugRestart />}
                    onClick={resetFilters}
                    size="small"
                >
                    Reset
                </Button>

                <Box sx={{ ml: 'auto' }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<IoMdCloudDownload />} 
                        onClick={exportCSV}
                        sx={{ borderColor: '#008080', color: '#008080', '&:hover': { borderColor: '#006666', bgcolor: '#f0fdfa' } }}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
                <DataTable
                    columns={columns}
                    data={filtered}
                    pagination
                    customStyles={useCustomStyles()}
                    highlightOnHover
                    noDataComponent={<Typography sx={{ py: 4 }}>No transactions found</Typography>}
                    paginationPerPage={10}
                />
            </Box>
        </Box>
    );
};

export default EmployeeFinancialLedger;
