import React, { useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import { Search, RotateCcw, Trash2, MessageSquareWarning, X, Eye, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { swal } from '../../utils/confirmDialog';
import { toast } from '../../utils/toast';
import { apiClient } from '../../utils/apiClient';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import Modalbox from '../../components/custommodal/Modalbox';
import Button from '../../components/ui/Button';

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
            return (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Punch-In (0)
                </span>
            );
        }
        if (status === 1) {
            return (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                    Punch-Out (1)
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                Status {status}
            </span>
        );
    };

    const getEventTypeChip = (type) => {
        switch (type) {
            case 'Success':
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Success</span>;
            case 'Warning':
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">Warning</span>;
            case 'Error':
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">Error</span>;
            case 'Ignored':
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">Ignored</span>;
            default:
                return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">{type || 'Info'}</span>;
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
            name: 'Raw Snippet',
            selector: (row) => row.raw,
            cell: (row) => (
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-xs block">
                    {row.raw || '—'}
                </span>
            )
        },
        {
            name: 'Details',
            width: '80px',
            center: true,
            cell: (row) => (
                <button
                    type="button"
                    className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    title="View Log Details"
                    onClick={() => setDetailItem({ type: 'log', data: row })}
                >
                    <Eye size={16} />
                </button>
            )
        }
    ];

    // Columns for ESSL Events Table
    const eventColumns = [
        {
            name: 'Status',
            selector: (row) => row.type,
            width: '110px',
            cell: (row) => getEventTypeChip(row.type)
        },
        {
            name: 'Emp ID',
            selector: (row) => row.empId,
            width: '100px',
            cell: (row) => (
                <span className="font-mono font-bold text-slate-800">
                    {row.empId || '—'}
                </span>
            )
        },
        {
            name: 'Employee Name',
            selector: (row) => row.employeeName,
            width: '180px',
            cell: (row) => (
                <span className="font-semibold text-slate-900 text-xs">
                    {row.employeeName || '—'}
                </span>
            )
        },
        {
            name: 'Event Message',
            selector: (row) => row.event,
            cell: (row) => (
                <span className="text-xs text-slate-700 font-medium">
                    {row.event}
                </span>
            )
        },
        {
            name: 'Time',
            selector: (row) => row.timestamp || row.createdAt,
            width: '170px',
            cell: (row) => (
                <span className="text-slate-500 text-xs">
                    {dayjs(row.timestamp || row.createdAt).format('DD MMM YYYY, hh:mm:ss A')}
                </span>
            )
        },
        {
            name: 'Details',
            width: '80px',
            center: true,
            cell: (row) => (
                <button
                    type="button"
                    className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                    title="View Event Details"
                    onClick={() => setDetailItem({ type: 'event', data: row })}
                >
                    <Eye size={16} />
                </button>
            )
        }
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                    <h2 className="text-base font-bold text-slate-800">
                        ESSL Live Biometric Monitor & Log Purge
                    </h2>
                    <p className="text-xs text-slate-500">
                        Inspect real-time socket packets, verify punch-ins, debug unmatched biometric events, or purge old records.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 w-fit">
                    <button
                        type="button"
                        onClick={() => setCurrentTab(0)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentTab === 0
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Live Device Logs ({logsTotal})
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentTab(1)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            currentTab === 1
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Processed Events ({eventsTotal})
                    </button>
                </div>
            </div>

            {/* TAB 0: LIVE LOGS */}
            {currentTab === 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                onClick={() => {
                                    setLogsPage(1);
                                    fetchLogs(1, logsLimit, logsSearch);
                                }}
                            >
                                <RotateCcw size={14} /> Refresh
                            </button>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by PIN or packet data..."
                                    value={logsSearch}
                                    onChange={(e) => setLogsSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setLogsPage(1);
                                            fetchLogs(1, logsLimit, logsSearch);
                                        }
                                    }}
                                    className="h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600 min-w-[240px]"
                                />
                                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                {logsSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLogsSearch('');
                                            setLogsPage(1);
                                            fetchLogs(1, logsLimit, '');
                                        }}
                                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <Button
                                variant="primary"
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
                                <button
                                    type="button"
                                    onClick={() => handleDeleteLogs(false)}
                                    className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition cursor-pointer"
                                >
                                    <Trash2 size={14} /> Delete Selected ({selectedLogs.length})
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleDeleteLogs(true)}
                                disabled={logsTotal === 0}
                                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 size={14} /> Clear All Logs
                            </button>
                        </div>
                    </div>

                    <DataTable
                        columns={logColumns}
                        data={logs}
                        progressPending={logsLoading}
                        progressComponent={<Loader2 className="w-8 h-8 text-teal-700 animate-spin my-6" />}
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
                        onChangeRowsPerPage={(newPerPage) => {
                            setLogsLimit(newPerPage);
                            setLogsPage(1);
                        }}
                        customStyles={useCustomStyles()}
                        highlightOnHover
                        noDataComponent={
                            <div className="flex items-center gap-2 py-8 text-center text-slate-500 text-sm font-medium">
                                <MessageSquareWarning size={18} /> No ESSL logs found.
                            </div>
                        }
                    />
                </div>
            )}

            {/* TAB 1: EVENTS */}
            {currentTab === 1 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                onClick={() => {
                                    setEventsPage(1);
                                    fetchEvents(1, eventsLimit, eventsSearch, eventsType);
                                }}
                            >
                                <RotateCcw size={14} /> Refresh
                            </button>

                            <select
                                value={eventsType}
                                onChange={(e) => {
                                    setEventsType(e.target.value);
                                    setEventsPage(1);
                                }}
                                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Success">Success</option>
                                <option value="Warning">Warning</option>
                                <option value="Error">Error</option>
                                <option value="Ignored">Ignored</option>
                            </select>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by emp ID, name, event..."
                                    value={eventsSearch}
                                    onChange={(e) => setEventsSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setEventsPage(1);
                                            fetchEvents(1, eventsLimit, eventsSearch, eventsType);
                                        }
                                    }}
                                    className="h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600 min-w-[240px]"
                                />
                                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                {eventsSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEventsSearch('');
                                            setEventsPage(1);
                                            fetchEvents(1, eventsLimit, '', eventsType);
                                        }}
                                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <Button
                                variant="primary"
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
                                <button
                                    type="button"
                                    onClick={() => handleDeleteEvents(false)}
                                    className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition cursor-pointer"
                                >
                                    <Trash2 size={14} /> Delete Selected ({selectedEvents.length})
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleDeleteEvents(true)}
                                disabled={eventsTotal === 0}
                                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 size={14} /> Clear All Events
                            </button>
                        </div>
                    </div>

                    <DataTable
                        columns={eventColumns}
                        data={events}
                        progressPending={eventsLoading}
                        progressComponent={<Loader2 className="w-8 h-8 text-teal-700 animate-spin my-6" />}
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
                        onChangeRowsPerPage={(newPerPage) => {
                            setEventsLimit(newPerPage);
                            setEventsPage(1);
                        }}
                        customStyles={useCustomStyles()}
                        highlightOnHover
                        noDataComponent={
                            <div className="flex items-center gap-2 py-8 text-center text-slate-500 text-sm font-medium">
                                <MessageSquareWarning size={18} /> No ESSL events found.
                            </div>
                        }
                    />
                </div>
            )}

            {/* DETAIL MODAL */}
            <Modalbox open={Boolean(detailItem)} onClose={() => setDetailItem(null)}>
                <div className="w-[540px] max-w-[92vw] p-6 bg-white rounded-2xl space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-800">
                            {detailItem?.type === 'log' ? 'Raw ESSL Device Log Details' : 'ESSL Event Details'}
                        </h2>
                        <button type="button" onClick={() => setDetailItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                    </div>

                    {detailItem && (
                        <div className="space-y-3 text-xs text-slate-700">
                            {detailItem.type === 'log' ? (
                                <>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Record ID:</span>
                                        <span className="font-mono text-slate-800">{detailItem.data._id}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">User PIN (deviceUserId):</span>
                                        <span className="font-bold text-slate-900">{detailItem.data.pin}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Device Punch Type:</span>
                                        <span>{getStatusChip(detailItem.data.status)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Device Timestamp:</span>
                                        <span className="font-semibold text-slate-900">{detailItem.data.timestamp}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Verify Mode:</span>
                                        <span className="font-semibold text-slate-900">Mode {detailItem.data.verifyMode}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Server Received Time:</span>
                                        <span className="text-slate-800">{dayjs(detailItem.data.createdAt).format('DD MMM YYYY, hh:mm:ss A')}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-slate-500 block mb-1 font-bold">Raw Socket Packet Data:</span>
                                        <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                            {detailItem.data.raw || 'No raw data'}
                                        </pre>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Event ID:</span>
                                        <span className="font-mono text-slate-800">{detailItem.data._id}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Status Type:</span>
                                        <span>{getEventTypeChip(detailItem.data.type)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Employee ID:</span>
                                        <span className="font-mono font-bold text-slate-900">{detailItem.data.empId || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Employee Name:</span>
                                        <span className="font-bold text-slate-900">{detailItem.data.employeeName || '-'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Logged Time:</span>
                                        <span className="text-slate-800">{dayjs(detailItem.data.timestamp || detailItem.data.createdAt).format('DD MMM YYYY, hh:mm:ss A')}</span>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-slate-500 block mb-1 font-bold">Event Message & Reason:</span>
                                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                                            {detailItem.data.event}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setDetailItem(null)}>Close</Button>
                    </div>
                </div>
            </Modalbox>
        </div>
    );
};

export default DeveloperEsslMonitor;
