import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import PageLoader from '../../../components/common/PageLoader';

const ProductBookingPage = () => {
  const navigate = useNavigate();
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
    quantity: 1,
    customUnitPrice: '',
    tenureMonths: 24,
    paymentType: 'MONTHLY_INSTALLMENT', // 'MONTHLY_INSTALLMENT' | 'FULL_PAYMENT'
    paymentMode: 'cash',
    transactionReference: '',
    bookingDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Land Sourcing State: Array of multi-agreement rows
  const [landSourcing, setLandSourcing] = useState([]);

  // Fetch all initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, custRes, tenureRes, sourcesRes, projectsRes] = await Promise.all([
          api.get('/plots/products'),
          api.get('/plots/customers?limit=1000'),
          api.get('/plots/products/tenures'),
          api.get('/plots/kisan-agreements/sources').catch(() => ({ data: { data: [] } })),
          api.get('/plots/projects').catch(() => ({ data: { data: [] } })),
        ]);

        const prodList = prodRes.data?.data?.products || prodRes.data?.data || [];
        const custList = custRes.data?.data?.customers || custRes.data?.data || [];
        const tenureList = tenureRes.data?.data?.tenures || tenureRes.data?.data || [];
        const srcList = sourcesRes.data?.data || [];
        const projList = projectsRes.data?.data || [];

        setProducts(prodList);
        setCustomers(custList);
        setTenures(tenureList);
        setAllLandSources(srcList);
        setProjects(projList);

        // Pre-select product or customer if in query params
        const targetProd = prodList.find((p) => p._id === initialProductId) || prodList[0];
        const targetCust = custList.find((c) => c._id === initialCustomerId);
        const firstTenure = tenureList[0]?.tenureMonths || 24;

        if (targetCust) {
          setSelectedCustomer(targetCust);
        }

        setForm((prev) => ({
          ...prev,
          productId: targetProd?._id || '',
          customerId: targetCust?._id || '',
          tenureMonths: firstTenure,
          customUnitPrice: targetProd?.unitPrice || '',
        }));

        // Initialize default land sourcing row with target product required area
        const initialQty = 1;
        const initialArea = targetProd?.areaSqFt || (
          Number(targetProd?.dimensions?.north || 1) * Number(targetProd?.dimensions?.east || 1)
        ) || 40;
        const initialReqSqFt = initialQty * initialArea;

        if (srcList.length > 0) {
          const firstSrc = srcList[0];
          const firstParcel = firstSrc.parcels?.[0];
          setLandSourcing([
            {
              sourceType: firstSrc.sourceType || 'AGREEMENT',
              agreementId: firstSrc.agreementId || firstSrc._id,
              agreementNumber: firstSrc.agreementNumber || firstSrc.label,
              parcelId: firstParcel?.parcelId || null,
              khesraNumber: firstParcel?.khesraNumber || firstSrc.khesraNumber || '',
              mauja: firstParcel?.mauja || firstSrc.mauja || '',
              thanaNumber: firstParcel?.thanaNumber || firstSrc.thanaNumber || '',
              khataNumber: firstParcel?.khataNumber || firstSrc.khataNumber || '',
              allocatedSqFt: initialReqSqFt,
            },
          ]);
        } else {
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
  }, [initialProductId, initialCustomerId]);

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
  ) || 40;
  const totalRequiredSqFt = Math.round(quantityNum * unitAreaSqFt * 100) / 100;
  const totalRequiredDismil = Math.round((totalRequiredSqFt / 435.6) * 100) / 100;

  const isFullPayment = form.paymentType === 'FULL_PAYMENT';
  const tenure = Math.max(1, Number(form.tenureMonths) || 24);
  const monthlyEmi = isFullPayment
    ? 0
    : Math.round(totalAmount / tenure);

  // Total allocated area across all land sourcing rows
  const totalAllocatedArea = useMemo(() => {
    return landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  }, [landSourcing]);

  const totalAllocatedDismil = Math.round((totalAllocatedArea / 435.6) * 100) / 100;
  const isAreaMatched = Math.abs(totalAllocatedArea - totalRequiredSqFt) <= 0.5;

  // Quantity stepper & updater helper
  const updateQuantityAndSyncArea = (nextQty, customPrd = null) => {
    const qty = Math.max(1, Number(nextQty) || 1);
    setForm((prev) => ({ ...prev, quantity: nextQty }));

    // Auto-sync allocated area if only 1 agreement row is selected
    const prd = customPrd || selectedProduct;
    if (prd) {
      const uArea = prd.areaSqFt || (
        Number(prd.dimensions?.north || 1) * Number(prd.dimensions?.east || 1)
      ) || 40;
      const newReqSqFt = Math.round(qty * uArea * 100) / 100;

      setLandSourcing((prevSourcing) => {
        if (prevSourcing.length === 1 && prevSourcing[0].agreementId) {
          return [{ ...prevSourcing[0], allocatedSqFt: newReqSqFt }];
        }
        return prevSourcing;
      });
    }
  };

  const handleQuantityStep = (delta) => {
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
        quantity: quantityNum,
        customUnitPrice: form.customUnitPrice !== '' ? Number(form.customUnitPrice) : undefined,
        downPayment: isFullPayment ? totalAmount : 0,
        tenureMonths: tenure,
        paymentType: form.paymentType,
        paymentMode: isFullPayment ? (form.paymentMode || 'cash') : 'cash',
        transactionReference: isFullPayment ? (form.transactionReference || '') : '',
        landSourcing: validLandSourcing,
      };

      const res = await api.post('/plots/product-bookings', payload);
      const created = res.data?.data;
      toast.success(res.data?.message || 'Plot Product Booking created successfully!');

      if (created) {
        navigate(`/dashboard/plots/certificates/${created._id}`);
      } else {
        navigate('/dashboard/plots/products');
      }
    } catch (err) {
      console.error('Error creating product booking:', err);
      toast.error(err.response?.data?.message || 'Failed to generate plot product booking');
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
            onClick={() => navigate('/dashboard/plots/products')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 transition cursor-pointer mb-1"
          >
            <ArrowLeft size={14} /> Back to Plot Products
          </button>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl shadow-2xs">
              <ShoppingCart size={20} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Sell Plot Product &amp; Create Booking
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Allocate fractional unit pieces, deduct Kisan Land stock, and configure contract deposit tenures.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/plots/products')}
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
            {submitting ? 'Generating Booking...' : 'Confirm & Generate Booking'}
          </button>
        </div>
      </div>

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
                <span>Customer Selection &amp; BA Auto-Link</span>
                <span className="text-rose-500">*</span>
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
              {/* Project Selection (Optional / Pre-filter) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Selection <span className="text-slate-400 font-normal">(Optional / Under Project)</span>
                </label>
                <select
                  value={form.projectId || ''}
                  onChange={(e) => {
                    const selProjId = e.target.value;
                    const selProj = projects.find((p) => p._id === selProjId);
                    setForm((prev) => ({
                      ...prev,
                      projectId: selProjId,
                      projectName: selProj?.name || '',
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-slate-800 text-xs"
                >
                  <option value="">-- All Projects / General Portfolio --</option>
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
                      // If product has a project and no project is explicitly selected, pre-populate
                      ...(prd?.projectId && !prev.projectId
                        ? { projectId: prd.projectId, projectName: prd.projectName || '' }
                        : {}),
                    }));
                    if (prd) {
                      updateQuantityAndSyncArea(form.quantity || 1, prd);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-slate-800 text-xs"
                  required
                >
                  <option value="">-- Choose Plot Product --</option>
                  {products
                    .filter((p) => !form.projectId || !p.projectId || p.projectId === form.projectId)
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

              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity (Units / Pieces) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuantityStep(-1)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold shrink-0"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      updateQuantityAndSyncArea(val);
                    }}
                    onBlur={() => {
                      if (!form.quantity || Number(form.quantity) < 1) {
                        updateQuantityAndSyncArea(1);
                      }
                    }}
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
              </div>

              {/* Editable Custom Unit Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Unit Rate (₹) <span className="text-slate-400 font-normal">(Editable)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={form.customUnitPrice}
                    onChange={(e) => setForm({ ...form, customUnitPrice: e.target.value })}
                    placeholder={selectedProduct?.unitPrice ? String(selectedProduct.unitPrice) : '10000'}
                    className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                  />
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
                    onClick={() => setForm((prev) => ({ ...prev, paymentType: 'MONTHLY_INSTALLMENT' }))}
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
                      <div className="font-bold text-xs">Monthly Installment (EMI / R.D.)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Zero downpayment • Total amount divided equally across tenure months</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, paymentType: 'FULL_PAYMENT' }))}
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
                      <div className="font-bold text-xs">One-Time Full Payment (F.D. Scheme)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">100% upfront settlement with recorded contract deposit/holding period</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tenure Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isFullPayment ? 'Contract Holding Period (Tenure)' : 'EMI Tenure (Months)'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.tenureMonths}
                  onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none font-bold text-slate-800"
                >
                  {tenures.length > 0 ? (
                    tenures.map((t) => (
                      <option key={t._id || t.tenureMonths} value={t.tenureMonths}>
                        {t.tenureMonths} Months ({t.tenureYears || (t.tenureMonths / 12)} Years)
                      </option>
                    ))
                  ) : (
                    [12, 24, 36, 48, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} Months ({m / 12} Years)
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isFullPayment
                    ? 'Records holding period for maturity returns or money-back refund on term completion.'
                    : 'Installments will be equally generated across these months without downpayment.'}
                </p>
              </div>

              {/* Calculated Monthly EMI or Downpayment indicator */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isFullPayment ? 'Upfront Payable' : 'Calculated Monthly EMI (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="text"
                    readOnly
                    value={isFullPayment ? totalAmount.toLocaleString('en-IN') : monthlyEmi.toLocaleString('en-IN')}
                    className="w-full pl-8 pr-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-black font-mono text-xs text-teal-900 cursor-not-allowed outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isFullPayment
                    ? 'Total 100% full amount paid upfront.'
                    : `₹${totalAmount.toLocaleString('en-IN')} ÷ ${tenure} Months = ₹${monthlyEmi.toLocaleString('en-IN')}/mo`}
                </p>
              </div>

              {/* Full Payment Details */}
              {isFullPayment ? (
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
                      <label className="block font-bold text-slate-700 mb-1">Booking &amp; Payment Date <span className="text-rose-500">*</span></label>
                      <input
                        type="date"
                        value={form.bookingDate}
                        onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
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
                  </div>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Booking / Start Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={form.bookingDate}
                    onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none font-semibold text-slate-800"
                    required
                  />
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
                  ) || availableParcels[0];

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

                              const firstParcel = chosenAgr.parcels?.[0];
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
                                khesraNumber: firstParcel?.khesraNumber || chosenAgr.khesraNumber || '',
                                mauja: firstParcel?.mauja || chosenAgr.mauja || '',
                                thanaNumber: firstParcel?.thanaNumber || chosenAgr.thanaNumber || '',
                                khataNumber: firstParcel?.khataNumber || chosenAgr.khataNumber || '',
                                allocatedSqFt: currentAlloc > 0 ? currentAlloc : remainingNeeded,
                              };
                              setLandSourcing(updated);
                            }}
                          >
                            <option value="">-- Select Agreement --</option>
                            {allLandSources.map((agr, aIdx) => (
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
              <div className="text-[11px] text-slate-600">
                Total Area: <b className="text-teal-800 font-bold">{totalRequiredSqFt} Sq.Ft.</b> ({totalRequiredDismil} Dismil)
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
                <span className="text-slate-500 font-medium">Deposit / Tenure Period:</span>
                <span className="font-bold text-teal-800">{tenure} Months</span>
              </div>

              {isFullPayment ? (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <span className="text-emerald-700 font-bold">Paid Upfront:</span>
                  <span className="font-black font-mono text-emerald-700 text-sm">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <span className="text-emerald-700 font-bold">Monthly Installment (EMI):</span>
                  <span className="font-black font-mono text-emerald-700 text-sm">₹{monthlyEmi.toLocaleString('en-IN')}</span>
                </div>
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
                {submitting ? 'Generating Booking...' : 'Confirm & Generate Booking'}
              </button>
            </div>
          </div>


        </div>
      </form>

    </div>
  );
};

export default ProductBookingPage;
