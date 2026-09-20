import React, { useMemo } from 'react';
import Button from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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
  dpGracePeriod = 15,
  emiGracePeriod = 15,
  gracePeriod = 15,
  lateFineFrequency = 'YEARLY',
  lateFineRate = 24,
  lateFineDailyPercent,
  getSelectedLateFineTotal,
  form,
  setForm,
  handleCollectionDateChange,
  submitLoading,
  mode,
}) => {
  const isDownpaymentMode = mode === 'DOWNPAYMENT';
  const effectiveDpGrace = dpGracePeriod ?? gracePeriod ?? 15;
  const effectiveEmiGrace = emiGracePeriod ?? gracePeriod ?? 15;

  const bookingOptions = useMemo(() => {
    return (bookings || []).map((b) => {
      const bNum = b.bookingNumber || '-';
      const custName = b.customerId?.name || b.customerName || '';
      const plotNum = b.plotId?.plotNumber || '';

      return {
        value: b._id,
        label: `${bNum}`,
        subtitle: custName || plotNum ? `Customer: ${custName} • Plot #${plotNum}` : undefined,
      };
    });
  }, [bookings]);

  const rateLabel = lateFineFrequency === 'DAILY'
    ? `${lateFineRate || 0}% / Day`
    : lateFineFrequency === 'MONTHLY'
    ? `${lateFineRate || 0}% / Mo`
    : `${lateFineRate || 24}% P.A.`;

  const dpInst = installments?.find((i) => i.installmentNumber === 0) || (installments && installments[0]);
  const dpTotal = dpInst ? dpInst.dueAmount : (selectedBooking?.downpaymentAmount || selectedBooking?.bookingAmount || selectedBooking?.plotValue || 0);
  const dpPaid = dpInst ? dpInst.paidAmount : 0;
  const dpPrincipalDue = Math.max(0, dpTotal - dpPaid);
  const dpFine = dpInst ? getLateFine(dpInst, effectiveDpGrace, form.createdAt) : 0;
  const dpLateDays = dpInst ? getLateDays(dpInst, effectiveDpGrace, form.createdAt) : 0;
  const dpTotalPayable = dpPrincipalDue + dpFine;
  const dpDueDate = dpInst?.dueDate || (selectedBooking?.bookingDate ? new Date(new Date(selectedBooking.bookingDate).getTime() + (Number(selectedBooking.downpaymentDays) || 90) * 24 * 60 * 60 * 1000) : null);

  const isDpOverdue = dpDueDate && new Date(dpDueDate) < new Date(form.createdAt || new Date()) && dpPrincipalDue > 0;

  const emiInsts = installments?.filter((i) => i.installmentNumber > 0) || [];
  const formDateObj = form.createdAt ? new Date(form.createdAt) : new Date();
  const formYear = formDateObj.getFullYear();
  const formMonth = formDateObj.getMonth();

  const dueOrOverdueEmis = emiInsts.filter((i) => {
    if (i.status === 'PAID') return false;
    if (!i.dueDate) return false;
    const d = new Date(i.dueDate);
    const dYear = d.getFullYear();
    const dMonth = d.getMonth();
    return dYear < formYear || (dYear === formYear && dMonth <= formMonth);
  });

  const targetEmis = dueOrOverdueEmis.length > 0
    ? dueOrOverdueEmis
    : emiInsts.filter((i) => i.status !== 'PAID').slice(0, 1);

  const activeEmiInst = targetEmis[0] || emiInsts[0];
  const activeEmiNum = targetEmis.length > 1
    ? `#${targetEmis.map(i => i.installmentNumber).join(', #')}`
    : activeEmiInst ? `#${activeEmiInst.installmentNumber}` : '#1';

  const emiScheduledAmount = targetEmis.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
  const emiPrincipalDue = targetEmis.reduce((sum, i) => sum + Math.max(0, (i.dueAmount || 0) - (i.paidAmount || 0)), 0);
  const emiFine = targetEmis.reduce((sum, i) => sum + getLateFine(i, effectiveEmiGrace, form.createdAt), 0);
  const emiLateDays = activeEmiInst ? getLateDays(activeEmiInst, effectiveEmiGrace, form.createdAt) : 0;
  const emiTotalPayable = emiPrincipalDue + emiFine;
  const emiDueDate = activeEmiInst?.dueDate;
  const hasOverdue = targetEmis.some((i) => {
    const d = i.dueDate ? new Date(i.dueDate) : null;
    return d && d < formDateObj && Math.max(0, (i.dueAmount || 0) - (i.paidAmount || 0)) > 0 && getLateDays(i, effectiveEmiGrace, form.createdAt) > 0;
  });
  const isEmiPaidInFull = emiInsts.length > 0 && emiInsts.every((i) => i.status === 'PAID');

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Booking Selection & Payment Form */}
      <div className="flex flex-col gap-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Banknote size={20} />
            </div>
            <span>{isDownpaymentMode ? 'Receive Downpayment Collection' : 'Receive EMI Collection'}</span>
          </div>
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <SearchableSelect
              label="Select Booking Number"
              placeholder="Search or enter Booking Number..."
              searchPlaceholder="Type Booking Number, Customer Name, or Plot Number..."
              options={bookingOptions}
              value={selectedBooking?._id || ''}
              onChange={(val) => handleBookingSelect(val || '')}
              allowClear={true}
              required={true}
            />
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
              ) : isDownpaymentMode ? (
                /* Dedicated Downpayment Summary Panel */
                dpPrincipalDue === 0 && dpFine === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 font-medium shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block uppercase tracking-wide text-xs text-emerald-900">
                          Downpayment is Completed (100% Paid)
                        </span>
                        <span className="text-xs text-emerald-800">
                          Total Downpayment of ₹{dpTotal.toLocaleString('en-IN')} has been fully paid and cleared for this booking.
                        </span>
                      </div>
                    </div>
                    {selectedBooking?.scheme === 'MONTHLY_INSTALLMENT' && (
                      <a
                        href="/dashboard/plots/collections/emi/add"
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shrink-0 self-start sm:self-auto shadow-sm inline-flex items-center gap-1.5"
                      >
                        Collect Monthly EMI Instead →
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-teal-200/80 rounded-xl p-4 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                        Downpayment Terms & Status
                      </span>
                      {isDpOverdue && dpLateDays > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                          Overdue ({dpLateDays} Days Delay)
                        </span>
                      ) : isDpOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                          Due (Within Grace Period)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-800 border border-teal-200">
                          Pending Clearance
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Booking Date</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {selectedBooking.bookingDate
                            ? new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${isDpOverdue ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200/70'}`}>
                        <span className={`font-semibold block text-[0.65rem] uppercase ${isDpOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                          DP Last Due Date
                        </span>
                        <span className={`font-bold mt-0.5 block ${isDpOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
                          {dpDueDate
                            ? new Date(dpDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Total Downpayment</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          ₹{dpTotal.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Paid So Far</span>
                        <span className="font-bold text-emerald-700 mt-0.5 block">
                          ₹{dpPaid.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-teal-50/80 p-2.5 rounded-lg border border-teal-200">
                        <span className="text-teal-700 font-semibold block text-[0.65rem] uppercase">Principal Due</span>
                        <span className="font-bold text-teal-900 mt-0.5 block text-sm">
                          ₹{dpPrincipalDue.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${dpFine > 0 ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200/70'}`}>
                        <span className={`font-semibold block text-[0.65rem] uppercase ${dpFine > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          Late Fine ({rateLabel})
                        </span>
                        <span className={`font-bold mt-0.5 block ${dpFine > 0 ? 'text-rose-700 text-sm' : 'text-slate-800'}`}>
                          ₹{dpFine.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* Dedicated EMI Summary & Schedule Panel */
                <div className="flex flex-col gap-4">
                  {/* EMI Active Terms & Status Card */}
                  <div className="bg-white border border-teal-200/80 rounded-xl p-4 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                        EMI Active Installment Details {targetEmis.length > 1 ? `(${targetEmis.length} EMIs Due)` : ''}
                      </span>
                      {isEmiPaidInFull ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                          All EMIs Paid in Full
                        </span>
                      ) : hasOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                          {targetEmis.length > 1 ? `${targetEmis.length} EMIs Overdue / Due` : `Inst ${activeEmiNum} Overdue (${emiLateDays} Days Delay)`}
                        </span>
                      ) : !emiDueDate ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                          Awaiting Downpayment Completion
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-800 border border-teal-200">
                          Active Installment {activeEmiNum}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">Active Inst #</span>
                        <span className="font-bold text-slate-800 mt-0.5 block truncate" title={activeEmiNum}>
                          {isEmiPaidInFull ? 'Completed' : `EMI ${activeEmiNum}`}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${hasOverdue ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200/70'}`}>
                        <span className={`font-semibold block text-[0.65rem] uppercase ${hasOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                          {targetEmis.length > 1 ? 'First Due Date' : 'EMI Due Date'}
                        </span>
                        <span className={`font-bold mt-0.5 block ${hasOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
                          {emiDueDate
                            ? new Date(emiDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'Pending DP'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <span className="text-slate-400 font-semibold block text-[0.65rem] uppercase">
                          {targetEmis.length > 1 ? `Scheduled (${targetEmis.length} EMIs)` : 'Monthly EMI'}
                        </span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          ₹{emiScheduledAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-teal-50/80 p-2.5 rounded-lg border border-teal-200">
                        <span className="text-teal-700 font-semibold block text-[0.65rem] uppercase">Principal Due</span>
                        <span className="font-bold text-teal-900 mt-0.5 block text-sm">
                          ₹{emiPrincipalDue.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className={`p-2.5 rounded-lg border ${emiFine > 0 ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200/70'}`}>
                        <span className={`font-semibold block text-[0.65rem] uppercase ${emiFine > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          Late Fine ({rateLabel})
                        </span>
                        <span className={`font-bold mt-0.5 block ${emiFine > 0 ? 'text-rose-700 text-sm' : 'text-slate-800'}`}>
                          ₹{emiFine.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                        <span className="text-emerald-700 font-semibold block text-[0.65rem] uppercase">Total Payable Today</span>
                        <span className="font-bold text-emerald-900 mt-0.5 block text-sm">
                          ₹{emiTotalPayable.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Read-Only EMI Installments Schedule Ledger */}
                  {installments && installments.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <label className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wide px-1">
                        EMI Installments Schedule Ledger
                      </label>
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-semibold select-none">
                            <th className="p-2">Inst #</th>
                            <th className="p-2">Due Date</th>
                            <th className="p-2 text-right">Scheduled</th>
                            <th className="p-2 text-right">Paid</th>
                            <th className="p-2 text-right">Principal Due</th>
                            <th className="p-2 text-right">Late Fine ({rateLabel})</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {installments.map((inst) => {
                            const isPaid = inst.status === 'PAID';
                            const principalDue = Math.max(0, inst.dueAmount - (inst.paidAmount || 0));
                            const fine = getLateFine(inst, effectiveEmiGrace, form.createdAt);
                            const lateDays = getLateDays(inst, effectiveEmiGrace, form.createdAt);

                            const collectionDateObj = form.createdAt ? new Date(form.createdAt) : new Date();
                            const currentYear = collectionDateObj.getFullYear();
                            const currentMonth = collectionDateObj.getMonth();
                            const dueDate = inst.dueDate ? new Date(inst.dueDate) : null;
                            const dueYear = dueDate ? dueDate.getFullYear() : null;
                            const dueMonth = dueDate ? dueDate.getMonth() : null;

                            const isOverdue =
                              !isPaid && dueDate && (dueYear < currentYear || (dueYear === currentYear && dueMonth < currentMonth));
                            const isActiveRow = inst._id === activeEmiInst?._id && !isPaid;

                            let rowBgClass = '';
                            if (isPaid) {
                              rowBgClass = 'opacity-60 bg-emerald-50/20';
                            } else if (isActiveRow) {
                              rowBgClass = 'bg-teal-50/70 font-semibold';
                            } else if (isOverdue) {
                              rowBgClass = 'bg-rose-50/40';
                            }

                            return (
                              <tr
                                key={inst._id}
                                className={`border-b border-slate-100 select-none transition ${rowBgClass}`}
                              >
                                <td className="p-2 font-bold text-slate-800">
                                  <span>{inst.installmentNumber === 0 ? 'Downpayment' : `Inst #${inst.installmentNumber}`}</span>
                                  {isActiveRow && (
                                    <span className="ml-1.5 px-1.5 py-0.2 text-[0.6rem] font-bold rounded bg-teal-100 text-teal-800">
                                      Next Due
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-slate-600">
                                  {inst.dueDate ? (
                                    new Date(inst.dueDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[0.62rem] font-medium rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      Awaiting DP Completion
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-right text-slate-700">
                                  ₹{(inst.dueAmount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-2 text-right text-emerald-700 font-semibold">
                                  ₹{(inst.paidAmount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-2 text-right font-medium text-slate-800">
                                  ₹{principalDue.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2 text-right font-bold text-rose-600">
                                  {fine > 0 ? (
                                    <div className="flex flex-col items-end leading-tight">
                                      <span>₹{fine.toLocaleString('en-IN')}</span>
                                      <span className="text-[0.65rem] font-medium text-slate-500">
                                        ({lateDays}d)
                                      </span>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {isPaid ? (
                                    <span className="px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800">
                                      Paid
                                    </span>
                                  ) : isOverdue ? (
                                    <span className="px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded-full bg-rose-100 text-rose-700">
                                      Overdue
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[0.65rem] font-semibold uppercase rounded-full bg-slate-100 text-slate-700">
                                      Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Input Fields Grid (Only rendered if downpayment/contract is not already completed) */}
          {!(isDownpaymentMode && dpPrincipalDue === 0 && dpFine === 0) && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className={labelCls}>Collection Amount (₹)</label>
                    {isDownpaymentMode && (
                      <span className="text-[0.65rem] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Max DP Payable: ₹{Math.max(0, dpTotalPayable - (Number(form.lateFineRebate) || 0)).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
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

                {(isDownpaymentMode || selectedBooking?.scheme === 'MONTHLY_INSTALLMENT') && (
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
                        const rawVal = e.target.value.replace(/[^0-9.]/g, '');
                        const maxFine = getSelectedLateFineTotal();
                        const numRebate = Math.min(Number(rawVal) || 0, maxFine);
                        const cleanRebateStr = rawVal === '' ? '' : String(numRebate);

                        setForm((prev) => {
                          const principalDue = isDownpaymentMode
                            ? dpPrincipalDue
                            : emiPrincipalDue;
                          const currentFine = isDownpaymentMode
                            ? dpFine
                            : emiFine;
                          const netFine = Math.max(0, currentFine - numRebate);
                          const newTotal = principalDue + netFine;

                          return {
                            ...prev,
                            lateFineRebate: cleanRebateStr,
                            amountPaid: newTotal > 0 ? String(newTotal) : '',
                          };
                        });
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
                disabled={
                  submitLoading ||
                  !selectedBooking ||
                  !form.amountPaid ||
                  Number(form.amountPaid) <= 0
                }
                startIcon={CheckCircle}
                className="mt-2 w-full py-3"
              >
                {form.paymentMode === 'cash'
                  ? 'Collect Payment'
                  : 'Submit Collection for Admin Approval'}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReceivePaymentForm;
