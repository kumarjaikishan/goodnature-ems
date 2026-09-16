import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../../api/axios";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  Shield,
  Calendar,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  CalendarCheck2,
  Briefcase,
  DollarSign,
  Coins,
  Settings,
} from "lucide-react";
import dayjs from "dayjs";

const MODULE_CONFIG = {
  ALL: { label: "All Modules", icon: Layers, color: "text-slate-600 bg-slate-100 border-slate-200" },
  PLOTS: { label: "Plots & Real Estate", icon: Building2, color: "text-blue-700 bg-blue-50 border-blue-200" },
  ATTENDANCE: { label: "Attendance & Bio", icon: CalendarCheck2, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  LEAVE: { label: "Leave Requests", icon: Calendar, color: "text-purple-700 bg-purple-50 border-purple-200" },
  PAYROLL: { label: "Payroll & Salary", icon: DollarSign, color: "text-amber-700 bg-amber-50 border-amber-200" },
  EMPLOYEE: { label: "Staff & HR", icon: Briefcase, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  INVESTMENTS: { label: "RD / FD Deposits", icon: Coins, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  ORGANIZATION: { label: "Organization", icon: Settings, color: "text-teal-700 bg-teal-50 border-teal-200" },
  AUTH: { label: "Security & Auth", icon: Shield, color: "text-rose-700 bg-rose-50 border-rose-200" },
  VOUCHER: { label: "Vouchers", icon: FileText, color: "text-orange-700 bg-orange-50 border-orange-200" },
  SYSTEM: { label: "System Core", icon: Activity, color: "text-slate-700 bg-slate-100 border-slate-200" },
};

const getActionBadge = (action = "") => {
  const upper = action.toUpperCase();
  if (upper.includes("CREATE") || upper.includes("BOOKING") || upper.includes("ADD")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (upper.includes("UPDATE") || upper.includes("EDIT") || upper.includes("APPROVE")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (upper.includes("DELETE") || upper.includes("CANCEL") || upper.includes("REJECT")) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (upper.includes("PAYMENT") || upper.includes("INSTALLMENT") || upper.includes("COLLECT")) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 1 });

  const fetchStats = async () => {
    try {
      const res = await api.get("/audit-logs/stats");
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to load audit stats:", err);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 30,
      };
      if (selectedModule !== "ALL") params.module = selectedModule;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get("/audit-logs", { params });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 30, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedModule, search, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setSelectedModule("ALL");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <History size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail & Activity Logs</h1>
              <p className="text-sm text-slate-500">
                Transparent activity ledger tracking system actions, user mutations, and audit records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchLogs();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── METRIC STATS ── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Logs</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalCount?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Layers size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions Today</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.todayCount?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Modules</p>
              <p className="text-2xl font-bold text-purple-600">{stats.moduleStats?.length || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Activity size={22} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Active User</p>
              <p className="text-base font-bold text-slate-900 truncate max-w-[140px]">
                {stats.topUsers?.[0]?._id || "None"}
              </p>
              <p className="text-xs text-slate-400">
                {stats.topUsers?.[0]?.count ? `${stats.topUsers[0].count} actions (7d)` : "No actions"}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <User size={22} />
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER TOOLBAR ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Module Pills */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {Object.entries(MODULE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = selectedModule === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedModule(key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search user, action, description..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Date Range Start */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Date Range End */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex justify-end items-center">
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer px-3 py-2"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY LOGS TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Description / Summary</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-emerald-500" />
                      <span className="text-xs font-medium">Loading audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No activity logs found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your filters or search keywords.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const moduleConf = MODULE_CONFIG[log.module] || MODULE_CONFIG.SYSTEM;
                  const ModuleIcon = moduleConf.icon;

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-900 font-medium">
                          {dayjs(log.createdAt).format("DD MMM YYYY")}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {dayjs(log.createdAt).format("hh:mm:ss A")}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                            {log.userName ? log.userName[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {log.userName || "System"}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                              {log.userRole || "system"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${moduleConf.color}`}
                        >
                          <ModuleIcon size={12} />
                          {log.module}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border tracking-wide ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {log.description ||
                          (log.details && Object.keys(log.details).length > 0
                            ? JSON.stringify(log.details)
                            : "—")}
                      </td>

                      {/* Detail Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="View JSON Payload"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-800">{pagination.page}</span> of{" "}
              <span className="font-bold text-slate-800">{pagination.pages}</span> ({pagination.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Audit Log Details</h3>
                  <p className="text-xs text-slate-400">ID: {selectedLog._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Timestamp</span>
                  <span className="font-semibold text-slate-800">
                    {dayjs(selectedLog.createdAt).format("DD MMMM YYYY, hh:mm:ss A")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">User</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.userName || "System"} ({selectedLog.userRole || "system"})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Module</span>
                  <span className="font-semibold text-slate-800">{selectedLog.module}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Action</span>
                  <span className="font-semibold text-slate-800">{selectedLog.action}</span>
                </div>
                {selectedLog.modelName && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Model</span>
                    <span className="font-semibold text-slate-800">{selectedLog.modelName}</span>
                  </div>
                )}
                {selectedLog.documentId && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Target Document ID</span>
                    <span className="font-semibold text-slate-800 font-mono text-[11px]">
                      {selectedLog.documentId}
                    </span>
                  </div>
                )}
              </div>

              {selectedLog.description && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">Description</h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-700 mb-1">Payload / Changes (JSON)</h4>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
