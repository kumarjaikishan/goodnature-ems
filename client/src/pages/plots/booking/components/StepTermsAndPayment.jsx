import React from 'react';
import { Sparkles, Building2, ChevronLeft, Edit3, Calculator, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const inputCls =
  'w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none font-medium shadow-2xs';

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
  selectedPremiumHeads = [],
  togglePremiumHead,
  totalPremiumExtra = 0,
}) => {
  // Compute land stock allocation validity
  const totalAllocatedArea = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
  const isLandStockValid =
    landSourcing.length > 0 &&
    landSourcing.every((s) => Boolean(s.agreementId) && Number(s.allocatedSqFt) > 0) &&
    Math.abs(totalAllocatedArea - plotArea) <= 0.5;

  const isFormValid =
    Boolean(form.bookingDate) &&
    Number(customSqFtRate) > 0 &&
    Number(downpaymentAmt) > 0 &&
    isLandStockValid;

  const allLandSources = availableLandSources || [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
            <Sparkles size={18} />
          </div>
          <span>3. Contract Terms, Dynamic Rates & Downpayment</span>
        </h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Booking Date */}
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">Booking Date *</label>
            <span className="text-[10px] text-slate-400 font-semibold">Start Date</span>
          </div>
          <input
            className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
            type="date"
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
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      head.active
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
            <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">/ Sq.Ft.</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium truncate">
            Official government circle base rate
          </span>
        </div>

        {/* 4. Discount Input */}
        <div className="flex flex-col justify-between gap-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">Discount</label>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${calculatedDiscount > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-400'}`}>
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
              Downpayment *
            </label>
            <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-300">
              {dpType === 'SQFT_RATE'
                ? `₹${dpVal || 0}/sqft`
                : dpType === 'PERCENT'
                ? `${dpVal || 0}%`
                : `Flat ₹`}
            </span>
          </div>
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

        {/* 7. EMI Frequency & Installments Schedule (when remaining balance > 0) */}
        {remainingBalance > 0 ? (
          <div className="md:col-span-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator size={15} className="text-teal-700" />
                EMI Frequency & Installments Schedule
              </label>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                Total Tenure: {totalTenureMonths} Months
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
                  Installments due {emiFrequency === 'MONTHLY' ? 'every month' : emiFrequency === 'QUARTERLY' ? 'every 3 months' : emiFrequency === 'HALF_YEARLY' ? 'every 6 months' : 'every 12 months'}
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
                  placeholder="8"
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
                <span className="text-teal-950 font-semibold">
                  Installment Amount:{' '}
                  <strong className="text-teal-950 font-black font-mono text-sm">
                    ₹{emiPerInstallmentAmt.toLocaleString('en-IN')}
                  </strong>{' '}
                  / {emiFrequency === 'MONTHLY' ? 'month' : emiFrequency === 'QUARTERLY' ? 'quarter (3 mos)' : emiFrequency === 'HALF_YEARLY' ? 'half-year (6 mos)' : 'year'}
                </span>
              </div>
              <span className="text-teal-800 font-medium font-mono text-[11px]">
                Remaining ₹{remainingBalance.toLocaleString('en-IN')} divided across {installmentCount || 1} installments
              </span>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span>Full Payment (100% Downpayment) — Remaining Balance is ₹0. No EMI installments required.</span>
          </div>
        )}

        {/* 8. Land Acquisition Stock Allocation (Agreements & Registry Deeds) */}
        <div className="flex flex-col gap-2 md:col-span-2 p-4 bg-teal-50/70 border border-teal-300 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={16} className="text-teal-700" />
                Land Acquisition Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड स्टॉक){' '}
                <span className="text-rose-600 font-black">*</span>
              </h4>
              <p className="text-[11px] text-teal-700 mt-0.5">
                Required: Allocate the entire plot area ({plotArea} Sq.Ft.) from active Kisan Agreements or Registry Deeds.
              </p>
            </div>
            {allLandSources.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  const currentTotal = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                  const remaining = Math.max(0, plotArea - currentTotal);
                  setLandSourcing([
                    ...landSourcing,
                    {
                      sourceType: 'AGREEMENT',
                      agreementId: '',
                      agreementNumber: '',
                      deedId: null,
                      deedNumber: '',
                      allocatedSqFt: remaining > 0 ? remaining : plotArea,
                    },
                  ]);
                }}
              >
                + Add Land Source
              </Button>
            )}
          </div>

          {landSourcing.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {allLandSources.length === 0
                    ? 'No active agreements or registry deeds with available stock found. Please add or verify agreements in Purchase & Land Master.'
                    : 'No agreement or registry deed selected. Click "+ Add Land Source" or choose from available land stock.'}
                </span>
              </div>
              {allLandSources.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setLandSourcing([
                      {
                        sourceType: '',
                        agreementId: '',
                        agreementNumber: '',
                        parcelId: null,
                        deedId: null,
                        deedNumber: '',
                        allocatedSqFt: plotArea,
                      },
                    ]);
                  }}
                >
                  + Add Land Source
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {landSourcing.map((src, idx) => {
                const selectedSourceObj = allLandSources.find((s) =>
                  src.deedNumber
                    ? s.deedNumber === src.deedNumber
                    : String(s.agreementId) === String(src.agreementId) &&
                      (!src.parcelId || String(s.parcelId) === String(src.parcelId))
                );

                const selectValue = src.deedNumber
                  ? `DEED_${src.deedNumber}`
                  : src.agreementId
                  ? (src.parcelId ? `AGR_${src.agreementId}_${src.parcelId}` : `AGR_${src.agreementId}`)
                  : '';

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2.5 bg-white p-3.5 rounded-xl border border-teal-200 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <select
                        className="flex-1 h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none w-full focus:ring-2 focus:ring-teal-600 focus:bg-white"
                        value={selectValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            const updated = [...landSourcing];
                            updated[idx] = {
                              sourceType: 'AGREEMENT',
                              agreementId: '',
                              agreementNumber: '',
                              parcelId: null,
                              deedId: null,
                              deedNumber: '',
                              allocatedSqFt: src.allocatedSqFt || plotArea,
                            };
                            setLandSourcing(updated);
                            return;
                          }
                          const chosen = allLandSources.find((s) => {
                            const sVal = s.deedNumber
                              ? `DEED_${s.deedNumber}`
                              : `AGR_${s.agreementId}${s.parcelId ? `_${s.parcelId}` : ''}`;
                            return sVal === val || String(s.agreementId) === val || String(s.deedNumber) === val;
                          });
                          if (!chosen) return;
                          const updated = [...landSourcing];
                          updated[idx] = {
                            ...updated[idx],
                            sourceType: chosen.sourceType,
                            agreementId: chosen.agreementId,
                            agreementNumber: chosen.agreementNumber,
                            parcelId: chosen.parcelId || null,
                            deedId: chosen.deedId || null,
                            deedNumber: chosen.deedNumber || '',
                          };
                          setLandSourcing(updated);
                        }}
                      >
                        <option value="">-- Select Agreement --</option>
                        {allLandSources.map((s, sIdx) => {
                          const optKey = s.deedNumber
                            ? `DEED_${s.deedId || s.deedNumber}_${sIdx}`
                            : `AGR_${s.agreementId}_${s.parcelId || sIdx}`;
                          const optVal = s.deedNumber
                            ? `DEED_${s.deedNumber}`
                            : `AGR_${s.agreementId}${s.parcelId ? `_${s.parcelId}` : ''}`;
                          return (
                            <option key={optKey} value={optVal}>
                              {s.sourceType === 'REGISTRY_DEED' ? s.deedNumber : s.agreementNumber}
                            </option>
                          );
                        })}
                      </select>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input
                          type="number"
                          className="w-28 h-10 px-2.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg outline-none text-right font-mono focus:ring-2 focus:ring-teal-600"
                          value={src.allocatedSqFt ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...landSourcing];
                            updated[idx].allocatedSqFt = val;
                            setLandSourcing(updated);
                          }}
                          placeholder="Sq. Ft."
                        />
                        <span className="text-xs font-semibold text-slate-500">SqFt</span>
                        <button
                          type="button"
                          onClick={() => setLandSourcing(landSourcing.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center justify-center"
                          title="Remove Land Source"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Show details card when an agreement is selected */}
                    {selectedSourceObj && (
                      <div className="bg-teal-50/60 border border-teal-100 rounded-lg p-2.5 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-medium">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Agreement No.</span>
                          <span className="font-bold text-teal-950">
                            {selectedSourceObj.agreementNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Mauja / Khata / Khesra</span>
                          <span className="font-semibold text-slate-800">
                            {selectedSourceObj.mauja || '-'} (Khata: {selectedSourceObj.khataNumber || '-'}, Khesra: {selectedSourceObj.khesraNumber || '-'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Area (Sq.Ft.)</span>
                          <span className="font-extrabold text-teal-900 font-mono">
                            {selectedSourceObj.availableSqFt?.toLocaleString('en-IN') || 0} Sq.Ft.
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Available (Dismil)</span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {selectedSourceObj.availableDismil ??
                              (selectedSourceObj.availableSqFt ? (selectedSourceObj.availableSqFt / 435.6).toFixed(2) : 0)}{' '}
                            Dismil
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(() => {
                const isMatch = Math.abs(totalAllocatedArea - plotArea) <= 0.5 && isLandStockValid;
                return (
                  <div className="flex justify-between items-center text-xs font-bold px-1 pt-1">
                    <span className={isMatch ? 'text-emerald-700 flex items-center gap-1' : 'text-rose-600 flex items-center gap-1'}>
                      {isMatch ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Land Stock Area Matched:</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>
                            {landSourcing.some((s) => !s.agreementId)
                              ? '⚠️ Please choose an agreement for all rows'
                              : '⚠️ Sourced Area Mismatch:'}
                          </span>
                        </>
                      )}
                    </span>
                    <span className={`font-mono ${isMatch ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {totalAllocatedArea} / {plotArea} Sq. Ft.
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
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
      </div>
    </form>
  );
};
