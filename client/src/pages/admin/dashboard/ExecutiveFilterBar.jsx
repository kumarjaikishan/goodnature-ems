import React from 'react';
import { Calendar, Filter, RefreshCw, Building2 } from 'lucide-react';
import dayjs from 'dayjs';

const FY_OPTIONS = [
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024'
];

export const ExecutiveFilterBar = ({
  filterType,
  setFilterType,
  date,
  setDate,
  financialYear,
  setFinancialYear,
  month,
  setMonth,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  branchId,
  setBranchId,
  availableBranches = [],
  onRefresh,
  loading = false,
  dateLabel = ''
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filter Type Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            <Filter size={14} className="text-teal-700" />
            <span>Range:</span>
          </div>

          {[
            { id: 'day', label: 'Current Day' },
            { id: 'fy', label: 'Financial Year' },
            { id: 'month', label: 'Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Range Badge & Refresh */}
        <div className="flex items-center gap-2">
          {dateLabel && (
            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-3 py-1 rounded-xl">
              <Calendar size={13} className="text-teal-700 shrink-0" />
              <span>{dateLabel}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-teal-700' : 'text-slate-500'} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sub Controls: Dynamic inputs depending on filterType */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
        {filterType === 'day' && (
          <div className="flex items-center gap-2">
            <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            />
            <button
              type="button"
              onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}
              className="text-[0.68rem] font-bold text-teal-700 hover:underline cursor-pointer"
            >
              Today
            </button>
          </div>
        )}

        {filterType === 'fy' && (
          <div className="flex items-center gap-2">
            <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Financial Year:</label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            >
              {FY_OPTIONS.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy} (1 Apr - 31 Mar)
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'month' && (
          <div className="flex items-center gap-2">
            <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>
        )}

        {filterType === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
              />
            </div>
          </div>
        )}

        {/* Branch Selector (if multiple available) */}
        {availableBranches.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">
              <Building2 size={13} className="text-teal-700" />
              <span>Branch:</span>
            </div>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            >
              <option value="all">All Branches</option>
              {availableBranches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
