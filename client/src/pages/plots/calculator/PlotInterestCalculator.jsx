import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { DateInput } from '../../../components/ui/DateInput';
import {
  Search,
  Calendar,
  Printer,
  RotateCcw,
  Banknote,
  FileText,
  User,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  IndianRupee,
  Sparkles,
  Loader2,
  Percent,
  TrendingUp,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';

const PlotInterestCalculator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search input state
  const [searchInput, setSearchInput] = useState(searchParams.get('bookingNumber') || '');
  const [bookingSuggestions, setBookingSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Selected Booking & Details
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Settlement Mode: 'INTEREST_RETURN' or 'DEDUCTION_PENALTY'
  const [settlementMode, setSettlementMode] = useState('INTEREST_RETURN');

  // Deduction Parameters (for DEDUCTION_PENALTY mode)
  const [deductionType, setDeductionType] = useState('PERCENT'); // 'PERCENT' or 'FLAT'
  const [deductionValue, setDeductionValue] = useState(20);

  // Interest Return Parameters (for INTEREST_RETURN mode)
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);
  const [annualRate, setAnnualRate] = useState(10.88);
  const [calculationMode, setCalculationMode] = useState('SIMPLE'); // 'SIMPLE' or 'COMPOUND_ANNUAL'
  const [systemDefaultRate, setSystemDefaultRate] = useState(10.88);
  const [matchedSchemeInfo, setMatchedSchemeInfo] = useState('');

  // Cancellation Modal & Processing State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [initialPayNow, setInitialPayNow] = useState(false);
  const [initialPayAmount, setInitialPayAmount] = useState(0);
  const [initialPayMode, setInitialPayMode] = useState('BANK_TRANSFER');
  const [initialPayRef, setInitialPayRef] = useState('');
  const [initialPaymentLedgerId, setInitialPaymentLedgerId] = useState('');
  const [treasuryLedgers, setTreasuryLedgers] = useState({ bankLedgers: [], cashLedgers: [] });
  const [myCashLedger, setMyCashLedger] = useState(null);

  // Commission Reversal State
  const [reverseCommission, setReverseCommission] = useState(true);
  const [showCommBreakdown, setShowCommBreakdown] = useState(true);
  const [bookingCommissions, setBookingCommissions] = useState({
    commissions: [],
    totalActiveAmount: 0,
    totalReversedAmount: 0,
    totalAmount: 0,
    activeCount: 0,
    reversedCount: 0,
  });

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Global Default Rate
  useEffect(() => {
    api.get('/plots/rate-config')
      .then((res) => {
        const rate = res.data?.data?.interestRatePercent ?? 10.88;
        setSystemDefaultRate(rate);
        if (!searchParams.get('bookingId') && !searchParams.get('bookingNumber')) {
          setAnnualRate(rate);
        }
      })
      .catch(() => {});
  }, []);

  // Live Auto-complete for Booking Number / Customer Name (supporting both regular plot and product bookings)
  useEffect(() => {
    const q = searchInput.trim();
    if (!q || q.length < 1) {
      setBookingSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [regRes, prdRes] = await Promise.all([
          api.get('/plots/reports/bookings').catch(() => ({ data: { data: [] } })),
          api.get('/plots/product-bookings').catch(() => ({ data: { data: [] } })),
        ]);
        const regList = (regRes.data?.data || []).map((b) => ({ ...b, isProductBooking: false }));
        const prdList = (prdRes.data?.data || []).map((b) => ({ ...b, isProductBooking: true }));
        const combined = [...prdList, ...regList];

        const query = q.toLowerCase();
        const filtered = combined
          .filter((b) => {
            const bNum = (b.bookingNumber || '').toLowerCase();
            const cName = (b.customerId?.name || b.customerName || '').toLowerCase();
            const phone = (b.customerId?.mobile || b.customerMobile || '').toLowerCase();
            return bNum.includes(query) || cName.includes(query) || phone.includes(query);
          })
          .slice(0, 10);
        setBookingSuggestions(filtered);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Booking data by ID or BookingNumber
  const loadBookingDetails = async (bookingIdOrNum, forceIsProduct = false) => {
    if (!bookingIdOrNum) return;
    setLoading(true);
    setMatchedSchemeInfo('');
    try {
      let resolvedId = bookingIdOrNum;
      let isProduct = forceIsProduct || searchParams.get('productBookingId') === bookingIdOrNum;

      if (typeof bookingIdOrNum === 'string' && bookingIdOrNum.trim().toUpperCase().startsWith('PRD-')) {
        isProduct = true;
      }

      // If a booking number string was given, look it up
      if (typeof bookingIdOrNum === 'string' && bookingIdOrNum.length !== 24) {
        if (isProduct) {
          try {
            const prdRes = await api.get('/plots/product-bookings');
            const prdList = prdRes.data?.data || [];
            const match = prdList.find(
              (b) => (b.bookingNumber || '').toLowerCase() === bookingIdOrNum.trim().toLowerCase()
            );
            if (match) {
              resolvedId = match._id;
            }
          } catch (e) {}
        }

        if (resolvedId.length !== 24) {
          const allRes = await api.get('/plots/reports/bookings').catch(() => ({ data: { data: [] } }));
          const list = allRes.data?.data || [];
          const match = list.find(
            (b) => (b.bookingNumber || '').toLowerCase() === bookingIdOrNum.trim().toLowerCase()
          );
          if (match) {
            resolvedId = match._id;
            isProduct = false;
          } else {
            const prdRes = await api.get('/plots/product-bookings').catch(() => ({ data: { data: [] } }));
            const prdList = prdRes.data?.data || [];
            const prdMatch = prdList.find(
              (b) => (b.bookingNumber || '').toLowerCase() === bookingIdOrNum.trim().toLowerCase()
            );
            if (prdMatch) {
              resolvedId = prdMatch._id;
              isProduct = true;
            } else {
              toast.error(`Booking #${bookingIdOrNum} not found.`);
              setLoading(false);
              return;
            }
          }
        }
      }

      let bk = null;
      let instList = [];
      let receiptsList = [];

      if (isProduct) {
        try {
          const prdRes = await api.get(`/plots/product-bookings/${resolvedId}`);
          bk = prdRes.data?.data;
          if (bk) {
            bk.isProductBooking = true;
            instList = bk.installments || [];
          }
        } catch (prdErr) {
          console.warn('Failed to fetch from product-bookings, trying regular booking:', prdErr);
        }
      }

      if (!bk) {
        try {
          const [bookingRes, instRes, receiptsRes] = await Promise.all([
            api.get(`/plots/bookings/${resolvedId}`),
            api.get(`/plots/bookings/${resolvedId}/installments`).catch(() => ({ data: { data: [] } })),
            api.get(`/plots/receipts/list?bookingId=${resolvedId}`).catch(() => ({ data: { data: [] } })),
          ]);
          bk = bookingRes.data?.data;
          instList = instRes.data?.data || [];
          receiptsList = receiptsRes.data?.data || [];
        } catch (regErr) {
          if (!isProduct) {
            const prdRes = await api.get(`/plots/product-bookings/${resolvedId}`);
            bk = prdRes.data?.data;
            if (bk) {
              bk.isProductBooking = true;
              instList = bk.installments || [];
              isProduct = true;
            }
          } else {
            throw regErr;
          }
        }
      }

      if (!bk) {
        toast.error('Could not find booking details');
        setLoading(false);
        return;
      }

      setSelectedBooking(bk);
      setInstallments(instList);
      setReceipts(receiptsList);
      setSearchInput(bk?.bookingNumber || '');
      setShowSuggestions(false);
      setSearchParams(
        isProduct
          ? { productBookingId: bk._id, bookingNumber: bk.bookingNumber }
          : { bookingId: bk._id, bookingNumber: bk.bookingNumber }
      );

      // Fetch commissions distributed for this booking
      try {
        const commEndpoint = isProduct
          ? `/plots/product-bookings/${resolvedId}/commissions`
          : `/plots/bookings/${resolvedId}/commissions`;
        const commRes = await api.get(commEndpoint);
        if (commRes.data?.data) {
          setBookingCommissions(commRes.data.data);
          if (commRes.data.data.commissions?.length > 0) {
            setShowCommBreakdown(true);
          }
        }
      } catch (commErr) {
        console.warn('Could not load commissions for booking:', commErr.message);
      }

      // If booking is already cancelled, load its configured refund settlement parameters
      if (bk?.status === 'CANCELLED') {
        if (
          bk.refundSettlementType === 'DEDUCTION_PENALTY' ||
          (Number(bk.refundDeduction) > 0 && !bk.refundInterestAmount)
        ) {
          setSettlementMode('DEDUCTION_PENALTY');
          setDeductionType(bk.refundDeductionType || 'PERCENT');
          setDeductionValue(bk.refundDeductionPercent || bk.refundDeduction || 20);
        } else {
          setSettlementMode('INTEREST_RETURN');
          if (bk.refundInterestRate) setAnnualRate(Number(bk.refundInterestRate));
        }
        if (bk.refundDate) {
          setAsOnDate(new Date(bk.refundDate).toISOString().split('T')[0]);
        }
      } else {
        // Auto-prefill the exact return rate from Image 2 Scheme Matrix
        try {
          const isOneTime =
            bk?.paymentType === 'FULL_PAYMENT' ||
            bk?.scheme === 'FULL_PAYMENT' ||
            bk?.paymentType === 'ONE_TIME';

          let resolvedRate = null;
          let resolvedMode = 'SIMPLE';
          let schemeLabel = '';

          // Fetch Investment Scheme Config slabs (from Image 2)
          let schemeSlabs = [];
          try {
            const invRes = await api.get('/investments/config');
            if (invRes.data?.data?.slabs) {
              schemeSlabs = invRes.data.data.slabs;
            }
          } catch (e) {}

          if (!schemeSlabs.length) {
            const schemeRes = await api.get('/plots/rate-config').catch(() => null);
            schemeSlabs = schemeRes?.data?.data?.schemeSlabs || [];
          }

          const tenure = Number(bk?.tenureMonths) || 24;
          const matchedSlab = schemeSlabs.find(
            (s) => Number(s.tenureMonths) === tenure || (bk?.planName && s.planName === bk?.planName)
          );

          if (matchedSlab) {
            const slabRate = isOneTime
              ? (matchedSlab.fdAnnualInterestRate ?? matchedSlab.annualInterestRate)
              : (matchedSlab.rdAnnualInterestRate ?? matchedSlab.annualInterestRate);

            if (slabRate !== undefined && slabRate !== null && Number(slabRate) > 0) {
              resolvedRate = Number(slabRate);
              schemeLabel = `${tenure}M • ${isOneTime ? 'One-Time' : 'EMI'}`;
            }
          }

          if (
            (resolvedRate === null || resolvedRate === undefined) &&
            bk?.annualInterestRate !== undefined &&
            bk?.annualInterestRate !== null &&
            Number(bk.annualInterestRate) > 0
          ) {
            resolvedRate = Number(bk.annualInterestRate);
            schemeLabel = `${tenure}M Booking Rate`;
          }

          if (resolvedRate !== null && Number(resolvedRate) > 0) {
            setAnnualRate(resolvedRate);
            setCalculationMode(resolvedMode);
            setMatchedSchemeInfo(schemeLabel);
          }
        } catch (rateErr) {
          console.error('Error resolving scheme rate for booking:', rateErr);
        }
      }
    } catch (err) {
      console.error('Failed to load booking details:', err);
      toast.error('Could not load booking details');
    } finally {
      setLoading(false);
    }
  };

  // Check URL params on initial load
  useEffect(() => {
    const prdId = searchParams.get('productBookingId');
    const idFromParam = searchParams.get('bookingId');
    const numFromParam = searchParams.get('bookingNumber');

    if (prdId) {
      loadBookingDetails(prdId, true);
    } else if (idFromParam) {
      loadBookingDetails(idFromParam);
    } else if (numFromParam) {
      loadBookingDetails(numFromParam);
    }
  }, []);

  const handleSelectBooking = (bk) => {
    setSelectedBooking(bk);
    setSearchInput(bk.bookingNumber);
    setShowSuggestions(false);
    loadBookingDetails(bk._id, Boolean(bk.isProductBooking));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      toast.warning('Please enter a booking number or customer name');
      return;
    }
    loadBookingDetails(searchInput.trim());
  };

  // ──────────────── CALCULATIONS & TRANSACTIONS BREAKDOWN ────────────────
  const paymentEntries = [];

  const isProduct = Boolean(
    selectedBooking?.isProductBooking ||
    selectedBooking?.bookingNumber?.toUpperCase().startsWith('PRD-')
  );

  if (isProduct) {
    const cols = Array.isArray(selectedBooking?.collections) ? selectedBooking.collections : [];
    if (cols.length > 0) {
      cols.forEach((col, idx) => {
        const lateFine = Number(col.lateFinePaid) || 0;
        const grossAmount = Number(col.amountPaid) || 0;
        const principal = Number(col.principalPaid) || Math.max(0, grossAmount - lateFine);

        paymentEntries.push({
          id: col._id || `col-${idx}`,
          receiptNumber: col.receiptNumber || `PRD-RCP-${idx + 1}`,
          paymentType: col.receiptNumber?.includes('DP') ? 'Downpayment / Initial Deposit' : 'Installment Collection',
          paymentMode: col.paymentMode || 'Cash',
          reference: col.transactionReference || '-',
          depositDate: col.paymentDate ? new Date(col.paymentDate) : (col.createdAt ? new Date(col.createdAt) : new Date(selectedBooking.bookingDate || Date.now())),
          amount: principal,
          principalAmount: principal,
          lateFineAmount: lateFine,
          grossAmount: principal + lateFine,
          remarks: col.remarks || '',
        });
      });
    } else if (Number(selectedBooking?.downPayment || selectedBooking?.totalPaid) > 0) {
      const principal = Number(selectedBooking.downPayment || selectedBooking.totalPaid) || 0;
      paymentEntries.push({
        id: 'initial-prd-dp',
        receiptNumber: `PRD-DP-${selectedBooking.bookingNumber}`,
        paymentType: selectedBooking.paymentType === 'FULL_PAYMENT' ? 'Full Payment Deposit' : 'Downpayment Deposit',
        paymentMode: 'Cash / Bank',
        reference: 'Booking Register',
        depositDate: selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate) : new Date(),
        amount: principal,
        principalAmount: principal,
        lateFineAmount: 0,
        grossAmount: principal,
        remarks: 'Initial Booking Deposit',
      });
    }
  } else if (receipts && receipts.length > 0) {
    receipts.forEach((rc) => {
      const depositDate = rc.createdAt
        ? new Date(rc.createdAt)
        : (selectedBooking?.bookingDate ? new Date(selectedBooking.bookingDate) : new Date());
      const typeLabel =
        rc.receiptType === 'DOWNPAYMENT'
          ? 'Downpayment / Initial Deposit'
          : rc.receiptType === 'BOOKING'
          ? 'Booking Deposit'
          : rc.receiptType === 'FULL_PAYMENT'
          ? 'Full Payment Deposit'
          : 'Installment Collection';

      const lateFine = Number(rc.lateFinePaid) || 0;
      const grossAmount = Number(rc.amount) || 0;
      const principal = Math.max(0, grossAmount - lateFine);

      paymentEntries.push({
        id: rc._id,
        receiptNumber: rc.receiptNumber || 'N/A',
        paymentType: typeLabel,
        paymentMode: rc.paymentMode || 'Cash',
        reference: rc.transactionReference || '-',
        depositDate: depositDate,
        amount: principal,
        principalAmount: principal,
        lateFineAmount: lateFine,
        grossAmount: grossAmount,
        remarks: rc.remarks || '',
      });
    });
  } else if (selectedBooking && Number(selectedBooking.bookingAmount) > 0) {
    const principal = Number(selectedBooking.bookingAmount) || 0;
    paymentEntries.push({
      id: 'initial-booking',
      receiptNumber: selectedBooking.bookingNumber ? `BKG-${selectedBooking.bookingNumber}` : 'INIT-01',
      paymentType: selectedBooking.scheme === 'FULL_PAYMENT' ? 'Full Payment Deposit' : 'Booking Advance Deposit',
      paymentMode: 'Cash / Bank',
      reference: 'Booking Register',
      depositDate: selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate) : new Date(),
      amount: principal,
      principalAmount: principal,
      lateFineAmount: 0,
      grossAmount: principal,
      remarks: 'Initial Booking Deposit',
    });
  }

  // Sort payment entries chronologically
  paymentEntries.sort((a, b) => new Date(a.depositDate) - new Date(b.depositDate));

  const targetDate = asOnDate ? new Date(asOnDate) : new Date();
  targetDate.setHours(23, 59, 59, 999);

  let totalDepositedPrincipal = 0;
  let totalLateFinePaid = 0;
  let totalCalculatedInterest = 0;

  const isDeductionMode = settlementMode === 'DEDUCTION_PENALTY';

  const computedBreakdown = paymentEntries.map((item, idx) => {
    const depDate = new Date(item.depositDate);
    const depTime = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate()).getTime();
    const asOnTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();

    const diffMs = Math.max(0, asOnTime - depTime);
    const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const yearsElapsed = daysElapsed / 365;

    const principal = item.principalAmount;
    const lateFine = item.lateFineAmount || 0;
    const rate = isDeductionMode ? 0 : (Number(annualRate) || 0);

    let interest = 0;
    if (!isDeductionMode && rate > 0) {
      if (calculationMode === 'COMPOUND_ANNUAL') {
        interest = principal * (Math.pow(1 + rate / 100, yearsElapsed) - 1);
      } else {
        interest = (principal * rate * daysElapsed) / (365 * 100);
      }
    }

    const roundedInterest = Math.max(0, Math.round(interest * 100) / 100);
    const totalAmount = Math.round((principal + roundedInterest) * 100) / 100;

    totalDepositedPrincipal += principal;
    totalLateFinePaid += lateFine;
    totalCalculatedInterest += roundedInterest;

    return {
      ...item,
      serialNo: idx + 1,
      depositDateStr: depDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      daysElapsed,
      yearsElapsed: yearsElapsed.toFixed(2),
      ratePercent: rate,
      interestAmount: roundedInterest,
      totalAmount: totalAmount,
    };
  });

  // Calculate deduction amount if in deduction mode
  let calculatedDeduction = 0;
  if (isDeductionMode) {
    if (deductionType === 'PERCENT') {
      const pct = Number(deductionValue) || 0;
      calculatedDeduction = Math.round(((totalDepositedPrincipal * pct) / 100) * 100) / 100;
    } else {
      calculatedDeduction = Math.min(totalDepositedPrincipal, Number(deductionValue) || 0);
    }
  }

  // Net final settlement amount
  const netSettlementPayable = isDeductionMode
    ? Math.max(0, Math.round((totalDepositedPrincipal - calculatedDeduction) * 100) / 100)
    : Math.round((totalDepositedPrincipal + totalCalculatedInterest) * 100) / 100;

  const netPlotValue = isProduct
    ? Number(selectedBooking?.totalAmount || 0)
    : Math.max(0, (Number(selectedBooking?.plotValue) || 0) - (Number(selectedBooking?.discount) || 0));
  const remainingDue = Math.max(0, netPlotValue - totalDepositedPrincipal);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenCancelModal = async () => {
    try {
      const [treasuryRes, myCashRes] = await Promise.all([
        api.get('/ledger/treasury?intent=payment').catch(() => ({ data: {} })),
        api.get('/ledger/my-cash-account').catch(() => ({ data: null })),
      ]);
      const tData = treasuryRes.data?.data || treasuryRes.data || {};
      const banks = tData.bankLedgers || tData.bankAccounts || [];
      const cash = tData.cashLedgers || tData.cashAccounts || [];
      setTreasuryLedgers({ bankLedgers: banks, cashLedgers: cash });
      const myCash = myCashRes.data?.data || myCashRes.data || null;
      setMyCashLedger(myCash);
      if (initialPayMode === 'CASH') {
        setInitialPaymentLedgerId(myCash?._id || '');
      } else if (banks.length > 0) {
        setInitialPaymentLedgerId(banks[0]._id);
      }
    } catch (e) {
      console.error('Error fetching treasury:', e);
    }
    setShowCancelModal(true);
  };

  const handleInitialModeChange = (newMode) => {
    setInitialPayMode(newMode);
    if (newMode === 'CASH') {
      setInitialPaymentLedgerId(myCashLedger?._id || '');
    } else {
      const banks = treasuryLedgers.bankLedgers || [];
      setInitialPaymentLedgerId(banks[0]?._id || '');
    }
  };

  const selectedTreasuryLedger = useMemo(() => {
    if (initialPayMode === 'CASH') {
      return myCashLedger;
    }
    return (treasuryLedgers.bankLedgers || []).find((b) => b._id === initialPaymentLedgerId);
  }, [initialPayMode, initialPaymentLedgerId, myCashLedger, treasuryLedgers.bankLedgers]);

  // ──────────────── SUBMIT CANCELLATION & SETTLEMENT ACTION ────────────────
  const handleConfirmCancellation = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBooking) return;

    try {
      setCancelSubmitting(true);

      const payload = {
        settlementType: settlementMode,
        deductionType: deductionType,
        deductionPercent: deductionType === 'PERCENT' ? (Number(deductionValue) || 0) : 0,
        deductionAmount: isDeductionMode ? calculatedDeduction : 0,
        interestRate: !isDeductionMode ? (Number(annualRate) || 0) : 0,
        interestAmount: !isDeductionMode ? totalCalculatedInterest : 0,
        netSettlementAmount: netSettlementPayable,
        refundDate: asOnDate || new Date().toISOString().split('T')[0],
        remarks:
          (cancelReason || '').trim() ||
          (isDeductionMode
            ? `Cancelled with ${deductionType === 'PERCENT' ? `${deductionValue}%` : 'Flat ₹'} Deduction`
            : `Settled with ${annualRate}% Interest Return`),
        initialPaymentAmount: initialPayNow ? (Number(initialPayAmount) || 0) : 0,
        paymentMode: initialPayMode,
        paymentLedgerId: initialPayNow ? (initialPaymentLedgerId || null) : null,
        transactionReference: initialPayRef,
        reverseCommission: Boolean(reverseCommission),
      };

      const endpoint = isProduct
        ? `/plots/product-bookings/${selectedBooking._id}/refund`
        : `/plots/bookings/${selectedBooking._id}/refund`;

      await api.post(endpoint, payload);
      toast.success(
        isProduct
          ? 'Plot product booking cancelled and settlement recorded successfully!'
          : 'Plot booking cancelled and settlement recorded in ledger successfully!'
      );
      setShowCancelModal(false);

      if (isProduct) {
        navigate('/dashboard/plots/product-sales');
      } else {
        navigate(`/dashboard/plots/booking/${selectedBooking._id}/ledger`);
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking and process settlement');
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Search Bar (hidden in print) */}
      <div className="print:hidden bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">
                Plot Settlement & Cancellation Calculator
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate customer refunds with either Annual Interest/Appreciation or Cancellation Penalty Deductions, and record settlements directly into the booking ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => navigate(isProduct ? '/dashboard/plots/product-sales' : '/dashboard/plots/booking')}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft size={15} /> {isProduct ? 'Product Sales & Bookings' : 'Bookings'}
            </button>
            {selectedBooking && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Printer size={15} /> Print Statement
              </button>
            )}
          </div>
        </div>

        {/* Two-Tier Clean Workflow: Step 1 & Step 2 */}
        <div className="space-y-4 pt-2">
          {/* Tier 1: Search & Booking Selection Bar */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by Booking #, Customer Name, or Phone..."
                    value={searchInput}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    className="w-full h-10 bg-white border border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none pl-9 pr-4 rounded-lg font-medium text-xs text-slate-800 shadow-2xs transition"
                  />
                  <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  className="ml-2 px-4 h-10 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {loading ? <Loader2 size={14} className="animate-spin text-white" /> : 'Search'}
                </button>
              </form>

              {/* Suggestions Dropdown */}
              {showSuggestions && bookingSuggestions.length > 0 && (
                <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Matching Bookings ({bookingSuggestions.length})
                  </div>
                  {bookingSuggestions.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => handleSelectBooking(b)}
                      className="p-3 hover:bg-teal-50/70 border-b border-slate-100 last:border-0 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800 text-xs px-2 py-0.5 bg-teal-100/60 rounded">
                            #{b.bookingNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${b.isProductBooking ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                            {b.isProductBooking ? 'PRODUCT' : 'PLOT'}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {b.customerId?.name || b.customerName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {b.isProductBooking
                            ? `${b.productId?.productName || 'Micro Plot Unit'} (x${b.quantity || 1}) | Ph: ${b.customerId?.mobile || b.customerMobile || 'N/A'}`
                            : `Plot: ${b.plotId?.plotNumber || 'N/A'} (${b.plotId?.seriesId?.name || 'Standard'}) | Ph: ${b.customerId?.mobile || b.customerMobile || 'N/A'}`}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        ₹{Number(b.isProductBooking ? (b.totalAmount || 0) : (b.plotValue || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedBooking && (
              <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 border border-slate-200 rounded-lg">
                <span className="text-[11px] text-slate-400 uppercase font-bold">Active Contract:</span>
                <span className="font-mono font-bold text-teal-800">#{selectedBooking.bookingNumber}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-700 truncate max-w-[150px]">{selectedBooking.customerId?.name || selectedBooking.customerName}</span>
              </div>
            )}
          </div>

          {/* Tier 2: Settlement Parameters Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Control 1: Settlement Mode */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Settlement Action
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl h-11 items-center">
                <button
                  type="button"
                  onClick={() => setSettlementMode('INTEREST_RETURN')}
                  className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    !isDeductionMode
                      ? 'bg-white text-teal-900 shadow-2xs border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp size={14} className={!isDeductionMode ? 'text-teal-700' : 'text-slate-400'} />
                  + Interest Return
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementMode('DEDUCTION_PENALTY')}
                  className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    isDeductionMode
                      ? 'bg-white text-rose-800 shadow-2xs border border-rose-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Percent size={14} className={isDeductionMode ? 'text-rose-600' : 'text-slate-400'} />
                  - Penalty Deduct
                </button>
              </div>
            </div>

            {/* Control 2: Calculation Method OR Deduction Type */}
            {!isDeductionMode ? (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Interest Formula
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl h-11 items-center">
                  <button
                    type="button"
                    onClick={() => setCalculationMode('SIMPLE')}
                    className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      calculationMode === 'SIMPLE'
                        ? 'bg-white text-teal-900 shadow-2xs border border-teal-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Simple Interest
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('COMPOUND_ANNUAL')}
                    className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      calculationMode === 'COMPOUND_ANNUAL'
                        ? 'bg-white text-teal-900 shadow-2xs border border-teal-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Compounding
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Deduction Basis
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl h-11 items-center">
                  <button
                    type="button"
                    onClick={() => setDeductionType('PERCENT')}
                    className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      deductionType === 'PERCENT'
                        ? 'bg-white text-rose-800 shadow-2xs border border-rose-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeductionType('FLAT')}
                    className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      deductionType === 'FLAT'
                        ? 'bg-white text-rose-800 shadow-2xs border border-rose-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                </div>
              </div>
            )}

            {/* Control 3: Rate Value OR Deduction Value */}
            {!isDeductionMode ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Annual Rate (% P.A.)
                  </label>
                  {matchedSchemeInfo && (
                    <span className="text-[10px] font-mono text-teal-700 font-semibold truncate max-w-[120px]">
                      {matchedSchemeInfo}
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-white border border-slate-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 rounded-xl px-3 h-11 shadow-2xs transition">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    className="w-full bg-transparent font-bold text-sm text-teal-900 outline-none"
                    placeholder="10.88"
                  />
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap ml-1">% P.A.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Penalty Value
                  </label>
                  <span className="text-[10px] text-rose-600 font-semibold">
                    {deductionType === 'PERCENT' ? 'Against Principal' : 'Fixed Charge'}
                  </span>
                </div>
                <div className="flex items-center bg-white border border-slate-300 focus-within:border-rose-600 focus-within:ring-2 focus-within:ring-rose-100 rounded-xl px-3 h-11 shadow-2xs transition">
                  <input
                    type="number"
                    step={deductionType === 'PERCENT' ? '0.5' : '100'}
                    min="0"
                    value={deductionValue}
                    onChange={(e) => setDeductionValue(e.target.value)}
                    className="w-full bg-transparent font-bold text-sm text-rose-900 outline-none"
                    placeholder={deductionType === 'PERCENT' ? '20' : '50000'}
                  />
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap ml-1">
                    {deductionType === 'PERCENT' ? '%' : '₹'}
                  </span>
                </div>
              </div>
            )}

            {/* Control 4: As on Date / Cancellation Effective Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isDeductionMode ? 'Cancellation Date' : 'Settlement / As on Date'}
              </label>
              <DateInput
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
                className="h-11 rounded-xl !py-0 shadow-2xs text-xs font-semibold"
              />
            </div>
          </div>

          {/* Active Contract Commission Reversal Banner & Direct Cancel CTA */}
          {selectedBooking && selectedBooking.status !== 'CANCELLED' && (
            <div className="p-3.5 rounded-xl border bg-gradient-to-r from-amber-50/90 via-white to-rose-50/80 border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      Commission Reversal on Cancellation:
                    </span>
                    {bookingCommissions.totalActiveAmount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300">
                        ₹{bookingCommissions.totalActiveAmount.toLocaleString('en-IN')} Active ({bookingCommissions.activeCount || bookingCommissions.commissions?.length || 0} Distributions)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        No active commissions
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Review the exact debit breakdown for Business Associate, Partner, and Branch ledgers below before confirming cancellation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Calculating deposited amounts & settlement values...</p>
        </div>
      )}

      {/* If No Booking Selected */}
      {!loading && !selectedBooking && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
            <Search size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Booking Selected</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please search or select a booking above using the Booking Number or customer details to calculate refund, extra return, or cancellation deduction.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard/plots/booking')}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Browse All Bookings
            </button>
          </div>
        </div>
      )}

      {/* Main Statement Content */}
      {!loading && selectedBooking && (
        <div className="space-y-6 print:space-y-4 print:p-0">
          
          {/* Printable Header */}
          <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">Good Nature Projects Pvt. Ltd.</h1>
                <p className="text-xs text-slate-600">Raj Bhawan, ManglaSthan, Ramchandrapur, Bihar Sharif - 803101</p>
                <h2 className="text-sm font-bold text-teal-900 mt-2 uppercase tracking-wide">
                  Plot Refund & Settlement Statement ({isDeductionMode ? 'With Cancellation Deduction' : 'With Extra Interest Return'})
                </h2>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-slate-800">Date Generated: {new Date().toLocaleDateString('en-IN')}</p>
                <p className="text-slate-600">Settlement Date: {new Date(targetDate).toLocaleDateString('en-IN')}</p>
                <p className="font-bold text-teal-800">
                  {isDeductionMode
                    ? `Deduction: ${deductionType === 'PERCENT' ? `${deductionValue}%` : `₹${deductionValue}`}`
                    : `Applied Rate: ${annualRate}% P.A.`}
                </p>
              </div>
            </div>
          </div>

          {/* Already Cancelled Alert Banner */}
          {selectedBooking.status === 'CANCELLED' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">This Booking is Already Cancelled</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Settlement adjustment has been established in the financial ledger. Track part-payment disbursements directly on the statement.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/plots/booking/${selectedBooking._id}/ledger`)}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <BookOpen size={14} /> View Booking Ledger
              </button>
            </div>
          )}

          {/* Customer & Plot Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:border-slate-300 print:shadow-none print:p-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</p>
              <h4 className="text-sm font-black text-slate-800 mt-1 uppercase">
                {selectedBooking.customerId?.name || selectedBooking.customerName || 'N/A'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Cust ID: <span className="font-semibold">{selectedBooking.customerId?.customerId || 'N/A'}</span>
              </p>
              <p className="text-xs text-slate-600">
                Phone: <span className="font-semibold">{selectedBooking.customerId?.mobile || selectedBooking.customerMobile || 'N/A'}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isProduct ? 'Product & Dimensions' : 'Plot Information'}
              </p>
              <h4 className="text-sm font-black text-slate-800 mt-1">
                {isProduct ? (
                  <>
                    {selectedBooking.productId?.productName || 'Micro Plot Unit'}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-[10px] font-bold border border-teal-200">
                      x{selectedBooking.quantity || 1}
                    </span>
                  </>
                ) : (
                  `Plot #${selectedBooking.plotId?.plotNumber || 'N/A'}`
                )}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {isProduct
                  ? `Dimensions: ${selectedBooking.dimensionsSnapshot?.dimensionLabel || `${selectedBooking.dimensionsSnapshot?.north || 1}x${selectedBooking.dimensionsSnapshot?.east || 2} ft`}`
                  : `Series: ${selectedBooking.plotId?.seriesId?.name || 'Standard'}`}
              </p>
              <p className="text-xs text-slate-600">
                {isProduct
                  ? `Total Area: ${selectedBooking.totalAreaSqFt || (selectedBooking.productId?.areaSqFt ? selectedBooking.productId.areaSqFt * (selectedBooking.quantity || 1) : '-')} Sq Ft`
                  : `Size: ${selectedBooking.plotId?.plotSize || 1200} Sq Ft (${selectedBooking.plotId?.plotType || 'NORMAL'})`}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Booking Contract</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono font-bold text-teal-800 text-sm px-2.5 py-0.5 bg-teal-50 border border-teal-200 rounded-lg">
                  #{selectedBooking.bookingNumber}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedBooking.status === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedBooking.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Booking Date: <span className="font-semibold">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </p>
              <p className="text-xs text-slate-600">
                Scheme: <span className="font-semibold">
                  {selectedBooking.paymentType === 'FULL_PAYMENT' || selectedBooking.scheme === 'FULL_PAYMENT'
                    ? 'One Time (Full Payment / F.D.)'
                    : `Monthly EMI (R.D. - ${selectedBooking.tenureMonths || 24}M)`}
                </span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Financial Valuation</p>
              <h4 className="text-sm font-black text-slate-800 mt-1">
                ₹{netPlotValue.toLocaleString('en-IN')}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Total Deposited: <span className="font-bold text-teal-800">₹{totalDepositedPrincipal.toLocaleString('en-IN')}</span>
              </p>
              <p className="text-xs text-slate-600">
                Remaining Balance: <span className="font-bold text-amber-700">₹{remainingDue.toLocaleString('en-IN')}</span>
              </p>
              <p className="text-xs text-slate-600">
                Commissions: <span className="font-bold text-slate-800">
                  {selectedBooking.status === 'CANCELLED'
                    ? (selectedBooking.commissionReversed ? `Reversed (₹${Number(selectedBooking.commissionReversalAmount || 0).toLocaleString('en-IN')})` : 'Not Reversed')
                    : `₹${bookingCommissions.totalActiveAmount.toLocaleString('en-IN')} Distributed`}
                </span>
              </p>
            </div>
          </div>

          {/* KPI Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
            {/* Total Principal Paid */}
            <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-xs print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Principal Deposited</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700 print:hidden">
                  <Banknote className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-2 font-mono">
                ₹{totalDepositedPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Across {computedBreakdown.length} deposited transaction(s)
                {totalLateFinePaid > 0 && ` • ₹${totalLateFinePaid.toLocaleString('en-IN')} Fine Separate`}
              </p>
            </div>

            {/* Accrued Interest OR Cancellation Deduction Card */}
            {!isDeductionMode ? (
              <div className="bg-white border border-teal-200 p-4 md:p-5 rounded-2xl shadow-xs bg-teal-50/20 print:border-slate-300 print:bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    Accrued Interest / Growth ({annualRate}%)
                  </span>
                  <span className="p-2 rounded-xl bg-teal-100 text-teal-800 print:hidden">
                    <IndianRupee className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-teal-700 mt-2 font-mono">
                  + ₹{totalCalculatedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-teal-800/80 mt-1">
                  Calculated from billing dates till {new Date(targetDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-rose-200 p-4 md:p-5 rounded-2xl shadow-xs bg-rose-50/20 print:border-slate-300 print:bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Cancellation Deduction ({deductionType === 'PERCENT' ? `${deductionValue}%` : 'Flat ₹'})
                  </span>
                  <span className="p-2 rounded-xl bg-rose-100 text-rose-800 print:hidden">
                    <RotateCcw className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-rose-700 mt-2 font-mono">
                  - ₹{calculatedDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-rose-700/80 mt-1">
                  Penalty / administrative deduction from deposited amount
                </p>
              </div>
            )}

            {/* Net Settlement Value */}
            <div className={`text-white p-4 md:p-5 rounded-2xl shadow-md print:bg-white print:text-slate-900 print:border print:border-slate-300 ${
              isDeductionMode
                ? 'bg-gradient-to-br from-slate-900 to-rose-950'
                : 'bg-gradient-to-br from-teal-800 to-teal-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider print:text-slate-600">
                  {isDeductionMode ? 'Net Refund Settlement Value' : 'Total Payable Settlement Amount'}
                </span>
                <span className="p-2 rounded-xl bg-white/10 text-white print:hidden">
                  <Sparkles className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black mt-2 font-mono print:text-slate-900">
                ₹{netSettlementPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 print:text-slate-500">
                {isDeductionMode ? 'Deposits - Cancellation Penalty' : 'Principal Deposited + Accrued Growth'}
              </p>
            </div>
          </div>

          {/* Detailed Transaction Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden print:border-slate-300 print:shadow-none">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {isDeductionMode
                    ? 'Deposited Payments & Cancellation Deduction Computation'
                    : 'Deposited Payments & Interest Computation Breakdown'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isDeductionMode
                    ? 'Individual deposit payments with net penalty deduction calculated against total collection.'
                    : 'Detailed day-wise interest calculation for each deposited installment & downpayment.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {!isDeductionMode ? (
                  <>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                      Calculation: <strong className="text-teal-800">{calculationMode === 'SIMPLE' ? 'Simple Interest' : 'Annual Compounding'}</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                      Rate: <strong className="text-teal-800">{annualRate}% P.A.</strong>
                    </span>
                  </>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                    Deduction: <strong>{deductionType === 'PERCENT' ? `${deductionValue}% Penalty` : `Flat ₹${deductionValue}`}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">Deposit Date</th>
                    <th className="p-3.5">Payment Type</th>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5 text-right">Principal Paid</th>
                    <th className="p-3.5 text-right">Late Fine</th>
                    {!isDeductionMode && (
                      <>
                        <th className="p-3.5 text-center">Days Elapsed</th>
                        <th className="p-3.5 text-center">Rate</th>
                        <th className="p-3.5 text-right text-teal-800">Accrued Interest</th>
                        <th className="p-3.5 text-right font-black">Total Current Value</th>
                      </>
                    )}
                    {isDeductionMode && (
                      <th className="p-3.5 text-center">Payment Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={isDeductionMode ? 7 : 10} className="p-8 text-center text-slate-400 font-medium">
                        No deposited payment records found for this booking.
                      </td>
                    </tr>
                  ) : (
                    computedBreakdown.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 text-center font-bold text-slate-400">{row.serialNo}</td>
                        <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                          {row.depositDateStr}
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">
                          <div>{row.paymentType}</div>
                          {row.remarks && <div className="text-[10px] text-slate-400 italic">{row.remarks}</div>}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 font-medium">
                          {row.receiptNumber}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-800 font-mono">
                          ₹{row.principalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-right font-mono">
                          {row.lateFineAmount > 0 ? (
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              ₹{row.lateFineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>
                        {!isDeductionMode ? (
                          <>
                            <td className="p-3.5 text-center font-medium text-slate-600">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-[11px]">
                                {row.daysElapsed} days
                              </span>
                              <div className="text-[10px] text-slate-400 font-normal">({row.yearsElapsed} yrs)</div>
                            </td>
                            <td className="p-3.5 text-center font-semibold text-slate-700">
                              {row.ratePercent}%
                            </td>
                            <td className="p-3.5 text-right font-bold text-teal-700 font-mono">
                              + ₹{row.interestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3.5 text-right font-black text-slate-900 font-mono">
                              ₹{row.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        ) : (
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Realized
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                {computedBreakdown.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan="4" className="p-4 text-right uppercase tracking-wider text-xs">
                        Total Principal Deposited:
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-900">
                        ₹{totalDepositedPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-mono text-xs font-bold text-amber-800">
                        {totalLateFinePaid > 0 ? `₹${totalLateFinePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      {!isDeductionMode ? (
                        <>
                          <td colSpan="2" className="p-4 text-center text-xs text-slate-500 font-semibold">
                            As on {new Date(targetDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="p-4 text-right font-mono text-sm text-teal-800">
                            + ₹{totalCalculatedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-right font-mono text-base text-teal-950 font-black">
                            ₹{netSettlementPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </>
                      ) : (
                        <td className="p-4 text-center text-xs text-slate-500 font-semibold">
                          {computedBreakdown.length} Deposit(s)
                        </td>
                      )}
                    </tr>

                    {/* Additional Deduction and Net Refund summary rows for Deduction mode */}
                    {isDeductionMode && (
                      <>
                        <tr className="bg-rose-50/60 font-bold text-rose-900 border-t border-rose-200">
                          <td colSpan="4" className="p-3.5 text-right uppercase tracking-wider text-xs">
                            Less: Cancellation Penalty ({deductionType === 'PERCENT' ? `${deductionValue}%` : 'Flat Amount'}):
                          </td>
                          <td className="p-3.5 text-right font-mono text-sm text-rose-700">
                            - ₹{calculatedDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan="2" className="p-3.5 text-center text-[11px] text-rose-600">
                            {deductionType === 'PERCENT' ? `${deductionValue}% of ₹${totalDepositedPrincipal.toLocaleString('en-IN')}` : 'Flat Charge'}
                          </td>
                        </tr>
                        <tr className="bg-slate-900 font-black text-white border-t-2 border-slate-950">
                          <td colSpan="4" className="p-4 text-right uppercase tracking-wider text-xs">
                            Net Refundable Settlement Amount:
                          </td>
                          <td className="p-4 text-right font-mono text-base text-white">
                            ₹{netSettlementPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan="2" className="p-4 text-center text-xs text-emerald-300 font-semibold">
                            Payable to Customer
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Bottom Cancellation & Settlement Action Card */}
          {selectedBooking.status !== 'CANCELLED' && (
            <div className="print:hidden p-5 bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Process Plot Cancellation & Record Settlement in Ledger
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isDeductionMode
                      ? `Releases Plot #${selectedBooking.plotId?.plotNumber || ''} back to stock and creates a ledger refund liability of ₹${netSettlementPayable.toLocaleString('en-IN')} (after deducting ₹${calculatedDeduction.toLocaleString('en-IN')} penalty).`
                      : `Releases Plot #${selectedBooking.plotId?.plotNumber || ''} back to stock and records a settlement liability of ₹${netSettlementPayable.toLocaleString('en-IN')} (including ₹${totalCalculatedInterest.toLocaleString('en-IN')} interest growth).`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCancelModal}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                <XCircle size={16} /> Cancel & Settle Booking
              </button>
            </div>
          )}

          {/* Formula Note & Disclaimer */}
          <div className="p-4 bg-slate-100 rounded-xl text-slate-600 text-xs space-y-1 print:border print:border-slate-300 print:bg-white">
            <p className="font-bold text-slate-800">Settlement Rules & Methodology:</p>
            {!isDeductionMode ? (
              <>
                <p>
                  • <strong>Interest Calculation:</strong> Simple Interest formula <code className="bg-white px-1.5 py-0.5 rounded text-teal-800 font-mono">Interest = (Principal × Rate × Days) / (365 × 100)</code> is applied individually to each deposit from its billing/deposit date to the specified evaluation date ({new Date(targetDate).toLocaleDateString('en-IN')}).
                </p>
                <p>
                  • <strong>Configurable Rate:</strong> Default percentage is set to <strong>{annualRate}% P.A.</strong> as per scheme plan policy and can be adjusted above.
                </p>
              </>
            ) : (
              <>
                <p>
                  • <strong>Cancellation Deduction:</strong> A penalty deduction of <strong>{deductionType === 'PERCENT' ? `${deductionValue}%` : `₹${deductionValue}`}</strong> is deducted from the total deposits (₹{totalDepositedPrincipal.toLocaleString('en-IN')}), leaving net settlement payable of <strong>₹{netSettlementPayable.toLocaleString('en-IN')}</strong>.
                </p>
                <p>
                  • <strong>Zero Interest in Deduction Mode:</strong> No growth interest is credited when booking is cancelled under deduction penalty.
                </p>
              </>
            )}
          </div>

          {/* Printable Signature Section */}
          <div className="hidden print:block pt-16 mt-8 border-t border-slate-300">
            <div className="flex justify-between items-end text-xs font-bold text-slate-800">
              <div className="text-center">
                <div className="w-48 border-b border-dashed border-slate-400 mb-1.5" />
                <p>Prepared By / Operator</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-dashed border-slate-400 mb-1.5" />
                <p>Customer Signature</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-dashed border-slate-400 mb-1.5" />
                <p>Authorized Signatory</p>
                <p className="text-[10px] text-slate-500 font-normal">For Good Nature Projects Pvt. Ltd.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ──────────────── CONFIRM CANCELLATION MODAL ──────────────── */}
      <Modalbox
        open={showCancelModal && Boolean(selectedBooking)}
        onClose={() => setShowCancelModal(false)}
        size="lg"
        title={isProduct ? 'Confirm Plot Product Cancellation' : 'Confirm Plot Cancellation'}
        subtitle={`Booking #${selectedBooking?.bookingNumber} • ${isProduct ? (selectedBooking?.productId?.productName || 'Micro Plot Unit') : `Plot #${selectedBooking?.plotId?.plotNumber || ''}`}`}
        icon={<XCircle className="text-rose-600" size={20} />}
        bodyClassName="p-5 space-y-4 text-xs"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              disabled={cancelSubmitting}
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleConfirmCancellation}
              disabled={cancelSubmitting}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {cancelSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Confirm Cancellation &amp; Settle
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleConfirmCancellation} className="space-y-4">
          {/* Financial Terms Summary Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Customer:</span>
              <strong className="text-slate-900">{selectedBooking?.customerId?.name || selectedBooking?.customerName}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Deposited Principal:</span>
              <strong className="font-mono text-slate-900">₹{totalDepositedPrincipal.toLocaleString('en-IN')}</strong>
            </div>
            {totalLateFinePaid > 0 && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Late Fine Collected (Non-refundable):</span>
                <strong className="font-mono text-amber-800">₹{totalLateFinePaid.toLocaleString('en-IN')}</strong>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Settlement Adjustment:</span>
              <strong className={`font-mono ${isDeductionMode ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isDeductionMode
                  ? `- ₹${calculatedDeduction.toLocaleString('en-IN')} (${deductionType === 'PERCENT' ? `${deductionValue}% Penalty` : 'Flat'})`
                  : `+ ₹${totalCalculatedInterest.toLocaleString('en-IN')} (${annualRate}% Return)`}
              </strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black">
              <span className="text-slate-900">Net Refund Payable:</span>
              <span className="font-mono text-rose-800 text-base">₹{netSettlementPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Cancellation Date */}
          <div>
            <DateInput
              label="Cancellation Effective Date"
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="h-10 rounded-xl text-xs"
              required
            />
          </div>

          {/* Reason / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason &amp; Remarks
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation due to personal emergency..."
              className="w-full p-2.5 bg-white border border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 rounded-xl text-xs outline-none"
            />
          </div>

          {/* Commission Reversal Configuration */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            reverseCommission ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none flex-1">
                <input
                  type="checkbox"
                  checked={reverseCommission}
                  onChange={(e) => setReverseCommission(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">
                      Reverse Distributed Commissions (BA, Partner &amp; Branch)
                    </span>
                    {bookingCommissions.totalActiveAmount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        ₹{bookingCommissions.totalActiveAmount.toLocaleString('en-IN')} to debit
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {reverseCommission ? (
                      <>
                        Debits the exact commission amount previously credited to Associate, Partner &amp; Branch ledgers for each collection receipt with matching reversal narration.
                      </>
                    ) : (
                      <span className="text-rose-600 font-semibold">
                        ⚠️ Commissions will NOT be reversed. Associate &amp; Partner ledgers will remain untouched and retain credited commissions.
                      </span>
                    )}
                  </p>
                </div>
              </label>

              {bookingCommissions.commissions?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCommBreakdown(!showCommBreakdown)}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline whitespace-nowrap cursor-pointer shrink-0 pt-0.5"
                >
                  {showCommBreakdown ? 'Hide Details' : `View (${bookingCommissions.commissions.length})`}
                </button>
              )}
            </div>

            {/* Commission Distribution Breakdown Preview */}
            {showCommBreakdown && bookingCommissions.commissions?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2 max-h-52 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Commission Distribution Breakdown</span>
                  <span>{bookingCommissions.activeCount || 0} active • {bookingCommissions.reversedCount || 0} reversed</span>
                </div>
                {bookingCommissions.commissions.map((c, idx) => {
                  const amt = Number(c.fixedAmount || c.amount || 0);
                  const recipientName = c.sponsorId?.name || (c.branchId ? `${c.branchId.name} Branch` : 'N/A');
                  const recipientCode = c.sponsorId?.sponsorCode || c.branchId?.branchCode || '';
                  const roleName = c.commissionRole === 'BRANCH_OVERRIDE'
                    ? 'Branch Override'
                    : c.commissionRole === 'DEVELOPER_OVERRIDE'
                    ? 'Partner Override'
                    : c.commissionRole === 'DIRECT_DEVELOPER'
                    ? 'Direct Partner'
                    : 'Business Associate';
                  const isRev = c.status === 'reversed';

                  return (
                    <div
                      key={c._id || idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] transition ${
                        isRev
                          ? 'bg-slate-100/80 border-slate-200 opacity-60'
                          : 'bg-white border-amber-100 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{recipientName}</span>
                          {recipientCode && (
                            <span className="font-mono text-[10px] text-slate-500">({recipientCode})</span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700">
                            {roleName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Receipt #{c.receiptNumber || c.receiptId?.receiptNumber || 'N/A'} • {c.commissionPercent || c.fixedPercent}% rate on ₹{Number(c.collectionAmount || c.plotValue || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`font-mono font-bold block ${isRev ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          ₹{amt.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[9px] font-bold ${isRev ? 'text-slate-400' : (reverseCommission ? 'text-amber-800' : 'text-slate-500')}`}>
                          {isRev ? 'Already Reversed' : (reverseCommission ? 'Will Debit Ledger' : 'Keep Credited')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Initial Payment Toggle */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={initialPayNow}
                onChange={(e) => {
                  setInitialPayNow(e.target.checked);
                  if (e.target.checked && initialPayAmount === 0) {
                    setInitialPayAmount(netSettlementPayable);
                  }
                }}
                className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500"
              />
              <span className="font-bold text-slate-800 text-xs">
                Disburse initial refund payment today
              </span>
            </label>

            {initialPayNow && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Initial Amount (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      max={netSettlementPayable}
                      value={initialPayAmount}
                      onChange={(e) => setInitialPayAmount(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Mode *</label>
                    <select
                      value={initialPayMode}
                      onChange={(e) => handleInitialModeChange(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs outline-none font-semibold"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="CHEQUE">Cheque / Demand Draft</option>
                      <option value="UPI">UPI Transfer</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {initialPayMode === 'CASH' ? 'Source Cash Account' : 'Debit From Corporate Bank Account *'}
                    </label>
                    {initialPayMode === 'CASH' ? (
                      <div className="w-full h-9 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs flex items-center justify-between font-semibold text-slate-700">
                        <span>{myCashLedger?.name || 'My Cash Account'}</span>
                        <span className="font-mono text-[11px] text-emerald-700">
                          ₹{Number(myCashLedger?.availableBalance ?? myCashLedger?.netBalance ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <select
                        value={initialPaymentLedgerId}
                        onChange={(e) => setInitialPaymentLedgerId(e.target.value)}
                        className="w-full h-9 px-2 bg-white border border-slate-300 rounded-lg text-xs outline-none font-semibold"
                      >
                        {treasuryLedgers.bankLedgers?.length === 0 ? (
                          <option value="">No authorized company bank accounts found</option>
                        ) : (
                          treasuryLedgers.bankLedgers.map((bank) => (
                            <option key={bank._id} value={bank._id}>
                              {[bank.bankName, bank.name].filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx).join(' - ')}
                              {bank.accountNumber ? ` (A/C: ${bank.accountNumber})` : ''} - ₹{(bank.availableBalance ?? bank.netBalance ?? 0).toLocaleString('en-IN')}
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {initialPayMode === 'CHEQUE' ? 'Cheque / DD Number *' : 'Transaction Reference / UTR #'}
                    </label>
                    <input
                      type="text"
                      placeholder={initialPayMode === 'CHEQUE' ? 'e.g. CHQ-904128' : 'e.g. UTR / Ref Number'}
                      value={initialPayRef}
                      onChange={(e) => setInitialPayRef(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Live Balance display */}
                {selectedTreasuryLedger && (
                  <div className="p-2 bg-slate-100/70 border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Available in Selected Account:</span>
                    <span className={`font-mono font-bold ${Number(initialPayAmount) > (selectedTreasuryLedger?.availableBalance ?? selectedTreasuryLedger?.netBalance ?? 0) ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ₹{Number(selectedTreasuryLedger?.availableBalance ?? selectedTreasuryLedger?.netBalance ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            )}
            {!initialPayNow && (
              <p className="text-[11px] text-slate-500">
                Payment will be done later in parts. The full liability of <strong>₹{netSettlementPayable.toLocaleString('en-IN')}</strong> will be placed in the booking ledger.
              </p>
            )}
          </div>
        </form>
      </Modalbox>
    </div>
  );
};

export default PlotInterestCalculator;
