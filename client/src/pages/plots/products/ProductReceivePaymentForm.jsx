const resolveSubmissionDateTime = (dateVal) => {
  if (!dateVal) return new Date().toISOString();
  const now = new Date();
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    const [y, m, d] = dateVal.trim().split('-').map(Number);
    if (
      y === now.getFullYear() &&
      m === (now.getMonth() + 1) &&
      d === now.getDate()
    ) {
      return now.toISOString();
    }
    const combined = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return combined.toISOString();
  }
  return new Date(dateVal).toISOString();
};

import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  DollarSign,
  Building2,
} from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { DateInput } from '../../../components/ui/DateInput';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import numberToWords from '../../../utils/numToWord';
import PageLoader from '../../../components/common/PageLoader';

const ProductReceivePaymentForm = ({ onBack, onSuccess, preselectedBookingId, mode = 'EMI' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDpMode = mode === 'DOWNPAYMENT';
  const basePath = isDpMode ? '/dashboard/plots/collections/products/downpayment' : '/dashboard/plots/collections/products/emi';

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
    ledgerId: '',
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
  });

  const [bankAccounts, setBankAccounts] = useState([]);
  const profile = useSelector((state) => state.user?.profile);
  const bankPerm = profile?.bankPermissions;
  const isBankScopeNone = bankPerm?.accessScope === 'none';
  const isBankReceiptAllowed = bankPerm ? (bankPerm.allowReceipts !== false && !isBankScopeNone) : true;

  const [cashAccounts, setCashAccounts] = useState([]);
  const [myCashLedger, setMyCashLedger] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch active bookings list
  useEffect(() => {
    const fetchActiveBookings = async () => {
      setBookingsLoading(true);
      try {
        const [bookingsRes, rateRes, treasuryRes, myCashRes] = await Promise.all([
          api.get('/plots/product-bookings'),
          api.get('/plots/rate-config'),
          api.get('/ledger/treasury', { params: { intent: 'receipt' } }).catch(() => ({ data: { data: {} } })),
          api.get('/ledger/my-cash-account').catch(() => null),
        ]);

        const bList = bookingsRes.data?.data || [];
        setBookings(bList);

        let bAccs = treasuryRes.data?.bankLedgers || treasuryRes.data?.bankAccounts || treasuryRes.data?.data?.bankAccounts || treasuryRes.data?.data?.bankLedgers || [];
        const cAccs = treasuryRes.data?.cashLedgers || treasuryRes.data?.cashAccounts || treasuryRes.data?.data?.cashAccounts || treasuryRes.data?.data?.cashLedgers || [];

        if (!isBankReceiptAllowed) {
          bAccs = [];
        }

        setBankAccounts(bAccs);
        setCashAccounts(cAccs);

        const myCash = myCashRes?.data?.data || myCashRes?.data || null;
        setMyCashLedger(myCash);

        const isCash = !isBankReceiptAllowed || String(form.paymentMode).toLowerCase() === 'cash';
        const defaultLedger = isCash ? (myCash?._id || cAccs[0]?._id || '') : (bAccs[0]?._id || '');
        if (defaultLedger) {
          setForm((f) => ({
            ...f,
            paymentMode: !isBankReceiptAllowed ? 'cash' : f.paymentMode,
            ledgerId: defaultLedger
          }));
        }

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
      const cust = bData?.customerId;
      if (cust && typeof cust === 'object') {
        setForm((prev) => ({
          ...prev,
          bankName: prev.bankName || cust.bankName || '',
          bankBranch: prev.bankBranch || cust.bankBranch || '',
          accountNumber: prev.accountNumber || cust.accountNumber || '',
          accountHolderName: prev.accountHolderName || cust.accountHolderName || cust.name || '',
          ifscCode: prev.ifscCode || cust.ifscCode || '',
        }));
      }
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
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      if (diffDays > emiGracePeriod) {
        newlyAccrued = Math.round(principal * dailyRateMultiplier * diffDays);
      }
    } else {
      const lastPaid = new Date(ins.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

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
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      return diffDays > emiGracePeriod ? diffDays : 0;
    } else {
      const lastPaid = new Date(ins.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      return Math.max(0, diffDays);
    }
  };

  const [emiCount, setEmiCount] = useState(1);

  const rawInstallments = selectedBooking?.installments || [];
  const installments = useMemo(() => {
    if (isDpMode) {
      return rawInstallments.filter((ins) => ins.installmentNumber === 0);
    }
    return rawInstallments.filter((ins) => ins.installmentNumber > 0);
  }, [rawInstallments, isDpMode]);

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

  const dpInst = useMemo(() => {
    return (selectedBooking?.installments || []).find((ins) => ins.installmentNumber === 0);
  }, [selectedBooking]);

  const dpTotal = Number(selectedBooking?.downPayment || dpInst?.amount || 0);

  const unpaidDp = useMemo(() => {
    if (!selectedBooking) return 0;
    if (dpInst) {
      return Math.max(0, Number(dpInst.amount || 0) - Number(dpInst.paidAmount || 0));
    }
    return Math.max(0, Number(selectedBooking.downPayment || 0) - Number(selectedBooking.totalPaid || 0));
  }, [selectedBooking, dpInst]);

  const dpPaid = dpInst ? Number(dpInst.paidAmount || 0) : Math.max(0, dpTotal - unpaidDp);
  const dpPrincipalDue = unpaidDp;
  const dpDueDate = dpInst?.dueDate || (selectedBooking?.bookingDate ? new Date(new Date(selectedBooking.bookingDate).getTime() + (selectedBooking.downPaymentDays || 30) * 86400000).toISOString() : null);
  const dpFine = dpInst ? getInstLateFine(dpInst, form.paymentDate) : 0;
  const dpLateDays = dpInst ? getInstLateDays(dpInst, form.paymentDate) : 0;
  const isDpOverdue = dpDueDate ? new Date(dpDueDate) < new Date(form.paymentDate || new Date()) : false;
  const dpTotalPayable = dpPrincipalDue + dpFine;

  // Auto-accumulate due EMI amount when booking or paymentDate changes
  useEffect(() => {
    if (selectedBooking) {
      if (isDpMode) {
        const netTotal = dpPrincipalDue + Math.max(0, dpFine - (Number(form.lateFineRebate) || 0));
        setForm((prev) => ({
          ...prev,
          amountPaid: netTotal > 0 ? String(netTotal) : (unpaidDp > 0 ? String(unpaidDp) : ''),
        }));
      } else {
        const defaultCount = dueStats.dueCount > 0 ? dueStats.dueCount : 1;
        setEmiCount(defaultCount);
        const defaultAmount = dueStats.dueCount > 0 ? dueStats.totalPayable : (Number(selectedBooking.monthlyEmi) || dueStats.selectedTotal || 0);
        setForm((prev) => ({
          ...prev,
          amountPaid: defaultAmount > 0 ? String(defaultAmount) : '',
        }));
      }
    }
  }, [selectedBookingId, form.paymentDate, dueStats.dueCount, isDpMode, unpaidDp, dpPrincipalDue, dpFine]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Don't show cancelled bookings
      if (b.status === 'CANCELLED') return false;
      return true;
    });
  }, [bookings]);

  const bookingOptions = useMemo(() => {
    return filteredBookings.map((b) => {
      const bDpInst = (b.installments || []).find((ins) => ins.installmentNumber === 0);
      const bUnpaidDp = bDpInst
        ? Math.max(0, Number(bDpInst.amount || 0) - Number(bDpInst.paidAmount || 0))
        : Math.max(0, Number(b.downPayment || 0) - Number(b.totalPaid || 0));
      const bIsDpComplete = bDpInst ? (bDpInst.status === 'PAID' || bUnpaidDp <= 0) : bUnpaidDp <= 0;
      const bIsEmiComplete = Number(b.remainingAmount || 0) <= 0;

      let sub = '';
      if (isDpMode) {
        sub = bIsDpComplete
          ? `✓ Downpayment Completed (₹${Number(b.downPayment || bDpInst?.amount || 0).toLocaleString('en-IN')}) • Total: ₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`
          : `Pending DP: ₹${bUnpaidDp.toLocaleString('en-IN')} • Total: ₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`;
      } else {
        if (!bIsDpComplete) {
          sub = `⚠ Down Payment Pending (₹${bUnpaidDp.toLocaleString('en-IN')}) • Collect DP First`;
        } else if (bIsEmiComplete) {
          sub = `✓ All EMIs Completed (100% Paid) • Total: ₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}`;
        } else {
          sub = `Product: ${b.productId?.productName || 'Unit'} • Bal: ₹${Number(b.remainingAmount || 0).toLocaleString('en-IN')}`;
        }
      }

      let statusBadge = '';
      if (isDpMode && bIsDpComplete) {
        statusBadge = ' (DP Completed)';
      } else if (!isDpMode && !bIsDpComplete) {
        statusBadge = ' (DP Pending)';
      } else if (!isDpMode && bIsEmiComplete) {
        statusBadge = ' (Completed)';
      }

      return {
        value: b._id,
        label: `${b.bookingNumber} - ${b.customerId?.name || 'Customer'}${statusBadge}`,
        subtitle: sub,
      };
    });
  }, [filteredBookings, isDpMode]);

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

    if (isDpMode) {
      if (dpPrincipalDue <= 0 && dpFine <= 0) {
        toast.error('Down payment for this booking is already fully paid.');
        return;
      }
      const maxDpAllowed = dpPrincipalDue + Math.max(0, dpFine - (Number(form.lateFineRebate) || 0));
      if (payAmount > maxDpAllowed) {
        toast.error(`Collection amount (₹${payAmount.toLocaleString('en-IN')}) cannot exceed maximum payable down payment of ₹${maxDpAllowed.toLocaleString('en-IN')}.`);
        return;
      }
    } else {
      if (unpaidDp > 0) {
        toast.error(`Down payment is not fully paid (₹${unpaidDp.toLocaleString('en-IN')} remaining). Please collect the down payment first.`);
        return;
      }
      if (payAmount > (selectedBooking.remainingAmount || 0)) {
        toast.error(`Collection amount cannot exceed remaining balance of ₹${Number(selectedBooking.remainingAmount || 0).toLocaleString('en-IN')}.`);
        return;
      }
    }

    const isCash = String(form.paymentMode).toLowerCase() === 'cash';
    if (!isCash && !form.transactionReference?.trim()) {
      toast.error('Transaction Reference / UTR / Cheque # is required for bank and online transactions');
      return;
    }
    if (form.paymentMode === 'cheque') {
      const cleanCheque = form.transactionReference.trim();
      if (!/^\d{6}$/.test(cleanCheque)) {
        toast.error('Cheque number must be exactly 6 numeric digits (e.g. 045123)');
        return;
      }
    }

    setSubmitting(true);
    try {
      const targetInstIds = isDpMode
        ? (dpInst ? [dpInst._id] : [])
        : (dueStats.selectedEmis?.length > 0 ? dueStats.selectedEmis : dueStats.dueEmis).map((i) => i._id);

      const payload = {
        collectionType: isDpMode ? 'DOWNPAYMENT' : 'EMI',
        installmentIds: targetInstIds,
        amountPaid: payAmount,
        lateFineRebate: Number(form.lateFineRebate) || 0,
        paymentMode: form.paymentMode,
        transactionReference: form.transactionReference.trim(),
        paymentDate: resolveSubmissionDateTime(form.paymentDate),
        ledgerId: form.ledgerId || undefined,
        remarks: form.remarks.trim(),
        bankDetails: !isCash ? {
          bankName: (form.bankName || '').trim(),
          bankBranch: (form.bankBranch || '').trim(),
          accountNumber: (form.accountNumber || '').trim(),
          accountHolderName: (form.accountHolderName || '').trim(),
          ifscCode: (form.ifscCode || '').trim(),
        } : undefined,
      };

      const res = await api.post(`/plots/product-bookings/${selectedBookingId}/collections`, payload);
      if (isCash) {
        toast.success(res.data?.message || 'Product collection recorded successfully!');
      } else {
        toast.info('Online collection recorded with PENDING approval status. Awaiting manager/admin verification.');
      }

      if (onSuccess) {
        onSuccess(res.data?.data);
      } else {
        navigate(basePath);
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
            onClick={onBack || (() => navigate(basePath))}
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
                {isDpMode ? 'Record Down Payment' : 'Receive Investment EMI Collection'}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {isDpMode ? 'Down Payment' : 'EMI Collection'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isDpMode
                ? 'Select active investment contract and record down payment receipt (capped at remaining DP).'
                : 'Select product contract, review schedule, and collect EMI with automatic multi-EMI rollover.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack || (() => navigate(basePath))}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          View Previous Bills
        </button>
      </div>

      {/* Contract Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {isDpMode ? 'Select Investment Booking Number *' : 'Select Investment Booking *'}
        </label>
        {bookingsLoading ? (
          <div className="p-4 text-center">
            <PageLoader size="small" />
            <p className="text-xs text-slate-500 mt-2">Loading active product contracts...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            {isDpMode
              ? 'No investment bookings found.'
              : 'No active investment bookings with completed down payment available for EMI collection.'}
          </div>
        ) : (
          <SearchableSelect
            options={bookingOptions}
            value={selectedBookingId}
            onChange={handleBookingChange}
            placeholder={isDpMode ? "Search booking # or customer name..." : "Search booking #, customer name, mobile or product..."}
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
          {isDpMode ? (
            /* =========================================================================
               DEDICATED DOWN PAYMENT VIEW (Matches Plot Downpayment Form & Screenshots)
               ========================================================================= */
            <>
              {/* Top Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs select-none">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Customer Name</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {customer.name || selectedBooking.customerId?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Booking No</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{selectedBooking.bookingNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Total Valuation</span>
                  <span className="font-bold text-slate-800 text-sm">
                    ₹{Number(selectedBooking.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Outstanding Balance</span>
                  <span className="font-bold text-teal-800 text-sm">
                    ₹{Number(selectedBooking.remainingAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Downpayment Terms & Status Card */}
              {dpPrincipalDue === 0 && dpFine === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 font-medium shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block uppercase tracking-wide text-xs text-emerald-900">
                        Downpayment is Completed (100% Paid)
                      </span>
                      <span className="text-xs text-emerald-800">
                        Total Downpayment of ₹{dpTotal.toLocaleString('en-IN')} has been fully paid and cleared for this booking.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/plots/collections/products/emi/add?bookingId=${selectedBooking._id}`)}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shrink-0 self-start sm:self-auto shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Collect Monthly EMI Instead →
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-teal-200/80 rounded-xl p-4 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Downpayment Terms & Status
                    </span>
                    {isDpOverdue && dpLateDays > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                        Overdue ({dpLateDays} Days Delay)
                      </span>
                    ) : isDpOverdue ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                        Due (Within Grace Period)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-800 border border-teal-200">
                        Pending Clearance
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Booking Date</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        {selectedBooking.bookingDate
                          ? new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '-'}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${isDpOverdue ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200/70'}`}>
                      <span className={`font-semibold block text-[0.65rem] uppercase ${isDpOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                        DP Last Due Date
                      </span>
                      <span className={`font-bold mt-0.5 block ${isDpOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
                        {dpDueDate
                          ? new Date(dpDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '-'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Total Downpayment</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        ₹{dpTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                      <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Paid So Far</span>
                      <span className="font-bold text-emerald-700 mt-0.5 block">
                        ₹{dpPaid.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-teal-50/80 p-2.5 rounded-lg border border-teal-200">
                      <span className="text-teal-700 font-semibold block text-[0.65rem] uppercase">Principal Due</span>
                      <span className="font-bold text-teal-900 mt-0.5 block text-sm">
                        ₹{dpPrincipalDue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-lg border ${dpFine > 0 ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200/70'}`}>
                      <span className={`font-semibold block text-[0.65rem] uppercase ${dpFine > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        Late Fine ({rateConfig.lateFineRate || 24}% P.A.)
                      </span>
                      <span className={`font-bold mt-0.5 block ${dpFine > 0 ? 'text-rose-700 text-sm' : 'text-slate-800'}`}>
                        ₹{dpFine.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Downpayment Collection Form Inputs */}
              {!(dpPrincipalDue === 0 && dpFine === 0) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Collection Amount */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Collection Amount (₹) <span className="text-rose-500">*</span></label>
                        <span className="text-[0.65rem] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Max DP Payable: ₹{Math.max(0, dpTotalPayable - (Number(form.lateFineRebate) || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <input
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        value={form.amountPaid}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setForm({ ...form, amountPaid: val });
                        }}
                        placeholder="Enter collected amount"
                        required
                      />
                      {form.amountPaid && Number(form.amountPaid) > 0 ? (
                        <p className="text-[0.7rem] font-bold text-teal-800 mt-1 capitalize bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1">
                          {numberToWords(Math.floor(Number(form.amountPaid)))} Rupees Only
                        </p>
                      ) : null}
                    </div>

                    {/* Late Fine Rebate */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Late Fine Rebate (₹)</label>
                        <span className="text-[0.65rem] text-slate-400 font-medium">
                          Max: ₹{dpFine.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <input
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        value={form.lateFineRebate}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/[^0-9.]/g, '');
                          const numRebate = Math.min(Number(rawVal) || 0, dpFine);
                          const cleanRebateStr = rawVal === '' ? '' : String(numRebate);
                          const netFine = Math.max(0, dpFine - numRebate);
                          const newTotal = dpPrincipalDue + netFine;
                          setForm((prev) => ({
                            ...prev,
                            lateFineRebate: cleanRebateStr,
                            amountPaid: newTotal > 0 ? String(newTotal) : '',
                          }));
                        }}
                        placeholder="Enter rebate amount if any"
                      />
                    </div>

                    {/* Payment Mode */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Payment Mode <span className="text-rose-500">*</span></label>
                      <Select
                        value={form.paymentMode}
                        disabled={!isBankReceiptAllowed}
                        onChange={(e) => {
                          const newMode = e.target.value;
                          const isCash = String(newMode).toLowerCase() === 'cash';
                          const defaultId = isCash ? (myCashLedger?._id || cashAccounts[0]?._id || '') : (bankAccounts[0]?._id || '');
                          const cust = selectedBooking?.customerId;
                          setForm((prev) => ({
                            ...prev,
                            paymentMode: newMode,
                            ledgerId: defaultId,
                            bankName: prev.bankName || cust?.bankName || '',
                            bankBranch: prev.bankBranch || cust?.bankBranch || '',
                            accountNumber: prev.accountNumber || cust?.accountNumber || '',
                            accountHolderName: prev.accountHolderName || cust?.accountHolderName || cust?.name || '',
                            ifscCode: prev.ifscCode || cust?.ifscCode || '',
                          }));
                        }}
                        options={[
                          { value: 'cash', label: 'Cash' },
                          ...(isBankReceiptAllowed
                            ? [
                                { value: 'online', label: 'UPI / Online' },
                                { value: 'bank_transfer', label: 'Bank Transfer' },
                                { value: 'cheque', label: 'Cheque' },
                              ]
                            : []),
                        ]}
                      />
                      {!isBankReceiptAllowed && (
                        <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                          Bank receipts restricted (Cash collections only)
                        </span>
                      )}
                    </div>

                    {/* Receiving Cash / Bank Account */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">
                        {String(form.paymentMode).toLowerCase() === 'cash' ? 'Receiving Cash Account (My Custody) *' : 'Receiving Bank Account *'}
                      </label>
                      <Select
                        value={form.ledgerId || ''}
                        disabled={String(form.paymentMode).toLowerCase() === 'cash' || !isBankReceiptAllowed}
                        onChange={(e) => setForm({ ...form, ledgerId: e.target.value })}
                        options={
                          String(form.paymentMode).toLowerCase() === 'cash'
                            ? [
                                {
                                  value: myCashLedger?._id || '',
                                  label: myCashLedger?.name || 'Ghanshyam kumar (Cash Ledger)',
                                },
                              ]
                            : bankAccounts.length === 0
                            ? [{ value: '', label: 'No authorized bank account available' }]
                            : bankAccounts.map((b) => ({
                                value: b._id,
                                label: `${b.bankName || b.name} ${b.accountNumber ? `(A/C: ${b.accountNumber})` : ''}`.trim(),
                              }))
                        }
                      />
                    </div>

                    {/* Collection Date */}
                    <div className="flex flex-col gap-1">
                      <DateInput
                        label="Collection Date *"
                        value={form.paymentDate}
                        onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                        required
                      />
                    </div>

                    {/* Transaction Reference (if non-cash) */}
                    {form.paymentMode !== 'cash' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700">Transaction Reference / Cheque # *</label>
                        <input
                          type="text"
                          placeholder="e.g. UPI-1234567890 or Cheque No."
                          value={form.transactionReference}
                          onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                        />
                      </div>
                    )}
                  </div>

                  {/* Customer Bank Details for non-cash */}
                  {form.paymentMode !== 'cash' && (
                    <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-teal-700" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Customer Bank Details
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (Used for Online/Bank/Cheque Verification & Record)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. State Bank of India, HDFC Bank"
                            value={form.bankName || ''}
                            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. 123456789012"
                            value={form.accountNumber || ''}
                            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. Customer Name / Company Name"
                            value={form.accountHolderName || ''}
                            onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition uppercase"
                            maxLength={11}
                            placeholder="e.g. SBIN0001234"
                            value={form.ifscCode || ''}
                            onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. Main Branch"
                            value={form.bankBranch || ''}
                            onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Narration / Remarks */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">Narration / Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="Enter narration notes for this payment..."
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition resize-none"
                    />
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onBack || (() => navigate(basePath))}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || Number(form.amountPaid) > (dpPrincipalDue + Math.max(0, dpFine - (Number(form.lateFineRebate) || 0)))}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Recording Down Payment...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} className="stroke-[3]" />
                          <span>Record Down Payment Receipt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* =========================================================================
               EXISTING EMI COLLECTION VIEW (Installment Schedule, Multi-EMI auto-spill)
               ========================================================================= */
            <>
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

              {/* Dues & Payment Assessment - Simple Light Theme */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Live Payment Assessment
                      </span>
                      {dueStats.dueCount > 0 ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black">
                          {dueStats.dueCount} EMI{dueStats.dueCount > 1 ? 's' : ''} Overdue
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          Account On Track
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Late fine calculated at 24% p.a. daily accrual after {emiGracePeriod} days grace period.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Principal</div>
                      <div className="text-sm font-black font-mono text-slate-900">₹{dueStats.duePrincipal.toLocaleString('en-IN')}</div>
                    </div>

                    <div className="bg-amber-50/70 px-3.5 py-2 rounded-xl border border-amber-200 text-center">
                      <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">24% Late Fine</div>
                      <div className="text-sm font-black font-mono text-amber-800">₹{dueStats.totalFine.toLocaleString('en-IN')}</div>
                    </div>

                    <div className="bg-teal-50 px-4 py-2 rounded-xl border border-teal-200 text-center">
                      <div className="text-[10px] font-black text-teal-800 uppercase tracking-wider">Total Due (INR)</div>
                      <div className="text-base font-black font-mono text-teal-950">₹{dueStats.totalPayable.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Installment Schedule Breakdown */}
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
                            className={`transition-colors ${isFullyPaid
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

              {/* Live Multi-EMI Auto-Spillover Info or Completion Banner */}
              {Number(selectedBooking.remainingAmount || 0) <= 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-xs text-emerald-950 font-medium shadow-2xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block uppercase tracking-wide text-xs text-emerald-900">
                      All EMIs Completed (100% Fully Paid)
                    </span>
                    <span className="text-xs text-emerald-800">
                      This investment contract is completely paid up (Remaining Balance: ₹0). No further installments are due.
                    </span>
                  </div>
                </div>
              ) : unpaidDp > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 font-medium shadow-2xs">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold block uppercase tracking-wide text-xs text-amber-900">
                        Down Payment Not Completed (₹{unpaidDp.toLocaleString('en-IN')} Pending)
                      </span>
                      <span className="text-xs text-amber-800">
                        Please collect the initial down payment before accepting regular monthly EMI installments.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/plots/collections/products/downpayment/add?bookingId=${selectedBooking._id}`)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shrink-0 self-start sm:self-auto shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Collect Down Payment First →
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 p-4 rounded-2xl border border-teal-200/80 text-xs text-teal-900 flex items-start gap-3 shadow-2xs">
                  <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                    <Layers size={16} />
                  </div>
                  <div>
                    <span className="font-bold">Multi-EMI Auto-Spillover:</span> When a customer pays more than a single EMI amount (e.g. pays ₹2,00,000 for a ₹1,80,000 EMI), the system covers the active EMI and automatically spills over the remaining balance to clear subsequent EMIs in advance. All paid principal is fully credited to installments and sponsor commissions!
                  </div>
                </div>
              )}

              {/* Payment Collection Inputs Form (Only show if there are pending EMIs and DP is cleared) */}
              {Number(selectedBooking.remainingAmount || 0) > 0 && unpaidDp <= 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <CreditCard size={17} className="text-teal-700" />
                  <span>Payment Details &amp; Settlement</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Payment Date */}
                  <div className="space-y-1.5">
                    <DateInput
                      label="Collection / Payment Date"
                      value={form.paymentDate}
                      onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                      required
                    />
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
                      <Select
                        value={emiCount}
                        onChange={(e) => {
                          const count = Number(e.target.value) || 1;
                          setEmiCount(count);
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
                        options={pendingInstallments.map((ins, idx) => {
                          const n = idx + 1;
                          const isDue = ins.dueDate && new Date(ins.dueDate) <= new Date(form.paymentDate + 'T23:59:59');
                          return {
                            value: n,
                            label: `${n} ${n === 1 ? 'EMI' : 'EMIs'} ${isDue ? '(Overdue/Due)' : '(Advance/Pending)'} — EMI #${ins.installmentNumber || n}`,
                          };
                        })}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Selecting EMI count calculates exact principal + accrued late fine.
                    </p>
                  </div>

                  {/* Amount to Collect */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Amount to Collect (INR) <span className="text-rose-500">*</span>
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
                      Payment Mode <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={form.paymentMode}
                      disabled={!isBankReceiptAllowed}
                      onChange={(e) => {
                        const newMode = e.target.value;
                        const isCash = String(newMode).toLowerCase() === 'cash';
                        const defaultId = isCash ? (myCashLedger?._id || cashAccounts[0]?._id || '') : (bankAccounts[0]?._id || '');
                        const cust = selectedBooking?.customerId;
                        setForm((prev) => ({
                          ...prev,
                          paymentMode: newMode,
                          ledgerId: defaultId,
                          bankName: prev.bankName || cust?.bankName || '',
                          bankBranch: prev.bankBranch || cust?.bankBranch || '',
                          accountNumber: prev.accountNumber || cust?.accountNumber || '',
                          accountHolderName: prev.accountHolderName || cust?.accountHolderName || cust?.name || '',
                          ifscCode: prev.ifscCode || cust?.ifscCode || '',
                        }));
                      }}
                      options={[
                        { value: 'cash', label: 'Cash Payment' },
                        ...(isBankReceiptAllowed
                          ? [
                              { value: 'online', label: 'Online / UPI' },
                              { value: 'bank_transfer', label: 'Bank Transfer / NEFT / RTGS' },
                              { value: 'cheque', label: 'Cheque' },
                            ]
                          : []),
                      ]}
                      required
                    />
                    {!isBankReceiptAllowed && (
                      <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                        Corporate bank receipts restricted for this account (Cash collections only)
                      </span>
                    )}
                  </div>

                  {/* Receiving Account */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {String(form.paymentMode).toLowerCase() === 'cash' ? 'Receiving Cash Account (My Custody)' : 'Receiving Bank Account'} <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={form.ledgerId || ''}
                      disabled={String(form.paymentMode).toLowerCase() === 'cash' || !isBankReceiptAllowed}
                      onChange={(e) => setForm({ ...form, ledgerId: e.target.value })}
                      options={
                        String(form.paymentMode).toLowerCase() === 'cash'
                          ? [
                              {
                                value: myCashLedger?._id || '',
                                label: myCashLedger?.name || 'My Cash Account (Personal Custody)',
                              },
                            ]
                          : bankAccounts.length === 0
                          ? [{ value: '', label: 'No authorized bank account available' }]
                          : bankAccounts.map((b) => ({
                              value: b._id,
                              label: `${b.bankName || b.name} ${b.accountNumber ? `(A/C: ${b.accountNumber})` : ''}`.trim(),
                            }))
                      }
                    />
                  </div>

                  {/* Transaction Reference (Non-Cash only) */}
                  {form.paymentMode !== 'cash' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Transaction Reference / Cheque <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI-1234567890 or Cheque No."
                        value={form.transactionReference}
                        onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                      />
                    </div>
                  )}

                  {/* Customer Bank Details for all non-cash */}
                  {form.paymentMode !== 'cash' && (
                    <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col gap-3 md:col-span-2">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-teal-700" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Customer Bank Details
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (Used for Online/Bank/Cheque Verification & Record)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. State Bank of India, HDFC Bank"
                            value={form.bankName || ''}
                            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. 123456789012"
                            value={form.accountNumber || ''}
                            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. Customer Name / Company Name"
                            value={form.accountHolderName || ''}
                            onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition uppercase"
                            maxLength={11}
                            placeholder="e.g. SBIN0001234"
                            value={form.ifscCode || ''}
                            onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                          />
                        </div>

                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                          <input
                            type="text"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
                            placeholder="e.g. Main Branch"
                            value={form.bankBranch || ''}
                            onChange={(e) => setForm({ ...form, bankBranch: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  <div className="space-y-1.5 md:col-span-2">
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
                    onClick={onBack || (() => navigate(basePath))}
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
                        <span>Submit EMI Collection Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              )}
            </>
          )}
        </form>
      ) : null}
    </div>
  );
};

export default ProductReceivePaymentForm;
