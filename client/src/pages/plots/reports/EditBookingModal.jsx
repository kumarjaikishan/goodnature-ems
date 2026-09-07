import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import { X, Building2 } from 'lucide-react';

const formatIndianDate = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
};

const getDynamicEmiHelper = (bookingDateStr, dpMonthsVal) => {
  if (!bookingDateStr) return 'Time allowed to complete 40% downpayment.';
  const bDate = new Date(bookingDateStr);
  if (isNaN(bDate.getTime())) return 'Time allowed to complete 40% downpayment.';

  const dpMonths = Number(dpMonthsVal) || 1;
  const bFormatted = formatIndianDate(bDate);

  const dpDate = new Date(bDate);
  dpDate.setMonth(dpDate.getMonth() + dpMonths);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dpMonthYear = `${monthNames[dpDate.getMonth()]} ${dpDate.getFullYear()}`;

  const firstEmiDate = new Date(bDate);
  firstEmiDate.setMonth(firstEmiDate.getMonth() + dpMonths + 1);
  firstEmiDate.setDate(1);
  const firstEmiFormatted = formatIndianDate(firstEmiDate);

  return `Time allowed to complete 40% downpayment (${bFormatted} + ${dpMonths} month${dpMonths > 1 ? 's' : ''} = DP ends in ${dpMonthYear}). 1st EMI starts on ${firstEmiFormatted}.`;
};

const getDynamicOneTimeHelper = (bookingDateStr, oneTimeMonthsVal) => {
  if (!bookingDateStr) return 'Time allowed to complete one-time payment.';
  const bDate = new Date(bookingDateStr);
  if (isNaN(bDate.getTime())) return 'Time allowed to complete one-time payment.';

  const otMonths = Number(oneTimeMonthsVal) || 1;
  const targetDate = new Date(bDate);
  targetDate.setMonth(targetDate.getMonth() + otMonths);
  const targetFormatted = formatIndianDate(targetDate);

  return `Full payment due by ${targetFormatted} (${otMonths} month${otMonths > 1 ? 's' : ''} from booking date).`;
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
}) => {
  if (!editingBooking) return null;

  return (
    <Modalbox open={Boolean(editingBooking)} onClose={onClose}>
      <div className="p-6 bg-white rounded-2xl w-[720px] max-w-[95vw] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Edit Booking Contract #{editingBooking?.bookingNumber}
            </h3>
            <p className="text-[0.7rem] font-medium text-slate-500">
              Update customer, plot, pricing, payment, and land stock parameters.
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition p-1"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xs">
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none pr-8"
                />
                {customerSearch && (
                  <button
                    onClick={() => {
                      setEditForm({ ...editForm, customerId: '' });
                      setCustomerSearch('');
                    }}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div className="absolute top-[68px] left-0 right-0 max-h-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-y-auto">
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Booking Type</label>
              <select
                value={editForm.bookingType}
                onChange={(e) => setEditForm({ ...editForm, bookingType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
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
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
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
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="HOLD">HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Contract Agreement No.</label>
              <input
                type="text"
                value={editForm.agreementNumber || ''}
                onChange={(e) => setEditForm({ ...editForm, agreementNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                placeholder="e.g. AG-2026/089"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Booking Date</label>
              <input
                type="date"
                value={editForm.bookingDate || ''}
                onChange={(e) => setEditForm({ ...editForm, bookingDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                required
              />
            </div>
          </div>

          {/* 3. Scheme, Pricing & Terms */}
          <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wide">2. Tenure & Pricing Slab (समय / दर)</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tenure / Scheme Matrix Dropdown */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Tenure & Rate Slab (समय / बिक्री दर) *</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-sm font-bold text-teal-950 focus:ring-2 focus:ring-teal-600 outline-none"
                  value={editForm.tenureMonths}
                  onChange={(e) => setEditForm({ ...editForm, tenureMonths: Number(e.target.value) })}
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
                  Rate: ₹{currentSlab.plotRate}/sqft | Promoter: {currentSlab.promoterCommissionPercent}% | Dev:{' '}
                  {currentSlab.developerCommissionPercent}%
                </span>
              </div>

              {/* Discount Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Discount</label>
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
                <label className="text-xs font-semibold text-slate-700">Govt. Base Rate (₹ / Sq.Ft.)</label>
                <input
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                  type="tel"
                  value={govtRate}
                  onChange={(e) => setGovtRate(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Govt rate per sqft (Default 100)"
                />
              </div>

              {/* One Time vs EMI Breakdown */}
              {isOneTime ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">Total Final Payment (100%)</label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono cursor-not-allowed rounded-xl text-sm"
                      type="text"
                      value={`₹${netContractValue.toLocaleString('en-IN')}`}
                      disabled
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">Payment Time Limit (Months)</label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editForm.oneTimeMonths === 0 ? '0' : editForm.oneTimeMonths ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, oneTimeMonths: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="Time limit (e.g. 1, 2, 3 months)"
                      required
                    />
                    <span className="text-[10px] text-teal-700 font-medium px-1">
                      {getDynamicOneTimeHelper(editForm.bookingDate, editForm.oneTimeMonths)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">Downpayment (40% of Gross Plot Value)</label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-teal-50 border border-teal-200 text-teal-800 font-bold font-mono cursor-not-allowed rounded-xl text-sm"
                      type="text"
                      value={`₹${downpaymentAmt.toLocaleString('en-IN')}`}
                      disabled
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">Downpayment Grace Term (Months)</label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editForm.downpaymentMonths === 0 ? '0' : editForm.downpaymentMonths ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, downpaymentMonths: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="e.g. 1, 2, or 3 months"
                      required
                    />
                    <span className="text-[10px] text-teal-700 font-medium px-1">
                      {getDynamicEmiHelper(editForm.bookingDate, editForm.downpaymentMonths)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">EMI Balance (Net Contract - Downpayment)</label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono cursor-not-allowed rounded-xl text-sm"
                      type="text"
                      value={`₹${emiPrincipalAmt.toLocaleString('en-IN')}`}
                      disabled
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Monthly EMI Amount ({editForm.tenureMonths} Months)
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 font-black font-mono cursor-not-allowed rounded-xl text-sm"
                      type="text"
                      value={`₹${emiMonthlyAmt.toLocaleString('en-IN')} / month`}
                      disabled
                    />
                  </div>
                </>
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
                    const firstSrc = availableLandSources[0];
                    if (!firstSrc) return;
                    setEditForm({
                      ...editForm,
                      landSourcing: [
                        ...(editForm.landSourcing || []),
                        {
                          sourceType: firstSrc.sourceType,
                          agreementId: firstSrc.agreementId,
                          agreementNumber: firstSrc.agreementNumber,
                          deedId: firstSrc.deedId || null,
                          deedNumber: firstSrc.deedNumber || '',
                          mauja: firstSrc.mauja || '',
                          khataNumber: firstSrc.khataNumber || '',
                          khesraNumber: firstSrc.khesraNumber || '',
                          allocatedSqFt: remaining > 0 ? remaining : Math.min(plotArea, firstSrc.availableSqFt),
                          allocatedDismil:
                            Math.round(
                              ((remaining > 0 ? remaining : Math.min(plotArea, firstSrc.availableSqFt)) / 435.6) * 1000
                            ) / 1000,
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
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-800">
                <span>⚠️ No land stock linked yet. Choose an agreement/deed below.</span>
                {availableLandSources.length > 0 && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const first = availableLandSources[0];
                      setEditForm({
                        ...editForm,
                        landSourcing: [
                          {
                            sourceType: first.sourceType,
                            agreementId: first.agreementId,
                            agreementNumber: first.agreementNumber,
                            deedId: first.deedId || null,
                            deedNumber: first.deedNumber || '',
                            mauja: first.mauja || '',
                            khataNumber: first.khataNumber || '',
                            khesraNumber: first.khesraNumber || '',
                            allocatedSqFt: plotArea,
                            allocatedDismil: Math.round((plotArea / 435.6) * 1000) / 1000,
                          },
                        ],
                      });
                    }}
                  >
                    Auto-Allocate {plotArea} Sq.Ft.
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {editForm.landSourcing.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-xl border border-teal-200 shadow-2xs"
                  >
                    <select
                      className="flex-1 h-9 px-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg outline-none w-full"
                      value={src.deedNumber ? `DEED_${src.deedNumber}` : `AGR_${src.agreementId}`}
                      onChange={(e) => {
                        const chosen = availableLandSources.find(
                          (s) => (s.deedNumber ? `DEED_${s.deedNumber}` : `AGR_${s.agreementId}`) === e.target.value
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
                          mauja: chosen.mauja || '',
                          khataNumber: chosen.khataNumber || '',
                          khesraNumber: chosen.khesraNumber || '',
                        };
                        setEditForm({ ...editForm, landSourcing: updated });
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
                          const val = Number(e.target.value) || 0;
                          const updated = [...editForm.landSourcing];
                          updated[idx] = {
                            ...updated[idx],
                            allocatedSqFt: val,
                            allocatedDismil: Math.round((val / 435.6) * 1000) / 1000,
                          };
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
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {(() => {
                  const totalAlloc = (editForm.landSourcing || []).reduce(
                    (sum, s) => sum + (Number(s.allocatedSqFt) || 0),
                    0
                  );
                  const isMatch = Math.abs(totalAlloc - plotArea) <= 0.5;
                  return (
                    <div className="flex justify-between items-center text-xs font-bold px-1 pt-1">
                      <span className={isMatch ? 'text-emerald-700' : 'text-rose-600'}>
                        {isMatch ? '✅ Land Stock Area Matched:' : '⚠️ Sourced Area Mismatch:'}
                      </span>
                      <span className={`font-mono ${isMatch ? 'text-emerald-800' : 'text-rose-700'}`}>
                        {totalAlloc} / {plotArea} Sq. Ft.
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 5. Payment Mode & Sponsor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Payment Mode</label>
              <select
                value={editForm.paymentMode}
                onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
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
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none"
                placeholder="e.g. TXN987654321 / CHQ-1002"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Sponsor / Agent (Fixed with Customer Profile)</label>
            <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 flex items-center justify-between cursor-not-allowed">
              <span>
                {editingBooking?.sponsorId?.name
                  ? `${editingBooking.sponsorId.name} (${
                      editingBooking.sponsorId.sponsorCode || editingBooking.sponsorId.customerId || 'Agent'
                    })`
                  : 'Direct / Company (No Sponsor)'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Fixed</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Sponsor is mapped to the customer profile. To update sponsor, edit the customer record directly.
            </p>
          </div>

          <div className="flex flex-col gap-1 p-3.5 bg-teal-50/40 border border-teal-200 rounded-xl">
            <label className="text-xs font-bold text-teal-950 flex items-center justify-between">
              <span>📝 Edit Reason / Admin Narration (कारण विवरण)</span>
              <span className="text-[10px] text-teal-700 font-normal">Tracked in audit trail & revision history</span>
            </label>
            <textarea
              value={editForm.reason || ''}
              onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              rows="2"
              className="w-full bg-white border border-teal-200 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-xs text-slate-800 transition resize-none mt-1"
              placeholder="e.g. Customer requested tenure extension from 24 to 27 months and updated plot allocation..."
            />
            <p className="text-[10px] text-slate-500">
              Note: System will automatically log all modified fields in the audit record alongside your custom narration.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Internal Notes / Remarks</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows="2"
              className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
              placeholder="Enter general contract notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white z-10">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default EditBookingModal;
