import React, { useState, useMemo, useEffect } from 'react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { toast } from '../../../../utils/toast';
import api from '../../../../api/axios';
import {
  DollarSign,
  X,
  Check,
  Loader2,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  Percent
} from 'lucide-react';
import numberToWords from '../../../../utils/numToWord';

const ProductInstallmentCollectModal = ({ open, onClose, booking, onSuccess }) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [lateFineRebate, setLateFineRebate] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionReference, setTransactionReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const installments = booking.installments || [];
  const rateConfig = booking.rateConfig || {};
  const emiGracePeriod = rateConfig.emiGracePeriod ?? 15;
  const lateFineRate = rateConfig.lateFineRate ?? 24;
  const lateFineDailyPercent = rateConfig.lateFineDailyPercent ?? (24 / 365);
  const dailyRateMultiplier = (Number(lateFineDailyPercent) || (24 / 365)) / 100;

  // Helper to calculate late fine for a single installment on a given date
  const getInstLateFine = (ins, targetDateStr) => {
    if (!ins || !ins.dueDate) return 0;
    const principal = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
    if (ins.status === 'PAID' || principal <= 0) {
      return Math.max(0, Number(ins.lateFine || 0) - Number(ins.lateFinePaid || 0) - Number(ins.lateFineRebate || 0));
    }

    const payDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    let newlyAccrued = 0;
    if (!ins.paidDate || !ins.paidAmount) {
      const due = new Date(ins.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > emiGracePeriod) {
        newlyAccrued = Math.round(principal * dailyRateMultiplier * diffDays);
      }
    } else {
      const lastPaid = new Date(ins.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        newlyAccrued = Math.round(principal * dailyRateMultiplier * diffDays);
      }
    }

    const storedUnpaid = Math.max(0, Number(ins.lateFine || 0) - Number(ins.lateFinePaid || 0) - Number(ins.lateFineRebate || 0));
    return storedUnpaid + newlyAccrued;
  };

  const getInstLateDays = (ins, targetDateStr) => {
    if (!ins || !ins.dueDate) return 0;
    if (ins.status === 'PAID') return ins.lateDays || 0;

    const payDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    if (!ins.paidDate || !ins.paidAmount) {
      const due = new Date(ins.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > emiGracePeriod ? diffDays : 0;
    } else {
      const lastPaid = new Date(ins.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  };

  // Target due or overdue EMIs on chosen date
  const dueStats = useMemo(() => {
    const payDateObj = paymentDate ? new Date(paymentDate + 'T23:59:59') : new Date();
    const pending = installments.filter((ins) => ins.status !== 'PAID');
    const dueOrOverdue = pending.filter((ins) => ins.dueDate && new Date(ins.dueDate) <= payDateObj);

    const activeTargets = dueOrOverdue.length > 0 ? dueOrOverdue : pending.slice(0, 1);
    const activeFirstInst = activeTargets[0] || installments[0];

    const sumPrincipal = activeTargets.reduce((sum, ins) => {
      return sum + Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
    }, 0);

    const sumFine = activeTargets.reduce((sum, ins) => sum + getInstLateFine(ins, paymentDate), 0);

    return {
      dueCount: dueOrOverdue.length,
      activeTargets,
      activeFirstInst,
      principalDue: sumPrincipal,
      totalLateFine: sumFine,
      totalPayable: sumPrincipal + sumFine,
      totalRemaining: Number(booking.remainingAmount || 0),
    };
  }, [installments, paymentDate, booking.remainingAmount]);

  // Auto-update amountPaid whenever paymentDate changes
  useEffect(() => {
    const netTotal = Math.max(0, dueStats.totalPayable - (Number(lateFineRebate) || 0));
    setAmountPaid(netTotal > 0 ? String(netTotal) : '');
  }, [dueStats.totalPayable]);

  const handleQuickPayDue = () => {
    setLateFineRebate('');
    setAmountPaid(dueStats.totalPayable > 0 ? String(dueStats.totalPayable) : '');
  };

  const handleQuickPaySingleEmi = () => {
    const pending = installments.filter((ins) => ins.status !== 'PAID');
    const firstUnpaid = pending[0];
    if (firstUnpaid) {
      const p = Math.max(0, Number(firstUnpaid.amount || 0) - Number(firstUnpaid.paidAmount || 0));
      const f = getInstLateFine(firstUnpaid, paymentDate);
      setLateFineRebate('');
      setAmountPaid(String(p + f));
    }
  };

  const handleQuickPayFullBalance = () => {
    const pending = installments.filter((ins) => ins.status !== 'PAID');
    const total = pending.reduce((sum, i) => {
      const p = Math.max(0, Number(i.amount || 0) - Number(i.paidAmount || 0));
      const f = getInstLateFine(i, paymentDate);
      return sum + p + f;
    }, 0);
    setLateFineRebate('');
    setAmountPaid(String(total));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const colAmt = Number(amountPaid);
    if (!colAmt || colAmt <= 0) {
      toast.error('Please enter a valid collection amount');
      return;
    }

    if (paymentMode === 'cheque') {
      const cleanCheque = (transactionReference || '').trim();
      if (!/^\d{6}$/.test(cleanCheque)) {
        return toast.error('Cheque number must be exactly 6 numeric digits (e.g. 045123)');
      }
    }

    setLoading(true);
    try {
      const payload = {
        amountPaid: colAmt,
        lateFineRebate: Number(lateFineRebate) || 0,
        paymentMode,
        transactionReference: paymentMode === 'cash' ? '' : transactionReference.trim(),
        paymentDate,
        remarks,
      };

      const res = await api.post(`/plots/product-bookings/${booking._id}/collections`, payload);
      toast.success(res.data?.message || 'Product installment collection recorded successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record collection');
    } finally {
      setLoading(false);
    }
  };

  const formattedPaymentDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Selected Date';

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      size="3xl"
      title="Receive Product EMI Collection"
      subtitle={`Booking #${booking.bookingNumber || ''} • ${booking.customerId?.name || 'Customer'}`}
      bodyClassName="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Customer & Product Dues Summary Card */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
              <strong className="text-slate-900 text-xs truncate block">{booking.customerId?.name}</strong>
              <span className="text-[10px] text-slate-500">{booking.customerId?.customerCode || ''}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Product Specifications</span>
              <strong className="text-slate-900 text-xs truncate block">{booking.productId?.productName}</strong>
              <span className="text-[10px] text-teal-800 font-semibold font-mono">
                {booking.quantity} Unit(s) • ₹{Number(booking.unitPrice || 0).toLocaleString('en-IN')}/unit
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenure &amp; EMI</span>
              <strong className="text-teal-900 text-xs block">{booking.tenureMonths || 24} Months Schedule</strong>
              <span className="text-[10px] text-emerald-700 font-bold">
                EMI: ₹{Number(booking.monthlyEmi || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Real-time Due as of chosen Payment Date */}
            <div className={`p-3 rounded-xl border ${
              dueStats.dueCount > 0
                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Due as of {formattedPaymentDate}
                </span>
                {dueStats.dueCount > 0 ? (
                  <span className="text-[10px] font-black bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">
                    {dueStats.dueCount} EMI{dueStats.dueCount > 1 ? 's' : ''} Due
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} /> Up to Date
                  </span>
                )}
              </div>
              <div className="text-lg font-black mt-1 font-mono">
                ₹{dueStats.totalPayable.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] mt-0.5 flex items-center justify-between opacity-90">
                <span>Principal: ₹{dueStats.principalDue.toLocaleString('en-IN')}</span>
                {dueStats.totalLateFine > 0 && (
                  <span className="font-bold text-rose-700">
                    + Late Fine ({lateFineRate}%): ₹{dueStats.totalLateFine.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Total Overall Booking Remaining Balance */}
            <div className="p-3 rounded-xl border bg-white border-slate-200 text-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Remaining Contract Balance
              </div>
              <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                ₹{dueStats.totalRemaining.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>Paid: ₹{Number(booking.totalPaid || 0).toLocaleString('en-IN')}</span>
                <span>Total: ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date and Mode Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Collection Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none text-xs font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none text-xs font-semibold"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI / Online</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Read-Only EMI Installments Schedule Ledger (matching /collections/emi/add) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <label className="font-bold text-slate-700 text-xs uppercase tracking-wide">
              EMI Installments Schedule Ledger
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {dueStats.totalPayable > 0 && (
                <button
                  type="button"
                  onClick={handleQuickPayDue}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer transition"
                >
                  Pay Due (₹{dueStats.totalPayable.toLocaleString('en-IN')})
                </button>
              )}
              {booking.monthlyEmi > 0 && (
                <button
                  type="button"
                  onClick={handleQuickPaySingleEmi}
                  className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-bold cursor-pointer transition"
                >
                  1 EMI (₹{Number(booking.monthlyEmi).toLocaleString('en-IN')})
                </button>
              )}
              {dueStats.totalRemaining > 0 && (
                <button
                  type="button"
                  onClick={handleQuickPayFullBalance}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition"
                >
                  Full Balance
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold select-none z-10">
                <tr>
                  <th className="p-2">Inst #</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2 text-right">Scheduled</th>
                  <th className="p-2 text-right">Paid</th>
                  <th className="p-2 text-right">Principal Due</th>
                  <th className="p-2 text-right">Late Fine ({lateFineRate}%)</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {installments.map((ins) => {
                  const isPaid = ins.status === 'PAID';
                  const principal = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
                  const fine = getInstLateFine(ins, paymentDate);
                  const lateDays = getInstLateDays(ins, paymentDate);
                  const dueDateStr = ins.dueDate ? new Date(ins.dueDate).toLocaleDateString('en-IN') : '-';
                  const isActiveRow = ins._id === dueStats.activeFirstInst?._id && !isPaid;

                  let rowBgClass = '';
                  if (isPaid) {
                    rowBgClass = 'opacity-60 bg-emerald-50/20';
                  } else if (isActiveRow) {
                    rowBgClass = 'bg-teal-50/80 font-semibold';
                  } else if (lateDays > 0) {
                    rowBgClass = 'bg-rose-50/40';
                  }

                  return (
                    <tr key={ins._id} className={`border-b border-slate-100 transition ${rowBgClass}`}>
                      <td className="p-2 font-bold text-slate-800">
                        <span>EMI #{ins.installmentNumber}</span>
                        {isActiveRow && (
                          <span className="ml-1.5 px-1.5 py-0.2 text-[0.6rem] font-bold rounded bg-teal-100 text-teal-800">
                            Next Due
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-slate-700">{dueDateStr}</td>
                      <td className="p-2 text-right text-slate-600">
                        ₹{Number(ins.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-right text-emerald-700 font-semibold">
                        ₹{Number(ins.paidAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        ₹{principal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-right font-bold text-rose-600">
                        {fine > 0 ? (
                          <div className="flex flex-col items-end leading-tight">
                            <span>₹{fine.toLocaleString('en-IN')}</span>
                            <span className="text-[0.65rem] font-medium text-slate-500">
                              ({lateDays}d delay)
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
                        ) : lateDays > 0 ? (
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
        </div>

        {/* Collection Amount & Late Fine Rebate Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Collection Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Payable: ₹{dueStats.totalPayable.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="number"
              min="1"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              placeholder="e.g. 5000"
              required
            />
            {amountPaid && Number(amountPaid) > 0 ? (
              <p className="text-[10px] font-bold text-teal-800 mt-1 capitalize bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1">
                {numberToWords(Math.floor(Number(amountPaid)))} Rupees Only
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Late Fine Rebate / Waiver (₹)</label>
              <span className="text-[10px] text-slate-400">
                Max: ₹{dueStats.totalLateFine.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="number"
              min="0"
              max={dueStats.totalLateFine || undefined}
              value={lateFineRebate}
              onChange={(e) => {
                const rawVal = e.target.value;
                const numVal = Math.min(Number(rawVal) || 0, dueStats.totalLateFine);
                setLateFineRebate(rawVal === '' ? '' : String(numVal));

                const netFine = Math.max(0, dueStats.totalLateFine - numVal);
                const newTotal = dueStats.principalDue + netFine;
                setAmountPaid(newTotal > 0 ? String(newTotal) : '');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
              placeholder="0"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Waives late fine from total payable amount.
            </span>
          </div>
        </div>

        {paymentMode !== 'cash' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {paymentMode === 'cheque' ? 'Cheque Number (6 Digits)' : 'Transaction Reference / UTR Number'}
            </label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder={paymentMode === 'cheque' ? 'e.g. 045123' : 'e.g., UPI-Ref-12345 / Bank UTR'}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none text-xs"
              required
            />
          </div>
        )}

        <div>
          <label className="block font-bold text-slate-700 mb-1">Remarks / Narration (Optional)</label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Product EMI collected on schedule"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none text-xs"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !amountPaid || Number(amountPaid) <= 0}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            <span>{loading ? 'Recording Collection...' : 'Collect Payment'}</span>
          </button>
        </div>
      </form>
    </Modalbox>
  );
};

export default ProductInstallmentCollectModal;
