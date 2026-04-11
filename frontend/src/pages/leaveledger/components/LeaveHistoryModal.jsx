import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, Box, Chip, IconButton, CircularProgress
} from '@mui/material';
import { MdClose } from 'react-icons/md';
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/apiClient';

const LeaveHistoryModal = ({ open, onClose, employee }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && employee?._id) {
            fetchHistory();
        }
    }, [open, employee]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await apiClient({ 
                url: `leave-transactions/${employee._id}` 
            });
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching leave history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'credit': return 'success';
            case 'debit': return 'error';
            case 'adjustment': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafd' }}>
                <Box>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', color: '#1a3353' }}>
                        Leave Audit Log
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        History for {employee?.userid?.name}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <MdClose />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }}>Policy</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }} align="right">Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }} align="right">Balance Before</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }} align="right">Balance After</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }}>Source</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f0f4f8' }}>Remarks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#888' }}>
                                            No transaction history found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={tx._id} hover>
                                            <TableCell>{dayjs(tx.createdAt).format('DD MMM YYYY')}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={tx.type} 
                                                    size="small" 
                                                    color={getTypeColor(tx.type)}
                                                    variant="outlined"
                                                    sx={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '10px' }}
                                                />
                                            </TableCell>
                                            <TableCell>{tx.policyId?.name || '-'}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {tx.type === 'debit' ? `-${tx.days}` : tx.days}
                                            </TableCell>
                                            <TableCell align="right" color="textSecondary">{tx.balanceBefore}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{tx.balanceAfter}</TableCell>
                                            <TableCell sx={{ textTransform: 'capitalize', fontSize: '11px' }}>{tx.source}</TableCell>
                                            <TableCell sx={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '11px' }}>
                                                {tx.remarks || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default LeaveHistoryModal;
