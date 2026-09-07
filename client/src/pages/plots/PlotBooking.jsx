import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../../components/common/PageLoader';
import { Check } from 'lucide-react';

import { StepCustomer } from './bookingWizard/StepCustomer';
import { StepPlot } from './bookingWizard/StepPlot';
import { StepTermsAndPayment } from './bookingWizard/StepTermsAndPayment';
import { BookingSummarySidebar } from './bookingWizard/BookingSummarySidebar';

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const formatIndianDate = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
};

const getDynamicEmiHelper = (bookingDateStr, dpMonthsVal) => {
  if (!bookingDateStr) return 'Time allowed to complete 40% downpayment.';
  const bDate = new Date(bookingDateStr);
  if (isNaN(bDate.getTime())) return 'Time allowed to complete 40% downpayment.';

  const dpMonths = Number(dpMonthsVal) || 1;
  const bFormatted = formatIndianDate(bDate);

  const dpDate = new Date(bDate);
  dpDate.setMonth(dpDate.getMonth() + dpMonths);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dpMonthYear = `${monthNames[dpDate.getMonth()]} ${dpDate.getFullYear()}`;

  const firstEmiDate = new Date(bDate);
  firstEmiDate.setMonth(firstEmiDate.getMonth() + dpMonths + 1);
  firstEmiDate.setDate(1);
  const firstEmiFormatted = formatIndianDate(firstEmiDate);

  return `Time allowed to complete 40% downpayment (${bFormatted} + ${dpMonths} month${dpMonths > 1 ? 's' : ''} = DP ends in ${dpMonthYear}). 1st EMI starts on ${firstEmiFormatted}.`;
};

const getDynamicOneTimeHelper = (bookingDateStr, oneTimeMonthsVal) => {
  if (!bookingDateStr) return 'Time allowed to complete one-time payment.';
  const bDate = new Date(bookingDateStr);
  if (isNaN(bDate.getTime())) return 'Time allowed to complete one-time payment.';

  const otMonths = Number(oneTimeMonthsVal) || 1;
  const targetDate = new Date(bDate);
  targetDate.setMonth(targetDate.getMonth() + otMonths);
  const targetFormatted = formatIndianDate(targetDate);

  return `Full payment due by ${targetFormatted} (${otMonths} month${otMonths > 1 ? 's' : ''} from booking date).`;
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
    tenureMonths: 0,
    scheme: 'FULL_PAYMENT',
    bookingAmount: '',
    paymentMode: 'cash',
    transactionReference: '',
    notes: '',
    bookingType: 'BOOKING',
    holdExpiryDays: '7',
    discount: '',
    bookingDate: getTodayDateString(),
    oneTimeMonths: 1,
    downpaymentMonths: 1,
  });

  const [discountType, setDiscountType] = useState('RUPEE');
  const [discountVal, setDiscountVal] = useState('');
  const [downpaymentBase, setDownpaymentBase] = useState('BEFORE_DISCOUNT');
  const [govtRate, setGovtRate] = useState('100');
  const [availableLandSources, setAvailableLandSources] = useState([]);
  const [landSourcing, setLandSourcing] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [plotsRes, seriesRes, rateRes, sourcesRes] = await Promise.all([
          api.get('/plots?limit=5000'),
          api.get('/plots/series'),
          api.get('/plots/rate-config'),
          api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } })),
        ]);
        setPlots(plotsRes.data.data || []);
        setSeriesList(seriesRes.data.data || []);
        setRateConfig(rateRes.data.data || null);
        setAvailableLandSources(sourcesRes.data.data || []);
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
      api
        .get('/plots/customers', {
          params: {
            search: searchQuery,
            limit: 10,
          },
        })
        .then((res) => {
          setSearchResults(res.data.data?.customers || res.data.customers || res.data.data || []);
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCustomer]);

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setSearchResults([]);
    setForm((f) => ({
      ...f,
      customerId: customer._id,
      sponsorId: customer.sponsorId?._id || customer.sponsorId || '',
    }));
  };

  const handlePlotSelect = (plotId) => {
    const p = plots.find((item) => item._id === plotId);
    setSelectedPlot(p);
    setForm((f) => ({ ...f, plotId: plotId }));

    const autoLandSources = [];
    let remainingToCover = p?.plotSize || p?.areaSqFt || 0;

    for (const src of availableLandSources) {
      if (remainingToCover <= 0) break;
      const allocSqFt = Math.min(remainingToCover, src.availableSqFt);
      if (allocSqFt > 0) {
        autoLandSources.push({
          sourceType: src.sourceType,
          agreementId: src.agreementId,
          agreementNumber: src.agreementNumber,
          deedId: src.deedId || null,
          deedNumber: src.deedNumber || '',
          allocatedSqFt: allocSqFt,
        });
        remainingToCover -= allocSqFt;
      }
    }
    setLandSourcing(autoLandSources);
  };

  const slabs =
    rateConfig?.rateSlabs?.length > 0
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

  const plotArea = selectedPlot?.plotSize || selectedPlot?.areaSqFt || 0;
  const isCorner = selectedPlot?.plotType === 'CORNER';
  const cornerExtra = isCorner ? rateConfig?.cornerExtraPercent || 20 : 0;
  const baseRate = currentSlab.plotRate || rateConfig?.baseSqFtRate || 1000;
  const effectiveRate = baseRate * (1 + cornerExtra / 100);
  const calculatedPlotValue = plotArea > 0 ? Math.round(plotArea * effectiveRate) : 0;

  const calculateDiscountAmount = (type, val) => {
    const num = Number(val) || 0;
    if (num <= 0 || !plotArea) return 0;
    if (type === 'PERCENT') {
      return Math.round((calculatedPlotValue * num) / 100);
    } else if (type === 'SQFT_RATE') {
      return Math.round(plotArea * num);
    }
    return num;
  };

  const calculatedDiscount = calculateDiscountAmount(discountType, discountVal);
  const netContractValue = Math.max(0, calculatedPlotValue - calculatedDiscount);
  const isOneTime = Number(form.tenureMonths) === 0;
  const dpPercent = currentSlab.downpaymentPercent ? currentSlab.downpaymentPercent / 100 : isOneTime ? 1.0 : 0.4;

  let downpaymentAmt = 0;
  let emiPrincipalAmt = 0;

  if (isOneTime) {
    downpaymentAmt = netContractValue;
    emiPrincipalAmt = 0;
  } else {
    downpaymentAmt = Math.round(calculatedPlotValue * dpPercent);
    emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
  }

  const emiMonthlyAmt = !isOneTime && form.tenureMonths > 0 ? Math.round(emiPrincipalAmt / form.tenureMonths) : 0;

  const nextStep = () => {
    if (step === 1 && !form.customerId) {
      return toast.error('Please select or register a plot customer');
    }
    if (step === 2 && !form.plotId) {
      return toast.error('Please select an available plot');
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.plotId) {
      return toast.error('Incomplete form: Customer or Plot missing');
    }

    if (!isOneTime && (!form.downpaymentMonths || Number(form.downpaymentMonths) < 1)) {
      return toast.error('Please specify valid downpayment grace period in months (minimum 1)');
    }

    if (isOneTime && (!form.oneTimeMonths || Number(form.oneTimeMonths) < 1)) {
      return toast.error('Please specify valid one-time payment time limit in months (minimum 1)');
    }

    const totalAllocated = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
    if (Math.abs(totalAllocated - plotArea) > 0.5) {
      return toast.error(
        `Land Acquisition Sourcing mismatch: Total allocated (${totalAllocated} Sq.Ft.) must match plot area (${plotArea} Sq.Ft.)`
      );
    }

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
        landSourcing: landSourcing.filter((s) => Number(s.allocatedSqFt) > 0),
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

  return (
    <div className="p-6 bg-slate-50 min-h-screen select-none max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create Plot Booking</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Step-by-step wizard to register a new plot booking with dynamic tenure rates & 40/60 breakdown.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white border border-slate-200 shadow-2xs p-5 sm:p-6 rounded-2xl w-full">
        <div className="relative flex items-center justify-between w-full">
          {/* Background Track Line */}
          <div className="absolute left-[12%] right-[12%] top-5 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full" />

          {/* Active Filled Progress Line */}
          <div
            className="absolute left-[12%] top-5 -translate-y-1/2 h-1 transition-all duration-500 ease-out z-0 rounded-full bg-teal-700"
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
                  ? 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-md scale-105'
                  : step > 1
                  ? 'bg-emerald-600 text-white shadow-xs cursor-pointer ring-4 ring-emerald-50 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {step > 1 ? <Check className="w-5 h-5 stroke-2" /> : '1'}
            </button>
            <div className="flex flex-col items-center text-center">
              <span
                className={`text-xs font-bold transition-colors ${
                  step === 1 ? 'text-slate-900' : step > 1 ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
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
                  ? 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-md scale-105'
                  : step > 2
                  ? 'bg-emerald-600 text-white shadow-xs cursor-pointer ring-4 ring-emerald-50 hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {step > 2 ? <Check className="w-5 h-5 stroke-2" /> : '2'}
            </button>
            <div className="flex flex-col items-center text-center">
              <span
                className={`text-xs font-bold transition-colors ${
                  step === 2 ? 'text-slate-900' : step > 2 ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                2. Plot Selection
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block max-w-[130px] truncate">
                {selectedPlot ? `Plot #${selectedPlot.plotNumber}` : 'Choose from Series'}
              </span>
            </div>
          </div>

          {/* Step 3 Node */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                step === 3
                  ? 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-md scale-105'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              3
            </div>
            <div className="flex flex-col items-center text-center">
              <span
                className={`text-xs font-bold transition-colors ${step === 3 ? 'text-slate-900' : 'text-slate-400'}`}
              >
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
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-2xs rounded-2xl p-6">
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
            />
          )}
        </div>

        {/* Side Preview/Summary Column (takes 1 column) */}
        <BookingSummarySidebar
          step={step}
          selectedCustomer={selectedCustomer}
          selectedPlot={selectedPlot}
          baseRate={baseRate}
          isCorner={isCorner}
          cornerExtra={cornerExtra}
          effectiveRate={effectiveRate}
          calculatedPlotValue={calculatedPlotValue}
          isOneTime={isOneTime}
          form={form}
          calculatedDiscount={calculatedDiscount}
          netContractValue={netContractValue}
          downpaymentAmt={downpaymentAmt}
          emiMonthlyAmt={emiMonthlyAmt}
        />
      </div>
    </div>
  );
};

export default PlotBooking;
