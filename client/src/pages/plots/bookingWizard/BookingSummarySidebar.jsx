import React from 'react';

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
  emiMonthlyAmt,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Dynamic Details Card based on step */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 shadow-2xs p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Customer Preview
          </h3>
          {selectedCustomer ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{selectedCustomer.name}</span>
                  <span className="text-xs font-mono font-bold text-teal-800 tracking-wider">
                    {selectedCustomer.customerCode || selectedCustomer.customerId}
                  </span>
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
                    {selectedCustomer.sponsorId
                      ? `${selectedCustomer.sponsorId.name} ${
                          selectedCustomer.sponsorId.sponsorCode ? `(${selectedCustomer.sponsorId.sponsorCode})` : ''
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

      {step === 2 && (
        <div className="bg-white border border-slate-200 shadow-2xs p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Plot Preview
          </h3>
          {selectedPlot ? (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Plot #{selectedPlot.plotNumber}</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  AVAILABLE
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs font-semibold pt-3 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[0.68rem] text-slate-400 uppercase">Plot Size</span>
                  <span className="text-slate-800 font-mono font-bold">{selectedPlot.plotSize} Sq Ft</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.68rem] text-slate-400 uppercase">Corner Type</span>
                  <span className="text-slate-800 font-semibold">{selectedPlot.plotType}</span>
                </div>
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

      {step === 3 && (
        <div className="bg-white border border-slate-200 shadow-2xs p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Contract Summary
          </h3>
          <div className="flex flex-col gap-4 text-xs font-semibold">
            {/* Customer Info */}
            {selectedCustomer && (
              <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                <span className="text-[0.68rem] text-slate-400 uppercase">Customer</span>
                <span className="font-bold text-slate-800 capitalize">
                  {selectedCustomer.name} ({selectedCustomer.customerCode || selectedCustomer.customerId})
                </span>
              </div>
            )}

            {/* Plot Info & Value */}
            {selectedPlot && (
              <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                <span className="text-[0.68rem] text-slate-400 uppercase">Selected Plot</span>
                <span className="font-bold text-teal-800">
                  Plot #{selectedPlot.plotNumber} ({selectedPlot.plotSize} Sq Ft)
                </span>
                <span className="text-slate-500 font-medium">
                  Rate: ₹{baseRate}/sqft {isCorner ? `+ Corner (+${cornerExtra}%) = ₹${effectiveRate}/sqft` : ''}
                </span>
                <span className="text-slate-900 font-bold mt-1 font-mono">
                  Gross: ₹{calculatedPlotValue.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Scheme & Payment Overview */}
            <div className="flex flex-col gap-2">
              <span className="text-[0.68rem] text-slate-400 uppercase">Financial Terms</span>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Scheme:</span>
                <span className="font-bold text-slate-800">
                  {isOneTime ? '0-Month One Time' : `${form.tenureMonths}-Month EMI`}
                </span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-semibold">
                  <span>Discount:</span>
                  <span>- ₹{calculatedDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-100 pt-2 font-bold text-slate-900">
                <span>Net Amount:</span>
                <span className="font-mono">₹{netContractValue.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-800 font-bold pt-1">
                <span>Downpayment ({isOneTime ? '100%' : '40% Gross'}):</span>
                <span className="font-mono">₹{downpaymentAmt.toLocaleString('en-IN')}</span>
              </div>

              {!isOneTime && (
                <div className="flex justify-between items-center text-teal-800 font-bold">
                  <span>EMI ({form.tenureMonths} mos balance):</span>
                  <span className="font-mono">₹{emiMonthlyAmt.toLocaleString('en-IN')} / mo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
