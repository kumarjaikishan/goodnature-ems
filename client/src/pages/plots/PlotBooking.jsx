import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowLeft, 
  Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

// Subcomponents from ./booking/components/
import { BookingProgressBar } from './booking/components/BookingProgressBar';
import { StepCustomer } from './booking/components/StepCustomer';
import { StepPlot } from './booking/components/StepPlot';
import { StepTermsAndPayment } from './booking/components/StepTermsAndPayment';
import { BookingSummarySidebar } from './booking/components/BookingSummarySidebar';

export default function PlotBooking() {
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

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

  // Land stock sourcing allocations: [{ sourceType, agreementId, agreementNumber, deedId, deedNumber, allocatedSqFt }]
  const [landSourcing, setLandSourcing] = useState([]);

  // Discount & Govt Rate settings
  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', or 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [govtRate, setGovtRate] = useState('100'); // default 100 / sqft

  // Editable dynamic rates
  const [customSqFtRate, setCustomSqFtRate] = useState(1000);
  const [customDpRate, setCustomDpRate] = useState(1000);

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    plotId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    tenureMonths: 0, // 0 for one-time, 6, 12, 18, 24... for EMIs
    bookingType: 'BOOKING',
    downpaymentDays: 90,
    downpaymentMonths: 3,
    oneTimeDays: 90,
    oneTimeMonths: 3,
    paymentMode: 'cash',
    transactionReference: '',
    sponsorId: '',
    notes: '',
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [seriesRes, plotsRes, ratesRes, landSourcesRes] = await Promise.all([
        api.get('/plots/series'),
        api.get('/plots?limit=5000'),
        api.get('/plots/rate-config').catch(() => ({ data: { data: null } })),
        api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } }))
      ]);

      const seriesData = seriesRes.data?.data || seriesRes.data || [];
      const plotsData = plotsRes.data?.data || plotsRes.data || [];
      const configData = ratesRes.data?.data || ratesRes.data || null;
      const landSourcesData = landSourcesRes.data?.data || landSourcesRes.data || [];

      setSeriesList(seriesData);
      setPlots(plotsData);
      setRateConfig(configData);
      setAvailableLandSources(landSourcesData);

      // Initialize default rates for 0 tenure
      const initialSlabs = configData?.rateSlabs?.length > 0 ? configData.rateSlabs : [];
      const firstSlab = initialSlabs[0] || { plotRate: 1000, downpaymentRate: 1000 };
      setCustomSqFtRate(firstSlab.plotRate || 1000);
      setCustomDpRate(firstSlab.downpaymentRate || firstSlab.plotRate || 1000);
    } catch (err) {
      console.error('Error loading booking data:', err);
      toast.error('Failed to load plot inventory and rate configurations');
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
      api.get('/plots/customers', {
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

    if (p.status === 'BOOKED' || p.status === 'REGISTERED' || p.status === 'SOLD') {
      toast.error(`Plot #${p.plotNumber} is already ${p.status.toLowerCase()}`);
      return;
    }

    setSelectedPlot(p);
    setForm((f) => ({ ...f, plotId: p._id }));
  };

  // Slabs from rate configuration or standard fallback
  const slabs = useMemo(() => {
    if (rateConfig?.rateSlabs?.length > 0) {
      return rateConfig.rateSlabs;
    }
    return [
      { tenureMonths: 0, plotRate: 1000, downpaymentRate: 1000, emiRate: 0 },
      { tenureMonths: 6, plotRate: 1100, downpaymentRate: 500, emiRate: 600 },
      { tenureMonths: 12, plotRate: 1200, downpaymentRate: 500, emiRate: 700 },
      { tenureMonths: 18, plotRate: 1300, downpaymentRate: 500, emiRate: 800 },
      { tenureMonths: 24, plotRate: 1400, downpaymentRate: 500, emiRate: 900 },
      { tenureMonths: 30, plotRate: 1500, downpaymentRate: 500, emiRate: 1000 },
      { tenureMonths: 36, plotRate: 1600, downpaymentRate: 500, emiRate: 1100 },
      { tenureMonths: 48, plotRate: 1800, downpaymentRate: 500, emiRate: 1300 },
      { tenureMonths: 60, plotRate: 2000, downpaymentRate: 500, emiRate: 1500 },
    ];
  }, [rateConfig]);

  const currentSlab = useMemo(() => {
    return slabs.find((s) => Number(s.tenureMonths) === Number(form.tenureMonths)) || slabs[0];
  }, [slabs, form.tenureMonths]);

  // Derived financial & rate calculations
  const isCorner = selectedPlot?.plotType === 'CORNER';
  const cornerExtra = isCorner ? (rateConfig?.cornerExtraPercent || 10) : 0;
  const plotArea = selectedPlot ? (selectedPlot.plotSize || selectedPlot.area || 0) : 0;

  const baseRate = Number(customSqFtRate) || 0;
  const effectiveSqFtRate = isCorner 
    ? Math.round(baseRate * (1 + cornerExtra / 100) * 100) / 100
    : baseRate;
  
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
    return Math.round(num); // Flat rupee
  }, [discountVal, discountType, calculatedPlotValue, selectedPlot, plotArea]);

  const netContractValue = Math.max(0, calculatedPlotValue - calculatedDiscount);
  const isOneTime = Number(form.tenureMonths) === 0;

  // Downpayment & EMI breakdown
  const downpaymentAmt = useMemo(() => {
    if (isOneTime) {
      return netContractValue;
    }
    const dpRate = Number(customDpRate) || 0;
    return Math.round(plotArea * dpRate);
  }, [isOneTime, netContractValue, customDpRate, plotArea]);

  // Balance EMI Principal: Gross Plot Value - Downpayment - Discount
  const emiPrincipalAmt = useMemo(() => {
    if (isOneTime) return 0;
    return Math.max(0, calculatedPlotValue - downpaymentAmt - calculatedDiscount);
  }, [isOneTime, calculatedPlotValue, downpaymentAmt, calculatedDiscount]);

  const emiRatePerSqFt = useMemo(() => {
    if (isOneTime || plotArea <= 0) return 0;
    return Math.round((emiPrincipalAmt / plotArea) * 100) / 100;
  }, [isOneTime, plotArea, emiPrincipalAmt]);

  const emiMonthlyAmt = useMemo(() => {
    if (isOneTime || Number(form.tenureMonths) <= 0) return 0;
    return Math.round(emiPrincipalAmt / Number(form.tenureMonths));
  }, [isOneTime, form.tenureMonths, emiPrincipalAmt]);

  // Dynamic Date Helpers
  const getDynamicOneTimeHelper = (bookingDateStr, daysVal) => {
    const d = bookingDateStr ? new Date(bookingDateStr) : new Date();
    d.setDate(d.getDate() + Number(daysVal || 90));
    return `Full payment of ₹${netContractValue.toLocaleString('en-IN')} due on or before ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysVal || 90} days).`;
  };

  const getDynamicEmiHelper = (bookingDateStr, daysVal) => {
    const d = bookingDateStr ? new Date(bookingDateStr) : new Date();
    d.setDate(d.getDate() + Number(daysVal || 90));
    return `Downpayment of ₹${downpaymentAmt.toLocaleString('en-IN')} due on or before ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysVal || 90} days). Remaining ₹${emiPrincipalAmt.toLocaleString('en-IN')} in ${form.tenureMonths} monthly EMIs.`;
  };

  // Step Navigation
  const nextStep = () => {
    if (step === 1 && !selectedCustomer) {
      toast.error('Please search and select a customer first');
      return;
    }
    if (step === 2 && !selectedPlot) {
      toast.error('Please choose an available plot first');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      setStep(1);
      return;
    }
    if (!selectedPlot) {
      toast.error('Please select a plot');
      setStep(2);
      return;
    }

    if (customSqFtRate <= 0) {
      toast.error('Please enter a valid plot rate per sq.ft.');
      return;
    }

    if (!isOneTime && (customDpRate <= 0 || customDpRate > customSqFtRate)) {
      toast.error('Downpayment rate must be greater than 0 and less than or equal to the plot selling rate');
      return;
    }

    // Validate Land Sourcing Allocation
    const totalAllocatedArea = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
    if (Math.abs(totalAllocatedArea - plotArea) > 0.5) {
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
        bookingType: 'BOOKING',
        bookingDate: form.bookingDate,
        scheme: isOneTime ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT',
        tenureMonths: Number(form.tenureMonths),
        discount: calculatedDiscount,
        discountType: discountType,
        discountValue: Number(discountVal) || 0,
        govtRate: Number(govtRate) || 100,
        
        // Editable Dynamic Rates & Financials
        customSqFtRate: Number(customSqFtRate),
        basePlotRate: Number(customSqFtRate),
        customDownpaymentRate: Number(customDpRate),
        downpaymentRate: Number(customDpRate),
        emiRate: emiRatePerSqFt,
        
        bookingAmount: downpaymentAmt,
        totalPlotAmount: netContractValue,
        downpaymentDays: Number(form.downpaymentDays || 90),
        oneTimeDays: Number(form.oneTimeDays || 90),
        paymentMode: form.paymentMode,
        transactionReference: form.transactionReference,
        sponsorId: form.sponsorId || selectedCustomer.sponsorId?._id || undefined,
        notes: form.notes,
        landSourcing: landSourcing,
      };

      const res = await api.post('/plots/bookings', payload);
      toast.success('Plot booked successfully!');

      const bookingId = res.data?.data?.booking?._id || res.data?.data?._id || res.data?.booking?._id || '';
      if (bookingId) {
        navigate(`/dashboard/plots/booking/${bookingId}`);
      } else {
        navigate('/dashboard/plots/booking');
      }
    } catch (err) {
      console.error('Plot booking submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit plot booking');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/plots/booking')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Back to Bookings"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Building2 className="text-teal-700" size={24} />
              Plot Booking Wizard
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 ml-7">
            Step-by-step customer assignment, plot selection, dynamic rate configuration & land allocation
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <Sparkles size={14} className="text-teal-600" /> Dynamic Rate Mode
          </span>
        </div>
      </div>

      {/* Progress Bar Component */}
      <BookingProgressBar step={step} setStep={setStep} />

      {/* Main Form + Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Step Forms */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-2xs p-5 sm:p-6 rounded-2xl">
          
          {step === 1 && (
            <StepCustomer
              nextStep={nextStep}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              selectCustomer={selectCustomer}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              setForm={setForm}
            />
          )}

          {step === 2 && (
            <StepPlot
              prevStep={prevStep}
              nextStep={nextStep}
              selectedPlot={selectedPlot}
              seriesList={seriesList}
              plots={plots}
              form={form}
              handlePlotSelect={handlePlotSelect}
            />
          )}

          {step === 3 && (
            <StepTermsAndPayment
              handleSubmit={handleSubmit}
              prevStep={prevStep}
              submitLoading={submitLoading}
              form={form}
              setForm={setForm}
              slabs={slabs}
              currentSlab={currentSlab}
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountVal={discountVal}
              setDiscountVal={setDiscountVal}
              calculatedDiscount={calculatedDiscount}
              govtRate={govtRate}
              setGovtRate={setGovtRate}
              isOneTime={isOneTime}
              netContractValue={netContractValue}
              getDynamicOneTimeHelper={getDynamicOneTimeHelper}
              downpaymentAmt={downpaymentAmt}
              getDynamicEmiHelper={getDynamicEmiHelper}
              emiPrincipalAmt={emiPrincipalAmt}
              emiMonthlyAmt={emiMonthlyAmt}
              plotArea={plotArea}
              availableLandSources={availableLandSources}
              landSourcing={landSourcing}
              setLandSourcing={setLandSourcing}
              customSqFtRate={customSqFtRate}
              setCustomSqFtRate={setCustomSqFtRate}
              customDpRate={customDpRate}
              setCustomDpRate={setCustomDpRate}
              effectiveSqFtRate={effectiveSqFtRate}
              calculatedPlotValue={calculatedPlotValue}
              emiRatePerSqFt={emiRatePerSqFt}
            />
          )}

        </div>

        {/* Right 1 Col: Booking Summary Sidebar */}
        <BookingSummarySidebar
          step={step}
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
          emiMonthlyAmt={emiMonthlyAmt}
          emiRatePerSqFt={emiRatePerSqFt}
          customDpRate={customDpRate}
        />

      </div>
    </div>
  );
}
