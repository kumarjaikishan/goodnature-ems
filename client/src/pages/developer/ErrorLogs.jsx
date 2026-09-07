import React, { useEffect, useState, useMemo, useCallback } from "react";
import { apiClient } from "../../utils/apiClient";
import { toast } from "../../utils/toast";
import { swal } from "../../utils/confirmDialog";
import {
    AlertTriangle,
    RotateCcw,
    Trash2,
    Search,
    ChevronDown,
    ChevronUp,
    Clock,
    User,
    Globe,
    Code2,
    ShieldAlert,
    Copy,
    Check
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import dayjs from "dayjs";

const STATUS_VARIANTS = {
    500: "danger",
    404: "warning",
    400: "warning",
    401: "danger",
    403: "danger"
};

const METHOD_COLORS = {
    GET: "bg-emerald-100 text-emerald-800 border-emerald-300",
    POST: "bg-sky-100 text-sky-800 border-sky-300",
    PUT: "bg-amber-100 text-amber-800 border-amber-300",
    PATCH: "bg-purple-100 text-purple-800 border-purple-300",
    DELETE: "bg-rose-100 text-rose-800 border-rose-300"
};

const ErrorLogs = () => {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [expandedId, setExpandedId] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    const fetchErrors = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const data = await apiClient({ url: "developer/errors" });
            setErrors(data.errors || []);
        } catch (err) {
            if (!isSilent) toast.error("Failed to load error logs");
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchErrors();
    }, [fetchErrors]);

    // Auto-refresh every 5 seconds if enabled
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchErrors(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchErrors]);

    const handleClearLogs = async () => {
        swal({
            title: "Clear all runtime error logs?",
            text: "This will flush the in-memory error ring buffer.",
            icon: "warning",
            buttons: true,
            dangerMode: true
        }).then(async (willClear) => {
            if (willClear) {
                try {
                    await apiClient({
                        url: "developer/errors",
                        method: "DELETE"
                    });
                    toast.success("Error logs cleared");
                    fetchErrors();
                } catch (err) {
                    toast.error("Failed to clear error logs");
                }
            }
        });
    };

    const handleCopyStack = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success("Copied to clipboard");
    };

    const filteredErrors = useMemo(() => {
        return errors.filter(err => {
            const matchSearch =
                !search.trim() ||
                err.message?.toLowerCase().includes(search.toLowerCase()) ||
                err.path?.toLowerCase().includes(search.toLowerCase()) ||
                err.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
                err.ip?.includes(search);

            const matchStatus =
                selectedStatus === "all" ||
                String(err.status) === String(selectedStatus);

            return matchSearch && matchStatus;
        });
    }, [errors, search, selectedStatus]);

    const statusCounts = useMemo(() => {
        const counts = { total: errors.length, 500: 0, 404: 0, 400: 0, other: 0 };
        errors.forEach(e => {
            if (e.status === 500) counts[500]++;
            else if (e.status === 404) counts[404]++;
            else if (e.status === 400) counts[400]++;
            else counts.other++;
        });
        return counts;
    }, [errors]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                        <ShieldAlert size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            System Runtime Error Logs
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                                {errors.length} / 100
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            Live in-memory error capture from Express API endpoints and background handlers
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="accent-teal-700 rounded cursor-pointer"
                        />
                        <span>Auto-refresh (5s)</span>
                    </label>

                    <Button
                        variant="outline"
                        size="sm"
                        startIcon={RotateCcw}
                        loading={loading}
                        onClick={() => fetchErrors()}
                    >
                        Refresh
                    </Button>

                    <Button
                        variant="danger"
                        size="sm"
                        startIcon={Trash2}
                        disabled={errors.length === 0}
                        onClick={handleClearLogs}
                    >
                        Clear Logs
                    </Button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Caught</span>
                    <span className="text-2xl font-black text-slate-800 mt-1 block">{statusCounts.total}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">500 Server Errors</span>
                    <span className="text-2xl font-black text-rose-700 mt-1 block">{statusCounts[500]}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">400 Bad Requests</span>
                    <span className="text-2xl font-black text-amber-800 mt-1 block">{statusCounts[400]}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">404 Not Found</span>
                    <span className="text-2xl font-black text-slate-700 mt-1 block">{statusCounts[404]}</span>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
                <div className="w-full sm:w-80">
                    <Input
                        size="sm"
                        startIcon={Search}
                        placeholder="Search message, URL path, user, IP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status:</span>
                    {["all", "500", "404", "400"].map((st) => (
                        <button
                            key={st}
                            onClick={() => setSelectedStatus(st)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                selectedStatus === st
                                    ? "bg-teal-700 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {st === "all" ? "All Statuses" : st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Errors List */}
            <div className="space-y-3">
                {filteredErrors.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                        <AlertTriangle className="mx-auto text-slate-300 mb-3" size={40} />
                        <h3 className="text-base font-bold text-slate-800">No runtime errors logged</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                            {search || selectedStatus !== "all"
                                ? "No errors matched your active filter criteria."
                                : "The backend application has not encountered any unhandled 4xx or 5xx exceptions in the current server lifecycle."}
                        </p>
                    </div>
                ) : (
                    filteredErrors.map((err) => {
                        const isExpanded = expandedId === err.id;
                        const statusBadgeVariant = STATUS_VARIANTS[err.status] || "default";
                        const methodColor = METHOD_COLORS[err.method] || "bg-slate-100 text-slate-700 border-slate-200";

                        return (
                            <div
                                key={err.id}
                                className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden shadow-xs ${
                                    isExpanded ? "border-rose-300 ring-2 ring-rose-50" : "border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                {/* Header Row */}
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : err.id)}
                                    className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                                        <Badge variant={statusBadgeVariant} size="sm">
                                            {err.status}
                                        </Badge>
                                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${methodColor}`}>
                                            {err.method}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-slate-800 truncate">
                                            {err.path}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                                        <div className="flex items-center gap-1">
                                            <Clock size={13} className="text-slate-400" />
                                            <span>{dayjs(err.timestamp).format("DD MMM, hh:mm:ss A")}</span>
                                        </div>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* Main Message Banner */}
                                <div className="px-4 py-2.5 border-t border-slate-100 flex items-start gap-2 bg-white">
                                    <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-semibold text-rose-800 break-all font-mono">
                                        {err.message}
                                    </p>
                                </div>

                                {/* Expanded Detail Drawer */}
                                {isExpanded && (
                                    <div className="p-4 bg-slate-900 text-slate-100 border-t border-slate-800 space-y-4 font-mono text-xs">
                                        {/* Metadata Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-800 text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-teal-400 shrink-0" />
                                                <span className="text-slate-400">User:</span>
                                                <span className="text-slate-200">
                                                    {err.user ? `${err.user.email} (${err.user.role})` : "Unauthenticated"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-sky-400 shrink-0" />
                                                <span className="text-slate-400">IP:</span>
                                                <span className="text-slate-200">{err.ip || "Unknown"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Code2 size={14} className="text-amber-400 shrink-0" />
                                                <span className="text-slate-400">Time ISO:</span>
                                                <span className="text-slate-200">{err.timestamp}</span>
                                            </div>
                                        </div>

                                        {/* Request Body Payload */}
                                        {err.body && Object.keys(err.body).length > 0 && (
                                            <div>
                                                <span className="text-slate-400 text-[11px] font-bold block mb-1 uppercase tracking-wider">
                                                    Request Body Payload
                                                </span>
                                                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto">
                                                    {JSON.stringify(err.body, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Stack Trace */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                                    Stack Trace
                                                </span>
                                                <button
                                                    onClick={() => handleCopyStack(err.id, err.stack || err.message)}
                                                    className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                                                >
                                                    {copiedId === err.id ? <Check size={12} /> : <Copy size={12} />}
                                                    <span>{copiedId === err.id ? "Copied" : "Copy Stack"}</span>
                                                </button>
                                            </div>
                                            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-rose-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                                                {err.stack || "No stack trace available for this error."}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ErrorLogs;
