import React from 'react';
import { Search } from 'lucide-react';
import Select from '../../../../components/ui/Select';

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
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="w-full sm:w-40">
              <Select
                value={schemeFilter}
                onChange={(e) => setSchemeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Schemes' },
                  { value: 'FULL_PAYMENT', label: 'One Time' },
                  { value: 'MONTHLY_INSTALLMENT', label: 'EMI' },
                ]}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'PENDING', label: 'PENDING' },
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'HOLD', label: 'HOLD' },
                  { value: 'COMPLETED', label: 'COMPLETED' },
                  { value: 'REJECTED', label: 'REJECTED' },
                  { value: 'CANCELLED', label: 'CANCELLED' },
                ]}
              />
            </div>
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
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="w-full sm:w-40">
              <Select
                value={schemeFilter}
                onChange={(e) => setSchemeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Schemes' },
                  { value: 'FULL_PAYMENT', label: 'One Time' },
                  { value: 'MONTHLY_INSTALLMENT', label: 'EMI' },
                ]}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Due Status' },
                  { value: 'DUE', label: 'DUE' },
                  { value: 'COMPLETED', label: 'COMPLETED' },
                ]}
              />
            </div>
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
          <div className="w-full sm:w-48">
            <Select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              options={[
                { value: '', label: 'All Wallet Balances' },
                { value: 'with_balance', label: 'Available Balance > ₹0' },
                { value: 'zero_balance', label: 'Zero Balance (₹0)' },
              ]}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ReportFilterBar;
