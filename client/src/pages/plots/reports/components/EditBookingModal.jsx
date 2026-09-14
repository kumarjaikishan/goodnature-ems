import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import { X, Building2, Edit3, Calculator, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const formatIndianDate = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
};

const getDynamicEmiHelper = (bookingDateStr, dpDaysVal) => {
  if (!bookingDateStr) return 'Default 90 days allowed to complete downpayment.';
  const bDate = new Date(bookingDateStr);
  if (isNaN(bDate.getTime())) return 'Default 90 days allowed to complete downpayment.';

  const dpDays = Number(dpDaysVal) || 90;
  const bFormatted = formatIndianDate(bDate);

  const dpDueDate = new Date(bDate.getTime() + dpDays * 24 * 60 * 60 * 1000);
  const dpDueFormatted = formatIndianDate(dpDueDate);

  const firstEmiDate = new Date(dpDueDate);
  firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
  firstEmiDate.setDate(1);
  const firstEmiFormatted = formatIndianDate(firstEmiDate);

  return `Downpayment due by ${dpDueFormatted} (${bFormatted} + ${dpDays} days). 1st EMI starts on ${firstEmiFormatted}.`;
};

const getDynamicOneTimeHelper = (bookingDateStr, dpDaysVal) => {
  if (!bookingDateStr) return 'Full payment time limit (default 90 days).';
  const bDate = new Date(bookingDateStr);
  if (isNaN(bDate.getTime())) return 'Full payment time limit (default 90 days).';

  const days = Number(dpDaysVal) || 90;
  const targetDate = new Date(bDate.getTime() + days * 24 * 60 * 60 * 1000);
  const targetFormatted = formatIndianDate(targetDate);

  return `Full payment due by ${targetFormatted} (${days} days from booking date).`;
};

const EditBookingModal = ({
  editingBooking,
  onClose,
  onSubmit,
  editForm,
  setEditForm,
  saving,
  customerSearch,
  setCustomerSearch,
  showCustomerDropdown,
  setShowCustomerDropdown,
  customerSearchResults,
  plotsList,
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
  downpaymentAmt,
  emiPrincipalAmt,
  emiMonthlyAmt,
  availableLandSources,
  plotArea,
  customSqFtRate,
  setCustomSqFtRate,
  customDpRate,
  setCustomDpRate,
  effectiveSqFtRate,
  calculatedPlotValue,
  emiRatePerSqFt,
}) => {
  if (!editingBooking) return null;

  const totalAllocated = (editForm.landSourcing || []).reduce(
    (sum, s) => sum + (Number(s.allocatedSqFt) || 0),
    0
  );
  const isLandStockValid =
    (editForm.landSourcing || []).length > 0 &&
    (editForm.landSourcing || []).every((s) => Boolean(s.agreementId) && Number(s.allocatedSqFt) > 0) &&
    Math.abs(totalAllocated - plotArea) <= 0.5;

  const isFormValid =
    Boolean(editForm.bookingDate) &&
    Number(customSqFtRate) > 0 &&
    (isOneTime || (Number(customDpRate) > 0 && Number(customDpRate) <= Number(customSqFtRate))) &&
    isLandStockValid;

  return (
    <Modalbox
      open={Boolean(editingBooking)}
      onClose={onClose}
      title={`Edit Booking Contract #${editingBooking?.bookingNumber}`}
      subtitle="Update customer, plot, pricing, payment, and land stock parameters."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form="edit-booking-form"
            loading={saving}
            disabled={!isFormValid || saving}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-booking-form" onSubmit={onSubmit} className="flex flex-col gap-4 text-xs">
        {/* 1. Customer & Plot Selection */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            1. Customer & Plot Assignment
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Search */}
            <div className="flex flex-col gap-1 relative">
              <label className="text-xs font-semibold text-slate-600">Customer</label>
              <input
                type="text"
                placeholder="Search customer by name, code or mobile..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none pr-8"
              />
              {customerSearch && (
                <button
                  onClick={() => {
                    setEditForm({ ...editForm, customerId: '' });
                    setCustomerSearch('');
                  }}
                  className="absolute right-3 top-7 text-slate-400 hover:text-slate-600 cursor-pointer"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <div className="absolute top-[62px] left-0 right-0 max-h-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto">
                  {customerSearchResults.map((c) => (
                    <div
                      key={c._id}
                      className="p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold flex items-center justify-between border-b border-slate-100 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setEditForm({ ...editForm, customerId: c._id });
                        setCustomerSearch(`${c.name} (${c.customerCode || c.mobile || ''})`);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-[0.65rem] text-slate-400">{c.mobile}</p>
                      </div>
                      <span className="text-[0.65rem] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {c.customerCode || 'CUSTOMER'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plot Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Select Plot</label>
              <select
                value={editForm.plotId}
                onChange={(e) => setEditForm({ ...editForm, plotId: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                required
              >
                <option value={editingBooking?.plotId?._id || editingBooking?.plotId}>
                  Plot #{editingBooking?.plotId?.plotNumber || 'Current Plot'} (Current)
                </option>
                {plotsList
                  .filter((p) => p._id !== (editingBooking?.plotId?._id || editingBooking?.plotId) && p.status === 'AVAILABLE')
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      Plot #{p.plotNumber} ({p.seriesId?.seriesName || 'Series'}) - {p.areaSqFt || 0} SQFT @ ₹
                      {p.ratePerSqFt || 0}/SQFT
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Booking Type & Status Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Booking Type</label>
            <select
              value={editForm.bookingType}
              onChange={(e) => setEditForm({ ...editForm, bookingType: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
            >
              <option value="BOOKING">BOOKING (Confirmed)</option>
              <option value="HOLD">HOLD (Temporary Lock)</option>
            </select>
          </div>

          {editForm.bookingType === 'HOLD' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Hold Expiry Term</label>
              <select
                value={editForm.holdExpiryDays}
                onChange={(e) => setEditForm({ ...editForm, holdExpiryDays: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              >
                <option value="7">7 Days Hold</option>
                <option value="15">15 Days Hold</option>
                <option value="30">30 Days Hold</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Booking Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="HOLD">HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Agreement No.</label>
            <input
              type="text"
              value={editForm.agreementNumber || ''}
              onChange={(e) => setEditForm({ ...editForm, agreementNumber: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              placeholder="e.g. AG-2026/089"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Booking Date *</label>
            <input
              type="date"
              value={editForm.bookingDate || ''}
              onChange={(e) => setEditForm({ ...editForm, bookingDate: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              required
            />
          </div>
        </div>

        {/* 3. Scheme, Dynamic Rates & Pricing */}
        <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-teal-100/80 pb-2">
            <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-700" />
              2. Tenure Plan & Pricing (समय / दर)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Tenure / Scheme Matrix Dropdown */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Tenure & Master Plan (समय / बिक्री प्लान) *</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-teal-950 focus:ring-2 focus:ring-teal-600 outline-none"
                value={editForm.tenureMonths}
                onChange={(e) => {
                  const newTenure = Number(e.target.value);
                  const selectedSlab = slabs.find((s) => Number(s.tenureMonths) === newTenure) || slabs[0];
                  setEditForm({ ...editForm, tenureMonths: newTenure });
                  setCustomSqFtRate(String(selectedSlab.plotRate || 1000));
                  setCustomDpRate(String(selectedSlab.downpaymentRate || (newTenure === 0 ? selectedSlab.plotRate || 1000 : 500)));
                }}
              >
                {slabs.map((s) => (
                  <option key={s.tenureMonths} value={s.tenureMonths}>
                    {s.tenureMonths === 0
                      ? `0 Months (One-Time Payment) — Master Rate: ₹${s.plotRate}/sqft [100% Downpayment]`
                      : `${s.tenureMonths} Months EMI — Master Rate: ₹${s.plotRate}/sqft [Default DP: ₹${s.downpaymentRate || 500}/sqft | EMI: ₹${s.emiRate || (s.plotRate - 500)}/sqft]`}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-teal-700 font-semibold px-1">
                Master Plan: ₹{currentSlab.plotRate}/sqft | DP: ₹{currentSlab.downpaymentRate || (currentSlab.tenureMonths === 0 ? 1000 : 500)}/sqft | Duration: {currentSlab.tenureMonths === 0 ? 'Full Payment' : `${currentSlab.tenureMonths} Months`}
              </span>
            </div>

            {/* Editable Plot Selling Rate per SqFt */}
            <div className="flex flex-col gap-1 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit3 size={13} className="text-teal-700" />
                  Plot Selling Rate (₹ / Sq.Ft.) *
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    className="w-full pl-6 pr-3 py-1.5 bg-slate-50/50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
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
              <span className="text-[10px] text-slate-500 font-medium">
                Effective Total: ₹{calculatedPlotValue.toLocaleString('en-IN')} ({plotArea} sqft @ ₹{effectiveSqFtRate}/sqft)
              </span>
            </div>

            {/* Editable Downpayment Rate per SqFt */}
            <div className="flex flex-col gap-1 p-3 bg-teal-50/40 border border-teal-200 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Calculator size={13} className="text-teal-700" />
                  Downpayment Rate (₹ / Sq.Ft.) *
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-teal-700 font-bold text-xs">₹</span>
                  <input
                    className="w-full pl-6 pr-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-mono font-bold text-teal-950 focus:ring-2 focus:ring-teal-600 outline-none"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customDpRate ?? ''}
                    onChange={(e) => setCustomDpRate(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="DP rate per sqft"
                    required
                  />
                </div>
                <span className="text-xs font-semibold text-teal-800">/ Sq.Ft.</span>
              </div>
              <span className="text-[10px] text-teal-800 font-bold">
                Total DP: ₹{downpaymentAmt.toLocaleString('en-IN')} (₹{customDpRate || 0} × {plotArea} sqft)
              </span>
            </div>

            {/* Discount Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Discount (Deducted from EMI)</label>
              <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 bg-white">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-2.5 py-2 bg-slate-100 text-xs font-bold text-slate-700 border-r border-slate-300 outline-none cursor-pointer"
                >
                  <option value="RUPEE">₹ (Flat)</option>
                  <option value="PERCENT">% (Percentage)</option>
                  <option value="SQFT_RATE">₹ / Sq.Ft.</option>
                </select>
                <input
                  className="w-full px-3 py-2 text-xs bg-transparent outline-none text-slate-800 font-medium"
                  type="tel"
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
                <span className="text-[10px] text-emerald-700 font-semibold px-1">
                  Discount: ₹{calculatedDiscount.toLocaleString('en-IN')} (deducted from EMI balance)
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 px-1">
                  Discount reduces EMI balance without altering the downpayment.
                </span>
              )}
            </div>

            {/* Govt Rate */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Govt. Base Rate (₹ / Sq.Ft.)</label>
              <input
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                type="tel"
                value={govtRate}
                onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Govt rate per sqft (Default 100)"
              />
            </div>

            {/* Due Days Config */}
            {isOneTime ? (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Payment Due Period (Days) *</label>
                <input
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editForm.oneTimeDays ?? 90}
                  onChange={(e) => setEditForm({ ...editForm, oneTimeDays: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Default 90 days"
                  required
                />
                <span className="text-[10px] text-teal-700 font-medium px-1">
                  {getDynamicOneTimeHelper(editForm.bookingDate, editForm.oneTimeDays ?? 90)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Downpayment Due Period (Days) *</label>
                <input
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editForm.downpaymentDays ?? 90}
                  onChange={(e) => setEditForm({ ...editForm, downpaymentDays: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Default 90 days (editable)"
                  required
                />
                <span className="text-[10px] text-teal-700 font-medium px-1">
                  {getDynamicEmiHelper(editForm.bookingDate, editForm.downpaymentDays ?? 90)}
                </span>
              </div>
            )}
          </div>

          {/* Sequential Structured Financial Table */}
          <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
            <div className="px-3.5 py-2 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between text-[11px] uppercase tracking-wider">
              <span>Financial Contract Breakdown</span>
              <span className="text-teal-800 font-extrabold">{isOneTime ? 'Full Payment' : `${editForm.tenureMonths} Months EMI`}</span>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <td className="py-2 px-3.5 font-semibold text-slate-600">
                    Gross Plot Value
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {plotArea} sqft × ₹{effectiveSqFtRate}/sqft
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono font-bold text-slate-900">
                    ₹{calculatedPlotValue.toLocaleString('en-IN')}
                  </td>
                </tr>

                <tr className="border-b border-slate-100 bg-white">
                  <td className="py-2 px-3.5 font-semibold text-slate-600">
                    Discount Given
                    {calculatedDiscount > 0 && (
                      <span className="block text-[10px] text-rose-500 font-medium">
                        Deducted from EMI balance
                      </span>
                    )}
                  </td>
                  <td className={`py-2 px-3.5 text-right font-mono font-bold ${calculatedDiscount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {calculatedDiscount > 0 ? `- ₹${calculatedDiscount.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                </tr>

                <tr className="border-b border-slate-200 bg-teal-50/50">
                  <td className="py-2 px-3.5 font-bold text-teal-950">
                    Net Plot Contract Value
                    <span className="block text-[10px] text-teal-700 font-medium">
                      Gross Value - Discount
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono font-extrabold text-teal-950 text-sm">
                    ₹{netContractValue.toLocaleString('en-IN')}
                  </td>
                </tr>

                <tr className="border-b border-slate-100 bg-white">
                  <td className="py-2 px-3.5 font-semibold text-slate-700">
                    {isOneTime ? 'Full Payment Due (100%)' : 'Downpayment (DP)'}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {isOneTime ? '100% full payment' : `₹${customDpRate || 500}/sqft × ${plotArea} sqft (${editForm.downpaymentDays || 90} days)`}
                    </span>
                  </td>
                  <td className="py-2 px-3.5 text-right font-mono font-bold text-emerald-800">
                    ₹{downpaymentAmt.toLocaleString('en-IN')}
                  </td>
                </tr>

                {!isOneTime && (
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <td className="py-2 px-3.5 font-semibold text-slate-700">
                      Remaining Balance EMI Principal
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Net Value - Downpayment (₹{emiRatePerSqFt || 0}/sqft)
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono font-bold text-blue-900">
                      ₹{emiPrincipalAmt.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {!isOneTime && (
              <div className="p-3 bg-gradient-to-r from-teal-50 via-teal-100/40 to-emerald-50 border-t border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-950 uppercase tracking-wider block">
                    Monthly Installment ({editForm.tenureMonths} EMIs)
                  </span>
                  <span className="text-[11px] text-teal-700 font-medium">
                    ₹{emiPrincipalAmt.toLocaleString('en-IN')} / {editForm.tenureMonths} months
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-teal-950">
                    ₹{emiMonthlyAmt.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-teal-700 block font-bold">/ Month</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Land Acquisition Stock Allocation */}
        <div className="p-4 bg-teal-50/70 border border-teal-300 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 size={16} className="text-teal-700" />
                3. Land Acquisition Sourcing (किसान एग्रीमेंट / डीड स्टॉक){' '}
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
                  const currentTotal = (editForm.landSourcing || []).reduce(
                    (sum, s) => sum + (Number(s.allocatedSqFt) || 0),
                    0
                  );
                  const remaining = Math.max(0, plotArea - currentTotal);
                  setEditForm({
                    ...editForm,
                    landSourcing: [
                      ...(editForm.landSourcing || []),
                      {
                        sourceType: '',
                        agreementId: '',
                        agreementNumber: '',
                        deedId: null,
                        deedNumber: '',
                        allocatedSqFt: remaining > 0 ? remaining : plotArea,
                      },
                    ],
                  });
                }}
              >
                + Add Land Source
              </Button>
            )}
          </div>

          {!editForm.landSourcing || editForm.landSourcing.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>No agreement selected. Click &quot;+ Add Land Source&quot; or allocate stock below.</span>
              </div>
              {availableLandSources.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditForm({
                      ...editForm,
                      landSourcing: [
                        {
                          sourceType: '',
                          agreementId: '',
                          agreementNumber: '',
                          deedId: null,
                          deedNumber: '',
                          allocatedSqFt: plotArea,
                        },
                      ],
                    });
                  }}
                >
                  + Choose Land Agreement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {editForm.landSourcing.map((src, idx) => {
                const selectedSourceObj = availableLandSources.find((s) =>
                  src.deedNumber
                    ? s.deedNumber === src.deedNumber
                    : String(s.agreementId) === String(src.agreementId)
                );

                const selectValue = src.deedNumber
                  ? `DEED_${src.deedNumber}`
                  : src.agreementId
                  ? `AGR_${src.agreementId}`
                  : '';

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2.5 bg-white p-3 rounded-xl border border-teal-200 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <select
                        className="flex-1 h-9 px-3 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg outline-none w-full focus:ring-2 focus:ring-teal-600 focus:bg-white"
                        value={selectValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            const updated = [...editForm.landSourcing];
                            updated[idx] = {
                              sourceType: '',
                              agreementId: '',
                              agreementNumber: '',
                              deedId: null,
                              deedNumber: '',
                              allocatedSqFt: src.allocatedSqFt || plotArea,
                            };
                            setEditForm({ ...editForm, landSourcing: updated });
                            return;
                          }
                          const chosen = availableLandSources.find(
                            (s) => (s.deedNumber ? `DEED_${s.deedNumber}` : `AGR_${s.agreementId}`) === val
                          );
                          if (!chosen) return;
                          const updated = [...editForm.landSourcing];
                          updated[idx] = {
                            ...updated[idx],
                            sourceType: chosen.sourceType,
                            agreementId: chosen.agreementId,
                            agreementNumber: chosen.agreementNumber,
                            deedId: chosen.deedId || null,
                            deedNumber: chosen.deedNumber || '',
                          };
                          setEditForm({ ...editForm, landSourcing: updated });
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
                          className="w-28 h-9 px-2.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg outline-none text-right font-mono focus:ring-2 focus:ring-teal-600"
                          value={src.allocatedSqFt ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...editForm.landSourcing];
                            updated[idx].allocatedSqFt = val;
                            updated[idx].allocatedDismil = Math.round((val / 435.6) * 1000) / 1000;
                            setEditForm({ ...editForm, landSourcing: updated });
                          }}
                          placeholder="Sq. Ft."
                        />
                        <span className="text-xs font-semibold text-slate-500">SqFt</span>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = editForm.landSourcing.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, landSourcing: filtered });
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove Land Source"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Dynamic info card upon selection */}
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
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Available (Sq.Ft.)</span>
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
                const isMatch = Math.abs(totalAllocated - plotArea) <= 0.5 && isLandStockValid;
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
                            {(editForm.landSourcing || []).some((s) => !s.agreementId)
                              ? '⚠️ Please choose an agreement for all rows'
                              : '⚠️ Sourced Area Mismatch:'}
                          </span>
                        </>
                      )}
                    </span>
                    <span className={`font-mono ${isMatch ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {totalAllocated} / {plotArea} Sq. Ft.
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* 5. Payment Mode & Transaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Payment Mode</label>
            <select
              value={editForm.paymentMode}
              onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online / UPI</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Transaction Ref / Cheque No.</label>
            <input
              type="text"
              value={editForm.transactionReference}
              onChange={(e) => setEditForm({ ...editForm, transactionReference: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              placeholder="e.g. TXN987654321 / CHQ-1002"
            />
          </div>
        </div>

        {/* Fixed Sponsor Info */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Sponsor / Agent (Fixed with Customer Profile)</label>
          <div className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between cursor-not-allowed">
            <span>
              {editingBooking?.sponsorId?.name
                ? `${editingBooking.sponsorId.name} (${
                    editingBooking.sponsorId.sponsorCode || editingBooking.sponsorId.customerId || 'Agent'
                  })`
                : 'Direct / Company (No Sponsor)'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Fixed</span>
          </div>
        </div>

        {/* 6. Admin Audit Reason Narration */}
        <div className="flex flex-col gap-1 p-3 bg-teal-50/40 border border-teal-200 rounded-xl">
          <label className="text-xs font-bold text-teal-950 flex items-center justify-between">
            <span>📝 Edit Reason / Admin Narration (कारण विवरण)</span>
            <span className="text-[10px] text-teal-700 font-normal">Tracked in audit trail & revision history</span>
          </label>
          <textarea
            value={editForm.reason || ''}
            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
            rows="2"
            className="w-full bg-white border border-teal-200 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-xs text-slate-800 transition resize-none mt-1"
            placeholder="e.g. Rate adjustment and tenure terms updated per customer agreement..."
          />
        </div>

        {/* Internal Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Internal Notes / Remarks</label>
          <textarea
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            rows="2"
            className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-xs text-slate-800 transition resize-none"
            placeholder="Enter general contract notes..."
          />
        </div>
      </form>
    </Modalbox>
  );
};

export default EditBookingModal;

