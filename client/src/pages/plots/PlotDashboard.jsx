import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { HiOutlineCurrencyRupee, HiOutlineShoppingCart, HiOutlineClock } from 'react-icons/hi2';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { plots = {}, bookings = {}, collections = {} } = stats || {};

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Plot & Land Investment Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium">Real-time overview of plots inventory, bookings, and financial metrics.</p>
      </div>

      {/* Stats Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Booked Value */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <HiOutlineCurrencyRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Total Sales Value</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">₹{(bookings.totalValue || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Total Received Collections */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <HiOutlineCurrencyRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Collected Funds</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">₹{(collections.totalCollection || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balances</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">₹{(bookings.remainingAmount || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Total Active Bookings */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <HiOutlineShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Booked Plots Count</span>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{plots.BOOKED || 0}</h3>
          </div>
        </div>
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
