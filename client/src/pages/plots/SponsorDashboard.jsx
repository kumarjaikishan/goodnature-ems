import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { toast } from '../../utils/toast';
import PageLoader from '../../components/common/PageLoader';
import {
  TrendingUp,
  Award,
  Users,
  Building2,
  Receipt,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Phone,
  IndianRupee,
  Calendar,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Avatar } from '@mui/material';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

const SponsorDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const loggedInId = user?.profile?.id || user?.profile?._id || user?.id || user?._id;

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    if (!loggedInId) return;
    setLoading(true);
    try {
      const res = await apiClient({
        url: `plots/sponsors/${loggedInId}/dashboard`,
        method: 'GET'
      });
      setDashboardData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load sponsor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [loggedInId]);

  if (loading) {
    return (
      <PageLoader
        title="Loading Dashboard..."
        subtitle="Fetching account summary and metrics"
      />
    );
  }

  const sponsor = dashboardData?.sponsor || {};
  const metrics = dashboardData?.metrics || {};
  const recentBookings = dashboardData?.recentBookings || [];
  const recentCommissions = dashboardData?.recentCommissions || [];
  const subordinates = dashboardData?.subordinates || [];

  const isDeveloperSponsor = sponsor.isDeveloperSponsor;
  const directBookingsCount = metrics.directBookingsCount || 0;
  const teamBookingsCount = metrics.teamBookingsCount || 0;
  const totalBookingsCount = metrics.totalBookingsCount || 0;
  const totalCommissionEarned = Number(metrics.totalCommissionEarned) || 0;
  const availableBalance = Number(metrics.availableBalance) || 0;
  const totalBusinessValue = Number(metrics.totalBusinessValue) || 0;
  const totalCollectionVolume = Number(metrics.totalCollectionVolume) || 0;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen flex flex-col gap-5 max-w-7xl mx-auto">
      {/* ── 1. Clean Official Header & Sponsor Profile ────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            src={sponsor.profileImage ? cloudinaryUrl(sponsor.profileImage) : undefined}
            alt={sponsor.name}
            sx={{
              width: 52,
              height: 52,
              bgcolor: '#0f766e',
              fontSize: '1.25rem',
              fontWeight: 600,
              border: '1px solid #e2e8f0'
            }}
          >
            {sponsor.name?.charAt(0)?.toUpperCase()}
          </Avatar>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{sponsor.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                {isDeveloperSponsor ? 'Developer Sponsor' : 'Sub-Sponsor'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck size={14} className="text-slate-400" />
                ID: <strong className="text-slate-700">{sponsor.sponsorCode || 'N/A'}</strong>
              </span>
              {sponsor.mobile && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={13} className="text-slate-400" />
                  {sponsor.mobile}
                </span>
              )}
              {sponsor.parentSponsor && (
                <span className="flex items-center gap-1">
                  <Users size={13} className="text-slate-400" />
                  Developer: <strong className="text-slate-700">{sponsor.parentSponsor.name}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/dashboard/ledger')}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Wallet size={15} />
            <span>Commission Ledger</span>
          </button>
          <button
            onClick={() => navigate('/dashboard/my-business')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp size={15} />
            <span>Business Report</span>
          </button>
        </div>
      </div>

      {/* ── 2. Standard Metric Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Wallet Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">Available Balance</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5 truncate">
              ₹{availableBalance.toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> Closed & settled
            </span>
          </div>
        </div>

        {/* Total Commission Earned */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">Total Commission</span>
            <h3 className="text-xl font-bold text-teal-800 font-mono mt-0.5 truncate">
              ₹{totalCommissionEarned.toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-slate-500 truncate block">
              Direct: ₹{(metrics.directCommissionEarned || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Plot Bookings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">Total Bookings</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5 truncate">
              {totalBookingsCount} <span className="text-xs font-normal text-slate-400">Plots</span>
            </h3>
            <span className="text-[11px] text-slate-500 truncate block">
              Direct: {directBookingsCount} | Team: {teamBookingsCount}
            </span>
          </div>
        </div>

        {/* Total Sales Volume */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">Sales Turnover</span>
            <h3 className="text-xl font-bold text-slate-800 font-mono mt-0.5 truncate">
              ₹{totalBusinessValue.toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-slate-500 truncate block">
              Collections: ₹{totalCollectionVolume.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Team Network & Recent Activities ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Plot Bookings (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={16} className="text-teal-700" />
                Recent Plot Bookings
              </h2>
              <button
                onClick={() => navigate('/dashboard/my-bookings')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No plot bookings recorded yet.
                </div>
              ) : (
                recentBookings.map((b) => {
                  const dateStr = b.bookingDate
                    ? new Date(b.bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-';
                  return (
                    <div
                      key={b._id}
                      onClick={() => navigate(`/dashboard/plots/booking/${b._id}`)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                          #{b.plotNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{b.customerName}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                b.isDirect
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}
                            >
                              {b.isDirect ? 'Direct' : 'Team'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Booking #{b.bookingNumber} • {dateStr}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800 font-mono">
                          ₹{Number(b.netValue || b.plotValue || 0).toLocaleString('en-IN')}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded mt-0.5 ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : b.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Team Hierarchy / Sub-sponsors (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-purple-700" />
                Downline Team
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                {subordinates.length} Sub-Sponsors
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {subordinates.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {isDeveloperSponsor
                    ? 'No sub-sponsors enrolled under your network.'
                    : 'You are enrolled directly under your Developer Sponsor.'}
                </div>
              ) : (
                subordinates.slice(0, 6).map((sub) => (
                  <div
                    key={sub._id}
                    className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={sub.profileImage ? cloudinaryUrl(sub.profileImage) : undefined}
                        sx={{ width: 28, height: 28, bgcolor: '#0f766e', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        {sub.name?.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{sub.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{sub.sponsorCode || sub.mobile || 'Sponsor'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <button
              onClick={() => navigate('/dashboard/my-business')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Business Report</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Recent Commission Credits Table/List ────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Receipt size={16} className="text-teal-700" />
            Recent Commission Entries
          </h2>
          <button
            onClick={() => navigate('/dashboard/ledger')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            Full Ledger <ArrowRight size={13} />
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          {recentCommissions.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No commission entries found.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Receipt / Plot</th>
                  <th className="py-2.5 px-3">Collection Amount</th>
                  <th className="py-2.5 px-3">Commission Rate</th>
                  <th className="py-2.5 px-3 text-right">Commission Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCommissions.map((c) => {
                  const dateStr = c.date
                    ? new Date(c.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-';
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600">{dateStr}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{c.customerName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        #{c.receiptNumber} {c.plotNumber !== '-' ? `(Plot #${c.plotNumber})` : ''}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                        ₹{Number(c.collectionAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                          {c.commissionPercent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +₹{Number(c.commissionEarned || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SponsorDashboard;
