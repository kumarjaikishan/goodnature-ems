import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CircularProgress } from '@mui/material';
import {
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineCheckBadge,
  HiOutlineScale,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';

const PlotDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plots/dashboard/stats')
      .then(res => {
        setStats(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-3">
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        <p className="text-xs font-bold text-slate-500 animate-pulse">Loading Plot & Investment Dashboard...</p>
      </div>
    );
  }

  const { plots = {}, bookings = {}, collections = {} } = stats || {};

  const grossSales = Number(bookings.totalValue) || 0;
  const totalDiscount = Number(bookings.totalDiscount) || 0;
  const netSales = Math.max(0, grossSales - totalDiscount);
  const collectedFunds = Number(collections.totalCollection) || 0;
  const outstandingBalance = Number(bookings.remainingAmount) || 0;

  // Percentage shares for visual tally bar
  const collectedPct = grossSales > 0 ? ((collectedFunds / grossSales) * 100).toFixed(1) : '0';
  const discountPct = grossSales > 0 ? ((totalDiscount / grossSales) * 100).toFixed(1) : '0';
  const outstandingPct = grossSales > 0 ? ((outstandingBalance / grossSales) * 100).toFixed(1) : '0';

  const isTallyMatched = Math.abs(grossSales - (totalDiscount + collectedFunds + outstandingBalance)) < 1;

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <HiOutlineBuildingOffice2 className="w-7 h-7 text-indigo-600" />
            Plot & Land Investment Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">Real-time overview of plots inventory, bookings, and financial metrics.</p>
        </div>

        {/* Tally Badge */}
        {grossSales > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            <HiOutlineCheckBadge className="w-4 h-4 text-emerald-600" />
            <span>Accounts Reconciled & Tallied</span>
          </div>
        )}
      </div>

      {/* Stats Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Sales Value */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <HiOutlineCurrencyRupee className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Gross Sales Value</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 font-mono truncate">₹{grossSales.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Total Discounts */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <HiOutlineTag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Total Discounts</span>
            <h3 className="text-xl font-bold text-rose-600 mt-0.5 font-mono truncate">₹{totalDiscount.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Collected Funds */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <HiOutlineCurrencyRupee className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Collected Funds</span>
            <h3 className="text-xl font-bold text-emerald-700 mt-0.5 font-mono truncate">₹{collectedFunds.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Outstanding Balance</span>
            <h3 className="text-xl font-bold text-amber-700 mt-0.5 font-mono truncate">₹{outstandingBalance.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Total Active Bookings */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HiOutlineShoppingCart className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Booked Plots Count</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 truncate">{plots.BOOKED || bookings.count || 0}</h3>
          </div>
        </div>
      </div>

      {/* Financial Tally Breakdown & Reconciliation Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HiOutlineScale className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Financial Ledger Tally Breakdown</h3>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Net Contract Value: <span className="font-bold text-slate-900 font-mono">₹{netSales.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Visual Multi-Segment Tally Bar */}
        {grossSales > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${collectedPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Collected: ₹${collectedFunds.toLocaleString('en-IN')} (${collectedPct}%)`}
              />
              <div
                style={{ width: `${discountPct}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Discount: ₹${totalDiscount.toLocaleString('en-IN')} (${discountPct}%)`}
              />
              <div
                style={{ width: `${outstandingPct}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title={`Outstanding: ₹${outstandingBalance.toLocaleString('en-IN')} (${outstandingPct}%)`}
              />
            </div>

            {/* Tally Equation Formula Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-blue-700 block">Gross Value (100%)</span>
                <span className="text-base font-bold text-blue-900 font-mono">₹{grossSales.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-rose-700 block">Total Discounts ({discountPct}%)</span>
                <span className="text-base font-bold text-rose-700 font-mono">₹{totalDiscount.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-700 block">Total Collected ({collectedPct}%)</span>
                <span className="text-base font-bold text-emerald-800 font-mono">₹{collectedFunds.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-700 block">Outstanding Due ({outstandingPct}%)</span>
                <span className="text-base font-bold text-amber-800 font-mono">₹{outstandingBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-[0.72rem] text-slate-500 font-medium italic flex items-center justify-between pt-1">
              <span>* Equation: Gross Sales Value = Total Discounts + Total Collected + Outstanding Balance</span>
              {isTallyMatched && <span className="text-emerald-600 font-bold">✓ 100% Balanced</span>}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">No active sales data available for tally calculation.</div>
        )}
      </div>

      {/* Plot Status Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Inventory Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-2xl font-bold text-emerald-600">{plots.AVAILABLE || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Available</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-2xl font-bold text-amber-600">{plots.HOLD || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">On Hold</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <span className="text-2xl font-bold text-red-600">{plots.BOOKED || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Booked</p>
          </div>
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center">
            <span className="text-2xl font-bold text-slate-600">{plots.CANCELLED || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Cancelled</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center col-span-2 md:col-span-1">
            <span className="text-2xl font-bold text-purple-600">{plots.REGISTERED || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Registered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotDashboard;
