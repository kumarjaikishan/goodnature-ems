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
  Loader2
} from 'lucide-react';
import PageLoader from '../../../components/common/PageLoader';
import ProductReceivePaymentForm from './ProductReceivePaymentForm';
import ProductReceiptModal from './components/ProductReceiptModal';

const ProductCollectionsPage = ({ initialView }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAddRoute = location.pathname.endsWith('/add');
  const [view, setView] = useState(initialView || (isAddRoute ? 'add' : 'list'));
  const [targetBookingId, setTargetBookingId] = useState(null);

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

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');

  // Modal for Printable Receipt
  const [selectedCollectionForReceipt, setSelectedCollectionForReceipt] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

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
      setSummary(data.summary || {
        totalCollected: 0,
        totalPrincipalPaid: 0,
        totalLateFinePaid: 0,
        totalLateFineRebate: 0,
        totalReceiptsCount: 0,
      });
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

  const [deletingReceiptId, setDeletingReceiptId] = useState(null);

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

    if (result) {
      const col = {
        receiptNumber: result.receiptNumber,
        bookingNumber: result.booking?.bookingNumber,
        bookingId: result.booking?._id,
        bookingDate: result.booking?.bookingDate,
        product: result.booking?.productId || {},
        customer: result.booking?.customerId || {},
        sponsor: result.booking?.sponsorId || null,
        quantity: result.booking?.quantity || 1,
        unitPrice: result.booking?.unitPrice || 0,
        totalAmount: result.booking?.totalAmount || 0,
        tenureMonths: result.booking?.tenureMonths || 24,
        amountPaid: result.collectedAmount,
        principalPaid: result.principalPaid,
        lateFinePaid: result.lateFinePaid,
        lateFineRebate: result.lateFineRebate,
        paymentMode: result.paymentMode,
        transactionReference: result.transactionReference,
        paymentDate: result.paymentDate,
        remarks: result.remarks,
      };
      setSelectedCollectionForReceipt(col);
      setReceiptModalOpen(true);
    }
  };

  // Filter Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (paymentModeFilter !== 'ALL' && c.paymentMode?.toLowerCase() !== paymentModeFilter.toLowerCase()) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const rMatch = c.receiptNumber?.toLowerCase().includes(q);
      const bMatch = c.bookingNumber?.toLowerCase().includes(q);
      const cNameMatch = c.customer?.name?.toLowerCase().includes(q);
      const cCodeMatch = c.customer?.customerCode?.toLowerCase().includes(q) || c.customer?.customerId?.toLowerCase().includes(q);
      const cMobMatch = c.customer?.mobile?.includes(q);
      const pNameMatch = c.product?.productName?.toLowerCase().includes(q);
      return rMatch || bMatch || cNameMatch || cCodeMatch || cMobMatch || pNameMatch;
    });
  }, [collections, searchQuery, paymentModeFilter]);

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
      <div className="p-4 sm:p-6 lg:p-8">
        <ProductReceivePaymentForm
          onBack={() => navigate('/dashboard/plots/collections/products')}
          onSuccess={handleCollectionSuccess}
          preselectedBookingId={targetBookingId}
        />

        {/* Printable Receipt Modal if opened */}
        {receiptModalOpen && selectedCollectionForReceipt && (
          <ProductReceiptModal
            open={receiptModalOpen}
            onClose={() => {
              setReceiptModalOpen(false);
              setSelectedCollectionForReceipt(null);
            }}
            collection={selectedCollectionForReceipt}
          />
        )}
      </div>
    );
  }

  // Otherwise render 'list' view
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => fetchCollections(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 shadow-2xs transition cursor-pointer disabled:opacity-50"
          title="Refresh Collections"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <button
          onClick={() => handleOpenAddCollection()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Collection</span>
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{summary.totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Principal: <span className="font-semibold text-slate-700">₹{summary.totalPrincipalPaid.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Fine Collected</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            ₹{summary.totalLateFinePaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600/90 font-medium mt-1">
            Standard 24% p.a. Overdue Interest
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Fine Rebates</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            ₹{summary.totalLateFineRebate.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600/90 font-medium mt-1">
            Waivers granted during collection
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bills Issued</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {summary.totalReceiptsCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Verified Customer Receipts
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, customer, mobile, booking #..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Payment Mode:</label>
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition cursor-pointer"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="online">Online / UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
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
              {searchQuery || paymentModeFilter !== 'ALL'
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
                  <th className="p-3.5 text-right">Amount Collected</th>
                  <th className="p-3.5">Mode &amp; Ref</th>
                  <th className="p-3.5 text-center pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                {filteredCollections.map((col) => (
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
                        {col.paymentMode || 'Cash'}
                      </span>
                      {col.transactionReference && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate max-w-[120px]">
                          Ref: {col.transactionReference}
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3.5 pr-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCollectionForReceipt(col);
                            setReceiptModalOpen(true);
                          }}
                          className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                          title="Print Receipt Bill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {receiptModalOpen && selectedCollectionForReceipt && (
        <ProductReceiptModal
          open={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedCollectionForReceipt(null);
          }}
          collection={selectedCollectionForReceipt}
        />
      )}
    </div>
  );
};

export default ProductCollectionsPage;
