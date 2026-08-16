import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlineUserPlus, HiOutlineCheck, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
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
    scheme: 'FULL_PAYMENT',
    bookingAmount: '',
    emiAmount: '',
    installmentCount: '100',
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

  const [emiType, setEmiType] = useState('MONTH'); // 'MONTH' or 'AMOUNT'

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    // Fetch ALL plots and series to show visual layout
    const loadInitData = async () => {
      try {
        const [plotsRes, seriesRes] = await Promise.all([
          api.get('/plots?limit=5000'),
          api.get('/plots/series')
        ]);
        setPlots(plotsRes.data.data || []);
        setSeriesList(seriesRes.data.data || []);
        setLoading(false);
      } catch {
        toast.error('Failed to load plot inventory data');
        setLoading(false);
      }
    };
    loadInitData();
  }, []);

  // Search onboarded plot customers only
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
          limit: 10
        }
      })
        .then(res => {
          const list = res.data.data?.customers || res.data.customers || res.data.data || [];
          setSearchResults(list);
        })
        .catch(() => setSearchResults([]));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCustomer]);

  const [discountType, setDiscountType] = useState('RUPEE'); // 'RUPEE', 'PERCENT', or 'SQFT_RATE'
  const [discountVal, setDiscountVal] = useState('');
  const [govtRate, setGovtRate] = useState('100'); // default 100 / sqft

  // Helper to calculate total discount in Rupees
  const calculateDiscountAmount = (type, val, targetPlot) => {
    const num = Number(val) || 0;
    if (num <= 0 || !targetPlot) return 0;

    const plotVal = targetPlot.totalPlotValue || 0;
    const plotArea = targetPlot.plotSize || targetPlot.area || targetPlot.sizeSqFt || (targetPlot.sizeSqYd ? targetPlot.sizeSqYd * 9 : 0); // Plot size in Sq.Ft.

    if (type === 'PERCENT') {
      return Math.round((plotVal * num) / 100);
    } else if (type === 'SQFT_RATE') {
      // If user enters discount per sq.ft. (e.g., 50 rs discount per sq.ft. on a 2400 sq.ft. plot = 2400 * 50 = 1,20,000 rs discount)
      return Math.round(plotArea * num);
    }
    return num;
  };

  const selectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setSearchQuery(cust.name);
    setSearchResults([]);
    const sId = cust.sponsorId?._id || cust.sponsorId || '';
    setForm(f => ({ ...f, customerId: cust._id, sponsorId: sId }));
  };

  const handlePlotSelect = (plotId) => {
    const p = plots.find(item => item._id === plotId);
    if (!p) return;

    if (p.status === 'BOOKED' || p.status === 'REGISTERED') {
      toast.error(`Plot ${p.plotNumber} is already ${p.status.toLowerCase()}`);
      return;
    }

    setSelectedPlot(p);
    const discAmt = calculateDiscountAmount(discountType, discountVal, p);
    const net = Math.max(0, p.totalPlotValue - discAmt);
    setForm(f => ({
      ...f,
      plotId: p._id,
      discount: String(discAmt),
      bookingAmount: f.scheme === 'FULL_PAYMENT' ? String(net) : '0',
      emiAmount: f.scheme === 'MONTHLY_INSTALLMENT' ? String(Math.floor(net / 100)) : ''
    }));
  };

  const handleDiscountChange = (type, val) => {
    setDiscountType(type);
    setDiscountVal(val);
    const discAmt = calculateDiscountAmount(type, val, selectedPlot);
    const plotVal = selectedPlot?.totalPlotValue || 0;
    const net = Math.max(0, plotVal - discAmt);

    setForm(f => {
      const updated = { ...f, discount: String(discAmt) };
      if (f.scheme === 'FULL_PAYMENT') {
        updated.bookingAmount = String(net);
      } else {
        const dp = Number(f.bookingAmount) || 0;
        if (emiType === 'MONTH') {
          const m = Number(f.installmentCount) || 100;
          updated.emiAmount = m > 0 ? String(Math.floor((net - dp) / m)) : '0';
        } else {
          const emi = Number(f.emiAmount) || 1000;
          updated.installmentCount = emi > 0 ? String(Math.ceil((net - dp) / emi)) : '100';
        }
      }
      return updated;
    });
  };

  const handleDownpaymentChange = (val) => {
    setForm(f => {
      const dp = Number(val) || 0;
      const net = Math.max(0, (selectedPlot?.totalPlotValue || 0) - (Number(f.discount) || 0));
      const updated = { ...f, bookingAmount: val };

      if (f.scheme === 'MONTHLY_INSTALLMENT') {
        if (emiType === 'MONTH') {
          const m = Number(f.installmentCount) || 100;
          updated.emiAmount = m > 0 ? String(Math.floor((net - dp) / m)) : '0';
        } else {
          const emi = Number(f.emiAmount) || 1000;
          updated.installmentCount = emi > 0 ? String(Math.ceil((net - dp) / emi)) : '100';
        }
      }
      return updated;
    });
  };

  const handleMonthsChange = (val) => {
    setForm(f => {
      const m = Number(val) || 1;
      const net = Math.max(0, (selectedPlot?.totalPlotValue || 0) - (Number(f.discount) || 0));
      const dp = Number(f.bookingAmount) || 0;
      const emi = m > 0 ? Math.floor((net - dp) / m) : 0;
      return {
        ...f,
        installmentCount: val,
        emiAmount: String(emi)
      };
    });
  };

  const handleEmiAmountChange = (val) => {
    setForm(f => {
      const emi = Number(val) || 1;
      const net = Math.max(0, (selectedPlot?.totalPlotValue || 0) - (Number(f.discount) || 0));
      const dp = Number(f.bookingAmount) || 0;
      const m = Math.ceil((net - dp) / emi);
      return {
        ...f,
        emiAmount: val,
        installmentCount: String(m)
      };
    });
  };

  const handleSchemeChange = (scheme) => {
    const net = Math.max(0, (selectedPlot?.totalPlotValue || 0) - (Number(form.discount) || 0));
    setForm(f => {
      const updated = { ...f, scheme };
      if (scheme === 'FULL_PAYMENT') {
        updated.bookingAmount = String(net);
        updated.emiAmount = '';
        updated.installmentCount = '1';
      } else {
        updated.bookingAmount = '0';
        updated.installmentCount = '1';
        updated.emiAmount = String(Math.floor(net / 1));
      }
      return updated;
    });
  };

  const handleEmiTypeChange = (type) => {
    setEmiType(type);
    const net = Math.max(0, (selectedPlot?.totalPlotValue || 0) - (Number(form.discount) || 0));
    const dp = Number(form.bookingAmount) || 0;

    setForm(f => {
      const updated = { ...f };
      if (type === 'MONTH') {
        const m = Number(f.installmentCount) || 100;
        const emi = m > 0 ? Math.floor((net - dp) / m) : 0;
        updated.installmentCount = String(m);
        updated.emiAmount = String(emi);
      } else {
        let emi = Number(f.emiAmount) || Math.floor(net / 100);
        if (emi <= 0) emi = 1000;
        const m = Math.ceil((net - dp) / emi);
        updated.emiAmount = String(emi);
        updated.installmentCount = String(m);
      }
      return updated;
    });
  };

  const getDivisorSuggestions = (principal, emiAmount) => {
    if (!principal || principal <= 0 || !emiAmount || emiAmount <= 0) return [];
    const sugs = [];
    for (let m = 12; m <= 240; m++) {
      if (Math.round(principal * 100) % m === 0) {
        const emi = principal / m;
        sugs.push({
          emi,
          months: m,
          diff: Math.abs(emi - emiAmount)
        });
      }
    }
    return sugs.sort((a, b) => a.diff - b.diff).slice(0, 3);
  };

  const handleApplySuggestion = (sug) => {
    setForm(f => ({
      ...f,
      emiAmount: String(sug.emi),
      installmentCount: String(sug.months)
    }));
  };

  const nextStep = () => {
    if (step === 1 && !selectedCustomer) {
      return toast.error('Please choose a customer first');
    }
    if (step === 2 && !selectedPlot) {
      return toast.error('Please choose a plot first');
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plotId) return toast.error('Please select a plot');
    if (!form.customerId) return toast.error('Please select a customer');

    setSubmitLoading(true);
    try {
      const payload = {
        ...form,
        govtRate: Number(govtRate) || 100,
        installmentCount: form.scheme === 'MONTHLY_INSTALLMENT' ? Number(form.installmentCount) || 100 : undefined,
        installmentAmount: form.scheme === 'MONTHLY_INSTALLMENT' ? Number(form.emiAmount) || undefined : undefined,
        oneTimeMonths: form.scheme === 'FULL_PAYMENT' ? Number(form.oneTimeMonths) || 1 : undefined,
      };
      const res = await api.post('/plots/bookings', payload);
      const receipt = res.data.data?.receipt;
      toast.success('Plot booked successfully');

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
      <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 min-h-screen">
        Loading plot booking wizard...
      </div>
    );
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="p-6 bg-slate-50 min-h-screen select-none max-w-6xl mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create Plot Booking</h1>
        <p className="text-slate-500 text-sm">Step-by-step wizard to register a new plot booking.</p>
      </div>

      {/* Step Indicators */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl w-full">
        <div className="relative flex items-center justify-between w-full">
          {/* Progress bar line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 transition-all duration-300 z-0 rounded-full bg-primary"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Step 1 */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-4">
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition duration-200 ${step === 1 ? 'bg-primary text-white ring-4 ring-slate-100' : step > 1 ? 'bg-emerald-500 text-white cursor-pointer' : 'bg-slate-100 text-slate-400'
                }`}
            >
              {step > 1 ? <HiOutlineCheck className="text-base" /> : '1'}
            </button>
            <span className={`text-xs font-bold ${step === 1 ? 'text-slate-800' : 'text-slate-400'}`}>1. Customer Details</span>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-4">
            <button
              type="button"
              onClick={() => step > 2 && setStep(2)}
              disabled={step < 2}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition duration-200 ${step === 2 ? 'bg-primary text-white ring-4 ring-slate-100' : step > 2 ? 'bg-emerald-500 text-white cursor-pointer' : 'bg-slate-100 text-slate-400'
                }`}
            >
              {step > 2 ? <HiOutlineCheck className="text-base" /> : '2'}
            </button>
            <span className={`text-xs font-bold ${step === 2 ? 'text-slate-800' : 'text-slate-400'}`}>2. Plot Inventory</span>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition duration-200 ${step === 3 ? 'bg-primary text-white ring-4 ring-slate-100' : 'bg-slate-100 text-slate-400'
              }`}>
              3
            </div>
            <span className={`text-xs font-bold ${step === 3 ? 'text-slate-800' : 'text-slate-400'}`}>3. Terms & Payment</span>
          </div>
        </div>
      </div>

      {/* Grid Layout containing Main Column and Side Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">

        {/* Main Form/Controls (takes 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">

          {/* STEP 1: CHOOSE CUSTOMER */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">1. Select Plot Customer</h3>

              <div className="flex flex-col gap-1.5 relative">
                <label className={labelCls}>Search Onboarded Customer</label>
                <div className="relative">
                  <input
                    className={`${inputCls} pl-10 pr-10`}
                    placeholder="Search plot customers by ID (e.g. GNC-26-27-001), name, mobile..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                        setSelectedCustomer(null);
                        setForm(f => ({ ...f, customerId: '' }));
                      }
                    }}
                  />
                  <HiOutlineMagnifyingGlass className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCustomer(null);
                        setForm(f => ({ ...f, customerId: '' }));
                        setSearchResults([]);
                      }}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-[4.5rem] left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-xl z-[100] max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map(c => (
                      <div
                        key={c._id}
                        onClick={() => selectCustomer(c)}
                        className="p-3 cursor-pointer hover:bg-slate-50 transition flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <strong className="text-slate-800">{c.name} {c.customerCode ? `(${c.customerCode})` : ''}</strong>
                          <span className="text-slate-500">{c.mobile || 'No Mobile'}</span>
                        </div>
                        <span className="text-indigo-600 font-mono font-bold tracking-wider">{c.customerCode || c.customerId || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedCustomer ? (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{selectedCustomer.name}</span>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded">
                      {selectedCustomer.customerCode || selectedCustomer.customerId || 'ID N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-100/60">
                    <div><span className="text-slate-500">Mobile:</span> {selectedCustomer.mobile || 'N/A'}</div>
                    <div><span className="text-slate-500">Email:</span> {selectedCustomer.email || 'N/A'}</div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Assigned Sponsor:</span>{' '}
                      <span className="font-semibold text-slate-800">
                        {selectedCustomer.sponsorId?.name 
                          ? `${selectedCustomer.sponsorId.name} (${selectedCustomer.sponsorId.sponsorCode || 'Sponsor'})`
                          : 'Direct / Company'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No customer selected.</p>
                  <p className="text-xs text-slate-500">If the customer is not registered yet, onboard them first on the customers page.</p>
                  <Link
                    to="/dashboard/plots/customers/new"
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition bg-primary"
                  >
                    <HiOutlineUserPlus className="w-4 h-4" /> Add New Customer Page
                  </Link>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 text-white font-medium text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5 bg-primary"
                >
                  Next: Choose Plot <HiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE PLOT */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">2. Select Plot</h3>
                {selectedPlot && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Selected Plot: {selectedPlot.plotNumber}
                  </span>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 border border-slate-200 p-3.5 rounded-xl bg-slate-50">
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded-sm" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded-sm" /> Hold</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm opacity-60" /> Booked / Registered</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-primary rounded-sm" /> Selected</span>
              </div>

              {/* Plot Series Maps */}
              <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-1">
                {seriesList.map(s => {
                  const seriesPlots = plots.filter(p => p.seriesId?._id === s._id || p.seriesId === s._id);
                  return (
                    <div key={s._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                      {/* Series Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">{s.prefix}-Plot Series ({s.name})</span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">Plots: {seriesPlots.length}</span>
                      </div>

                      {/* Visual Plot Grid */}
                      {seriesPlots.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No plots generated for this series.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2">
                          {seriesPlots.map(p => {
                            const isAvailable = p.status === 'AVAILABLE';
                            const isCorner = p.plotType === 'CORNER';
                            const isHold = p.status === 'HOLD';
                            const isBooked = p.status === 'BOOKED' || p.status === 'REGISTERED';
                            const isSelected = form.plotId === p._id;

                            let colorCls = "";
                            if (isSelected) {
                              colorCls = "bg-indigo-600 border-indigo-700 text-white shadow-sm ring-2 ring-indigo-500/20";
                            } else if (isHold) {
                              colorCls = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
                            } else if (isBooked) {
                              colorCls = "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60";
                            } else {
                              // Available
                              colorCls = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
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
                  <HiChevronLeft /> Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  Next: Payment Details <HiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT SCHEME & BOOKING INFO */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">3. Contract Terms & Final Payment</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Booking Date</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.bookingDate}
                    onChange={e => setForm({ ...form, bookingDate: e.target.value })}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Payment Type</label>
                  <select
                    className={inputCls}
                    value={form.scheme}
                    onChange={e => handleSchemeChange(e.target.value)}
                  >
                    <option value="FULL_PAYMENT">One Time</option>
                    <option value="MONTHLY_INSTALLMENT">Installment</option>
                  </select>
                </div>


                {/* Discount Input with Dropdown (₹, %, or ₹/Sq.Ft.) */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Discount</label>
                  <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
                    <select
                      value={discountType}
                      onChange={(e) => handleDiscountChange(e.target.value, discountVal)}
                      className="px-3 py-2.5 bg-slate-100 text-xs font-bold text-slate-700 border-r border-slate-300 outline-none cursor-pointer"
                    >
                      <option value="RUPEE">₹ (Flat)</option>
                      <option value="PERCENT">% (Percentage)</option>
                      <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                    </select>
                    <input
                      className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none text-slate-800"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={discountVal}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleDiscountChange(discountType, val);
                      }}
                      placeholder={
                        discountType === 'PERCENT'
                          ? "e.g. 10%"
                          : discountType === 'SQFT_RATE'
                            ? "e.g. 50 (₹/Sq.Ft.)"
                            : "e.g. 5000 (Flat ₹)"
                      }
                    />
                  </div>
                  {discountType === 'PERCENT' && discountVal && selectedPlot && (
                    <span className="text-[0.68rem] text-emerald-700 font-semibold px-1">
                      Calculated Discount: ₹{Number(form.discount || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountType === 'SQFT_RATE' && discountVal && selectedPlot && (
                    <span className="text-[0.68rem] text-emerald-700 font-semibold px-1">
                      Calculated Discount ({(selectedPlot.plotSize || selectedPlot.area || selectedPlot.sizeSqFt || 0).toLocaleString('en-IN')} Sq.Ft. × ₹{discountVal}/Sq.Ft.): ₹{Number(form.discount || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Govt. Rate / Sq.Ft. (Default 100) */}
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Govt. Rate (₹ / Sq.Ft.)</label>
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={govtRate}
                    onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Govt rate per sqft (Default 100)"
                  />
                </div>

                {form.scheme === 'FULL_PAYMENT' ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Final Payment (₹)</label>
                      <input
                        className={`${inputCls} bg-slate-100 cursor-not-allowed`}
                        type="text"
                        inputMode="numeric"
                        value={form.bookingAmount}
                        disabled
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Payment Period (Months)</label>
                      <input
                        className={inputCls}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.oneTimeMonths || 1}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setForm({ ...form, oneTimeMonths: val ? Number(val) : 1 });
                        }}
                        placeholder="Enter months (e.g. 1, 2, 6, 12)"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Downpayment / Booking Amount (₹)</label>
                      <input
                        className={inputCls}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.bookingAmount}
                        onChange={e => handleDownpaymentChange(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Downpayment amount"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Downpayment Period (Months)</label>
                      <input
                        className={inputCls}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.downpaymentMonths || 1}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setForm({ ...form, downpaymentMonths: val ? Number(val) : 1 });
                        }}
                        placeholder="Enter months (e.g. 1)"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Installment Period (Months)</label>
                      <input
                        className={inputCls}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={form.installmentCount}
                        onChange={e => handleMonthsChange(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter months (e.g. 1)"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={labelCls}>Calculated EMI Amount (₹ / month)</label>
                      <input
                        className={`${inputCls} bg-slate-100 cursor-not-allowed`}
                        type="text"
                        inputMode="numeric"
                        value={form.emiAmount}
                        disabled
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className={labelCls}>Booking Notes</label>
                  <textarea
                    className="w-full min-h-[70px] bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl text-sm text-slate-800 transition resize-none"
                    placeholder="Internal contract execution comments..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={submitLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-medium text-xs text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <HiChevronLeft /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 text-white rounded-xl font-medium text-xs cursor-pointer transition min-w-[150px] flex items-center justify-center shadow-sm bg-primary"
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
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col gap-4">
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
                        {selectedCustomer.sponsorId ? `${selectedCustomer.sponsorId.name} ${selectedCustomer.sponsorId.sponsorCode ? `(${selectedCustomer.sponsorId.sponsorCode})` : ''}` : 'Direct / Company (No Sponsor)'}
                      </span>
                    </div>
                    {selectedCustomer.address && (
                      <div className="flex flex-col">
                        <span className="text-[0.68rem] text-slate-400 uppercase">Address</span>
                        <span className="text-slate-700 leading-relaxed">{selectedCustomer.address}</span>
                      </div>
                    )}
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
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col gap-4">
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
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Base Rate</span>
                      <span className="text-slate-800">₹{selectedPlot.baseRate} / Sq Ft</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.68rem] text-slate-400 uppercase">Effective Rate</span>
                      <span className="text-slate-800">₹{selectedPlot.effectiveRate} / Sq Ft</span>
                    </div>
                    <div className="flex flex-col pt-2 border-t border-slate-100 font-bold text-sm">
                      <span className="text-[0.68rem] text-slate-400 uppercase font-semibold">Total Plot Value</span>
                      <span className="text-indigo-600 mt-0.5">₹{selectedPlot.totalPlotValue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 font-bold">No Plot Selected</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Please select a plot number from the dropdown list to see details.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">Booking Summary</h3>
              <div className="flex flex-col gap-4 text-xs font-semibold">

                {/* Customer Info */}
                {selectedCustomer && (
                  <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                    <span className="text-[0.68rem] text-slate-400 uppercase">Customer</span>
                    <span className="font-bold text-slate-800 capitalize">{selectedCustomer.name} || {selectedCustomer.customerCode || ''} </span>
                  </div>
                )}

                {/* Plot Info */}
                {selectedPlot && (
                  <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                    <span className="text-[0.68rem] text-slate-400 uppercase">Selected Plot</span>
                    <span className="font-bold text-slate-800">Plot {selectedPlot.plotNumber} ({selectedPlot.plotSize} Sq Ft)</span>
                    <span className="text-slate-500 font-medium">Type: {selectedPlot.plotType}</span>
                    <span className="text-slate-800 font-bold mt-1">Total: ₹{selectedPlot.totalPlotValue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Scheme & Payment Overview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[0.68rem] text-slate-400 uppercase">Booking Terms</span>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Payment Scheme:</span>
                    <span className="font-bold text-slate-800">
                      {form.scheme === 'FULL_PAYMENT' ? 'One Time' : "Installment"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Booking Date:</span>
                    <span className="font-bold text-slate-800">
                      {form.bookingDate}
                    </span>
                  </div>
                  {Number(form.discount) > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span>- ₹{Number(form.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedPlot && (
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="text-slate-500">Net Price:</span>
                      <span className="font-bold text-slate-800">
                        ₹{(selectedPlot.totalPlotValue - (Number(form.discount) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Final Payment:</span>
                    <span className="text-emerald-700 font-bold">₹{(Number(form.bookingAmount) || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {selectedPlot && (
                    <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-bold text-slate-700">
                      <span>EMI Balance:</span>
                      <span>₹{Math.max(0, (selectedPlot.totalPlotValue - (Number(form.discount) || 0)) - (Number(form.bookingAmount) || 0)).toLocaleString('en-IN')}</span>
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
