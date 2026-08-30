import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { CircularProgress } from '@mui/material';
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
  Clock,
  Sparkles,
} from 'lucide-react';

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

  // Calculator Parameters
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);
  const [annualRate, setAnnualRate] = useState(10.88);
  const [calculationMode, setCalculationMode] = useState('SIMPLE'); // 'SIMPLE' or 'COMPOUND_ANNUAL'
  const [systemDefaultRate, setSystemDefaultRate] = useState(10.88);

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
        setAnnualRate(rate);
        setSystemDefaultRate(rate);
      })
      .catch(() => {});
  }, []);

  // Live Auto-complete for Booking Number / Customer Name
  useEffect(() => {
    const q = searchInput.trim();
    if (!q || q.length < 1) {
      setBookingSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/plots/reports/bookings');
        const list = res.data?.data || [];
        const filtered = list.filter((b) => {
          const bNum = (b.bookingNumber || '').toLowerCase();
          const cName = (b.customerId?.name || b.customerName || '').toLowerCase();
          const phone = (b.customerId?.mobile || b.customerMobile || '').toLowerCase();
          const query = q.toLowerCase();
          return bNum.includes(query) || cName.includes(query) || phone.includes(query);
        }).slice(0, 10);
        setBookingSuggestions(filtered);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Booking data by ID or BookingNumber
  const loadBookingDetails = async (bookingIdOrNum) => {
    if (!bookingIdOrNum) return;
    setLoading(true);
    try {
      let resolvedId = bookingIdOrNum;
      // If it looks like a bookingNumber (not ObjectId), find ID first
      if (typeof bookingIdOrNum === 'string' && bookingIdOrNum.length !== 24) {
        const allRes = await api.get('/plots/reports/bookings');
        const list = allRes.data?.data || [];
        const match = list.find((b) => (b.bookingNumber || '').toLowerCase() === bookingIdOrNum.trim().toLowerCase());
        if (match) {
          resolvedId = match._id;
        } else {
          toast.error(`Booking #${bookingIdOrNum} not found.`);
          setLoading(false);
          return;
        }
      }

      const [bookingRes, instRes, receiptsRes] = await Promise.all([
        api.get(`/plots/bookings/${resolvedId}`),
        api.get(`/plots/bookings/${resolvedId}/installments`).catch(() => ({ data: { data: [] } })),
        api.get(`/plots/receipts/list?bookingId=${resolvedId}`).catch(() => ({ data: { data: [] } }))
      ]);

      const bk = bookingRes.data?.data;
      setSelectedBooking(bk);
      setInstallments(instRes.data?.data || []);
      setReceipts(receiptsRes.data?.data || []);
      setSearchInput(bk?.bookingNumber || '');
      setShowSuggestions(false);
      setSearchParams({ bookingNumber: bk?.bookingNumber || '', bookingId: bk?._id || '' });
    } catch (err) {
      console.error('Failed to load booking details:', err);
      toast.error('Could not load booking details');
    } finally {
      setLoading(false);
    }
  };

  // Check URL params on initial load
  useEffect(() => {
    const idFromParam = searchParams.get('bookingId');
    const numFromParam = searchParams.get('bookingNumber');
    if (idFromParam) {
      loadBookingDetails(idFromParam);
    } else if (numFromParam) {
      loadBookingDetails(numFromParam);
    }
  }, []);

  const handleSelectBooking = (bk) => {
    setSelectedBooking(bk);
    setSearchInput(bk.bookingNumber);
    setShowSuggestions(false);
    loadBookingDetails(bk._id);
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

  if (receipts && receipts.length > 0) {
    receipts.forEach((rc) => {
      const depositDate = rc.createdAt ? new Date(rc.createdAt) : (selectedBooking?.bookingDate ? new Date(selectedBooking.bookingDate) : new Date());
      const typeLabel = rc.receiptType === 'DOWNPAYMENT'
        ? 'Downpayment / Initial Deposit'
        : rc.receiptType === 'BOOKING'
        ? 'Booking Deposit'
        : rc.receiptType === 'FULL_PAYMENT'
        ? 'Full Payment Deposit'
        : 'Installment Collection';

      paymentEntries.push({
        id: rc._id,
        receiptNumber: rc.receiptNumber || 'N/A',
        paymentType: typeLabel,
        paymentMode: rc.paymentMode || 'Cash',
        reference: rc.transactionReference || '-',
        depositDate: depositDate,
        amount: Number(rc.amount) || 0,
        remarks: rc.remarks || '',
      });
    });
  } else if (selectedBooking && Number(selectedBooking.bookingAmount) > 0) {
    paymentEntries.push({
      id: 'initial-booking',
      receiptNumber: selectedBooking.bookingNumber ? `BKG-${selectedBooking.bookingNumber}` : 'INIT-01',
      paymentType: selectedBooking.scheme === 'FULL_PAYMENT' ? 'Full Payment Deposit' : 'Booking Advance Deposit',
      paymentMode: 'Cash / Bank',
      reference: 'Booking Register',
      depositDate: selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate) : new Date(),
      amount: Number(selectedBooking.bookingAmount) || 0,
      remarks: 'Initial Booking Deposit',
    });
  }

  // Sort payment entries chronologically
  paymentEntries.sort((a, b) => new Date(a.depositDate) - new Date(b.depositDate));

  // Compute Growth / Accrued Interest per payment entry
  const targetDate = asOnDate ? new Date(asOnDate) : new Date();
  targetDate.setHours(23, 59, 59, 999);

  let totalDepositedPrincipal = 0;
  let totalCalculatedInterest = 0;
  let totalCurrentVal = 0;

  const computedBreakdown = paymentEntries.map((item, idx) => {
    const depDate = new Date(item.depositDate);
    const depTime = new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate()).getTime();
    const asOnTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    
    const diffMs = Math.max(0, asOnTime - depTime);
    const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const yearsElapsed = daysElapsed / 365;

    const principal = item.amount;
    const rate = Number(annualRate) || 0;

    let interest = 0;
    if (calculationMode === 'COMPOUND_ANNUAL') {
      interest = principal * (Math.pow(1 + rate / 100, yearsElapsed) - 1);
    } else {
      interest = (principal * rate * daysElapsed) / (365 * 100);
    }

    const roundedInterest = Math.max(0, Math.round(interest * 100) / 100);
    const totalAmount = Math.round((principal + roundedInterest) * 100) / 100;

    totalDepositedPrincipal += principal;
    totalCalculatedInterest += roundedInterest;
    totalCurrentVal += totalAmount;

    return {
      ...item,
      serialNo: idx + 1,
      depositDateStr: depDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      daysElapsed,
      yearsElapsed: (yearsElapsed).toFixed(2),
      ratePercent: rate,
      interestAmount: roundedInterest,
      totalAmount: totalAmount,
    };
  });

  const netPlotValue = Math.max(0, (Number(selectedBooking?.plotValue) || 0) - (Number(selectedBooking?.discount) || 0));
  const remainingDue = Math.max(0, netPlotValue - totalDepositedPrincipal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Search Bar (hidden in print) */}
      <div className="print:hidden bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Sparkles size={20} />
              </span>
              Plot Refund & Settlement Calculator
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter any Booking Number to calculate total deposited amount refund with annual interest rate from each billing/deposit date till today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/plots/booking')}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft size={16} /> Bookings
            </button>
            {selectedBooking && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Printer size={16} /> Print Statement
              </button>
            )}
          </div>
        </div>

        {/* Search and Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Booking Search Input with Live Dropdown */}
          <div className="md:col-span-6 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Booking # (e.g. 2526001), Customer Name, or Phone..."
                  value={searchInput}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full h-11 bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none pl-10 pr-4 rounded-xl font-semibold text-sm text-slate-800 transition"
                />
                <Search size={18} className="text-slate-400 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                className="ml-2 px-5 h-11 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {loading ? <CircularProgress size={16} color="inherit" /> : 'Search'}
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && bookingSuggestions.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
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
                        <span className="font-bold text-slate-800 text-xs">
                          {b.customerId?.name || b.customerName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Plot: {b.plotId?.plotNumber || 'N/A'} ({b.plotId?.seriesId?.name || 'Standard'}) | Ph: {b.customerId?.mobile || b.customerMobile || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      ₹{Number(b.plotValue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rate Controller */}
          <div className="md:col-span-3">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 h-11">
              <span className="text-xs font-semibold text-slate-500 mr-2 whitespace-nowrap">Annual Rate:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-teal-800 outline-none text-right"
              />
              <span className="text-xs font-bold text-slate-500 ml-1">% P.A.</span>
            </div>
          </div>

          {/* As on Date picker */}
          <div className="md:col-span-3">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 h-11">
              <Calendar size={16} className="text-slate-400 mr-2 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 mr-2 whitespace-nowrap">As on Date:</span>
              <input
                type="date"
                value={asOnDate}
                onChange={(e) => setAsOnDate(e.target.value)}
                className="w-full bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
          <p className="text-xs font-bold text-slate-500 animate-pulse">Calculating deposited amounts & accrued interest...</p>
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
              Please search or select a booking above using the Booking Number (e.g. 2526001) or customer details to generate the growth and interest statement.
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

      {/* Main Statement Content (Printable) */}
      {!loading && selectedBooking && (
        <div className="space-y-6 print:space-y-4 print:p-0">
          
          {/* Printable Header (shows only on print) */}
          <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">Good Nature Projects Pvt. Ltd.</h1>
                <p className="text-xs text-slate-600">Raj Bhawan, ManglaSthan, Ramchandrapur, Bihar Sharif - 803101</p>
                <h2 className="text-sm font-bold text-teal-900 mt-2 uppercase tracking-wide">
                  Plot Refund & Settlement Statement (With Interest)
                </h2>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-slate-800">Date Generated: {new Date().toLocaleDateString('en-IN')}</p>
                <p className="text-slate-600">As on Calculation Date: {new Date(targetDate).toLocaleDateString('en-IN')}</p>
                <p className="font-bold text-teal-800">Applied Rate: {annualRate}% P.A.</p>
              </div>
            </div>
          </div>

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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plot Information</p>
              <h4 className="text-sm font-black text-slate-800 mt-1">
                Plot #{selectedBooking.plotId?.plotNumber || 'N/A'}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Series: <span className="font-semibold">{selectedBooking.plotId?.seriesId?.name || 'Standard'}</span>
              </p>
              <p className="text-xs text-slate-600">
                Size: <span className="font-semibold">{selectedBooking.plotId?.plotSize || 1200} Sq Ft</span> ({selectedBooking.plotId?.plotType || 'NORMAL'})
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Booking Contract</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono font-bold text-teal-800 text-sm px-2.5 py-0.5 bg-teal-50 border border-teal-200 rounded-lg">
                  #{selectedBooking.bookingNumber}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedBooking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedBooking.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Booking Date: <span className="font-semibold">{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </p>
              <p className="text-xs text-slate-600">
                Scheme: <span className="font-semibold">{selectedBooking.scheme === 'FULL_PAYMENT' ? 'One Time (Full Payment)' : 'Monthly EMI'}</span>
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
              </p>
            </div>

            {/* Total Accrued Interest */}
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
                Calculated from respective billing dates till {new Date(targetDate).toLocaleDateString('en-IN')}
              </p>
            </div>

            {/* Net Refund Settlement Value */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white p-4 md:p-5 rounded-2xl shadow-md print:bg-white print:text-slate-900 print:border print:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider print:text-slate-600">
                  Total Payable Settlement Amount
                </span>
                <span className="p-2 rounded-xl bg-teal-700/60 text-white print:hidden">
                  <Sparkles className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black mt-2 font-mono print:text-slate-900">
                ₹{totalCurrentVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-teal-200/80 mt-1 print:text-slate-500">
                Principal Deposited + Accrued Interest
              </p>
            </div>
          </div>

          {/* Detailed Transaction Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden print:border-slate-300 print:shadow-none">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Deposited Payments & Interest Computation Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed day-wise interest calculation for each deposited installment & downpayment.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                  Calculation: <strong className="text-teal-800">{calculationMode === 'SIMPLE' ? 'Simple Interest' : 'Annual Compounding'}</strong>
                </span>
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                  Rate: <strong className="text-teal-800">{annualRate}% P.A.</strong>
                </span>
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
                    <th className="p-3.5 text-center">Days Elapsed</th>
                    <th className="p-3.5 text-center">Rate</th>
                    <th className="p-3.5 text-right text-teal-800">Accrued Interest</th>
                    <th className="p-3.5 text-right font-black">Total Current Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-400 font-medium">
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
                          ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
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
                      </tr>
                    ))
                  )}
                </tbody>
                {computedBreakdown.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan="4" className="p-4 text-right uppercase tracking-wider text-xs">
                        Grand Total:
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-900">
                        ₹{totalDepositedPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan="2" className="p-4 text-center text-xs text-slate-500 font-semibold">
                        As on {new Date(targetDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-teal-800">
                        + ₹{totalCalculatedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-mono text-base text-teal-950 font-black">
                        ₹{totalCurrentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Formula Note & Disclaimer */}
          <div className="p-4 bg-slate-100 rounded-xl text-slate-600 text-xs space-y-1 print:border print:border-slate-300 print:bg-white">
            <p className="font-bold text-slate-800">Calculation Methodology & Notes:</p>
            <p>
              • <strong>Interest Calculation:</strong> Simple Interest formula <code className="bg-white px-1.5 py-0.5 rounded text-teal-800 font-mono">Interest = (Principal × Rate × Days) / (365 × 100)</code> is applied individually to each deposit from its billing/deposit date to the specified evaluation date ({new Date(targetDate).toLocaleDateString('en-IN')}).
            </p>
            <p>
              • <strong>Configurable Rate:</strong> Default percentage is set to <strong>{systemDefaultRate}% P.A.</strong> in Series Master & Global Pricing and can be adjusted dynamically in the header.
            </p>
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
    </div>
  );
};

export default PlotInterestCalculator;
