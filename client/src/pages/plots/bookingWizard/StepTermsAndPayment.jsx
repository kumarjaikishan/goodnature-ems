import React from 'react';
import { Sparkles, Building2, ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none font-medium';

export const StepTermsAndPayment = ({
  handleSubmit,
  prevStep,
  submitLoading,
  form,
  setForm,
  slabs,
  currentSlab,
  discountType,
  setDiscountType,
  discountVal,
  setDiscountVal,
  calculatedDiscount,
  govtRate,
  setGovtRate,
  isOneTime,
  netContractValue,
  getDynamicOneTimeHelper,
  downpaymentAmt,
  getDynamicEmiHelper,
  emiPrincipalAmt,
  emiMonthlyAmt,
  plotArea,
  availableLandSources,
  landSourcing,
  setLandSourcing,
}) => {
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
            <Sparkles size={18} />
          </div>
          <span>3. Contract Terms, Tenure Rates & Sponsor Allocation</span>
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevStep} disabled={submitLoading} startIcon={ChevronLeft}>
            Back
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={submitLoading}>
            Confirm Book Plot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Booking Date */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Booking Date</label>
          <input
            className={inputCls}
            type="date"
            value={form.bookingDate}
            onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
            required
          />
        </div>

        {/* Tenure / Scheme Matrix Dropdown */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Tenure & Rate Slab (समय / बिक्री दर) *</label>
          <select
            className={`${inputCls} bg-teal-50/40 border-teal-300 text-teal-950 font-bold`}
            value={form.tenureMonths}
            onChange={(e) => setForm({ ...form, tenureMonths: Number(e.target.value) })}
          >
            {slabs.map((s) => (
              <option key={s.tenureMonths} value={s.tenureMonths}>
                {s.tenureMonths === 0
                  ? `0 Months (One-Time Payment) — ₹${s.plotRate}/sqft [100% Downpayment]`
                  : `${s.tenureMonths} Months EMI — ₹${s.plotRate}/sqft [40% Down / 60% in ${s.tenureMonths} EMIs]`}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-teal-700 font-semibold px-1">
            Rate: ₹{currentSlab.plotRate}/sqft | Promoter: {currentSlab.promoterCommissionPercent}% | Dev Override:{' '}
            {currentSlab.developerCommissionPercent}%
          </span>
        </div>

        {/* Discount Input */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Discount</label>
          <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 bg-white">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="px-3 py-2.5 bg-slate-100 text-xs font-bold text-slate-700 border-r border-slate-300 outline-none cursor-pointer"
            >
              <option value="RUPEE">₹ (Flat)</option>
              <option value="PERCENT">% (Percentage)</option>
              <option value="SQFT_RATE">₹ / Sq.Ft.</option>
            </select>
            <input
              className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none text-slate-800 font-medium"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={discountVal}
              onChange={(e) => setDiscountVal(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={
                discountType === 'PERCENT'
                  ? 'e.g. 10%'
                  : discountType === 'SQFT_RATE'
                  ? 'e.g. 50 (₹/Sq.Ft.)'
                  : 'e.g. 5000 (Flat ₹)'
              }
            />
          </div>
          {calculatedDiscount > 0 && (
            <span className="text-[0.68rem] text-emerald-700 font-semibold px-1">
              Calculated Discount: ₹{calculatedDiscount.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Govt Rate */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Govt. Base Rate (₹ / Sq.Ft.)</label>
          <input
            className={inputCls}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={govtRate}
            onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Govt rate per sqft (Default 100)"
          />
        </div>

        {/* One Time vs EMI Breakdown */}
        {isOneTime ? (
          <>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Total Final Payment (100%)</label>
              <input
                className={`${inputCls} bg-emerald-50 border-emerald-200 text-emerald-800 font-bold font-mono cursor-not-allowed`}
                type="text"
                value={`₹${netContractValue.toLocaleString('en-IN')}`}
                disabled
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>One-Time Payment Time Limit (Months)</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.oneTimeMonths === 0 ? '0' : form.oneTimeMonths ?? ''}
                onChange={(e) => setForm({ ...form, oneTimeMonths: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Time limit (e.g. 1, 2, 3 months)"
                required
              />
              <span className="text-[10px] text-teal-700 font-medium px-1">
                {getDynamicOneTimeHelper(form.bookingDate, form.oneTimeMonths)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Downpayment (40% of Gross Plot Value)</label>
              <input
                className={`${inputCls} bg-teal-50 border-teal-200 text-teal-800 font-bold font-mono cursor-not-allowed`}
                type="text"
                value={`₹${downpaymentAmt.toLocaleString('en-IN')}`}
                disabled
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Downpayment Grace Period (Months)</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.downpaymentMonths === 0 ? '0' : form.downpaymentMonths ?? ''}
                onChange={(e) => setForm({ ...form, downpaymentMonths: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="e.g. 1, 2, or 3 months"
                required
              />
              <span className="text-[10px] text-teal-700 font-medium px-1">
                {getDynamicEmiHelper(form.bookingDate, form.downpaymentMonths)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>EMI Balance (Net Contract - Downpayment)</label>
              <input
                className={`${inputCls} bg-slate-50 border-slate-200 text-slate-700 font-bold font-mono cursor-not-allowed`}
                type="text"
                value={`₹${emiPrincipalAmt.toLocaleString('en-IN')}`}
                disabled
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Monthly EMI Amount ({form.tenureMonths} Months)</label>
              <input
                className={`${inputCls} bg-slate-50 border-slate-200 text-slate-900 font-black font-mono cursor-not-allowed`}
                type="text"
                value={`₹${emiMonthlyAmt.toLocaleString('en-IN')} / month`}
                disabled
              />
            </div>
          </>
        )}

        {/* Land Acquisition Stock Allocation */}
        <div className="flex flex-col gap-2 md:col-span-2 p-4 bg-teal-50/70 border border-teal-300 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={16} className="text-teal-700" />
                Land Acquisition Sourcing (किसान एग्रीमेंट / डीड स्टॉक){' '}
                <span className="text-rose-600 font-black">*</span>
              </h4>
              <p className="text-[11px] text-teal-700 mt-0.5">
                Required: Allocate the entire plot area ({plotArea} Sq.Ft.) from an active Kisan Agreement or Registry Deed.
              </p>
            </div>
            {availableLandSources.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  const currentTotal = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                  const remaining = Math.max(0, plotArea - currentTotal);
                  const firstSrc = availableLandSources[0];
                  if (!firstSrc) return;
                  setLandSourcing([
                    ...landSourcing,
                    {
                      sourceType: firstSrc.sourceType,
                      agreementId: firstSrc.agreementId,
                      agreementNumber: firstSrc.agreementNumber,
                      deedId: firstSrc.deedId || null,
                      deedNumber: firstSrc.deedNumber || '',
                      allocatedSqFt: remaining > 0 ? remaining : Math.min(plotArea, firstSrc.availableSqFt),
                    },
                  ]);
                }}
              >
                + Add Land Source
              </Button>
            )}
          </div>

          {landSourcing.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-800">
              <span>⚠️ No land stock linked yet. You must link an agreement/deed before confirming.</span>
              {availableLandSources.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const first = availableLandSources[0];
                    setLandSourcing([
                      {
                        sourceType: first.sourceType,
                        agreementId: first.agreementId,
                        agreementNumber: first.agreementNumber,
                        deedId: first.deedId || null,
                        deedNumber: first.deedNumber || '',
                        allocatedSqFt: plotArea,
                      },
                    ]);
                  }}
                >
                  Auto-Allocate {plotArea} Sq.Ft.
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {landSourcing.map((src, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-xl border border-teal-200 shadow-2xs"
                >
                  <select
                    className="flex-1 h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    value={src.deedNumber ? `DEED_${src.deedNumber}` : `AGR_${src.agreementId}`}
                    onChange={(e) => {
                      const chosen = availableLandSources.find(
                        (s) => (s.deedNumber ? `DEED_${s.deedNumber}` : `AGR_${s.agreementId}`) === e.target.value
                      );
                      if (!chosen) return;
                      const updated = [...landSourcing];
                      updated[idx] = {
                        ...updated[idx],
                        sourceType: chosen.sourceType,
                        agreementId: chosen.agreementId,
                        agreementNumber: chosen.agreementNumber,
                        deedId: chosen.deedId || null,
                        deedNumber: chosen.deedNumber || '',
                      };
                      setLandSourcing(updated);
                    }}
                  >
                    {availableLandSources.map((s) => (
                      <option
                        key={s.deedNumber ? `DEED_${s.deedNumber}` : `AGR_${s.agreementId}`}
                        value={s.deedNumber ? `DEED_${s.deedNumber}` : `AGR_${s.agreementId}`}
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <input
                      type="number"
                      className="w-28 h-9 px-2.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg outline-none text-right font-mono"
                      value={src.allocatedSqFt}
                      onChange={(e) => {
                        const updated = [...landSourcing];
                        updated[idx].allocatedSqFt = Number(e.target.value);
                        setLandSourcing(updated);
                      }}
                      placeholder="Sq. Ft."
                    />
                    <span className="text-xs font-semibold text-slate-500">SqFt</span>
                    <button
                      type="button"
                      onClick={() => setLandSourcing(landSourcing.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {(() => {
                const totalAlloc = landSourcing.reduce((sum, s) => sum + (Number(s.allocatedSqFt) || 0), 0);
                const isMatch = Math.abs(totalAlloc - plotArea) <= 0.5;
                return (
                  <div className="flex justify-between items-center text-xs font-bold px-1 pt-1">
                    <span className={isMatch ? 'text-emerald-700' : 'text-rose-600'}>
                      {isMatch ? '✅ Land Stock Area Matched:' : '⚠️ Sourced Area Mismatch:'}
                    </span>
                    <span className={`font-mono ${isMatch ? 'text-emerald-800' : 'text-rose-600 font-black'}`}>
                      {totalAlloc} / {plotArea} Sq. Ft.
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Booking Notes */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className={labelCls}>Booking Notes</label>
          <textarea
            className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl text-sm text-slate-800 transition resize-none font-medium"
            placeholder="Internal contract comments or special notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-slate-100">
        <Button variant="secondary" size="md" onClick={prevStep} disabled={submitLoading} startIcon={ChevronLeft}>
          Back
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={submitLoading} className="min-w-[170px]">
          Confirm Book Plot
        </Button>
      </div>
    </form>
  );
};
