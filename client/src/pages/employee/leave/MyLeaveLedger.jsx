import React, { useEffect, useState } from "react";
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    Card, 
    CardContent, 
    Divider, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Chip
} from "@mui/material";
import { apiClient } from "../../../utils/apiClient";
import { MdEventAvailable, MdHistory, MdPendingActions, MdShowChart } from "react-icons/md";
import dayjs from "dayjs";
import Loader from "../../../utils/loader";
import LeaveBalanceCards from "./components/LeaveBalanceCards";

const MyLeaveLedger = () => {
    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balData, transData] = await Promise.all([
                apiClient({ url: "my-leave-balances" }),
                apiClient({ url: "my-leave-transactions" })
            ]);
            setBalances(balData || []);
            setTransactions(transData || []);
        } catch (err) {
            console.error("Error fetching leave data:", err);
            setError(err.message || "Failed to load leave data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    if (error) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error" variant="h6">{error}</Typography>
                <Typography color="textSecondary">Please contact administrator if you believe this is an error.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1400px', margin: '0 auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a3353', mb: 1 }}>
                    My Leave Ledger
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Track your leave balances, credits, and usage history.
                </Typography>
            </Box>

            {/* Summary Cards */}
            <LeaveBalanceCards balances={balances} />

            {/* Transaction History */}
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #edf2f7', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fcfcfd' }}>
                    <MdHistory size={24} color="#1a3353" />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a3353' }}>
                        Leave Transaction History
                    </Typography>
                </Box>
                <Divider />
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>Policy</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>Change</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>New Balance</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>Source</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#4a5568' }}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((row) => (
                                <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>{dayjs(row.createdAt).format('DD MMM, YYYY')}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{row.policyId?.name}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={row.type} 
                                            size="small" 
                                            sx={{ 
                                                fontWeight: 600, 
                                                fontSize: '0.7rem',
                                                bgcolor: row.type === 'CREDIT' ? '#e6fffa' : row.type === 'DEBIT' ? '#fff5f5' : '#f0f4f8',
                                                color: row.type === 'CREDIT' ? '#047481' : row.type === 'DEBIT' ? '#c53030' : '#4a5568',
                                                border: `1px solid ${row.type === 'CREDIT' ? '#b2f5ea' : row.type === 'DEBIT' ? '#feb2b2' : '#cbd5e0'}`
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell sx={{ 
                                        fontWeight: 700, 
                                        color: row.type === 'CREDIT' ? '#38a169' : row.type === 'DEBIT' ? '#e53e3e' : '#4a5568' 
                                    }}>
                                        {row.type === 'CREDIT' ? '+' : row.type === 'DEBIT' ? '-' : ''}{row.days}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{row.balanceAfter}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ bgcolor: '#edf2f7', px: 1, py: 0.5, borderRadius: 1, fontWeight: 500 }}>
                                            {row.source}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: '#718096', fontSize: '0.85rem' }}>{row.remarks || '-'}</TableCell>
                                </TableRow>
                            ))}
                            {transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No transactions recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default MyLeaveLedger;
