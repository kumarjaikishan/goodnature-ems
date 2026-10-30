import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import {
  ShoppingCart,
  ArrowLeft,
  User,
  CheckCircle2,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  MapPin,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Info,
  Clock,
  Printer,
  ChevronRight,
  FileCheck,
  AlertCircle,
  Trash2,
  Search,
  X,
  Ruler,
  Calculator,
  Percent,
  Lock,
} from 'lucide-react';
import PageLoader from '../../../components/common/PageLoader';
import { DateInput } from '../../../components/ui/DateInput';

const ProductBookingPage = () => {
  const navigate = useNavigate();
  const { id: editBookingId } = useParams();
  const isEditMode = Boolean(editBookingId);
  const [editBookingDoc, setEditBookingDoc] = useState(null);

  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId');
  const initialCustomerId = searchParams.get('customerId');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Master Data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tenures, setTenures] = useState([]);
  const [allLandSources, setAllLandSources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Customer search & selection
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    projectId: '',
    projectName: '',
    customNorthSouth: '',
    customEastWest: '',
    quantity: 1,
    customUnitPrice: '',
    tenureMonths: 24,
    planName: '',
    selectedPlanKey: '',
    promoterCommissionPercent: undefined,
    developerCommissionPercent: undefined,
    bpCommissionPercent: undefined,
    branchCommissionPercent: undefined,
    rdMaturityPercent: undefined,
    fdMaturityPercent: undefined,
    annualInterestRate: undefined,
    paymentType: 'MONTHLY_INSTALLMENT', // 'MONTHLY_INSTALLMENT' | 'FULL_PAYMENT'
    dpType: 'PERCENT', // 'PERCENT' | 'FLAT' | 'SQFT_RATE'
    dpVal: 0,
    downpaymentDays: 90,
    emiFrequency: 'MONTHLY', // 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
    installmentCount: 24,
    paymentMode: 'cash',
    transactionReference: '',
    bookingDate: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'ACTIVE',
  });

  // Land Sourcing State: Array of multi-agreement rows
  const [landSourcing, setLandSourcing] = useState([]);

  // Fetch all initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchPromises = [
          api.get('/plots/products'),
          api.get('/plots/customers?limit=1000'),
          api.get('/plots/products/tenures'),
          api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } })),
          api.get('/plots/projects').catch(() => ({ data: { data: [] } })),
        ];

        if (editBookingId) {
          fetchPromises.push(api.get(`/plots/product-bookings/${editBookingId}`));
        }

        const [prodRes, custRes, tenureRes, sourcesRes, projectsRes, bookingRes] = await Promise.all(fetchPromises);

        const prodList = prodRes.data?.data?.products || prodRes.data?.data || [];
        const custList = custRes.data?.data?.customers || custRes.data?.data || [];
        const rawTenureList = tenureRes.data?.data?.tenures || tenureRes.data?.data || [];
        // Only show slabs that are NOT marked for Add Booking (showInAddBooking !== true)
        const tenureList = rawTenureList.filter((t) => !t.showInAddBooking);
        const srcList = sourcesRes.data?.data || [];
        const rawProjList = Array.isArray(projectsRes.data?.data)
          ? projectsRes.data.data
          : Array.isArray(projectsRes.data)
          ? projectsRes.data
          : [];
        // Only show projects that are NOT marked for Add Booking (showInAddBooking !== true)
        const projList = rawProjList.filter((p) => !p.showInAddBooking);

        setProducts(prodList);
        setCustomers(custList);
        setTenures(tenureList);
        setAllLandSources(srcList);
        setProjects(projList);

        if (editBookingId && bookingRes?.data?.data) {
          const bData = bookingRes.data.data;
          setEditBookingDoc(bData);

          const editCust = bData.customerId;
          if (editCust) {
            setSelectedCustomer(editCust);
          }

          const matchedPlan = tenureList.find(
            (t) => (bData.planName && t.planName === bData.planName) || Number(t.tenureMonths) === Number(bData.tenureMonths)
          ) || rawTenureList.find(
            (t) => (bData.planName && t.planName === bData.planName) || Number(t.tenureMonths) === Number(bData.tenureMonths)
          );

          const matchedPlanKey = matchedPlan ? (matchedPlan._id || `${matchedPlan.planName || 'plan'}_${matchedPlan.tenureMonths}_${matchedPlan.rdMaturityPercent || 0}`) : '';
          const bFreq = bData.emiFrequency || 'MONTHLY';
          const bMult = bFreq === 'QUARTERLY' ? 3 : bFreq === 'HALF_YEARLY' ? 6 : bFreq === 'YEARLY' ? 12 : 1;

          setForm({
            customerId: editCust?._id || editCust || '',
            productId: bData.productId?._id || bData.productId || '',
            projectId: bData.projectId?._id || bData.projectId || '',
            projectName: bData.projectName || '',
            customNorthSouth: bData.dimensionsSnapshot?.northSouth || bData.dimensionsSnapshot?.north || '',
            customEastWest: bData.dimensionsSnapshot?.eastWest || bData.dimensionsSnapshot?.east || '',
            quantity: bData.quantity || 1,
            customUnitPrice: bData.unitPrice || '',
            tenureMonths: bData.tenureMonths || 24,
            planName: bData.planName || matchedPlan?.planName || '',
            selectedPlanKey: matchedPlanKey,
            promoterCommissionPercent: bData.promoterCommissionPercent,
            developerCommissionPercent: bData.developerCommissionPercent || bData.bpCommissionPercent,
            bpCommissionPercent: bData.bpCommissionPercent,
            branchCommissionPercent: bData.branchCommissionPercent,
            rdMaturityPercent: bData.rdMaturityPercent,
            fdMaturityPercent: bData.fdMaturityPercent,
            annualInterestRate: bData.annualInterestRate,
            paymentType: bData.paymentType || 'MONTHLY_INSTALLMENT',
            dpType: bData.dpType || (Number(bData.downPayment) > 0 ? 'FLAT' : 'PERCENT'),
            dpVal: bData.dpVal !== undefined ? bData.dpVal : (bData.downPayment || 0),
            downpaymentDays: bData.downpaymentDays !== undefined ? bData.downpaymentDays : 90,
            emiFrequency: bFreq,
            installmentCount: bData.installmentCount || Math.max(1, Math.round((bData.tenureMonths || 24) / bMult)),
            paymentMode: bData.collections?.[0]?.paymentMode || 'cash',
            transactionReference: bData.collections?.[0]?.transactionReference || '',
            bookingDate: bData.bookingDate ? new Date(bData.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            remarks: bData.remarks || '',
            status: bData.status || 'ACTIVE',
          });

          if (Array.isArray(bData.landSourcing) && bData.landSourcing.length > 0) {
            setLandSourcing(
              bData.landSourcing.map((s) => ({
                sourceType: s.sourceType || 'AGREEMENT',
                agreementId: s.agreementId?._id || s.agreementId,
                agreementNumber: s.agreementNumber || s.agreementId?.agreementNumber || '',
                parcelId: s.parcelId || null,
                khesraNumber: s.khesraNumber || '',
                mauja: s.mauja || '',
                thanaNumber: s.thanaNumber || '',
                khataNumber: s.khataNumber || '',
                allocatedSqFt: s.allocatedSqFt || 0,
              }))
            );
          } else {
            setLandSourcing([]);
          }
        } else {
          // Pre-select product or customer if in query params (Create Mode)
          const targetProd = prodList.find((p) => p._id === initialProductId) || prodList[0];
          const targetCust = custList.find((c) => c._id === initialCustomerId);
          const firstTenureObj = tenureList[0] || rawTenureList[0];
          const firstTenure = firstTenureObj?.tenureMonths || 24;
          const firstPlanName = firstTenureObj?.planName || '';
          const firstPlanKey = firstTenureObj
            ? (firstTenureObj._id || `${firstTenureObj.planName || 'plan'}_${firstTenureObj.tenureMonths}_${firstTenureObj.rdMaturityPercent || 0}`)
            : '';

          if (targetCust) {
            setSelectedCustomer(targetCust);
          }

          const isFullPaymentInit = form.paymentType === 'FULL_PAYMENT';
          const initialBaPct = isFullPaymentInit
            ? (firstTenureObj?.fdPromoterCommissionPercent ?? 5.0)
            : (firstTenureObj?.rdPromoterCommissionPercent ?? 4.0);
          const initialBpPct = isFullPaymentInit
            ? (firstTenureObj?.bpFdCommissionPercent ?? 1.0)
            : (firstTenureObj?.bpRdCommissionPercent ?? 1.0);
          const initialBranchPct = isFullPaymentInit
            ? (firstTenureObj?.branchFdCommissionPercent ?? 0)
            : (firstTenureObj?.branchRdCommissionPercent ?? 0);

          setForm((prev) => ({
            ...prev,
            productId: targetProd?._id || '',
            projectId: targetProd?.projectId || '',
            projectName: targetProd?.projectName || '',
            customerId: targetCust?._id || '',
            tenureMonths: firstTenure,
            installmentCount: firstTenure,
            dpType: 'PERCENT',
            dpVal: 0,
            downpaymentDays: 90,
            emiFrequency: 'MONTHLY',
            planName: firstPlanName,
            selectedPlanKey: firstPlanKey,
            promoterCommissionPercent: firstTenureObj ? Number(initialBaPct) : undefined,
            developerCommissionPercent: firstTenureObj ? Number(initialBpPct) : undefined,
            bpCommissionPercent: firstTenureObj ? Number(initialBpPct) : undefined,
            branchCommissionPercent: firstTenureObj ? Number(initialBranchPct) : undefined,
            rdMaturityPercent: firstTenureObj ? Number(firstTenureObj.rdMaturityPercent || 0) : undefined,
            fdMaturityPercent: firstTenureObj ? Number(firstTenureObj.fdMaturityPercent || 0) : undefined,
            annualInterestRate: firstTenureObj
              ? Number(
                  (form.paymentType === 'FULL_PAYMENT'
                    ? firstTenureObj.fdAnnualInterestRate
                    : firstTenureObj.rdAnnualInterestRate) ??
                    firstTenureObj.annualInterestRate ??
                    10.5
                )
              : undefined,
            customUnitPrice: targetProd?.unitPrice || '',
          }));

          // Initialize default land sourcing row with target product required area
          const initialQty = 1;
          const initialArea = targetProd?.areaSqFt || (
            Number(targetProd?.dimensions?.north || 1) * Number(targetProd?.dimensions?.east || 1)
          ) || 40;
          const initialReqSqFt = initialQty * initialArea;

          // Do not auto-select agreement/plot on initial load
          setLandSourcing([]);
        }
      } catch (err) {
        console.error('Failed to load product booking master data:', err);
        toast.error('Failed to initialize booking page');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialProductId, initialCustomerId, editBookingId]);

  // Active selected entities
  const selectedProduct = useMemo(() => {
    return products.find((p) => p._id === form.productId) || null;
  }, [products, form.productId]);

  // Derived financial calculations
  const unitRate = form.customUnitPrice !== '' && Number(form.customUnitPrice) > 0
    ? Number(form.customUnitPrice)
    : Number(selectedProduct?.unitPrice || 0);

  const quantityNum = Math.max(1, Number(form.quantity) || 1);
  const totalAmount = Math.round(quantityNum * unitRate * 100) / 100;
  const unitAreaSqFt = selectedProduct?.areaSqFt || (
    Number(selectedProduct?.dimensions?.north || 1) * Number(selectedProduct?.dimensions?.east || 1)
  ) || 1;

  // Custom dimension calculation (North-South x East-West)
  const customNorthSouthNum = Number(form.customNorthSouth) || 0;
  const customEastWestNum = Number(form.customEastWest) || 0;
  const hasCustomDimensions = customNorthSouthNum > 0 && customEastWestNum > 0;
  const customDimensionAreaSqFt = hasCustomDimensions
    ? Math.round(customNorthSouthNum * customEastWestNum * 100) / 100
    : 0;

  const totalRequiredSqFt = hasCustomDimensions
    ? customDimensionAreaSqFt
    : Math.round(quantityNum * unitAreaSqFt * 100) / 100;
  const totalRequiredDismil = Math.round((totalRequiredSqFt / 435.6) * 100) / 100;

  const isFullPayment = form.paymentType === 'FULL_PAYMENT';
  const tenure = Math.max(1, Number(form.tenureMonths) || 24);

  // Downpayment amount calculation
  const downpaymentAmt = useMemo(() => {
    if (isFullPayment) return totalAmount;
    const num = Number(form.dpVal) || 0;
    if (num <= 0) return 0;
    if (form.dpType === 'FLAT') {
      return Math.min(totalAmount, Math.round(num));
    }
    if (form.dpType === 'PERCENT') {
      return Math.min(totalAmount, Math.round((totalAmount * num) / 100));
    }
    // SQFT_RATE
    return Math.min(totalAmount, Math.round((totalRequiredSqFt || 1) * num));
  }, [isFullPayment, totalAmount, form.dpVal, form.dpType, totalRequiredSqFt]);

  const customDpRate = useMemo(() => {
    if (!totalRequiredSqFt || totalRequiredSqFt <= 0) return 0;
    return Math.round((downpaymentAmt / totalRequiredSqFt) * 100) / 100;
  }, [downpaymentAmt, totalRequiredSqFt]);

  const remainingBalance = Math.max(0, totalAmount - downpaymentAmt);

  const freqMultiplier = useMemo(() => {
    switch (form.emiFrequency) {
      case 'QUARTERLY': return 3;
      case 'HALF_YEARLY': return 6;
      case 'YEARLY': return 12;
      default: return 1;
    }
  }, [form.emiFrequency]);

  const totalTenureMonths = isFullPayment
    ? tenure
    : (Number(form.installmentCount) || 1) * freqMultiplier;

  const emiPerInstallmentAmt = useMemo(() => {
    if (isFullPayment || !form.installmentCount || Number(form.installmentCount) <= 0) return 0;
    return Math.round(remainingBalance / Number(form.installmentCount));
  }, [isFullPayment, form.installmentCount, remainingBalance]);

  const monthlyEmi = emiPerInstallmentAmt;

  // Dynamic Due Date Helper (same as PlotBooking Step 3)
  const getDynamicDueHelper = (bookingDateStr, daysVal) => {
    const d = bookingDateStr ? new Date(bookingDateStr) : new Date();
    d.setDate(d.getDate() + Number(daysVal || 90));
    return `Payment due on or before ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${daysVal || 90} days).`;
  };

  // Total allocated area across all land sourcing rows
  const totalAllocatedArea = useMemo(() => {
    return landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  }, [landSourcing]);

  const totalAllocatedDismil = Math.round((totalAllocatedArea / 435.6) * 100) / 100;
  const isAreaMatched = landSourcing.length > 0 &&
    landSourcing.every((s) => s.agreementId && (s.khesraNumber || s.parcelId)) &&
    Math.abs(totalAllocatedArea - totalRequiredSqFt) <= 0.5;

  // Filter land agreements by selected project (must belong to chosen project)
  const availableAgreementsForProject = useMemo(() => {
    if (!form.projectId) return allLandSources;
    return (allLandSources || []).filter((agr) => {
      const pId = agr.projectId?._id || agr.projectId;
      return pId && String(pId) === String(form.projectId);
    });
  }, [allLandSources, form.projectId]);

  // Quantity stepper & updater helper
  const updateQuantityAndSyncArea = (nextQty, customPrd = null, explicitArea = null) => {
    const qty = Math.max(1, Number(nextQty) || 1);
    setForm((prev) => ({ ...prev, quantity: nextQty }));

    // Auto-sync allocated area if only 1 agreement row is selected
    const prd = customPrd || selectedProduct;
    if (prd) {
      const uArea = prd.areaSqFt || (
        Number(prd.dimensions?.north || 1) * Number(prd.dimensions?.east || 1)
      ) || 1;
      const newReqSqFt = explicitArea !== null && explicitArea !== undefined
        ? explicitArea
        : Math.round(qty * uArea * 100) / 100;

      setLandSourcing((prevSourcing) => {
        if (prevSourcing.length === 1 && prevSourcing[0].agreementId) {
          return [{ ...prevSourcing[0], allocatedSqFt: newReqSqFt }];
        }
        return prevSourcing;
      });
    }
  };

  const handleCustomDimensionChange = (field, rawValue) => {
    // Only allow digits (prevents any non-numeric characters and removes scroll side-effects)
    const value = String(rawValue ?? '').replace(/[^0-9]/g, '');
    const nextForm = { ...form, [field]: value };
    const ns = field === 'customNorthSouth' ? value : form.customNorthSouth;
    const ew = field === 'customEastWest' ? value : form.customEastWest;
    const numNs = Number(ns);
    const numEw = Number(ew);

    if (numNs > 0 && numEw > 0) {
      const customArea = Math.round(numNs * numEw * 100) / 100;
      const targetUnitArea = unitAreaSqFt || 1;
      const calculatedQty = Math.max(1, Math.round(customArea / targetUnitArea));
      nextForm.quantity = calculatedQty;
      setForm(nextForm);
      updateQuantityAndSyncArea(calculatedQty, null, customArea);
    } else {
      setForm(nextForm);
    }
  };

  const handleQuantityStep = (delta) => {
    if (hasCustomDimensions) return;
    const next = Math.max(1, quantityNum + delta);
    updateQuantityAndSyncArea(next);
  };

  // Filtered customer search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 30);
    const q = customerSearchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const nMatch = c.name?.toLowerCase().includes(q);
      const cMatch = c.customerCode?.toLowerCase().includes(q) || c.customerId?.toLowerCase().includes(q);
      const mMatch = c.mobile?.includes(q);
      const sMatch = c.sponsorId?.name?.toLowerCase().includes(q);
      return nMatch || cMatch || mMatch || sMatch;
    }).slice(0, 30);
  }, [customers, customerSearchQuery]);

  // Helper to compute a unique key for any tenure slab
  const getPlanKey = (t) => (t ? (t._id || `${t.planName || 'plan'}_${t.tenureMonths}_${t.rdMaturityPercent || 0}`) : '');

  // Current active scheme slab (matched by selectedPlanKey, planName, or tenure)
  const currentPlan = useMemo(() => {
    if (!tenures || tenures.length === 0) return null;
    if (form.selectedPlanKey) {
      const match = tenures.find((t) => getPlanKey(t) === form.selectedPlanKey);
      if (match) return match;
    }
    if (form.planName) {
      const match = tenures.find(
        (t) => t.planName === form.planName && Number(t.tenureMonths) === Number(form.tenureMonths)
      ) || tenures.find((t) => t.planName === form.planName);
      if (match) return match;
    }
    return tenures.find((t) => Number(t.tenureMonths) === Number(form.tenureMonths)) || null;
  }, [tenures, form.selectedPlanKey, form.planName, form.tenureMonths]);

  // Handler when selecting a plan from Scheme Rules
  const handleSelectPlan = (planKey) => {
    if (!planKey) {
      setForm((prev) => ({ ...prev, selectedPlanKey: '', planName: '' }));
      return;
    }
    const matched = tenures.find(
      (t) =>
        getPlanKey(t) === planKey ||
        t._id === planKey ||
        t.planName === planKey ||
        `slab-${t.tenureMonths}` === planKey ||
        String(t.tenureMonths) === planKey
    );
    if (matched) {
      const isOneTimeMode = form.paymentType === 'FULL_PAYMENT';
      const baPct = isOneTimeMode
        ? Number(matched.fdPromoterCommissionPercent ?? 5.0)
        : Number(matched.rdPromoterCommissionPercent ?? 4.0);
      const bpPct = isOneTimeMode
        ? Number(matched.bpFdCommissionPercent ?? 1.0)
        : Number(matched.bpRdCommissionPercent ?? 1.0);
      const branchPct = isOneTimeMode
        ? Number(matched.branchFdCommissionPercent ?? 0)
        : Number(matched.branchRdCommissionPercent ?? 0);

      const planTenure = Number(matched.tenureMonths);
      const newInstCount = isOneTimeMode
        ? 0
        : Math.max(1, Math.round(planTenure / freqMultiplier));

      setForm((prev) => ({
        ...prev,
        selectedPlanKey: getPlanKey(matched),
        planName: matched.planName || `A-${matched.tenureMonths}`,
        tenureMonths: planTenure,
        installmentCount: newInstCount,
        promoterCommissionPercent: baPct,
        developerCommissionPercent: bpPct,
        bpCommissionPercent: bpPct,
        branchCommissionPercent: branchPct,
        rdMaturityPercent: Number(matched.rdMaturityPercent || 0),
        fdMaturityPercent: Number(matched.fdMaturityPercent || 0),
        annualInterestRate: Number(
          (isOneTimeMode ? matched.fdAnnualInterestRate : matched.rdAnnualInterestRate) ??
            matched.annualInterestRate ??
            10.5
        ),
      }));
    }
  };

  // Handler when changing payment type (Monthly Installment vs Full Payment)
  const handlePaymentTypeChange = (newPaymentType) => {
    const isOneTimeMode = newPaymentType === 'FULL_PAYMENT';
    setForm((prev) => {
      const updated = { ...prev, paymentType: newPaymentType };
      if (isOneTimeMode) {
        updated.dpType = 'PERCENT';
        updated.dpVal = 100;
        updated.installmentCount = 0;
      } else {
        if (Number(updated.dpVal) === 100) {
          updated.dpVal = 0;
        }
        const planTenure = Number(updated.tenureMonths || currentPlan?.tenureMonths || 24);
        updated.installmentCount = Math.max(1, Math.round(planTenure / freqMultiplier));
      }
      if (currentPlan) {
        const baPct = isOneTimeMode
          ? Number(currentPlan.fdPromoterCommissionPercent ?? 5.0)
          : Number(currentPlan.rdPromoterCommissionPercent ?? 4.0);
        const bpPct = isOneTimeMode
          ? Number(currentPlan.bpFdCommissionPercent ?? 1.0)
          : Number(currentPlan.bpRdCommissionPercent ?? 1.0);
        const branchPct = isOneTimeMode
          ? Number(currentPlan.branchFdCommissionPercent ?? 0)
          : Number(currentPlan.branchRdCommissionPercent ?? 0);
        updated.promoterCommissionPercent = baPct;
        updated.developerCommissionPercent = bpPct;
        updated.bpCommissionPercent = bpPct;
        updated.branchCommissionPercent = branchPct;
        updated.annualInterestRate = Number(
          (isOneTimeMode ? currentPlan.fdAnnualInterestRate : currentPlan.rdAnnualInterestRate) ??
            currentPlan.annualInterestRate ??
            10.5
        );
      }
      return updated;
    });
  };

  // Handler when changing EMI frequency (Monthly, Quarterly, Half-Yearly, Yearly)
  const handleEmiFrequencyChange = (newFreq) => {
    const mult = newFreq === 'QUARTERLY' ? 3 : newFreq === 'HALF_YEARLY' ? 6 : newFreq === 'YEARLY' ? 12 : 1;
    const baseTenure = Number(form.tenureMonths || currentPlan?.tenureMonths || 24);
    const newCount = Math.max(1, Math.round(baseTenure / mult));
    setForm((prev) => ({
      ...prev,
      emiFrequency: newFreq,
      installmentCount: newCount,
    }));
  };

  // Handle Customer Selection
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setForm((prev) => ({ ...prev, customerId: cust._id }));
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
  };

  // Handle Submit Booking
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!form.customerId) {
      toast.error('Please select a verified customer');
      return;
    }
    if (!form.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!form.productId) {
      toast.error('Please select a plot product');
      return;
    }

    // Validate Land Sourcing Allocation
    if (landSourcing.length > 0) {
      for (let i = 0; i < landSourcing.length; i++) {
        const row = landSourcing[i];
        if (!row.agreementId) {
          toast.error(`Please select an agreement for Row #${i + 1}`);
          return;
        }
        if (!row.allocatedSqFt || Number(row.allocatedSqFt) <= 0) {
          toast.error(`Please enter a valid allocated area for Row #${i + 1}`);
          return;
        }
      }

      if (!isAreaMatched) {
        toast.error(`Total allocated land area (${totalAllocatedArea} SqFt) must match required area (${totalRequiredSqFt} SqFt)`);
        return;
      }
    }

    const validLandSourcing = landSourcing
      .filter((s) => s.agreementId && Number(s.allocatedSqFt) > 0)
      .map((s) => ({
        sourceType: 'AGREEMENT',
        agreementId: s.agreementId,
        agreementNumber: s.agreementNumber,
        parcelId: s.parcelId || null,
        mauja: s.mauja || '',
        thanaNumber: s.thanaNumber || '',
        khataNumber: s.khataNumber || '',
        khesraNumber: s.khesraNumber || '',
        allocatedSqFt: Number(s.allocatedSqFt),
        allocatedDismil: Math.round((Number(s.allocatedSqFt) / 435.6) * 1000) / 1000,
      }));

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        planName: form.planName || (currentPlan?.planName || ''),
        promoterCommissionPercent: form.promoterCommissionPercent,
        developerCommissionPercent: form.developerCommissionPercent,
        bpCommissionPercent: form.bpCommissionPercent,
        branchCommissionPercent: form.branchCommissionPercent,
        rdMaturityPercent: form.rdMaturityPercent,
        fdMaturityPercent: form.fdMaturityPercent,
        annualInterestRate: form.annualInterestRate,
        quantity: quantityNum,
        customUnitPrice: form.customUnitPrice !== '' ? Number(form.customUnitPrice) : undefined,
        customDimensions: (form.customNorthSouth && form.customEastWest) ? {
          north: Number(form.customNorthSouth),
          south: Number(form.customNorthSouth),
          east: Number(form.customEastWest),
          west: Number(form.customEastWest),
          northSouth: Number(form.customNorthSouth),
          eastWest: Number(form.customEastWest),
          unit: 'feet',
          dimensionLabel: `${form.customNorthSouth} ft x ${form.customEastWest} ft (N/S: ${form.customNorthSouth} ft, E/W: ${form.customEastWest} ft)`,
          totalAreaSqFt: totalRequiredSqFt,
        } : (selectedProduct?.dimensions ? {
          north: selectedProduct.dimensions.north || 1,
          south: selectedProduct.dimensions.south || 1,
          east: selectedProduct.dimensions.east || 1,
          west: selectedProduct.dimensions.west || 1,
          northSouth: selectedProduct.dimensions.north || 1,
          eastWest: selectedProduct.dimensions.east || 1,
          unit: selectedProduct.dimensions.unit || 'feet',
          dimensionLabel: selectedProduct.dimensionLabel || `${selectedProduct.dimensions?.north || 1} ft x ${selectedProduct.dimensions?.east || 1} ft`,
          totalAreaSqFt: totalRequiredSqFt,
        } : undefined),
        totalAreaSqFt: totalRequiredSqFt,
        downPayment: isFullPayment ? totalAmount : downpaymentAmt,
        downpaymentAmount: isFullPayment ? totalAmount : downpaymentAmt,
        downpaymentDays: Number(form.downpaymentDays || 90),
        downpaymentMonths: Math.max(1, Math.round((Number(form.downpaymentDays) || 90) / 30)),
        emiFrequency: form.emiFrequency || 'MONTHLY',
        installmentCount: isFullPayment ? 0 : Number(form.installmentCount || 1),
        dpType: form.dpType || 'PERCENT',
        dpVal: Number(form.dpVal) || 0,
        tenureMonths: totalTenureMonths,
        paymentType: form.paymentType,
        paymentMode: isFullPayment ? (form.paymentMode || 'cash') : 'cash',
        transactionReference: isFullPayment ? (form.transactionReference || '') : '',
        landSourcing: validLandSourcing,
        status: form.status || 'ACTIVE',
      };

      if (isEditMode) {
        const res = await api.put(`/plots/product-bookings/${editBookingId}`, payload);
        toast.success(res.data?.message || 'Plot Product Booking updated successfully!');
        navigate('/dashboard/plots/investment-booking');
      } else {
        const res = await api.post('/plots/product-bookings', payload);
        const created = res.data?.data;
        toast.success(res.data?.message || 'Plot Product Booking created successfully!');

        if (created) {
          navigate(`/dashboard/plots/certificates/${created._id}`);
        } else {
          navigate('/dashboard/plots/investment-booking');
        }
      }
    } catch (err) {
      console.error('Error saving product booking:', err);
      toast.error(err.response?.data?.message || 'Failed to save plot product booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading Product Booking System..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/investment-booking')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 transition cursor-pointer mb-1"
          >
            <ArrowLeft size={14} /> Back to Investment Bookings
          </button>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl shadow-2xs">
              <ShoppingCart size={20} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isEditMode
                  ? `Edit Investment Booking — ${editBookingDoc?.bookingNumber || ''}`
                  : 'Create Investment Booking'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {isEditMode
                  ? 'Update fractional unit piece specifications, customer link, tenure scheme, commission matrix, and Kisan land stock allocations.'
                  : 'Allocate fractional unit pieces, deduct Kisan Land stock, and configure contract deposit tenures.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/investment-booking')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitBooking}
            disabled={submitting || !form.customerId || !form.productId}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {isEditMode
              ? (submitting ? 'Updating Booking...' : 'Save & Update Booking')
              : (submitting ? 'Generating Booking...' : 'Confirm & Generate Booking')}
          </button>
        </div>
      </div>

      {isEditMode && editBookingDoc && (
        <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-teal-950">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <Sparkles size={15} />
            </span>
            <div>
              <span className="font-bold">Editing Mode Active: </span>
              <span className="font-mono font-bold text-teal-900">Booking #{editBookingDoc.bookingNumber}</span>
              <span className="mx-2 text-teal-400">•</span>
              <span>Status: <b className="uppercase">{editBookingDoc.status || 'ACTIVE'}</b></span>
              <span className="mx-2 text-teal-400">•</span>
              <span>Total Paid: <b className="font-mono text-emerald-800">₹{Number(editBookingDoc.totalPaid || 0).toLocaleString('en-IN')}</b></span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white border border-teal-200 font-bold text-[11px] text-teal-800">
            Full Edit Enabled
          </span>
        </div>
      )}

      <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Booking Form Steps (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── CARD 1: CUSTOMER SELECTION ── */}
          <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black">
                  1
                </span>
                <span>Select Customer</span>
              </div>
              {selectedCustomer && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified Customer Selected
                </span>
              )}
            </div>

            {selectedCustomer ? (
              <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{selectedCustomer.name}</h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md font-mono text-[10px] font-bold">
                      {selectedCustomer.customerCode || selectedCustomer.customerId || 'ID'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Mobile: <b>{selectedCustomer.mobile || '-'}</b></span>
                    {selectedCustomer.fatherOrHusbandName && (
                      <span>Care of: <b>{selectedCustomer.fatherOrHusbandName}</b></span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    Sponsoring BA: <b className="text-teal-800">{selectedCustomer.sponsorId?.name || 'Direct Company Direct'}</b>
                    {selectedCustomer.sponsorId?.sponsorCode && ` (${selectedCustomer.sponsorId.sponsorCode})`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setForm({ ...form, customerId: '' });
                    setCustomerSearchQuery('');
                    setShowCustomerDropdown(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Change Customer
                </button>
              </div>
            ) : (
              <div className="relative" ref={customerDropdownRef}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Search &amp; Select Customer <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onClick={() => setShowCustomerDropdown(true)}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    placeholder="Click to select or type customer name, mobile, code, or BA..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setShowCustomerDropdown(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Searchable Floating Dropdown Popup */}
                {showCustomerDropdown && (
                  <div className="absolute z-30 top-full mt-1.5 left-0 right-0 max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-xl">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust._id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 hover:bg-teal-50/70 transition cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{cust.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Code: <b className="font-mono text-slate-700">{cust.customerCode || cust.customerId}</b></span>
                              <span>• Mobile: {cust.mobile || '-'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                              BA: {cust.sponsorId?.name || 'Company Direct'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">No customers found matching your search.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── CARD 2: PRODUCT SPECIFICATIONS & OPTIONAL PLOT ── */}
          <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black">
                2
              </span>
              <span>Product &amp; Dimension Specifications</span>
              <span className="text-rose-500">*</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Selection */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.projectId || ''}
                  onChange={(e) => {
                    const selProjId = e.target.value;
                    const selProj = projects.find((p) => p._id === selProjId);
                    
                    // Filter products belonging to this project
                    const projectProducts = products.filter(
                      (p) => p.projectId === selProjId || p.projectId?._id === selProjId
                    );
                    const matchingPrd = projectProducts.find((p) => p._id === form.productId) || projectProducts[0] || null;

                    setForm((prev) => ({
                      ...prev,
                      projectId: selProjId,
                      projectName: selProj?.name || '',
                      productId: matchingPrd?._id || '',
                      customUnitPrice: matchingPrd?.unitPrice || '',
                    }));

                    if (matchingPrd) {
                      updateQuantityAndSyncArea(form.quantity || 1, matchingPrd);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-slate-800 text-xs"
                  required
                >
                  <option value="">-- Choose Project * --</option>
                  {projects.map((proj) => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name} ({proj.code}){proj.location ? ` - ${proj.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Plot Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.productId}
                  onChange={(e) => {
                    const prdId = e.target.value;
                    const prd = products.find((p) => p._id === prdId);
                    setForm((prev) => ({
                      ...prev,
                      productId: prdId,
                      customUnitPrice: prd?.unitPrice || '',
                      ...(prd?.projectId && !prev.projectId
                        ? { projectId: prd.projectId, projectName: prd.projectName || '' }
                        : {}),
                    }));
                    if (prd) {
                      if (form.customNorthSouth && form.customEastWest) {
                        const area = Number(form.customNorthSouth) * Number(form.customEastWest);
                        const targetUnitArea = prd.areaSqFt || (
                          Number(prd.dimensions?.north || 1) * Number(prd.dimensions?.east || 1)
                        ) || 1;
                        const calculatedQty = Math.max(1, Math.round(area / targetUnitArea));
                        setForm((prev) => ({ ...prev, quantity: calculatedQty }));
                        updateQuantityAndSyncArea(calculatedQty, prd, area);
                      } else {
                        updateQuantityAndSyncArea(form.quantity || 1, prd);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-slate-800 text-xs"
                  required
                >
                  <option value="">
                    {form.projectId
                      ? '-- Choose Plot Product for this Project --'
                      : '-- Please Select a Project First --'}
                  </option>
                  {products
                    .filter((p) => {
                      if (!form.projectId) return true;
                      const pProjId = p.projectId?._id || p.projectId;
                      return pProjId === form.projectId || p._id === form.productId;
                    })
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.productName} ({p.productCode}) — {p.dimensionLabel || `${p.dimensions?.north}x${p.dimensions?.east} ft`} ({p.areaSqFt} Sq.Ft) • ₹{Number(p.unitPrice || 0).toLocaleString('en-IN')}
                        {p.projectName ? ` [Project: ${p.projectName}]` : ''}
                      </option>
                    ))}
                </select>

                {selectedProduct && (
                  <div className="mt-2.5 p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-teal-950">
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Dimensions:</span>
                      <b>{selectedProduct.dimensionLabel || `${selectedProduct.dimensions?.north}x${selectedProduct.dimensions?.east} ft`}</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Unit Area:</span>
                      <b>{unitAreaSqFt} Sq.Ft ({Math.round((unitAreaSqFt / 435.6) * 100) / 100} Dismil)</b>
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700 block font-semibold">Catalog Unit Rate:</span>
                      <b>₹{Number(selectedProduct.unitPrice || 0).toLocaleString('en-IN')}</b>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Dimension & Pricing Master Card */}
              <div className="sm:col-span-2 p-4 sm:p-5 bg-gradient-to-br from-slate-50/80 via-teal-50/20 to-emerald-50/25 border border-teal-200/80 rounded-2xl space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-100/70 text-teal-800">
                      <Ruler size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Custom Dimension & Area Specification (माप एवं रकबा)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Enter North-South & East-West in feet to auto-calculate plot units & area
                      </span>
                    </div>
                  </div>
                  {hasCustomDimensions && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, customNorthSouth: '', customEastWest: '' }));
                        updateQuantityAndSyncArea(1);
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                    >
                      Clear Dimensions
                    </button>
                  )}
                </div>

                {/* Dimension Inputs + Calculated Area Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* North-South */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      North-South (ft) / उत्तर-दक्षिण
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.customNorthSouth ?? ''}
                        onChange={(e) => handleCustomDimensionChange('customNorthSouth', e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="e.g. 30"
                        className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none shadow-2xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">ft</span>
                    </div>
                  </div>

                  {/* East-West */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      East-West (ft) / पूरब-पश्चिम
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.customEastWest ?? ''}
                        onChange={(e) => handleCustomDimensionChange('customEastWest', e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="e.g. 40"
                        className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none shadow-2xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">ft</span>
                    </div>
                  </div>

                  {/* Calculated Area Display */}
                  <div className="p-3 bg-white border border-teal-200 rounded-xl flex flex-col justify-between shadow-2xs">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      Total Dimension Area
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-base font-black text-teal-950 font-mono">
                        {(hasCustomDimensions ? customDimensionAreaSqFt : totalRequiredSqFt).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-teal-700">Sq.Ft.</span>
                      <span className="text-[10px] text-slate-500">
                        ({Math.round(((hasCustomDimensions ? customDimensionAreaSqFt : totalRequiredSqFt) / 435.6) * 100) / 100} Dismil)
                      </span>
                    </div>
                    {hasCustomDimensions && (
                      <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block truncate">
                        ↳ {quantityNum} Units (@ {unitAreaSqFt} SqFt/unit)
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity, Custom Rate & Total Valuation Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-teal-100/70">
                  {/* Quantity Stepper */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Quantity (Units) <span className="text-rose-500">*</span>
                      </label>
                      {hasCustomDimensions && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock size={10} className="text-amber-600" /> Locked
                        </span>
                      )}
                    </div>
                    {hasCustomDimensions ? (
                      <div className="px-3.5 py-2.5 bg-slate-100/90 border border-slate-300 rounded-xl flex items-center justify-between">
                        <span className="font-black font-mono text-sm text-slate-800">
                          {form.quantity} Units
                        </span>
                        <Lock size={13} className="text-slate-400" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityStep(-1)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold shrink-0"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={form.quantity}
                          onChange={(e) => updateQuantityAndSyncArea(e.target.value.replace(/[^0-9]/g, ''))}
                          onBlur={() => (!form.quantity || Number(form.quantity) < 1) && updateQuantityAndSyncArea(1)}
                          onWheel={(e) => e.target.blur()}
                          className="w-full text-center px-3 py-2 bg-white border border-slate-200 rounded-xl font-black font-mono text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityStep(1)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold shrink-0"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {hasCustomDimensions ? 'Auto-locked by dimensions' : 'Manual units stepper'}
                    </span>
                  </div>

                  {/* Custom Unit Rate */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Custom Unit Rate (₹) <span className="text-teal-600 font-semibold">(Editable)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.customUnitPrice}
                        onChange={(e) => setForm({ ...form, customUnitPrice: e.target.value.replace(/[^0-9]/g, '') })}
                        onWheel={(e) => e.target.blur()}
                        placeholder={selectedProduct?.unitPrice ? String(selectedProduct.unitPrice) : '1000'}
                        className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold font-mono text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none shadow-2xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block truncate">
                      Catalog: ₹{Number(selectedProduct?.unitPrice || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Total Value */}
                  <div className="p-3 bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-xl flex flex-col justify-between shadow-xs">
                    <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wider block">
                      Total Valuation
                    </span>
                    <div className="text-lg font-black font-mono tracking-tight">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-teal-100 font-medium block truncate">
                      {hasCustomDimensions
                        ? `${customDimensionAreaSqFt.toLocaleString('en-IN')} Sq.Ft × ₹${unitRate.toLocaleString('en-IN')}`
                        : `${quantityNum.toLocaleString('en-IN')} Units × ₹${unitRate.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 3: PAYMENT PLAN & PERIOD ── */}
          <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base border-b border-slate-100 pb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black">
                3
              </span>
              <span>Payment Plan Scheme &amp; Period</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Payment Type Switcher */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Payment Scheme Option</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange('MONTHLY_INSTALLMENT')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      form.paymentType === 'MONTHLY_INSTALLMENT'
                        ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-full ${form.paymentType === 'MONTHLY_INSTALLMENT' ? 'bg-teal-600 text-white' : 'bg-slate-200'}`}>
                      <CheckCircle2 size={12} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Monthly / Periodic Installment (EMI)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Flexible downpayment • Remaining on monthly, quarterly, semi-yearly, or yearly EMIs</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange('FULL_PAYMENT')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                      form.paymentType === 'FULL_PAYMENT'
                        ? 'bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 p-1 rounded-full ${form.paymentType === 'FULL_PAYMENT' ? 'bg-teal-600 text-white' : 'bg-slate-200'}`}>
                      <CheckCircle2 size={12} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">One-Time Full Payment</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">100% upfront settlement with recorded contract deposit/holding period</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Plan & Tenure Picker */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    {isFullPayment ? 'Contract Holding Plan & Tenure' : 'EMI Scheme Plan & Tenure'} <span className="text-rose-500">*</span>
                  </label>
                  {currentPlan && (
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      Number(currentPlan.rdMaturityPercent) === 0 && Number(currentPlan.fdMaturityPercent) === 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-teal-50 text-teal-800 border-teal-300'
                    }`}>
                      {Number(currentPlan.rdMaturityPercent) === 0 && Number(currentPlan.fdMaturityPercent) === 0
                        ? 'Actual Plot Sale (0% Return)'
                        : 'Customer Return Plan'}
                    </span>
                  )}
                </div>

                <select
                  value={form.selectedPlanKey || getPlanKey(currentPlan) || ''}
                  onChange={(e) => handleSelectPlan(e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Select Plan (Custom / Manual) --</option>
                  {tenures.length > 0 ? (
                    tenures.map((t, idx) => {
                      const isRegistry = Number(t.rdMaturityPercent) === 0 && Number(t.fdMaturityPercent) === 0;
                      const planTag = t.planName ? `${t.planName} — ` : '';
                      const retPct = isFullPayment ? (t.fdMaturityPercent || 0) : (t.rdMaturityPercent || 0);
                      const suffix = isRegistry
                        ? ` • Actual Plot Sale (0% Return / Registry)`
                        : ` • Return: ${retPct}%`;
                      const pKey = getPlanKey(t);
                      return (
                        <option key={pKey || idx} value={pKey}>
                          {planTag}{t.tenureMonths} Months ({+(t.tenureMonths / 12).toFixed(1)} Yrs){suffix}
                        </option>
                      );
                    })
                  ) : (
                    [12, 24, 36, 48, 60].map((m) => (
                      <option key={m} value={String(m)}>
                        {m} Months ({m / 12} Years)
                      </option>
                    ))
                  )}
                </select>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isFullPayment
                    ? 'Records holding period for maturity returns or money-back refund on term completion.'
                    : 'Installments will be equally divided across the selected installment schedule.'}
                </p>

                {/* Active Scheme Commission Policy Matrix */}
                {currentPlan && (
                  <div className="p-2.5 bg-teal-50/60 border border-teal-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                    <span className="font-bold text-teal-900 flex items-center gap-1">
                      <Percent size={13} className="text-teal-700" /> Scheme Commission Policy:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        Associate (BA):{' '}
                        <b className="text-teal-900 font-mono font-bold">
                          {form.promoterCommissionPercent ?? (isFullPayment ? currentPlan.fdPromoterCommissionPercent : currentPlan.rdPromoterCommissionPercent) ?? (isFullPayment ? 5 : 4)}%
                        </b>
                      </span>
                      <span className="text-teal-300">•</span>
                      <span>
                        Partner (BP):{' '}
                        <b className="text-teal-900 font-mono font-bold">
                          {form.bpCommissionPercent ?? (isFullPayment ? currentPlan.bpFdCommissionPercent : currentPlan.bpRdCommissionPercent) ?? 1}%
                        </b>
                      </span>
                      <span className="text-teal-300">•</span>
                      <span>
                        Branch Partner:{' '}
                        <b className="text-teal-900 font-mono font-bold">
                          {form.branchCommissionPercent ?? (isFullPayment ? (currentPlan.branchFdCommissionPercent ?? 0.5) : (currentPlan.branchRdCommissionPercent ?? 0.5)) ?? 0.5}%
                        </b>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* When EMI Installment Plan Active: Show Downpayment, Days, and Frequency */}
              {!isFullPayment ? (
                <>
                  {/* Downpayment */}
                  <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-teal-50/50 border border-teal-200 rounded-2xl shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                        <Calculator size={14} className="text-teal-700" />
                        Downpayment
                      </label>
                      <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-300">
                        {form.dpType === 'SQFT_RATE'
                          ? `₹${form.dpVal || 0}/sqft`
                          : form.dpType === 'PERCENT'
                            ? `${form.dpVal || 0}%`
                            : `Flat ₹`}
                      </span>
                    </div>

                    <div className="flex h-11 rounded-xl border border-teal-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-700 bg-white shadow-2xs">
                      <select
                        value={form.dpType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          let nextVal = form.dpVal;
                          if (newType === 'FLAT') {
                            nextVal = downpaymentAmt || 0;
                          } else if (newType === 'PERCENT') {
                            nextVal = totalAmount > 0 ? Math.min(100, Math.round(((downpaymentAmt || 0) / totalAmount) * 100)) : 0;
                          } else if (newType === 'SQFT_RATE') {
                            nextVal = totalRequiredSqFt > 0 ? Math.round((downpaymentAmt || 0) / totalRequiredSqFt) : 0;
                          }
                          setForm({ ...form, dpType: newType, dpVal: nextVal });
                        }}
                        className="px-3 bg-teal-50 text-xs font-bold text-teal-900 border-r border-teal-200 outline-none cursor-pointer shrink-0"
                      >
                        <option value="PERCENT">% (Percentage)</option>
                        <option value="FLAT">₹ (Flat)</option>
                        <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                      </select>
                      <input
                        className="w-full px-3.5 text-sm bg-transparent outline-none text-teal-950 font-bold font-mono"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.dpVal}
                        onChange={(e) => setForm({ ...form, dpVal: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder={
                          form.dpType === 'PERCENT'
                            ? 'e.g. 25 (%)'
                            : form.dpType === 'SQFT_RATE'
                              ? 'e.g. 500 (₹/sqft)'
                              : 'e.g. 50000 (Flat ₹)'
                        }
                      />
                    </div>

                    <span className="text-[11px] text-teal-800 font-bold truncate">
                      Total DP: ₹{downpaymentAmt.toLocaleString('en-IN')} {customDpRate > 0 ? `(₹${customDpRate}/sqft eq.)` : ''}
                    </span>
                  </div>

                  {/* Due Period (Days) for Downpayment */}
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
                        setForm({ ...form, downpaymentDays: val });
                      }}
                      placeholder="90"
                      required
                    />
                    <span className="text-[11px] text-teal-700 font-medium truncate">
                      {getDynamicDueHelper(form.bookingDate, form.downpaymentDays ?? 90)}
                    </span>
                  </div>

                  {/* EMI Frequency & Installments Schedule */}
                  {remainingBalance > 0 ? (
                    <div className="sm:col-span-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-3.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Calculator size={15} className="text-teal-700" />
                          EMI Frequency &amp; Installments Schedule
                        </label>
                        <span className="text-xs font-black text-teal-900 bg-teal-100/90 border border-teal-300 px-3 py-1 rounded-xl shadow-2xs">
                          Total Duration: {totalTenureMonths} Months
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
                            value={form.emiFrequency}
                            onChange={(e) => handleEmiFrequencyChange(e.target.value)}
                            className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs cursor-pointer"
                          >
                            <option value="MONTHLY">Monthly (Every 1 Month)</option>
                            <option value="QUARTERLY">Quarterly (Every 3 Months)</option>
                            <option value="HALF_YEARLY">Half-Yearly (Every 6 Months)</option>
                            <option value="YEARLY">Yearly (Every 12 Months)</option>
                          </select>
                          <span className="text-[11px] text-slate-500 font-medium truncate">
                            Installments due {form.emiFrequency === 'MONTHLY' ? 'every month' : form.emiFrequency === 'QUARTERLY' ? 'every 3 months' : form.emiFrequency === 'HALF_YEARLY' ? 'every 6 months' : 'every 12 months'}
                          </span>
                        </div>

                        {/* Installment Count Input */}
                        <div className="flex flex-col justify-between gap-1.5 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">Number of Installments *</label>
                            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {form.installmentCount || 0} installments
                            </span>
                          </div>
                          <input
                            className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.installmentCount}
                            onChange={(e) => setForm({ ...form, installmentCount: e.target.value.replace(/[^0-9]/g, '') })}
                            placeholder="1"
                            required
                          />

                          <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl w-fit">
                            <span className="text-sm font-black text-teal-950 font-mono tracking-tight">
                              {totalTenureMonths} Months
                            </span>
                            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                              Total Duration
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Installment Amount Breakdown */}
                      <div className="p-3 bg-teal-50/60 border border-teal-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-teal-600" />
                          <span className="text-teal-950 font-semibold">
                            Installment Amount:{' '}
                            <strong className="text-teal-950 font-black font-mono text-sm">
                              ₹{emiPerInstallmentAmt.toLocaleString('en-IN')}
                            </strong>{' '}
                            / {form.emiFrequency === 'MONTHLY' ? 'month' : form.emiFrequency === 'QUARTERLY' ? 'quarter (3 mos)' : form.emiFrequency === 'HALF_YEARLY' ? 'half-year (6 mos)' : 'year'}
                          </span>
                        </div>
                        <span className="text-teal-800 font-medium font-mono text-[11px]">
                          Remaining ₹{remainingBalance.toLocaleString('en-IN')} divided across {form.installmentCount || 1} installments
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Booking / Start Date */}
                  <div className="sm:col-span-2">
                    <DateInput
                      label="Booking / Start Date *"
                      value={form.bookingDate}
                      onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                      required
                    />
                  </div>
                </>
              ) : (
                /* Full Payment Details */
                <div className="sm:col-span-2 space-y-3.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Upfront Payment Amount (₹) <span className="text-emerald-700 font-bold">(100% Full Paid)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="text"
                          readOnly
                          value={totalAmount.toLocaleString('en-IN')}
                          className="w-full pl-8 pr-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-black font-mono text-teal-950 cursor-not-allowed outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <DateInput
                        label="Booking & Payment Date"
                        value={form.bookingDate}
                        onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">Payment Mode</label>
                      <select
                        value={form.paymentMode || 'cash'}
                        onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-600 outline-none"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                        <option value="cheque">Cheque</option>
                        <option value="upi">UPI / QR Code</option>
                      </select>
                    </div>

                    {form.paymentMode !== 'cash' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">Transaction Ref / Cheque # (Optional)</label>
                        <input
                          type="text"
                          value={form.transactionReference || ''}
                          onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                          placeholder="e.g. UTR / Cheque / Ref #"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* In Edit Mode: Booking Status */}
              {isEditMode && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 text-xs">
                    Booking Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.status || 'ACTIVE'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-teal-900 focus:ring-2 focus:ring-teal-600 outline-none cursor-pointer"
                    required
                  >
                    <option value="ACTIVE">ACTIVE (Ongoing Installments / Regular)</option>
                    <option value="COMPLETED">COMPLETED (Fully Paid &amp; Closed)</option>
                    <option value="CANCELLED">CANCELLED (Void / Cancelled)</option>
                  </select>
                </div>
              )}

              {/* Remarks */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Remarks / Operational Notes (Optional)</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Add any specific allotment conditions or remarks..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* ── CARD 4: KISAN LAND AGREEMENT STOCK SOURCING (Multi-Agreement) ── */}
          <div className="p-5 sm:p-6 bg-teal-50/70 border border-teal-300 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/80 pb-3">
              <div>
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={16} className="text-teal-700" />
                  LAND ACQUISITION SOURCING (किसान एग्रीमेंट / रजिस्ट्री डीड स्टॉक){' '}
                  <span className="text-rose-600 font-black">*</span>
                </h4>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Required: Allocate the entire product area ({totalRequiredSqFt} Sq.Ft.) from active Kisan Agreements.
                </p>
              </div>

              {allLandSources.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const otherRowsTotal = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                    const remaining = Math.max(0, totalRequiredSqFt - otherRowsTotal);
                    setLandSourcing([
                      ...landSourcing,
                      {
                        sourceType: 'AGREEMENT',
                        agreementId: '',
                        agreementNumber: '',
                        parcelId: null,
                        khesraNumber: '',
                        mauja: '',
                        thanaNumber: '',
                        khataNumber: '',
                        allocatedSqFt: remaining,
                      },
                    ]);
                  }}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                >
                  + Add Land Source
                </button>
              )}
            </div>

            {landSourcing.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {allLandSources.length === 0
                      ? 'No active agreements with available stock found in Purchase & Land Master.'
                      : 'No agreement selected. Click "+ Add Land Source" to allocate land stock.'}
                  </span>
                </div>
                {allLandSources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setLandSourcing([
                        {
                          sourceType: 'AGREEMENT',
                          agreementId: '',
                          agreementNumber: '',
                          parcelId: null,
                          khesraNumber: '',
                          mauja: '',
                          thanaNumber: '',
                          khataNumber: '',
                          allocatedSqFt: totalRequiredSqFt,
                        },
                      ]);
                    }}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                  >
                    + Add Land Source
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {landSourcing.map((src, idx) => {
                  const selectedAgr = allLandSources.find(
                    (s) => String(s.agreementId || s._id) === String(src.agreementId)
                  );
                  const availableParcels = selectedAgr?.parcels || [];
                  const selectedParcel = availableParcels.find(
                    (p) => (src.parcelId && String(p.parcelId) === String(src.parcelId)) ||
                           (src.khesraNumber && String(p.khesraNumber) === String(src.khesraNumber))
                  ) || null;

                  const parcelAvailableSqFt = selectedParcel?.availableSqFt ?? selectedAgr?.availableSqFt ?? 0;
                  const parcelAvailableDismil = selectedParcel?.availableDismil ?? selectedAgr?.availableDismil ?? (parcelAvailableSqFt ? (parcelAvailableSqFt / 435.6).toFixed(2) : 0);

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-teal-200 shadow-2xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        {/* 1. Select Agreement */}
                        <div className="sm:col-span-5 flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            1. Select Agreement *
                          </label>
                          <select
                            className="h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none w-full focus:ring-2 focus:ring-teal-600 focus:bg-white cursor-pointer"
                            value={src.agreementId || ''}
                            onChange={(e) => {
                              const chosenAgrId = e.target.value;
                              const updated = [...landSourcing];
                              if (!chosenAgrId) {
                                updated[idx] = {
                                  sourceType: 'AGREEMENT',
                                  agreementId: '',
                                  agreementNumber: '',
                                  parcelId: null,
                                  khesraNumber: '',
                                  mauja: '',
                                  thanaNumber: '',
                                  khataNumber: '',
                                  allocatedSqFt: src.allocatedSqFt || 0,
                                };
                                setLandSourcing(updated);
                                return;
                              }

                              const chosenAgr = allLandSources.find(
                                (s) => String(s.agreementId || s._id) === String(chosenAgrId)
                              );
                              if (!chosenAgr) return;

                              const firstParcel = chosenAgr.parcels && chosenAgr.parcels.length === 1 ? chosenAgr.parcels[0] : null;
                              const otherRowsTotal = landSourcing
                                .filter((_, i) => i !== idx)
                                .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                              const remainingNeeded = Math.max(0, totalRequiredSqFt - otherRowsTotal);
                              const currentAlloc = Number(src.allocatedSqFt) || 0;

                              updated[idx] = {
                                ...updated[idx],
                                sourceType: chosenAgr.sourceType || 'AGREEMENT',
                                agreementId: chosenAgr.agreementId || chosenAgr._id,
                                agreementNumber: chosenAgr.agreementNumber || chosenAgr.label,
                                parcelId: firstParcel?.parcelId || null,
                                khesraNumber: firstParcel?.khesraNumber || (chosenAgr.parcels?.length === 1 ? chosenAgr.khesraNumber : '') || '',
                                mauja: firstParcel?.mauja || chosenAgr.mauja || '',
                                thanaNumber: firstParcel?.thanaNumber || chosenAgr.thanaNumber || '',
                                khataNumber: firstParcel?.khataNumber || chosenAgr.khataNumber || '',
                                allocatedSqFt: currentAlloc > 0 ? currentAlloc : remainingNeeded,
                              };
                              setLandSourcing(updated);
                            }}
                          >
                            <option value="">-- Select Agreement --</option>
                            {availableAgreementsForProject.map((agr, aIdx) => (
                              <option key={`agr_${agr.agreementId || agr._id}_${aIdx}`} value={agr.agreementId || agr._id}>
                                {agr.agreementNumber || agr.label} (Total Avail: {agr.availableSqFt?.toLocaleString('en-IN')} SqFt)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Select Plot / Khesra No. */}
                        <div className="sm:col-span-4 flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            2. Plot / Khesra No. *
                          </label>
                          {src.agreementId && availableParcels.length > 0 ? (
                            <select
                              className="h-10 px-3 text-xs font-semibold bg-teal-50/60 border border-teal-300 rounded-lg outline-none w-full focus:ring-2 focus:ring-teal-600 focus:bg-white text-teal-950 cursor-pointer"
                              value={src.parcelId ? String(src.parcelId) : (src.khesraNumber || '')}
                              onChange={(e) => {
                                const chosenVal = e.target.value;
                                if (!chosenVal) {
                                  const updated = [...landSourcing];
                                  updated[idx] = {
                                    ...updated[idx],
                                    parcelId: null,
                                    khesraNumber: '',
                                    mauja: '',
                                    thanaNumber: '',
                                    khataNumber: '',
                                  };
                                  setLandSourcing(updated);
                                  return;
                                }
                                const p = availableParcels.find(
                                  (item) => String(item.parcelId) === chosenVal || String(item.khesraNumber) === chosenVal
                                );
                                if (!p) return;
                                const updated = [...landSourcing];
                                updated[idx] = {
                                  ...updated[idx],
                                  parcelId: p.parcelId || null,
                                  khesraNumber: p.khesraNumber || '',
                                  mauja: p.mauja || '',
                                  thanaNumber: p.thanaNumber || '',
                                  khataNumber: p.khataNumber || '',
                                };
                                setLandSourcing(updated);
                              }}
                            >
                              <option value="">-- Select Plot / Khesra --</option>
                              {availableParcels.map((p, pIdx) => (
                                <option
                                  key={`parcel_${p.parcelId || pIdx}`}
                                  value={p.parcelId ? String(p.parcelId) : String(p.khesraNumber)}
                                >
                                  Plot #{p.khesraNumber || 'N/A'} (Khata: {p.khataNumber || '-'}, Avail: {p.availableSqFt} SqFt)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              disabled
                              placeholder="Select agreement first"
                              className="h-10 px-3 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-400 font-medium"
                            />
                          )}
                        </div>

                        {/* 3. Allocated Area */}
                        <div className="sm:col-span-3 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              Allocated Area *
                            </label>
                            {(() => {
                              const otherRowsTotal = landSourcing
                                .filter((_, i) => i !== idx)
                                .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                              const remainingNeeded = Math.max(0, totalRequiredSqFt - otherRowsTotal);
                              if (remainingNeeded > 0 && Number(src.allocatedSqFt) !== remainingNeeded) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...landSourcing];
                                      updated[idx].allocatedSqFt = remainingNeeded;
                                      setLandSourcing(updated);
                                    }}
                                    className="text-[9px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200 transition cursor-pointer"
                                    title={`Auto-fill remaining ${remainingNeeded} Sq.Ft.`}
                                  >
                                    Fill {remainingNeeded} SqFt
                                  </button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              className="w-full h-10 px-2.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg outline-none text-right font-mono focus:ring-2 focus:ring-teal-600 shadow-2xs"
                              value={src.allocatedSqFt ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updated = [...landSourcing];
                                updated[idx].allocatedSqFt = val;
                                setLandSourcing(updated);
                              }}
                              placeholder="Sq.Ft."
                            />
                            <span className="text-xs font-bold text-slate-500 shrink-0">SqFt</span>
                            {landSourcing.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setLandSourcing(landSourcing.filter((_, i) => i !== idx))}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0 border border-rose-200"
                                title="Remove this Land Source"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details Strip */}
                      {src.agreementId && (
                        <div className="bg-teal-50/70 border border-teal-200/90 rounded-xl p-3 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 font-medium">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Agreement #</span>
                            <span className="font-bold text-teal-950 font-mono">
                              {src.agreementNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Plot / Khesra &amp; Khata</span>
                            <span className="font-bold text-slate-900">
                              Plot #{src.khesraNumber || '-'} {src.khataNumber ? `(Khata: ${src.khataNumber})` : ''}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Mauja: {src.mauja || '-'} {src.thanaNumber ? `| Thana: ${src.thanaNumber}` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Available in this Plot</span>
                            <span className="font-extrabold text-teal-900 font-mono text-xs">
                              {parcelAvailableSqFt.toLocaleString('en-IN')} Sq.Ft.
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold">Available (Dismil)</span>
                            <span className="font-extrabold text-emerald-800 font-mono text-xs">
                              {parcelAvailableDismil} Dismil
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Validation Matching Status Strip */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs font-bold px-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={isAreaMatched ? 'text-emerald-700 flex items-center gap-1' : 'text-rose-600 flex items-center gap-1'}>
                      {isAreaMatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Land Stock Area Perfectly Matched:</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>
                            {landSourcing.some((s) => !s.agreementId)
                              ? '⚠️ Please choose an agreement for all rows'
                              : totalAllocatedArea > totalRequiredSqFt
                              ? `⚠️ Allocated Area Exceeds Required Size by ${(totalAllocatedArea - totalRequiredSqFt).toLocaleString('en-IN')} Sq.Ft.:`
                              : `⚠️ Underallocated: Remaining ${(totalRequiredSqFt - totalAllocatedArea).toLocaleString('en-IN')} Sq.Ft. needed:`}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className={`font-mono text-xs font-black ${isAreaMatched ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {totalAllocatedArea.toLocaleString('en-IN')} / {totalRequiredSqFt.toLocaleString('en-IN')} Sq. Ft.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Live Summary & Action Bar (4 Cols) - Light Theme */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <FileCheck size={16} className="text-teal-700" /> Booking Summary
              </span>
              <span className="px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-[10px] font-bold">
                {isFullPayment ? '100% Upfront' : 'EMI Scheme'}
              </span>
            </div>

            {/* Customer & BA Details */}
            <div className="space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Allottee Customer:</span>
              <div className="font-bold text-slate-900 text-sm">
                {selectedCustomer ? selectedCustomer.name : <span className="text-slate-400 italic text-xs">Not Selected</span>}
              </div>
              {selectedCustomer && (
                <div className="text-[11px] text-teal-700 font-medium">
                  BA: <span className="font-semibold text-slate-800">{selectedCustomer.sponsorId?.name || 'Direct Company'}</span>
                </div>
              )}
            </div>

            {/* Product & Dimensions Details */}
            <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Product Specs:</span>
              <div className="font-bold text-slate-900 text-sm">
                {selectedProduct ? `${selectedProduct.productName} (${quantityNum} ${quantityNum === 1 ? 'Unit' : 'Units'})` : <span className="text-slate-400 italic text-xs">No Product</span>}
              </div>
              {hasCustomDimensions && (
                <div className="text-[11px] text-teal-900 font-semibold">
                  Dimensions: <b>{form.customNorthSouth} ft × {form.customEastWest} ft</b> (N/S: {form.customNorthSouth} ft, E/W: {form.customEastWest} ft)
                </div>
              )}
              <div className="text-[11px] text-slate-600">
                Total Area: <b className="text-teal-800 font-bold">{totalRequiredSqFt.toLocaleString('en-IN')} Sq.Ft.</b> ({totalRequiredDismil} Dismil)
              </div>
            </div>

            {/* Land Stock Sourced (Multi-Row Breakdown) */}
            <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sourced Land Agreements:</span>
              {landSourcing.filter(s => s.agreementId && Number(s.allocatedSqFt) > 0).length > 0 ? (
                <div className="space-y-1.5">
                  {landSourcing.filter(s => s.agreementId && Number(s.allocatedSqFt) > 0).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{s.agreementNumber}</span>
                        <span className="text-[10px] text-slate-500 block">Plot #{s.khesraNumber || 'N/A'}</span>
                      </div>
                      <span className="font-bold text-teal-900 font-mono">{s.allocatedSqFt} Sq.Ft</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-[11px] pt-1 font-bold">
                    <span className="text-slate-600">Total Sourced:</span>
                    <span className={isAreaMatched ? 'text-emerald-700 font-mono font-black' : 'text-rose-600 font-mono font-black'}>
                      {totalAllocatedArea} / {totalRequiredSqFt} Sq.Ft
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400 italic text-xs">None Allocated</span>
              )}
            </div>

            {/* Financial Calculations */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Total Valuation:</span>
                <span className="font-black font-mono text-base text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Scheme Plan &amp; Tenure:</span>
                <span className="font-bold text-teal-800">
                  {form.planName ? `${form.planName} (${totalTenureMonths || tenure}M)` : `${totalTenureMonths || tenure} Months`}
                </span>
              </div>

              {isFullPayment ? (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <span className="text-emerald-700 font-bold">Paid Upfront:</span>
                  <span className="font-black font-mono text-emerald-700 text-sm">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  {downpaymentAmt > 0 && (
                    <>
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-amber-800 font-semibold">Downpayment:</span>
                        <span className="font-black font-mono text-amber-800 text-xs">
                          ₹{downpaymentAmt.toLocaleString('en-IN')}
                          <span className="text-[10px] text-amber-600 font-normal ml-1">({form.downpaymentDays || 90}d)</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Remaining for EMI:</span>
                        <span className="font-bold font-mono text-slate-700 text-xs">
                          ₹{remainingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                    <span className="text-emerald-700 font-bold">
                      {form.emiFrequency === 'QUARTERLY'
                        ? 'Quarterly Installment:'
                        : form.emiFrequency === 'HALF_YEARLY'
                        ? 'Half-Yearly Installment:'
                        : form.emiFrequency === 'YEARLY'
                        ? 'Yearly Installment:'
                        : 'Monthly Installment (EMI):'}
                    </span>
                    <span className="font-black font-mono text-emerald-700 text-sm">
                      ₹{emiPerInstallmentAmt.toLocaleString('en-IN')}
                      <span className="text-[10px] font-normal text-emerald-600 ml-1">
                        ({form.installmentCount || 1} inst.)
                      </span>
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !form.customerId || !form.productId || (landSourcing.length > 0 && !isAreaMatched)}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={16} />
                {isEditMode
                  ? (submitting ? 'Updating Booking...' : 'Save & Update Booking')
                  : (submitting ? 'Generating Booking...' : 'Confirm & Generate Booking')}
              </button>
            </div>
          </div>


        </div>
      </form>

    </div>
  );
};

export default ProductBookingPage;
