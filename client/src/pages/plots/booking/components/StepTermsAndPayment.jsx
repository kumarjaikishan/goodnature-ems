import React from 'react';
import { Sparkles, Building2, ChevronLeft, Edit3, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  customSqFtRate,
  setCustomSqFtRate,
  customDpRate,
  setCustomDpRate,
  effectiveSqFtRate,
  calculatedPlotValue,
  emiRatePerSqFt,
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
    (isOneTime || (Number(customDpRate) > 0 && Number(customDpRate) <= Number(customSqFtRate))) &&
    isLandStockValid;

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
        {/* Booking Date */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Booking Date *</label>
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
          <label className={labelCls}>Tenure & Master Plan (समय / बिक्री प्लान) *</label>
          <select
            className={`${inputCls} bg-teal-50/40 border-teal-300 text-teal-950 font-bold`}
            value={form.tenureMonths}
            onChange={(e) => {
              const newTenure = Number(e.target.value);
              const selectedSlab = slabs.find((s) => Number(s.tenureMonths) === newTenure) || slabs[0];
              setForm({ ...form, tenureMonths: newTenure });
              // Auto-sync custom rate inputs to the new slab defaults
              setCustomSqFtRate(selectedSlab.plotRate || 1000);
              setCustomDpRate(selectedSlab.downpaymentRate || (newTenure === 0 ? selectedSlab.plotRate || 1000 : 500));
            }}
          >
            {slabs.map((s) => (
              <option key={s.tenureMonths} value={s.tenureMonths}>
                {s.tenureMonths === 0
                  ? `0 Months (One-Time Payment) — ₹${s.plotRate}/sqft [100% Downpayment]`
                  : `${s.tenureMonths} Months EMI — ₹${s.plotRate}/sqft [DP: ₹${s.downpaymentRate || 500}/sqft | EMI: ₹${s.emiRate || (s.plotRate - 500)}/sqft]`}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-teal-700 font-semibold px-1">
            Master Plan: ₹{currentSlab.plotRate}/sqft | DP: ₹{currentSlab.downpaymentRate || (currentSlab.tenureMonths === 0 ? 1000 : 500)}/sqft | Duration: {currentSlab.tenureMonths === 0 ? 'Full Payment' : `${currentSlab.tenureMonths} Months`}
          </span>
        </div>

        {/* Editable Plot Rate per SqFt */}
        <div className="flex flex-col gap-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Edit3 size={14} className="text-teal-700" />
              Plot Selling Rate (₹ / Sq.Ft.) *
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                className={`${inputCls} pl-7 font-mono font-bold text-slate-900 bg-white`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={customSqFtRate ?? ''}
                onChange={(e) => setCustomSqFtRate(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Rate per sqft"
                required
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">/ Sq.Ft.</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Effective Total Value: ₹{calculatedPlotValue.toLocaleString('en-IN')} ({plotArea} sqft @ ₹{effectiveSqFtRate}/sqft)
          </span>
        </div>

        {/* Editable Downpayment Rate per SqFt */}
        <div className="flex flex-col gap-1 p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <Calculator size={14} className="text-teal-700" />
              Downpayment Rate (₹ / Sq.Ft.) *
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-teal-700 font-bold text-sm">₹</span>
              <input
                className={`${inputCls} pl-7 font-mono font-bold text-teal-950 bg-white border-teal-300 focus:ring-teal-700`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={customDpRate ?? ''}
                onChange={(e) => setCustomDpRate(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Downpayment rate per sqft"
                required
              />
            </div>
            <span className="text-xs font-semibold text-teal-800">/ Sq.Ft.</span>
          </div>
          <span className="text-[11px] text-teal-800 font-bold">
            Total DP Amount: ₹{downpaymentAmt.toLocaleString('en-IN')} (₹{customDpRate || 0} × {plotArea} sqft)
          </span>
        </div>

        {/* Discount Input */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Discount (Deducted Strictly from EMI)</label>
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
          {calculatedDiscount > 0 ? (
            <span className="text-[0.68rem] text-emerald-700 font-semibold px-1">
              Calculated Discount: ₹{calculatedDiscount.toLocaleString('en-IN')} (deducted exclusively from EMI balance)
            </span>
          ) : (
            <span className="text-[0.65rem] text-slate-400 px-1">
              Any discount given will reduce the EMI balance without affecting the custom downpayment.
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
              <label className={labelCls}>Payment Due Period (Days) *</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.oneTimeDays ?? 90}
                onChange={(e) => setForm({ ...form, oneTimeDays: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Default 90 days"
                required
              />
              <span className="text-[10px] text-teal-700 font-medium px-1">
                {getDynamicOneTimeHelper(form.bookingDate, form.oneTimeDays ?? 90)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Downpayment Due Period (Days) *</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.downpaymentDays ?? 90}
                onChange={(e) => setForm({ ...form, downpaymentDays: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Default 90 days (editable)"
                required
              />
              <span className="text-[10px] text-teal-700 font-medium px-1">
                {getDynamicEmiHelper(form.bookingDate, form.downpaymentDays ?? 90)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remaining Balance EMI (Gross Plot Value - DP - Discount)</label>
              <input
                className={`${inputCls} bg-blue-50/70 border-blue-200 text-blue-900 font-bold font-mono cursor-not-allowed`}
                type="text"
                value={`₹${emiPrincipalAmt.toLocaleString('en-IN')} (Rate: ₹${emiRatePerSqFt}/sqft)`}
                disabled
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                    Monthly Installment Schedule ({form.tenureMonths} Months)
                  </span>
                  <p className="text-[11px] text-teal-700">
                    Remaining principal ₹{emiPrincipalAmt.toLocaleString('en-IN')} divided evenly into {form.tenureMonths} monthly payments.
                  </p>
                </div>
                <span className="text-base font-black font-mono text-teal-950">
                  ₹{emiMonthlyAmt.toLocaleString('en-IN')} / month
                </span>
              </div>
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
                  setLandSourcing([
                    ...landSourcing,
                    {
                      sourceType: '',
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
                <span>No agreement selected. Click &quot;+ Add Land Source&quot; or choose from available deeds.</span>
              </div>
              {availableLandSources.length > 0 && (
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
                        deedId: null,
                        deedNumber: '',
                        allocatedSqFt: plotArea,
                      },
                    ]);
                  }}
                >
                  + Choose Land Agreement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {landSourcing.map((src, idx) => {
                const selectedSourceObj = availableLandSources.find((s) =>
                  src.deedNumber
                    ? s.deedNumber === src.deedNumber
                    : String(s.agreementId) === String(src.agreementId)
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
                              sourceType: '',
                              agreementId: '',
                              agreementNumber: '',
                              deedId: null,
                              deedNumber: '',
                              allocatedSqFt: src.allocatedSqFt || plotArea,
                            };
                            setLandSourcing(updated);
                            return;
                          }
                          const chosen = availableLandSources.find((s) => {
                            const sVal = s.deedNumber
                              ? `DEED_${s.deedNumber}`
                              : `AGR_${s.agreementId}${s.parcelId ? `_${s.parcelId}` : ''}`;
                            return sVal === val || String(s.agreementId) === val;
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
                        <option value="">-- Select Agreement / Deed No. --</option>
                        {availableLandSources.map((s, sIdx) => {
                          const optKey = s.deedNumber
                            ? `DEED_${s.deedId || s.deedNumber}_${sIdx}`
                            : `AGR_${s.agreementId}_${s.parcelId || sIdx}`;
                          const optVal = s.deedNumber
                            ? `DEED_${s.deedNumber}`
                            : `AGR_${s.agreementId}${s.parcelId ? `_${s.parcelId}` : ''}`;
                          return (
                            <option key={optKey} value={optVal}>
                              {s.sourceType === 'REGISTRY_DEED'
                                ? `Registry Deed #${s.deedNumber} (under Agr #${s.agreementNumber})`
                                : `Agreement #${s.agreementNumber}${s.mauja ? ` — ${s.mauja}` : ''}`}
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
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove Land Source"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Show details card when an agreement/deed is selected */}
                    {selectedSourceObj && (
                      <div className="bg-teal-50/60 border border-teal-100 rounded-lg p-2.5 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-medium">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Mauja / Area</span>
                          <span className="font-bold text-slate-900">{selectedSourceObj.mauja || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Khata / Khesra</span>
                          <span className="font-semibold text-slate-800">
                            Khata: {selectedSourceObj.khataNumber || '-'} | Khesra: {selectedSourceObj.khesraNumber || '-'}
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

        {/* Notes */}
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
