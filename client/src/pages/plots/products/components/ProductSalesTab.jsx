import React, { useState } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
  Award,
  BookOpen,
  Printer,
  DollarSign,
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
  Trash2
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    bookingDate: '',
    status: 'ACTIVE',
    remarks: '',
  });
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
  const downPaymentAmt = Math.min(totalAmount, Math.max(0, Number(form.downPayment) || 0));
  const remainingAmt = Math.max(0, totalAmount - downPaymentAmt);
  const tenure = Math.max(1, Number(form.tenureMonths) || 1);
  const monthlyEmi = form.paymentType === 'FULL_PAYMENT' || tenure <= 1
    ? remainingAmt
    : Math.round((remainingAmt / tenure) * 100) / 100;

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
        downPayment: Number(form.downPayment) || 0,
        tenureMonths: Number(form.tenureMonths),
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

  const handleOpenEditModal = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : '',
      status: booking.status || 'ACTIVE',
      remarks: booking.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;

    setSubmitting(true);
    try {
      const res = await api.put(`/plots/product-bookings/${editingBooking._id}`, editForm);
      toast.success(res.data?.message || 'Product booking updated successfully');
      setShowEditModal(false);
      setEditingBooking(null);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBooking = async (booking) => {
    const proceed = await confirmDialog({
      title: `Delete Product Booking ${booking.bookingNumber}?`,
      text: `Are you sure you want to delete product booking "${booking.bookingNumber}" for customer ${booking.customerId?.name || 'Customer'} (${booking.quantity} units of ${booking.productId?.productName || 'Product'})? This will restore the product stock. Note: Bookings with installment payments collected cannot be deleted.`,
      confirmText: 'Delete Booking',
      cancelText: 'Cancel',
      isDanger: true,
    });

    if (!proceed) return;

    try {
      const res = await api.delete(`/plots/product-bookings/${booking._id}`);
      toast.success(res.data?.message || 'Product booking deleted successfully');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete booking');
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
          onClick={handleOpenSaleModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <ShoppingCart size={15} /> Sell Plot Product
        </button>
      </div>

      {/* Bookings Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-3">Booking # &amp; Date</th>
                <th className="p-3">Customer &amp; Associate</th>
                <th className="p-3">Product Specifications</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Valuation</th>
                <th className="p-3 text-center">Tenure &amp; EMI</th>
                <th className="p-3 text-center">EMI &amp; Late Fine Status</th>
                <th className="p-3 text-right">Paid / Balance</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 space-y-2">
                    <ShoppingCart size={32} className="mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No product sales or bookings recorded yet.</p>
                    <p className="text-xs">Click "Sell Plot Product" above to book fractional plot units for a customer.</p>
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

                  const overdueCount = Number(b.overdueCount || 0);
                  const pendingCount = Number(b.pendingCount || 0);
                  const accruedFine = Number(b.totalAccruedLateFine || 0);
                  const installments = b.installments || [];
                  const paidInstsCount = installments.filter((i) => i.status === 'PAID').length;
                  const totalInstsCount = installments.length;

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
                            <span className="text-teal-700"> • BA: {spon.name}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-800">{prd.productName || 'Micro Plot Unit'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {dims.dimensionLabel || `${dims.north ?? 1}x${dims.east ?? 2} ft`} ({b.totalAreaSqFt || prd.areaSqFt} Sq.Ft)
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-bold text-slate-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                          {b.quantity || 1}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-black text-slate-900 font-mono">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @ ₹{Number(b.unitPrice || 0).toLocaleString('en-IN')}/unit
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md inline-block">
                          {b.tenureMonths || 24} Months
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          EMI: ₹{Number(b.monthlyEmi || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {totalInstsCount === 0 || b.paymentType === 'FULL_PAYMENT' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Full Payment Plan
                          </span>
                        ) : remaining <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> {totalInstsCount}/{totalInstsCount} Paid
                          </span>
                        ) : overdueCount > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              {overdueCount} EMI{overdueCount > 1 ? 's' : ''} Overdue
                            </span>
                            {accruedFine > 0 && (
                              <span className="text-[10px] font-bold text-rose-600">
                                Late Fine: ₹{accruedFine.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {paidInstsCount}/{totalInstsCount} Paid • {pendingCount} Pending
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              On Track (0 Fine)
                            </span>
                          </div>
                        )}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenCertificate(b)}
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition border border-teal-200/60 cursor-pointer"
                            title="Print Booking Certificate"
                          >
                            <Printer size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenLedger(b)}
                            className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition border border-indigo-200/60 cursor-pointer"
                            title="View Customer Ledger & EMI Statement"
                          >
                            <BookOpen size={14} />
                          </button>

                          {remaining > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenCollect(b)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition border border-emerald-200/60 cursor-pointer"
                              title="Receive Installment Collection"
                            >
                              <DollarSign size={14} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(b)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200/60 cursor-pointer"
                            title="Edit Booking Date / Status / Notes"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBooking(b)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200/60 cursor-pointer"
                            title="Delete Product Booking"
                          >
                            <Trash2 size={14} />
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
      <Modalbox open={showSaleModal} onClose={() => setShowSaleModal(false)} size="2xl">
        <div className="p-5 md:p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
                <ShoppingCart size={18} />
              </span>
              <h3 className="font-bold text-slate-900 text-sm md:text-base">Sell Plot Product &amp; Create Booking</h3>
            </div>
          </div>

          <form onSubmit={handleSubmitSale} className="space-y-4 text-xs">
            {/* 1. Product Selection */}
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
                    {p.productName} ({p.productCode}) — Dimensions: {p.dimensionLabel || `${p.dimensions?.north}x${p.dimensions?.east} ft`} • ₹{Number(p.unitPrice || 0).toLocaleString('en-IN')}
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

            {/* 2. Customer Selection (with auto-linked Business Associate) */}
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

            {/* 4. Payment Plan & Tenure (Tenure shown only for Monthly EMI) */}
            <div className={`grid ${form.paymentType === 'MONTHLY_INSTALLMENT' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-3.5`}>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Plan <span className="text-rose-500">*</span></label>
                <select
                  value={form.paymentType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setForm({
                      ...form,
                      paymentType: newType,
                      tenureMonths: newType === 'FULL_PAYMENT' ? 1 : (tenures[0]?.tenureMonths || 24),
                      downPayment: newType === 'FULL_PAYMENT' ? totalAmount : '',
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                >
                  <option value="MONTHLY_INSTALLMENT">Monthly EMI Installments</option>
                  <option value="FULL_PAYMENT">One-Time Full Payment (100% Upfront)</option>
                </select>
              </div>

              {form.paymentType === 'MONTHLY_INSTALLMENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Selected Period (Tenure Months) <span className="text-rose-500">*</span>
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
                </div>
              )}

            </div>


            {/* 5. Downpayment / Full Payment & Financial Breakdown Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {form.paymentType === 'FULL_PAYMENT' ? 'Total Payment Amount (₹)' : 'Initial Downpayment (₹)'}
                  <span className="text-slate-400 font-normal"> {form.paymentType === 'FULL_PAYMENT' ? '(Full Paid)' : '(Optional)'}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={form.paymentType === 'FULL_PAYMENT' ? totalAmount : form.downPayment}
                    disabled={form.paymentType === 'FULL_PAYMENT'}
                    onChange={(e) => setForm({ ...form, downPayment: e.target.value })}
                    placeholder="0"
                    className={`w-full pl-8 pr-3.5 py-2 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none ${
                      form.paymentType === 'FULL_PAYMENT' ? 'bg-slate-100 text-teal-900 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Booking / Payment Date</label>
                <input
                  type="date"
                  value={form.bookingDate}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Payment Mode when full payment or downpayment is paid */}
            {(form.paymentType === 'FULL_PAYMENT' || Number(form.downPayment) > 0) && (
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
                  {form.paymentType === 'FULL_PAYMENT' ? 'Full Paid (100%)' : 'Downpayment'}
                </span>
                <span className="text-base font-bold font-mono text-emerald-300">
                  ₹{(form.paymentType === 'FULL_PAYMENT' ? totalAmount : downPaymentAmt).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-teal-200 uppercase font-bold block">Remaining Due</span>
                <span className={`text-base font-bold font-mono ${form.paymentType === 'FULL_PAYMENT' ? 'text-emerald-400' : 'text-rose-300'}`}>
                  ₹{(form.paymentType === 'FULL_PAYMENT' ? 0 : remainingAmt).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">
                  {form.paymentType === 'FULL_PAYMENT' ? 'Payment Status' : `Monthly EMI (${tenure} M)`}
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
        </div>
      </Modalbox>

      {/* Edit Booking Modal */}
      <Modalbox
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBooking(null);
        }}
        size="lg"
        title={`Edit Product Booking — ${editingBooking?.bookingNumber || ''}`}
        subtitle="Update booking date, operational status, or internal remarks"
      >
        <div className="p-4 sm:p-6 text-xs text-slate-800">
          <form onSubmit={handleUpdateBooking} className="space-y-4">
            {editingBooking && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Customer:</span>{' '}
                  <strong className="text-slate-800">{editingBooking.customerId?.name || 'Customer'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Product:</span>{' '}
                  <strong className="text-slate-800">{editingBooking.productId?.productName || 'Product'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Units / Qty:</span>{' '}
                  <strong className="text-slate-800">{editingBooking.quantity} Units</strong>
                </div>
                <div>
                  <span className="text-slate-400">Total Valuation:</span>{' '}
                  <strong className="text-teal-800 font-mono">₹{Number(editingBooking.totalAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Booking Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={editForm.bookingDate}
                onChange={(e) => setEditForm({ ...editForm, bookingDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Booking Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                required
              >
                <option value="ACTIVE">ACTIVE (Ongoing Installments / Regular)</option>
                <option value="COMPLETED">COMPLETED (Fully Paid & Closed)</option>
                <option value="CANCELLED">CANCELLED (Void / Cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks / Notes</label>
              <textarea
                rows={3}
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                placeholder="Add any updated remarks..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBooking(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default ProductSalesTab;
