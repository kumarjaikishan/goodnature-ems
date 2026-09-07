import React from 'react';
import Button from '@/components/ui/Button';
import numberToWords from '@/utils/numToWord';
import { Banknote, CheckCircle, Clock } from 'lucide-react';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none';

const ReceivePaymentForm = ({
  handleSubmit,
  bookings,
  selectedBooking,
  handleBookingSelect,
  detailsLoading,
  installments,
  selectedInstIds,
  handleCheckboxToggle,
  getLateFine,
  getLateDays,
  gracePeriod,
  getSelectedLateFineTotal,
  form,
  setForm,
  handleCollectionDateChange,
  submitLoading,
}) => {
  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Booking Selection & Payment Form */}
      <div className="flex flex-col gap-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
            <Banknote size={20} />
          </div>
          <span>Receive Payment</span>
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Active Contracts</label>
            <select
              className={inputCls}
              onChange={(e) => handleBookingSelect(e.target.value)}
              value={selectedBooking?._id || ''}
            >
              <option value="">Select Customer / Plot Booking...</option>
              {bookings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.customerId?.name || b.customerName} | {b.bookingNumber} | Plot #{b.plotId?.plotNumber}
                </option>
              ))}
            </select>
          </div>

          {selectedBooking && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs select-none">
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Customer Name</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedBooking.customerId?.name || selectedBooking.customerName || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Booking No</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{selectedBooking.bookingNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Total Plot Value</span>
                  <span className="font-bold text-slate-800 text-sm">
                    ₹{(selectedBooking.plotValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Outstanding Balance</span>
                  <span className="font-bold text-teal-800 text-sm">
                    ₹{(selectedBooking.remainingAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-teal-700 rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 font-medium animate-pulse">
                    Loading installment schedule for #{selectedBooking.bookingNumber}...
                  </span>
                </div>
              ) : installments && installments.length > 0 ? (
                <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  <label className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wide px-1">
                    Installments Ledger / Select to Pay
                  </label>
                  <table className="w-full border-collapse text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-semibold select-none">
                        <th className="p-2 w-8"></th>
                        <th className="p-2">Inst #</th>
                        <th className="p-2">Due Date</th>
                        <th className="p-2 text-right">Principal</th>
                        <th className="p-2 text-right">Late Fine</th>
                        <th className="p-2 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((inst) => {
                        const isPaid = inst.status === 'PAID';
                        const principalDue = inst.dueAmount - inst.paidAmount;
                        const fine = getLateFine(inst, gracePeriod, form.createdAt);
                        const lateDays = getLateDays(inst, gracePeriod, form.createdAt);
                        const totalDue = principalDue + fine;
                        const isSelected = selectedInstIds.includes(inst._id);

                        const collectionDateObj = form.createdAt ? new Date(form.createdAt) : new Date();
                        const currentYear = collectionDateObj.getFullYear();
                        const currentMonth = collectionDateObj.getMonth();
                        const dueDate = new Date(inst.dueDate);
                        const dueYear = dueDate.getFullYear();
                        const dueMonth = dueDate.getMonth();

                        const isOverdue =
                          !isPaid && (dueYear < currentYear || (dueYear === currentYear && dueMonth < currentMonth));
                        const isCurrentMonthDue = !isPaid && dueYear === currentYear && dueMonth === currentMonth;

                        let rowBgClass = '';
                        let statusBadge = null;

                        if (isPaid) {
                          rowBgClass = 'opacity-50 cursor-not-allowed';
                        } else if (isSelected) {
                          rowBgClass = 'bg-teal-50/70 border-l-2 border-teal-700';
                        } else if (isOverdue) {
                          rowBgClass = 'bg-rose-50/50 hover:bg-rose-50';
                          statusBadge = (
                            <span className="ml-1.5 px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded-full bg-rose-100 text-rose-700">
                              Overdue
                            </span>
                          );
                        } else if (isCurrentMonthDue) {
                          rowBgClass = 'bg-amber-50/50 hover:bg-amber-50';
                          statusBadge = (
                            <span className="ml-1.5 px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded-full bg-amber-100 text-amber-700">
                              Due
                            </span>
                          );
                        } else {
                          rowBgClass = 'hover:bg-slate-100';
                        }

                        return (
                          <tr
                            key={inst._id}
                            onClick={() => !isPaid && handleCheckboxToggle(inst)}
                            className={`border-b border-slate-100 cursor-pointer select-none transition ${rowBgClass}`}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isPaid}
                                onChange={() => {}}
                                className="rounded border-slate-300 text-teal-700 focus:ring-teal-600 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 font-bold text-slate-800 flex items-center">
                              <span>{inst.installmentNumber === 0 ? 'Downpmt' : `#${inst.installmentNumber}`}</span>
                              {statusBadge}
                            </td>
                            <td className="p-2 text-slate-600">
                              {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="p-2 text-right text-slate-700">
                              ₹{principalDue.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 text-right font-bold text-rose-600">
                              {fine > 0 ? (
                                <div className="flex flex-col items-end leading-tight">
                                  <span>₹{fine.toLocaleString('en-IN')}</span>
                                  <span className="text-[0.65rem] font-medium text-slate-500">
                                    ({lateDays} days)
                                  </span>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800">
                              ₹{totalDue.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}

          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Collection Amount (₹)</label>
              <input
                className={inputCls}
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={form.amountPaid}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setForm({ ...form, amountPaid: val });
                }}
                placeholder="Enter collected cash"
                required
              />
              {form.amountPaid && Number(form.amountPaid) > 0 ? (
                <p className="text-[0.7rem] font-bold text-teal-800 mt-1 capitalize bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1">
                  {numberToWords(Math.floor(Number(form.amountPaid)))} Rupees Only
                </p>
              ) : null}
            </div>

            {selectedBooking?.scheme === 'MONTHLY_INSTALLMENT' && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Late Fine Rebate (₹)</label>
                  <span className="text-[0.65rem] text-slate-400 font-medium">
                    Max: ₹{getSelectedLateFineTotal().toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  className={inputCls}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  value={form.lateFineRebate}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setForm({ ...form, lateFineRebate: val });
                  }}
                  placeholder="Enter rebate amount if any"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Payment Mode</label>
              <select
                className={inputCls}
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / Online</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="neft_rtgs">NEFT / RTGS</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Collection Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.createdAt}
                onChange={(e) => handleCollectionDateChange(e.target.value)}
                required
              />
            </div>

            {form.paymentMode !== 'cash' && (
              <div className="flex flex-col gap-1">
                <label className={labelCls}>
                  {form.paymentMode === 'cheque' ? 'Cheque Number (6 Digits)' : 'Reference / UTR / Transaction No.'}
                </label>
                <input
                  className={inputCls}
                  type={form.paymentMode === 'cheque' ? 'tel' : 'text'}
                  inputMode={form.paymentMode === 'cheque' ? 'numeric' : 'text'}
                  maxLength={form.paymentMode === 'cheque' ? 6 : 50}
                  pattern={form.paymentMode === 'cheque' ? '[0-9]{6}' : undefined}
                  placeholder={form.paymentMode === 'cheque' ? 'e.g. 045123' : 'Enter UTR / Transaction Reference'}
                  value={form.transactionReference}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (form.paymentMode === 'cheque') {
                      val = val.replace(/[^0-9]/g, '').slice(0, 6);
                    }
                    setForm({ ...form, transactionReference: val });
                  }}
                  required
                />
                {form.paymentMode === 'cheque' && form.transactionReference && form.transactionReference.length !== 6 && (
                  <span className="text-[10px] text-amber-600 font-semibold mt-0.5">
                    {form.transactionReference.length}/6 digits entered
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <label className={labelCls}>Narration / Remarks</label>
              <textarea
                className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition min-h-[70px] resize-none"
                placeholder="Enter narration notes for this payment..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </div>

          {form.paymentMode !== 'cash' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
              <Clock size={16} className="text-amber-700 shrink-0" />
              <span>
                <strong>Non-Cash Payment Notice:</strong> Payments collected via{' '}
                <strong>{form.paymentMode.toUpperCase()}</strong> will be recorded in <strong>Pending Approval</strong>{' '}
                state and will realize into the customer's balance once verified & approved by an admin.
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitLoading}
            disabled={submitLoading || !selectedBooking || !form.amountPaid || Number(form.amountPaid) <= 0}
            startIcon={CheckCircle}
            className="mt-2 w-full py-3"
          >
            {form.paymentMode === 'cash'
              ? 'Collect Payment (Realize Immediately)'
              : 'Submit Collection for Admin Approval'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReceivePaymentForm;
