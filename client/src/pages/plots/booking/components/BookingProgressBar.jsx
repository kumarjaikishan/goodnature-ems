import React from 'react';

export const BookingProgressBar = ({ step, setStep }) => {
  return (
    <div className="bg-white border border-slate-200 shadow-2xs p-5 sm:p-6 rounded-2xl w-full">
      <div className="relative flex items-center justify-between w-full">
        {/* Background Track Line */}
        <div className="absolute left-[12%] right-[12%] top-5 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full" />

        {/* Active Filled Progress Line */}
        <div
          className="absolute left-[12%] top-5 -translate-y-1/2 h-1 transition-all duration-500 ease-out z-0 rounded-full bg-teal-700"
          style={{
            width: step === 1 ? '0%' : step === 2 ? '38%' : '76%',
          }}
        />

        {/* Step 1 Node */}
        <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
          <button
            type="button"
            onClick={() => step > 1 && setStep(1)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              step === 1
                ? 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-md scale-105'
                : step > 1
                ? 'bg-emerald-600 text-white shadow-xs cursor-pointer ring-4 ring-emerald-50 hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {step > 1 ? '✓' : '1'}
          </button>
          <span
            className={`text-xs font-bold tracking-tight text-center ${
              step === 1 ? 'text-teal-900' : step > 1 ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            Customer
          </span>
        </div>

        {/* Step 2 Node */}
        <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
          <button
            type="button"
            onClick={() => step > 2 && setStep(2)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              step === 2
                ? 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-md scale-105'
                : step > 2
                ? 'bg-emerald-600 text-white shadow-xs cursor-pointer ring-4 ring-emerald-50 hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {step > 2 ? '✓' : '2'}
          </button>
          <span
            className={`text-xs font-bold tracking-tight text-center ${
              step === 2 ? 'text-teal-900' : step > 2 ? 'text-emerald-700' : 'text-slate-400'
            }`}
          >
            Plot Inventory
          </span>
        </div>

        {/* Step 3 Node */}
        <div className="relative flex flex-col items-center gap-2 z-10 bg-white px-2 sm:px-4">
          <button
            type="button"
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              step === 3
                ? 'bg-teal-700 text-white ring-4 ring-teal-500/20 shadow-md scale-105'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            3
          </button>
          <span
            className={`text-xs font-bold tracking-tight text-center ${
              step === 3 ? 'text-teal-900' : 'text-slate-400'
            }`}
          >
            Terms & Payment
          </span>
        </div>
      </div>
    </div>
  );
};
