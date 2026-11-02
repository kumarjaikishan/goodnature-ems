import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Sliders,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Lock,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import api from '../../../../api/axios';
import PageLoader from '../../../../components/common/PageLoader';

const generateDefaultScaleSlabs = () => {
  const list = [];
  for (let m = 0; m <= 24; m++) {
    if (m <= 20) {
      list.push({
        tenureMonths: m,
        action: 'DEDUCT',
        percentage: 20 - m,
      });
    } else {
      list.push({
        tenureMonths: m,
        action: 'ADD',
        percentage: m - 20,
      });
    }
  }
  return list;
};

export const PlotPriceCalculatorTab = () => {
  const [loading, setLoading] = useState(true);
  const [rateConfig, setRateConfig] = useState(null);
  const [emiTenureSlabs, setEmiTenureSlabs] = useState([]);

  // Calculator inputs
  const [plotArea, setPlotArea] = useState(1200); // Sq.Ft.
  const [baseSqFtRate, setBaseSqFtRate] = useState(1250); // Fixed from Admin Settings (₹ / Sq.Ft.)
  const [selectedTenure, setSelectedTenure] = useState(0); // 0 = One-Time / All Downpayment (20% Discount)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/plots/rate-config');
        const data = res.data?.data || res.data || {};
        setRateConfig(data);
        if (data.baseSqFtRate) {
          setBaseSqFtRate(Number(data.baseSqFtRate));
        }
        if (Array.isArray(data.emiTenureAdjustments) && data.emiTenureAdjustments.length > 0) {
          setEmiTenureSlabs(data.emiTenureAdjustments);
        } else {
          setEmiTenureSlabs(generateDefaultScaleSlabs());
        }
      } catch (err) {
        console.error('Failed to load plot rate config for calculator:', err);
        setEmiTenureSlabs(generateDefaultScaleSlabs());
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Safe tenure integer
  const tenureMonths = useMemo(() => {
    if (selectedTenure === '' || isNaN(selectedTenure)) return 0;
    return Math.max(0, parseInt(selectedTenure, 10));
  }, [selectedTenure]);

  // Base Gross Plot Value = Plot Area * Fixed Base SqFt Rate
  const grossPlotValue = useMemo(() => {
    return Math.round((Number(plotArea) || 0) * (Number(baseSqFtRate) || 0));
  }, [plotArea, baseSqFtRate]);

  // Tenure adjustment lookup based on EMI Months
  // 0 month = 20% discount
  // 1 to 19 months = (20 - m)% discount (1% less discount per month)
  // 20 months = 0% standard base rate
  // 21+ months = (m - 20)% markup added (+1% per month)
  const currentAdjustment = useMemo(() => {
    const matched = emiTenureSlabs.find((s) => Number(s.tenureMonths) === tenureMonths);
    if (!matched) {
      if (tenureMonths === 0) return { action: 'DEDUCT', percentage: 20 };
      if (tenureMonths <= 20) return { action: 'DEDUCT', percentage: Math.max(0, 20 - tenureMonths) };
      return { action: 'ADD', percentage: tenureMonths - 20 };
    }
    return {
      action: matched.action === 'ADD' ? 'ADD' : 'DEDUCT',
      percentage: Number(matched.percentage) || 0,
    };
  }, [tenureMonths, emiTenureSlabs]);

  // Adjustment amount in ₹
  const adjustmentAmount = useMemo(() => {
    return Math.round((grossPlotValue * currentAdjustment.percentage) / 100);
  }, [grossPlotValue, currentAdjustment]);

  // Final Net Plot Value
  const netPlotValue = useMemo(() => {
    if (currentAdjustment.action === 'DEDUCT') {
      return Math.max(0, grossPlotValue - adjustmentAmount);
    }
    return grossPlotValue + adjustmentAmount;
  }, [grossPlotValue, adjustmentAmount, currentAdjustment]);

  // Effective per sqft rate
  const effectivePerSqFt = useMemo(() => {
    if (!plotArea || Number(plotArea) === 0) return 0;
    return Math.round((netPlotValue / Number(plotArea)) * 100) / 100;
  }, [netPlotValue, plotArea]);

  // Downpayment & EMI breakdown
  const isOneTime = tenureMonths === 0;

  const downpaymentAmount = useMemo(() => {
    if (isOneTime) return netPlotValue; // 100% full downpayment for 0 month
    // For EMI plan, downpayment is always fixed 40% of gross plot value (discount not deducted from downpayment)
    return Math.round((grossPlotValue * 40) / 100);
  }, [grossPlotValue, netPlotValue, isOneTime]);

  const remainingEmiPrincipal = useMemo(() => {
    if (isOneTime) return 0;
    return Math.max(0, netPlotValue - downpaymentAmount);
  }, [netPlotValue, downpaymentAmount, isOneTime]);

  const monthlyEmi = useMemo(() => {
    if (isOneTime || tenureMonths === 0) return 0;
    return Math.round(remainingEmiPrincipal / tenureMonths);
  }, [remainingEmiPrincipal, tenureMonths, isOneTime]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <PageLoader title="Loading Plot Price Calculator..." subtitle="Fetching real-time tenure slabs" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50/40 to-slate-50 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-700 text-white shadow-xs">
            <Calculator size={22} />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Plot Price &amp; Tenure Discount Calculator
          </h3>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Inputs Column (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Sliders size={15} className="text-teal-700" />
            <span>Plot &amp; Tenure Parameters</span>
          </h4>

          {/* 1. Plot Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Plot Area (Sq.Ft.)
            </label>
            <div className="relative flex items-center">
              <input
                type="tel"
                inputMode="numeric"
                value={plotArea}
                onChange={(e) => setPlotArea(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1200"
                className="w-full h-10 px-3 pr-16 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400">Sq.Ft.</span>
            </div>
            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {[600, 800, 1000, 1200, 1500, 2000].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPlotArea(sz)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                    Number(plotArea) === sz
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Fixed Plot Selling Rate (Admin Base Rate) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Plot Selling Rate (Base)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-slate-500">₹</span>
              <input
                type="text"
                readOnly
                disabled
                value={baseSqFtRate}
                className="w-full h-10 pl-7 pr-16 bg-slate-100/90 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed select-none"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-500">/ Sq.Ft.</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Globally configured by admin in Plot Series Master settings.
            </p>
          </div>

          {/* 3. EMI Tenure in Months */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                EMI Tenure (Months)
              </label>
              <span className="text-[11px] font-bold text-teal-800">
                {tenureMonths === 0 ? '0 Month (All Downpayment)' : `${tenureMonths} Months EMI`}
              </span>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTenure((prev) => Math.max(0, (parseInt(prev, 10) || 0) - 1))}
                disabled={tenureMonths <= 0}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 transition cursor-pointer text-base border border-slate-200"
                title="Decrease 1 Month (+1% Discount)"
              >
                −
              </button>
              <div className="relative flex-1 flex items-center">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={selectedTenure}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setSelectedTenure(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="0"
                  className="w-full h-10 px-3 pr-20 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
                <span className="absolute right-3 text-xs font-bold text-slate-400">
                  Month(s)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenure((prev) => (parseInt(prev, 10) || 0) + 1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition cursor-pointer text-base border border-slate-200"
                title="Increase 1 Month (-1% Discount)"
              >
                +
              </button>
            </div>

            {/* Live Explanation Banner */}
            <div className="mt-2.5 p-2.5 rounded-xl border text-xs transition-all duration-150 bg-slate-50 border-slate-200">
              {tenureMonths === 0 ? (
                <div className="flex items-start gap-2 text-emerald-900">
                  <Sparkles size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-bold">0 Month (All Downpayment / One-Time):</strong> Receives maximum{' '}
                    <span className="font-extrabold text-emerald-700 underline">20% Discount</span> on total plot value.
                  </p>
                </div>
              ) : tenureMonths <= 19 ? (
                <div className="flex items-start gap-2 text-teal-900">
                  <TrendingDown size={15} className="text-teal-700 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-bold">{tenureMonths} Month{tenureMonths > 1 ? 's' : ''} EMI:</strong> Receives{' '}
                    <span className="font-extrabold text-teal-800 underline">{currentAdjustment.percentage}% Discount</span>{' '}
                    (decreases 1% per EMI month from 20%).
                  </p>
                </div>
              ) : tenureMonths === 20 ? (
                <div className="flex items-start gap-2 text-slate-800">
                  <CheckCircle2 size={15} className="text-slate-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-bold">20 Months EMI:</strong> Standard Base Rate{' '}
                    <span className="font-extrabold text-slate-900 underline">(0% Discount / 0% Markup)</span>.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-amber-900">
                  <TrendingUp size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong className="font-bold">{tenureMonths} Months EMI:</strong> Adds{' '}
                    <span className="font-extrabold text-amber-800 underline">+{currentAdjustment.percentage}% Markup</span>{' '}
                    (+1% per month above 20 months).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Downpayment % Input (only visible if EMI Tenure > 0) */}
          {tenureMonths > 0 && (
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Initial Downpayment (Fixed 40%)
                  </label>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Fixed 40% of gross value (discount deducted from EMI)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  ₹{downpaymentAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Calculation Summary Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Pricing &amp; Value Breakdown
              </h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {tenureMonths === 0
                  ? 'One-Time Full Payment (All Downpayment) with 20% discount'
                  : `${tenureMonths} Months Customized EMI Plan`}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                currentAdjustment.action === 'DEDUCT'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : currentAdjustment.percentage === 0
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {currentAdjustment.action === 'DEDUCT'
                ? `-${currentAdjustment.percentage}% Discount`
                : currentAdjustment.percentage === 0
                ? 'Base Rate (0%)'
                : `+${currentAdjustment.percentage}% Markup`}
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Plot Value</span>
              <p className="text-lg font-black text-slate-800 font-mono mt-1">
                ₹{grossPlotValue.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">{plotArea} sqft × ₹{baseSqFtRate}</span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                currentAdjustment.action === 'DEDUCT'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : currentAdjustment.percentage === 0
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {currentAdjustment.action === 'DEDUCT' ? 'Tenure Discount' : 'Tenure Adjustment'}
              </span>
              <p
                className={`text-lg font-black font-mono mt-1 ${
                  currentAdjustment.action === 'DEDUCT'
                    ? 'text-emerald-700'
                    : currentAdjustment.percentage === 0
                    ? 'text-slate-700'
                    : 'text-amber-700'
                }`}
              >
                {currentAdjustment.action === 'DEDUCT' ? '-' : '+'}₹{adjustmentAmount.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                {currentAdjustment.percentage}% of gross value
              </span>
            </div>

            <div className="p-3.5 bg-teal-800 text-white rounded-xl shadow-xs">
              <span className="text-[11px] font-bold uppercase opacity-90">Net Payable Value</span>
              <p className="text-xl font-black font-mono mt-1 tracking-tight">
                ₹{netPlotValue.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] opacity-80 font-mono">
                Effective: ₹{effectivePerSqFt}/sqft
              </span>
            </div>
          </div>

          {/* Payment Terms Breakdown */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Payment Terms Schedule ({tenureMonths === 0 ? 'All Downpayment / Full Cash' : `${tenureMonths} Months EMI`})
            </h5>

            <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/70">
              <span className="text-slate-600 font-medium">Downpayment Amount:</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{downpaymentAmount.toLocaleString('en-IN')}{' '}
                <span className="text-[10px] text-slate-500">
                  ({tenureMonths === 0 ? '100% - All Downpayment' : '40% of Gross Value'})
                </span>
              </span>
            </div>

            {tenureMonths > 0 ? (
              <>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/70">
                  <div>
                    <span className="text-slate-600 font-medium">Remaining Balance Principal (EMI):</span>
                    {currentAdjustment.percentage > 0 && (
                      <span className="block text-[10px] text-slate-400">
                        Remaining 60% Gross (₹{Math.round(grossPlotValue * 0.6).toLocaleString('en-IN')}) {currentAdjustment.action === 'DEDUCT' ? `-${currentAdjustment.percentage}% discount` : `+${currentAdjustment.percentage}% markup`}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{remainingEmiPrincipal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs py-1.5 bg-white p-2.5 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    <span className="text-slate-800 font-bold">Monthly Installment (EMI):</span>
                  </div>
                  <span className="font-mono font-black text-sm text-teal-800">
                    ₹{monthlyEmi.toLocaleString('en-IN')} / month ({tenureMonths} {tenureMonths === 1 ? 'month' : 'months'})
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-xs py-1.5 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span className="text-emerald-900 font-bold">Remaining Installments:</span>
                </div>
                <span className="font-mono font-black text-xs text-emerald-800">
                  ₹0 (Full One-Time Payment Completed)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotPriceCalculatorTab;
