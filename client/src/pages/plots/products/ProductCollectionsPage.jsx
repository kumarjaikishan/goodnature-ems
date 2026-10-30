import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import {
  Receipt,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  X,
  Percent,
  Clock,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Check,
} from 'lucide-react';
import PageLoader from '../../../components/common/PageLoader';
import ProductReceivePaymentForm from './ProductReceivePaymentForm';
import usePermission from '../../../utils/CheckPermission';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Modalbox from '@/components/custommodal/Modalbox';

const ProductCollectionsPage = ({ initialView }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAddRoute = location.pathname.endsWith('/add');
  const [view, setView] = useState(initialView || (isAddRoute ? 'add' : 'list'));
  const [targetBookingId, setTargetBookingId] = useState(null);

  const canCreate = usePermission('plot_collection', 2);
  const canUpdate = usePermission('plot_collection', 3);
  const canDelete = usePermission('plot_collection', 4);

  const [collections, setCollections] = useState([]);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalPrincipalPaid: 0,
    totalLateFinePaid: 0,
    totalLateFineRebate: 0,
    totalReceiptsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Approval & Rejection Modal State
  const [approvingCol, setApprovingCol] = useState(null);
  const [rejectingCol, setRejectingCol] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingReceiptId, setDeletingReceiptId] = useState(null);

  // Sync view state when route changes
  useEffect(() => {
    const shouldBeAdd = Boolean(initialView === 'add' || location.pathname.endsWith('/add'));
    setView(shouldBeAdd ? 'add' : 'list');
  }, [location.pathname, initialView]);

  // Fetch Collections List
  const fetchCollections = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/plots/product-collections');
      const data = res.data?.data || {};
      setCollections(data.collections || []);
      setSummary(
        data.summary || {
          totalCollected: 0,
          totalPrincipalPaid: 0,
          totalLateFinePaid: 0,
          totalLateFineRebate: 0,
          totalReceiptsCount: 0,
        }
      );
    } catch {
      toast.error('Failed to load product collection records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchCollections();
    }
  }, [view, fetchCollections]);

  const handleOpenAddCollection = (bookingId = null) => {
    setTargetBookingId(bookingId);
    navigate('/dashboard/plots/collections/products/add' + (bookingId ? `?bookingId=${bookingId}` : ''));
  };

  const handleApproveCollection = async () => {
    if (!approvingCol) return;
    setActionLoading(true);
    try {
      const bookingId = approvingCol.bookingId || approvingCol.booking?._id || 'unknown';
      const rNum = encodeURIComponent(approvingCol.receiptNumber);
      await api.put(`/plots/product-collections/${bookingId}/${rNum}/approve`);
      toast.success(`Receipt #${approvingCol.receiptNumber} approved & realized into company ledger`);
      setApprovingCol(null);
      fetchCollections(true);
      window.dispatchEvent(new CustomEvent('ems-refresh-approvals'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCollection = async () => {
    if (!rejectingCol) return;
    setActionLoading(true);
    try {
      const bookingId = rejectingCol.bookingId || rejectingCol.booking?._id || 'unknown';
      const rNum = encodeURIComponent(rejectingCol.receiptNumber);
      await api.put(`/plots/product-collections/${bookingId}/${rNum}/reject`, {
        reason: rejectionReason.trim() || 'Rejected by Admin',
      });
      toast.success(`Receipt #${rejectingCol.receiptNumber} marked as REJECTED`);
      setRejectingCol(null);
      setRejectionReason('');
      fetchCollections(true);
      window.dispatchEvent(new CustomEvent('ems-refresh-approvals'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCollection = async (col) => {
    if (!col || !col.receiptNumber) return;

    const proceed = await confirmDialog({
      title: 'Delete Collection Receipt?',
      text: `Are you sure you want to delete receipt ${col.receiptNumber} for ₹${(Number(col.amountPaid) || 0).toLocaleString('en-IN')}? This will revert the paid installment status and recalculate the customer ledger.`,
      confirmText: 'Yes, Delete Receipt',
      cancelText: 'Cancel',
      isDanger: true,
    });

    if (!proceed) return;

    setDeletingReceiptId(col.receiptNumber);
    const toastId = toast.loading(`Deleting receipt ${col.receiptNumber}...`);
    try {
      const res = await api.delete(
        `/plots/product-collections/${col.bookingId || 'unknown'}/${encodeURIComponent(col.receiptNumber)}`
      );
      toast.dismiss(toastId);
      toast.success(res.data?.message || `Receipt ${col.receiptNumber} deleted successfully`);
      fetchCollections(true);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to delete collection receipt');
    } finally {
      setDeletingReceiptId(null);
    }
  };

  const handleCollectionSuccess = (result) => {
    navigate('/dashboard/plots/collections/products');
    fetchCollections(true);
    window.dispatchEvent(new CustomEvent('ems-refresh-approvals'));

    const isPending = (result?.status || '').toUpperCase() === 'PENDING' || (result?.paymentMode && String(result.paymentMode).toLowerCase() !== 'cash' && (result?.status || '').toUpperCase() !== 'APPROVED');

    if (isPending) {

      return;
    }

    if (result) {
      const receiptId = result._id || result.receiptNumber;
      if (receiptId) {
        navigate(`/dashboard/plots/receipts/${receiptId}`);
      }
    }
  };

  // Filter Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Payment mode filter
      if (paymentModeFilter !== 'ALL' && c.paymentMode?.toLowerCase() !== paymentModeFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const cStatus = (c.status || (String(c.paymentMode).toLowerCase() === 'cash' ? 'APPROVED' : 'PENDING')).toUpperCase();
        if (cStatus !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const rMatch = c.receiptNumber?.toLowerCase().includes(q);
      const bMatch = c.bookingNumber?.toLowerCase().includes(q);
      const cNameMatch = c.customer?.name?.toLowerCase().includes(q);
      const cCodeMatch =
        c.customer?.customerCode?.toLowerCase().includes(q) ||
        c.customer?.customerId?.toLowerCase().includes(q);
      const cMobMatch = c.customer?.mobile?.includes(q);
      const pNameMatch = c.product?.productName?.toLowerCase().includes(q);
      const refMatch = c.transactionReference?.toLowerCase().includes(q);
      return rMatch || bMatch || cNameMatch || cCodeMatch || cMobMatch || pNameMatch || refMatch;
    });
  }, [collections, searchQuery, paymentModeFilter, statusFilter]);

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // If in 'add' view, render full-page collection form
  if (view === 'add') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
        <ProductReceivePaymentForm
          onBack={() => navigate('/dashboard/plots/collections/products')}
          onSuccess={handleCollectionSuccess}
          preselectedBookingId={targetBookingId}
        />
      </div>
    );
  }

  // Otherwise render 'list' view
  return (
    <div className="p-4 sm:p-5 bg-slate-50 min-h-screen space-y-3.5 font-sans">
      {/* Top Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-0 pb-0.5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Product Collections &amp; Receipts</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage plot product installment receipts, maker-checker approvals &amp; collections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchCollections(true)}
            disabled={refreshing}
            startIcon={RefreshCw}
            className="border border-slate-200"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddCollection()}
              startIcon={Plus}
            >
              Add New Collection
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Realized</span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            ₹{summary.totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Principal: <span className="font-semibold text-slate-700">₹{summary.totalPrincipalPaid.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Fine Collected</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 tracking-tight">
            ₹{summary.totalLateFinePaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600/90 font-medium mt-0.5">
            Standard 24% p.a. Overdue Interest
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Fine Rebates</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 tracking-tight">
            ₹{summary.totalLateFineRebate.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600/90 font-medium mt-0.5">
            Waivers granted during collection
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bills Issued</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {summary.totalReceiptsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Verified Customer Receipts
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            size="sm"
            startIcon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, customer, booking, UTR..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Status:</span>
            <div className="w-36">
              <Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
            </div>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Mode:</span>
            <div className="w-44">
              <Select
                size="sm"
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Payment Modes' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'online', label: 'Online / UPI' },
                  { value: 'bank_transfer', label: 'Bank Transfer / NEFT / RTGS' },
                  { value: 'cheque', label: 'Cheque' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collections Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <PageLoader size="medium" />
            <p className="text-xs text-slate-500 mt-3 font-medium">Loading collection records...</p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Product Collections Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || paymentModeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No receipts matched your search filters. Try adjusting your query.'
                : 'No collections recorded yet. Click "Add New Collection" to record your first product EMI collection.'}
            </p>
            <button
              onClick={() => handleOpenAddCollection()}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Record New Collection
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Receipt # &amp; Date</th>
                  <th className="p-3.5">Customer &amp; Associate</th>
                  <th className="p-3.5">Product &amp; Specs</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">Mode &amp; Ref</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {filteredCollections.map((col) => {
                  const colStatus = (col.status || (String(col.paymentMode).toLowerCase() === 'cash' ? 'APPROVED' : 'PENDING')).toUpperCase();
                  const isPending = colStatus === 'PENDING';
                  const isRejected = colStatus === 'REJECTED';

                  return (
                    <tr key={col._id} className="hover:bg-teal-50/30 transition-colors">
                      {/* Receipt # & Date */}
                      <td className="p-3.5 pl-5">
                        <div className="font-mono font-bold text-teal-900 text-xs">{col.receiptNumber}</div>
                        <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(col.paymentDate)}</span>
                        </div>
                      </td>

                      {/* Customer & Associate */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{col.customer?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-slate-600">{col.customer?.customerCode || col.customer?.customerId}</span>
                          {col.sponsor?.name && (
                            <span className="text-teal-700 font-medium truncate max-w-[120px]">
                              • BA: {col.sponsor.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Product & Specs */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{col.product?.productName || 'Micro Plot'}</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {col.product?.dimensionLabel || ''} • <b className="text-teal-700">{col.quantity || 1} units</b>
                        </div>
                      </td>

                      {/* Amount Breakdown */}
                      <td className="p-3.5 text-right">
                        <div className="text-sm font-black text-slate-900 tracking-tight">
                          ₹{(Number(col.amountPaid) || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1.5 mt-0.5">
                          <span>Pr: ₹{(Number(col.principalPaid) || 0).toLocaleString('en-IN')}</span>
                          {col.lateFinePaid > 0 && (
                            <span className="text-amber-700 font-bold">• Fine: ₹{col.lateFinePaid.toLocaleString('en-IN')}</span>
                          )}
                          {col.lateFineRebate > 0 && (
                            <span className="text-emerald-700 font-medium">• Reb: ₹{col.lateFineRebate.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </td>

                      {/* Payment Mode */}
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {col.paymentMode === 'bank_transfer' ? 'Bank Transfer' : (col.paymentMode || 'Cash')}
                        </span>
                        {col.transactionReference && (
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-[130px]" title={col.transactionReference}>
                            Ref: {col.transactionReference}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {isPending ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap"
                              title="Pending Manager / Admin verification"
                            >
                              <Clock size={11} /> Pending
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400">
                              Requires Approval
                            </span>
                          </div>
                        ) : isRejected ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap cursor-help"
                            title={col.rejectionReason || 'Rejected by Admin'}
                          >
                            <XCircle size={11} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <CheckCircle2 size={11} /> Approved
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3.5 pr-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && canUpdate && (
                            <>
                              <button
                                onClick={() => setApprovingCol(col)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                                title="Approve Bill & Realize into Ledger (Authorized)"
                              >
                                <Check size={12} />
                                <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingCol(col);
                                  setRejectionReason('');
                                }}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                                title="Reject Collection"
                              >
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                          {isPending && !canUpdate && (
                            <span
                              className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md whitespace-nowrap cursor-help"
                              title="Awaiting authorized Admin or Manager approval"
                            >
                              Awaiting Auth
                            </span>
                          )}

                          <button
                            onClick={() => {
                              const recId = col._id || col.receiptNumber;
                              navigate(`/dashboard/plots/receipts/${recId}`);
                            }}
                            className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                            title="Print Receipt Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteCollection(col)}
                              disabled={deletingReceiptId === col.receiptNumber}
                              className="p-1.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              title="Delete Receipt"
                            >
                              {deletingReceiptId === col.receiptNumber ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Collection Modal */}
      <Modalbox
        open={Boolean(approvingCol)}
        onClose={() => setApprovingCol(null)}
        title={`Approve Product Collection: ${approvingCol?.receiptNumber || ''}`}
        maxWidth="max-w-md"
      >
        <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-3">
          <p>
            Are you approving the receipt of payment for{' '}
            <strong className="text-slate-900 font-bold">
              {approvingCol?.customer?.name || 'Customer'}
            </strong>{' '}
            ({approvingCol?.bookingNumber})?
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs text-emerald-900 font-medium">
            <div className="flex justify-between">
              <span>Amount to Realize:</span>
              <strong className="text-emerald-800 font-bold font-mono">
                ₹{(Number(approvingCol?.amountPaid) || 0).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <strong className="uppercase">{approvingCol?.paymentMode}</strong>
            </div>
            {approvingCol?.transactionReference && (
              <div className="flex justify-between">
                <span>Reference / UTR / Cheque:</span>
                <strong className="font-mono">{approvingCol.transactionReference}</strong>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Upon approval, this payment will be realized into the company ledger, update customer outstanding dues, mark installments as paid, and sync sponsor commission schedules.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setApprovingCol(null)}>
            Cancel
          </Button>
          <Button variant="success" size="sm" loading={actionLoading} onClick={handleApproveCollection}>
            Yes, Approve &amp; Realize
          </Button>
        </div>
      </Modalbox>

      {/* Reject Collection Modal */}
      <Modalbox
        open={Boolean(rejectingCol)}
        onClose={() => setRejectingCol(null)}
        title={`Reject Product Collection: ${rejectingCol?.receiptNumber || ''}`}
        maxWidth="max-w-md"
      >
        <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-3">
          <p>
            Rejecting payment of{' '}
            <strong className="text-rose-700 font-bold">
              ₹{(Number(rejectingCol?.amountPaid) || 0).toLocaleString('en-IN')}
            </strong>{' '}
            ({rejectingCol?.paymentMode?.toUpperCase()}). This payment will not be credited into the customer ledger.
          </p>

          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Rejection *</label>
            <textarea
              className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none p-2.5 rounded-xl font-medium text-xs text-slate-800 transition min-h-[70px] resize-none"
              placeholder="e.g. UTR not verified in bank statement / Cheque dishonoured..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setRejectingCol(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={actionLoading} onClick={handleRejectCollection}>
            Confirm Rejection
          </Button>
        </div>
      </Modalbox>
    </div>
  );
};

export default ProductCollectionsPage;
