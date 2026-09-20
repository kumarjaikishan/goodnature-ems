import React from 'react';
import {
  Building2,
  User,
  Banknote,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import Button from '../../../../components/ui/Button';

export const BookingConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  submitLoading,
  selectedCustomer,
  selectedPlot,
  seriesList = [],
  customSqFtRate,
  effectiveSqFtRate,
  calculatedPlotValue,
  calculatedDiscount,
  discountType,
  discountVal,
  netContractValue,
  paymentPlanMode,
  downpaymentAmt,
  customDpRate,
  remainingBalance,
  emiFrequency,
  installmentCount,
  totalTenureMonths,
  emiPerInstallmentAmt,
  form,
  landSourcing = [],
  selectedPremiumHeads = [],
  plotArea,
}) => {
  if (!isOpen) return null;

  const isOneTime = paymentPlanMode === 'ONE_TIME' || remainingBalance === 0;
  const series = seriesList.find((s) => s._id === (selectedPlot?.seriesId?._id || selectedPlot?.seriesId));

  return (
    <Modalbox open={isOpen} onClose={onClose} outside={!submitLoading}>
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl border border-teal-100 shadow-2xs">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Review Booking Details</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Will go to Pending Approval
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Please verify all plot, customer, payment terms, and land allocations before final submission.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Notice Banner */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Authorization Workflow:</span>
            <span>
              Once submitted, this plot will be reserved in <strong>PENDING</strong> status. An authorized administrator
              can review, approve, or reject this booking.
            </span>
          </div>
        </div>

        {/* 1. Customer & Plot Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Customer Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col justify-between gap-2.5">
            <div className="flex items-center gap-2 text-teal-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/60 pb-1.5">
              <User size={13} />
              <span>Customer Information</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{selectedCustomer?.name || '-'}</p>
              <p className="text-teal-700 font-mono font-bold text-xs mt-0.5">
                {selectedCustomer?.customerCode || selectedCustomer?.customerId || '-'}
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 pt-1">
              <p>
                <span className="text-slate-400">Mobile:</span>{' '}
                <strong className="text-slate-700">{selectedCustomer?.mobile || '-'}</strong>
              </p>
              {selectedCustomer?.fatherOrHusbandName && (
                <p>
                  <span className="text-slate-400">Father/Husband:</span>{' '}
                  <strong className="text-slate-700">{selectedCustomer.fatherOrHusbandName}</strong>
                </p>
              )}
              <p>
                <span className="text-slate-400">Sponsor:</span>{' '}
                <strong className="text-teal-800">
                  {selectedCustomer?.sponsorId?.name
                    ? `${selectedCustomer.sponsorId.name} (${selectedCustomer.sponsorId.sponsorCode || ''})`
                    : 'Direct / Company'}
                </strong>
              </p>
            </div>
          </div>

          {/* Plot Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col justify-between gap-2.5">
            <div className="flex items-center gap-2 text-teal-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/60 pb-1.5">
              <Building2 size={13} />
              <span>Plot Specifications</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Plot #{selectedPlot?.plotNumber}</p>
              <p className="text-slate-500 font-medium text-xs mt-0.5">
                Series: {series?.seriesName || selectedPlot?.seriesId?.seriesName || 'General Series'}
              </p>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 pt-1">
              <p>
                <span className="text-slate-400">Plot Size / Area:</span>{' '}
                <strong className="text-slate-900 font-mono">{plotArea} Sq.Ft.</strong>
              </p>
              <p>
                <span className="text-slate-400">Base Selling Rate:</span>{' '}
                <strong className="text-slate-900 font-mono">₹{customSqFtRate}/sqft</strong>
              </p>
              <p>
                <span className="text-slate-400">Effective Rate:</span>{' '}
                <strong className="text-teal-900 font-mono font-bold">₹{effectiveSqFtRate}/sqft</strong>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Financial Terms & Payment Plan Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Banknote size={14} className="text-teal-700" />
              Financial & Payment Plan Summary
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {isOneTime ? 'ONE TIME FULL PAYMENT' : 'EMI / INSTALLMENTS PLAN'}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex justify-between items-center px-4 py-2.5 bg-white">
              <span className="text-slate-600 font-medium">Gross Plot Value ({plotArea} sqft @ ₹{effectiveSqFtRate}/sqft)</span>
              <span className="font-bold font-mono text-slate-900">₹{calculatedPlotValue.toLocaleString('en-IN')}</span>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between items-center px-4 py-2.5 bg-rose-50/40">
                <span className="text-rose-700 font-medium">Discount Given</span>
                <span className="font-bold font-mono text-rose-700">- ₹{calculatedDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between items-center px-4 py-2.5 bg-teal-50/50">
              <span className="text-teal-950 font-bold">Net Plot Contract Value</span>
              <span className="font-extrabold font-mono text-teal-950 text-sm">
                ₹{netContractValue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center px-4 py-2.5 bg-white">
              <div>
                <span className="text-slate-700 font-semibold block">
                  {isOneTime ? 'Full Payment Downpayment (100%)' : 'Downpayment (DP)'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Due period: {form.downpaymentDays || 90} days (on or before booking due date)
                </span>
              </div>
              <span className="font-bold font-mono text-emerald-800 text-sm">
                ₹{downpaymentAmt.toLocaleString('en-IN')}
              </span>
            </div>

            {!isOneTime ? (
              <>
                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50/50">
                  <span className="text-slate-600 font-medium">Remaining Principal EMI Balance</span>
                  <span className="font-bold font-mono text-blue-900">
                    ₹{remainingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 bg-teal-50/30">
                  <div>
                    <span className="text-teal-950 font-bold block">
                      EMI Installment Schedule ({installmentCount} × {emiFrequency})
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium">
                      Total Tenure Duration: <strong>{totalTenureMonths} Months</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black font-mono text-teal-950 text-sm">
                      ₹{emiPerInstallmentAmt.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-teal-700 block font-semibold">
                      / {emiFrequency === 'MONTHLY' ? 'Month' : emiFrequency === 'QUARTERLY' ? 'Quarter' : emiFrequency === 'HALF_YEARLY' ? '6 Mos' : 'Year'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-4 py-2.5 bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>Full payment plan selected. No remaining EMI balance or installments required.</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Land Stock Sourcing Allocation Summary */}
        <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-teal-200/80 pb-1.5">
            <span className="font-bold text-teal-950 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <FileText size={13} />
              Land Stock Allocated ({landSourcing.length} Sources)
            </span>
            <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-300">
              Total: {plotArea} Sq.Ft.
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {landSourcing.map((src, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white/90 border border-teal-200 rounded-xl text-[11px]"
              >
                <div>
                  <span className="font-bold text-slate-800">
                    {src.sourceType === 'REGISTRY_DEED'
                      ? `Registry Deed #${src.deedNumber || 'N/A'}`
                      : `Agreement #${src.agreementNumber || 'N/A'}`}
                    {src.khesraNumber ? ` — Plot #${src.khesraNumber}` : ''}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {src.mauja ? `Mauja: ${src.mauja}` : ''} {src.thanaNumber ? `| Thana: ${src.thanaNumber}` : ''} {src.khataNumber ? `| Khata: ${src.khataNumber}` : ''}
                  </span>
                </div>
                <div className="text-right font-mono font-bold text-teal-900">
                  {src.allocatedSqFt} Sq.Ft.
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={submitLoading}
          >
            Cancel & Edit
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirm}
            loading={submitLoading}
            disabled={submitLoading}
            startIcon={ShieldCheck}
          >
            Confirm & Submit Booking
          </Button>
        </div>
      </div>
    </Modalbox>
  );
};

export default BookingConfirmationModal;
