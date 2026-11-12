import React, { useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { DateInput } from '@/components/ui/DateInput';
import { LandAcquisitionSourcingSection } from './LandAcquisitionSourcingSection';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';

export const StepTermsAndPayment = ({
  handleSubmit,
  prevStep,
  submitLoading,
  form,
  setForm,
  discountType,
  setDiscountType,
  discountVal,
  setDiscountVal,
  calculatedDiscount,
  govtRate,
  setGovtRate,
  isOneTime,
  netContractValue,
  downpaymentAmt,
  dpType,
  setDpType,
  dpVal,
  setDpVal,
  customDpRate,
  remainingBalance,
  emiFrequency,
  setEmiFrequency,
  installmentCount,
  setInstallmentCount,
  totalTenureMonths,
  emiPerInstallmentAmt,
  emiRatePerSqFt,
  getDynamicDueHelper,
  plotArea,
  availableLandSources,
  landSourcing,
  setLandSourcing,
  customSqFtRate,
  setCustomSqFtRate,
  effectiveSqFtRate,
  calculatedPlotValue,
  selectedPlot,
  projects = [],
  paymentPlanMode = 'EMI',
  setPaymentPlanMode,
  selectedPremiumHeads = [],
  togglePremiumHead,
  totalPremiumExtra = 0,
  schemeSlabs = [],
  emiTenureAdjustment = { percent: 0, action: 'NONE', amount: 0 },
}) => {
  // Only show slabs checked for Add Booking (Step 3)
  const availableSchemeSlabs = useMemo(() => {
    if (!schemeSlabs || schemeSlabs.length === 0) return [];
    return schemeSlabs.filter((s) => Boolean(s.showInAddBooking));
  }, [schemeSlabs]);

  // Helper to generate a consistent, unique identifier for each scheme slab
  const getSlabValue = (s) => ((s?.planName && s.planName.trim()) ? s.planName.trim() : `slab-${s?.tenureMonths}`);

  // Current active scheme slab (matched by planName, slab identifier, or tenure)
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

  // Handler when selecting a plan from Scheme Rules
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

      if (!isOneTimeMode && setInstallmentCount) {
        setInstallmentCount(Number(matched.tenureMonths) || 1);
      }
    }
  };

  // Compute land stock allocation validity (memoized for performance)
  const totalAllocatedArea = useMemo(() => {
    return landSourcing
      .filter((s) => Boolean(s.agreementId))
      .reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  }, [landSourcing]);

  const isLandStockValid = useMemo(() => {
    return (
      landSourcing.length > 0 &&
      landSourcing.every((s) => Boolean(s.agreementId) && Number(s.allocatedSqFt) > 0) &&
      Math.abs(totalAllocatedArea - plotArea) <= 0.5
    );
  }, [landSourcing, totalAllocatedArea, plotArea]);

  const isFormValid = useMemo(() => {
    return (
      Boolean(form.bookingDate) &&
      Boolean(form.planName) &&
      Number(customSqFtRate) > 0 &&
      Number(downpaymentAmt) > 0 &&
      isLandStockValid
    );
  }, [form.bookingDate, form.planName, customSqFtRate, downpaymentAmt, isLandStockValid]);

  // Filter land sources strictly by selected project if chosen in form (memoized)
  const allLandSources = useMemo(() => {
    if (!form.projectId) return availableLandSources || [];
    return (availableLandSources || []).filter((src) => {
      const pId = src.projectId?._id || src.projectId;
      return pId && String(pId) === String(form.projectId);
    });
  }, [form.projectId, availableLandSources]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            3. Contract Terms, Rates & Downpayment
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure payment scheme, selling rate, downpayment and land acquisition sourcing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevStep} disabled={submitLoading} startIcon={ChevronLeft}>
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={submitLoading}
            disabled={!isFormValid || submitLoading}
          >
            Confirm Book Plot
          </Button>
        </div>
      </div>

      {/* Scheme Plan Selection */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Scheme Plan *
          </label>
          {currentSchemeSlab && (
            <span className="text-[11px] text-teal-800 font-medium bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
              {Number(currentSchemeSlab.rdMaturityPercent) === 0 && Number(currentSchemeSlab.fdMaturityPercent) === 0
                ? 'Actual Plot Sale (0% Return)'
                : 'Buyback Plan'}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <select
            className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-semibold outline-none cursor-pointer ${
              !currentSelectValue
                ? 'border-amber-300 text-amber-950 focus:ring-2 focus:ring-teal-600'
                : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-teal-600 focus:border-teal-600'
            }`}
            value={currentSelectValue || ''}
            onChange={(e) => handleSelectPlan(e.target.value)}
            required
          >
            <option value="">-- Choose Mandatory Scheme Plan --</option>
            {availableSchemeSlabs.map((s, idx) => {
              const isZeroReturn = Number(s.rdMaturityPercent) === 0 && Number(s.fdMaturityPercent) === 0;
              const label = `${s.planName ? `${s.planName} — ` : ''}${s.tenureMonths} Months (${isZeroReturn ? 'Actual Plot Sale / Registry' : `RD: ${s.rdMaturityPercent}% | FD: ${s.fdMaturityPercent}%`})`;
              return (
                <option key={idx} value={getSlabValue(s)}>
                  {label}
                </option>
              );
            })}
          </select>
          {!currentSchemeSlab && (
            <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <AlertCircle size={13} className="shrink-0" />
              Scheme Plan selection is required to determine Associate, Partner, and Branch Partner commissions before booking can proceed.
            </p>
          )}
        </div>
      </div>

      {/* Payment Plan Scheme Selector: One Time vs EMI Plan */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Payment Plan Scheme *
          </label>
          <span className="text-[11px] text-slate-600 font-medium bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
            {paymentPlanMode === 'ONE_TIME' ? 'Full 100% Payment' : 'Installments Schedule'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A: One Time */}
          <div
            onClick={() => {
              if (setPaymentPlanMode) {
                setPaymentPlanMode('ONE_TIME');
              }
              setDpType('PERCENT');
              setDpVal(100);
              if (currentSchemeSlab) {
                setForm((f) => ({
                  ...f,
                  promoterCommissionPercent: Number(currentSchemeSlab.fdPromoterCommissionPercent ?? 5.0),
                  developerCommissionPercent: Number(currentSchemeSlab.bpFdCommissionPercent ?? 1.0),
                  bpCommissionPercent: Number(currentSchemeSlab.bpFdCommissionPercent ?? 1.0),
                  branchCommissionPercent: Number(currentSchemeSlab.branchFdCommissionPercent ?? 0.5),
                }));
              }
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-1.5 ${paymentPlanMode === 'ONE_TIME'
                ? 'bg-teal-50/40 border-teal-600 ring-1 ring-teal-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${paymentPlanMode === 'ONE_TIME' ? 'text-teal-950' : 'text-slate-700'}`}>
                One Time (Full Payment)
              </span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentPlanMode === 'ONE_TIME' ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'}`}>
                {paymentPlanMode === 'ONE_TIME' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-tight">
              Pay 100% full net amount in Downpayment. No EMI installments or monthly balance required.
            </p>
          </div>

          {/* Option B: EMI Plan */}
          <div
            onClick={() => {
              if (setPaymentPlanMode) {
                setPaymentPlanMode('EMI');
              }
              setDpType('SQFT_RATE');
              setDpVal(500);
              if (currentSchemeSlab) {
                setForm((f) => ({
                  ...f,
                  promoterCommissionPercent: Number(currentSchemeSlab.rdPromoterCommissionPercent ?? 4.0),
                  developerCommissionPercent: Number(currentSchemeSlab.bpRdCommissionPercent ?? 1.0),
                  bpCommissionPercent: Number(currentSchemeSlab.bpRdCommissionPercent ?? 1.0),
                  branchCommissionPercent: Number(currentSchemeSlab.branchRdCommissionPercent ?? 0),
                }));
              }
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-1.5 ${paymentPlanMode === 'EMI'
                ? 'bg-teal-50/40 border-teal-600 ring-1 ring-teal-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${paymentPlanMode === 'EMI' ? 'text-teal-950' : 'text-slate-700'}`}>
                EMI / Installment Plan
              </span>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentPlanMode === 'EMI' ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'}`}>
                {paymentPlanMode === 'EMI' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-tight">
              Flexible initial downpayment + periodic installment EMIs across customized tenure.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Booking Date */}
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <DateInput
            label="Booking Date *"
            value={form.bookingDate}
            onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
            required
          />
          <span className="text-[11px] text-slate-400 font-normal truncate">
            Initial contract booking agreement date
          </span>
        </div>

        {/* 2. Plot Selling Rate (₹ / Sq.Ft.) */}
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Plot Selling Rate (Base) *
            </label>
            <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              ₹{customSqFtRate || 1000}/sqft
            </span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 font-semibold text-sm">₹</span>
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
            <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">/ Sq.Ft.</span>
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
          <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Plot Premium Features & Extra Charges
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plot #{selectedPlot?.plotNumber} has special attributes. Check/uncheck to apply or waive extra sqft charges.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  Total Extra: +{totalPremiumExtra}% (+₹{Math.round((Number(customSqFtRate) || 1000) * (totalPremiumExtra / 100))}/sqft)
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
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${head.active
                        ? 'bg-white border-amber-400 ring-1 ring-amber-300'
                        : 'bg-white/80 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={head.active}
                        onChange={() => togglePremiumHead(idx)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <div>
                        <span className={`text-xs font-semibold block leading-tight ${head.active ? 'text-slate-900' : 'text-slate-500'}`}>
                          {head.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          +{head.extraPercent}% (+₹{headExtraPerSqFt}/sqft)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold block ${head.active ? 'text-slate-900' : 'text-slate-400'}`}>
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
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Govt. Base Rate</label>
            <span className="text-[10px] text-slate-400 font-medium">Circle Rate</span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 font-semibold text-sm">₹</span>
            <input
              className="w-full h-11 pl-7 pr-16 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={govtRate}
              onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="100"
            />
            <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">/ Sq.Ft.</span>
          </div>
          <span className="text-[11px] text-slate-400 font-normal truncate">
            Official government circle base rate
          </span>
        </div>

        {/* 4. Discount Input */}
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Discount</label>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${calculatedDiscount > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-400'}`}>
              {calculatedDiscount > 0 ? `-₹${calculatedDiscount.toLocaleString('en-IN')}` : 'Optional'}
            </span>
          </div>
          <div className="flex h-11 rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 bg-white shadow-2xs">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="px-3 bg-slate-50 text-xs font-semibold text-slate-700 border-r border-slate-300 outline-none cursor-pointer shrink-0"
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
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              {paymentPlanMode === 'ONE_TIME' ? 'Full Payment Downpayment (100%) *' : 'Downpayment *'}
            </label>
            <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
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
            <div className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between shadow-2xs">
              <span className="text-xs font-medium text-slate-600">Total Contract Value:</span>
              <span className="text-sm font-bold font-mono text-emerald-800">
                ₹{downpaymentAmt.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <div className="flex h-11 rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 bg-white shadow-2xs">
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
                className="px-3 bg-slate-50 text-xs font-semibold text-slate-700 border-r border-slate-300 outline-none cursor-pointer shrink-0"
              >
                <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                <option value="PERCENT">% (Percentage)</option>
                <option value="FLAT">₹ (Flat)</option>
              </select>
              <input
                className="w-full px-3.5 text-sm bg-transparent outline-none text-slate-900 font-bold font-mono"
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

          <span className="text-[11px] text-slate-500 font-medium truncate">
            Total DP: ₹{downpaymentAmt.toLocaleString('en-IN')} (₹{customDpRate}/sqft eq.)
          </span>
        </div>

        {/* 6. Payment / Downpayment Due Period */}
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">Due Period (Days) *</label>
            <span className="text-[10px] text-slate-400 font-medium">Standard 90 Days</span>
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
        {paymentPlanMode === 'EMI' && remainingBalance > 0 ? (
          <div className="md:col-span-2 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <label className="text-xs font-bold text-slate-800">
                EMI Frequency & Installments Schedule
              </label>
              <div className="flex items-center gap-2">
                {emiTenureAdjustment && emiTenureAdjustment.amount > 0 && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                    emiTenureAdjustment.action === 'ADD'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}>
                    {emiTenureAdjustment.action === 'ADD' ? '+' : '-'}{emiTenureAdjustment.percent}% Tenure {emiTenureAdjustment.action === 'ADD' ? 'Markup' : 'Discount'} (₹{emiTenureAdjustment.amount.toLocaleString('en-IN')})
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                  Total Tenure: {totalTenureMonths} Months
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Frequency Dropdown */}
              <div className="flex flex-col justify-between gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">EMI Frequency *</label>
                  <span className="text-[10px] text-slate-400 font-medium">Periodicity</span>
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
                <span className="text-[11px] text-slate-500 font-normal truncate">
                  Installments due {emiFrequency === 'MONTHLY' ? 'every month' : emiFrequency === 'QUARTERLY' ? 'every 3 months' : emiFrequency === 'HALF_YEARLY' ? 'every 6 months' : 'every 12 months'}
                </span>
              </div>

              {/* Installment Count Input */}
              <div className="flex flex-col justify-between gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Number of Installments *</label>
                  <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
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

                <div className="mt-1 flex items-center gap-2 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md w-fit">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {totalTenureMonths} Months
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    Total Duration
                  </span>
                </div>
              </div>
            </div>

            {/* Installment Amount Breakdown */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                <span className="text-slate-700 font-medium">
                  Installment Amount:{' '}
                  <strong className="text-slate-900 font-bold font-mono text-sm">
                    ₹{emiPerInstallmentAmt.toLocaleString('en-IN')}
                  </strong>{' '}
                  / {emiFrequency === 'MONTHLY' ? 'month' : emiFrequency === 'QUARTERLY' ? 'quarter' : emiFrequency === 'HALF_YEARLY' ? 'half-year' : 'year'}
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">
                Remaining ₹{remainingBalance.toLocaleString('en-IN')} divided across {installmentCount || 1} installments
              </span>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">One Time Full Payment Selected</p>
                <p className="text-[11px] text-slate-500 font-normal">
                  Remaining balance is ₹0. No EMI installments are required for this contract.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {emiTenureAdjustment && emiTenureAdjustment.amount > 0 && (
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-mono font-semibold">
                  -{emiTenureAdjustment.percent}% Full Payment Discount (₹{emiTenureAdjustment.amount.toLocaleString('en-IN')})
                </span>
              )}
              <span className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-md text-xs font-mono font-semibold">
                ₹0 EMI
              </span>
            </div>
          </div>
        )}

        {/* 8. Land Acquisition Stock Allocation (Cascading: Khata -> Plot/Khesra -> Agreement) */}
        <div className="md:col-span-2">
          <LandAcquisitionSourcingSection
            landSources={allLandSources}
            landSourcing={landSourcing}
            setLandSourcing={setLandSourcing}
            requiredSqFt={plotArea}
            title="Land Acquisition Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड स्टॉक)"
            subtitle={`Required: Allocate the entire plot area (${plotArea} Sq.Ft.) from active Kisan Agreements or Registry Deeds.`}
          />
        </div>

        {/* 9. Internal Notes */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className={labelCls}>Internal Remarks / Terms Note</label>
          <textarea
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none font-medium resize-none"
            rows="2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Special booking conditions, approvals or client notes..."
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-2 md:col-span-2">
          <Button variant="secondary" size="sm" onClick={prevStep} disabled={submitLoading} startIcon={ChevronLeft}>
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={submitLoading}
            disabled={!isFormValid || submitLoading}
          >
            Confirm Book Plot
          </Button>
        </div>
      </div>
    </form>
  );
};
