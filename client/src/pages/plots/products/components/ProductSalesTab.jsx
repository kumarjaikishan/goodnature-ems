import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ShoppingCart,
  Award,
  BookOpen,
  Printer,
  FileText,
  Eye,
  Layers,
  MapPin,
  Building2,
  Minus,
  Check,
  Loader2,
  Calendar,
  User,
  ShieldCheck,
  Ruler,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  XCircle,
  Calculator,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { DateInput } from '../../../../components/ui/DateInput';
import { toast } from '../../../../utils/toast';
import { confirmDialog } from '../../../../utils/confirmDialog';
import api from '../../../../api/axios';

const ProductSalesTab = ({
  products,
  customers,
  tenures,
  bookings,
  loading,
  onRefresh,
  onOpenCertificate,
  onOpenLedger,
  onOpenCollect,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingBooking, setViewingBooking] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for creating a new product sale/booking
  const [form, setForm] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    customUnitPrice: '',
    tenureMonths: 24,
    paymentType: 'MONTHLY_INSTALLMENT',
    downPayment: '',
    bookingDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const selectedProduct = products.find((p) => p._id === form.productId);
  const selectedCustomer = customers.find((c) => c._id === form.customerId);

  const unitRate = form.customUnitPrice !== '' && Number(form.customUnitPrice) > 0
    ? Number(form.customUnitPrice)
    : Number(selectedProduct?.unitPrice || 0);

  const totalAmount = Math.max(0, Number(form.quantity || 1) * unitRate);
  const isFullPayment = form.paymentType === 'FULL_PAYMENT';
  const downPaymentAmt = isFullPayment ? totalAmount : 0;
  const remainingAmt = isFullPayment ? 0 : totalAmount;
  const tenure = Math.max(1, Number(form.tenureMonths) || 24);
  const monthlyEmi = isFullPayment
    ? 0
    : Math.round(totalAmount / tenure);


  const handleOpenSaleModal = () => {
    const firstPrd = products[0]?._id || '';
    const firstTenure = tenures[0]?.tenureMonths || 24;
    setForm({
      productId: firstPrd,
      customerId: '',
      quantity: 1,
      customUnitPrice: '',
      tenureMonths: firstTenure,
      paymentType: 'MONTHLY_INSTALLMENT',
      downPayment: '',
      paymentMode: 'cash',
      transactionReference: '',
      bookingDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setShowSaleModal(true);
  };

  const handleQuantityStep = (delta) => {
    const cur = Number(form.quantity) || 1;
    const next = Math.max(1, cur + delta);
    setForm({ ...form, quantity: next });
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (!form.productId) {
      toast.error('Please select a product');
      return;
    }
    if (!form.customerId) {
      toast.error('Please select a customer');
      return;
    }
    const qty = Number(form.quantity);
    if (!qty || qty < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        quantity: qty,
        customUnitPrice: form.customUnitPrice !== '' ? Number(form.customUnitPrice) : undefined,
        downPayment: isFullPayment ? totalAmount : 0,
        tenureMonths: Number(form.tenureMonths) || 24,
        paymentType: form.paymentType,
        paymentMode: isFullPayment ? (form.paymentMode || 'cash') : 'cash',
        transactionReference: isFullPayment ? (form.transactionReference || '') : '',
      };

      const res = await api.post('/plots/product-bookings', payload);
      toast.success(res.data?.message || 'Product sale recorded and booking generated successfully!');
      setShowSaleModal(false);
      onRefresh();

      if (res.data?.data && onOpenCertificate) {
        onOpenCertificate(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record product booking');
    } finally {
      setSubmitting(false);
    }
  };
  const [deletingBookingId, setDeletingBookingId] = useState(null);

  const handleDeleteBooking = async (booking) => {
    const proceed = await confirmDialog({
      title: `Delete Product Booking ${booking.bookingNumber}?`,
      text: `Are you sure you want to delete product booking "${booking.bookingNumber}" for customer ${booking.customerId?.name || 'Customer'} (${booking.quantity} units of ${booking.productId?.productName || 'Product'})? This will restore the product stock. Note: Bookings with installment payments collected cannot be deleted.`,
      confirmText: 'Delete Booking',
      cancelText: 'Cancel',
      isDanger: true,
    });

    if (!proceed) return;

    setDeletingBookingId(booking._id);
    const toastId = toast.loading(`Deleting booking ${booking.bookingNumber}...`);
    try {
      const res = await api.delete(`/plots/product-bookings/${booking._id}`);
      toast.dismiss(toastId);
      toast.success(res.data?.message || 'Product booking deleted successfully');
      onRefresh();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to delete booking');
    } finally {
      setDeletingBookingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.bookingNumber?.toLowerCase().includes(q) ||
      b.customerId?.name?.toLowerCase().includes(q) ||
      b.customerId?.customerCode?.toLowerCase().includes(q) ||
      b.productId?.productName?.toLowerCase().includes(q) ||
      b.sponsorId?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking #, customer, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none shrink-0"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/plots/investment-booking/new')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={15} /> New Investment Booking
        </button>
      </div>

      {/* Bookings Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-3">Booking # &amp; Date</th>
                <th className="p-3">Customer &amp; Associate</th>
                <th className="p-3">Product &amp; Qty</th>
                <th className="p-3 text-right">Valuation</th>
                <th className="p-3 text-right">Paid / Balance</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 space-y-2">
                    <ShoppingCart size={32} className="mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No investment bookings recorded yet.</p>
                    <p className="text-xs">Click "New Investment Booking" above to book fractional plot units for a customer.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const cust = b.customerId || {};
                  const prd = b.productId || {};
                  const spon = b.sponsorId || {};
                  const dims = b.dimensionsSnapshot || prd.dimensions || {};
                  const bDateStr = b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN') : '-';
                  const remaining = Math.max(0, (b.totalAmount || 0) - (b.totalPaid || 0));

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono">
                        <div className="font-bold text-slate-900">{b.bookingNumber}</div>
                        <div className="text-[11px] text-slate-400">{bDateStr}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800">{cust.name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {cust.customerCode || cust.customerId || ''}
                          {spon.name && (
                            <span className="text-teal-700 font-semibold"> • BA: {spon.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800">
                          {prd.productName || 'Micro Plot Unit'}
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-[10px] font-bold border border-teal-200">
                            x{b.quantity || 1}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {dims.dimensionLabel || `${dims.north ?? 1}x${dims.east ?? 2} ft`} ({b.totalAreaSqFt || (prd.areaSqFt ? prd.areaSqFt * (b.quantity || 1) : '-')} Sq.Ft)
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-black text-slate-900 font-mono">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-teal-800 font-semibold">
                          {b.paymentType === 'FULL_PAYMENT'
                            ? 'One Time Full'
                            : `EMI: ₹${Number(b.monthlyEmi || 0).toLocaleString('en-IN')}/mo`}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-bold text-emerald-700 font-mono">
                          ₹{Number(b.totalPaid || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-rose-600 font-medium">
                          Due: ₹{remaining.toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {b.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 py-1">
                          {/* 1. View Details */}
                          <button
                            type="button"
                            onClick={() => setViewingBooking(b)}
                            className="p-1.5 text-teal-800 hover:bg-teal-50 rounded-lg transition border border-teal-200/80 cursor-pointer shadow-2xs"
                            title="View Booking Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* 2. Print Certificate / Receipt */}
                          <button
                            type="button"
                            onClick={() => onOpenCertificate(b)}
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition border border-teal-200/60 cursor-pointer"
                            title="Print Booking Certificate / Receipt"
                          >
                            <Printer size={14} />
                          </button>

                          {/* 3. Print Product Agreement */}
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/plots/product-agreements/${b._id}`)}
                            className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition border border-purple-200/60 cursor-pointer"
                            title="Print Product Agreement"
                          >
                            <FileText size={14} />
                          </button>

                          {/* 4. View Customer Ledger */}
                          <button
                            type="button"
                            onClick={() => onOpenLedger(b)}
                            className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition border border-indigo-200/60 cursor-pointer"
                            title="View Customer Ledger & EMI Statement"
                          >
                            <BookOpen size={14} />
                          </button>

                          {/* 5. Maturity or Settlement Calculator */}
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/plots/interest-calculator?productBookingId=${b._id}&bookingNumber=${encodeURIComponent(b.bookingNumber)}`)}
                            className={`p-1.5 rounded-lg transition border cursor-pointer ${
                              b.status === 'CANCELLED'
                                ? 'text-amber-700 hover:bg-amber-50 border-amber-300 bg-amber-50/50'
                                : 'text-teal-700 hover:bg-teal-50 border-teal-200/80 bg-teal-50/30'
                            }`}
                            title="Maturity or settlement"
                          >
                            <Calculator size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sell Product / Booking Modal */}
      <Modalbox
        open={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        size="2xl"
        title="Sell Plot Product & Create Booking"
        subtitle="Issue new product certificate to customer under flexible one-time or installment schemes"
        icon={<ShoppingCart size={18} />}
      >
        <form onSubmit={handleSubmitSale} className="space-y-4 text-xs">
            {/* 1. Customer Selection (with auto-linked Business Associate) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                required
              >
                <option value="">-- Choose Verified Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.customerCode || c.customerId || 'ID'}) {c.sponsorId?.name ? `• Sponsoring BA: ${c.sponsorId.name}` : ''}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-700">
                  <span>Customer Mobile: <strong>{selectedCustomer.mobile || '-'}</strong></span>
                  <span>
                    Business Associate: <strong className="text-teal-800">{selectedCustomer.sponsorId?.name || 'Direct Company'}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Product Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Plot Product <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.productId}
                onChange={(e) => {
                  const prdId = e.target.value;
                  const prd = products.find((p) => p._id === prdId);
                  setForm({
                    ...form,
                    productId: prdId,
                    customUnitPrice: prd?.unitPrice || '',
                  });
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                required
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.productName} ({p.productCode}) — {p.dimensionLabel || `${p.dimensions?.north}x${p.dimensions?.east} ft`} • ₹{Number(p.unitPrice || 0).toLocaleString('en-IN')}{p.projectName ? ` [Project: ${p.projectName}]` : ''}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="mt-2 p-2.5 bg-teal-50/50 rounded-xl border border-teal-200/60 flex items-center justify-between text-[11px] text-teal-900">
                  <span>
                    Dimensions: <strong>{selectedProduct.dimensionLabel || `${selectedProduct.dimensions?.north}x${selectedProduct.dimensions?.east} ft`}</strong> ({selectedProduct.areaSqFt} Sq.Ft)
                  </span>
                  <span>
                    Catalog Unit Rate: <strong>₹{Number(selectedProduct.unitPrice || 0).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 3. Quantity Stepper & Unit Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity (Units / Pieces) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuantityStep(-1)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold shrink-0"
                  >
                    <Minus size={15} />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, quantity: val === '' ? '' : Number(val) });
                    }}
                    onBlur={() => {
                      if (!form.quantity || Number(form.quantity) < 1) {
                        setForm((prev) => ({ ...prev, quantity: 1 }));
                      }
                    }}
                    className="w-full text-center px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => handleQuantityStep(1)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold shrink-0"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unit Price (₹) <span className="text-slate-400 font-normal">(Editable)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={form.customUnitPrice}
                    onChange={(e) => setForm({ ...form, customUnitPrice: e.target.value })}
                    placeholder={selectedProduct?.unitPrice ? String(selectedProduct.unitPrice) : '5000'}
                    className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Payment Plan & Selected Tenure Period (Always selectable for both EMI and One-Time Full Payment) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.paymentType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setForm({
                      ...form,
                      paymentType: newType,
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                >
                  <option value="MONTHLY_INSTALLMENT">Monthly EMI Installments</option>
                  <option value="FULL_PAYMENT">One-Time Full Payment (100% Upfront)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {form.paymentType === 'FULL_PAYMENT' ? 'Deposit & Holding Period' : 'Selected Period (Tenure Months)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.tenureMonths}
                  onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-teal-900"
                >
                  {tenures.map((t) => {
                    const years = t.tenureMonths >= 12 ? ` (${+(t.tenureMonths / 12).toFixed(1)} ${t.tenureMonths === 12 ? 'Year' : 'Years'})` : '';
                    return (
                      <option key={t.tenureMonths} value={t.tenureMonths}>
                        {t.tenureMonths} Months{years}
                      </option>
                    );
                  })}
                </select>
                {form.paymentType === 'FULL_PAYMENT' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Recorded deposit holding duration for product delivery or money-back refund on completion.
                  </p>
                )}
              </div>
            </div>

            {/* 5. Payment Details & Dates */}
            {form.paymentType === 'FULL_PAYMENT' ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Upfront Payment Amount (₹) <span className="text-emerald-700 font-bold">(100% Full Paid)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="text"
                        readOnly
                        value={totalAmount.toLocaleString('en-IN')}
                        className="w-full pl-8 pr-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-teal-950 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <DateInput
                      label="Booking / Payment Date *"
                      value={form.bookingDate}
                      onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Payment Mode for Full Upfront Payment */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Payment Mode</label>
                    <select
                      value={form.paymentMode || 'cash'}
                      onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-600 outline-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI / QR Code</option>
                    </select>
                  </div>

                  {form.paymentMode !== 'cash' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Transaction Ref / Cheque # (Optional)</label>
                      <input
                        type="text"
                        value={form.transactionReference || ''}
                        onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                        placeholder="e.g. UTR / Cheque / Ref #"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <DateInput
                  label="Booking / Start Date *"
                  value={form.bookingDate}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Real-Time Total & EMI Summary Strip */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-4 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-teal-200 uppercase font-bold block">Total Valuation</span>
                <span className="text-base font-black font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-teal-200 uppercase font-bold block">
                  {form.paymentType === 'FULL_PAYMENT' ? 'Deposit Period' : 'Tenure Plan'}
                </span>
                <span className="text-base font-bold font-mono text-emerald-300">
                  {tenure} Months
                </span>
              </div>
              <div>
                <span className="text-[10px] text-teal-200 uppercase font-bold block">
                  {form.paymentType === 'FULL_PAYMENT' ? 'Amount Paid' : 'Total Installments'}
                </span>
                <span className={`text-base font-bold font-mono ${form.paymentType === 'FULL_PAYMENT' ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {form.paymentType === 'FULL_PAYMENT' ? `₹${totalAmount.toLocaleString('en-IN')}` : `${tenure} EMIs`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">
                  {form.paymentType === 'FULL_PAYMENT' ? 'Payment Status' : 'Monthly EMI'}
                </span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {form.paymentType === 'FULL_PAYMENT' ? 'FULLY PAID' : `₹${monthlyEmi.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks / Internal Notes (Optional)</label>
              <input
                type="text"

                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Add any specific operational remarks..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || totalAmount <= 0}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                <span>{submitting ? 'Creating Booking...' : 'Confirm & Sell Product'}</span>
              </button>
            </div>
          </form>
      </Modalbox>



      {/* ── View Booking Full Details Modal ── */}
      {viewingBooking && (() => {
        const vCust = viewingBooking.customerId || {};
        const vPrd = viewingBooking.productId || {};
        const vSpon = viewingBooking.sponsorId || {};
        const vDims = viewingBooking.dimensionsSnapshot || vPrd.dimensions || {};
        const vLand = viewingBooking.landSourcing || [];
        const vInsts = viewingBooking.installments || [];
        const vPaidInstsCount = vInsts.filter((i) => i.status === 'PAID').length;
        const vTotalInstsCount = vInsts.length;
        const vRemaining = Math.max(0, (viewingBooking.totalAmount || 0) - (viewingBooking.totalPaid || 0));
        const vOverdueCount = Number(viewingBooking.overdueCount || 0);
        const vAccruedFine = Number(viewingBooking.totalAccruedLateFine || 0);

        return (
          <Modalbox
            open={!!viewingBooking}
            onClose={() => setViewingBooking(null)}
            size="4xl"
            title={`Plot Product Booking Details — ${viewingBooking.bookingNumber}`}
            subtitle={`Recorded on ${new Date(viewingBooking.bookingDate || viewingBooking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • Status: ${viewingBooking.status || 'ACTIVE'}`}
            icon={<Eye size={18} />}
            footer={
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const b = viewingBooking;
                      setViewingBooking(null);
                      if (onOpenCertificate) onOpenCertificate(b);
                    }}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer size={13} />
                    <span>Print Certificate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const b = viewingBooking;
                      setViewingBooking(null);
                      if (onOpenLedger) onOpenLedger(b);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen size={13} />
                    <span>Customer Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingBooking._id;
                      setViewingBooking(null);
                      navigate(`/dashboard/plots/products/edit/${id}`);
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 size={13} />
                    <span>Edit Booking</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingBooking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            }
          >
            <div className="p-4 sm:p-6 space-y-4 text-xs">
              {/* 1. Customer & Sponsoring Associate Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                    <User size={13} /> Customer Details
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-bold text-slate-900">{vCust.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer ID:</span>
                      <span className="font-mono font-bold text-slate-800">{vCust.customerCode || vCust.customerId || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Guardian / Father:</span>
                      <span>{vCust.fatherOrHusbandName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mobile:</span>
                      <span className="font-semibold text-slate-900">{vCust.mobile || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="text-right max-w-[200px] truncate">{vCust.currentAddress || vCust.address || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                    <ShieldCheck size={13} /> Sponsoring Associate &amp; Hierarchy
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Business Associate (BA):</span>
                      <span className="font-bold text-slate-900">{vSpon.name || 'Direct Company'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Associate Code:</span>
                      <span className="font-mono font-bold text-teal-800">{vSpon.sponsorCode || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Business Partner (BP):</span>
                      <span className="font-medium text-slate-800">{vSpon.sponsorId?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Project Master:</span>
                      <span className="font-bold text-slate-800">{viewingBooking.projectName || viewingBooking.projectId?.name || vPrd.projectName || 'General Master Portfolio'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-500">Booking Status:</span>
                      <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded border ${
                        viewingBooking.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : viewingBooking.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}>
                        {viewingBooking.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Product Specifications & Dimensions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5">
                  <Ruler size={13} /> Product Item &amp; Dimensions Specifications
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Product Name</span>
                    <strong className="text-slate-900 block text-xs">{vPrd.productName || 'Micro Plot Unit'}</strong>
                    <span className="text-[10px] font-mono text-slate-500">{vPrd.productCode || 'PRD-001'}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dimensions (N x S x E x W)</span>
                    <strong className="text-slate-800 font-mono text-[11px] block">
                      {vDims.north ?? 1}x{vDims.south ?? 1}x{vDims.east ?? 2}x{vDims.west ?? 2} ft
                    </strong>
                    <span className="text-[10px] text-slate-500">Unit: {vPrd.areaSqFt || (Number(vDims.north || 1) * Number(vDims.east || 1))} Sq.Ft/piece</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Quantity Booked</span>
                    <strong className="text-teal-800 text-sm block font-black">
                      {viewingBooking.quantity || 1} {viewingBooking.quantity === 1 ? 'Unit' : 'Units'}
                    </strong>
                    <span className="text-[10px] text-slate-500">Total: <b>{viewingBooking.totalAreaSqFt || ((vPrd.areaSqFt || 2) * (viewingBooking.quantity || 1))} Sq.Ft</b> ({((viewingBooking.totalAreaSqFt || 2) / 435.6).toFixed(2)} Dismil)</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Booked Unit Rate</span>
                    <strong className="text-slate-900 text-sm block font-black">
                      ₹{Number(viewingBooking.unitPrice || vPrd.unitPrice || 0).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-[10px] text-slate-500">per piece unit</span>
                  </div>
                </div>
              </div>

              {/* 3. Scheme Plan, Period / Tenure & Return Rates (Requested by User) */}
              <div className="bg-gradient-to-r from-teal-50/90 to-emerald-50/70 p-4 rounded-xl border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-teal-200/60 pb-1.5">
                  <div className="text-[11px] uppercase font-bold text-teal-900 flex items-center gap-1.5">
                    <Award size={13} className="text-teal-700" /> Scheme Plan, Period / Tenure &amp; Policy Matrix
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 font-mono">
                    {viewingBooking.planName || 'Standard Scheme'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white/90 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Payment Scheme</span>
                    <strong className="text-slate-900 text-xs block font-bold">
                      {viewingBooking.paymentType === 'FULL_PAYMENT'
                        ? 'One-Time Payment'
                        : `${viewingBooking.emiFrequency === 'QUARTERLY' ? 'Quarterly' : viewingBooking.emiFrequency === 'HALF_YEARLY' ? 'Half-Yearly' : viewingBooking.emiFrequency === 'YEARLY' ? 'Yearly' : 'Monthly'} EMI`}
                    </strong>
                    <span className="text-[10px] text-teal-700 font-medium">
                      {viewingBooking.paymentType === 'FULL_PAYMENT' ? 'Fully Paid' : 'Recurring Installments'}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Contract Period / Tenure</span>
                    <strong className="text-teal-900 text-xs block font-black font-mono">
                      {viewingBooking.tenureMonths || 24} Months
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {Number(viewingBooking.tenureMonths || 24) >= 12
                        ? `${(Number(viewingBooking.tenureMonths || 24) / 12).toFixed(1)} ${Number(viewingBooking.tenureMonths || 24) === 12 ? 'Year' : 'Years'} Duration`
                        : `${viewingBooking.tenureMonths || 24} Months Duration`}
                    </span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Annual Return Rate</span>
                    <strong className="text-emerald-700 text-xs block font-black font-mono">
                      {viewingBooking.annualInterestRate !== undefined ? `${viewingBooking.annualInterestRate}%` : '10.5%'} P.A.
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">Annual Growth Return</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Maturity Return Rate</span>
                    <strong className="text-indigo-800 text-xs block font-black font-mono">
                      {viewingBooking.paymentType === 'FULL_PAYMENT'
                        ? (viewingBooking.fdMaturityPercent !== undefined ? `${viewingBooking.fdMaturityPercent}%` : '-')
                        : (viewingBooking.rdMaturityPercent !== undefined ? `${viewingBooking.rdMaturityPercent}%` : '-')}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {viewingBooking.paymentType === 'FULL_PAYMENT' ? 'F.D. Maturity Return' : 'R.D. Maturity Return'}
                    </span>
                  </div>
                </div>

                {/* Sponsoring Commission Policy Matrix */}
                <div className="p-2.5 bg-white/70 rounded-lg border border-teal-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                  <span className="font-bold text-teal-900">Commission Policy:</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span>BA Commission: <b className="text-teal-800 font-mono">{viewingBooking.promoterCommissionPercent !== undefined ? `${viewingBooking.promoterCommissionPercent}%` : '4.0%'}</b></span>
                    <span>•</span>
                    <span>BP Commission: <b className="text-teal-800 font-mono">{(viewingBooking.bpCommissionPercent ?? viewingBooking.developerCommissionPercent) !== undefined ? `${viewingBooking.bpCommissionPercent ?? viewingBooking.developerCommissionPercent}%` : '1.0%'}</b></span>
                    <span>•</span>
                    <span>Branch Commission: <b className="text-teal-800 font-mono">{viewingBooking.branchCommissionPercent !== undefined ? `${viewingBooking.branchCommissionPercent}%` : '0%'}</b></span>
                  </div>
                </div>
              </div>

              {/* 4. Land Sourcing Multi-Agreement Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5">
                    <Layers size={13} className="text-teal-700" /> Land Acquisition Sourcing Reference ({vLand.length} {vLand.length === 1 ? 'Agreement' : 'Agreements'})
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Total Required: <b className="text-teal-800 font-mono">{viewingBooking.totalAreaSqFt || ((vPrd.areaSqFt || 2) * (viewingBooking.quantity || 1))} Sq.Ft</b>
                  </span>
                </div>

                {vLand.length > 0 ? (
                  <div className="space-y-2">
                    {vLand.map((srcRow, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-700"
                      >
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Kisan Agreement</span>
                          <span className="font-bold text-slate-900 font-mono">#{srcRow.agreementNumber || srcRow.agreementId?.agreementNumber || `AGR-${idx + 1}`}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Mauja / Thana</span>
                          <span className="font-semibold text-slate-900">{srcRow.mauja || '-'} {srcRow.thanaNumber ? `(Thana #${srcRow.thanaNumber})` : ''}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Khata / Plot (Khesra)</span>
                          <span className="font-semibold text-slate-900">Khata: {srcRow.khataNumber || '-'} | Plot: {srcRow.khesraNumber || '-'}</span>
                        </div>
                        <div className="text-right sm:text-right">
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Allocated Area</span>
                          <span className="font-black text-emerald-700 font-mono">
                            {srcRow.allocatedSqFt} Sq.Ft <span className="text-slate-500 font-normal">({srcRow.allocatedDismil || (Math.round((srcRow.allocatedSqFt / 435.6) * 1000) / 1000)} Dismil)</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs italic bg-white rounded-lg border border-slate-200">
                    No Kisan Land agreements allocated to this booking yet.
                  </div>
                )}
              </div>

              {/* 5. Financial Breakdown & Installment Status */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5">
                  <Clock size={13} /> Financial Breakdown &amp; Installment Status
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Valuation</span>
                    <strong className="text-slate-900 text-sm font-black font-mono">
                      ₹{Number(viewingBooking.totalAmount || 0).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-[10px] text-slate-500 block">Total Contract Value</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {viewingBooking.paymentType === 'FULL_PAYMENT'
                        ? 'Paid Upfront'
                        : `${viewingBooking.emiFrequency === 'QUARTERLY' ? 'Quarterly' : viewingBooking.emiFrequency === 'HALF_YEARLY' ? 'Half-Yearly' : viewingBooking.emiFrequency === 'YEARLY' ? 'Yearly' : 'Monthly'} EMI`}
                    </span>
                    <strong className="text-teal-800 text-sm font-black font-mono block">
                      {viewingBooking.paymentType === 'FULL_PAYMENT'
                        ? `₹${Number(viewingBooking.totalAmount || 0).toLocaleString('en-IN')}`
                        : `₹${Number(viewingBooking.monthlyEmi || 0).toLocaleString('en-IN')}/inst.`}
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {viewingBooking.paymentType === 'FULL_PAYMENT'
                        ? '100% Upfront Settled'
                        : `${viewingBooking.installmentCount || viewingBooking.tenureMonths || 24} EMIs Plan`}
                    </span>
                    {Number(viewingBooking.downpaymentAmount || 0) > 0 && (
                      <span className="text-[10px] text-amber-700 font-medium block pt-0.5">
                        DP: ₹{Number(viewingBooking.downpaymentAmount).toLocaleString('en-IN')} ({viewingBooking.downpaymentDays || 90}d)
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount Paid</span>
                    <strong className="text-emerald-700 text-sm font-black font-mono">
                      ₹{Number(viewingBooking.totalPaid || 0).toLocaleString('en-IN')}
                    </strong>
                    <span className="text-[10px] text-slate-500 block font-medium">
                      {vTotalInstsCount > 0 ? `${vPaidInstsCount}/${vTotalInstsCount} EMIs Paid` : '100% Paid'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Due</span>
                    <strong className="text-rose-600 text-sm font-black font-mono">
                      ₹{vRemaining.toLocaleString('en-IN')}
                    </strong>
                    {vOverdueCount > 0 ? (
                      <span className="text-[10px] text-rose-600 font-bold block">
                        {vOverdueCount} Overdue (Fine: ₹{vAccruedFine.toLocaleString('en-IN')})
                      </span>
                    ) : (
                      <span className="text-[10px] text-teal-700 font-medium block">All dues on track</span>
                    )}
                  </div>
                </div>

                {/* Initial Payment Reference Strip */}
                {viewingBooking.collections && viewingBooking.collections.length > 0 && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                    <span>
                      Payment Mode: <b className="uppercase text-slate-900">{viewingBooking.collections[0].paymentMode || 'Cash'}</b>
                    </span>
                    {viewingBooking.collections[0].transactionReference && (
                      <span>
                        Txn / Cheque Ref: <b className="font-mono text-teal-800">{viewingBooking.collections[0].transactionReference}</b>
                      </span>
                    )}
                    <span>
                      Receipt #: <b className="font-mono text-slate-900">{viewingBooking.collections[0].receiptNumber || `PRD-DP-${viewingBooking.bookingNumber}`}</b>
                    </span>
                  </div>
                )}
              </div>

              {/* 6. Remarks / Operational Notes */}
              {viewingBooking.remarks && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-slate-700 text-[11px]">
                  <strong className="text-amber-900">Remarks / Operational Notes:</strong> {viewingBooking.remarks}
                </div>
              )}
            </div>
          </Modalbox>
        );
      })()}
    </div>
  );
};

export default ProductSalesTab;
