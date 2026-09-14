import React from 'react';
import { Search } from 'lucide-react';

const ReportFilterBar = ({
  activeTab,
  searchTerm,
  setSearchTerm,
  schemeFilter,
  setSchemeFilter,
  statusFilter,
  setStatusFilter,
  balanceFilter,
  setBalanceFilter,
}) => {
  return (
    <>
      {/* Filter Bar for Bookings */}
      {activeTab === 'bookings' && (
        <div className="flex flex-col md:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by booking #, customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none pl-10 pr-3.5 rounded-xl font-medium text-xs text-slate-800 transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={schemeFilter}
              onChange={(e) => setSchemeFilter(e.target.value)}
              className="h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition min-w-[140px]"
            >
              <option value="">All Schemes</option>
              <option value="FULL_PAYMENT">One Time</option>
              <option value="MONTHLY_INSTALLMENT">EMI</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition min-w-[130px]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Bar for Dues */}
      {activeTab === 'dues' && (
        <div className="flex flex-col md:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by booking #, customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none pl-10 pr-3.5 rounded-xl font-medium text-xs text-slate-800 transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={schemeFilter}
              onChange={(e) => setSchemeFilter(e.target.value)}
              className="h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition min-w-[140px]"
            >
              <option value="">All Schemes</option>
              <option value="FULL_PAYMENT">One Time</option>
              <option value="MONTHLY_INSTALLMENT">EMI</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition min-w-[130px]"
            >
              <option value="">All Due Status</option>
              <option value="DUE">DUE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Bar for Commissions */}
      {activeTab === 'commissions' && (
        <div className="flex flex-col md:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search sponsor by name, ID, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none pl-10 pr-3.5 rounded-xl font-medium text-xs text-slate-800 transition"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search size={16} />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="h-10 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition min-w-[160px]"
            >
              <option value="">All Wallet Balances</option>
              <option value="with_balance">Available Balance &gt; ₹0</option>
              <option value="zero_balance">Zero Balance (₹0)</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportFilterBar;
