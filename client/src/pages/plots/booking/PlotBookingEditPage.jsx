import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Sparkles,
  Search,
  UserPlus,
  Edit3,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import Button from '../../../components/ui/Button';
import { toast } from '../../../utils/toast';
import { BookingSummarySidebar } from './components/BookingSummarySidebar';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const inputCls =
  'w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none font-medium shadow-2xs';

export default function PlotBookingEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // Master Data
  const [seriesList, setSeriesList] = useState([]);
  const [plots, setPlots] = useState([]);
  const [rateConfig, setRateConfig] = useState(null);
  const [availableLandSources, setAvailableLandSources] = useState([]);

  // Customer search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Plot selection
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Land stock sourcing allocations
  const [landSourcing, setLandSourcing] = useState([]);

  // Discount & Govt Rate settings
  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', or 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [govtRate, setGovtRate] = useState('100');

  // Dynamic rates & Downpayment
  const [customSqFtRate, setCustomSqFtRate] = useState(1000);
  const [dpType, setDpType] = useState('SQFT_RATE'); // 'SQFT_RATE', 'PERCENT', or 'FLAT'
  const [dpVal, setDpVal] = useState(500);
  const [emiFrequency, setEmiFrequency] = useState('MONTHLY'); // 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'
  const [installmentCount, setInstallmentCount] = useState(8);

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    plotId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    tenureMonths: 8,
    bookingType: 'BOOKING',
    holdExpiryDays: '7',
    downpaymentDays: 90,
    downpaymentMonths: 3,
    oneTimeDays: 90,
    oneTimeMonths: 3,
    paymentMode: 'cash',
    transactionReference: '',
    sponsorId: '',
    status: 'ACTIVE',
    agreementNumber: '',
    notes: '',
    reason: '',
  });

  // Fetch initial master data & the booking to edit
  useEffect(() => {
    if (!id) {
      toast.error('No booking ID provided');
      navigate('/dashboard/plots/booking');
      return;
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingRes, seriesRes, plotsRes, ratesRes, landSourcesRes] = await Promise.all([
        api.get(`/plots/bookings/${id}`),
        api.get('/plots/series'),
        api.get('/plots?limit=5000'),
        api.get('/plots/rate-config').catch(() => ({ data: { data: null } })),
        api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } })),
      ]);

      const b = bookingRes.data?.data || bookingRes.data;
      if (!b) {
        toast.error('Booking not found');
        navigate('/dashboard/plots/booking');
        return;
      }
      setBookingData(b);

      const seriesData = seriesRes.data?.data || seriesRes.data || [];
      const plotsData = plotsRes.data?.data || plotsRes.data || [];
      const configData = ratesRes.data?.data || ratesRes.data || null;
      const landSourcesData = landSourcesRes.data?.data || landSourcesRes.data || [];

      setSeriesList(seriesData);
      setPlots(plotsData);
      setRateConfig(configData);
      setAvailableLandSources(landSourcesData);

      // Populate customer
      const cust = b.customerId;
      if (cust) {
        setSelectedCustomer(typeof cust === 'object' ? cust : { _id: cust, name: b.customerName });
        setSearchQuery(typeof cust === 'object' ? (cust.name || '') : (b.customerName || ''));
      }

      // Populate plot
      const plotObj = plotsData.find((p) => p._id === (b.plotId?._id || b.plotId)) || b.plotId;
      setSelectedPlot(plotObj || null);

      // Populate rates
      const initialBaseRate = b.basePlotRate || b.customSqFtRate || 1000;
      setCustomSqFtRate(initialBaseRate);
      setGovtRate(b.govtRate ? String(b.govtRate) : '100');

      // Populate discount
      setDiscountType(b.discountType || 'RUPEE');
      setDiscountVal(b.discountValue ? String(b.discountValue) : b.discount ? String(b.discount) : '');

      // Populate Downpayment Mode & Value
      setDpType('SQFT_RATE');
      const resolvedDpRate = b.downpaymentRate || b.customDownpaymentRate || (b.scheme === 'FULL_PAYMENT' ? initialBaseRate : 500);
      setDpVal(resolvedDpRate);

      // Populate EMI Frequency & Installments
      const freq = b.emiFrequency || 'MONTHLY';
      setEmiFrequency(freq);
      const freqMultiplier = freq === 'QUARTERLY' ? 3 : freq === 'HALF_YEARLY' ? 6 : freq === 'YEARLY' ? 12 : 1;
      const instCount = b.installmentCount || (b.tenureMonths ? Math.round(b.tenureMonths / freqMultiplier) : 8);
      setInstallmentCount(instCount);

      // Populate land sourcing
      setLandSourcing(Array.isArray(b.landSourcing) ? JSON.parse(JSON.stringify(b.landSourcing)) : []);

      // Populate form fields
      setForm({
        customerId: cust?._id || cust || '',
        plotId: plotObj?._id || b.plotId || '',
        bookingDate: b.bookingDate
          ? new Date(b.bookingDate).toISOString().split('T')[0]
          : new Date(b.createdAt).toISOString().split('T')[0],
        tenureMonths: b.tenureMonths !== undefined ? Number(b.tenureMonths) : 8,
        bookingType: b.bookingType || (b.status === 'HOLD' ? 'HOLD' : 'BOOKING'),
        holdExpiryDays: '7',
        downpaymentDays: b.downpaymentDays || (b.downpaymentMonths ? b.downpaymentMonths * 30 : 90),
        downpaymentMonths: b.downpaymentMonths || 3,
        oneTimeDays: b.oneTimeDays || 90,
        oneTimeMonths: b.oneTimeMonths || 3,
        paymentMode: b.paymentMode || 'cash',
        transactionReference: b.transactionReference || '',
        sponsorId: b.sponsorId?._id || b.sponsorId || '',
        status: b.status || 'ACTIVE',
        agreementNumber: b.agreementNumber || '',
        notes: b.notes || '',
        reason: b.reason || b.adminNarration || '',
      });
    } catch (err) {
      console.error('Error loading booking data for editing:', err);
      toast.error('Failed to load booking details');
      navigate('/dashboard/plots/booking');
    } finally {
      setLoading(false);
    }
  };

  // Search customers dynamically
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api
        .get('/plots/customers', {
          params: {
            search: searchQuery.trim(),
            limit: 10,
          },
        })
        .then((res) => {
          const list = res.data?.data?.customers || res.data?.customers || res.data?.data || [];
          setSearchResults(list);
        })
        .catch(() => setSearchResults([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Customer Selection Handler
  const selectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchQuery(cust.name);
    setSearchResults([]);
    const sId = cust.sponsorId?._id || cust.sponsorId || '';
    setForm((f) => ({ ...f, customerId: cust._id, sponsorId: sId }));
  };

  // Plot Selection Handler
  const handlePlotSelect = (plotId) => {
    const p = plots.find((item) => item._id === plotId);
    if (!p) return;

    if (p._id !== (bookingData?.plotId?._id || bookingData?.plotId)) {
      if (p.status === 'BOOKED' || p.status === 'REGISTERED' || p.status === 'SOLD') {
        toast.error(`Plot #${p.plotNumber} is already ${p.status.toLowerCase()}`);
        return;
      }
    }

    setSelectedPlot(p);
    setForm((f) => ({ ...f, plotId: p._id }));
  };

  // Derived financial & rate calculations
  const isCorner = selectedPlot?.plotType === 'CORNER';
  const plotPremiumHeads = Array.isArray(selectedPlot?.premiumHeads) ? selectedPlot.premiumHeads : [];
  const totalPremiumExtra =
    plotPremiumHeads.length > 0
      ? plotPremiumHeads.reduce((sum, h) => sum + (Number(h.extraPercent) || 0), 0)
      : isCorner
      ? rateConfig?.cornerExtraPercent || 20
      : 0;
  const cornerExtra = totalPremiumExtra;
  const plotArea = selectedPlot ? Number(selectedPlot.plotSize) || Number(selectedPlot.area) || 0 : 0;

  const baseRate = Number(customSqFtRate) || 1000;
  const effectiveSqFtRate =
    totalPremiumExtra > 0 ? Math.round(baseRate * (1 + totalPremiumExtra / 100) * 100) / 100 : baseRate;

  const calculatedPlotValue = Math.round(plotArea * effectiveSqFtRate);

  // Discount calculation
  const calculatedDiscount = useMemo(() => {
    const num = parseFloat(discountVal) || 0;
    if (num <= 0 || !selectedPlot) return 0;
    if (discountType === 'PERCENT') {
      return Math.round((calculatedPlotValue * num) / 100);
    }
    if (discountType === 'SQFT_RATE') {
      return Math.round(plotArea * num);
    }
    return Math.round(num);
  }, [discountVal, discountType, calculatedPlotValue, selectedPlot, plotArea]);

  const netContractValue = Math.max(0, calculatedPlotValue - calculatedDiscount);

  // Downpayment calculation (Flat vs ₹/Sq.Ft. vs %)
  const downpaymentAmt = useMemo(() => {
    const num = parseFloat(dpVal) || 0;
    if (num <= 0 || !selectedPlot) return 0;
    if (dpType === 'FLAT') {
      return Math.min(netContractValue, Math.round(num));
    }
    if (dpType === 'PERCENT') {
      return Math.min(netContractValue, Math.round((netContractValue * num) / 100));
    }
    // SQFT_RATE
    return Math.min(netContractValue, Math.round(plotArea * num));
  }, [dpVal, dpType, netContractValue, plotArea, selectedPlot]);

  const customDpRate = useMemo(() => {
    if (plotArea <= 0) return 0;
    return Math.round((downpaymentAmt / plotArea) * 100) / 100;
  }, [downpaymentAmt, plotArea]);

  const emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
  const isOneTime = emiPrincipalAmt === 0;

  const freqMultiplier = useMemo(() => {
    switch (emiFrequency) {
      case 'QUARTERLY':
        return 3;
      case 'HALF_YEARLY':
        return 6;
      case 'YEARLY':
        return 12;
      default:
        return 1;
    }
  }, [emiFrequency]);

  const totalTenureMonths = isOneTime ? 0 : (Number(installmentCount) || 1) * freqMultiplier;

  const emiPerInstallmentAmt = useMemo(() => {
    if (isOneTime || !installmentCount || Number(installmentCount) <= 0) return 0;
    return Math.round(emiPrincipalAmt / Number(installmentCount));
  }, [isOneTime, installmentCount, emiPrincipalAmt]);

  const emiRatePerSqFt = useMemo(() => {
    if (isOneTime || plotArea <= 0) return 0;
    return Math.round((emiPrincipalAmt / plotArea) * 100) / 100;
  }, [isOneTime, plotArea, emiPrincipalAmt]);

  // Dynamic Date Helpers
  const getDynamicDueHelper = (bookingDateStr, daysVal) => {
    const d = bookingDateStr ? new Date(bookingDateStr) : new Date();
    d.setDate(d.getDate() + Number(daysVal || 90));
    if (isOneTime) {
      return `Full payment of ₹${netContractValue.toLocaleString('en-IN')} due on or before ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysVal || 90} days).`;
    }
    return `Downpayment of ₹${downpaymentAmt.toLocaleString('en-IN')} due on or before ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysVal || 90} days). Remaining ₹${emiPrincipalAmt.toLocaleString('en-IN')} in ${installmentCount || 1} ${emiFrequency.toLowerCase()} installments (${totalTenureMonths} months).`;
  };

  // Land stock validation
  const totalAllocatedArea = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  const isLandStockValid =
    landSourcing.length > 0 &&
    landSourcing.every((s) => Boolean(s.agreementId) && Number(s.allocatedSqFt) > 0) &&
    Math.abs(totalAllocatedArea - plotArea) <= 0.5;

  const isFormValid =
    Boolean(selectedCustomer) &&
    Boolean(selectedPlot) &&
    Boolean(form.bookingDate) &&
    Number(customSqFtRate) > 0 &&
    Number(downpaymentAmt) > 0 &&
    isLandStockValid;

  // All available land stock sources (Agreements & Registry Deeds)
  const allLandSources = availableLandSources || [];

  // Submit Updated Booking
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (!selectedPlot) {
      toast.error('Please select a plot');
      return;
    }
    if (Number(customSqFtRate) <= 0) {
      toast.error('Please enter a valid plot rate per sq.ft.');
      return;
    }
    if (Number(downpaymentAmt) <= 0) {
      toast.error('Please enter a valid downpayment amount');
      return;
    }
    if (!isLandStockValid) {
      toast.error(
        `Land stock area allocation (${totalAllocatedArea} sqft) must match plot area (${plotArea} sqft) exactly.`
      );
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        customerId: selectedCustomer._id,
        plotId: selectedPlot._id,
        bookingType: form.bookingType || 'BOOKING',
        bookingDate: form.bookingDate,
        scheme: isOneTime ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT',
        tenureMonths: totalTenureMonths,
        emiFrequency: emiFrequency,
        installmentCount: isOneTime ? 0 : Number(installmentCount || 1),
        discount: calculatedDiscount,
        discountType: discountType,
        discountValue: Number(discountVal) || 0,
        govtRate: Number(govtRate) || 100,

        // Dynamic Rates & Financials
        customSqFtRate: Number(customSqFtRate) || 1000,
        basePlotRate: Number(customSqFtRate) || 1000,
        customDownpaymentRate: Number(customDpRate) || 0,
        downpaymentRate: Number(customDpRate) || 0,
        downpaymentAmount: downpaymentAmt,
        emiRate: emiRatePerSqFt,
        emiMonthlyAmount: emiPerInstallmentAmt,

        bookingAmount: downpaymentAmt,
        totalPlotAmount: netContractValue,
        downpaymentDays: Number(form.downpaymentDays || 90),
        oneTimeDays: Number(form.downpaymentDays || form.oneTimeDays || 90),
        paymentMode: form.paymentMode || 'cash',
        transactionReference: form.transactionReference || '',
        sponsorId: form.sponsorId || selectedCustomer.sponsorId?._id || undefined,
        status: form.status || 'ACTIVE',
        agreementNumber: form.agreementNumber || '',
        notes: form.notes || '',
        landSourcing: landSourcing,
        reason: (form.reason || '').trim(),
        adminNarration: (form.reason || '').trim(),
      };

      await api.put(`/plots/bookings/${id}`, payload);
      toast.success('Plot booking updated successfully!');
      navigate(`/dashboard/plots/booking/${id}`);
    } catch (err) {
      console.error('Error updating booking:', err);
      toast.error(err.response?.data?.message || 'Failed to update plot booking contract');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader text="Loading booking contract for editing..." />;
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/plots/booking/${id}`)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600 font-medium text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="text-teal-700" size={24} />
              Edit Booking Contract #{bookingData?.bookingNumber || ''}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Modify customer, plot, dynamic rates, payment terms, land stock allocations, and audit history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/dashboard/plots/booking/${id}`)}
            disabled={submitLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitLoading}
            disabled={!isFormValid || submitLoading}
          >
            Save Booking Changes
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Sections on Left + Summary Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Single-Page All Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Selection */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Customer Details</span>
              </h3>
              <a
                href="/dashboard/plots/customers/new"
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-2xs w-fit"
              >
                <UserPlus size={14} /> + Register New Customer
              </a>
            </div>

            <div className="relative">
              <label className={labelCls}>Search & Change Customer</label>
              <div className="relative">
                <input
                  className={`${inputCls} pl-10`}
                  placeholder="Search by name, customer ID, or mobile number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className="text-slate-400 absolute left-3.5 top-3" />
              </div>

              {/* Dropdown Results */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((cust) => (
                    <div
                      key={cust._id}
                      onClick={() => selectCustomer(cust)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{cust.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {cust.customerCode || cust.customerId}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 block">{cust.mobile}</span>
                        <span className="text-[10px] text-teal-700 font-bold uppercase">
                          {cust.sponsorId?.name ? `Sponsor: ${cust.sponsorId.name}` : 'Direct Customer'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div className="bg-teal-50/50 border border-teal-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                    {selectedCustomer.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</h4>
                    <p className="text-xs text-teal-700 font-mono font-bold">
                      {selectedCustomer.customerCode || selectedCustomer.customerId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-600 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Mobile</span>
                    <span className="font-semibold text-slate-800">{selectedCustomer.mobile || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Sponsor / Agent</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCustomer.sponsorId
                        ? `${selectedCustomer.sponsorId.name || ''} (${selectedCustomer.sponsorId.sponsorCode || ''})`
                        : 'Direct (Company)'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Plot Selection */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <h3 className="text-base font-bold text-slate-800">Choose Plot</h3>
                {selectedPlot && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Selected: Plot #{selectedPlot.plotNumber} ({selectedPlot.plotSize} Sq.Ft.)
                  </span>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 border border-slate-200 p-3 rounded-xl bg-slate-50">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded-sm" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-teal-700 rounded-sm" /> Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm opacity-60" /> Booked
              </span>
            </div>

            {/* Plot Series Maps */}
            <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1">
              {seriesList.map((s) => {
                const seriesPlots = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id);
                return (
                  <div key={s._id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                        {s.prefix}-Plot Series ({s.name})
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {seriesPlots.filter((p) => p.status === 'AVAILABLE' || p._id === form.plotId).length} Selectable
                      </span>
                    </div>

                    {seriesPlots.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {seriesPlots.map((plot) => {
                          const isSelected = form.plotId === plot._id;
                          const isCurrentBooked = plot._id === (bookingData?.plotId?._id || bookingData?.plotId);
                          const isAvail = plot.status === 'AVAILABLE' || isCurrentBooked;

                          let bgClass = 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed';
                          if (isAvail) {
                            bgClass =
                              'bg-white border-emerald-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer shadow-2xs';
                          }

                          if (isSelected) {
                            bgClass = 'bg-teal-700 border-teal-800 text-white font-bold ring-2 ring-teal-500/50 shadow-sm';
                          }

                          return (
                            <button
                              key={plot._id}
                              type="button"
                              onClick={() => {
                                if (isAvail) {
                                  handlePlotSelect(plot._id);
                                } else {
                                  toast.error(`Plot #${plot.plotNumber} is currently ${plot.status}`);
                                }
                              }}
                              disabled={!isAvail}
                              className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition ${bgClass}`}
                            >
                              <span className="text-xs font-bold leading-none">#{plot.plotNumber}</span>
                              <span className="text-[9px] mt-1 opacity-80">{plot.plotSize} sqft</span>
                              {plot.plotType === 'CORNER' && (
                                <span
                                  className={`text-[8px] px-1 rounded-sm mt-0.5 font-bold uppercase ${
                                    isSelected ? 'bg-teal-800 text-teal-100' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  Corner
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-1">No plots added in this series yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Contract Terms, Dynamic Rates & Downpayment */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <span>Contract Terms, Dynamic Rates & Downpayment</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Booking Date */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Booking Date *</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Start Date</span>
                </div>
                <input
                  className={inputCls}
                  type="date"
                  value={form.bookingDate}
                  onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                  required
                />
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Initial contract booking agreement date
                </span>
              </div>

              {/* 2. Plot Selling Rate (₹ / Sq.Ft.) */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Edit3 size={14} className="text-teal-700" />
                    Plot Selling Rate *
                  </label>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    ₹{customSqFtRate || 1000}/sqft
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    className="w-full h-11 pl-7 pr-16 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customSqFtRate ?? 1000}
                    onChange={(e) => setCustomSqFtRate(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="1000"
                    required
                  />
                  <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">
                    / Sq.Ft.
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium truncate">
                  Gross: ₹{calculatedPlotValue.toLocaleString('en-IN')} ({plotArea} sqft @ ₹{effectiveSqFtRate}/sqft)
                </span>
              </div>

              {/* 3. Govt. Base Rate (₹ / Sq.Ft.) */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Govt. Base Rate</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Circle Rate</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    className="w-full h-11 pl-7 pr-16 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={govtRate}
                    onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="100"
                  />
                  <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">
                    / Sq.Ft.
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Official government circle base rate
                </span>
              </div>

              {/* 4. Discount Input */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Discount</label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      calculatedDiscount > 0
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {calculatedDiscount > 0 ? `-₹${calculatedDiscount.toLocaleString('en-IN')}` : 'Optional'}
                  </span>
                </div>
                <div className="flex h-11 rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 bg-white shadow-2xs">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-3 bg-slate-100 text-xs font-bold text-slate-700 border-r border-slate-300 outline-none cursor-pointer shrink-0"
                  >
                    <option value="RUPEE">₹ (Flat)</option>
                    <option value="PERCENT">% (Percentage)</option>
                    <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                  </select>
                  <input
                    className="w-full px-3.5 text-sm bg-transparent outline-none text-slate-800 font-medium"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={
                      discountType === 'PERCENT'
                        ? 'e.g. 10 (%)'
                        : discountType === 'SQFT_RATE'
                        ? 'e.g. 50 (₹/sqft)'
                        : 'e.g. 25000 (Flat ₹)'
                    }
                  />
                </div>
                <span className="text-[11px] font-medium truncate text-emerald-700">
                  {calculatedDiscount > 0
                    ? `Discount: ₹${calculatedDiscount.toLocaleString('en-IN')} (Net: ₹${netContractValue.toLocaleString('en-IN')})`
                    : 'Deducted from total gross plot value'}
                </span>
              </div>

              {/* 5. Downpayment */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-teal-50/50 border border-teal-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Calculator size={14} className="text-teal-700" />
                    Downpayment *
                  </label>
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-300">
                    {dpType === 'SQFT_RATE'
                      ? `₹${dpVal || 0}/sqft`
                      : dpType === 'PERCENT'
                      ? `${dpVal || 0}%`
                      : `Flat ₹`}
                  </span>
                </div>
                <div className="flex h-11 rounded-xl border border-teal-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-700 bg-white shadow-2xs">
                  <select
                    value={dpType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setDpType(newType);
                      if (newType === 'FLAT') {
                        setDpVal(downpaymentAmt || Math.round(plotArea * (parseFloat(dpVal) || 500)));
                      } else if (newType === 'PERCENT') {
                        setDpVal(
                          netContractValue > 0
                            ? Math.min(100, Math.round(((downpaymentAmt || 0) / netContractValue) * 100)) || 50
                            : 50
                        );
                      } else if (newType === 'SQFT_RATE') {
                        setDpVal(plotArea > 0 ? Math.round((downpaymentAmt || 0) / plotArea) || 500 : 500);
                      }
                    }}
                    className="px-3 bg-teal-50 text-xs font-bold text-teal-900 border-r border-teal-200 outline-none cursor-pointer shrink-0"
                  >
                    <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                    <option value="PERCENT">% (Percentage)</option>
                    <option value="FLAT">₹ (Flat)</option>
                  </select>
                  <input
                    className="w-full px-3.5 text-sm bg-transparent outline-none text-teal-950 font-bold font-mono"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={dpVal}
                    onChange={(e) => setDpVal(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={
                      dpType === 'PERCENT'
                        ? 'e.g. 25 (%)'
                        : dpType === 'SQFT_RATE'
                        ? 'e.g. 500 (₹/sqft)'
                        : 'e.g. 200000 (Flat ₹)'
                    }
                    required
                  />
                </div>
                <span className="text-[11px] text-teal-800 font-bold truncate">
                  Total DP: ₹{downpaymentAmt.toLocaleString('en-IN')} (₹{customDpRate}/sqft eq.)
                </span>
              </div>

              {/* 6. Payment / Downpayment Due Period */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Due Period (Days) *</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Standard 90 Days</span>
                </div>
                <input
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.downpaymentDays ?? 90}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setForm({ ...form, downpaymentDays: val, oneTimeDays: val });
                  }}
                  placeholder="90"
                  required
                />
                <span className="text-[11px] text-teal-700 font-medium truncate">
                  {getDynamicDueHelper(form.bookingDate, form.downpaymentDays ?? 90)}
                </span>
              </div>

              {/* 7. EMI Frequency & Installments Schedule (when remaining balance > 0) */}
              {emiPrincipalAmt > 0 && (
                <div className="md:col-span-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calculator size={15} className="text-teal-700" />
                      EMI Frequency & Installments Schedule
                    </label>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                      Total Tenure: {totalTenureMonths} Months
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Frequency Dropdown */}
                    <div className="flex flex-col justify-between gap-1.5 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">EMI Frequency *</label>
                        <span className="text-[10px] text-slate-400 font-semibold">Periodicity</span>
                      </div>
                      <select
                        value={emiFrequency}
                        onChange={(e) => setEmiFrequency(e.target.value)}
                        className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs cursor-pointer"
                      >
                        <option value="MONTHLY">Monthly (Every 1 Month)</option>
                        <option value="QUARTERLY">Quarterly (Every 3 Months)</option>
                        <option value="HALF_YEARLY">Half-Yearly (Every 6 Months)</option>
                        <option value="YEARLY">Yearly (Every 12 Months)</option>
                      </select>
                      <span className="text-[11px] text-slate-500 font-medium truncate">
                        Installments due{' '}
                        {emiFrequency === 'MONTHLY'
                          ? 'every month'
                          : emiFrequency === 'QUARTERLY'
                          ? 'every 3 months'
                          : emiFrequency === 'HALF_YEARLY'
                          ? 'every 6 months'
                          : 'every 12 months'}
                      </span>
                    </div>

                    {/* Installment Count Input */}
                    <div className="flex flex-col justify-between gap-1.5 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Number of Installments *</label>
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          {installmentCount || 0} installments
                        </span>
                      </div>
                      <input
                        className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="8"
                        required
                      />
                      <span className="text-[11px] text-slate-500 font-medium truncate">
                        {totalTenureMonths} Months total duration
                      </span>
                    </div>
                  </div>

                  {/* Installment Amount Breakdown */}
                  <div className="p-3 bg-teal-50/60 border border-teal-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-600" />
                      <span className="font-semibold text-teal-950">
                        Per Installment ({emiFrequency === 'MONTHLY' ? 'Monthly' : emiFrequency === 'QUARTERLY' ? 'Quarterly' : emiFrequency === 'HALF_YEARLY' ? 'Half-Yearly' : 'Yearly'}):
                      </span>
                      <span className="font-extrabold text-teal-900 text-sm font-mono">
                        ₹{emiPerInstallmentAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-800 font-medium">
                      ₹{emiRatePerSqFt}/sqft balance over {installmentCount || 1} installments
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Land Acquisition Sourcing */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <span>Land Acquisition Sourcing (किसान एग्रीमेंट स्टॉक) *</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Required: Sourced Area must match plot area ({plotArea} Sq.Ft.) from active Kisan Land Agreements or Registry Deeds.
                </p>
              </div>
              {allLandSources.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const currentTotal = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                    const remaining = Math.max(0, plotArea - currentTotal);
                    setLandSourcing([
                      ...landSourcing,
                      {
                        sourceType: 'AGREEMENT',
                        agreementId: '',
                        agreementNumber: '',
                        deedId: null,
                        deedNumber: '',
                        allocatedSqFt: remaining > 0 ? remaining : plotArea,
                        allocatedDismil: Math.round(((remaining > 0 ? remaining : plotArea) / 435.6) * 1000) / 1000,
                      },
                    ]);
                  }}
                >
                  + Add Land Source
                </Button>
              )}
            </div>

            {landSourcing.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>
                    {allLandSources.length === 0
                      ? 'No active agreements or registry deeds with available stock found. Please verify agreements in Purchase & Land Master.'
                      : 'No agreement or deed selected. Click "+ Add Land Source" to allocate stock.'}
                  </span>
                </div>
                {allLandSources.length > 0 && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setLandSourcing([
                        {
                          sourceType: '',
                          agreementId: '',
                          agreementNumber: '',
                          parcelId: null,
                          deedId: null,
                          deedNumber: '',
                          allocatedSqFt: plotArea,
                          allocatedDismil: Math.round((plotArea / 435.6) * 1000) / 1000,
                        },
                      ]);
                    }}
                  >
                    + Add Land Source
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {landSourcing.map((src, idx) => {
                  const selectedSourceObj = allLandSources.find((s) =>
                    src.deedNumber
                      ? s.deedNumber === src.deedNumber
                      : String(s.agreementId) === String(src.agreementId) &&
                        (!src.parcelId || String(s.parcelId) === String(src.parcelId))
                  );

                  const selectValue = src.deedNumber
                    ? `DEED_${src.deedNumber}`
                    : src.agreementId
                    ? (src.parcelId ? `AGR_${src.agreementId}_${src.parcelId}` : `AGR_${src.agreementId}`)
                    : '';

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 bg-teal-50/40 p-3.5 rounded-xl border border-teal-200 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <select
                          className="flex-1 h-10 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-xl outline-none w-full focus:ring-2 focus:ring-teal-600"
                          value={selectValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              const updated = [...landSourcing];
                              updated[idx] = {
                                sourceType: 'AGREEMENT',
                                agreementId: '',
                                agreementNumber: '',
                                parcelId: null,
                                deedId: null,
                                deedNumber: '',
                                allocatedSqFt: src.allocatedSqFt || plotArea,
                                allocatedDismil: Math.round(((src.allocatedSqFt || plotArea) / 435.6) * 1000) / 1000,
                              };
                              setLandSourcing(updated);
                              return;
                            }
                            const chosen = allLandSources.find(
                              (s) => {
                                const sVal = s.deedNumber
                                  ? `DEED_${s.deedNumber}`
                                  : `AGR_${s.agreementId}${s.parcelId ? `_${s.parcelId}` : ''}`;
                                return sVal === val || String(s.agreementId) === val || String(s.deedNumber) === val;
                              }
                            );
                            if (!chosen) return;
                            const updated = [...landSourcing];
                            updated[idx] = {
                              ...updated[idx],
                              sourceType: chosen.sourceType,
                              agreementId: chosen.agreementId,
                              agreementNumber: chosen.agreementNumber,
                              parcelId: chosen.parcelId || null,
                              deedId: chosen.deedId || null,
                              deedNumber: chosen.deedNumber || '',
                            };
                            setLandSourcing(updated);
                          }}
                        >
                          <option value="">-- Select Agreement --</option>
                          {allLandSources.map((s, sIdx) => {
                            const optKey = s.deedNumber
                              ? `DEED_${s.deedId || s.deedNumber}_${sIdx}`
                              : `AGR_${s.agreementId}_${s.parcelId || sIdx}`;
                            const optVal = s.deedNumber
                              ? `DEED_${s.deedNumber}`
                              : `AGR_${s.agreementId}${s.parcelId ? `_${s.parcelId}` : ''}`;
                            return (
                              <option key={optKey} value={optVal}>
                                {s.sourceType === 'REGISTRY_DEED' ? s.deedNumber : s.agreementNumber}
                              </option>
                            );
                          })}
                        </select>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            className="w-32 h-10 px-3 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl outline-none text-right font-mono bg-white focus:ring-2 focus:ring-teal-600"
                            value={src.allocatedSqFt ?? ''}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const updated = [...landSourcing];
                              updated[idx].allocatedSqFt = val;
                              updated[idx].allocatedDismil = Math.round((val / 435.6) * 1000) / 1000;
                              setLandSourcing(updated);
                            }}
                            placeholder="Sq. Ft."
                          />
                          <span className="text-xs font-semibold text-slate-500">SqFt</span>
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = landSourcing.filter((_, i) => i !== idx);
                              setLandSourcing(filtered);
                            }}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center justify-center"
                            title="Remove Land Source"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Selected source info preview */}
                      {selectedSourceObj && (
                        <div className="bg-white border border-teal-100 rounded-lg p-2.5 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-medium">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Agreement No.</span>
                            <span className="font-bold text-teal-950">
                              {selectedSourceObj.agreementNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Mauja / Khata / Khesra</span>
                            <span className="font-semibold text-slate-800">
                              {selectedSourceObj.mauja || '-'} (Khata: {selectedSourceObj.khataNumber || '-'}, Khesra: {selectedSourceObj.khesraNumber || '-'})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Available (Sq.Ft.)</span>
                            <span className="font-extrabold text-teal-900 font-mono">
                              {selectedSourceObj.availableSqFt?.toLocaleString('en-IN') || 0} Sq.Ft.
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Available (Dismil)</span>
                            <span className="font-extrabold text-emerald-800 font-mono">
                              {selectedSourceObj.availableDismil ??
                                (selectedSourceObj.availableSqFt
                                  ? (selectedSourceObj.availableSqFt / 435.6).toFixed(2)
                                  : 0)}{' '}
                              Dismil
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(() => {
                  const isMatch = Math.abs(totalAllocatedArea - plotArea) <= 0.5 && isLandStockValid;
                  return (
                    <div className="flex justify-between items-center text-xs font-bold px-1 pt-1">
                      <span
                        className={
                          isMatch ? 'text-emerald-700 flex items-center gap-1' : 'text-rose-600 flex items-center gap-1'
                        }
                      >
                        {isMatch ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Land Stock Area Matched:</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>
                              {landSourcing.some((s) => !s.agreementId)
                                ? '⚠️ Please choose an agreement for all rows'
                                : '⚠️ Sourced Area Mismatch:'}
                            </span>
                          </>
                        )}
                      </span>
                      <span className={`font-mono text-sm ${isMatch ? 'text-emerald-800' : 'text-rose-700'}`}>
                        {totalAllocatedArea} / {plotArea} Sq. Ft.
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Section 5: Payment Mode, Audit Reasons & Notes */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                  5
                </span>
                <span>Payment Mode & Audit Narration</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className={inputCls}
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online / UPI</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={form.transactionReference}
                  onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. TXN987654321 / CHQ-1002"
                />
              </div>
            </div>

            {/* Admin Audit Reason */}
            <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-xl space-y-1">
              <label className="text-xs font-bold text-teal-950 flex items-center justify-between">
                <span>📝 Edit Reason / Admin Narration (कारण विवरण) *</span>
                <span className="text-[10px] text-teal-700 font-normal">Tracked in contract revision history</span>
              </label>
              <textarea
                value={form.reason || ''}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows="2"
                className="w-full bg-white border border-teal-200 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-xs text-slate-800 transition resize-none"
                placeholder="e.g. Rate adjustment and tenure terms updated per customer agreement..."
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Internal Notes / Remarks</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows="2"
                className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-xs text-slate-800 transition resize-none"
                placeholder="Enter general contract notes..."
              />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/dashboard/plots/booking/${id}`)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitLoading}
              disabled={!isFormValid || submitLoading}
            >
              Save Booking Changes
            </Button>
          </div>
        </div>

        {/* Right 1 Column: Sticky Summary Breakdown */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <BookingSummarySidebar
            step={3}
            selectedCustomer={selectedCustomer}
            selectedPlot={selectedPlot}
            baseRate={baseRate}
            isCorner={isCorner}
            cornerExtra={cornerExtra}
            effectiveRate={effectiveSqFtRate}
            calculatedPlotValue={calculatedPlotValue}
            isOneTime={isOneTime}
            form={form}
            calculatedDiscount={calculatedDiscount}
            netContractValue={netContractValue}
            downpaymentAmt={downpaymentAmt}
            emiPrincipalAmt={emiPrincipalAmt}
            emiMonthlyAmt={emiPerInstallmentAmt}
            emiRatePerSqFt={emiRatePerSqFt}
            customDpRate={customDpRate}
            emiFrequency={emiFrequency}
            installmentCount={installmentCount}
            totalTenureMonths={totalTenureMonths}
          />
        </div>
      </div>
    </div>
  );
}
