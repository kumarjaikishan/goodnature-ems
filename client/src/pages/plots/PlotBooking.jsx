import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  IndianRupee,
  Building2,
  Users,
  Tag,
  SlidersHorizontal
} from 'lucide-react';
import PageLoader from '../../components/common/PageLoader';
import { CircularProgress } from '@mui/material';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const PlotBooking = () => {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [rateConfig, setRateConfig] = useState(null);

  // Wizard Steps: 1 = Customer, 2 = Plot, 3 = Terms & Payment
  const [step, setStep] = useState(1);

  // Customer search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form fields
  const [form, setForm] = useState({
    plotId: '',
    customerId: '',
    sponsorId: '',
    tenureMonths: 0, // 0 for one-time, 3, 6, 9, 12... for EMIs
    scheme: 'FULL_PAYMENT',
    bookingAmount: '',
    paymentMode: 'cash',
    transactionReference: '',
    notes: '',
    bookingType: 'BOOKING', // BOOKING or HOLD
    holdExpiryDays: '7',
    discount: '',
    bookingDate: getTodayDateString(),
    oneTimeMonths: 1,
    downpaymentMonths: 1,
  });

  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', or 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [downpaymentBase, setDownpaymentBase] = useState('BEFORE_DISCOUNT'); // 'BEFORE_DISCOUNT' (default) or 'AFTER_DISCOUNT'
  const [govtRate, setGovtRate] = useState('100'); // default 100 / sqft

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [plotsRes, seriesRes, rateRes] = await Promise.all([
          api.get('/plots?limit=5000'),
          api.get('/plots/series'),
          api.get('/plots/rate-config'),
        ]);
        setPlots(plotsRes.data.data || []);
        setSeriesList(seriesRes.data.data || []);
        setRateConfig(rateRes.data.data || null);
        setLoading(false);
      } catch {
        toast.error('Failed to load plot inventory & rate data');
        setLoading(false);
      }
    };
    loadInitData();
  }, []);

  // Search onboarded plot customers
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (selectedCustomer && searchQuery.trim() === selectedCustomer.name.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      api.get('/plots/customers', {
        params: {
          search: searchQuery,
          limit: 10,
        },
      })
        .then((res) => {
          const list = res.data.data?.customers || res.data.customers || res.data.data || [];
          setSearchResults(list);
        })
        .catch(() => setSearchResults([]));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCustomer]);

  const selectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchQuery(cust.name);
    setSearchResults([]);
    const sId = cust.sponsorId?._id || cust.sponsorId || '';
    setForm((f) => ({ ...f, customerId: cust._id, sponsorId: sId }));
  };

  const handlePlotSelect = (plotId) => {
    const p = plots.find((item) => item._id === plotId);
    if (!p) return;

    if (p.status === 'BOOKED' || p.status === 'REGISTERED') {
      toast.error(`Plot ${p.plotNumber} is already ${p.status.toLowerCase()}`);
      return;
    }

    setSelectedPlot(p);
    setForm((f) => ({ ...f, plotId: p._id }));
  };

  // Slabs from rate config or default fallback
  const slabs = rateConfig?.rateSlabs?.length > 0
    ? rateConfig.rateSlabs
    : [
        { tenureMonths: 0, plotRate: 1000, promoterCommissionPercent: 10.0, developerCommissionPercent: 2.0, downpaymentPercent: 100, emiPercent: 0 },
        { tenureMonths: 3, plotRate: 1050, promoterCommissionPercent: 10.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 6, plotRate: 1100, promoterCommissionPercent: 11.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 9, plotRate: 1150, promoterCommissionPercent: 11.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 12, plotRate: 1200, promoterCommissionPercent: 12.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 15, plotRate: 1250, promoterCommissionPercent: 12.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 18, plotRate: 1300, promoterCommissionPercent: 13.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 21, plotRate: 1350, promoterCommissionPercent: 13.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 24, plotRate: 1400, promoterCommissionPercent: 14.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 27, plotRate: 1450, promoterCommissionPercent: 14.5, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
        { tenureMonths: 30, plotRate: 1500, promoterCommissionPercent: 15.0, developerCommissionPercent: 2.0, downpaymentPercent: 40, emiPercent: 60 },
      ];

  const currentSlab = slabs.find((s) => Number(s.tenureMonths) === Number(form.tenureMonths)) || slabs[0];

  // Dynamic Price & Breakdown Calculations
  const plotArea = selectedPlot ? (selectedPlot.plotSize || selectedPlot.area || 0) : 0;
  const isCorner = selectedPlot?.plotType === 'CORNER';
  const cornerExtra = isCorner ? (rateConfig?.cornerExtraPercent || 20) : 0;
  const baseRate = currentSlab.plotRate || rateConfig?.baseSqFtRate || 1000;
  const effectiveRate = baseRate * (1 + cornerExtra / 100);
  const calculatedPlotValue = Math.round(plotArea * effectiveRate);

  // Helper to calculate total discount in Rupees
  const calculateDiscountAmount = (type, val) => {
    const num = Number(val) || 0;
    if (num <= 0 || !selectedPlot) return 0;

    if (type === 'PERCENT') {
      return Math.round((calculatedPlotValue * num) / 100);
    } else if (type === 'SQFT_RATE') {
      return Math.round(plotArea * num);
    }
    return num;
  };

  const calculatedDiscount = calculateDiscountAmount(discountType, discountVal);
  const netContractValue = Math.max(0, calculatedPlotValue - calculatedDiscount);

  const isOneTime = form.tenureMonths === 0;
  const dpPercent = currentSlab.downpaymentPercent ? currentSlab.downpaymentPercent / 100 : (isOneTime ? 1.0 : 0.40);

  let downpaymentAmt = 0;
  let emiPrincipalAmt = 0;

  if (isOneTime) {
    downpaymentAmt = netContractValue;
    emiPrincipalAmt = 0;
  } else {
    // 40% always calculated on Gross Plot Value (before discount)
    downpaymentAmt = Math.round(calculatedPlotValue * dpPercent);
    emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
  }

  const emiMonthlyAmt = !isOneTime && form.tenureMonths > 0 ? Math.round(emiPrincipalAmt / form.tenureMonths) : 0;

  // Sponsor Hierarchy & Commission Breakdown
  const customerSponsor = selectedCustomer?.sponsorId;
  const isDeveloperSponsor = customerSponsor && (!customerSponsor.sponsorId || customerSponsor.sponsorId === 'direct');
  const isSubSponsor = customerSponsor && Boolean(customerSponsor.sponsorId) && customerSponsor.sponsorId !== 'direct';

  const promoterPct = currentSlab.promoterCommissionPercent || 0;
  const developerPct = currentSlab.developerCommissionPercent || 0;
  const totalDevDirectPct = +(promoterPct + developerPct).toFixed(2);

  const nextStep = () => {
    if (step === 1 && !selectedCustomer) {
      return toast.error('Please choose a customer first');
    }
    if (step === 2 && !selectedPlot) {
      return toast.error('Please choose a plot first');
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plotId) return toast.error('Please select a plot');
    if (!form.customerId) return toast.error('Please select a customer');

    setSubmitLoading(true);
    try {
      const payload = {
        plotId: form.plotId,
        customerId: form.customerId,
        sponsorId: form.sponsorId || undefined,
        scheme: isOneTime ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT',
        tenureMonths: Number(form.tenureMonths),
        bookingAmount: downpaymentAmt,
        discount: calculatedDiscount,
        bookingDate: form.bookingDate,
        oneTimeMonths: isOneTime ? Number(form.oneTimeMonths || 1) : undefined,
        downpaymentMonths: !isOneTime ? Number(form.downpaymentMonths || 1) : undefined,
        downpaymentCalculationBase: downpaymentBase,
        notes: form.notes,
        bookingType: form.bookingType || 'BOOKING',
        holdExpiryDays: Number(form.holdExpiryDays) || 7,
        govtRate: Number(govtRate) || 100,
      };

      const res = await api.post('/plots/bookings', payload);
      const receipt = res.data.data?.receipt;
      toast.success('Plot booked successfully with locked commission schedule');

      if (receipt && receipt._id) {
        navigate(`/dashboard/plots/receipts/${receipt._id}`);
      } else {
        navigate('/dashboard/plots/booking');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading Plot Booking Wizard..."
        subtitle="Fetching active plot inventory, customers & rate matrix"
      />
    );
  }

  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
  const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none font-medium';

  return (
    <div className="p-6 bg-slate-50 min-h-screen select-none max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create Plot Booking</h1>
        <p className="text-slate-500 text-sm">Step-by-step wizard to register a new plot booking with dynamic tenure rates & 40/60 breakdown.</p>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white border border-slate-200 shadow-xs p-5 sm:p-6 rounded-2xl w-full">
        <div className="relative flex items-center justify-between w-full">
          {/* Background Track Line */}
          <div className="absolute left-[12%] right-[12%] top-5 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full" />
          
          {/* Active Filled Progress Line */}
          <div
            className="absolute left-[12%] top-5 -translate-y-1/2 h-1 transition-all duration-500 ease-out z-0 rounded-full bg-primary"
            style={{
              width: step === 1 ? '0%' : step === 2 ? '38%' : '76%',
            }}
          />

          {/* Step 1 Node */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step === 1
                  ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105'
                  : step > 1
                  ? 'bg-emerald-600 text-white shadow-xs cursor-pointer ring-4 ring-emerald-50 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {step > 1 ? <Check className="w-5 h-5 stroke-2" /> : '1'}
            </button>
            <div className="flex flex-col items-center text-center">
              <span className={`text-xs font-bold transition-colors ${step === 1 ? 'text-slate-900' : step > 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                1. Customer Details
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block max-w-[130px] truncate">
                {selectedCustomer ? selectedCustomer.name : 'Select or Register'}
              </span>
            </div>
          </div>

          {/* Step 2 Node */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
            <button
              type="button"
              onClick={() => step > 2 && setStep(2)}
              disabled={step < 2}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step === 2
                  ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105'
                  : step > 2
                  ? 'bg-emerald-600 text-white shadow-xs cursor-pointer ring-4 ring-emerald-50 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {step > 2 ? <Check className="w-5 h-5 stroke-2" /> : '2'}
            </button>
            <div className="flex flex-col items-center text-center">
              <span className={`text-xs font-bold transition-colors ${step === 2 ? 'text-slate-900' : step > 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                2. Plot Selection
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block max-w-[130px] truncate">
                {selectedPlot ? `Plot ${selectedPlot.plotNumber}` : 'Choose from Series'}
              </span>
            </div>
          </div>

          {/* Step 3 Node */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step === 3
                  ? 'bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              3
            </div>
            <div className="flex flex-col items-center text-center">
              <span className={`text-xs font-bold transition-colors ${step === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                3. Scheme & Payment
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block max-w-[130px] truncate">
                {form.tenureMonths === 0 ? 'One-Time (0-Mo)' : `${form.tenureMonths}-Mo EMI Slabs`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Form Area (takes 2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-xs rounded-2xl p-6">
          {/* STEP 1: CUSTOMER SELECTION */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <h3 className="text-base font-bold text-slate-800">1. Select Plot Customer</h3>
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard/plots/customers/new"
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5"
                  >
                    <UserPlus size={14} /> + Register Customer
                  </Link>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-1.5 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 bg-primary hover:opacity-90"
                  >
                    Next: Choose Plot <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Customer Search Bar */}
              <div className="relative">
                <label className={labelCls}>Search Existing Customer</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pl-10`}
                    placeholder="Search by name, customer ID, or mobile number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={18} className="text-slate-400 absolute left-3.5 top-3" />
                </div>

                {/* Search Dropdown Results */}
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
                          <span className="text-slate-400">{cust.mobile}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-indigo-600">{cust.customerCode || cust.customerId}</span>
                          <span className="text-[11px] text-slate-500">
                            Sponsor: {cust.sponsorId?.name || 'Direct / Company'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Customer Card */}
              {selectedCustomer && (
                <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</span>
                      <span className="text-slate-500">{selectedCustomer.mobile} | ID: <strong className="font-mono text-indigo-700">{selectedCustomer.customerCode || selectedCustomer.customerId}</strong></span>
                      <span className="text-slate-500 mt-0.5">
                        Sponsor: <strong>{selectedCustomer.sponsorId?.name || '🏢 Company (Direct)'}</strong>
                        {selectedCustomer.sponsorId && (
                          <span className="ml-1 text-[11px] text-indigo-600 font-semibold">
                            ({!selectedCustomer.sponsorId.sponsorId ? '👑 Developer Sponsor' : '👤 Sub Sponsor'})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setSearchQuery('');
                      setForm((f) => ({ ...f, customerId: '', sponsorId: '' }));
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 text-white font-medium text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 bg-primary"
                >
                  Next: Choose Plot <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE PLOT */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">2. Select Plot</h3>
                  {selectedPlot && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Selected: {selectedPlot.plotNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    Next: Payment Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded-sm" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded-sm" /> Hold</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm opacity-60" /> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-primary rounded-sm" /> Selected</span>
              </div>

              {/* Plot Series Maps */}
              <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-1">
                {seriesList.map((s) => {
                  const seriesPlots = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id);
                  return (
                    <div key={s._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">{s.prefix}-Plot Series ({s.name})</span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">Plots: {seriesPlots.length}</span>
                      </div>

                      {seriesPlots.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No plots generated for this series.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {seriesPlots.map((p) => {
                            const isAvailable = p.status === 'AVAILABLE';
                            const isCorner = p.plotType === 'CORNER';
                            const isHold = p.status === 'HOLD';
                            const isBooked = p.status === 'BOOKED' || p.status === 'REGISTERED';
                            const isSelected = form.plotId === p._id;

                            let colorCls = '';
                            if (isSelected) {
                              colorCls = 'bg-indigo-600 border-indigo-700 text-white shadow-xs ring-2 ring-indigo-500/20';
                            } else if (isHold) {
                              colorCls = 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
                            } else if (isBooked) {
                              colorCls = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';
                            } else {
                              colorCls = 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
                            }

                            return (
                              <button
                                type="button"
                                key={p._id}
                                disabled={isBooked}
                                onClick={() => {
                                  if (isAvailable) {
                                    handlePlotSelect(p._id);
                                  } else {
                                    toast.error(`Plot ${p.plotNumber} is already ${p.status.toLowerCase()}`);
                                  }
                                }}
                                className={`p-2 border rounded-xl flex flex-col justify-between transition cursor-pointer select-none h-12 ${colorCls}`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs font-bold tracking-wider">{p.plotNumber}</span>
                                  {isCorner && (
                                    <span className={`text-[0.6rem] font-bold px-1 rounded ${isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}>
                                      CORNER
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between items-end w-full">
                                  <span className={`text-[0.6rem] uppercase font-semibold ${isSelected ? 'text-indigo-100' : 'opacity-80'}`}>
                                    {isSelected ? 'Selected' : isAvailable ? 'Available' : p.status}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-medium text-xs text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  Next: Payment Details <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT SCHEME, DYNAMIC TENURE RATES & SPONSOR COMMISSION */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  3. Contract Terms, Tenure Rates & Sponsor Allocation
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={submitLoading}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-5 py-1.5 text-white rounded-xl font-bold text-xs cursor-pointer transition flex items-center justify-center shadow-xs bg-primary hover:opacity-90"
                  >
                    {submitLoading ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : 'Confirm Book Plot'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Booking Date */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Booking Date</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.bookingDate}
                    onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                    required
                  />
                </div>

                {/* Tenure / Scheme Matrix Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Tenure & Rate Slab (समय / बिक्री दर) *</label>
                  <select
                    className={`${inputCls} bg-indigo-50/50 border-indigo-300 text-indigo-950 font-bold`}
                    value={form.tenureMonths}
                    onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })}
                  >
                    {slabs.map((s) => (
                      <option key={s.tenureMonths} value={s.tenureMonths}>
                        {s.tenureMonths === 0
                          ? `0 Months (One-Time Payment) — ₹${s.plotRate}/sqft [100% Downpayment]`
                          : `${s.tenureMonths} Months EMI — ₹${s.plotRate}/sqft [40% Down / 60% in ${s.tenureMonths} EMIs]`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-indigo-600 font-semibold px-1">
                    Rate: ₹{currentSlab.plotRate}/sqft | Promoter: {currentSlab.promoterCommissionPercent}% | Dev Override: {currentSlab.developerCommissionPercent}%
                  </span>
                </div>

                {/* Discount Input */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Discount</label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="px-3 py-2.5 bg-slate-100 text-xs font-bold text-slate-700 border-r border-slate-300 outline-none cursor-pointer"
                    >
                      <option value="RUPEE">₹ (Flat)</option>
                      <option value="PERCENT">% (Percentage)</option>
                      <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                    </select>
                    <input
                      className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none text-slate-800 font-medium"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder={
                        discountType === 'PERCENT'
                          ? 'e.g. 10%'
                          : discountType === 'SQFT_RATE'
                          ? 'e.g. 50 (₹/Sq.Ft.)'
                          : 'e.g. 5000 (Flat ₹)'
                      }
                    />
                  </div>
                  {calculatedDiscount > 0 && (
                    <span className="text-[0.68rem] text-emerald-700 font-semibold px-1">
                      Calculated Discount: ₹{calculatedDiscount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Govt Rate */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Govt. Base Rate (₹ / Sq.Ft.)</label>
                  <input
                    className={inputCls}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={govtRate}
                    onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Govt rate per sqft (Default 100)"
                  />
                </div>

                {/* One Time vs EMI Breakdown */}
                {isOneTime ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Total Final Payment (100%)</label>
                      <input
                        className={`${inputCls} bg-emerald-50 border-emerald-200 text-emerald-800 font-bold font-mono cursor-not-allowed`}
                        type="text"
                        value={`₹${netContractValue.toLocaleString('en-IN')}`}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>One-Time Payment Time Limit (Months)</label>
                      <input
                        className={inputCls}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.oneTimeMonths || 1}
                        onChange={(e) => setForm({ ...form, oneTimeMonths: Number(e.target.value.replace(/[^0-9]/g, '')) || 1 })}
                        placeholder="Time limit (e.g. 1, 2, 3 months)"
                        required
                      />
                      <span className="text-[11px] text-slate-400 px-1">Time allowed to complete one-time payment.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>
                        Downpayment (40% of Gross Plot Value)
                      </label>
                      <input
                        className={`${inputCls} bg-indigo-50 border-indigo-200 text-indigo-800 font-bold font-mono cursor-not-allowed`}
                        type="text"
                        value={`₹${downpaymentAmt.toLocaleString('en-IN')}`}
                        disabled
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Downpayment Time Limit (Months)</label>
                      <input
                        className={inputCls}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.downpaymentMonths || 1}
                        onChange={(e) => setForm({ ...form, downpaymentMonths: Number(e.target.value.replace(/[^0-9]/g, '')) || 1 })}
                        placeholder="e.g. 1 or 2 months"
                        required
                      />
                      <span className="text-[11px] text-slate-400 px-1">Time allowed to complete 40% downpayment.</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>EMI Balance (Net Contract - Downpayment)</label>
                      <input
                        className={`${inputCls} bg-slate-50 border-slate-200 text-slate-700 font-bold font-mono cursor-not-allowed`}
                        type="text"
                        value={`₹${emiPrincipalAmt.toLocaleString('en-IN')}`}
                        disabled
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Monthly EMI Amount ({form.tenureMonths} Months)</label>
                      <input
                        className={`${inputCls} bg-slate-50 border-slate-200 text-slate-900 font-black font-mono cursor-not-allowed`}
                        type="text"
                        value={`₹${emiMonthlyAmt.toLocaleString('en-IN')} / month`}
                        disabled
                      />
                    </div>
                  </>
                )}

                {/* Booking Notes */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className={labelCls}>Booking Notes</label>
                  <textarea
                    className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl text-sm text-slate-800 transition resize-none font-medium"
                    placeholder="Internal contract comments or special notes..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={submitLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-medium text-xs text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 text-white rounded-xl font-medium text-xs cursor-pointer transition min-w-[170px] flex items-center justify-center shadow-xs bg-primary"
                >
                  {submitLoading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : 'Confirm Book Plot'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Side Preview/Summary Column (takes 1 column) */}
        <div className="flex flex-col gap-6">
          {/* Dynamic Details Card based on step */}
          {step === 1 && (
            <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Customer Preview</h3>
              {selectedCustomer ? (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 tracking-wider">{selectedCustomer.customerCode || selectedCustomer.customerId}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs font-semibold pt-3 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Mobile</span>
                      <span className="text-slate-700">{selectedCustomer.mobile}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Email</span>
                      <span className="text-slate-700">{selectedCustomer.email || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Referral Sponsor</span>
                      <span className="text-slate-700">
                        {selectedCustomer.sponsorId ? `${selectedCustomer.sponsorId.name} ${selectedCustomer.sponsorId.sponsorCode ? `(${selectedCustomer.sponsorId.sponsorCode})` : ''}` : '🏢 Direct / Company'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 font-bold">No Customer Selected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Please search and select a plot customer in the main form.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Plot Preview</h3>
              {selectedPlot ? (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">Plot {selectedPlot.plotNumber}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">AVAILABLE</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs font-semibold pt-3 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Plot Size</span>
                      <span className="text-slate-800">{selectedPlot.plotSize} Sq Ft</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Corner Type</span>
                      <span className="text-slate-800">{selectedPlot.plotType}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 font-bold">No Plot Selected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Please select a plot number from the grid.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Contract Summary</h3>
              <div className="flex flex-col gap-4 text-xs font-semibold">
                {/* Customer Info */}
                {selectedCustomer && (
                  <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                    <span className="text-[0.68rem] text-slate-400 uppercase">Customer</span>
                    <span className="font-bold text-slate-800 capitalize">{selectedCustomer.name} ({selectedCustomer.customerCode || selectedCustomer.customerId})</span>
                  </div>
                )}

                {/* Plot Info & Value */}
                {selectedPlot && (
                  <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                    <span className="text-[0.68rem] text-slate-400 uppercase">Selected Plot</span>
                    <span className="font-bold text-slate-800">Plot {selectedPlot.plotNumber} ({selectedPlot.plotSize} Sq Ft)</span>
                    <span className="text-slate-500 font-medium">
                      Rate: ₹{baseRate}/sqft {isCorner ? `+ Corner (+${cornerExtra}%) = ₹${effectiveRate}/sqft` : ''}
                    </span>
                    <span className="text-slate-900 font-bold mt-1 font-mono">Gross: ₹{calculatedPlotValue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Scheme & Payment Overview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[0.68rem] text-slate-400 uppercase">Financial Terms</span>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Scheme:</span>
                    <span className="font-bold text-slate-800">
                      {isOneTime ? '0-Month One Time' : `${form.tenureMonths}-Month EMI`}
                    </span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span>- ₹{calculatedDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-bold text-slate-900">
                    <span>Net Amount:</span>
                    <span className="font-mono">₹{netContractValue.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-700 font-bold pt-1">
                    <span>Downpayment ({isOneTime ? '100%' : '40% Gross'}):</span>
                    <span className="font-mono">₹{downpaymentAmt.toLocaleString('en-IN')}</span>
                  </div>

                  {!isOneTime && (
                    <div className="flex justify-between items-center text-indigo-700 font-bold">
                      <span>EMI ({form.tenureMonths} mos balance):</span>
                      <span className="font-mono">₹{emiMonthlyAmt.toLocaleString('en-IN')} / mo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlotBooking;
