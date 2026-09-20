import React from 'react';
import {
  Building2,
  User,
  Tag,
  Calendar,
  CheckCircle2,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const BookingSummarySidebar = ({
  step,
  selectedCustomer,
  selectedPlot,
  baseRate,
  isCorner,
  cornerExtra,
  effectiveRate,
  calculatedPlotValue,
  isOneTime,
  form,
  calculatedDiscount,
  netContractValue,
  downpaymentAmt,
  emiPrincipalAmt,
  emiMonthlyAmt,
  emiRatePerSqFt,
  customDpRate,
  emiFrequency = 'MONTHLY',
  installmentCount = 1,
  totalTenureMonths = 1,
  selectedPremiumHeads = [],
}) => {
  const plotArea = selectedPlot?.plotSize || selectedPlot?.area || 0;
  const resolvedTenure = totalTenureMonths || Number(form.tenureMonths) || 0;

  return (
    <div className="flex flex-col gap-6 sticky top-6">
      {/* Step 1 Customer Preview */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 shadow-2xs p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <User size={14} className="text-teal-700" />
            Customer Preview
          </h3>
          {selectedCustomer ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shadow-2xs">
                  {selectedCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</span>
                  <span className="text-xs font-mono font-bold text-teal-800 tracking-wider">
                    {selectedCustomer.customerCode || selectedCustomer.customerId}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Mobile</span>
                  <span className="text-slate-800 font-medium">{selectedCustomer.mobile}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Email</span>
                  <span className="text-slate-800 font-medium">{selectedCustomer.email || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Referral Sponsor</span>
                  <span className="text-teal-800 font-bold">
                    {selectedCustomer.sponsorId
                      ? `${selectedCustomer.sponsorId.name} ${selectedCustomer.sponsorId.sponsorCode ? `(${selectedCustomer.sponsorId.sponsorCode})` : ''
                      }`
                      : '🏢 Direct / Company'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 font-bold">No Customer Selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                Please search and select a plot customer in the main form.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2 Plot Preview */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 shadow-2xs p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Building2 size={14} className="text-teal-700" />
            Plot Preview
          </h3>
          {selectedPlot ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Plot #{selectedPlot.plotNumber}</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  AVAILABLE
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Plot Size</span>
                  <span className="text-slate-900 font-mono font-bold">{selectedPlot.plotSize} Sq Ft</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase text-[10px]">Plot Type</span>
                  <span className="text-slate-800 font-semibold">{selectedPlot.plotType || 'REGULAR'}</span>
                </div>
                {Array.isArray(selectedPlot.premiumHeads) && selectedPlot.premiumHeads.length > 0 ? (
                  <div className="space-y-1">
                    {selectedPlot.premiumHeads.map((h, idx) => (
                      <div key={idx} className="flex justify-between items-center text-amber-800 bg-amber-50/70 border border-amber-200/60 px-2 py-1 rounded text-xs">
                        <span>✨ {h.name}</span>
                        <span className="font-bold font-mono">+{h.extraPercent}%</span>
                      </div>
                    ))}
                  </div>
                ) : (selectedPlot.plotType === 'CORNER' || cornerExtra > 0) ? (
                  <div className="flex justify-between items-center text-amber-700 bg-amber-50/60 px-2 py-1 rounded">
                    <span>Corner Premium</span>
                    <span className="font-bold">+{cornerExtra || 20}%</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 font-bold">No Plot Selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                Please select a plot number from the grid.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3 Full Financial Table & Contract Summary */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-700" />
              Contract Financial Summary
            </h3>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${form.bookingType === 'HOLD'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
            >
              {form.bookingType || 'BOOKING'}
            </span>
          </div>

          {/* Quick Header details */}
          <div className="space-y-2">
            {selectedCustomer && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Customer:</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">
                  {selectedCustomer.name} ({selectedCustomer.customerCode || selectedCustomer.customerId})
                </span>
              </div>
            )}
            {selectedPlot && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Plot Selected:</span>
                <span className="font-bold text-teal-900">
                  Plot #{selectedPlot.plotNumber} ({plotArea} sqft @ ₹{effectiveRate}/sqft)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Payment Plan:</span>
              <span className="font-bold text-slate-800">
                {isOneTime
                  ? 'Full Payment'
                  : `${installmentCount} × ${emiFrequency === 'MONTHLY' ? 'Monthly' : emiFrequency === 'QUARTERLY' ? 'Quarterly' : emiFrequency === 'HALF_YEARLY' ? 'Half-Yearly' : 'Yearly'} (${resolvedTenure} Mos Total)`}
              </span>
            </div>
          </div>

          {/* Structured Financial Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full border-collapse">
              <tbody>
                {/* 1. Gross Plot Value */}
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-600">
                    Gross Plot Value
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {plotArea} sqft × ₹{effectiveRate}/sqft
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{calculatedPlotValue.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 1b. Premium Heads Detail (if any active) */}
                {selectedPremiumHeads && selectedPremiumHeads.some((h) => h.active) && (
                  <tr className="border-b border-slate-100 bg-amber-50/30">
                    <td className="py-2 px-3 text-[11px] font-semibold text-amber-900" colSpan={2}>
                      <div className="flex items-center justify-between font-bold text-[10px] text-amber-800 uppercase mb-1">
                        <span>Applied Premium Heads:</span>
                        <span>+{cornerExtra}% total</span>
                      </div>
                      <div className="space-y-0.5">
                        {selectedPremiumHeads
                          .filter((h) => h.active)
                          .map((head, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                              <span>• {head.name} (+{head.extraPercent}%)</span>
                              <span className="font-mono font-medium text-amber-900">
                                +₹{Math.round(plotArea * ((Number(baseRate) || 1000) * (head.extraPercent / 100))).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                )}

                {/* 2. Discount */}
                <tr className="border-b border-slate-100 bg-white">
                  <td className="py-2.5 px-3 font-semibold text-slate-600">
                    Discount Given
                    {calculatedDiscount > 0 && (
                      <span className="block text-[10px] text-rose-500 font-medium">
                        Deducted from EMI balance
                      </span>
                    )}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${calculatedDiscount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {calculatedDiscount > 0 ? `- ₹${calculatedDiscount.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                </tr>

                {/* 3. Net Plot Contract Value */}
                <tr className="border-b border-slate-200 bg-teal-50/40">
                  <td className="py-2.5 px-3 font-bold text-teal-950">
                    Net Plot Contract Value
                    <span className="block text-[10px] text-teal-700 font-medium">
                      Gross Value - Discount
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-teal-950 text-sm">
                    ₹{netContractValue.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 4. Downpayment */}
                <tr className="border-b border-slate-100 bg-white">
                  <td className="py-2.5 px-3 font-semibold text-slate-700">
                    {isOneTime ? 'Full Payment Due (100%)' : 'Downpayment (DP)'}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {isOneTime ? '100% full payment' : `₹${customDpRate || 500}/sqft × ${plotArea} sqft (90 days)`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    ₹{downpaymentAmt.toLocaleString('en-IN')}
                  </td>
                </tr>

                {/* 5. Remaining Balance EMI Principal */}
                {!isOneTime && (
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      Remaining Balance EMI Principal
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Net Value - Downpayment (₹{emiRatePerSqFt || 0}/sqft)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                      ₹{emiPrincipalAmt.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 6. Installment Breakdown Card */}
            {!isOneTime && (
              <div className="p-3 bg-gradient-to-r from-teal-50 via-teal-100/50 to-emerald-50 border-t border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-950 uppercase tracking-wider block">
                    Installment ({installmentCount} × {emiFrequency === 'MONTHLY' ? 'Monthly' : emiFrequency === 'QUARTERLY' ? 'Quarterly' : emiFrequency === 'HALF_YEARLY' ? 'Half-Yearly' : 'Yearly'})
                  </span>
                  <span className="text-[11px] text-teal-700 font-medium">
                    Total {resolvedTenure} mos tenure
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-teal-950">
                    ₹{emiMonthlyAmt.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-teal-700 block font-bold">
                    / {emiFrequency === 'MONTHLY' ? 'Month' : emiFrequency === 'QUARTERLY' ? 'Quarter' : emiFrequency === 'HALF_YEARLY' ? '6 Mos' : 'Year'}
                  </span>
                </div>
              </div>
            )}
          </div>


        </div>
      )}
    </div>
  );
};

export default BookingSummarySidebar;
