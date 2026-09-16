import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Coins,
  PiggyBank,
  TrendingUp,
  User,
  Calendar,
  Check,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

const InvestmentNewAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type')?.toUpperCase() === 'FD' ? 'FD' : 'RD';

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [config, setConfig] = useState(null);

  const [form, setForm] = useState({
    accountType: initialType, // 'RD' or 'FD'
    customerId: '',
    sponsorId: '',
    depositAmount: initialType === 'FD' ? 10000 : 2000,
    tenureMonths: 24,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const [custRes, sponRes, confRes] = await Promise.all([
          api.get('/plots/customers'),
          api.get('/plots/sponsors'),
          api.get('/investments/config'),
        ]);

        setCustomers(custRes.data.data?.customers || custRes.data.data || []);
        setSponsors(sponRes.data.data?.sponsors || sponRes.data.data || []);
        if (confRes.data.data) {
          setConfig(confRes.data.data);
          const defaultTenure = confRes.data.data.slabs?.[0]?.tenureMonths || 24;
          const defaultDeposit = initialType === 'FD'
            ? (confRes.data.data.minFdAmount || 10000)
            : (confRes.data.data.minRdAmount || 2000);
          setForm((prev) => ({
            ...prev,
            accountType: initialType,
            tenureMonths: defaultTenure,
            depositAmount: defaultDeposit,
          }));
        }
      } catch (err) {
        toast.error('Failed to initialize investment account form');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [initialType]);

  const handleCustomerChange = (custId) => {
    const cust = customers.find((c) => c._id === custId);
    setForm((prev) => ({
      ...prev,
      customerId: custId,
      sponsorId: cust?.sponsorId?._id || cust?.sponsorId || '',
    }));
  };


  // Live Calculations
  const currentSlab = config?.slabs?.find((s) => s.tenureMonths === Number(form.tenureMonths)) || {
    rdMaturityPercent: 112,
    fdMaturityPercent: 121,
    rdPromoterCommissionPercent: 4.0,
    fdPromoterCommissionPercent: 5.0,
    developerCommissionPercent: 1.0,
  };

  const returnPercent =
    form.accountType === 'RD' ? currentSlab.rdMaturityPercent : currentSlab.fdMaturityPercent;

  const numDeposit = Number(form.depositAmount) || 0;
  const totalDepositExpected =
    form.accountType === 'RD' ? numDeposit * Number(form.tenureMonths) : numDeposit;
  const maturityAmount = Math.round((totalDepositExpected * returnPercent) / 100);

  // Compute maturity date
  const sDate = form.startDate ? new Date(form.startDate) : new Date();
  const mDate = new Date(sDate);
  mDate.setMonth(mDate.getMonth() + Number(form.tenureMonths));

  const selectedCustObj = customers.find((c) => c._id === form.customerId);
  const selectedSponObj =
    (selectedCustObj?.sponsorId && typeof selectedCustObj.sponsorId === 'object'
      ? selectedCustObj.sponsorId
      : sponsors.find((s) => s._id === form.sponsorId)) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) return toast.warn('Please select a customer');

    setSubmitLoading(true);
    try {
      const res = await api.post('/investments/accounts', form);
      toast.success(`${form.accountType} Account ${res.data.data.accountNumber} created successfully!`);
      navigate(`/dashboard/investments/accounts`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create investment account');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader title="Initializing New Account..." subtitle="Loading customers, sponsors, and scheme matrix" />;
  }

  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
  const inputCls =
    'h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs md:text-sm text-slate-800 transition';

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              {form.accountType === 'RD' ? <Coins size={22} /> : <TrendingUp size={22} />}
            </span>
            {form.accountType === 'RD' ? 'Open New Recurring Deposit (R.D.) Account' : 'Open New Fixed Deposit (F.D.) Account'}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            {form.accountType === 'RD'
              ? 'Register a new Recurring Deposit (R.D.) plan with monthly installments, guaranteed returns and sponsor linkage.'
              : 'Register a new Fixed Deposit (F.D.) plan with guaranteed returns and sponsor linkage.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Plan Type Banner (Locked) */}
          <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    form.accountType === 'RD' ? 'bg-teal-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {form.accountType === 'RD' ? <Coins size={22} /> : <TrendingUp size={22} />}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {form.accountType === 'RD' ? 'Recurring Deposit (R.D.)' : 'Fixed Deposit (F.D.)'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {form.accountType === 'RD'
                      ? 'मासिक किस्त (Monthly Installments) • Guaranteed Scheme'
                      : 'एक मुश्त जमा (One-time Lump Sum) • Guaranteed Scheme'}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  form.accountType === 'RD'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {form.accountType === 'RD' ? 'Plan: Recurring Deposit' : 'Plan: Fixed Deposit'}
              </span>
            </div>
          </div>

          {/* Customer Selection & Auto-linked Sponsor */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User size={16} className="text-teal-700" />
              Customer / Investor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Select Customer *</label>
                <select
                  className={inputCls}
                  value={form.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {Array.isArray(customers) &&
                    customers.map((c) => {
                      const custCode = c.customerCode || c.customerId || c.mobile || '';
                      return (
                        <option key={c._id} value={c._id}>
                          {c.name} {custCode ? `(${custCode})` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className={labelCls}>Assigned Sponsor</label>
                <div className="h-10 flex items-center px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 font-medium select-none">
                  {selectedCustObj ? (
                    selectedCustObj.sponsorId?.name ? (
                      <span className="flex items-center gap-1.5 text-teal-800 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                        {selectedCustObj.sponsorId.name}{' '}
                        <span className="text-[11px] text-slate-500 font-normal">
                          ({selectedCustObj.sponsorId.sponsorCode || 'Sponsor'})
                        </span>
                      </span>
                    ) : selectedSponObj ? (
                      <span className="flex items-center gap-1.5 text-teal-800 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                        {selectedSponObj.name}{' '}
                        <span className="text-[11px] text-slate-500 font-normal">
                          ({selectedSponObj.sponsorCode || 'Sponsor'})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Direct / No Sponsor</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Auto-linked on customer selection</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Scheme & Tenure Details */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar size={16} className="text-teal-700" />
              Plan Terms & Deposit Sizing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>
                  {form.accountType === 'RD' ? 'Monthly Deposit (₹)' : 'Principal Deposit (₹)'} *
                </label>
                <input
                  type="number"
                  step={form.accountType === 'RD' ? config?.rdStepAmount || 1000 : config?.fdStepAmount || 1000}
                  min={form.accountType === 'RD' ? config?.minRdAmount || 2000 : config?.minFdAmount || 50000}
                  className={inputCls}
                  value={form.depositAmount}
                  onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })}
                  required
                />
                <span className="text-[10px] text-slate-400">
                  {form.accountType === 'RD'
                    ? `Min ₹${config?.minRdAmount || 2000} (Steps of ₹${config?.rdStepAmount || 1000})`
                    : `Min ₹${config?.minFdAmount || 50000} (Steps of ₹${config?.fdStepAmount || 1000})`}
                </span>
              </div>

              <div>
                <label className={labelCls}>Tenure Period *</label>
                <select
                  className={inputCls}
                  value={form.tenureMonths}
                  onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })}
                  required
                >
                  {config?.slabs?.map((slab) => (
                    <option key={slab.tenureMonths} value={slab.tenureMonths}>
                      {slab.tenureMonths} Months ({slab.tenureMonths / 12} Years) —{' '}
                      {form.accountType === 'RD' ? `${slab.rdMaturityPercent}%` : `${slab.fdMaturityPercent}%`} Return
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Account Start Date *</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Summary Card */}
        <div className="space-y-5">
          <div className="bg-white border border-teal-200 rounded-3xl p-6 shadow-md space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-teal-100 pb-3">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                {form.accountType === 'RD' ? 'Recurring Deposit Summary' : 'Fixed Deposit Summary'}
              </span>
              <span className="text-xs font-black bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                {returnPercent}% Payout
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total Expected Deposit:</span>
                <span className="font-bold text-slate-900 font-mono">₹{totalDepositExpected.toLocaleString('en-IN')}</span>
              </div>
              {form.accountType === 'RD' && (
                <div className="flex justify-between">
                  <span>Monthly Installment:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{numDeposit.toLocaleString('en-IN')} × {form.tenureMonths} Mos
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Maturity Return Rate:</span>
                <span className="font-bold text-emerald-700 font-mono">{returnPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Maturity Date:</span>
                <span className="font-bold text-slate-800">
                  {mDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-teal-800 to-emerald-900 text-white rounded-2xl space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-teal-200">Guaranteed Maturity Value</span>
              <p className="text-2xl font-black font-mono tracking-tight">₹{maturityAmount.toLocaleString('en-IN')}</p>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={16} />
              {submitLoading ? 'Opening Account...' : 'Confirm & Issue Account'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvestmentNewAccount;
