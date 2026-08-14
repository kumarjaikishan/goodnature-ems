import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Card,
    CardContent
} from '@mui/material';
import { FiRefreshCw } from 'react-icons/fi';
import { apiClient } from '../../../../utils/apiClient';
import dayjs from 'dayjs';

const EsslEventLog = ({ companyId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await apiClient({
                url: `getEsslEvents/${companyId}`
            });
            setEvents(data);
        } catch (error) {
            console.error('Error fetching ESSL events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // Polling every 30 seconds for live updates
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, [companyId]);

    const getTypeColor = (type) => {
        switch (type) {
            case 'Success': return 'success';
            case 'Warning': return 'warning';
            case 'Error': return 'error';
            case 'Ignored': return 'default';
            default: return 'primary';
        }
    };

    return (
        <Card variant="outlined" sx={{ mt: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: '600' }}>
                        Live Machine Events (Last 20)
                    </Typography>
                    <Tooltip title="Refresh Logs">
                        <IconButton size="small" onClick={fetchEvents} disabled={loading} color="primary">
                            <FiRefreshCw className={loading ? "animate-spin" : ""} />
                        </IconButton>
                    </Tooltip>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>Time</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>Employee</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>Event Description</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f9f9f9' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No recent events found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event._id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {dayjs(event.timestamp).format('DD MMM, hh:mm A')}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{event.employeeName || 'Unknown'}</TableCell>
                                        <TableCell>{event.empId || 'N/A'}</TableCell>
                                        <TableCell>{event.event}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={event.type} 
                                                size="small" 
                                                color={getTypeColor(event.type)}
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold', borderWeight: 2 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default EsslEventLog;
