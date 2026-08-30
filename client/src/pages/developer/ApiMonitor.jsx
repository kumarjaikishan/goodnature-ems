import React, { useEffect, useMemo, useState, useCallback } from "react";
import { apiClient } from "../../utils/apiClient";
import { toast } from "../../utils/toast";
import {
    RotateCcw,
    Gauge,
    AlertCircle,
    Timer,
    Trash2,
    ChevronDown,
    ChevronUp,
    Search,
    X,
    TrendingUp,
    Activity,
    Zap,
    AlertTriangle,
    CheckCircle,
    Clock,
    Filter,
    BarChart2
} from "lucide-react";

const METHOD_COLORS = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
    PATCH: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
    DELETE: "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400",
};

const METHOD_BADGES = {
    GET: "bg-emerald-600 text-white",
    POST: "bg-blue-600 text-white",
    PUT: "bg-amber-600 text-white",
    PATCH: "bg-purple-600 text-white",
    DELETE: "bg-rose-600 text-white",
};

const SORT_OPTIONS = [
    { value: "slowest", label: "Slowest First (Avg Latency)" },
    { value: "p95", label: "Highest P95 Peak" },
    { value: "fastest", label: "Fastest First (Avg Latency)" },
    { value: "mostCalled", label: "Highest Request Volume" },
    { value: "mostErrors", label: "Highest Error Rate" },
    { value: "recent", label: "Most Recently Called" },
];

const speedColor = (ms) => {
    if (ms < 150) return "text-emerald-600 dark:text-emerald-400";
    if (ms < 500) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400 font-bold";
};

const speedBadge = (ms) => {
    if (ms < 150) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (ms < 500) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
};

const speedBarColor = (ms) => {
    if (ms < 150) return "bg-emerald-500";
    if (ms < 500) return "bg-amber-500";
    return "bg-rose-500";
};

const fmtMs = (ms) => (ms == null ? "-" : `${ms < 1 ? ms.toFixed(2) : Math.round(ms)}ms`);

const fmtTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const timeAgo = (iso) => {
    if (!iso) return "-";
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 5) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
};

const Sparkline = ({ records, maxMs }) => {
    return (
        <div className="flex items-end gap-[2px] h-10 w-full py-1">
            {records.map((r, i) => {
                const heightPercent = Math.max(8, (r.durationMs / maxMs) * 100);
                return (
                    <div
                        key={i}
                        title={`${fmtMs(r.durationMs)} · HTTP ${r.statusCode} · ${fmtTime(r.timestamp)}`}
                        className={`flex-1 min-w-[3px] rounded-t transition-all hover:opacity-100 opacity-80 ${
                            !r.ok ? "bg-rose-600" : speedBarColor(r.durationMs)
                        }`}
                        style={{ height: `${heightPercent}%` }}
                    />
                );
            })}
        </div>
    );
};

const EndpointDetail = ({ endpoint }) => {
    const maxMs = Math.max(...endpoint.records.map((r) => r.durationMs), 1);
    const [subFilter, setSubFilter] = useState("all");

    const filteredRecords = useMemo(() => {
        if (subFilter === "errors") return endpoint.records.filter((r) => !r.ok);
        if (subFilter === "slow") return endpoint.records.filter((r) => r.durationMs >= 300);
        return endpoint.records;
    }, [endpoint.records, subFilter]);

    return (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-b-xl border-t border-slate-800 shadow-inner">
            {/* Upper Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Min Latency</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{fmtMs(endpoint.minMs)}</span>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Latency</span>
                    <span className={`text-sm font-mono font-bold ${speedColor(endpoint.avgMs)}`}>
                        {fmtMs(endpoint.avgMs)}
                    </span>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">P95 Peak</span>
                    <span className="text-sm font-mono font-bold text-amber-400">{fmtMs(endpoint.p95Ms)}</span>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Latency</span>
                    <span className="text-sm font-mono font-bold text-rose-400">{fmtMs(endpoint.maxMs)}</span>
                </div>
                <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Error Rate</span>
                    <span
                        className={`text-sm font-mono font-bold ${
                            endpoint.errorCount > 0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                    >
                        {endpoint.errorCount} ({endpoint.errorRate}%)
                    </span>
                </div>
            </div>

            {/* Sparkline Header & Visual Graph */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <BarChart2 size={14} className="text-indigo-400" /> Latency Histogram (Last {endpoint.records.length} Calls)
                    </span>
                    <span className="text-[11px]">Hover bar for call details</span>
                </div>
                <Sparkline records={endpoint.records} maxMs={maxMs} />
            </div>

            {/* Call Log Filter & Table */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Detailed Call Log</span>
                <div className="flex gap-1 text-[11px]">
                    <button
                        onClick={() => setSubFilter("all")}
                        className={`px-2 py-0.5 rounded transition ${
                            subFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        All ({endpoint.records.length})
                    </button>
                    <button
                        onClick={() => setSubFilter("slow")}
                        className={`px-2 py-0.5 rounded transition ${
                            subFilter === "slow" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        Slow &gt;300ms
                    </button>
                    <button
                        onClick={() => setSubFilter("errors")}
                        className={`px-2 py-0.5 rounded transition ${
                            subFilter === "errors" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        Errors ({endpoint.errorCount})
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-lg border border-slate-800">
                <table className="min-w-full text-xs font-mono">
                    <thead className="bg-slate-800 text-slate-300 sticky top-0">
                        <tr>
                            <th className="text-left px-3 py-1.5 font-semibold">Timestamp</th>
                            <th className="text-left px-3 py-1.5 font-semibold">HTTP Status</th>
                            <th className="text-right px-3 py-1.5 font-semibold">Response Time</th>
                            <th className="text-center px-3 py-1.5 font-semibold">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {[...filteredRecords].reverse().map((r, i) => (
                            <tr key={i} className={`hover:bg-slate-800/40 transition ${!r.ok ? "bg-rose-950/40" : ""}`}>
                                <td className="px-3 py-1 text-slate-400">{fmtTime(r.timestamp)}</td>
                                <td className="px-3 py-1 font-semibold">
                                    <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                                            r.statusCode < 300
                                                ? "bg-emerald-500/20 text-emerald-300"
                                                : r.statusCode < 400
                                                ? "bg-blue-500/20 text-blue-300"
                                                : "bg-rose-500/20 text-rose-300"
                                        }`}
                                    >
                                        {r.statusCode}
                                    </span>
                                </td>
                                <td className={`px-3 py-1 text-right font-bold ${speedColor(r.durationMs)}`}>
                                    {fmtMs(r.durationMs)}
                                </td>
                                <td className="px-3 py-1 text-center">
                                    {r.ok ? (
                                        <span className="text-emerald-400 text-[10px] font-sans bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                            OK
                                        </span>
                                    ) : (
                                        <span className="text-rose-400 text-[10px] font-sans bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                                            FAIL
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, tone = "text-slate-800" }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3.5 flex-1 min-w-[200px]">
        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0 border border-teal-100">
            {icon}
        </div>
        <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
            <div className={`text-xl font-extrabold ${tone} truncate`}>{value}</div>
            {sub && <div className="text-[11px] text-slate-400 truncate">{sub}</div>}
        </div>
    </div>
);

const ApiMonitor = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("slowest");
    const [expanded, setExpanded] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [clearing, setClearing] = useState(false);

    const fetchStats = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiClient({ url: "api-monitor/stats" });
            setData(res);
        } catch (error) {
            console.error("Error fetching API monitor stats:", error);
            if (!silent) toast.error(error.message || "Failed to load API stats");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => fetchStats(true), 3000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats]);

    const handleClear = async () => {
        setClearing(true);
        try {
            await apiClient({ url: "api-monitor/stats", method: "DELETE" });
            toast.success("Monitor memory buffer cleared");
            fetchStats();
        } catch (error) {
            toast.error(error.message || "Failed to clear stats");
        } finally {
            setClearing(false);
        }
    };

    const methods = useMemo(() => {
        if (!data?.endpoints) return [];
        return [...new Set(data.endpoints.map((e) => e.method))].sort();
    }, [data]);

    const filteredSorted = useMemo(() => {
        if (!data?.endpoints) return [];
        let list = data.endpoints.filter((e) => {
            const matchesSearch = !search.trim() || e.path.toLowerCase().includes(search.trim().toLowerCase());
            const matchesMethod = methodFilter === "all" || e.method === methodFilter;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "errors" && e.errorCount > 0) ||
                (statusFilter === "slow" && e.avgMs >= 300);

            return matchesSearch && matchesMethod && matchesStatus;
        });

        switch (sortBy) {
            case "p95":
                list = [...list].sort((a, b) => b.p95Ms - a.p95Ms);
                break;
            case "fastest":
                list = [...list].sort((a, b) => a.avgMs - b.avgMs);
                break;
            case "mostCalled":
                list = [...list].sort((a, b) => b.callCount - a.callCount);
                break;
            case "mostErrors":
                list = [...list].sort((a, b) => b.errorRate - a.errorRate || b.errorCount - a.errorCount);
                break;
            case "recent":
                list = [...list].sort((a, b) => new Date(b.lastCallAt) - new Date(a.lastCallAt));
                break;
            case "slowest":
            default:
                list = [...list].sort((a, b) => b.avgMs - a.avgMs);
                break;
        }
        return list;
    }, [data, search, methodFilter, statusFilter, sortBy]);

    const summary = useMemo(() => {
        if (!data?.endpoints?.length) return null;
        const totalCalls = data.endpoints.reduce((s, e) => s + e.callCount, 0);
        const totalErrors = data.endpoints.reduce((s, e) => s + e.errorCount, 0);
        const slowest = [...data.endpoints].sort((a, b) => b.avgMs - a.avgMs)[0];
        const overallAvg =
            data.endpoints.reduce((s, e) => s + e.avgMs * e.callCount, 0) / (totalCalls || 1);
        return { totalCalls, totalErrors, slowest, overallAvg };
    }, [data]);

    return (
        <div className="p-3 md:p-6 bg-slate-50 min-h-screen">
            {/* Header Banner */}
            <div className="bg-slate-900 rounded-2xl p-4 md:p-6 text-white shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-2xl">
                                <Activity size={24} />
                            </span>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black tracking-tight">API Performance Monitor</h1>
                                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Ring Buffer
                                    </span>
                                    <span>·</span>
                                    <span>Server Process Started: {data?.processStartedAt ? new Date(data.processStartedAt).toLocaleTimeString() : "-"}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <label className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 cursor-pointer select-none text-slate-300 hover:bg-slate-800 transition">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="accent-teal-500 cursor-pointer"
                            />
                            Auto-refresh (3s)
                        </label>
                        <button
                            onClick={() => fetchStats()}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        >
                            <RotateCcw size={14} className={loading ? "animate-spin text-teal-400" : ""} /> Refresh
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={clearing}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition"
                        >
                            <Trash2 size={14} /> Clear Stats
                        </button>
                    </div>
                </div>
            </div>

            {/* Metric Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
                    <StatCard icon={<Zap size={20} />} label="Tracked Endpoints" value={data.endpointCount} />
                    <StatCard icon={<Timer size={20} />} label="Total Requests" value={summary.totalCalls} />
                    <StatCard
                        icon={<Activity size={20} />}
                        label="Overall Avg Latency"
                        value={fmtMs(summary.overallAvg)}
                        tone={speedColor(summary.overallAvg)}
                    />
                    <StatCard
                        icon={<AlertTriangle size={20} />}
                        label="Total Errors"
                        value={summary.totalErrors}
                        tone={summary.totalErrors > 0 ? "text-rose-600" : "text-slate-800"}
                    />
                    {summary.slowest && (
                        <StatCard
                            icon={<Gauge size={20} />}
                            label="Slowest Route (Avg)"
                            value={fmtMs(summary.slowest.avgMs)}
                            sub={`${summary.slowest.method} ${summary.slowest.path}`}
                            tone="text-rose-600 font-bold"
                        />
                    )}
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[220px]">
                    <Search size={16} className="text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search endpoint route pattern (e.g. /attendance)..."
                        className="outline-none text-xs bg-transparent w-full text-slate-700 font-mono placeholder:font-sans"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
                        <button
                            onClick={() => setMethodFilter("all")}
                            className={`px-2.5 py-1 rounded-md transition ${
                                methodFilter === "all" ? "bg-white text-slate-900 shadow-sm font-bold" : "hover:text-slate-900"
                            }`}
                        >
                            All
                        </button>
                        {methods.map((m) => (
                            <button
                                key={m}
                                onClick={() => setMethodFilter(m)}
                                className={`px-2 py-1 rounded-md transition ${
                                    methodFilter === m ? `${METHOD_BADGES[m] || "bg-slate-800 text-white"} shadow-sm` : "hover:text-slate-900"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 outline-none"
                    >
                        <option value="all">All Health Status</option>
                        <option value="slow">Slow (&gt;300ms)</option>
                        <option value="errors">With Errors</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 outline-none"
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Endpoint Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading && !data ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                        <Activity className="animate-spin text-3xl mx-auto mb-2 text-teal-600" />
                        Collecting API metrics...
                    </div>
                ) : !filteredSorted.length ? (
                    <div className="p-12 text-center text-slate-400 text-sm">
                        <AlertTriangle className="text-3xl mx-auto mb-2 text-amber-500" />
                        {data?.endpointCount ? "No API endpoints match your search/filters." : "No API calls recorded yet. Interact with the application to start monitoring."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-4 py-3">Endpoint Route</th>
                                    <th className="text-right px-4 py-3">Requests</th>
                                    <th className="text-right px-4 py-3">Avg Latency</th>
                                    <th className="text-right px-4 py-3">Min</th>
                                    <th className="text-right px-4 py-3">P95 Peak</th>
                                    <th className="text-right px-4 py-3">Max</th>
                                    <th className="text-right px-4 py-3">Error Rate</th>
                                    <th className="text-center px-4 py-3">Latency Sparkline</th>
                                    <th className="text-right px-4 py-3">Last Active</th>
                                    <th className="w-8 px-2 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredSorted.map((e) => {
                                    const isOpen = expanded === e.endpointKey;
                                    const maxMs = Math.max(...e.records.map((r) => r.durationMs), 1);
                                    return (
                                        <React.Fragment key={e.endpointKey}>
                                            <tr
                                                onClick={() => setExpanded(isOpen ? null : e.endpointKey)}
                                                className={`hover:bg-slate-50/80 transition cursor-pointer ${
                                                    isOpen ? "bg-slate-50" : ""
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                                METHOD_COLORS[e.method] || "bg-slate-100 text-slate-700 border-slate-300"
                                                            }`}
                                                        >
                                                            {e.method}
                                                        </span>
                                                        <span className="font-mono text-xs text-slate-800 font-semibold">{e.path}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-700">{e.callCount}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded font-mono font-bold border text-xs ${speedBadge(e.avgMs)}`}>
                                                        {fmtMs(e.avgMs)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-500">{fmtMs(e.minMs)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-amber-600 font-bold">{fmtMs(e.p95Ms)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-500">{fmtMs(e.maxMs)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {e.errorCount > 0 ? (
                                                        <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                                            {e.errorCount} ({e.errorRate}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-normal">0%</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center w-36">
                                                    <Sparkline records={e.records} maxMs={maxMs} />
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-500 text-[11px]">{timeAgo(e.lastCallAt)}</td>
                                                <td className="px-2 py-3 text-slate-400 text-base">
                                                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </td>
                                            </tr>
                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={10} className="p-0">
                                                        <EndpointDetail endpoint={e} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiMonitor;
