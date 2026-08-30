import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Button,
    TextField,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment
} from '@mui/material';
import DataTable from '@/components/common/DataTable';
import { IoSearch, IoRefresh } from 'react-icons/io5';
import { AiOutlineDelete } from 'react-icons/ai';
import { BiMessageRoundedError } from 'react-icons/bi';
import { MdClear, MdVisibility } from 'react-icons/md';
import dayjs from 'dayjs';
import swal from 'sweetalert';
import { toast } from 'react-toastify';
import { apiClient } from '../../utils/apiClient';
import { useCustomStyles } from '../admin/attandence/attandencehelper';

const DeveloperEsslMonitor = () => {
    const [currentTab, setCurrentTab] = useState(0);

    // ESSL Raw Logs State
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsTotal, setLogsTotal] = useState(0);
    const [logsPage, setLogsPage] = useState(1);
    const [logsLimit, setLogsLimit] = useState(50);
    const [logsSearch, setLogsSearch] = useState('');
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [clearLogsRows, setClearLogsRows] = useState(false);

    // ESSL Events State
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsTotal, setEventsTotal] = useState(0);
    const [eventsPage, setEventsPage] = useState(1);
    const [eventsLimit, setEventsLimit] = useState(50);
    const [eventsSearch, setEventsSearch] = useState('');
    const [eventsType, setEventsType] = useState('all');
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [clearEventsRows, setClearEventsRows] = useState(false);

    // Detail Modal State
    const [detailItem, setDetailItem] = useState(null);

    // Fetch Logs
    const fetchLogs = async (page = logsPage, limit = logsLimit, search = logsSearch) => {
        setLogsLoading(true);
        try {
            const data = await apiClient({
                url: `developer/essl-logs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
            });
            setLogs(data.logs || []);
            setLogsTotal(data.total || 0);
        } catch (error) {
            console.error('Error fetching ESSL logs:', error);
            toast.error('Failed to load ESSL logs');
        } finally {
            setLogsLoading(false);
        }
    };

    // Fetch Events
    const fetchEvents = async (page = eventsPage, limit = eventsLimit, search = eventsSearch, type = eventsType) => {
        setEventsLoading(true);
        try {
            const data = await apiClient({
                url: `developer/essl-events?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&type=${type}`
            });
            setEvents(data.events || []);
            setEventsTotal(data.total || 0);
        } catch (error) {
            console.error('Error fetching ESSL events:', error);
            toast.error('Failed to load ESSL events');
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        if (currentTab === 0) {
            fetchLogs(logsPage, logsLimit, logsSearch);
        } else {
            fetchEvents(eventsPage, eventsLimit, eventsSearch, eventsType);
        }
    }, [currentTab, logsPage, logsLimit, eventsPage, eventsLimit, eventsType]);

    // Bulk Delete Logs
    const handleDeleteLogs = async (deleteAll = false) => {
        const title = deleteAll ? 'Delete ALL ESSL Live Logs?' : `Delete ${selectedLogs.length} selected ESSL log(s)?`;
        const text = deleteAll
            ? 'This will permanently wipe ALL ESSL device live logs from the database!'
            : 'Once deleted, you will not be able to recover these log records.';

        const willDelete = await swal({
            title,
            text,
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        });

        if (willDelete) {
            try {
                const body = deleteAll
                    ? { deleteAll: true }
                    : { ids: selectedLogs.map((r) => r._id) };

                const data = await apiClient({
                    url: 'developer/essl-logs',
                    method: 'DELETE',
                    body
                });

                toast.success(data.message || 'Logs deleted successfully');
                setSelectedLogs([]);
                setClearLogsRows(!clearLogsRows);
                fetchLogs(1, logsLimit, logsSearch);
                setLogsPage(1);
            } catch (error) {
                console.error('Error deleting ESSL logs:', error);
                toast.error(error.message || 'Failed to delete logs');
            }
        }
    };

    // Bulk Delete Events
    const handleDeleteEvents = async (deleteAll = false) => {
        const title = deleteAll ? 'Delete ALL ESSL Events?' : `Delete ${selectedEvents.length} selected ESSL event(s)?`;
        const text = deleteAll
            ? 'This will permanently wipe ALL ESSL processing events from the database!'
            : 'Once deleted, you will not be able to recover these event records.';

        const willDelete = await swal({
            title,
            text,
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        });

        if (willDelete) {
            try {
                const body = deleteAll
                    ? { deleteAll: true }
                    : { ids: selectedEvents.map((r) => r._id) };

                const data = await apiClient({
                    url: 'developer/essl-events',
                    method: 'DELETE',
                    body
                });

                toast.success(data.message || 'Events deleted successfully');
                setSelectedEvents([]);
                setClearEventsRows(!clearEventsRows);
                fetchEvents(1, eventsLimit, eventsSearch, eventsType);
                setEventsPage(1);
            } catch (error) {
                console.error('Error deleting ESSL events:', error);
                toast.error(error.message || 'Failed to delete events');
            }
        }
    };

    const getStatusChip = (status) => {
        if (status === 0) {
            return <Chip label="Punch-In (0)" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />;
        }
        if (status === 1) {
            return <Chip label="Punch-Out (1)" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />;
        }
        return <Chip label={`Status ${status}`} size="small" variant="outlined" />;
    };

    const getEventTypeChip = (type) => {
        switch (type) {
            case 'Success':
                return <Chip label="Success" size="small" color="success" sx={{ fontWeight: 600 }} />;
            case 'Warning':
                return <Chip label="Warning" size="small" color="warning" sx={{ fontWeight: 600 }} />;
            case 'Error':
                return <Chip label="Error" size="small" color="error" sx={{ fontWeight: 600 }} />;
            case 'Ignored':
                return <Chip label="Ignored" size="small" sx={{ bgcolor: '#e2e8f0', color: '#475569', fontWeight: 600 }} />;
            default:
                return <Chip label={type || 'Info'} size="small" />;
        }
    };

    // Columns for ESSL Live Logs Table
    const logColumns = [
        {
            name: 'PIN / Emp ID',
            selector: (row) => row.pin,
            sortable: true,
            width: '130px',
            cell: (row) => (
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                    {row.pin}
                </span>
            )
        },
        {
            name: 'Action',
            selector: (row) => row.status,
            width: '140px',
            cell: (row) => getStatusChip(row.status)
        },
        {
            name: 'Device Timestamp',
            selector: (row) => row.timestamp,
            width: '180px',
            cell: (row) => (
                <span className="text-slate-700 font-medium text-xs">
                    {row.timestamp}
                </span>
            )
        },
        {
            name: 'Verify Mode',
            selector: (row) => row.verifyMode ?? '-',
            width: '110px',
            cell: (row) => (
                <span className="text-slate-600 text-xs">
                    Mode {row.verifyMode ?? '-'}
                </span>
            )
        },
        {
            name: 'Received At',
            selector: (row) => row.createdAt,
            width: '170px',
            cell: (row) => (
                <span className="text-slate-500 text-xs">
                    {dayjs(row.createdAt).format('DD MMM YYYY, hh:mm:ss A')}
                </span>
            )
        },
        {
            name: 'Raw Payload',
            selector: (row) => row.raw ?? '',
            grow: 2,
            cell: (row) => (
                <span className="font-mono text-xs text-slate-600 truncate max-w-md" title={row.raw}>
                    {row.raw || '-'}
                </span>
            )
        },
        {
            name: 'View',
            width: '70px',
            cell: (row) => (
                <IconButton size="small" onClick={() => setDetailItem({ type: 'log', data: row })}>
                    <MdVisibility className="text-blue-600" />
                </IconButton>
            )
        }
    ];

    // Columns for ESSL Events Table
    const eventColumns = [
        {
            name: 'Type',
            selector: (row) => row.type,
            width: '110px',
            cell: (row) => getEventTypeChip(row.type)
        },
        {
            name: 'Emp ID',
            selector: (row) => row.empId || '-',
            width: '110px',
            cell: (row) => (
                <span className="font-mono font-semibold text-slate-800">
                    {row.empId || '-'}
                </span>
            )
        },
        {
            name: 'Employee Name',
            selector: (row) => row.employeeName || '-',
            width: '160px',
            cell: (row) => (
                <span className="font-medium text-slate-800 text-xs">
                    {row.employeeName || '-'}
                </span>
            )
        },
        {
            name: 'Event Summary',
            selector: (row) => row.event,
            grow: 2,
            cell: (row) => (
                <span className="text-xs text-slate-700 font-medium line-clamp-2" title={row.event}>
                    {row.event}
                </span>
            )
        },
        {
            name: 'Time',
            selector: (row) => row.timestamp || row.createdAt,
            width: '180px',
            cell: (row) => (
                <span className="text-slate-500 text-xs">
                    {dayjs(row.timestamp || row.createdAt).format('DD MMM YYYY, hh:mm:ss A')}
                </span>
            )
        },
        {
            name: 'View',
            width: '70px',
            cell: (row) => (
                <IconButton size="small" onClick={() => setDetailItem({ type: 'event', data: row })}>
                    <MdVisibility className="text-blue-600" />
                </IconButton>
            )
        }
    ];

    return (
        <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>📟</span> ESSL Biometric Live Monitoring
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Track raw socket packets received from ESSL machine and real-time processing decisions/events.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<IoRefresh />}
                        onClick={() => {
                            if (currentTab === 0) fetchLogs(logsPage, logsLimit, logsSearch);
                            else fetchEvents(eventsPage, eventsLimit, eventsSearch, eventsType);
                        }}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs
                value={currentTab}
                onChange={(_, val) => setCurrentTab(val)}
                className="mt-2 border-b border-slate-200"
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label={`Live Device Logs (${logsTotal})`} className="font-semibold" />
                <Tab label={`Event & Error Log (${eventsTotal})`} className="font-semibold" />
            </Tabs>

            {/* TAB 0: RAW ESSL DEVICE LOGS */}
            {currentTab === 0 && (
                <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search by PIN or timestamp..."
                                value={logsSearch}
                                onChange={(e) => setLogsSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setLogsPage(1);
                                        fetchLogs(1, logsLimit, logsSearch);
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IoSearch />
                                        </InputAdornment>
                                    ),
                                    endAdornment: logsSearch && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setLogsSearch('');
                                                    setLogsPage(1);
                                                    fetchLogs(1, logsLimit, '');
                                                }}
                                            >
                                                <MdClear />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    setLogsPage(1);
                                    fetchLogs(1, logsLimit, logsSearch);
                                }}
                            >
                                Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedLogs.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<AiOutlineDelete />}
                                    onClick={() => handleDeleteLogs(false)}
                                >
                                    Delete Selected ({selectedLogs.length})
                                </Button>
                            )}

                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                startIcon={<AiOutlineDelete />}
                                onClick={() => handleDeleteLogs(true)}
                                disabled={logsTotal === 0}
                            >
                                Clear All Logs
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        columns={logColumns}
                        data={logs}
                        progressPending={logsLoading}
                        progressComponent={<CircularProgress size={32} className="my-6" />}
                        selectableRows
                        onSelectedRowsChange={({ selectedRows }) => setSelectedLogs(selectedRows)}
                        clearSelectedRows={clearLogsRows}
                        pagination
                        paginationServer
                        paginationTotalRows={logsTotal}
                        paginationPerPage={logsLimit}
                        paginationRowsPerPageOptions={[25, 50, 100, 200]}
                        onChangePage={(page) => {
                            setLogsPage(page);
                        }}
                        onChangeRowsPerPage={(newPerPage, page) => {
                            setLogsLimit(newPerPage);
                            setLogsPage(page);
                        }}
                        customStyles={useCustomStyles()}
                        highlightOnHover
                        noDataComponent={
                            <div className="flex items-center gap-2 py-8 text-center text-slate-500 text-sm">
                                <BiMessageRoundedError className="text-xl" /> No ESSL logs found.
                            </div>
                        }
                    />
                </div>
            )}

            {/* TAB 1: ESSL EVENTS LOGS */}
            {currentTab === 1 && (
                <div className="mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap flex-1 max-w-xl">
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    label="Type"
                                    value={eventsType}
                                    onChange={(e) => {
                                        setEventsType(e.target.value);
                                        setEventsPage(1);
                                    }}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="Success">Success</MenuItem>
                                    <MenuItem value="Ignored">Ignored</MenuItem>
                                    <MenuItem value="Warning">Warning</MenuItem>
                                    <MenuItem value="Error">Error</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                placeholder="Search by emp ID, name, event..."
                                value={eventsSearch}
                                onChange={(e) => setEventsSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setEventsPage(1);
                                        fetchEvents(1, eventsLimit, eventsSearch, eventsType);
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IoSearch />
                                        </InputAdornment>
                                    ),
                                    endAdornment: eventsSearch && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setEventsSearch('');
                                                    setEventsPage(1);
                                                    fetchEvents(1, eventsLimit, '', eventsType);
                                                }}
                                            >
                                                <MdClear />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ minWidth: 240 }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                    setEventsPage(1);
                                    fetchEvents(1, eventsLimit, eventsSearch, eventsType);
                                }}
                            >
                                Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedEvents.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<AiOutlineDelete />}
                                    onClick={() => handleDeleteEvents(false)}
                                >
                                    Delete Selected ({selectedEvents.length})
                                </Button>
                            )}

                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                startIcon={<AiOutlineDelete />}
                                onClick={() => handleDeleteEvents(true)}
                                disabled={eventsTotal === 0}
                            >
                                Clear All Events
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        columns={eventColumns}
                        data={events}
                        progressPending={eventsLoading}
                        progressComponent={<CircularProgress size={32} className="my-6" />}
                        selectableRows
                        onSelectedRowsChange={({ selectedRows }) => setSelectedEvents(selectedRows)}
                        clearSelectedRows={clearEventsRows}
                        pagination
                        paginationServer
                        paginationTotalRows={eventsTotal}
                        paginationPerPage={eventsLimit}
                        paginationRowsPerPageOptions={[25, 50, 100, 200]}
                        onChangePage={(page) => {
                            setEventsPage(page);
                        }}
                        onChangeRowsPerPage={(newPerPage, page) => {
                            setEventsLimit(newPerPage);
                            setEventsPage(page);
                        }}
                        customStyles={useCustomStyles()}
                        highlightOnHover
                        noDataComponent={
                            <div className="flex items-center gap-2 py-8 text-center text-slate-500 text-sm">
                                <BiMessageRoundedError className="text-xl" /> No ESSL events found.
                            </div>
                        }
                    />
                </div>
            )}

            {/* DETAIL MODAL */}
            <Dialog
                open={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="font-bold text-slate-800 border-b border-slate-100">
                    {detailItem?.type === 'log' ? '📟 Raw ESSL Device Log Details' : '🔔 ESSL Event Details'}
                </DialogTitle>
                <DialogContent className="pt-4">
                    {detailItem && (
                        <div className="space-y-3 font-sans text-sm">
                            {detailItem.type === 'log' ? (
                                <>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Record ID:</span>
                                        <span className="font-mono text-xs text-slate-800">{detailItem.data._id}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">User PIN (deviceUserId):</span>
                                        <span className="font-bold text-slate-900">{detailItem.data.pin}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Device Punch Type:</span>
                                        <span>{getStatusChip(detailItem.data.status)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Device Timestamp:</span>
                                        <span className="font-medium text-slate-900">{detailItem.data.timestamp}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Verify Mode:</span>
                                        <span className="font-medium text-slate-900">Mode {detailItem.data.verifyMode}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Server Received Time:</span>
                                        <span className="text-slate-800">{dayjs(detailItem.data.createdAt).format('DD MMM YYYY, hh:mm:ss A')}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-slate-500 block mb-1 font-semibold">Raw Socket Packet Data:</span>
                                        <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                            {detailItem.data.raw || 'No raw data'}
                                        </pre>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Event ID:</span>
                                        <span className="font-mono text-xs text-slate-800">{detailItem.data._id}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Status Type:</span>
                                        <span>{getEventTypeChip(detailItem.data.type)}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Employee ID:</span>
                                        <span className="font-mono font-semibold text-slate-900">{detailItem.data.empId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Employee Name:</span>
                                        <span className="font-medium text-slate-900">{detailItem.data.employeeName || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">Logged Time:</span>
                                        <span className="text-slate-800">{dayjs(detailItem.data.timestamp || detailItem.data.createdAt).format('DD MMM YYYY, hh:mm:ss A')}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-slate-500 block mb-1 font-semibold">Event Message & Reason:</span>
                                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                                            {detailItem.data.event}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
                <DialogActions className="border-t border-slate-100 p-3">
                    <Button onClick={() => setDetailItem(null)} variant="outlined">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default DeveloperEsslMonitor;
