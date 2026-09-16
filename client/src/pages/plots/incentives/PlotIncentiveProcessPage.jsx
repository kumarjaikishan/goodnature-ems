import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PageLoader from '../../../components/common/PageLoader';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Receipt,
  Sparkles,
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Search,
  RefreshCw,
  Gift
} from 'lucide-react';

const getEntryRateLabel = (entry) => {
  const inc = Number(entry.incentivePercent || 0);
  const fix = Number(entry.fixedPercent || 0);
  if (inc > 0) {
    return `+${inc}% Inc.`;
  }
  return '0% Inc.';
};

const formatRateBreakdown = (rateStr, effectivePct, isOverride = false) => {
  const num = Number(effectivePct || 0);
  if (num > 0) {
    return `+${num}% Target Incentive`;
  }
  return '0% Incentive';
};

const PlotIncentiveProcessPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const customStyles = useCustomStyles();

  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [formData, setFormData] = useState({
    closingName: '',
    startDate: '',
    endDate: '',
    remarks: '',
  });
  const [editingClosing, setEditingClosing] = useState(null);

  // Live Preview State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Expand / Collapse Sponsor Rows
  const [expandedSponsors, setExpandedSponsors] = useState({});

  const toggleSponsorExpand = (spId) => {
    setExpandedSponsors((prev) => ({
      ...prev,
      [spId]: !prev[spId],
    }));
  };

  const expandAllSponsors = () => {
    if (!previewData?.sponsors) return;
    const all = {};
    previewData.sponsors.forEach((sp) => {
      all[sp.sponsorId] = true;
    });
    setExpandedSponsors(all);
  };

  const collapseAllSponsors = () => {
    setExpandedSponsors({});
  };

  // Refs for race condition prevention
  const isSubmittingRef = useRef(false);
  const lastPreviewKeyRef = useRef('');
  const previewAbortControllerRef = useRef(null);

  // Initialize Default Form Data
  useEffect(() => {
    if (isEditMode) {
      const fetchClosingToEdit = async () => {
        setInitialLoading(true);
        try {
          const res = await api.get(`/plots/closings/${id}`);
          const closing = res.data.data;
          setEditingClosing(closing);
          const start = new Date(closing.startDate).toISOString().split('T')[0];
          const end = new Date(closing.endDate).toISOString().split('T')[0];
          setFormData({
            closingName: closing.closingName || '',
            startDate: start,
            endDate: end,
            remarks: closing.remarks || '',
          });
          fetchPreview(start, end, closing._id, true);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to load incentive details');
          navigate('/dashboard/plots/incentives');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchClosingToEdit();
    } else {
      // Default to previous month
      const today = new Date();
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthName = prevMonthDate.toLocaleString('default', { month: 'long' });
      const prevYear = prevMonthDate.getFullYear();

      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const defaultStart = formatDate(firstDayPrevMonth);
      const defaultEnd = formatDate(lastDayPrevMonth);

      setFormData({
        closingName: `${prevMonthName} ${prevYear} Incentive`,
        startDate: defaultStart,
        endDate: defaultEnd,
        remarks: '',
      });

      fetchPreview(defaultStart, defaultEnd, null, true);
    }
  }, [id, isEditMode]);

  // Load preview when date range changes
  const fetchPreview = async (startDate, endDate, excludeClosingId = null, force = false) => {
    if (isSubmittingRef.current) return;

    if (!startDate || !endDate) {
      setPreviewData(null);
      setPreviewError('');
      return;
    }

    const key = `${startDate}_${endDate}_${excludeClosingId || ''}`;
    if (!force && lastPreviewKeyRef.current === key) {
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setPreviewError('Start Date cannot be after End Date.');
      setPreviewData(null);
      return;
    }

    if (previewAbortControllerRef.current) {
      previewAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    previewAbortControllerRef.current = abortController;

    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await api.get('/plots/closings/preview', {
        params: { startDate, endDate, excludeClosingId },
        signal: abortController.signal,
      });
      if (isSubmittingRef.current) return;
      setPreviewData(res.data.data);
      lastPreviewKeyRef.current = key;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || isSubmittingRef.current) {
        return;
      }
      setPreviewError(err.response?.data?.message || 'Failed to calculate preview for this date range');
      setPreviewData(null);
    } finally {
      if (!isSubmittingRef.current) {
        setPreviewLoading(false);
      }
    }
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFetchBreakdown = () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both Period Start Date and End Date');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start Date cannot be after End Date');
      return;
    }
    fetchPreview(formData.startDate, formData.endDate, isEditMode ? editingClosing?._id : null, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.closingName.trim()) {
      toast.error('Please enter a name for this incentive closing batch.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (!previewData || previewData.transactionCount === 0) {
      toast.error('No unclosed collection or incentive records found in this period.');
      return;
    }

    if (previewAbortControllerRef.current) {
      previewAbortControllerRef.current.abort();
    }
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      if (isEditMode) {
        const res = await api.put(`/plots/closings/${editingClosing._id}`, formData);
        toast.success(res.data.message || 'Incentive batch updated successfully');
      } else {
        const res = await api.post('/plots/closings', formData);
        toast.success(res.data.message || 'Incentive batch processed successfully');
      }
      navigate('/dashboard/plots/incentives');
    } catch (err) {
      toast.error(err.response?.data?.message || (isEditMode ? 'Failed to update incentive batch' : 'Failed to process incentive batch'));
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const renderSponsorTransactions = (entries) => {
    if (!entries || entries.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-slate-100">
          No individual collection details recorded for this associate/partner in this period.
        </div>
      );
    }

    const directEntries = entries.filter(
      (e) => e.commissionRole === 'DIRECT_DEVELOPER' || e.commissionRole === 'PROMOTER'
    );
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
                <th className="p-2.5">Customer / Associate</th>
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
                      {bookingSponsor && (
                        <div className="text-[11px] text-slate-500">
                          Associate: {bookingSponsor.name || ''} {bookingSponsor.sponsorCode ? `(${bookingSponsor.sponsorCode})` : ''}
                        </div>
                      )}
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

  if (initialLoading) {
    return <PageLoader title="Loading incentive details..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 space-y-6 pb-24">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/incentives')}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Back to Incentives"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">
                {isEditMode ? `Edit Incentive: ${editingClosing?.closingNumber || ''}` : 'Process New Period Incentive'}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Plot Sales
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Define period dates, review real-time collection volume, per-partner slab incentives, and generate audit-locked statements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/incentives')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || previewLoading || !previewData || previewData.transactionCount === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isEditMode ? 'Updating Incentive...' : 'Processing Incentive...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>{isEditMode ? 'Save & Update Incentive' : 'Confirm & Close Period'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Period Configuration Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar size={16} className="text-teal-700" />
          <h2 className="text-sm font-bold text-slate-800">Incentive Evaluation Parameters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Incentive Batch Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.closingName}
              onChange={(e) => setFormData({ ...formData, closingName: e.target.value })}
              placeholder="e.g., August 2026 Incentive"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-slate-50/50 focus:bg-white transition"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Period Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-slate-50/50 focus:bg-white transition"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Period End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-slate-50/50 focus:bg-white transition"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleFetchBreakdown}
              disabled={previewLoading || !formData.startDate || !formData.endDate}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-[34px]"
              title="Fetch period collections and calculate progressive incentive slabs"
            >
              {previewLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Search size={14} />
                  <span>Fetch Period</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Remarks / Internal Notes (Optional)
          </label>
          <input
            type="text"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add any audit or operational remarks for this incentive period..."
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-slate-50/50 focus:bg-white transition"
          />
        </div>
      </form>

      {/* Live Financial Breakdown & Preview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-teal-700" />
            <h2 className="text-sm font-bold text-slate-800">Live Period Breakdown Preview</h2>
            {previewData && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {formData.startDate} to {formData.endDate}
              </span>
            )}
          </div>

          {previewData?.sponsors?.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={expandAllSponsors}
                className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={collapseAllSponsors}
                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {previewError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{previewError}</span>
          </div>
        )}

        {previewLoading ? (
          <div className="p-12 text-center text-teal-800 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-teal-600" />
            <p className="text-xs font-semibold">Calculating unclosed collections and progressive incentive slabs...</p>
          </div>
        ) : previewData ? (
          <div className="space-y-4">
            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Period Collection Business</div>
                  <Building2 size={16} className="text-teal-700" />
                </div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  ₹{Number(previewData.totalCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Across {previewData.transactionCount || 0} Collection Receipts
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Associates & Partners</div>
                  <Users size={16} className="text-indigo-600" />
                </div>
                <div className="text-xl font-black text-slate-800 mt-1">
                  {previewData.sponsorCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Benefited in selected period
                </div>
              </div>

              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Total Net Incentive Payable</div>
                  <TrendingUp size={16} className="text-emerald-700" />
                </div>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  ₹{Number(previewData.totalIncentiveCommission ?? previewData.totalCommission ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  Variable target incentive part only
                </div>
              </div>
            </div>

            {/* Note banner explaining variable incentive vs instant fixed commission */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
              <Sparkles size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Target Incentive Payout: </span>
                <span>Instant fixed commissions (5% BA / 2% BP) are credited immediately on receipt collection. This batch evaluates the period collection volume and credits strictly the achieved <strong>Target Incentive (variable part)</strong> into the ledger.</span>
              </div>
            </div>

            {/* TABLES CONTAINER - SPLIT ASSOCIATE AND PARTNER TABLES */}
            {previewData.sponsors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200">
                No unclosed collections found for the selected date range.
              </div>
            ) : (
              <div className="space-y-6">
                {/* ── 1. BUSINESS ASSOCIATES TABLE ── */}
                {(() => {
                  const associateSponsors = previewData.sponsors.filter((s) => !s.isDeveloper);
                  const totalAssociateBusiness = associateSponsors.reduce((sum, s) => sum + Number(s.totalBusiness || 0), 0);
                  const totalAssociateInc = associateSponsors.reduce((sum, s) => sum + Number(s.incentiveCommission ?? s.totalCommission ?? 0), 0);

                  return (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                            <Users size={14} />
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            Business Associates (Direct Plots & RD/FD Collections)
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {associateSponsors.length} {associateSponsors.length === 1 ? 'Associate' : 'Associates'}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 flex items-center gap-3">
                          <span>Associate Business: <strong className="text-slate-800">₹{totalAssociateBusiness.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>Net Incentive: <strong className="text-emerald-700 font-bold">₹{totalAssociateInc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      </div>

                      <div className="border border-emerald-100 rounded-xl overflow-x-auto bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead className="bg-emerald-50/70 border-b border-emerald-100 text-slate-700 font-bold select-none">
                            <tr>
                              <th className="p-3">Associate Details</th>
                              <th className="p-3 text-right">Achieved Period Business</th>
                              <th className="p-3 text-center">Achieved Slab</th>
                              <th className="p-3 text-center">Target Incentive %</th>
                              <th className="p-3 text-right font-black">Net Target Incentive to Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {associateSponsors.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                                  No business associate collections in this period.
                                </td>
                              </tr>
                            ) : (
                              associateSponsors.map((sp) => {
                                const isExpanded = !!expandedSponsors[sp.sponsorId];
                                const entriesCount = sp.entries?.length || sp.transactionCount || 0;
                                return (
                                  <React.Fragment key={sp.sponsorId}>
                                    <tr
                                      onClick={() => toggleSponsorExpand(sp.sponsorId)}
                                      className={`hover:bg-emerald-50/20 transition cursor-pointer ${isExpanded ? 'bg-emerald-50/40 font-semibold' : ''}`}
                                    >
                                      <td className="p-3 font-bold text-slate-800">
                                        <div className="flex items-start gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleSponsorExpand(sp.sponsorId);
                                            }}
                                            className="mt-0.5 p-1 rounded-md hover:bg-emerald-100 text-slate-500 hover:text-emerald-800 transition"
                                            title={isExpanded ? 'Collapse receipts' : 'Expand receipts'}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown size={15} className="text-emerald-700" />
                                            ) : (
                                              <ChevronRight size={15} />
                                            )}
                                          </button>
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-sm">{sp.sponsorName?.replace(/\s*\([^)]*\)/g, '') || sp.sponsorName}</span>
                                              {entriesCount > 0 && (
                                                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
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
                                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                                          {sp.slabLabel || 'Standard'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="inline-block font-mono font-bold px-2.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          {sp.effectiveIncPct !== undefined ? `+${sp.effectiveIncPct}% Inc.` : (sp.rateStr || '0%')}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-black text-emerald-800 bg-emerald-50/40 text-sm">
                                        ₹{Number(sp.incentiveCommission ?? sp.totalCommission ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  const partnerSponsors = previewData.sponsors.filter((s) => s.isDeveloper);
                  const totalPartnerBusiness = partnerSponsors.reduce((sum, s) => sum + Number(s.totalBusiness || 0), 0);
                  const totalPartnerInc = partnerSponsors.reduce((sum, s) => sum + Number(s.incentiveCommission ?? s.totalCommission ?? 0), 0);

                  return (
                    <div className="space-y-2 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-indigo-100 text-indigo-800">
                            <Building2 size={14} />
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            Business Partners (Team Network Aggregate)
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                            {partnerSponsors.length} {partnerSponsors.length === 1 ? 'Partner' : 'Partners'}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 flex items-center gap-3">
                          <span>Network Business: <strong className="text-slate-800">₹{totalPartnerBusiness.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>Net Incentive: <strong className="text-indigo-700 font-bold">₹{totalPartnerInc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      </div>

                      <div className="border border-indigo-100 rounded-xl overflow-x-auto bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead className="bg-indigo-50/70 border-b border-indigo-100 text-slate-700 font-bold select-none">
                            <tr>
                              <th className="p-3">Partner Details</th>
                              <th className="p-3 text-right">Team Aggregate Business</th>
                              <th className="p-3 text-center">Achieved Slab</th>
                              <th className="p-3 text-center">Target Incentive %</th>
                              <th className="p-3 text-right font-black">Net Target Incentive to Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {partnerSponsors.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                                  No business partner collections in this period.
                                </td>
                              </tr>
                            ) : (
                              partnerSponsors.map((sp) => {
                                const isExpanded = !!expandedSponsors[sp.sponsorId];
                                const entriesCount = sp.entries?.length || sp.transactionCount || 0;
                                return (
                                  <React.Fragment key={sp.sponsorId}>
                                    <tr
                                      onClick={() => toggleSponsorExpand(sp.sponsorId)}
                                      className={`hover:bg-indigo-50/20 transition cursor-pointer ${isExpanded ? 'bg-indigo-50/40 font-semibold' : ''}`}
                                    >
                                      <td className="p-3 font-bold text-slate-800">
                                        <div className="flex items-start gap-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleSponsorExpand(sp.sponsorId);
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
                                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                                          {sp.slabLabel || 'Standard'}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className="inline-block font-mono font-bold px-2.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800 border border-indigo-200">
                                          {sp.effectiveIncPct !== undefined ? `+${sp.effectiveIncPct}% Inc.` : (sp.rateStr || '0%')}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-black text-indigo-800 bg-indigo-50/40 text-sm">
                                        ₹{Number(sp.incentiveCommission ?? sp.totalCommission ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            Select valid start and end dates to calculate the incentive breakdown.
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-6 shadow-lg flex items-center justify-between">
        <div className="text-xs text-slate-500 hidden sm:block">
          {previewData?.sponsorCount > 0 ? (
            <span>
              Ready to lock <strong>{previewData.sponsorCount} partners</strong> and <strong>₹{Number(previewData.totalIncentiveCommission ?? previewData.totalCommission ?? 0).toLocaleString('en-IN')}</strong> in target incentives.
            </span>
          ) : (
            <span>Review parameters and preview above before finalizing the incentive batch.</span>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/incentives')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel & Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || previewLoading || !previewData || previewData.transactionCount === 0}
            className="px-6 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isEditMode ? 'Updating Incentive...' : 'Processing Incentive...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isEditMode ? 'Save & Update Incentive' : 'Confirm & Close Period'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlotIncentiveProcessPage;
