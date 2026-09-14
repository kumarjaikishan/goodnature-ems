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
  ChevronRight
} from 'lucide-react';
import { swal } from '../../../utils/confirmDialog';

const getEntryRateLabel = (entry) => {
  const rate = Number(entry.commissionPercent || 0);
  let fix = Number(entry.fixedPercent || 0);
  let inc = Number(entry.incentivePercent || 0);
  if (fix === 0 && inc === 0 && rate > 0) {
    if (entry.commissionRole === 'DEVELOPER_OVERRIDE') {
      fix = 2;
      inc = +(rate - 2).toFixed(3);
    } else {
      fix = 5;
      inc = +(rate - 5).toFixed(2);
    }
  }
  if (fix > 0 || inc > 0) {
    return `${rate}% (${fix}% + ${inc}%)`;
  }
  return `${rate}%`;
};

const renderSponsorTransactions = (entries) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-slate-100">
        No individual collection details recorded for this sponsor in this period.
      </div>
    );
  }

  const directEntries = entries.filter(
    (e) => e.commissionRole === 'DIRECT_DEVELOPER' || e.commissionRole === 'PROMOTER'
  );
  const teamEntries = entries.filter(
    (e) => e.commissionRole === 'DEVELOPER_OVERRIDE'
  );

  const directBusinessTotal = directEntries.reduce((sum, e) => sum + Number(e.collectionAmount || 0), 0);
  const directCommTotal = directEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const teamBusinessTotal = teamEntries.reduce((sum, e) => sum + Number(e.collectionAmount || 0), 0);
  const teamCommTotal = teamEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 shadow-inner my-2 space-y-4">
      {/* SECTION 1: DIRECT BUSINESS */}
      {directEntries.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                <Receipt size={13} />
              </span>
              <span className="text-xs font-bold text-slate-800">
                Direct Business Collections
              </span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {directEntries.length} {directEntries.length === 1 ? 'Receipt' : 'Receipts'}
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-600 flex items-center gap-3">
              <span>Direct Business: <strong className="text-slate-800">₹{directBusinessTotal.toLocaleString('en-IN')}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Direct Comm: <strong className="text-emerald-700 font-bold">₹{directCommTotal.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="bg-emerald-50/60 border-b border-emerald-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2.5">Receipt & Date</th>
                  <th className="p-2.5">Booking / Plot</th>
                  <th className="p-2.5">Direct Customer</th>
                  <th className="p-2.5 text-center">Type</th>
                  <th className="p-2.5 text-right">Collection Amt</th>
                  <th className="p-2.5 text-center">Applied Slab Rate</th>
                  <th className="p-2.5 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directEntries.map((entry, idx) => {
                  const rcp = entry.receiptId;
                  const rcpNo = rcp?.receiptNumber || 'N/A';
                  const rcpDate = (rcp?.createdAt || entry.createdAt)
                    ? new Date(rcp?.createdAt || entry.createdAt).toLocaleDateString('en-IN')
                    : '-';
                  const bkgNo = entry.bookingId?.bookingNumber || 'Direct';
                  const plotNo = entry.bookingId?.plotId?.plotNumber || '';
                  const custName = entry.customerId?.name || 'Unknown';
                  const rateStr = getEntryRateLabel(entry);

                  return (
                    <tr key={entry._id || idx} className="hover:bg-emerald-50/20 transition">
                      <td className="p-2.5 font-mono text-slate-700">
                        <div className="font-bold text-slate-800">{rcpNo}</div>
                        <div className="text-[11px] text-slate-400">{rcpDate}</div>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <div className="font-semibold text-slate-800">{bkgNo}</div>
                        {plotNo && <div className="text-[11px] text-slate-500 font-medium">Plot #{plotNo}</div>}
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <div className="font-medium text-slate-800">{custName}</div>
                        {entry.customerId?.customerCode && (
                          <div className="text-[11px] text-slate-400 font-mono">{entry.customerId.customerCode}</div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Direct
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-700">
                        ₹{Number(entry.collectionAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-emerald-100/80 text-emerald-800">
                          {rateStr}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">
                        ₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: TEAM BUSINESS */}
      {teamEntries.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-100 text-indigo-800">
                <Users size={13} />
              </span>
              <span className="text-xs font-bold text-slate-800">
                Team Business Collections
              </span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                {teamEntries.length} {teamEntries.length === 1 ? 'Receipt' : 'Receipts'}
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-600 flex items-center gap-3">
              <span>Team Business: <strong className="text-slate-800">₹{teamBusinessTotal.toLocaleString('en-IN')}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Team Comm: <strong className="text-indigo-700 font-bold">₹{teamCommTotal.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-indigo-100 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="bg-indigo-50/60 border-b border-indigo-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2.5">Receipt & Date</th>
                  <th className="p-2.5">Booking / Plot</th>
                  <th className="p-2.5">Associate / Customer</th>
                  <th className="p-2.5 text-center">Type</th>
                  <th className="p-2.5 text-right">Collection Amt</th>
                  <th className="p-2.5 text-center">Applied Slab Rate</th>
                  <th className="p-2.5 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamEntries.map((entry, idx) => {
                  const rcp = entry.receiptId;
                  const rcpNo = rcp?.receiptNumber || 'N/A';
                  const rcpDate = (rcp?.createdAt || entry.createdAt)
                    ? new Date(rcp?.createdAt || entry.createdAt).toLocaleDateString('en-IN')
                    : '-';
                  const bkgNo = entry.bookingId?.bookingNumber || 'Direct';
                  const plotNo = entry.bookingId?.plotId?.plotNumber || '';
                  const bookingSponsor = entry.bookingId?.sponsorId;
                  const custName = entry.customerId?.name || 'Unknown';
                  const rateStr = getEntryRateLabel(entry);

                  return (
                    <tr key={entry._id || idx} className="hover:bg-indigo-50/20 transition">
                      <td className="p-2.5 font-mono text-slate-700">
                        <div className="font-bold text-slate-800">{rcpNo}</div>
                        <div className="text-[11px] text-slate-400">{rcpDate}</div>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        <div className="font-semibold text-slate-800">{bkgNo}</div>
                        {plotNo && <div className="text-[11px] text-slate-500 font-medium">Plot #{plotNo}</div>}
                      </td>
                      <td className="p-2.5 text-slate-700">
                        {bookingSponsor && (
                          <div className="text-[11px] font-semibold text-indigo-900">
                            Associate: {bookingSponsor.name || 'Team Associate'} <span className="font-mono text-indigo-600 font-normal">({bookingSponsor.sponsorCode || ''})</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-600 font-medium">
                          Customer: {custName}
                        </div>
                        {entry.customerId?.customerCode && (
                          <div className="text-[11px] text-slate-400 font-mono">{entry.customerId.customerCode}</div>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Team
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-700">
                        ₹{Number(entry.collectionAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-indigo-100/80 text-indigo-800">
                          {rateStr}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-indigo-700">
                        ₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const formatRateBreakdown = (rateStr, effectivePct, isOverride = false) => {
  if (rateStr && String(rateStr).includes('(')) return rateStr;
  const num = Number(effectivePct || (rateStr ? parseFloat(rateStr) : 0)) || 0;
  if (num <= 0) return '0%';
  if (isOverride) {
    const inc = +(num - 2).toFixed(3);
    return inc > 0 ? `${num}% (2% + ${inc}%)` : `${num}% (2%)`;
  } else {
    const inc = +(num - 5).toFixed(2);
    return inc > 0 ? `${num}% (5% + ${inc}%)` : `${num}% (5%)`;
  }
};

const PlotClosingsPage = () => {
  const navigate = useNavigate();
  const customStyles = useCustomStyles();

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

  // Fetch all closings list
  const fetchClosings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plots/closings', {
        params: { search: search.trim() },
      });
      setClosings(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load closings list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosings();
  }, [search]);

  // Navigate to New Closing Page
  const handleOpenCreateModal = () => {
    navigate('/dashboard/plots/closings/new');
  };

  // Navigate to Edit Closing Page
  const handleOpenEditModal = (closing) => {
    navigate(`/dashboard/plots/closings/edit/${closing._id}`);
  };

  // Open Details Modal
  const handleOpenDetails = async (closingId) => {
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/plots/closings/${closingId}`);
      setSelectedClosingDetails(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load closing details');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle Delete / Reverse Closing
  const handleDeleteClosing = (closing) => {
    swal({
      title: `Reverse & Delete ${closing.closingNumber}?`,
      text: `Are you sure you want to delete "${closing.closingName}"? All ${closing.transactionCount || 0} associated commissions will be restored to unclosed state. No payments or collection records will be lost.`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes, Reverse & Delete'],
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        try {
          const res = await api.delete(`/plots/closings/${closing._id}`);
          toast.success(res.data.message || 'Closing reversed and deleted successfully');
          fetchClosings();
          if (showDetailsModal && selectedClosingDetails?._id === closing._id) {
            setShowDetailsModal(false);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete closing');
        }
      }
    });
  };

  // Columns for main table
  const columns = [
    {
      name: 'Closing # & Name',
      selector: (row) => row.closingName,
      sortable: true,
      minWidth: '220px',
      cell: (row) => (
        <div className="py-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
            <span>{row.closingName}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
            <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-md border border-teal-200/60 font-mono text-[11px]">
              {row.closingNumber}
            </span>
            <span>•</span>
            <span>{row.sponsorCount || 0} Sponsors</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Closing Period',
      selector: (row) => row.startDate,
      sortable: true,
      minWidth: '200px',
      cell: (row) => (
        <div className="text-xs font-medium text-slate-700 py-1">
          <div className="flex items-center gap-1 font-semibold text-slate-800">
            <Calendar size={13} className="text-teal-600" />
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
            Direct: ₹{Number(row.directBusinessTotal || 0).toLocaleString('en-IN')} | Ind: ₹{Number(row.indirectBusinessTotal || 0).toLocaleString('en-IN')}
          </div>
        </div>
      ),
    },
    {
      name: 'Total Commission Credited',
      selector: (row) => row.totalCommission,
      sortable: true,
      right: true,
      cell: (row) => (
        <div className="text-right py-1">
          <div className="text-sm font-black text-emerald-700">
            ₹{Number(row.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Direct: ₹{Number(row.directCommissionTotal || 0).toLocaleString('en-IN')} | Ind (2%): ₹{Number(row.indirectCommissionTotal || 0).toLocaleString('en-IN')}
          </div>
        </div>
      ),
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
            title="View Closing Details & Per-Sponsor Breakdown"
            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition border border-teal-200/60 cursor-pointer"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenEditModal(row)}
            title="Edit Closing Dates / Expand / Reduce"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200/60 cursor-pointer"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDeleteClosing(row)}
            title="Reverse and Delete Closing"
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="text-teal-700" size={26} />
            Closing System
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Process bi-weekly/monthly period closings, aggregate direct & indirect sponsor collections, and generate audit-locked statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs md:text-sm font-bold shadow-sm shadow-teal-700/20 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus size={17} />
            <span>New Period Closing</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Closings</div>
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
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Closed Commissions</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              ₹{closings.reduce((sum, c) => sum + (c.totalCommission || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sponsors Benefited</div>
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
              placeholder="Search by closing name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{closings.length}</strong> closing batches
          </div>
        </div>

        {/* DataTable */}
        {loading ? (
          <div className="py-12">
            <PageLoader title="Loading Closing Batches..." subtitle="Fetching period histories and sponsor summaries" />
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
                <Receipt className="mx-auto text-slate-300" size={36} />
                <p className="text-sm font-semibold text-slate-600">No closing batches recorded yet.</p>
                <p className="text-xs text-slate-400">Click "New Period Closing" above to close collection commissions for a date range.</p>
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
              <PageLoader title="Loading Closing Details..." subtitle="Fetching comprehensive settlement breakdown" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
                    <Receipt size={20} />
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Business Collection</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    ₹{Number(selectedClosingDetails.totalCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Direct Customer Business</div>
                  <div className="text-base font-black text-slate-800 mt-0.5">
                    ₹{Number(selectedClosingDetails.directBusinessTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    Comm: ₹{Number(selectedClosingDetails.directCommissionTotal || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Team / Associate Business</div>
                  <div className="text-base font-black text-indigo-700 mt-0.5">
                    ₹{Number(selectedClosingDetails.indirectBusinessTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                    Comm: ₹{Number(selectedClosingDetails.indirectCommissionTotal || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Total Net Commission</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">
                    ₹{Number(selectedClosingDetails.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {selectedClosingDetails.sponsors?.length || 0} Sponsors Benefited
                  </div>
                </div>
              </div>

              {/* Per Sponsor Breakdown Table */}
              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-bold select-none">
                    <tr>
                      <th className="p-3">Sponsor Info</th>
                      <th className="p-3 text-right">Direct Business</th>
                      <th className="p-3 text-right">Direct Comm. (%)</th>
                      <th className="p-3 text-right">Team / Associate Business</th>
                      <th className="p-3 text-right">Team Comm. (%)</th>
                      <th className="p-3 text-right">Total Business</th>
                      <th className="p-3 text-right font-black">Net Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedClosingDetails.sponsors || []).map((sp) => {
                      const isExpanded = !!expandedDetailsSponsors[sp.sponsorId];
                      const entriesCount = sp.entries?.length || sp.transactionCount || 0;
                      return (
                        <React.Fragment key={sp.sponsorId}>
                          <tr
                            onClick={() => toggleDetailsSponsorExpand(sp.sponsorId)}
                            className={`hover:bg-teal-50/20 transition cursor-pointer ${isExpanded ? 'bg-teal-50/40 font-semibold' : ''}`}
                          >
                            <td className="p-3 font-bold text-slate-800">
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDetailsSponsorExpand(sp.sponsorId);
                                  }}
                                  className="mt-0.5 p-1 rounded-md hover:bg-teal-100/60 text-slate-500 hover:text-teal-800 transition"
                                  title={isExpanded ? 'Collapse collection transactions' : 'Expand collection transactions'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown size={15} className="text-teal-700" />
                                  ) : (
                                    <ChevronRight size={15} />
                                  )}
                                </button>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm">{sp.sponsorName?.replace(/\s*\([^)]*\)/g, '') || sp.sponsorName}</span>
                                    {entriesCount > 0 && (
                                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full border border-slate-200/60">
                                        {entriesCount} {entriesCount === 1 ? 'collection' : 'collections'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-normal">
                                    Code: <span className="font-mono text-slate-600 font-bold">{sp.sponsorCode || sp.customerId}</span>
                                    {sp.isDeveloper ? ' • Business Partner' : ' • Business Associate'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-700">
                              ₹{Number(sp.directBusiness || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right">
                              <div className="font-bold text-emerald-700">
                                ₹{Number(sp.directCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                              {sp.directBusiness > 0 && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {formatRateBreakdown(sp.directRatesStr, sp.directEffectivePct, false)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-semibold text-slate-700">
                              ₹{Number(sp.indirectBusiness || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right">
                              <div className="font-bold text-indigo-600">
                                ₹{Number(sp.indirectCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                              {sp.indirectBusiness > 0 && (
                                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {formatRateBreakdown(sp.indirectRatesStr, sp.indirectEffectivePct, true)}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              ₹{Number(sp.totalBusiness || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-black text-emerald-800 bg-emerald-50/40 text-sm">
                              ₹{Number(sp.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td colSpan={7} className="p-3">
                                {renderSponsorTransactions(sp.entries)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
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

export default PlotClosingsPage;
