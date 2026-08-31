import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import DataTable from '@/components/common/DataTable';
import Modalbox from '../../components/custommodal/Modalbox';
import PageLoader from '../../components/common/PageLoader';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
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
  FileSpreadsheet
} from 'lucide-react';
import swal from 'sweetalert';

const PlotClosingsPage = () => {
  const navigate = useNavigate();
  const customStyles = useCustomStyles();

  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form States for New / Edit Closing
  const [formData, setFormData] = useState({
    closingName: '',
    startDate: '',
    endDate: '',
    remarks: '',
  });

  const [editingClosing, setEditingClosing] = useState(null);
  const [selectedClosingDetails, setSelectedClosingDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Live Preview State inside Create / Edit Modal
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // Load preview when date range changes
  const fetchPreview = async (startDate, endDate, excludeClosingId = null) => {
    if (!startDate || !endDate) {
      setPreviewData(null);
      setPreviewError('');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setPreviewError('Start Date cannot be after End Date.');
      setPreviewData(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await api.get('/plots/closings/preview', {
        params: { startDate, endDate, excludeClosingId },
      });
      setPreviewData(res.data.data);
    } catch (err) {
      setPreviewError(err.response?.data?.message || 'Failed to calculate preview for this date range');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (d) => d.toISOString().split('T')[0];

    const monthName = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();

    setFormData({
      closingName: `${monthName} ${year} Commission Closing`,
      startDate: formatDate(firstDay),
      endDate: formatDate(today),
      remarks: '',
    });
    setPreviewData(null);
    setPreviewError('');
    setShowCreateModal(true);

    // Initial preview trigger
    fetchPreview(formatDate(firstDay), formatDate(today));
  };

  // Open Edit Modal
  const handleOpenEditModal = (closing) => {
    setEditingClosing(closing);
    const start = new Date(closing.startDate).toISOString().split('T')[0];
    const end = new Date(closing.endDate).toISOString().split('T')[0];

    setFormData({
      closingName: closing.closingName,
      startDate: start,
      endDate: end,
      remarks: closing.remarks || '',
    });
    setShowEditModal(true);
    fetchPreview(start, end, closing._id);
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

  // Handle Create Closing Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.closingName.trim()) {
      toast.error('Please enter a name for this closing.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (!previewData || previewData.transactionCount === 0) {
      toast.error('No unclosed collection or commission records in this period.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/plots/closings', formData);
      toast.success(res.data.message || 'Closing batch created successfully');
      setShowCreateModal(false);
      fetchClosings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create closing');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Closing Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingClosing) return;

    setSubmitting(true);
    try {
      const res = await api.put(`/plots/closings/${editingClosing._id}`, formData);
      toast.success(res.data.message || 'Closing batch updated successfully');
      setShowEditModal(false);
      fetchClosings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update closing');
    } finally {
      setSubmitting(false);
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
            Commission Closing System
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
                <p className="text-sm font-semibold text-slate-600">No commission closing batches recorded yet.</p>
                <p className="text-xs text-slate-400">Click "New Period Closing" above to close collection commissions for a date range.</p>
              </div>
            }
          />
        )}
      </div>

      {/* ── CREATE CLOSING MODAL ── */}
      <Modalbox open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[900px] max-w-[95vw] space-y-5 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200/60">
                <Receipt size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Process New Commission Closing</h3>
                <p className="text-xs text-slate-500">Define closing period and review per-sponsor business & commission breakdown</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Closing Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. August 2026 Bi-Weekly Closing"
                  value={formData.closingName}
                  onChange={(e) => setFormData({ ...formData, closingName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData({ ...formData, startDate: newStart });
                    fetchPreview(newStart, formData.endDate);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setFormData({ ...formData, endDate: newEnd });
                    fetchPreview(formData.startDate, newEnd);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="Optional internal remark"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>
            </div>

            {/* Live Calculation Preview Section */}
            <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Live Period Breakdown Preview
                  </h4>
                </div>
                {previewLoading && (
                  <span className="text-xs font-semibold text-teal-700 animate-pulse">Calculating collections...</span>
                )}
              </div>

              {previewError ? (
                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{previewError}</span>
                </div>
              ) : previewData ? (
                <div className="space-y-4">
                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Business (Collection)</div>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        ₹{Number(previewData.totalCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Direct Collections</div>
                      <div className="text-base font-black text-slate-800 mt-0.5">
                        ₹{Number(previewData.directBusinessTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Indirect Downline (2%)</div>
                      <div className="text-base font-black text-indigo-700 mt-0.5">
                        ₹{Number(previewData.indirectBusinessTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200/70 bg-emerald-50/40 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-emerald-800">Total Net Commission</div>
                      <div className="text-base font-black text-emerald-700 mt-0.5">
                        ₹{Number(previewData.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Sponsor Table in Preview */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 text-slate-600 font-bold select-none">
                        <tr>
                          <th className="p-2.5">Sponsor</th>
                          <th className="p-2.5 text-right">Direct Business</th>
                          <th className="p-2.5 text-right">Direct Comm. (%)</th>
                          <th className="p-2.5 text-right">Indirect Business</th>
                          <th className="p-2.5 text-right">Indirect Override (%)</th>
                          <th className="p-2.5 text-right">Total Comm.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.sponsors.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                              No unclosed collections found in this period.
                            </td>
                          </tr>
                        ) : (
                          previewData.sponsors.map((sp) => (
                            <tr key={sp.sponsorId} className="hover:bg-slate-50 transition">
                              <td className="p-2.5 font-bold text-slate-800">
                                <div>{sp.sponsorName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {sp.sponsorCode || sp.customerId} {sp.isDeveloper ? '• Developer' : '• Promoter'}
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-medium text-slate-700">
                                ₹{Number(sp.directBusiness || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-right">
                                <div className="font-bold text-emerald-700">
                                  ₹{Number(sp.directCommission || 0).toLocaleString('en-IN')}
                                </div>
                                {sp.directBusiness > 0 && (
                                  <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded inline-block">
                                    {sp.directRatesStr || `${sp.directEffectivePct}%`}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-medium text-slate-700">
                                ₹{Number(sp.indirectBusiness || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-right">
                                <div className="font-bold text-indigo-600">
                                  ₹{Number(sp.indirectCommission || 0).toLocaleString('en-IN')}
                                </div>
                                {sp.indirectBusiness > 0 && (
                                  <div className="text-[10px] font-semibold text-indigo-800 bg-indigo-100/70 px-1.5 py-0.2 rounded inline-block">
                                    {sp.indirectRatesStr || `${sp.indirectEffectivePct}%`}
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-right font-black text-emerald-800 bg-emerald-50/30">
                                ₹{Number(sp.totalCommission || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Select start and end dates above to preview closing financials.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || previewLoading || !previewData || previewData.transactionCount === 0}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-teal-700/20 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? 'Processing Closing...' : 'Confirm & Close Period'}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* ── EDIT CLOSING MODAL (EXPAND / REDUCE PERIOD OR RENAME) ── */}
      <Modalbox open={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[900px] max-w-[95vw] space-y-5 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200/60">
                <Edit2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Edit Closing Period</h3>
                <p className="text-xs text-slate-500">Expand or reduce date range. Commissions will be auto-reattributed.</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Closing Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.closingName}
                  onChange={(e) => setFormData({ ...formData, closingName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData({ ...formData, startDate: newStart });
                    fetchPreview(newStart, formData.endDate, editingClosing?._id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    setFormData({ ...formData, endDate: newEnd });
                    fetchPreview(formData.startDate, newEnd, editingClosing?._id);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>
            </div>

            {/* Live Re-calculation preview */}
            <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-600" />
                  Adjusted Period Live Breakdown
                </h4>
                {previewLoading && <span className="text-xs text-blue-600 animate-pulse font-semibold">Updating...</span>}
              </div>

              {previewData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Business</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      ₹{Number(previewData.totalCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Direct Business</div>
                    <div className="text-base font-black text-slate-800 mt-0.5">
                      ₹{Number(previewData.directBusinessTotal || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Indirect Downline (2%)</div>
                    <div className="text-base font-black text-indigo-700 mt-0.5">
                      ₹{Number(previewData.indirectBusinessTotal || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <div className="text-[10px] uppercase font-bold text-emerald-800">Net Commission</div>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      ₹{Number(previewData.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || previewLoading || !previewData}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {submitting ? 'Saving Changes...' : 'Save & Update Closing'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* ── CLOSING DETAILS & PRINTABLE REPORT MODAL ── */}
      <Modalbox open={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[950px] max-w-[95vw] space-y-5 max-h-[92vh] flex flex-col">
          {detailsLoading || !selectedClosingDetails ? (
            <div className="py-16">
              <PageLoader title="Loading Closing Report..." subtitle="Fetching sponsor breakdown and receipts" />
            </div>
          ) : (
            <>
              {/* Header & Print Action */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-800">{selectedClosingDetails.closingName}</h3>
                    <span className="bg-teal-50 text-teal-800 border border-teal-200/70 font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                      {selectedClosingDetails.closingNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Period: <strong>{new Date(selectedClosingDetails.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> to <strong>{new Date(selectedClosingDetails.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </p>
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
                  <div className="text-[10px] uppercase font-bold text-slate-400">Indirect Downline (2%)</div>
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
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-700 font-bold select-none">
                    <tr>
                      <th className="p-3">Sponsor Info</th>
                      <th className="p-3 text-right">Direct Business</th>
                      <th className="p-3 text-right">Direct Comm. (%)</th>
                      <th className="p-3 text-right">Indirect Business</th>
                      <th className="p-3 text-right">Indirect Override (%)</th>
                      <th className="p-3 text-right">Total Business</th>
                      <th className="p-3 text-right font-black">Net Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedClosingDetails.sponsors || []).map((sp) => (
                      <tr key={sp.sponsorId} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          <div className="text-sm">{sp.sponsorName}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Code: <span className="font-mono text-slate-600 font-bold">{sp.sponsorCode || sp.customerId}</span>
                            {sp.isDeveloper ? ' • Developer Sponsor' : ' • Promoter'}
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
                              {sp.directRatesStr || `${sp.directEffectivePct || 0}%`}
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
                              {sp.indirectRatesStr || `${sp.indirectEffectivePct || 2}%`}
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
                    ))}
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
