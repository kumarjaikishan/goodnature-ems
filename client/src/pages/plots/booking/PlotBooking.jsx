import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import { toast } from '../../../utils/toast';

// Subcomponents from ./components/
import { BookingProgressBar } from './components/BookingProgressBar';
import { StepCustomer } from './components/StepCustomer';
import { StepPlot } from './components/StepPlot';
import { StepTermsAndPayment } from './components/StepTermsAndPayment';
import { BookingSummarySidebar } from './components/BookingSummarySidebar';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';

export default function PlotBooking() {
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Master Data
  const [seriesList, setSeriesList] = useState([]);
  const [plots, setPlots] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [rateConfig, setRateConfig] = useState(null);
  const [availableLandSources, setAvailableLandSources] = useState([]);

  // Customer search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Plot selection & Premium Heads toggles
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedPremiumHeads, setSelectedPremiumHeads] = useState([]); // [{ name, extraPercent, active: boolean }]

  // Land stock sourcing allocations: [{ sourceType, agreementId, agreementNumber, deedId, deedNumber, allocatedSqFt }]
  const [landSourcing, setLandSourcing] = useState([]);

  // Discount & Govt Rate settings
  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', or 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [govtRate, setGovtRate] = useState('100'); // default 100 / sqft

  // Editable dynamic rates & Payment Plan Mode
  const [paymentPlanMode, setPaymentPlanMode] = useState('EMI'); // 'EMI' or 'ONE_TIME'
  const [customSqFtRate, setCustomSqFtRate] = useState(1000);
  const [dpType, setDpType] = useState('SQFT_RATE'); // 'SQFT_RATE', 'PERCENT', or 'FLAT'
  const [dpVal, setDpVal] = useState(500);
  const [emiFrequency, setEmiFrequency] = useState('MONTHLY'); // 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'
  const [installmentCount, setInstallmentCount] = useState(1);

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    plotId: '',
    projectId: '',
    projectName: '',
    bookingDate: new Date().toISOString().split('T')[0],
    tenureMonths: 1,
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
      const [seriesRes, plotsRes, ratesRes, landSourcesRes, projectsRes] = await Promise.all([
        api.get('/plots/series'),
        api.get('/plots?limit=5000'),
        api.get('/plots/rate-config').catch(() => ({ data: { data: null } })),
        api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } })),
        api.get('/plots/projects').catch(() => ({ data: { data: [] } })),
      ]);

      const seriesData = seriesRes.data?.data || seriesRes.data || [];
      const plotsData = plotsRes.data?.data || plotsRes.data || [];
      const configData = ratesRes.data?.data || ratesRes.data || null;
      const landSourcesData = landSourcesRes.data?.data || landSourcesRes.data || [];
      const projectsData = projectsRes.data?.data || projectsRes.data || [];

      setSeriesList(seriesData);
      setPlots(plotsData);
      setRateConfig(configData);
      setAvailableLandSources(landSourcesData);
      setProjects(projectsData);

      setCustomSqFtRate(1000);
      setDpType('SQFT_RATE');
      setDpVal(500);
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

    // Skip duplicate network search if search query matches currently selected customer
    if (
      selectedCustomer &&
      (searchQuery.trim().toLowerCase() === selectedCustomer.name?.trim().toLowerCase() ||
        searchQuery.trim() === (selectedCustomer.customerCode || selectedCustomer.customerId || ''))
    ) {
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
  }, [searchQuery, selectedCustomer]);

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
    setForm((f) => ({
      ...f,
      plotId: p._id,
      projectId: p.projectId?._id || p.projectId || f.projectId || '',
      projectName: p.projectName || f.projectName || '',
    }));

    // Initialize premium heads with default checked (active: true)
    const heads = [];
    if (Array.isArray(p.premiumHeads) && p.premiumHeads.length > 0) {
      p.premiumHeads.forEach((h) => {
        heads.push({ name: h.name, extraPercent: Number(h.extraPercent) || 0, active: true });
      });
    } else if (p.plotType === 'CORNER') {
      heads.push({ name: 'Corner Plot', extraPercent: rateConfig?.cornerExtraPercent || 20, active: true });
    }
    setSelectedPremiumHeads(heads);
  };

  const togglePremiumHead = (index) => {
    setSelectedPremiumHeads((prev) =>
      prev.map((head, i) => (i === index ? { ...head, active: !head.active } : head))
    );
  };

  // Slabs fallback
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
  const totalPremiumExtra = useMemo(() => {
    return selectedPremiumHeads
      .filter((h) => h.active)
      .reduce((sum, h) => sum + (Number(h.extraPercent) || 0), 0);
  }, [selectedPremiumHeads]);

  const isCorner = selectedPlot?.plotType === 'CORNER';
  const cornerExtra = totalPremiumExtra;
  const plotArea = selectedPlot ? (selectedPlot.plotSize || selectedPlot.area || 0) : 0;

  const baseRate = Number(customSqFtRate) || 1000;
  const effectiveSqFtRate = totalPremiumExtra > 0
    ? Math.round(baseRate * (1 + totalPremiumExtra / 100) * 100) / 100
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
      case 'QUARTERLY': return 3;
      case 'HALF_YEARLY': return 6;
      case 'YEARLY': return 12;
      default: return 1;
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

  const emiMonthlyAmt = emiPerInstallmentAmt;

  // Dynamic Due Date Helper
  const getDynamicDueHelper = (bookingDateStr, daysVal) => {
    const d = bookingDateStr ? new Date(bookingDateStr) : new Date();
    d.setDate(d.getDate() + Number(daysVal || 90));
    return `Payment due on or before ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysVal || 90} days).`;
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

  // Submit Handler: Opens the Review & Confirmation Modal
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

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

    if (downpaymentAmt <= 0) {
      toast.error('Please enter a valid downpayment amount');
      return;
    }

    if (!isOneTime && (!installmentCount || Number(installmentCount) <= 0)) {
      toast.error('Please enter a valid number of installments');
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

    // Open Pre-Booking Confirmation Modal
    setIsConfirmModalOpen(true);
  };

  // Final confirmation action inside modal
  const handleFinalBookingConfirm = async () => {
    try {
      setSubmitLoading(true);

      const payload = {
        customerId: selectedCustomer._id,
        plotId: selectedPlot._id,
        projectId: form.projectId || selectedPlot.projectId?._id || selectedPlot.projectId || null,
        projectName: form.projectName || selectedPlot.projectName || '',
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
        notes: form.notes || '',
        landSourcing: landSourcing,
        appliedPremiumHeads: selectedPremiumHeads
          .filter((h) => h.active)
          .map((h) => ({ name: h.name, extraPercent: h.extraPercent })),
      };

      const res = await api.post('/plots/bookings', payload);
      toast.success('Plot booking submitted successfully in PENDING status!');

      setIsConfirmModalOpen(false);

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
              Plot Booking
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Book a plot with dynamic rates, discount, downpayment and land stock sourcing.
          </p>
        </div>
      </div>

      {/* Step Indicator Top Bar */}
      <BookingProgressBar step={step} setStep={setStep} />

      {/* Main Grid: Left 2 Cols Form, Right 1 Col Live Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Step Forms */}
        <div className="lg:col-span-2">
          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <StepCustomer
              nextStep={nextStep}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              selectCustomer={selectCustomer}
              form={form}
              setForm={setForm}
            />
          )}

          {/* Step 2: Plot Selection & Inventory Visualizer */}
          {step === 2 && (
            <StepPlot
              nextStep={nextStep}
              prevStep={prevStep}
              selectedPlot={selectedPlot}
              plots={plots}
              seriesList={seriesList}
              projects={projects}
              selectedProjectId={selectedProjectId}
              setSelectedProjectId={setSelectedProjectId}
              handlePlotSelect={handlePlotSelect}
              form={form}
              rateConfig={rateConfig}
            />
          )}

          {/* Step 3: Terms, Rates, Downpayment & Land Sourcing */}
          {step === 3 && (
            <StepTermsAndPayment
              handleSubmit={handleSubmit}
              prevStep={prevStep}
              submitLoading={submitLoading}
              form={form}
              setForm={setForm}
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountVal={discountVal}
              setDiscountVal={setDiscountVal}
              calculatedDiscount={calculatedDiscount}
              govtRate={govtRate}
              setGovtRate={setGovtRate}
              isOneTime={isOneTime}
              paymentPlanMode={paymentPlanMode}
              setPaymentPlanMode={setPaymentPlanMode}
              netContractValue={netContractValue}
              downpaymentAmt={downpaymentAmt}
              dpType={dpType}
              setDpType={setDpType}
              dpVal={dpVal}
              setDpVal={setDpVal}
              customDpRate={customDpRate}
              remainingBalance={emiPrincipalAmt}
              emiFrequency={emiFrequency}
              setEmiFrequency={setEmiFrequency}
              installmentCount={installmentCount}
              setInstallmentCount={setInstallmentCount}
              totalTenureMonths={totalTenureMonths}
              emiPerInstallmentAmt={emiPerInstallmentAmt}
              getDynamicDueHelper={getDynamicDueHelper}
              plotArea={plotArea}
              availableLandSources={availableLandSources}
              landSourcing={landSourcing}
              setLandSourcing={setLandSourcing}
              customSqFtRate={customSqFtRate}
              setCustomSqFtRate={setCustomSqFtRate}
              effectiveSqFtRate={effectiveSqFtRate}
              calculatedPlotValue={calculatedPlotValue}
              selectedPlot={selectedPlot}
              projects={projects}
              selectedPremiumHeads={selectedPremiumHeads}
              togglePremiumHead={togglePremiumHead}
              totalPremiumExtra={totalPremiumExtra}
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
          emiMonthlyAmt={emiPerInstallmentAmt}
          emiRatePerSqFt={emiRatePerSqFt}
          customDpRate={customDpRate}
          emiFrequency={emiFrequency}
          installmentCount={installmentCount}
          totalTenureMonths={totalTenureMonths}
          selectedPremiumHeads={selectedPremiumHeads}
        />

      </div>

      {/* Pre-Booking Review & Confirmation Modal */}
      <BookingConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleFinalBookingConfirm}
        submitLoading={submitLoading}
        selectedCustomer={selectedCustomer}
        selectedPlot={selectedPlot}
        seriesList={seriesList}
        customSqFtRate={customSqFtRate}
        effectiveSqFtRate={effectiveSqFtRate}
        calculatedPlotValue={calculatedPlotValue}
        calculatedDiscount={calculatedDiscount}
        discountType={discountType}
        discountVal={discountVal}
        netContractValue={netContractValue}
        paymentPlanMode={paymentPlanMode}
        downpaymentAmt={downpaymentAmt}
        customDpRate={customDpRate}
        remainingBalance={emiPrincipalAmt}
        emiFrequency={emiFrequency}
        installmentCount={installmentCount}
        totalTenureMonths={totalTenureMonths}
        emiPerInstallmentAmt={emiPerInstallmentAmt}
        form={form}
        landSourcing={landSourcing}
        selectedPremiumHeads={selectedPremiumHeads}
        plotArea={plotArea}
      />
    </div>
  );
}
