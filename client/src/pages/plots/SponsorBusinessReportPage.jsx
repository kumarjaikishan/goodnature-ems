import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../utils/apiClient';
import { toast } from '../../utils/toast';
import PageLoader from '../../components/common/PageLoader';
import {
  ArrowLeft,
  Printer,
  Building2,
  TrendingUp,
  Filter,
  Search,
  Award
} from 'lucide-react';
import dayjs from 'dayjs';

const SponsorBusinessReportPage = () => {
  const { id: paramId } = useParams();
  const user = useSelector((state) => state.user);
  const loggedInId = user?.profile?.id || user?.profile?._id || user?.id || user?._id;
  const targetId = paramId || loggedInId;

  const navigate = useNavigate();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'SELF', 'SUBORDINATE'
  const [searchQuery, setSearchQuery] = useState('');

  // Applied filters (used for API queries)
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '',
    toDate: '',
    typeFilter: 'ALL',
    searchQuery: ''
  });

  const fetchBusinessReport = async (overrideFilters) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const active = overrideFilters || appliedFilters;
      const params = new URLSearchParams();
      if (active.fromDate) params.append('fromDate', active.fromDate);
      if (active.toDate) params.append('toDate', active.toDate);
      if (active.typeFilter && active.typeFilter !== 'ALL') params.append('typeFilter', active.typeFilter);
      if (active.searchQuery) params.append('search', active.searchQuery);

      const res = await apiClient({
        url: `plots/sponsors/${targetId}/business-report?${params.toString()}`,
        method: 'GET'
      });
      setReportData(res.data);
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Failed to load sponsor business report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchBusinessReport();
    }
  }, [targetId, appliedFilters]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      fromDate,
      toDate,
      typeFilter,
      searchQuery: searchQuery.trim()
    });
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setTypeFilter('ALL');
    setSearchQuery('');
    setAppliedFilters({
      fromDate: '',
      toDate: '',
      typeFilter: 'ALL',
      searchQuery: ''
    });
  };

  if (loading && !reportData) {
    return (
      <PageLoader
        title="Loading Sponsor Business Report..."
        subtitle="Aggregating date-wise collections, commission slabs and hierarchy downlines"
      />
    );
  }

  if (!reportData || !reportData.sponsor) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-base font-bold text-slate-700">Sponsor business report not found.</p>
        <button
          onClick={() => navigate('/dashboard/plots/sponsors')}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Sponsors
        </button>
      </div>
    );
  }

  const { sponsor, summary = {}, items = [] } = reportData;
  const isDeveloperSponsor = sponsor.isDeveloperSponsor;

  const hasActiveFilters = Boolean(appliedFilters.fromDate || appliedFilters.toDate || appliedFilters.typeFilter !== 'ALL' || appliedFilters.searchQuery);

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* ── Top Navigation & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/plots/sponsors')}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={16} /> Sponsors
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{sponsor.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isDeveloperSponsor
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {isDeveloperSponsor ? '👑 Developer Sponsor' : '👤 Sub-Sponsor'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Code: <span className="font-mono font-bold text-slate-700">{sponsor.sponsorCode}</span>
              {sponsor.mobile ? ` | Mobile: ${sponsor.mobile}` : ''}
              {sponsor.parentSponsor ? ` | Parent Developer: ${sponsor.parentSponsor.name} (${sponsor.parentSponsor.sponsorCode || ''})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/dashboard/plots/sponsors/${targetId}/ledger`)}
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Building2 size={15} /> Commission Ledger
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer size={15} /> Print Statement
          </button>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
              Total Business Collection
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              ₹{(summary.totalCollection || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across {summary.transactionsCount || 0} receipt collections
            </p>
          </div>
        </div>

        {/* Total Commission Earned */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
              Total Commission Earned
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-700">
              ₹{(summary.totalCommission || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Direct & indirect earnings combined
            </p>
          </div>
        </div>

        {/* Direct Self Business */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
              Self Direct Business
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              Direct
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold text-slate-800">
              ₹{(summary.selfCollection || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
              Commission: ₹{(summary.selfCommission || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Subordinate Downline Business */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
              Subordinates Downline
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {reportData.subordinatesCount || 0} Sub-Sponsors
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl font-bold text-slate-800">
              ₹{(summary.subordinateCollection || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
              Override Earned: ₹{(summary.subordinateCommission || 0).toLocaleString('en-IN')} (2%)
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs print:hidden space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter size={15} className="text-teal-700" />
            <span>Filter Business Collections</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition"
            >
              Reset Filters
            </button>
          )}
        </div>

        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">Business Source</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Sources (Self + Subordinates)</option>
              <option value="SELF">Direct Self Business Only</option>
              <option value="SUBORDINATE">Subordinates Downline Only</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600">Search Customer / Plot / Booking</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer, plot #, booking #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-3 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="h-9 w-full px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Filter size={14} /> Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* ── Transactions Statement Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Date-Wise Business Collections & Commission Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {items.length} collection entries with exact commission percentage applied
            </p>
          </div>
          <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
            Total Earned: ₹{(summary.totalCommission || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs italic font-medium">
            No business collections found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 select-none text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">S.No</th>
                  <th className="p-3">Collection Date</th>
                  <th className="p-3">Customer & Plot</th>
                  <th className="p-3">Source, Downline & Commission %</th>
                  <th className="p-3 text-right">Collection Amount</th>
                  <th className="p-3 text-right">Commission Earned</th>
                  <th className="p-3 text-center">Closing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((row, idx) => {
                  const isSelf = row.sourceType === 'SELF';
                  const isDirectDev = row.commissionRole === 'DIRECT_DEVELOPER';
                  return (
                    <tr key={row._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {dayjs(row.date).format('DD MMM YYYY')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {dayjs(row.date).format('hh:mm A')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[12px]">{row.customerName}</span>
                          <span className="text-[11px] text-slate-600 font-medium mt-0.5">
                            Plot: <strong className="text-teal-800 font-bold">#{row.plotNumber}</strong> | Booking: <strong className="font-mono text-slate-700 font-bold">{row.bookingNumber}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {isSelf ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-[11px]">
                                Direct Self
                              </span>
                              <span className="font-black text-blue-900 bg-blue-100/70 border border-blue-300/80 rounded px-2 py-0.5 text-[11px]">
                                {row.percentFormula || `${row.commissionPercent}%`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {isDirectDev ? 'Promoter + Developer Commission' : 'Direct Promoter Sale'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-[11px]">
                                Subordinate
                              </span>
                              <span className="font-black text-amber-900 bg-amber-100/70 border border-amber-300/80 rounded px-2 py-0.5 text-[11px]">
                                {row.commissionPercent}% Override
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {row.subordinateName} <span className="font-mono text-slate-500 text-[10px]">({row.subordinateCode})</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold font-mono text-slate-900 text-[13px]">
                          ₹{row.collectionAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-black font-mono text-emerald-700 text-[13px]">
                          ₹{row.commissionEarned.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {row.isClosed ? (
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            Closed ({row.closingNumber})
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                            Pending Closing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800 text-xs">
                <tr>
                  <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-slate-500">
                    Grand Total ({items.length} Entries):
                  </td>
                  <td className="p-3 text-right font-black font-mono text-slate-900 text-[13px]">
                    ₹{(summary.totalCollection || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-black font-mono text-emerald-700 text-[14px]">
                    ₹{(summary.totalCommission || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorBusinessReportPage;
