import React, { useMemo } from 'react';
import Modalbox from '../../../../components/custommodal/Modalbox';
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
  Percent
} from 'lucide-react';

const ProductCustomerLedgerModal = ({ open, onClose, booking, onCollectInstallment }) => {
  if (!booking) return null;

  const cust = booking.customerId || {};
  const prd = booking.productId || {};
  const installments = booking.installments || [];

  const totalAmount = Number(booking.totalAmount || 0);
  const totalPaid = Number(booking.totalPaid || 0);
  const balanceDue = Math.max(0, totalAmount - totalPaid);

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
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

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
                        {ins.installmentNumber || idx + 1}
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
    </Modalbox>
  );
};

export default ProductCustomerLedgerModal;
