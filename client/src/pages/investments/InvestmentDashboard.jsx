import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  PiggyBank,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Receipt,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Wallet,
  Calendar,
  CheckCircle2,
  Users,
  CreditCard,
  Percent,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';

const InvestmentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RD'); // RD or FD

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/investments/dashboard-stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch investment stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <PageLoader
        title="Loading Investment Dashboard..."
        subtitle="Calculating deposit portfolios, collections, and dues"
      />
    );
  }

  const rd = stats?.rd || {};
  const fd = stats?.fd || {};

  const activeAccounts = Number(stats?.activeAccounts) || 0;
  const totalCollections = Number(stats?.totalCollection) || 0;
  const totalCommissions = Number(stats?.totalCommissionEarned) || 0;
  const pendingApprovals = Number(stats?.pendingApprovals) || 0;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen flex flex-col gap-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-teal-700" />
            Investment Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Live tracking of Recurring Deposits (R.D.), Fixed Deposits (F.D.), collections, and promoter commissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/investments/schemes')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-2"
          >
            <FileSpreadsheet size={15} className="text-slate-500" />
            Scheme Matrix
          </button>
          <button
            onClick={() => navigate('/dashboard/investments/new')}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} />
            Open New Plan
          </button>
        </div>
      </div>

      {/* ── GLOBAL SUMMARY STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div
          onClick={() => navigate('/dashboard/investments/accounts')}
          className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Plans
            </span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Coins size={18} />
            </div>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-slate-800 mt-2 font-mono">
            {activeAccounts}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {rd.activeCount || 0} R.D. • {fd.activeCount || 0} F.D.
          </p>
        </div>

        <div
          onClick={() => navigate('/dashboard/investments/collections')}
          className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Collections
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <PiggyBank size={18} />
            </div>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-emerald-800 mt-2 font-mono">
            ₹{totalCollections.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved payments</p>
        </div>

        <div
          onClick={() => navigate('/dashboard/investments/accounts')}
          className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Commissions
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-indigo-900 mt-2 font-mono">
            ₹{totalCommissions.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Promoters & Team</p>
        </div>

        <div
          onClick={() => navigate('/dashboard/investments/collections')}
          className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <h3 className="text-lg md:text-2xl font-black text-amber-800 mt-2 font-mono">
            {pendingApprovals}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Non-Cash receipts</p>
        </div>
      </div>

      {/* ── SCHEME TYPE SEGMENT TABS (R.D. vs F.D.) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 md:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('RD')}
              className={`pb-3.5 text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all relative cursor-pointer ${
                activeTab === 'RD' ? 'text-teal-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Recurring Deposit (R.D.)
              {activeTab === 'RD' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-800 rounded-t-full shadow-xs" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('FD')}
              className={`pb-3.5 text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all relative cursor-pointer ${
                activeTab === 'FD' ? 'text-teal-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Fixed Deposit (F.D.)
              {activeTab === 'FD' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-800 rounded-t-full shadow-xs" />
              )}
            </button>
          </div>

          <button
            onClick={() =>
              navigate(
                activeTab === 'RD'
                  ? '/dashboard/investments/accounts?type=RD'
                  : '/dashboard/investments/accounts?type=FD'
              )
            }
            className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
          >
            View All {activeTab} Accounts <ArrowRight size={14} />
          </button>
        </div>

        {/* ── TAB CONTENT: RECURRING DEPOSIT (R.D.) ── */}
        {activeTab === 'RD' ? (
          <div className="space-y-6">
            {/* RD Specific Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total Saved / Deposited
                  </span>
                  <Wallet size={20} className="text-emerald-700" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 font-mono mt-2">
                  ₹{(rd.totalDeposited || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  Across {rd.activeCount || 0} active RD accounts
                </p>
              </div>

              <div
                onClick={() => navigate('/dashboard/investments/dues')}
                className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/80 rounded-2xl cursor-pointer hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Total Pending Dues
                  </span>
                  <AlertCircle size={20} className="text-rose-700" />
                </div>
                <h3 className="text-2xl font-black text-rose-900 font-mono mt-2">
                  ₹{(rd.pendingDues || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-rose-700 mt-1 font-medium">
                  {rd.overdueCount || 0} overdue monthly installments
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Expected Maturity Payout
                  </span>
                  <CheckCircle2 size={20} className="text-teal-700" />
                </div>
                <h3 className="text-2xl font-black text-teal-900 font-mono mt-2">
                  ₹{(rd.totalExpectedMaturity || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-teal-700 mt-1 font-medium">
                  Promised return upon full tenure
                </p>
              </div>
            </div>

            {/* RD Quick Actions Strip */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard/investments/collections')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <CreditCard size={14} /> Collect R.D. Payment
              </button>
              <button
                onClick={() => navigate('/dashboard/investments/dues')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <AlertCircle size={14} /> View Defaulters List
              </button>
              <button
                onClick={() => navigate('/dashboard/investments/accounts')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Layers size={14} /> RD Accounts Ledger
              </button>
            </div>
          </div>
        ) : (
          /* ── TAB CONTENT: FIXED DEPOSIT (F.D.) ── */
          <div className="space-y-6">
            {/* FD Specific Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                    Total Investment Booked
                  </span>
                  <Wallet size={20} className="text-teal-700" />
                </div>
                <h3 className="text-2xl font-black text-teal-900 font-mono mt-2">
                  ₹{(fd.totalPrincipal || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-teal-700 mt-1 font-medium">
                  Across {fd.activeCount || 0} active FD accounts
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Deposit Received
                  </span>
                  <CheckCircle2 size={20} className="text-emerald-700" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 font-mono mt-2">
                  ₹{(fd.totalReceived || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  {fd.pendingDeposit > 0
                    ? `₹${fd.pendingDeposit.toLocaleString('en-IN')} pending clearance`
                    : '100% Principal Realized'}
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
                    Maturity Payout
                  </span>
                  <Percent size={20} className="text-purple-700" />
                </div>
                <h3 className="text-2xl font-black text-purple-900 font-mono mt-2">
                  ₹{(fd.totalExpectedMaturity || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-purple-700 mt-1 font-medium">
                  Promised payout on completed tenures
                </p>
              </div>
            </div>

            {/* FD Quick Actions Strip */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard/investments/collections')}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <CreditCard size={14} /> Collect F.D. Payment
              </button>
              <button
                onClick={() => navigate('/dashboard/investments/settlement')}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck size={14} /> Maturity & Premature Settlement
              </button>
              <button
                onClick={() => navigate('/dashboard/investments/accounts')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Layers size={14} /> FD Accounts Ledger
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SYSTEM SHORTCUTS & OPERATIONS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/dashboard/investments/accounts')}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
              Accounts & Ledgers
            </span>
            <ArrowRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Comprehensive ledger, passbooks, and certificates for all enrolled RD & FD members.
          </p>
        </div>

        <div
          onClick={() => navigate('/dashboard/investments/collections')}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
              Collections & Receipts
            </span>
            <ArrowRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Record payments, generate vouchers, print receipts, and approve offline transactions.
          </p>
        </div>

        <div
          onClick={() => navigate('/dashboard/investments/dues')}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
              Dues & Defaulters
            </span>
            <ArrowRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Track unpaid monthly RD installments, contact members, and inspect overdue timelines.
          </p>
        </div>

        <div
          onClick={() => navigate('/dashboard/investments/settlement')}
          className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
              Settlement & Payouts
            </span>
            <ArrowRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Execute full maturity payouts or calculate simple interest for premature closures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDashboard;

