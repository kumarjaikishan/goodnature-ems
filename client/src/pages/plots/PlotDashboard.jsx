import { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import {
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineClock,
  HiOutlineTag,
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
      <PageLoader
        title="Loading Plot Dashboard..."
        subtitle="Synchronizing inventory counts, collections, and bookings"
      />
    );
  }

  const { plots = {}, bookings = {}, collections = {} } = stats || {};

  const grossSales = Number(bookings.totalValue) || 0;
  const totalDiscount = Number(bookings.totalDiscount) || 0;
  const collectedFunds = Number(collections.totalCollection) || 0;
  const outstandingBalance = Number(bookings.remainingAmount) || 0;

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <HiOutlineBuildingOffice2 className="w-7 h-7 text-teal-700" />
            Plot Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium">Real-time overview of plots inventory, bookings, and financial metrics.</p>
        </div>
      </div>

      {/* Stats Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Sales Value */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <HiOutlineCurrencyRupee className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Gross Sales Value</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 font-mono truncate">₹{grossSales.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Total Discounts */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <HiOutlineTag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Total Discounts</span>
            <h3 className="text-xl font-bold text-rose-600 mt-0.5 font-mono truncate">₹{totalDiscount.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Collected Funds */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <HiOutlineCurrencyRupee className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Collected Funds</span>
            <h3 className="text-xl font-bold text-emerald-700 mt-0.5 font-mono truncate">₹{collectedFunds.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Outstanding Balance</span>
            <h3 className="text-xl font-bold text-amber-700 mt-0.5 font-mono truncate">₹{outstandingBalance.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Total Active Bookings */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-teal-50 text-teal-800 rounded-xl">
            <HiOutlineShoppingCart className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider block truncate">Booked Plots Count</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5 truncate">{plots.BOOKED || bookings.count || 0}</h3>
          </div>
        </div>
      </div>

      {/* Plot Status Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
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
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="text-2xl font-bold text-rose-600">{plots.BOOKED || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Booked</p>
          </div>
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center">
            <span className="text-2xl font-bold text-slate-600">{plots.CANCELLED || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Cancelled</p>
          </div>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-center col-span-2 md:col-span-1">
            <span className="text-2xl font-bold text-teal-700">{plots.REGISTERED || 0}</span>
            <p className="text-[0.65rem] font-bold uppercase text-slate-500 tracking-wider mt-1">Registered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotDashboard;
