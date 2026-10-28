import React, { useMemo, useState } from 'react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { DateInput } from '../../../../components/ui/DateInput';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';
import {
  BookOpen,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  DollarSign,
  AlertTriangle,
  Percent,
  Plus,
  Loader2,
  Receipt,
  XCircle,
  Banknote,
  Building2,
} from 'lucide-react';

const ProductCustomerLedgerModal = ({ open, onClose, booking: initialBooking, onCollectInstallment, onRefresh }) => {
  const [currentBooking, setCurrentBooking] = useState(initialBooking);
  const [showPartPayModal, setShowPartPayModal] = useState(false);
  const [partPaySubmitting, setPartPaySubmitting] = useState(false);
  const [partPayAmount, setPartPayAmount] = useState('');
  const [partPayMode, setPartPayMode] = useState('BANK_TRANSFER');
  const [partPayRef, setPartPayRef] = useState('');
  const [partPayDate, setPartPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [partPayRemarks, setPartPayRemarks] = useState('');
  const [treasuryLedgers, setTreasuryLedgers] = useState({ bankLedgers: [], cashLedgers: [] });
  const [myCashLedger, setMyCashLedger] = useState(null);
  const [partPayLedgerId, setPartPayLedgerId] = useState('');

  const fetchTreasury = async () => {
    try {
      const [treasuryRes, myCashRes] = await Promise.all([
        api.get('/ledger/treasury?intent=payment').catch(() => ({ data: {} })),
        api.get('/ledger/my-cash-account').catch(() => ({ data: null })),
      ]);
      const tData = treasuryRes.data?.data || treasuryRes.data || {};
      const banks = tData.bankLedgers || tData.bankAccounts || [];
      const cash = tData.cashLedgers || tData.cashAccounts || [];
      setTreasuryLedgers({ bankLedgers: banks, cashLedgers: cash });

      const myCash = myCashRes.data?.data || myCashRes.data || null;
      setMyCashLedger(myCash);

      return { banks, myCash };
    } catch (err) {
      console.error('Error fetching treasury:', err);
      return { banks: [], myCash: null };
    }
  };

  const booking = currentBooking || initialBooking;
  if (!booking) return null;

  const isCancelled = booking.status === 'CANCELLED';
  const cust = booking.customerId || {};
  const prd = booking.productId || {};
  const installments = booking.installments || [];

  const totalAmount = Number(booking.totalAmount || 0);
  const totalPaid = Number(booking.totalPaid || 0);
  const balanceDue = Math.max(0, totalAmount - totalPaid);

  const totalRefundPaid = (booking.refundPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    + (booking.refundVoucherId && !booking.refundPayments?.length ? Number(booking.refundAmount || 0) : 0);
  const netSettlementAmount = Number(booking.refundAmount || 0);
  const pendingSettlementBalance = Math.max(0, netSettlementAmount - totalRefundPaid);

  const handleOpenPartPay = async () => {
    setPartPayAmount(pendingSettlementBalance > 0 ? pendingSettlementBalance : '');
    setPartPayDate(new Date().toISOString().split('T')[0]);
    setPartPayMode('BANK_TRANSFER');
    setPartPayRef('');
    setPartPayRemarks(`Settlement refund payout for #${booking.bookingNumber}`);
    setShowPartPayModal(true);

    const { banks } = await fetchTreasury();
    if (banks.length > 0) {
      setPartPayLedgerId(banks[0]._id);
    } else {
      setPartPayLedgerId('');
    }
  };

  const handlePartPayModeChange = (newMode) => {
    setPartPayMode(newMode);
    if (newMode === 'CASH') {
      if (myCashLedger?._id) setPartPayLedgerId(myCashLedger._id);
    } else {
      const firstBank = treasuryLedgers.bankLedgers?.[0];
      if (firstBank?._id) setPartPayLedgerId(firstBank._id);
    }
  };

  const selectedTreasuryLedger = useMemo(() => {
    if (partPayMode === 'CASH') return myCashLedger;
    return treasuryLedgers.bankLedgers?.find((b) => b._id === partPayLedgerId) || null;
  }, [partPayMode, partPayLedgerId, treasuryLedgers, myCashLedger]);

  const selectedAvailableBalance = Number(
    selectedTreasuryLedger?.availableBalance ?? selectedTreasuryLedger?.netBalance ?? 0
  );
  const isInsufficientTreasury = Number(partPayAmount || 0) > selectedAvailableBalance;

  const handleRecordPartPayment = async (e) => {
    e.preventDefault();
    const amt = Number(partPayAmount);
    if (!amt || amt <= 0) {
      toast.warning('Please enter a valid disbursement amount');
      return;
    }
    if (amt > pendingSettlementBalance + 0.01) {
      toast.error(`Disbursement cannot exceed pending balance of ₹${pendingSettlementBalance.toLocaleString('en-IN')}`);
      return;
    }
    if (partPayMode !== 'CASH' && !partPayLedgerId) {
      toast.error('Please select an authorized corporate bank account to disburse from');
      return;
    }

    try {
      setPartPaySubmitting(true);
      const res = await api.post(`/plots/product-bookings/${booking._id}/refund-payments`, {
        amount: amt,
        paymentMode: partPayMode,
        paymentLedgerId: partPayLedgerId,
        transactionReference: partPayRef,
        paymentDate: partPayDate,
        remarks: partPayRemarks,
      });
      toast.success(res.data?.message || 'Refund part-payment recorded successfully!');
      setShowPartPayModal(false);
      setPartPayAmount('');
      setPartPayRef('');
      setPartPayRemarks('');

      // Refresh booking details
      const freshRes = await api.get(`/plots/product-bookings/${booking._id}`);
      if (freshRes.data?.data) {
        setCurrentBooking(freshRes.data.data);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error recording refund payment:', err);
      toast.error(err.response?.data?.message || 'Failed to record refund payment');
    } finally {
      setPartPaySubmitting(false);
    }
  };

  const rateConfig = booking.rateConfig || {};
  const emiGracePeriod = rateConfig.emiGracePeriod ?? 15;
  const lateFineRate = rateConfig.lateFineRate ?? 24;
  const lateFineDailyPercent = rateConfig.lateFineDailyPercent ?? (24 / 365);
  const dailyRateMultiplier = (Number(lateFineDailyPercent) || (24 / 365)) / 100;

  // Real-time calculation across all installments as of today
  const ledgerStats = useMemo(() => {
    const today = new Date();
    const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let totalPrincipalDue = 0;
    let totalOverduePrincipal = 0;
    let totalAccruedFine = 0;
    let totalFinePaid = 0;
    let totalFineRebate = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    const enriched = installments.map((ins) => {
      const principal = Math.max(0, Number(ins.amount || 0) - Number(ins.paidAmount || 0));
      const isPaid = ins.status === 'PAID' || principal <= 0;

      let fine = Number(ins.lateFine || 0);
      let lateDays = Number(ins.lateDays || 0);
      let isOverdue = false;

      if (!isPaid && ins.dueDate) {
        pendingCount += 1;
        const due = new Date(ins.dueDate);
        const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const diffTime = d2 - d1;
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        if (diffDays > 0) {
          isOverdue = true;
          totalOverduePrincipal += principal;
        }

        if (diffDays > emiGracePeriod) {
          lateDays = diffDays;
          overdueCount += 1;
          const newlyAccrued = Math.round(principal * dailyRateMultiplier * diffDays);
          fine = Math.max(fine, newlyAccrued);
        }
      } else if (isPaid) {
        paidCount += 1;
      }

      totalPrincipalDue += principal;
      totalAccruedFine += fine;
      totalFinePaid += Number(ins.lateFinePaid || 0);
      totalFineRebate += Number(ins.lateFineRebate || 0);

      const unpaidFine = Math.max(0, fine - Number(ins.lateFinePaid || 0) - Number(ins.lateFineRebate || 0));

      return {
        ...ins,
        principalDue: principal,
        accruedFine: fine,
        unpaidFine,
        lateDays,
        isOverdue,
        isPaid,
      };
    });

    const netUnpaidFine = Math.max(0, totalAccruedFine - totalFinePaid - totalFineRebate);
    const totalOutstanding = balanceDue + netUnpaidFine;

    return {
      items: enriched,
      totalPrincipalDue,
      totalOverduePrincipal,
      totalAccruedFine,
      totalFinePaid,
      totalFineRebate,
      netUnpaidFine,
      totalOutstanding,
      overdueCount,
      paidCount,
      pendingCount,
    };
  }, [installments, emiGracePeriod, dailyRateMultiplier, balanceDue]);

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      size="5xl"
      title="Customer Product Account Ledger &amp; EMI Statement"
      subtitle={`Customer: ${cust.name || 'N/A'} (${cust.customerCode || cust.customerId || 'N/A'}) • Booking #${booking.bookingNumber || ''}`}
      bodyClassName="p-4 sm:p-6 space-y-4"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            Product: <strong className="text-slate-800">{prd.productName || 'Micro Plot Unit'}</strong> ({booking.quantity || 1} {booking.quantity === 1 ? 'Unit' : 'Units'}) • Late Fine Policy: <strong className="text-teal-800">{lateFineRate}% P.A.</strong> after {emiGracePeriod} days grace
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Statement
          </button>
        </div>
      }
    >
      {/* Cancellation & Settlement Banner (if booking is cancelled) */}
      {isCancelled && (
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-200 text-rose-900 border border-rose-300">
                Cancelled &amp; Settle in Ledger
              </span>
              <span className="text-xs text-rose-800 font-semibold">
                Settlement Type: {booking.refundSettlementType === 'INTEREST_RETURN' ? 'Growth Return Added' : 'Cancellation Penalty Deducted'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-900">
                Effective: {booking.refundDate ? new Date(booking.refundDate).toLocaleDateString('en-IN') : '-'}
              </span>
              {pendingSettlementBalance > 0 && (
                <button
                  type="button"
                  onClick={handleOpenPartPay}
                  className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus size={13} /> Disburse Part Refund
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Deposits Held</span>
              <span className="font-mono font-bold text-slate-800 text-sm">₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                {booking.refundSettlementType === 'INTEREST_RETURN' ? 'Growth Return' : 'Penalty Deduction'}
              </span>
              <span className={`font-mono font-bold text-sm ${booking.refundSettlementType === 'INTEREST_RETURN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {booking.refundSettlementType === 'INTEREST_RETURN'
                  ? `+ ₹${Number(booking.refundInterestAmount || 0).toLocaleString('en-IN')} (${booking.refundInterestRate || 0}%)`
                  : `- ₹${Number(booking.refundDeduction || 0).toLocaleString('en-IN')} (${booking.refundDeductionPercent || 0}%)`}
              </span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Net Refund Payable</span>
              <span className="font-mono font-bold text-rose-900 text-sm">₹{netSettlementAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Settlement Balance</span>
              <span className={`font-mono font-bold text-sm ${
                pendingSettlementBalance <= 0 ? 'text-emerald-700 font-black' : 'text-amber-800'
              }`}>
                ₹{pendingSettlementBalance.toLocaleString('en-IN')}
                {pendingSettlementBalance <= 0 && ' (₹0.00 Settled)'}
              </span>
            </div>
          </div>

          {/* Refund disbursements list if any */}
          {Array.isArray(booking.refundPayments) && booking.refundPayments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-rose-200">
              <div className="text-[11px] font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                <Receipt size={13} /> Recorded Refund Disbursements ({booking.refundPayments.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.refundPayments.map((p, idx) => (
                  <div key={p._id || idx} className="bg-white border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 text-slate-800">
                    <span className="font-bold text-rose-700">Part {idx + 1}: ₹{Number(p.amount).toLocaleString('en-IN')}</span>
                    <span className="text-slate-400">({new Date(p.date).toLocaleDateString('en-IN')})</span>
                    <span className="text-slate-500 uppercase text-[10px]">[{p.paymentMode}]</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Purchase Value</div>
          <div className="text-sm font-black text-slate-900 mt-1">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {booking.quantity || 1} Unit @ ₹{(booking.unitPrice || 0).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
          <div className="text-[10px] uppercase font-bold text-emerald-700">Total Principal Paid</div>
          <div className="text-sm font-black text-emerald-800 mt-1">
            ₹{totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
            {ledgerStats.paidCount} of {installments.length || 1} EMIs Paid
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500">Remaining Principal</div>
          <div className="text-sm font-black text-slate-900 mt-1">
            ₹{balanceDue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
            {balanceDue === 0 ? 'Fully Paid' : 'Pending Principal'}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${
          ledgerStats.overdueCount > 0
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="text-[10px] uppercase font-bold flex items-center justify-between">
            <span>Overdue EMIs</span>
            {ledgerStats.overdueCount > 0 && (
              <span className="bg-rose-200 text-rose-800 text-[9px] px-1.5 py-0.2 rounded font-black">
                {ledgerStats.overdueCount} Overdue
              </span>
            )}
          </div>
          <div className="text-sm font-black mt-1">
            ₹{ledgerStats.totalOverduePrincipal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-rose-700 mt-0.5 font-medium">
            {ledgerStats.overdueCount > 0 ? `${ledgerStats.overdueCount} Months Due` : 'No Overdue EMIs'}
          </div>
        </div>

        <div className={`p-3 rounded-xl border ${
          ledgerStats.netUnpaidFine > 0
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="text-[10px] uppercase font-bold flex items-center justify-between">
            <span>Late Fine (24% P.A.)</span>
            <Percent size={12} className="text-amber-600" />
          </div>
          <div className="text-sm font-black mt-1">
            ₹{ledgerStats.netUnpaidFine.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
            {ledgerStats.netUnpaidFine > 0 ? `After ${emiGracePeriod}d Grace` : 'Zero Late Fine'}
          </div>
        </div>

        <div className="bg-teal-50/90 p-3 rounded-xl border border-teal-300 text-teal-950">
          <div className="text-[10px] uppercase font-bold text-teal-800">Total Outstanding</div>
          <div className="text-sm font-black text-teal-900 mt-1">
            ₹{ledgerStats.totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-teal-700 mt-0.5 font-medium">
            Principal + Fine
          </div>
        </div>
      </div>

      {/* Schedule & Due Dates Table */}
      <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              EMI Schedule, Due Dates &amp; Late Fine Tracking
            </h4>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {installments.length} Months Tenure
            </span>
          </div>
          {balanceDue > 0 && onCollectInstallment && (
            <button
              type="button"
              onClick={() => onCollectInstallment(booking)}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <DollarSign size={13} /> Receive Installment Collection
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[380px] rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 sticky top-0 border-b border-slate-200 text-slate-700 font-semibold select-none z-10">
              <tr>
                <th className="p-2.5 w-12 text-center">EMI #</th>
                <th className="p-2.5">Scheduled Due Date</th>
                <th className="p-2.5 text-right">EMI Amount</th>
                <th className="p-2.5 text-right">Paid Principal</th>
                <th className="p-2.5 text-right">Principal Due</th>
                <th className="p-2.5 text-center">Delay</th>
                <th className="p-2.5 text-right">Late Fine ({lateFineRate}%)</th>
                <th className="p-2.5 text-right">Fine Paid/Rebate</th>
                <th className="p-2.5">Paid Date &amp; Receipt</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {ledgerStats.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 italic">
                    No monthly installment schedule generated (One-time full payment).
                  </td>
                </tr>
              ) : (
                ledgerStats.items.map((ins, idx) => {
                  const dueDateStr = ins.dueDate ? new Date(ins.dueDate).toLocaleDateString('en-IN') : '-';
                  const paidDateStr = ins.paidDate ? new Date(ins.paidDate).toLocaleDateString('en-IN') : '';
                  const hasFine = (ins.accruedFine || 0) > 0;

                  let rowBg = '';
                  if (ins.isPaid) {
                    rowBg = 'bg-emerald-50/20 opacity-75';
                  } else if (ins.lateDays > 0) {
                    rowBg = 'bg-rose-50/40';
                  } else if (ins.isOverdue) {
                    rowBg = 'bg-amber-50/30';
                  }

                  return (
                    <tr key={ins._id || idx} className={`hover:bg-slate-50/80 transition ${rowBg}`}>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                        {ins.installmentNumber === 0 ? 'DP' : (ins.installmentNumber || idx + 1)}
                      </td>

                      <td className="p-2.5 text-slate-800">
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar size={12} className="text-slate-400" />
                          {dueDateStr}
                        </span>
                      </td>

                      <td className="p-2.5 text-right font-bold text-slate-900">
                        ₹{Number(ins.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="p-2.5 text-right font-bold text-emerald-700">
                        {ins.paidAmount > 0 ? `₹${Number(ins.paidAmount).toLocaleString('en-IN')}` : '-'}
                      </td>

                      <td className="p-2.5 text-right font-bold text-slate-800">
                        {ins.principalDue > 0 ? `₹${Number(ins.principalDue).toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      <td className="p-2.5 text-center">
                        {ins.lateDays > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded text-[10px]">
                            {ins.lateDays} Days
                          </span>
                        ) : ins.isOverdue ? (
                          <span className="text-amber-700 text-[10px] font-semibold">
                            In Grace
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      <td className="p-2.5 text-right font-bold text-rose-700">
                        {hasFine ? (
                          <div className="leading-tight">
                            <span>₹{Number(ins.accruedFine).toLocaleString('en-IN')}</span>
                            <span className="text-[9px] text-slate-400 block">@ {lateFineRate}% p.a.</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-2.5 text-right text-slate-600 text-[11px]">
                        {(ins.lateFinePaid > 0 || ins.lateFineRebate > 0) ? (
                          <div className="leading-tight">
                            {ins.lateFinePaid > 0 && (
                              <span className="text-emerald-700 font-bold block">Paid: ₹{ins.lateFinePaid}</span>
                            )}
                            {ins.lateFineRebate > 0 && (
                              <span className="text-teal-700 font-medium block">Rebate: ₹{ins.lateFineRebate}</span>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-2.5 text-slate-700 font-mono text-[11px]">
                        {ins.receiptNumber ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{ins.receiptNumber}</span>
                            <span className="text-[10px] text-slate-400">{paidDateStr}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-2.5 text-center">
                        {ins.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} /> PAID
                          </span>
                        ) : ins.lateDays > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle size={11} /> OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock size={11} /> PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal for Recording Refund Part Payment */}
      {showPartPayModal && (
        <Modalbox
          open={showPartPayModal}
          onClose={() => setShowPartPayModal(false)}
          size="md"
          title="Disburse Cancellation Refund Part-Payment"
          subtitle={`Booking #${booking.bookingNumber} • Remaining: ₹${pendingSettlementBalance.toLocaleString('en-IN')}`}
          icon={<DollarSign size={20} className="text-teal-700" />}
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                disabled={partPaySubmitting}
                onClick={() => setShowPartPayModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPartPayment}
                disabled={partPaySubmitting}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {partPaySubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Record Disbursement
                  </>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleRecordPartPayment} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Disbursement Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={pendingSettlementBalance}
                value={partPayAmount}
                onChange={(e) => setPartPayAmount(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-bold font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-200"
                required
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Remaining liability: ₹{pendingSettlementBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode *</label>
                <select
                  value={partPayMode}
                  onChange={(e) => handlePartPayModeChange(e.target.value)}
                  className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="UPI">UPI / QR Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <DateInput
                  label="Payment Date"
                  value={partPayDate}
                  onChange={(e) => setPartPayDate(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {partPayMode === 'CASH' ? 'Source Cash Account (Personal Custody)' : 'Debit From Corporate Bank Account *'}
              </label>
              {partPayMode === 'CASH' ? (
                <div className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs flex items-center justify-between font-semibold text-slate-700">
                  <span>{myCashLedger?.name || 'My Cash Account'}</span>
                  <span className="font-mono text-[11px] text-emerald-700">
                    ₹{Number(myCashLedger?.availableBalance ?? myCashLedger?.netBalance ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <select
                  value={partPayLedgerId}
                  onChange={(e) => setPartPayLedgerId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                >
                  {treasuryLedgers.bankLedgers?.length === 0 ? (
                    <option value="">No authorized company bank accounts found</option>
                  ) : (
                    treasuryLedgers.bankLedgers.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {[bank.bankName, bank.name].filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx).join(' - ')}
                        {bank.accountNumber ? ` (A/C: ${bank.accountNumber})` : ''} - ₹{(bank.availableBalance ?? bank.netBalance ?? 0).toLocaleString('en-IN')}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {selectedTreasuryLedger && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Banknote size={15} className="text-teal-700" />
                  <span>Available Balance in Selected Account:</span>
                </div>
                <span className={`font-mono font-bold ${isInsufficientTreasury ? 'text-amber-700' : 'text-emerald-700'}`}>
                  ₹{selectedAvailableBalance.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {isInsufficientTreasury && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Balance Notice:</strong> The disbursement amount (₹{Number(partPayAmount).toLocaleString('en-IN')}) exceeds currently available balance (₹{selectedAvailableBalance.toLocaleString('en-IN')}) in this account.
                </p>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {partPayMode === 'CHEQUE'
                  ? 'Cheque / Demand Draft Number *'
                  : partPayMode === 'UPI'
                  ? 'UPI Transaction ID / Ref #'
                  : partPayMode === 'CASH'
                  ? 'Cash Voucher / Handover Ref (Optional)'
                  : 'Transaction / UTR Reference # *'}
              </label>
              <input
                type="text"
                placeholder={
                  partPayMode === 'CHEQUE'
                    ? 'e.g. CHQ-904128'
                    : partPayMode === 'UPI'
                    ? 'e.g. UPI-92817263541'
                    : 'e.g. UTR / NEFT reference number'
                }
                value={partPayRef}
                onChange={(e) => setPartPayRef(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Refund part payment disbursed to customer"
                value={partPayRemarks}
                onChange={(e) => setPartPayRemarks(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </form>
        </Modalbox>
      )}
    </Modalbox>
  );
};

export default ProductCustomerLedgerModal;
