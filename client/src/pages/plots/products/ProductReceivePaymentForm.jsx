import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import {
  Banknote,
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Percent,
  Check,
  Loader2,
  Package,
  Layers,
  DollarSign
} from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import Button from '../../../components/ui/Button';
import numberToWords from '../../../utils/numToWord';
import PageLoader from '../../../components/common/PageLoader';

const ProductReceivePaymentForm = ({ onBack, onSuccess, preselectedBookingId }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryBookingId = preselectedBookingId ||
    new URLSearchParams(location.search).get('bookingId') ||
    location.state?.bookingId;

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState(queryBookingId || '');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Rate config
  const [rateConfig, setRateConfig] = useState({
    emiGracePeriod: 15,
    lateFineRate: 24,
    lateFineDailyPercent: 24 / 365,
  });

  // Form State
  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amountPaid: '',
    lateFineRebate: '',
    paymentMode: 'cash',
    transactionReference: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch active bookings list
  useEffect(() => {
    const fetchActiveBookings = async () => {
      setBookingsLoading(true);
      try {
        const [bookingsRes, rateRes] = await Promise.all([
          api.get('/plots/product-bookings?status=ACTIVE'),
          api.get('/plots/rate-config'),
        ]);

        const bList = bookingsRes.data?.data || [];
        setBookings(bList);

        const rData = rateRes.data?.data || {};
        const emiGrace = rData.emiGracePeriodDays ?? rData.lateFineGraceDays ?? 15;
        const rate = rData.lateFineRate !== undefined && rData.lateFineRate !== null ? Number(rData.lateFineRate) : 24;
        const dailyPercent = rData.lateFineDailyPercent ?? (rate / 365);

        setRateConfig({
          emiGracePeriod: emiGrace,
          lateFineRate: rate,
          lateFineDailyPercent: dailyPercent,
        });

        if (queryBookingId) {
          const match = bList.find((b) => b._id === queryBookingId);
          if (match) {
            handleBookingChange(match._id);
          }
        }
      } catch {
        toast.error('Failed to load active contracts or rate config');
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchActiveBookings();
  }, [queryBookingId]);

  const handleBookingChange = async (bookingId) => {
    setSelectedBookingId(bookingId);
    if (!bookingId) {
      setSelectedBooking(null);
      setForm((prev) => ({ ...prev, amountPaid: '', lateFineRebate: '' }));
      return;
    }

    setDetailsLoading(true);
    try {
      const res = await api.get(`/plots/product-bookings/${bookingId}`);
      const bData = res.data?.data || null;
      setSelectedBooking(bData);
    } catch {
      toast.error('Failed to fetch product booking details');
      setSelectedBooking(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Late Fine Calculator helpers
  const emiGracePeriod = rateConfig.emiGracePeriod ?? 15;
  const lateFineDailyPercent = rateConfig.lateFineDailyPercent ?? (24 / 365);
  const dailyRateMultiplier = (Number(lateFineDailyPercent) || (24 / 365)) / 100;

  const getInstLateFine = (ins, targetDateStr) => {
    if (!ins || !ins.dueDate) return 0;
    const principal = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
    if (ins.status === 'PAID' || principal <= 0) {
      return Math.max(0, Number(ins.lateFine || 0) - Number(ins.lateFinePaid || 0) - Number(ins.lateFineRebate || 0));
    }

    const payDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    let newlyAccrued = 0;
    if (!ins.paidDate || !ins.paidAmount) {
      const due = new Date(ins.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > emiGracePeriod) {
        newlyAccrued = Math.round(principal * dailyRateMultiplier * diffDays);
      }
    } else {
      const lastPaid = new Date(ins.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        newlyAccrued = Math.round(principal * dailyRateMultiplier * diffDays);
      }
    }

    const storedUnpaid = Math.max(0, Number(ins.lateFine || 0) - Number(ins.lateFinePaid || 0) - Number(ins.lateFineRebate || 0));
    return storedUnpaid + newlyAccrued;
  };

  const getInstLateDays = (ins, targetDateStr) => {
    if (!ins || !ins.dueDate) return 0;
    if (ins.status === 'PAID') return ins.lateDays || 0;

    const payDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    if (!ins.paidDate || !ins.paidAmount) {
      const due = new Date(ins.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > emiGracePeriod ? diffDays : 0;
    } else {
      const lastPaid = new Date(ins.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  };

  const [emiCount, setEmiCount] = useState(1);

  const installments = selectedBooking?.installments || [];

  // All pending/unpaid installments in chronological order
  const pendingInstallments = useMemo(() => {
    return installments.filter((ins) => ins.status !== 'PAID');
  }, [installments]);

  // Dynamic assessment of Due/Overdue EMIs based on currently selected paymentDate
  const dueStats = useMemo(() => {
    if (!selectedBooking) {
      return {
        dueCount: 0,
        duePrincipal: 0,
        totalFine: 0,
        totalPayable: 0,
        dueEmis: [],
        selectedEmis: [],
        selectedPrincipal: 0,
        selectedFine: 0,
        selectedTotal: 0,
      };
    }
    const payDateObj = form.paymentDate ? new Date(form.paymentDate + 'T23:59:59') : new Date();

    // 1. Dues up to paymentDate
    const dueOrOverdue = pendingInstallments.filter((ins) => ins.dueDate && new Date(ins.dueDate) <= payDateObj);
    const targetDueList = dueOrOverdue.length > 0 ? dueOrOverdue : pendingInstallments.slice(0, 1);

    let duePrincipal = 0;
    let dueFine = 0;
    targetDueList.forEach((ins) => {
      const rem = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
      const fine = getInstLateFine(ins, form.paymentDate);
      duePrincipal += rem;
      dueFine += fine;
    });

    // 2. Selected N EMIs based on chosen emiCount
    const count = Math.max(1, Math.min(Number(emiCount) || 1, pendingInstallments.length || 1));
    const chosenList = pendingInstallments.slice(0, count);

    let selectedPrincipal = 0;
    let selectedFine = 0;
    chosenList.forEach((ins) => {
      const rem = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
      const fine = getInstLateFine(ins, form.paymentDate);
      selectedPrincipal += rem;
      selectedFine += fine;
    });

    return {
      dueCount: dueOrOverdue.length,
      duePrincipal,
      totalFine: dueFine,
      totalPayable: duePrincipal + dueFine,
      dueEmis: targetDueList,
      selectedEmis: chosenList,
      selectedPrincipal,
      selectedFine,
      selectedTotal: selectedPrincipal + selectedFine,
    };
  }, [selectedBooking, form.paymentDate, pendingInstallments, emiCount]);

  // Auto-accumulate due EMI amount when booking or paymentDate changes
  useEffect(() => {
    if (selectedBooking) {
      const defaultCount = dueStats.dueCount > 0 ? dueStats.dueCount : 1;
      setEmiCount(defaultCount);
      const defaultAmount = dueStats.dueCount > 0 ? dueStats.totalPayable : (Number(selectedBooking.monthlyEmi) || dueStats.selectedTotal || 0);
      setForm((prev) => ({
        ...prev,
        amountPaid: defaultAmount > 0 ? String(defaultAmount) : '',
      }));
    }
  }, [selectedBookingId, form.paymentDate, dueStats.dueCount]);

  const bookingOptions = useMemo(() => {
    return bookings.map((b) => ({
      value: b._id,
      label: `${b.bookingNumber} - ${b.customerId?.name || 'Customer'}`,
      subtitle: `Product: ${b.productId?.productName || 'Unit'} • Qty: ${b.quantity} • Bal: ₹${Number(b.remainingAmount || 0).toLocaleString('en-IN')}`,
    }));
  }, [bookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toast.error('Please select an active plot product booking');
      return;
    }

    const payAmount = Number(form.amountPaid);
    if (!payAmount || payAmount <= 0) {
      toast.error('Please enter a valid collection amount greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const targetInstIds = (dueStats.selectedEmis?.length > 0 ? dueStats.selectedEmis : dueStats.dueEmis).map((i) => i._id);
      const payload = {
        installmentIds: targetInstIds,
        amountPaid: payAmount,
        lateFineRebate: Number(form.lateFineRebate) || 0,
        paymentMode: form.paymentMode,
        transactionReference: form.transactionReference.trim(),
        paymentDate: form.paymentDate,
        remarks: form.remarks.trim(),
      };

      const res = await api.post(`/plots/product-bookings/${selectedBookingId}/collections`, payload);
      toast.success(res.data?.message || 'Product collection recorded successfully!');

      if (onSuccess) {
        onSuccess(res.data?.data);
      } else {
        navigate('/dashboard/plots/collections/products');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record product collection');
    } finally {
      setSubmitting(false);
    }
  };

  const customer = selectedBooking?.customerId || {};
  const product = selectedBooking?.productId || {};
  const sponsor = selectedBooking?.sponsorId || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack || (() => navigate('/dashboard/plots/collections/products'))}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
            title="Back to Collections List"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="p-2.5 bg-teal-50 text-teal-800 rounded-2xl border border-teal-200/80">
            <Banknote size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                Receive Product Collection / EMI
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Payment Form
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Select product contract, review dynamic late fine breakdown, and record customer EMI payment.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack || (() => navigate('/dashboard/plots/collections/products'))}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          View Previous Bills
        </button>
      </div>

      {/* Contract Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Active Product Contract *
        </label>
        {bookingsLoading ? (
          <div className="p-4 text-center">
            <PageLoader size="small" />
            <p className="text-xs text-slate-500 mt-2">Loading active product contracts...</p>
          </div>
        ) : (
          <SearchableSelect
            options={bookingOptions}
            value={selectedBookingId}
            onChange={handleBookingChange}
            placeholder="Search booking #, customer name, mobile or product..."
            className="w-full text-sm"
          />
        )}
      </div>

      {detailsLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <PageLoader size="medium" />
          <p className="text-xs text-slate-500 mt-3 font-medium">Loading customer ledger and EMI schedule...</p>
        </div>
      ) : selectedBooking ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Product Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-2">
                <User size={16} className="text-teal-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer Details</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{customer.name || '-'}</div>
                <div className="text-slate-600">
                  <span className="text-slate-400">ID:</span> <span className="font-mono">{customer.customerCode || customer.customerId || '-'}</span>
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Mobile:</span> {customer.mobile || '-'}
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Associate:</span> {sponsor.name ? `${sponsor.name} (${sponsor.sponsorCode || ''})` : 'Direct'}
                </div>
              </div>
            </div>

            {/* Product Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-2">
                <Package size={16} className="text-teal-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Product Specifications</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{product.productName || 'Micro Plot Unit'}</div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Dimensions:</span> <span className="font-semibold">{product.dimensionLabel || '-'}</span>
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Purchased Qty:</span> <span className="font-bold text-teal-800">{selectedBooking.quantity || 1} units</span>
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Plan:</span> <span className="font-medium">{selectedBooking.tenureMonths || 24} Months EMI</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-500 border-b border-slate-100 pb-2">
                <DollarSign size={16} className="text-teal-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Financial Standing</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Valuation:</span>
                  <span className="font-bold text-slate-900">₹{Number(selectedBooking.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Principal Paid:</span>
                  <span className="font-bold text-emerald-700">₹{Number(selectedBooking.totalPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-rose-600">₹{Number(selectedBooking.remainingAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Monthly EMI:</span>
                  <span className="font-bold text-teal-800">₹{Number(selectedBooking.monthlyEmi || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dues & Dynamic 24% Late Fine Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-5 rounded-2xl text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Live Payment Assessment
                  </span>
                  {dueStats.dueCount > 0 ? (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-full text-[10px] font-black animate-pulse">
                      {dueStats.dueCount} EMI{dueStats.dueCount > 1 ? 's' : ''} Overdue
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                      Account On Track
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-100 font-medium">
                  Late fine calculated at 24% p.a. daily accrual after {emiGracePeriod} days grace period.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-bold text-teal-200 uppercase">Due Principal</div>
                  <div className="text-sm font-black text-white">₹{dueStats.duePrincipal.toLocaleString('en-IN')}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center">
                  <div className="text-[10px] font-bold text-amber-300 uppercase">24% Late Fine</div>
                  <div className="text-sm font-black text-amber-300">₹{dueStats.totalFine.toLocaleString('en-IN')}</div>
                </div>

                <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-400/30 text-center">
                  <div className="text-[10px] font-black text-emerald-300 uppercase">Total Due (INR)</div>
                  <div className="text-base font-black text-white">₹{dueStats.totalPayable.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Installment Schedule Breakdown (Read-Only without checkboxes) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers size={15} className="text-teal-700" />
                <span>Product Installment Schedule &amp; Delay Status</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {installments.length} Total Tenures
              </span>
            </div>

            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="p-3 pl-5">EMI #</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Scheduled Amount</th>
                    <th className="p-3 text-right">Principal Paid</th>
                    <th className="p-3 text-center">Delay Days</th>
                    <th className="p-3 text-right">24% Late Fine</th>
                    <th className="p-3 text-right">Balance Due</th>
                    <th className="p-3 text-center pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {installments.map((ins) => {
                    const fine = getInstLateFine(ins, form.paymentDate);
                    const lateDays = getInstLateDays(ins, form.paymentDate);
                    const unpaidPrincipal = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
                    const isFullyPaid = ins.status === 'PAID';
                    const targetList = dueStats.selectedEmis || dueStats.dueEmis || [];
                    const isTarget = targetList.some((t) => String(t._id || t.installmentNumber) === String(ins._id || ins.installmentNumber));

                    return (
                      <tr
                        key={ins._id}
                        className={`transition-colors ${
                          isFullyPaid
                            ? 'bg-emerald-50/30'
                            : isTarget
                            ? 'bg-teal-50/50 font-semibold'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="p-3 pl-5 font-mono font-bold text-slate-900">
                          {ins.installmentNumber === 0 ? 'Downpayment' : `EMI #${ins.installmentNumber}`}
                        </td>
                        <td className="p-3 text-slate-600">
                          {ins.dueDate ? new Date(ins.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-900">
                          ₹{Number(ins.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right text-emerald-700 font-semibold">
                          ₹{Number(ins.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          {lateDays > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                              {lateDays} Days
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {fine > 0 ? (
                            <span className="font-bold text-amber-700">₹{fine.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          ₹{(unpaidPrincipal + fine).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center pr-5">
                          {isFullyPaid ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> Paid
                            </span>
                          ) : lateDays > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-[10px] font-bold">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Collection Inputs Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard size={17} className="text-teal-700" />
              <span>Payment Details &amp; Settlement</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Payment Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Collection / Payment Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Changing collection date dynamically adjusts overdue days &amp; 24% late fine.
                </p>
              </div>

              {/* Number of EMIs to Collect */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Number of EMIs to Collect
                  </label>
                  <span className="text-[11px] font-semibold text-teal-800">
                    {dueStats.dueCount > 0 ? `${dueStats.dueCount} Overdue/Due` : `${pendingInstallments.length} Pending`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={emiCount}
                    onChange={(e) => {
                      const count = Number(e.target.value) || 1;
                      setEmiCount(count);
                      // Calculate total for this number of EMIs
                      const chosen = pendingInstallments.slice(0, count);
                      let pr = 0;
                      let fn = 0;
                      chosen.forEach((ins) => {
                        pr += Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
                        fn += getInstLateFine(ins, form.paymentDate);
                      });
                      const tot = pr + fn;
                      setForm((prev) => ({ ...prev, amountPaid: String(tot) }));
                    }}
                    className="w-full px-3.5 py-2.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs sm:text-sm font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-600 transition cursor-pointer"
                  >
                    {pendingInstallments.map((ins, idx) => {
                      const n = idx + 1;
                      const isDue = ins.dueDate && new Date(ins.dueDate) <= new Date(form.paymentDate + 'T23:59:59');
                      return (
                        <option key={ins.installmentNumber || idx} value={n}>
                          {n} {n === 1 ? 'EMI' : 'EMIs'} {isDue ? '(Overdue/Due)' : '(Advance/Pending)'} — EMI #{ins.installmentNumber || n}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400">
                  Selecting EMI count calculates exact principal + accrued late fine.
                </p>
              </div>

              {/* Amount to Collect */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Amount to Collect (INR) *
                  </label>
                  {dueStats.selectedPrincipal > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Principal: <b className="text-slate-800">₹{dueStats.selectedPrincipal.toLocaleString('en-IN')}</b>
                      {dueStats.selectedFine > 0 && (
                        <span> + Fine: <b className="text-amber-700 font-bold">₹{dueStats.selectedFine.toLocaleString('en-IN')}</b></span>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Enter amount (e.g. 5000)"
                  value={form.amountPaid}
                  onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                />

                {/* Quick Fill Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmiCount(1);
                      const chosen = pendingInstallments.slice(0, 1);
                      let pr = 0;
                      let fn = 0;
                      chosen.forEach((ins) => {
                        pr += Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
                        fn += getInstLateFine(ins, form.paymentDate);
                      });
                      setForm((f) => ({ ...f, amountPaid: String(pr + fn) }));
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition cursor-pointer"
                  >
                    1 EMI (₹{(Number(selectedBooking.monthlyEmi || 0) + (pendingInstallments[0] ? getInstLateFine(pendingInstallments[0], form.paymentDate) : 0)).toLocaleString('en-IN')})
                  </button>

                  {dueStats.dueCount > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmiCount(dueStats.dueCount);
                        setForm((f) => ({ ...f, amountPaid: String(dueStats.totalPayable) }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition cursor-pointer"
                    >
                      All {dueStats.dueCount} Due EMIs (₹{dueStats.totalPayable.toLocaleString('en-IN')})
                    </button>
                  )}

                  {selectedBooking.remainingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmiCount(pendingInstallments.length);
                        setForm((f) => ({ ...f, amountPaid: String(selectedBooking.remainingAmount + dueStats.totalFine) }));
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition cursor-pointer"
                    >
                      Clear All Balance (₹{(selectedBooking.remainingAmount + dueStats.totalFine).toLocaleString('en-IN')})
                    </button>
                  )}
                </div>

                {/* Amount In Words Display */}
                {form.amountPaid && Number(form.amountPaid) > 0 && (
                  <p className="text-[11px] text-teal-800 font-semibold italic capitalize pt-1">
                    {numberToWords(Number(form.amountPaid))} Rupees Only
                  </p>
                )}
              </div>

              {/* Late Fine Rebate & Calculated Fine Banner */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Late Fine Rebate / Discount (Optional)
                  </label>
                  {/* Total Late Fine Banner above Late Fine input */}
                  <div className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <span>Total Late Fine ({emiCount} {emiCount === 1 ? 'EMI' : 'EMIs'}):</span>
                    <span className="font-mono font-black text-amber-900">₹{dueStats.selectedFine.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    max={dueStats.selectedFine || undefined}
                    placeholder="0"
                    value={form.lateFineRebate}
                    onChange={(e) => setForm({ ...form, lateFineRebate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                  />
                  {dueStats.selectedFine > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, lateFineRebate: String(dueStats.selectedFine) }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 hover:bg-teal-100 transition"
                    >
                      100% Fine Waiver
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Waived fine is adjusted directly against the ₹{dueStats.selectedFine.toLocaleString('en-IN')} late fine on selected EMIs.
                </p>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Payment Mode *
                </label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition cursor-pointer"
                >
                  <option value="cash">Cash Payment</option>
                  <option value="online">Online / UPI</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {/* Transaction Reference */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Transaction Reference / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-1234567890 or Cheque No."
                  value={form.transactionReference}
                  onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Remarks / Collection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance EMI for next month"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                />
              </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onBack || (() => navigate('/dashboard/plots/collections/products'))}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Collection...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} className="stroke-[3]" />
                    <span>Submit Collection Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
};

export default ProductReceivePaymentForm;
