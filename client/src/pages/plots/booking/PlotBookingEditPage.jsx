import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Sparkles,
  Search,
  Plus,
  Edit3,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Award,
  Users,
  Info,
} from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import Button from '../../../components/ui/Button';
import { DateInput } from '../../../components/ui/DateInput';
import { toast } from '../../../utils/toast';
import { BookingSummarySidebar } from './components/BookingSummarySidebar';
import { LandAcquisitionSourcingSection } from './components/LandAcquisitionSourcingSection';

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
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [rateConfig, setRateConfig] = useState(null);
  const [availableLandSources, setAvailableLandSources] = useState([]);

  // Customer search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Plot selection & Premium Heads (PLC)
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedPremiumHeads, setSelectedPremiumHeads] = useState([]);

  // Land stock sourcing allocations
  const [landSourcing, setLandSourcing] = useState([]);

  // Discount & Govt Rate settings
  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', or 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [govtRate, setGovtRate] = useState('100');

  // Dynamic rates, Downpayment & Scheme Plan mode
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
    planName: '',
    bookingDate: new Date().toISOString().split('T')[0],
    tenureMonths: 1,
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
    promoterCommissionPercent: 5.0,
    developerCommissionPercent: 1.0,
    bpCommissionPercent: 1.0,
    branchCommissionPercent: 0,
    rdMaturityPercent: 0,
    fdMaturityPercent: 0,
    annualInterestRate: 0,
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
      const [bookingRes, seriesRes, plotsRes, ratesRes, landSourcesRes, projectsRes] = await Promise.all([
        api.get(`/plots/bookings/${id}`),
        api.get('/plots/series'),
        api.get('/plots?limit=5000&unhiddenOnly=true'),
        api.get('/plots/rate-config').catch(() => ({ data: { data: null } })),
        api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } })),
        api.get('/plots/projects?unhiddenOnly=true').catch(() => ({ data: { data: [] } })),
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
      const projectsData = projectsRes.data?.data || projectsRes.data || [];
      const addBookingProjects = projectsData.filter(
        (p) => Boolean(p.showInAddBooking) || String(p._id) === String(b.projectId?._id || b.projectId)
      );

      setSeriesList(seriesData);
      setPlots(plotsData);
      setRateConfig(configData);
      setAvailableLandSources(landSourcesData);
      setProjects(addBookingProjects);

      // Populate customer (preserve populated sponsor from booking if customer.sponsorId is unpopulated)
      const cust = b.customerId;
      if (cust) {
        const resolvedCust = typeof cust === 'object'
          ? {
            ...cust,
            sponsorId: cust.sponsorId && typeof cust.sponsorId === 'object'
              ? cust.sponsorId
              : (b.sponsorId && typeof b.sponsorId === 'object' ? b.sponsorId : cust.sponsorId),
          }
          : { _id: cust, name: b.customerName, sponsorId: b.sponsorId };
        setSelectedCustomer(resolvedCust);
        setSearchQuery(resolvedCust.name || '');
      }

      // Populate plot & project
      const plotObj = plotsData.find((p) => p._id === (b.plotId?._id || b.plotId)) || b.plotId;
      const initialProjId = b.projectId?._id || b.projectId || plotObj?.projectId?._id || plotObj?.projectId || '';
      setSelectedProjectId(initialProjId ? String(initialProjId) : '');

      const resolvedPlot = plotObj ? {
        ...plotObj,
        projectId: initialProjId,
        projectName: b.projectName || plotObj.projectName || '',
      } : null;
      setSelectedPlot(resolvedPlot);

      // Populate Premium Heads (respect previously applied/waived heads if recorded)
      const appliedHeadNames = Array.isArray(b.appliedPremiumHeads)
        ? b.appliedPremiumHeads.map((h) => h.name)
        : null;
      const heads = [];
      if (Array.isArray(plotObj?.premiumHeads) && plotObj.premiumHeads.length > 0) {
        plotObj.premiumHeads.forEach((h) => {
          const isActive = appliedHeadNames ? appliedHeadNames.includes(h.name) : true;
          heads.push({ name: h.name, extraPercent: Number(h.extraPercent) || 0, active: isActive });
        });
      } else if (plotObj?.plotType === 'CORNER') {
        const isActive = appliedHeadNames ? appliedHeadNames.includes('Corner Plot') : true;
        heads.push({ name: 'Corner Plot', extraPercent: configData?.cornerExtraPercent || 20, active: isActive });
      }
      setSelectedPremiumHeads(heads);

      // Populate rates & scheme mode
      const isOneTimeScheme = b.scheme === 'FULL_PAYMENT';
      setPaymentPlanMode(isOneTimeScheme ? 'ONE_TIME' : 'EMI');

      const initialBaseRate = b.basePlotRate || b.customSqFtRate || 1000;
      setCustomSqFtRate(initialBaseRate);
      setGovtRate(b.govtRate ? String(b.govtRate) : '100');

      // Populate discount
      setDiscountType(b.discountType || 'RUPEE');
      setDiscountVal(b.discountValue ? String(b.discountValue) : b.discount ? String(b.discount) : '');

      // Populate Downpayment Mode & Value
      if (isOneTimeScheme) {
        setDpType('PERCENT');
        setDpVal(100);
      } else {
        setDpType('SQFT_RATE');
        const resolvedDpRate = b.downpaymentRate || b.customDownpaymentRate || 500;
        setDpVal(resolvedDpRate);
      }

      // Populate EMI Frequency & Installments
      const freq = b.emiFrequency || 'MONTHLY';
      setEmiFrequency(freq);
      const freqMultiplier = freq === 'QUARTERLY' ? 3 : freq === 'HALF_YEARLY' ? 6 : freq === 'YEARLY' ? 12 : 1;
      const instCount = b.installmentCount || (b.tenureMonths ? Math.round(b.tenureMonths / freqMultiplier) : 8);
      setInstallmentCount(instCount);

      // Populate land sourcing (normalize populated agreementId object -> string ID)
      setLandSourcing(
        Array.isArray(b.landSourcing)
          ? b.landSourcing.map((s) => {
              const agrObj = s.agreementId && typeof s.agreementId === 'object' ? s.agreementId : null;
              return {
                ...JSON.parse(JSON.stringify(s)),
                agreementId: agrObj ? String(agrObj._id || '') : String(s.agreementId || ''),
                agreementNumber: s.agreementNumber || agrObj?.agreementNumber || '',
                mauja: s.mauja || agrObj?.mauja || '',
                thanaNumber: s.thanaNumber || agrObj?.thanaNumber || '',
                khataNumber: s.khataNumber || agrObj?.khataNumber || '',
                khesraNumber: s.khesraNumber || agrObj?.khesraNumber || '',
              };
            })
          : []
      );

      // Populate form fields
      setForm({
        customerId: cust?._id || cust || '',
        plotId: plotObj?._id || b.plotId || '',
        projectId: initialProjId ? String(initialProjId) : '',
        projectName: b.projectName || plotObj?.projectName || '',
        planName: b.planName || '',
        bookingDate: b.bookingDate
          ? new Date(b.bookingDate).toISOString().split('T')[0]
          : new Date(b.createdAt).toISOString().split('T')[0],
        tenureMonths: b.tenureMonths !== undefined ? Number(b.tenureMonths) : (isOneTimeScheme ? 0 : 8),
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
        promoterCommissionPercent: b.promoterCommissionPercent !== undefined ? Number(b.promoterCommissionPercent) : 5.0,
        developerCommissionPercent: b.developerCommissionPercent !== undefined ? Number(b.developerCommissionPercent) : 1.0,
        bpCommissionPercent: b.bpCommissionPercent !== undefined ? Number(b.bpCommissionPercent) : 1.0,
        branchCommissionPercent: b.branchCommissionPercent !== undefined ? Number(b.branchCommissionPercent) : 0,
        downpaymentPromoterCommissionPercent: b.downpaymentPromoterCommissionPercent !== undefined ? Number(b.downpaymentPromoterCommissionPercent) : undefined,
        emiPromoterCommissionPercent: b.emiPromoterCommissionPercent !== undefined ? Number(b.emiPromoterCommissionPercent) : undefined,
        downpaymentBpCommissionPercent: b.downpaymentBpCommissionPercent !== undefined ? Number(b.downpaymentBpCommissionPercent) : undefined,
        emiBpCommissionPercent: b.emiBpCommissionPercent !== undefined ? Number(b.emiBpCommissionPercent) : undefined,
        downpaymentBranchCommissionPercent: b.downpaymentBranchCommissionPercent !== undefined ? Number(b.downpaymentBranchCommissionPercent) : undefined,
        emiBranchCommissionPercent: b.emiBranchCommissionPercent !== undefined ? Number(b.emiBranchCommissionPercent) : undefined,
        rdMaturityPercent: b.rdMaturityPercent !== undefined ? Number(b.rdMaturityPercent) : 0,
        fdMaturityPercent: b.fdMaturityPercent !== undefined ? Number(b.fdMaturityPercent) : 0,
        annualInterestRate: b.annualInterestRate !== undefined ? Number(b.annualInterestRate) : 0,
      });
    } catch (err) {
      console.error('Error loading booking data for editing:', err);
      toast.error('Failed to load booking details');
      navigate('/dashboard/plots/booking');
    } finally {
      setLoading(false);
    }
  };

  // Search customers dynamically or fetch available
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    if (
      selectedCustomer &&
      (searchQuery.trim().toLowerCase() === selectedCustomer.name?.trim().toLowerCase() ||
        searchQuery.trim() === (selectedCustomer.customerCode || selectedCustomer.customerId || ''))
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingCustomers(true);
      const trimmed = searchQuery.trim();
      const params = { limit: 15 };
      if (trimmed.length > 0) {
        params.search = trimmed;
      }

      api
        .get('/plots/customers', { params })
        .then((res) => {
          const raw = res.data?.data ?? res.data?.customers ?? res.data ?? [];
          const list = Array.isArray(raw) ? raw : (raw?.customers || []);
          setSearchResults(list);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearchingCustomers(false));
    }, searchQuery ? 250 : 0);

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

    if (p._id !== (bookingData?.plotId?._id || bookingData?.plotId)) {
      if (p.status === 'BOOKED' || p.status === 'REGISTERED' || p.status === 'SOLD') {
        toast.error(`Plot #${p.plotNumber} is already ${p.status.toLowerCase()}`);
        return;
      }
    }

    const s = seriesList.find((series) => series._id === (p.seriesId?._id || p.seriesId));
    const finalProjectId = p.projectId?._id || p.projectId || s?.projectId?._id || s?.projectId || selectedProjectId || '';
    const finalProjectName = p.projectName || s?.projectName || projects.find((prj) => String(prj._id) === String(finalProjectId))?.name || '';

    setSelectedPlot({
      ...p,
      projectId: finalProjectId,
      projectName: finalProjectName,
    });
    setForm((f) => ({
      ...f,
      plotId: p._id,
      projectId: finalProjectId,
      projectName: finalProjectName,
    }));

    // Initialize premium heads
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

  // Project Filter Change Handler
  const handleProjectFilterChange = (projId) => {
    setSelectedProjectId(projId);
    if (selectedPlot && projId) {
      const plotProjId = selectedPlot.projectId?._id || selectedPlot.projectId;
      const s = seriesList.find((series) => series._id === (selectedPlot.seriesId?._id || selectedPlot.seriesId));
      const resolvedPlotProj = plotProjId || s?.projectId?._id || s?.projectId;
      if (resolvedPlotProj && String(resolvedPlotProj) !== String(projId)) {
        setSelectedPlot(null);
        setForm((f) => ({
          ...f,
          plotId: '',
          projectId: projId,
          projectName: projects.find((prj) => String(prj._id) === String(projId))?.name || '',
        }));
      }
    } else if (projId) {
      setForm((f) => ({
        ...f,
        projectId: projId,
        projectName: projects.find((prj) => String(prj._id) === String(projId))?.name || '',
      }));
    }
  };

  const togglePremiumHead = (index) => {
    setSelectedPremiumHeads((prev) =>
      prev.map((head, i) => (i === index ? { ...head, active: !head.active } : head))
    );
  };

  // Scheme Slabs resolution
  const schemeSlabs = useMemo(() => {
    return rateConfig?.schemeSlabs || [];
  }, [rateConfig]);

  const availableSchemeSlabs = useMemo(() => {
    if (!schemeSlabs || schemeSlabs.length === 0) return [];
    const filtered = schemeSlabs.filter(
      (s) => Boolean(s.showInAddBooking) || (form.planName && s.planName === form.planName)
    );
    return filtered.length > 0 ? filtered : schemeSlabs;
  }, [schemeSlabs, form.planName]);

  // Helper to generate a consistent, unique identifier for each scheme slab
  const getSlabValue = (s) => ((s?.planName && s.planName.trim()) ? s.planName.trim() : `slab-${s?.tenureMonths}`);

  const currentSchemeSlab = useMemo(() => {
    if (!availableSchemeSlabs || availableSchemeSlabs.length === 0) return null;
    if (form.planName) {
      const match = availableSchemeSlabs.find(
        (s) => s.planName === form.planName || getSlabValue(s) === form.planName || `A-${s.tenureMonths}` === form.planName
      );
      if (match) return match;
    }
    return availableSchemeSlabs.find((s) => Number(s.tenureMonths) === Number(form.tenureMonths)) || null;
  }, [availableSchemeSlabs, form.planName, form.tenureMonths]);

  // Derived current dropdown selected value that always matches an <option> exactly
  const currentSelectValue = useMemo(() => {
    if (form.planName) {
      const match = availableSchemeSlabs.find(
        (s) => s.planName === form.planName || getSlabValue(s) === form.planName || `A-${s.tenureMonths}` === form.planName
      );
      if (match) return getSlabValue(match);
    }
    if (currentSchemeSlab) {
      return getSlabValue(currentSchemeSlab);
    }
    return '';
  }, [form.planName, currentSchemeSlab, availableSchemeSlabs]);

  // Auto-sync form.planName if a scheme slab is active but form.planName is unset
  useEffect(() => {
    if (currentSchemeSlab && !form.planName) {
      const canonicalName = getSlabValue(currentSchemeSlab);
      setForm((f) => ({
        ...f,
        planName: canonicalName,
      }));
    }
  }, [currentSchemeSlab, form.planName, setForm]);

  // Handler when selecting a plan from Scheme Slabs
  const handleSelectPlan = (selectedVal) => {
    if (!selectedVal) {
      setForm((f) => ({
        ...f,
        planName: '',
      }));
      return;
    }
    const matched = availableSchemeSlabs.find(
      (s) => getSlabValue(s) === selectedVal || s.planName === selectedVal || String(s.tenureMonths) === selectedVal
    );
    if (matched) {
      const dpBaPct = Number(matched.fdPromoterCommissionPercent ?? 5.0);
      const emiBaPct = Number(matched.rdPromoterCommissionPercent ?? 4.0);
      const dpBpPct = Number(matched.bpFdCommissionPercent ?? 1.0);
      const emiBpPct = Number(matched.bpRdCommissionPercent ?? 1.0);
      const dpBranchPct = Number(matched.branchFdCommissionPercent ?? 0.5);
      const emiBranchPct = Number(matched.branchRdCommissionPercent ?? 0.5);

      const isOneTimeMode = paymentPlanMode === 'ONE_TIME';
      const baPct = isOneTimeMode ? dpBaPct : emiBaPct;
      const bpPct = isOneTimeMode ? dpBpPct : emiBpPct;
      const branchPct = isOneTimeMode ? dpBranchPct : emiBranchPct;

      const canonicalName = getSlabValue(matched);

      setForm((f) => ({
        ...f,
        planName: canonicalName,
        tenureMonths: Number(matched.tenureMonths),
        promoterCommissionPercent: baPct,
        developerCommissionPercent: bpPct,
        bpCommissionPercent: bpPct,
        branchCommissionPercent: branchPct,
        downpaymentPromoterCommissionPercent: dpBaPct,
        emiPromoterCommissionPercent: emiBaPct,
        downpaymentBpCommissionPercent: dpBpPct,
        emiBpCommissionPercent: emiBpPct,
        downpaymentBranchCommissionPercent: dpBranchPct,
        emiBranchCommissionPercent: emiBranchPct,
        rdMaturityPercent: Number(matched.rdMaturityPercent || 0),
        fdMaturityPercent: Number(matched.fdMaturityPercent || 0),
        annualInterestRate: Number(matched.annualInterestRate ?? 10.5),
      }));

      if (Number(matched.tenureMonths) > 0) {
        setInstallmentCount(Number(matched.tenureMonths));
      }
    }
  };

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

  const baseCalculatedPlotValue = Math.round(plotArea * effectiveSqFtRate);

  const freqMultiplier = useMemo(() => {
    switch (emiFrequency) {
      case 'QUARTERLY': return 3;
      case 'HALF_YEARLY': return 6;
      case 'YEARLY': return 12;
      default: return 1;
    }
  }, [emiFrequency]);

  const totalTenureMonths = paymentPlanMode === 'ONE_TIME' ? 0 : (Number(installmentCount) || 1) * freqMultiplier;

  const emiTenureAdjustment = useMemo(() => {
    if (!rateConfig?.emiTenureAdjustments?.length) {
      return { percent: 0, action: 'NONE', amount: 0 };
    }
    const matched = rateConfig.emiTenureAdjustments.find((s) => Number(s.tenureMonths) === Number(totalTenureMonths));
    if (!matched || !Number(matched.percentage)) {
      return { percent: 0, action: 'NONE', amount: 0 };
    }
    const percent = Number(matched.percentage) || 0;
    const action = matched.action === 'DEDUCT' ? 'DEDUCT' : 'ADD';
    const amount = Math.round((baseCalculatedPlotValue * percent) / 100);
    return { percent, action, amount };
  }, [totalTenureMonths, rateConfig?.emiTenureAdjustments, baseCalculatedPlotValue]);

  const calculatedPlotValue = useMemo(() => {
    if (emiTenureAdjustment.action === 'ADD') {
      return baseCalculatedPlotValue + emiTenureAdjustment.amount;
    }
    if (emiTenureAdjustment.action === 'DEDUCT') {
      return Math.max(0, baseCalculatedPlotValue - emiTenureAdjustment.amount);
    }
    return baseCalculatedPlotValue;
  }, [baseCalculatedPlotValue, emiTenureAdjustment]);

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
    if (paymentPlanMode === 'ONE_TIME') {
      return netContractValue;
    }
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
  }, [dpVal, dpType, netContractValue, plotArea, selectedPlot, paymentPlanMode]);

  const customDpRate = useMemo(() => {
    if (plotArea <= 0) return 0;
    return Math.round((downpaymentAmt / plotArea) * 100) / 100;
  }, [downpaymentAmt, plotArea]);

  const emiPrincipalAmt = Math.max(0, netContractValue - downpaymentAmt);
  const isOneTime = paymentPlanMode === 'ONE_TIME' || emiPrincipalAmt === 0;

  const emiPerInstallmentAmt = useMemo(() => {
    if (isOneTime || !installmentCount || Number(installmentCount) <= 0) return 0;
    return Math.round(emiPrincipalAmt / Number(installmentCount));
  }, [isOneTime, installmentCount, emiPrincipalAmt]);

  const emiRatePerSqFt = useMemo(() => {
    if (isOneTime || plotArea <= 0) return 0;
    return Math.round((emiPrincipalAmt / plotArea) * 100) / 100;
  }, [isOneTime, plotArea, emiPrincipalAmt]);

  // Dynamic Due Date Helper
  const getDynamicDueHelper = (bookingDateStr, daysVal) => {
    const d = bookingDateStr ? new Date(bookingDateStr) : new Date();
    d.setDate(d.getDate() + Number(daysVal || 90));
    return `Payment due on or before ${d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} (${daysVal || 90} days).`;
  };

  // Land stock validation
  const totalAllocatedArea = useMemo(() => {
    return landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  }, [landSourcing]);

  const isLandStockValid = useMemo(() => {
    return (
      landSourcing.length > 0 &&
      landSourcing.every((s) => Boolean(s.agreementId) && Number(s.allocatedSqFt) > 0) &&
      Math.abs(totalAllocatedArea - plotArea) <= 0.5
    );
  }, [landSourcing, totalAllocatedArea, plotArea]);

  // Filter land sources strictly by selected project (matching StepTermsAndPayment)
  const allLandSources = useMemo(() => {
    if (!form.projectId) return availableLandSources || [];
    return (availableLandSources || []).filter((src) => {
      const pId = src.projectId?._id || src.projectId;
      return pId && String(pId) === String(form.projectId);
    });
  }, [form.projectId, availableLandSources]);

  // Form validity & human-readable disabled reasons
  const disabledReasons = useMemo(() => {
    const reasons = [];
    if (!selectedCustomer) reasons.push('Select a customer');
    if (!selectedPlot) reasons.push('Select a plot');
    if (!form.bookingDate) reasons.push('Booking Date is required');
    if (!(Number(customSqFtRate) > 0)) reasons.push('Plot Selling Rate must be greater than ₹0');
    if (!(Number(downpaymentAmt) > 0)) reasons.push('Downpayment Amount must be greater than ₹0');
    if (!isLandStockValid) reasons.push(`Allocated Land Stock (${totalAllocatedArea} Sq.Ft.) must match Plot Area (${plotArea} Sq.Ft.)`);
    if (!form.reason || !form.reason.trim()) reasons.push('Enter Edit Reason / Admin Narration');
    return reasons;
  }, [selectedCustomer, selectedPlot, form.bookingDate, customSqFtRate, downpaymentAmt, isLandStockValid, totalAllocatedArea, plotArea, form.reason]);

  const isFormValid = disabledReasons.length === 0;

  // Submission handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (!selectedPlot) {
      toast.error('Please choose an available plot');
      return;
    }
    if (!form.reason || !form.reason.trim()) {
      toast.error('Please provide an edit reason / admin narration for audit history');
      return;
    }
    if (!isLandStockValid) {
      toast.error(
        `Total allocated land stock (${totalAllocatedArea} Sq.Ft.) must match plot area (${plotArea} Sq.Ft.)`
      );
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        customerId: selectedCustomer._id,
        plotId: selectedPlot._id,
        projectId: form.projectId || undefined,
        projectName: form.projectName || '',
        planName: form.planName || '',
        bookingType: form.bookingType || 'BOOKING',
        bookingDate: form.bookingDate,
        scheme: paymentPlanMode === 'ONE_TIME' ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT',
        tenureMonths: paymentPlanMode === 'ONE_TIME' ? 0 : totalTenureMonths,
        emiFrequency: emiFrequency,
        installmentCount: paymentPlanMode === 'ONE_TIME' ? 0 : Number(installmentCount || 1),
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

        // Commissions & Returns
        promoterCommissionPercent: Number(form.promoterCommissionPercent) || 0,
        developerCommissionPercent: Number(form.developerCommissionPercent || form.bpCommissionPercent) || 0,
        bpCommissionPercent: Number(form.bpCommissionPercent) || 0,
        branchCommissionPercent: Number(form.branchCommissionPercent) || 0,
        downpaymentPromoterCommissionPercent: form.downpaymentPromoterCommissionPercent !== undefined ? Number(form.downpaymentPromoterCommissionPercent) : undefined,
        emiPromoterCommissionPercent: form.emiPromoterCommissionPercent !== undefined ? Number(form.emiPromoterCommissionPercent) : undefined,
        downpaymentBpCommissionPercent: form.downpaymentBpCommissionPercent !== undefined ? Number(form.downpaymentBpCommissionPercent) : undefined,
        emiBpCommissionPercent: form.emiBpCommissionPercent !== undefined ? Number(form.emiBpCommissionPercent) : undefined,
        downpaymentBranchCommissionPercent: form.downpaymentBranchCommissionPercent !== undefined ? Number(form.downpaymentBranchCommissionPercent) : undefined,
        emiBranchCommissionPercent: form.emiBranchCommissionPercent !== undefined ? Number(form.emiBranchCommissionPercent) : undefined,
        rdMaturityPercent: Number(form.rdMaturityPercent) || 0,
        fdMaturityPercent: Number(form.fdMaturityPercent) || 0,
        annualInterestRate: Number(form.annualInterestRate) || 0,
        emiTenureAdjustmentPercent: emiTenureAdjustment.percent,
        emiTenureAdjustmentAction: emiTenureAdjustment.action,
        emiTenureAdjustmentAmount: emiTenureAdjustment.amount,
        appliedPremiumHeads: selectedPremiumHeads
          .filter((h) => h.active)
          .map((h) => ({ name: h.name, extraPercent: h.extraPercent })),

        reason: (form.reason || '').trim(),
        adminNarration: (form.reason || '').trim(),
      };

      await api.put(`/plots/bookings/${id}`, payload);
      toast.success('Plot booking updated successfully!');
      navigate('/dashboard/plots/booking');
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

  // Filter series based on selected project (if selected)
  const filteredSeries = selectedProjectId
    ? seriesList.filter((s) => {
      const pId = s.projectId?._id || s.projectId;
      return pId && String(pId) === String(selectedProjectId);
    })
    : seriesList;

  const currentProject = projects.find((p) => String(p._id) === String(selectedProjectId));

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
              Modify customer, plot, project, dynamic rates, payment terms, scheme plans, commissions, and land stock allocations.
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
            title={!isFormValid ? disabledReasons.join(' • ') : 'Save Booking Changes'}
          >
            Save Booking Changes
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Sections on Left + Summary Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Single-Page Full Sections */}
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
                <Plus size={14} /> Register New Customer
              </a>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Search & Change Customer</label>
                {isSearchingCustomers && (
                  <span className="text-[11px] text-teal-600 font-semibold animate-pulse">Loading customers...</span>
                )}
              </div>
              <div className="relative">
                <input
                  className={`${inputCls} pl-10 pr-10`}
                  placeholder="Search by name, customer ID, or mobile number..."
                  value={searchQuery}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onClick={() => setShowCustomerDropdown(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowCustomerDropdown(false);
                    }}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showCustomerDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((cust) => (
                    <button
                      key={cust._id}
                      type="button"
                      onClick={() => {
                        selectCustomer(cust);
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-teal-50/70 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-800 group-hover:text-teal-900">{cust.name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          ID: {cust.customerCode || cust.customerId || 'N/A'} | Mob: {cust.mobile || '-'}
                        </div>
                      </div>
                      <span className="text-xs text-teal-700 font-semibold opacity-0 group-hover:opacity-100 transition">
                        Select →
                      </span>
                    </button>
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
                    <span className="text-slate-400 block text-[10px] uppercase">Sponsor</span>
                    {(() => {
                      const sp =
                        selectedCustomer?.sponsorId && typeof selectedCustomer.sponsorId === 'object'
                          ? selectedCustomer.sponsorId
                          : bookingData?.sponsorId && typeof bookingData.sponsorId === 'object'
                            ? bookingData.sponsorId
                            : null;
                      if (!sp?.name) {
                        return <span className="font-semibold text-slate-800 block">Direct (Company)</span>;
                      }
                      const spCode = sp.sponsorCode || sp.customerCode || sp.customerId || '';
                      return (
                        <div>
                          <span className="font-semibold text-slate-800 block">{sp.name}</span>
                          {spCode && (
                            <span className="text-[11px] text-teal-700 font-mono font-bold block">
                              {spCode}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Choose Plot & Project Filter */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <h3 className="text-base font-bold text-slate-800">Choose Plot & Project</h3>
                {selectedPlot && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Selected: Plot #{selectedPlot.plotNumber} ({selectedPlot.plotSize} Sq.Ft.) {selectedPlot.projectName ? `| ${selectedPlot.projectName}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Project Filter Selector */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Project / प्रोजेक्ट
                    </h4>
                    {selectedProjectId && currentProject && (
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Filter plots by township / project site</p>
                </div>
              </div>

              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
                className="h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs cursor-pointer min-w-[220px]"
              >
                <option value="">-- All Projects / Sites --</option>
                {projects.map((prj) => (
                  <option key={prj._id} value={prj._id}>
                    {prj.name}
                  </option>
                ))}
              </select>
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
              {filteredSeries.map((s) => {
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
                                  className={`text-[8px] px-1 rounded-sm mt-0.5 font-bold uppercase ${isSelected ? 'bg-teal-800 text-teal-100' : 'bg-amber-100 text-amber-800'
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
                      <p className="text-xs text-slate-400 italic">No plots found in this series.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Contract Terms, Dynamic Rates, Scheme Plans & Commissions */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <span>Contract Terms, Dynamic Rates & Scheme Plans</span>
              </h3>
            </div>

            {/* Scheme Plan Selection */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Award size={15} className="text-teal-700" />
                  Scheme Plan *
                </label>
                {currentSchemeSlab && (
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-100/90 border border-teal-300 px-2.5 py-0.5 rounded-full">
                    {Number(currentSchemeSlab.rdMaturityPercent) === 0 && Number(currentSchemeSlab.fdMaturityPercent) === 0
                      ? 'Actual Plot Sale (0% Return)'
                      : 'Buyback Plan'}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <select
                  className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-semibold outline-none shadow-2xs cursor-pointer ${!currentSelectValue
                    ? 'border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-500'
                    : 'border-teal-300 text-teal-950 focus:ring-2 focus:ring-teal-600'
                    }`}
                  value={currentSelectValue || ''}
                  onChange={(e) => handleSelectPlan(e.target.value)}
                >
                  <option value="">-- Choose Scheme Plan (Optional / Pre-sets Rates & Slabs) --</option>
                  {availableSchemeSlabs.map((s, idx) => {
                    const label = `${s.planName ? `${s.planName} — ` : ''}${s.tenureMonths} Months`;
                    return (
                      <option key={idx} value={getSlabValue(s)}>
                        {label}
                      </option>
                    );
                  })}
                </select>


              </div>
            </div>

            {/* Payment Plan Scheme Selector: One Time vs EMI Plan */}
            <div className="p-4 bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-teal-50/70 border border-teal-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Calculator size={15} className="text-teal-700" />
                  Payment Plan Scheme *
                </label>
                <span className="text-[10px] text-teal-800 font-bold bg-teal-100/90 border border-teal-300 px-2.5 py-0.5 rounded-full">
                  {paymentPlanMode === 'ONE_TIME' ? 'Full 100% Payment' : 'Installments Schedule'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: One Time */}
                <div
                  onClick={() => {
                    setPaymentPlanMode('ONE_TIME');
                    setDpType('PERCENT');
                    setDpVal(100);
                    if (currentSchemeSlab) {
                      setForm((f) => ({
                        ...f,
                        promoterCommissionPercent: Number(currentSchemeSlab.fdPromoterCommissionPercent ?? 5.0),
                        developerCommissionPercent: Number(currentSchemeSlab.bpFdCommissionPercent ?? 1.0),
                        bpCommissionPercent: Number(currentSchemeSlab.bpFdCommissionPercent ?? 1.0),
                        branchCommissionPercent: Number(currentSchemeSlab.branchFdCommissionPercent ?? 0.5),
                        downpaymentPromoterCommissionPercent: Number(currentSchemeSlab.fdPromoterCommissionPercent ?? 5.0),
                        emiPromoterCommissionPercent: Number(currentSchemeSlab.rdPromoterCommissionPercent ?? 4.0),
                        downpaymentBpCommissionPercent: Number(currentSchemeSlab.bpFdCommissionPercent ?? 1.0),
                        emiBpCommissionPercent: Number(currentSchemeSlab.bpRdCommissionPercent ?? 1.0),
                        downpaymentBranchCommissionPercent: Number(currentSchemeSlab.branchFdCommissionPercent ?? 0.5),
                        emiBranchCommissionPercent: Number(currentSchemeSlab.branchRdCommissionPercent ?? 0.5),
                      }));
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${paymentPlanMode === 'ONE_TIME'
                    ? 'bg-white border-teal-700 shadow-sm ring-1 ring-teal-700/20'
                    : 'bg-white/50 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${paymentPlanMode === 'ONE_TIME' ? 'border-teal-700 bg-teal-700' : 'border-slate-300'}`}>
                        {paymentPlanMode === 'ONE_TIME' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      One Time (Full Payment)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      100% Upfront
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                    Full payment within stipulated time limit (Default: 90 days). Zero monthly installment dues.
                  </p>
                </div>

                {/* Option B: Installments */}
                <div
                  onClick={() => {
                    setPaymentPlanMode('EMI');
                    setDpType('SQFT_RATE');
                    setDpVal(500);
                    if (currentSchemeSlab) {
                      setForm((f) => ({
                        ...f,
                        promoterCommissionPercent: Number(currentSchemeSlab.rdPromoterCommissionPercent ?? 4.0),
                        developerCommissionPercent: Number(currentSchemeSlab.bpRdCommissionPercent ?? 1.0),
                        bpCommissionPercent: Number(currentSchemeSlab.bpRdCommissionPercent ?? 1.0),
                        branchCommissionPercent: Number(currentSchemeSlab.branchRdCommissionPercent ?? 0.5),
                        downpaymentPromoterCommissionPercent: Number(currentSchemeSlab.fdPromoterCommissionPercent ?? 5.0),
                        emiPromoterCommissionPercent: Number(currentSchemeSlab.rdPromoterCommissionPercent ?? 4.0),
                        downpaymentBpCommissionPercent: Number(currentSchemeSlab.bpFdCommissionPercent ?? 1.0),
                        emiBpCommissionPercent: Number(currentSchemeSlab.bpRdCommissionPercent ?? 1.0),
                        downpaymentBranchCommissionPercent: Number(currentSchemeSlab.branchFdCommissionPercent ?? 0.5),
                        emiBranchCommissionPercent: Number(currentSchemeSlab.branchRdCommissionPercent ?? 0.5),
                      }));
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${paymentPlanMode === 'EMI'
                    ? 'bg-white border-teal-700 shadow-sm ring-1 ring-teal-700/20'
                    : 'bg-white/50 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${paymentPlanMode === 'EMI' ? 'border-teal-700 bg-teal-700' : 'border-slate-300'}`}>
                        {paymentPlanMode === 'EMI' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      Installment (EMI Plan)
                    </span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      DP + EMIs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                    Flexible initial downpayment + periodic installment EMIs across customized tenure.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Booking Date */}
              <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <DateInput
                  label="Booking Date *"
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
                    Plot Selling Rate (Base) *
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
                  {totalPremiumExtra > 0 ? (
                    <span className="text-amber-700 font-semibold">
                      Effective: ₹{effectiveSqFtRate}/sqft (+{totalPremiumExtra}% premium)
                    </span>
                  ) : (
                    `Gross: ₹${calculatedPlotValue.toLocaleString('en-IN')} (${plotArea} sqft @ ₹${effectiveSqFtRate}/sqft)`
                  )}
                </span>
              </div>

              {/* 2b. Attached Plot Premium Charges (Corner / Park Facing / Wide Road / Commercial) */}
              {selectedPremiumHeads && selectedPremiumHeads.length > 0 && (
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/90 rounded-2xl shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-amber-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs">
                        <Sparkles size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                          Plot Premium Features & Extra Charges Attached
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          Plot #{selectedPlot?.plotNumber} has special premium attributes. Check/uncheck to apply or waive extra sqft charges.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Total Applied Extra: +{totalPremiumExtra}% (+₹{Math.round((Number(customSqFtRate) || 1000) * (totalPremiumExtra / 100))}/sqft)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {selectedPremiumHeads.map((head, idx) => {
                      const headExtraPerSqFt = Math.round((Number(customSqFtRate) || 1000) * (head.extraPercent / 100));
                      const headTotalAmt = Math.round(plotArea * headExtraPerSqFt);

                      return (
                        <label
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${head.active
                            ? 'bg-white border-amber-400 shadow-xs ring-1 ring-amber-400'
                            : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={head.active}
                              onChange={() => togglePremiumHead(idx)}
                              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <span className={`text-xs font-bold block leading-tight ${head.active ? 'text-amber-950' : 'text-slate-600'}`}>
                                {head.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                +{head.extraPercent}% (+₹{headExtraPerSqFt}/sqft)
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-mono font-bold block ${head.active ? 'text-amber-700' : 'text-slate-400'}`}>
                              {head.active ? `+₹${headTotalAmt.toLocaleString('en-IN')}` : 'Waived'}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

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
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${calculatedDiscount > 0
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
                    {paymentPlanMode === 'ONE_TIME' ? 'Full Payment Downpayment (100%) *' : 'Downpayment *'}
                  </label>
                  <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-300">
                    {paymentPlanMode === 'ONE_TIME'
                      ? '100% Full Net Value'
                      : dpType === 'SQFT_RATE'
                        ? `₹${dpVal || 0}/sqft`
                        : dpType === 'PERCENT'
                          ? `${dpVal || 0}%`
                          : `Flat ₹`}
                  </span>
                </div>

                {paymentPlanMode === 'ONE_TIME' ? (
                  <div className="h-11 px-3.5 bg-white border border-teal-300 rounded-xl flex items-center justify-between shadow-2xs">
                    <span className="text-xs font-semibold text-teal-900">Total Contract Value:</span>
                    <span className="text-sm font-bold font-mono text-emerald-900">
                      ₹{downpaymentAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
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
                )}
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

              {/* 7. EMI Frequency & Installments Schedule (when EMI scheme active & remaining balance > 0) */}
              {paymentPlanMode === 'EMI' && emiPrincipalAmt > 0 ? (
                <div className="md:col-span-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calculator size={15} className="text-teal-700" />
                      EMI Frequency & Installments Schedule
                    </label>
                    <div className="flex items-center gap-2">
                      {emiTenureAdjustment && emiTenureAdjustment.amount > 0 && (
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${emiTenureAdjustment.action === 'ADD'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                          {emiTenureAdjustment.action === 'ADD' ? '+' : '-'}{emiTenureAdjustment.percent}% Tenure {emiTenureAdjustment.action === 'ADD' ? 'Markup' : 'Discount'} (₹{emiTenureAdjustment.amount.toLocaleString('en-IN')})
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        Total Tenure: {totalTenureMonths} Months
                      </span>
                    </div>
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
                        placeholder="1"
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
              ) : (
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950 text-sm">One Time Full Payment Selected</p>
                      <p className="text-[11px] text-emerald-800 font-normal">
                        Remaining balance is ₹0. No EMI schedule or installments are required for this contract.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {emiTenureAdjustment && emiTenureAdjustment.amount > 0 && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-mono font-bold">
                        -{emiTenureAdjustment.percent}% Full Payment Discount (₹{emiTenureAdjustment.amount.toLocaleString('en-IN')})
                      </span>
                    )}
                    <span className="px-3 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black font-mono">
                      ₹0 EMI / Month
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Land Acquisition Sourcing (Same cascading Khata -> Khesra -> Agreement component as New Plot Booking) */}
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs flex items-center justify-center font-bold">
                4
              </span>
              <h3 className="text-base font-bold text-slate-800">
                Land Acquisition Sourcing (किसान एग्रीमेंट स्टॉक)
              </h3>
            </div>
            <LandAcquisitionSourcingSection
              landSources={allLandSources}
              landSourcing={landSourcing}
              setLandSourcing={setLandSourcing}
              requiredSqFt={plotArea}
              title="Land Acquisition Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड स्टॉक)"
              subtitle={`Required: Allocate the entire plot area (${plotArea} Sq.Ft.) from active Kisan Agreements or Registry Deeds.`}
            />
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

              {form.paymentMode !== 'cash' && (
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
              )}

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Booking Type</label>
                <select
                  value={form.bookingType}
                  onChange={(e) => setForm({ ...form, bookingType: e.target.value })}
                  className={inputCls}
                >
                  <option value="BOOKING">Official Booking (Booked Plot)</option>
                  <option value="HOLD">Temporary Hold (Reserve with Expiry)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Agreement Number</label>
                <input
                  type="text"
                  value={form.agreementNumber}
                  onChange={(e) => setForm({ ...form, agreementNumber: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. AGR-2026-001"
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
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
            {!isFormValid && disabledReasons.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Required before saving: </span>
                  <span>{disabledReasons.join(' • ')}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
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
                title={!isFormValid ? disabledReasons.join(' • ') : 'Save Booking Changes'}
              >
                Save Booking Changes
              </Button>
            </div>
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
            selectedPremiumHeads={selectedPremiumHeads}
            emiTenureAdjustment={emiTenureAdjustment}
          />
        </div>
      </div>
    </div>
  );
}
