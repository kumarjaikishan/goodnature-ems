import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import DataTable from '@/components/common/DataTable';
import Modalbox from '../../../components/custommodal/Modalbox';
import PageLoader from '../../../components/common/PageLoader';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Printer,
  TrendingUp,
  CheckCircle2,
  Building2,
  Users,
  IndianRupee,
  Receipt,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  ChevronDown,
  ChevronRight,
  Gift
} from 'lucide-react';
import { swal } from '../../../utils/confirmDialog';

const getEntryRateLabel = (entry) => {
  const inc = Number(entry.incentivePercent || 0);
  if (inc > 0) {
    return `+${inc}% Inc.`;
  }
  return '0% Inc.';
};

const renderTransactionNatureBadge = (entry) => {
  const isPrd = entry.businessType === 'PLOT_PRODUCT';
  if (isPrd) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        Plot Product Collection
      </span>
    );
  }

  const isInv = entry.isInvestment || entry.businessType === 'INVESTMENT_RD_FD';
  if (isInv) {
    const accType = entry.accountId?.accountType || 'RD/FD';
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
        {accType} Plan Deposit
      </span>
    );
  }


  const rType = entry.receiptId?.receiptType;
  if (rType === 'DOWNPAYMENT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
        Down Payment (D.P)
      </span>
    );
  }
  if (rType === 'INSTALLMENT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        EMI Installment
      </span>
    );
  }
  if (rType === 'BOOKING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
        Booking Token
      </span>
    );
  }
  if (rType === 'FULL_PAYMENT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
        Full Payment
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
      Plot Collection
    </span>
  );
};

const renderSponsorTransactions = (entries, isPartner = false) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-slate-100">
        No individual collection details recorded for this associate/partner in this period.
      </div>
    );
  }

  const totalBusiness = entries.reduce((sum, e) => sum + Number(e.collectionAmount || 0), 0);
  const totalInc = entries.reduce((sum, e) => sum + Number(e.incentiveAmount ?? e.amount ?? 0), 0);

  return (
    <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 shadow-inner my-2 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-teal-100 text-teal-800">
            <Receipt size={13} />
          </span>
          <span className="text-xs font-bold text-slate-800">
            Period Collection Receipts
          </span>
          <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
            {entries.length} {entries.length === 1 ? 'Receipt' : 'Receipts'}
          </span>
        </div>
        <div className="text-[11px] font-medium text-slate-600 flex items-center gap-3">
          <span>Total Business: <strong className="text-slate-800">₹{totalBusiness.toLocaleString('en-IN')}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Target Incentive: <strong className="text-emerald-700 font-bold">₹{totalInc.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[650px]">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="p-2.5">Receipt & Date</th>
              <th className="p-2.5">Booking / Plot</th>
              <th className="p-2.5">Customer & Transaction Nature</th>
              <th className="p-2.5 text-right">Collection Amt</th>
              <th className="p-2.5 text-center">Achieved Slab Inc. %</th>
              <th className="p-2.5 text-right">Incentive to Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry, idx) => {
              const rcp = entry.receiptId;
              const isInv = entry.isInvestment || entry.businessType === 'INVESTMENT_RD_FD';
              const rcpNo = rcp?.receiptNumber || 'N/A';
              const rcpDate = (rcp?.paymentDate || rcp?.createdAt || entry.createdAt)
                ? new Date(rcp?.paymentDate || rcp?.createdAt || entry.createdAt).toLocaleDateString('en-IN')
                : '-';
              const bkgNo = entry.bookingId?.bookingNumber || (isInv ? `${entry.accountId?.accountType || 'RD/FD'} Plan` : 'Direct');
              const plotNo = entry.bookingId?.plotId?.plotNumber || '';
              const bookingSponsor = entry.bookingId?.sponsorId;
              const custName = entry.customerId?.name || 'Customer';
              const rateStr = getEntryRateLabel(entry);

              return (
                <tr key={entry._id || idx} className="hover:bg-teal-50/20 transition">
                  <td className="p-2.5 font-mono text-slate-700">
                    <div className="font-bold text-slate-800">{rcpNo}</div>
                    <div className="text-[11px] text-slate-400">{rcpDate}</div>
                  </td>
                  <td className="p-2.5 text-slate-700">
                    {isInv ? (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${entry.accountId?.accountType === 'FD' ? 'bg-amber-100 text-amber-900 border border-amber-300/80' : 'bg-sky-100 text-sky-900 border border-sky-300/80'}`}>
                            {entry.accountId?.accountType || 'RD'} Plan
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {entry.accountId?.accountNumber || bkgNo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Tenure: {entry.accountId?.tenureMonths || entry.bookingId?.tenureMonths || 0} Months
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-800">{bkgNo}</div>
                        {plotNo && <div className="text-[11px] text-slate-500 font-medium">Plot #{plotNo}</div>}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-700">
                    <div className="font-medium text-slate-800">{custName}</div>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {renderTransactionNatureBadge(entry)}
                      {isPartner && bookingSponsor && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          (By {bookingSponsor.name || 'Associate'})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-700">
                    ₹{Number(entry.collectionAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-teal-100/80 text-teal-800">
                      {rateStr}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-700">
                    ₹{Number(entry.incentiveAmount ?? entry.amount ?? 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const formatRateBreakdown = (rateStr, effectivePct, isOverride = false) => {
  const num = Number(effectivePct || 0);
  if (num > 0) {
    return `+${num}% Target Incentive`;
  }
  return '0% Incentive';
};

const PlotIncentivesPage = () => {
  const navigate = useNavigate();
  const customStyles = useCustomStyles();

  const [activeTab, setActiveTab] = useState('TARGET_INCENTIVE'); // 'TARGET_INCENTIVE' | 'EXTRA_INCENTIVE'
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Details Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClosingDetails, setSelectedClosingDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedDetailsSponsors, setExpandedDetailsSponsors] = useState({});

  const toggleDetailsSponsorExpand = (spId) => {
    setExpandedDetailsSponsors((prev) => ({
      ...prev,
      [spId]: !prev[spId],
    }));
  };

  // Fetch all closings list filtered by closingType
  const fetchClosings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plots/closings', {
        params: {
          search: search.trim(),
          closingType: activeTab,
        },
      });
      setClosings(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load incentives list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosings();
  }, [search, activeTab]);

  // Navigate to New Incentive Closing Page
  const handleOpenCreateModal = (type = activeTab) => {
    navigate(`/dashboard/plots/incentives/new?type=${type}`);
  };

  // Navigate to Edit Incentive Closing Page
  const handleOpenEditModal = (closing) => {
    navigate(`/dashboard/plots/incentives/edit/${closing._id}?type=${closing.closingType || activeTab}`);
  };

  // Open Details Modal
  const handleOpenDetails = async (closingId) => {
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/plots/closings/${closingId}`);
      setSelectedClosingDetails(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load incentive details');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle Delete / Reverse Closing
  const handleDeleteClosing = (closing) => {
    const isExtra = closing.closingType === 'EXTRA_INCENTIVE';
    const typeLabel = isExtra ? 'Extra Incentive & Rewards' : 'Target Incentive';
    swal({
      title: `Reverse & Delete ${closing.closingNumber}?`,
      text: `Are you sure you want to delete "${closing.closingName}"? All ${closing.transactionCount || 0} associated ${typeLabel.toLowerCase()} payouts will be restored to unclosed state. No payments or collection records will be lost.`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes, Reverse & Delete'],
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const res = await api.delete(`/plots/closings/${closing._id}`);
          toast.success(res.data.message || `${typeLabel} closing reversed and deleted successfully`);
          fetchClosings();
          if (showDetailsModal && selectedClosingDetails?._id === closing._id) {
            setShowDetailsModal(false);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || `Failed to delete ${typeLabel.toLowerCase()} closing`);
        }
      }
    });
  };

  // Columns for main table
  const columns = [
    {
      name: 'Incentive Batch # & Name',
      selector: (row) => row.closingName,
      sortable: true,
      minWidth: '220px',
      cell: (row) => {
        const isExtra = row.closingType === 'EXTRA_INCENTIVE';
        return (
          <div className="py-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <span>{row.closingName}</span>
              {isExtra && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                  Extra / Reward
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
              <span className={`font-bold px-2 py-0.5 rounded-md border font-mono text-[11px] ${
                isExtra
                  ? 'bg-purple-50 text-purple-800 border-purple-200/60'
                  : 'bg-teal-50 text-teal-800 border-teal-200/60'
              }`}>
                {row.closingNumber}
              </span>
              <span>•</span>
              <span>{row.sponsorCount || 0} Associates/Partners</span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'Evaluation Period',
      selector: (row) => row.startDate,
      sortable: true,
      minWidth: '200px',
      cell: (row) => (
        <div className="text-xs font-medium text-slate-700 py-1">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Calendar size={13} className={row.closingType === 'EXTRA_INCENTIVE' ? 'text-purple-600' : 'text-teal-600'} />
            <span>
              {new Date(row.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-slate-400 font-normal">to</span>
            <span>
              {new Date(row.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {row.transactionCount || 0} collection payouts credited
          </div>
        </div>
      ),
    },
    {
      name: 'Total Collection (Business)',
      selector: (row) => row.totalCollection,
      sortable: true,
      right: true,
      cell: (row) => (
        <div className="text-right py-1 font-bold text-slate-800 text-xs">
          <div className="text-sm text-slate-900 font-black">
            ₹{Number(row.totalCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {row.transactionCount || 0} Receipts
          </div>
        </div>
      ),
    },
    {
      name: 'Total Incentive Credited',
      selector: (row) => row.totalCommission,
      sortable: true,
      right: true,
      cell: (row) => {
        const isExtra = row.closingType === 'EXTRA_INCENTIVE';
        const displayAmt = isExtra
          ? (row.totalExtraIncentiveCommission ?? row.totalCommission ?? 0)
          : (row.totalIncentiveCommission ?? row.totalCommission ?? 0);
        return (
          <div className="text-right py-1">
            <div className={`text-sm font-black ${isExtra ? 'text-purple-700' : 'text-emerald-700'}`}>
              ₹{Number(displayAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {row.sponsorCount || 0} Partners/Associates
            </div>
          </div>
        );
      },
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      sortable: true,
      center: true,
      width: '110px',
      cell: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
          row.status === 'CLOSED'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
            : 'bg-rose-50 text-rose-700 border border-rose-200/70'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      name: 'Actions',
      right: true,
      width: '130px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5 py-1">
          <button
            onClick={() => handleOpenDetails(row._id)}
            title="View Incentive Details & Breakdown"
            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition border border-teal-200/60 cursor-pointer"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenEditModal(row)}
            title="Edit Incentive Dates"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200/60 cursor-pointer"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDeleteClosing(row)}
            title="Reverse and Delete Incentive Batch"
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200/60 cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        {/* Navigation Tabs Bar */}
        <div className="flex gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('TARGET_INCENTIVE')}
            className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'TARGET_INCENTIVE'
                ? 'border-teal-800 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp size={16} /> Target Incentive Closings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EXTRA_INCENTIVE')}
            className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'EXTRA_INCENTIVE'
                ? 'border-teal-800 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift size={16} /> Extra Incentive &amp; Rewards Closings
          </button>
        </div>

        {/* Dynamic Action Button for Active Tab */}
        <div className="flex items-center gap-2.5 pb-2 sm:pb-0">
          {activeTab === 'TARGET_INCENTIVE' ? (
            <button
              onClick={() => handleOpenCreateModal('TARGET_INCENTIVE')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-700/20 active:scale-[0.98] transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Process Target Incentive</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenCreateModal('EXTRA_INCENTIVE')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-700/20 active:scale-[0.98] transition cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Process Extra Incentive / Reward</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border ${activeTab === 'EXTRA_INCENTIVE' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Batches</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{closings.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Closed Collection Business</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              ₹{closings.reduce((sum, c) => sum + (c.totalCollection || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border ${activeTab === 'EXTRA_INCENTIVE' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {activeTab === 'EXTRA_INCENTIVE' ? 'Total Extra Incentives' : 'Total Target Incentives'}
            </div>
            <div className={`text-xl font-black mt-0.5 ${activeTab === 'EXTRA_INCENTIVE' ? 'text-purple-700' : 'text-emerald-700'}`}>
              ₹{closings.reduce((sum, c) => sum + (c.totalCommission || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Associates Benefited</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">
              {closings.reduce((sum, c) => sum + (c.sponsorCount || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Closing History Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'EXTRA_INCENTIVE' ? 'extra incentive' : 'target incentive'} batches...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{closings.length}</strong> {activeTab === 'EXTRA_INCENTIVE' ? 'extra incentive / reward' : 'target incentive'} batches
          </div>
        </div>

        {/* DataTable */}
        {loading ? (
          <div className="py-12">
            <PageLoader title="Loading Incentive Batches..." subtitle="Fetching period histories and associate summaries" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={closings}
            pagination
            paginationPerPage={10}
            customStyles={customStyles}
            noDataComponent={
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Gift className="mx-auto text-slate-300" size={36} />
                <p className="text-sm font-semibold text-slate-600">
                  No {activeTab === 'EXTRA_INCENTIVE' ? 'extra incentive / reward' : 'target incentive'} batches recorded yet.
                </p>
                <p className="text-xs text-slate-400">
                  Click "{activeTab === 'EXTRA_INCENTIVE' ? 'Process Extra Incentive / Reward' : 'Process Target Incentive'}" above to calculate payouts.
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* ── CLOSING DETAILS MODAL ── */}
      <Modalbox open={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="6xl">
        <div className="p-6 bg-white rounded-2xl w-full max-h-[92vh] flex flex-col space-y-4">
          {detailsLoading || !selectedClosingDetails ? (
            <div className="py-16">
              <PageLoader title="Loading Incentive Details..." subtitle="Fetching comprehensive settlement breakdown" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
                    <Gift size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{selectedClosingDetails.closingName}</h3>
                      <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        {selectedClosingDetails.closingNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Period: {new Date(selectedClosingDetails.startDate).toLocaleDateString('en-IN')} — {new Date(selectedClosingDetails.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Print Statement</span>
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Period Business Collection</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    ₹{Number(selectedClosingDetails.totalCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedClosingDetails.transactionCount || 0} Collection Receipts
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Benefited Associates & Partners</div>
                  <div className="text-lg font-black text-slate-800 mt-0.5">
                    {selectedClosingDetails.sponsors?.length || 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Eligible for {selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'extra rewards' : 'target incentives'}
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'bg-purple-50/80 border-purple-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
                  <div className={`text-[10px] uppercase font-bold ${selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'text-purple-800' : 'text-emerald-800'}`}>
                    Total Net {selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'Extra Reward' : 'Incentive'} Credited
                  </div>
                  <div className={`text-lg font-black mt-0.5 ${selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'text-purple-700' : 'text-emerald-700'}`}>
                    ₹{Number(selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? (selectedClosingDetails.totalExtraIncentiveCommission ?? selectedClosingDetails.totalCommission ?? 0) : (selectedClosingDetails.totalIncentiveCommission ?? selectedClosingDetails.totalCommission ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[11px] font-medium mt-0.5 ${selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'text-purple-800' : 'text-emerald-800'}`}>
                    {selectedClosingDetails.closingType === 'EXTRA_INCENTIVE' ? 'Extra reward % & slab gifts only' : 'Variable target incentive part only'}
                  </div>
                </div>
              </div>

              {/* Per Sponsor Breakdown Tables - Split for Associates and Partners */}
              <div className="flex-1 overflow-auto space-y-5">
                {/* ── 1. BUSINESS ASSOCIATES TABLE ── */}
                {(() => {
                  const isModalExtra = selectedClosingDetails.closingType === 'EXTRA_INCENTIVE';
                  const associateSponsors = (selectedClosingDetails.sponsors || []).filter((s) => !s.isDeveloper);
                  const totalAssociateBusiness = associateSponsors.reduce((sum, s) => sum + Number(s.totalBusiness || 0), 0);
                  const totalAssociatePayout = associateSponsors.reduce((sum, s) => sum + Number(isModalExtra ? (s.extraIncentiveCommission || 0) : (s.incentiveCommission ?? s.totalCommission ?? 0)), 0);

                  return (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded-md ${isModalExtra ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            <Users size={14} />
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Business Associates (Direct Plots & RD/FD Collections)
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isModalExtra ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {associateSponsors.length} {associateSponsors.length === 1 ? 'Associate' : 'Associates'}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 flex items-center gap-3">
                          <span>Associate Business: <strong className="text-slate-800">₹{totalAssociateBusiness.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>Net {isModalExtra ? 'Extra Reward' : 'Incentive'}: <strong className={`font-bold ${isModalExtra ? 'text-purple-700' : 'text-emerald-700'}`}>₹{totalAssociatePayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      </div>

                      <div className={`border rounded-xl overflow-x-auto bg-white shadow-2xs ${isModalExtra ? 'border-purple-100' : 'border-emerald-100'}`}>
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead className={`sticky top-0 border-b text-slate-700 font-bold select-none ${isModalExtra ? 'bg-purple-50/70 border-purple-100' : 'bg-emerald-50/70 border-emerald-100'}`}>
                            <tr>
                              <th className="p-3">Associate Details</th>
                              <th className="p-3 text-right">Achieved Period Business</th>
                              <th className="p-3 text-center">Achieved Slab</th>
                              <th className="p-3 text-center">{isModalExtra ? 'Extra % / Reward' : 'Target Incentive %'}</th>
                              <th className="p-3 text-right font-black">Net {isModalExtra ? 'Extra Reward' : 'Target Incentive'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {associateSponsors.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                                  No business associate records in this batch.
                                </td>
                              </tr>
                            ) : (
                              associateSponsors.map((sp) => {
                                const isExpanded = !!expandedDetailsSponsors[sp.sponsorId];
                                const entriesCount = sp.entries?.length || sp.transactionCount || 0;
                                const spPayout = isModalExtra ? (sp.extraIncentiveCommission || 0) : (sp.incentiveCommission ?? sp.totalCommission ?? 0);
                                return (
                                  <React.Fragment key={sp.sponsorId}>
                                    <tr
                                      onClick={() => toggleDetailsSponsorExpand(sp.sponsorId)}
                                      className={`hover:bg-slate-50/80 transition cursor-pointer ${isExpanded ? 'bg-slate-50/90 font-semibold' : ''}`}
                                    >
                                      <td className="p-3 font-bold text-slate-800">
                                        <div className="flex items-start gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleDetailsSponsorExpand(sp.sponsorId);
                                            }}
                                            className="mt-0.5 p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                                            title={isExpanded ? 'Collapse receipts' : 'Expand receipts'}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown size={15} className={isModalExtra ? 'text-purple-700' : 'text-emerald-700'} />
                                            ) : (
                                              <ChevronRight size={15} />
                                            )}
                                          </button>
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-sm">{sp.sponsorName?.replace(/\s*\([^)]*\)/g, '') || sp.sponsorName}</span>
                                              {entriesCount > 0 && (
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isModalExtra ? 'bg-purple-50 text-purple-700 border-purple-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'}`}>
                                                  {entriesCount} {entriesCount === 1 ? 'collection' : 'collections'}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-normal">
                                              Code: <span className="font-mono text-slate-600 font-bold">{sp.sponsorCode || sp.customerId}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right font-bold text-slate-900 text-sm">
                                        ₹{Number(sp.totalBusiness || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                                            {sp.slabLabel || 'Standard'}
                                          </span>
                                          {sp.rewardTitle && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                                              🎁 {sp.rewardTitle}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`inline-block font-mono font-bold px-2.5 py-0.5 rounded text-xs border ${isModalExtra ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                                          {isModalExtra ? (sp.rateStr || (sp.rewardTitle ? `🎁 ${sp.rewardTitle}` : '0% Extra')) : (sp.effectiveIncPct !== undefined ? `+${sp.effectiveIncPct}% Inc.` : (sp.rateStr || '0%'))}
                                        </span>
                                      </td>
                                      <td className={`p-3 text-right font-black text-sm ${isModalExtra ? 'text-purple-800 bg-purple-50/40' : 'text-emerald-800 bg-emerald-50/40'}`}>
                                        ₹{Number(spPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                    {isExpanded && (
                                      <tr className="bg-slate-50/70 border-b border-slate-200">
                                        <td colSpan={5} className="p-3">
                                          {renderSponsorTransactions(sp.entries)}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* ── 2. BUSINESS PARTNERS TABLE ── */}
                {(() => {
                  const isModalExtra = selectedClosingDetails.closingType === 'EXTRA_INCENTIVE';
                  const partnerSponsors = (selectedClosingDetails.sponsors || []).filter((s) => s.isDeveloper);
                  const totalPartnerBusiness = partnerSponsors.reduce((sum, s) => sum + Number(s.totalBusiness || 0), 0);
                  const totalPartnerPayout = partnerSponsors.reduce((sum, s) => sum + Number(isModalExtra ? (s.extraIncentiveCommission || 0) : (s.incentiveCommission ?? s.totalCommission ?? 0)), 0);

                  return (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-indigo-100 text-indigo-800">
                            <Building2 size={14} />
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Business Partners (Team Network Aggregate)
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                            {partnerSponsors.length} {partnerSponsors.length === 1 ? 'Partner' : 'Partners'}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 flex items-center gap-3">
                          <span>Network Business: <strong className="text-slate-800">₹{totalPartnerBusiness.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>Net {isModalExtra ? 'Extra Reward' : 'Incentive'}: <strong className="text-indigo-700 font-bold">₹{totalPartnerPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      </div>

                      <div className="border border-indigo-100 rounded-xl overflow-x-auto bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead className="bg-indigo-50/70 sticky top-0 border-b border-indigo-100 text-slate-700 font-bold select-none">
                            <tr>
                              <th className="p-3">Partner Details</th>
                              <th className="p-3 text-right">Team Aggregate Business</th>
                              <th className="p-3 text-center">Achieved Slab</th>
                              <th className="p-3 text-center">{isModalExtra ? 'Extra % / Reward' : 'Target Incentive %'}</th>
                              <th className="p-3 text-right font-black">Net {isModalExtra ? 'Extra Reward' : 'Target Incentive'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {partnerSponsors.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                                  No business partner records in this batch.
                                </td>
                              </tr>
                            ) : (
                              partnerSponsors.map((sp) => {
                                const isExpanded = !!expandedDetailsSponsors[sp.sponsorId];
                                const entriesCount = sp.entries?.length || sp.transactionCount || 0;
                                const spPayout = isModalExtra ? (sp.extraIncentiveCommission || 0) : (sp.incentiveCommission ?? sp.totalCommission ?? 0);
                                return (
                                  <React.Fragment key={sp.sponsorId}>
                                    <tr
                                      onClick={() => toggleDetailsSponsorExpand(sp.sponsorId)}
                                      className={`hover:bg-indigo-50/20 transition cursor-pointer ${isExpanded ? 'bg-indigo-50/40 font-semibold' : ''}`}
                                    >
                                      <td className="p-3 font-bold text-slate-800">
                                        <div className="flex items-start gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleDetailsSponsorExpand(sp.sponsorId);
                                            }}
                                            className="mt-0.5 p-1 rounded-md hover:bg-indigo-100 text-slate-500 hover:text-indigo-800 transition"
                                            title={isExpanded ? 'Collapse receipts' : 'Expand receipts'}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown size={15} className="text-indigo-700" />
                                            ) : (
                                              <ChevronRight size={15} />
                                            )}
                                          </button>
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-sm">{sp.sponsorName?.replace(/\s*\([^)]*\)/g, '') || sp.sponsorName}</span>
                                              {entriesCount > 0 && (
                                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60">
                                                  {entriesCount} {entriesCount === 1 ? 'collection' : 'collections'}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-normal">
                                              Code: <span className="font-mono text-slate-600 font-bold">{sp.sponsorCode || sp.customerId}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right font-bold text-slate-900 text-sm">
                                        ₹{Number(sp.totalBusiness || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                                            {sp.slabLabel || 'Standard'}
                                          </span>
                                          {sp.rewardTitle && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                                              🎁 {sp.rewardTitle}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="inline-block font-mono font-bold px-2.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
                                          {isModalExtra ? (sp.rateStr || (sp.rewardTitle ? `🎁 ${sp.rewardTitle}` : '0% Extra')) : (sp.effectiveIncPct !== undefined ? `+${sp.effectiveIncPct}% Inc.` : (sp.rateStr || '0%'))}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-black text-indigo-800 bg-indigo-50/40 text-sm">
                                        ₹{Number(spPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                    {isExpanded && (
                                      <tr className="bg-slate-50/70 border-b border-slate-200">
                                        <td colSpan={5} className="p-3">
                                          {renderSponsorTransactions(sp.entries, true)}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 text-xs text-slate-500">
                <div>
                  Created on <strong>{new Date(selectedClosingDetails.createdAt).toLocaleDateString('en-IN')}</strong> by <strong>{selectedClosingDetails.createdById?.name || 'System Admin'}</strong>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modalbox>
    </div>
  );
};

export default PlotIncentivesPage;
