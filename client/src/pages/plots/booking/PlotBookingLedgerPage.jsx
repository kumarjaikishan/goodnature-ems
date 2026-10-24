import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import Button from '@/components/ui/Button';
import api from '@/api/axios';
import { toast } from '@/utils/toast';
import { amountInWords } from '@/utils/numToWord';
import { DateInput } from '@/components/ui/DateInput';
import {
  ArrowLeft,
  BookOpen,
  Printer,
  Calendar,
  User,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Banknote,
  DollarSign,
  Search,
  Eye,
  Receipt,
  FileText,
  RotateCcw,
  Sparkles,
  Loader2,
  XCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';

const PlotBookingLedgerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'installments' | 'specs'
  const [searchFilter, setSearchFilter] = useState('');

  // Refund Part-Payment Disbursement Modal State
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState(0);
  const [disburseDate, setDisburseDate] = useState(new Date().toISOString().split('T')[0]);
  const [disburseMode, setDisburseMode] = useState('BANK_TRANSFER');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseRemarks, setDisburseRemarks] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchLedger = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/plots/bookings/${id}/ledger`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load booking ledger:', err);
      toast.error('Failed to load booking ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const b = data?.booking || {};
  const summary = data?.summary || {};
  const ledgerEntries = data?.ledgerEntries || [];
  const installments = data?.installments || [];
  const receipts = data?.receipts || [];

  const customer = b.customerId || {};
  const plot = b.plotId || {};
  const project = b.projectId || {};
  const sponsor = b.sponsorId || {};

  const grossVal = Number(summary.grossPlotValue ?? b.plotValue ?? 0);
  const discountVal = Number(summary.discount ?? b.discount ?? 0);
  const netVal = Number(summary.netPlotValue ?? Math.max(0, grossVal - discountVal));
  const paidVal = Number(summary.totalPaid ?? Math.max(0, netVal - Number(b.remainingAmount || 0)));
  const outstandingVal = Number(summary.outstandingBalance ?? Math.max(0, netVal - paidVal));
  const lateFineAccrued = Number(summary.lateFineAccrued ?? 0);
  const lateFinePaid = Number(summary.totalLateFinePaid ?? 0);

  // Settlement & Cancellation derived metrics
  const isCancelled = b.status === 'CANCELLED' || summary.isCancelled;
  const netSettlementAmount = Number(summary.netSettlementAmount ?? 0);
  const totalRefundPaid = Number(summary.totalRefundPaid ?? 0);
  const pendingSettlementBalance = Number(summary.pendingSettlementBalance ?? 0);
  const isFullySettled = summary.isFullySettled || (isCancelled && pendingSettlementBalance <= 0);

  const plotArea = plot.plotSize || plot.area || plot.areaSqFt || 0;
  const effectiveRate = b.effectivePlotRate || (plotArea > 0 ? Math.round(grossVal / plotArea) : 0);

  const handleOpenDisburseModal = () => {
    setDisburseAmount(pendingSettlementBalance > 0 ? pendingSettlementBalance : 0);
    setDisburseDate(new Date().toISOString().split('T')[0]);
    setDisburseMode('BANK_TRANSFER');
    setDisburseRef('');
    setDisburseRemarks(`Settlement refund payout to ${customer.name || b.customerName || 'customer'}`);
    setShowDisburseModal(true);
  };

  const handleDisburseSubmit = async (e) => {
    if (e) e.preventDefault();
    const amt = Number(disburseAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid disbursement amount greater than 0');
      return;
    }
    if (amt > pendingSettlementBalance) {
      toast.error(`Amount cannot exceed the pending settlement balance of ₹${pendingSettlementBalance.toLocaleString('en-IN')}`);
      return;
    }

    setSubmittingPayment(true);
    try {
      await api.post(`/plots/bookings/${b._id}/refund-payments`, {
        amount: amt,
        paymentDate: disburseDate,
        paymentMode: disburseMode,
        transactionReference: disburseRef,
        remarks: disburseRemarks,
      });
      toast.success('Refund payment disbursed and ledger balance updated successfully');
      setShowDisburseModal(false);
      await fetchLedger();
    } catch (err) {
      console.error('Failed to disburse refund payment:', err);
      toast.error(err.response?.data?.message || 'Failed to record refund disbursement');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filtered Statement Entries
  const filteredEntries = useMemo(() => {
    if (!searchFilter.trim()) return ledgerEntries;
    const q = searchFilter.toLowerCase();
    return ledgerEntries.filter(
      (entry) =>
        entry.particulars?.toLowerCase().includes(q) ||
        entry.referenceNumber?.toLowerCase().includes(q) ||
        entry.paymentMode?.toLowerCase().includes(q) ||
        entry.notes?.toLowerCase().includes(q)
    );
  }, [ledgerEntries, searchFilter]);

  // Official Print Statement Generation
  const handlePrintStatement = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the statement.');
      return;
    }

    const printDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const entriesHtml = ledgerEntries
      .map(
        (e, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 7px 8px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 8px; white-space: nowrap;">${new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td style="padding: 7px 8px; font-weight: 600; color: #1e293b;">
          ${e.particulars}
          ${e.notes ? `<div style="font-size: 9px; color: #64748b; font-weight: normal;">${e.notes}</div>` : ''}
        </td>
        <td style="padding: 7px 8px; font-family: monospace; font-weight: bold; color: #334155;">${e.referenceNumber || '-'}</td>
        <td style="padding: 7px 8px; text-transform: uppercase; font-size: 10px; color: #475569;">${e.paymentMode || '-'}</td>
        <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 600; color: ${e.debit > 0 ? '#991b1b' : '#64748b'};">
          ${e.debit > 0 ? '₹' + e.debit.toLocaleString('en-IN') : '-'}
        </td>
        <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 600; color: ${e.credit > 0 ? '#047857' : '#64748b'};">
          ${e.credit > 0 ? '₹' + e.credit.toLocaleString('en-IN') : '-'}
        </td>
        <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">
          ₹${Math.abs(e.balance).toLocaleString('en-IN')} ${e.balance > 0 ? 'Dr' : e.balance === 0 ? 'Settled' : 'Cr'}
        </td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger Statement - ${b.bookingNumber || ''}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          .header-table { width: 100%; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 11px; color: #475569; margin-top: 2px; }
          .info-grid { display: table; width: 100%; margin-bottom: 14px; border-collapse: collapse; }
          .info-cell { display: table-cell; width: 50%; vertical-align: top; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px; }
          .info-row { margin-bottom: 4px; }
          .info-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; width: 110px; display: inline-block; }
          .info-val { font-weight: 700; color: #0f172a; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          .kpi-cell { padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; }
          .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .kpi-value { font-size: 13px; font-weight: 800; margin-top: 2px; font-family: monospace; }
          .ledger-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .ledger-table th { background: #0f766e; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 7px 8px; text-align: left; }
          .ledger-table th.right { text-align: right; }
          .ledger-table th.center { text-align: center; }
          .total-row { background: #f1f5f9; font-weight: 800; border-top: 2px solid #0f766e; }
          .words-banner { margin-top: 10px; padding: 8px 10px; background: #f8fafc; border: 1px dashed #cbd5e1; font-size: 11px; line-height: 1.4; }
          .footer-signs { margin-top: 40px; display: table; width: 100%; }
          .sign-cell { display: table-cell; width: 33.33%; text-align: center; font-size: 11px; color: #334155; }
          .sign-line { border-top: 1px solid #94a3b8; width: 70%; margin: 40px auto 4px auto; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="title">GOOD NATURE REAL INFRA</div>
              <div class="subtitle">Plot Sales, Township Development &amp; Customer Account Ledger</div>
            </td>
            <td style="text-align: right;">
              <div style="font-size: 12px; font-weight: bold; color: #0f766e;">CUSTOMER BOOKING STATEMENT</div>
              <div style="font-size: 10px; color: #64748b;">Statement Date: ${printDate}</div>
            </td>
          </tr>
        </table>

        <!-- Customer & Plot Info Box -->
        <div class="info-grid">
          <div class="info-cell" style="border-right: none;">
            <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-val">${customer.name || b.customerName || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Customer Code:</span> <span class="info-val">${customer.customerId || customer.customerCode || 'N/A'}</span></div>
            <div class="info-row"><span class="info-label">Mobile Number:</span> <span class="info-val">${customer.mobile || b.customerMobile || '-'}</span></div>
            <div class="info-row"><span class="info-label">Father / Spouse:</span> <span class="info-val">${customer.fatherOrHusbandName || '-'}</span></div>
            <div class="info-row"><span class="info-label">Address:</span> <span class="info-val">${customer.address || '-'}</span></div>
          </div>
          <div class="info-cell">
            <div class="info-row"><span class="info-label">Booking No:</span> <span class="info-val" style="font-family: monospace; color: #0f766e;">${b.bookingNumber || '-'}</span></div>
            <div class="info-row"><span class="info-label">Plot Number:</span> <span class="info-val">Plot #${plot.plotNumber || 'N/A'} (${plotArea} Sq Ft)</span></div>
            <div class="info-row"><span class="info-label">Project / Series:</span> <span class="info-val">${project.projectName || plot.seriesId?.seriesName || 'Standard Layout'}</span></div>
            <div class="info-row"><span class="info-label">Payment Scheme:</span> <span class="info-val">${b.scheme === 'FULL_PAYMENT' ? 'Full Payment' : 'Monthly EMI'}</span></div>
            <div class="info-row"><span class="info-label">Booking Date:</span> <span class="info-val">${new Date(b.bookingDate || b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          </div>
        </div>

        <!-- KPI Summary Box -->
        <table class="kpi-table">
          ${
            !isCancelled
              ? `<tr>
            <td class="kpi-cell" style="background: #f8fafc;">
              <div class="kpi-label">Plot Consideration</div>
              <div class="kpi-value" style="color: #0f172a;">₹${grossVal.toLocaleString('en-IN')}</div>
            </td>
            <td class="kpi-cell" style="background: #f8fafc;">
              <div class="kpi-label">Discount</div>
              <div class="kpi-value" style="color: #64748b;">${discountVal > 0 ? '₹' + discountVal.toLocaleString('en-IN') : '₹0'}</div>
            </td>
            <td class="kpi-cell" style="background: #f0fdfa;">
              <div class="kpi-label" style="color: #0f766e;">Net Payable (Dr)</div>
              <div class="kpi-value" style="color: #0f766e;">₹${netVal.toLocaleString('en-IN')}</div>
            </td>
            <td class="kpi-cell" style="background: #ecfdf5;">
              <div class="kpi-label" style="color: #047857;">Total Realized (Cr)</div>
              <div class="kpi-value" style="color: #047857;">₹${paidVal.toLocaleString('en-IN')}</div>
            </td>
            <td class="kpi-cell" style="background: ${outstandingVal > 0 ? '#fff1f2' : '#f0fdf4'};">
              <div class="kpi-label" style="color: ${outstandingVal > 0 ? '#b91c1c' : '#047857'};">Balance Outstanding</div>
              <div class="kpi-value" style="color: ${outstandingVal > 0 ? '#b91c1c' : '#047857'};">
                ₹${outstandingVal.toLocaleString('en-IN')} ${outstandingVal > 0 ? 'Dr' : 'Nil'}
              </div>
            </td>
          </tr>`
              : `<tr>
            <td class="kpi-cell" style="background: #f8fafc;">
              <div class="kpi-label">Total Deposited</div>
              <div class="kpi-value" style="color: #0f172a;">₹${paidVal.toLocaleString('en-IN')}</div>
            </td>
            <td class="kpi-cell" style="background: ${summary.refundSettlementType === 'DEDUCTION_PENALTY' ? '#fff1f2' : '#f0fdfa'};">
              <div class="kpi-label" style="color: ${summary.refundSettlementType === 'DEDUCTION_PENALTY' ? '#991b1b' : '#0f766e'};">
                ${summary.refundSettlementType === 'DEDUCTION_PENALTY' ? `Penalty (${summary.refundDeductionPercent > 0 ? `${summary.refundDeductionPercent}%` : 'Flat'})` : `Return (${summary.refundInterestRate}% P.A.)`}
              </div>
              <div class="kpi-value" style="color: ${summary.refundSettlementType === 'DEDUCTION_PENALTY' ? '#991b1b' : '#0f766e'};">
                ${summary.refundSettlementType === 'DEDUCTION_PENALTY' ? '- ₹' + summary.refundDeduction.toLocaleString('en-IN') : '+ ₹' + summary.refundInterestAmount.toLocaleString('en-IN')}
              </div>
            </td>
            <td class="kpi-cell" style="background: #f8fafc;">
              <div class="kpi-label">Net Refund Payable</div>
              <div class="kpi-value" style="color: #0f172a;">₹${netSettlementAmount.toLocaleString('en-IN')}</div>
            </td>
            <td class="kpi-cell" style="background: #ecfdf5;">
              <div class="kpi-label" style="color: #047857;">Refund Disbursed</div>
              <div class="kpi-value" style="color: #047857;">₹${totalRefundPaid.toLocaleString('en-IN')}</div>
            </td>
            <td class="kpi-cell" style="background: ${pendingSettlementBalance > 0 ? '#fffbeb' : '#ecfdf5'};">
              <div class="kpi-label" style="color: ${pendingSettlementBalance > 0 ? '#b45309' : '#047857'};">Remaining Balance</div>
              <div class="kpi-value" style="color: ${pendingSettlementBalance > 0 ? '#b45309' : '#047857'};">
                ₹${pendingSettlementBalance.toLocaleString('en-IN')} ${pendingSettlementBalance > 0 ? 'Cr' : 'Settled'}
              </div>
            </td>
          </tr>`
          }
        </table>

        <!-- Running Ledger Table -->
        <table class="ledger-table">
          <thead>
            <tr>
              <th class="center" style="width: 25px;">#</th>
              <th style="width: 85px;">Date</th>
              <th>Particulars / Narration</th>
              <th style="width: 110px;">Ref / Doc #</th>
              <th style="width: 80px;">Mode</th>
              <th class="right" style="width: 90px;">Debit (₹)</th>
              <th class="right" style="width: 90px;">Credit (₹)</th>
              <th class="right" style="width: 100px;">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${entriesHtml}
          </tbody>
          <tfoot>
            <tr class="total-row" style="font-size: 11px;">
              <td colspan="5" style="padding: 8px; text-transform: uppercase;">Total Ledger Account Summary</td>
              <td style="padding: 8px; text-align: right; font-family: monospace; color: #991b1b;">
                ₹${ledgerEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0).toLocaleString('en-IN')}
              </td>
              <td style="padding: 8px; text-align: right; font-family: monospace; color: #047857;">
                ₹${ledgerEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0).toLocaleString('en-IN')}
              </td>
              <td style="padding: 8px; text-align: right; font-family: monospace; color: ${isCancelled ? (pendingSettlementBalance > 0 ? '#b45309' : '#047857') : (outstandingVal > 0 ? '#b91c1c' : '#047857')};">
                ${isCancelled ? (pendingSettlementBalance > 0 ? '₹' + pendingSettlementBalance.toLocaleString('en-IN') + ' Cr' : '₹0.00 Settled') : ('₹' + outstandingVal.toLocaleString('en-IN') + (outstandingVal > 0 ? ' Dr' : ' Nil'))}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount In Words -->
        <div class="words-banner">
          ${
            !isCancelled
              ? `<div><strong>Total Realized:</strong> ${amountInWords(paidVal)}</div>
                 <div style="margin-top: 3px;"><strong>Outstanding Balance:</strong> ${outstandingVal > 0 ? amountInWords(outstandingVal) : 'Nil / Fully Settled'}</div>`
              : `<div><strong>Net Refund Settlement:</strong> ${amountInWords(netSettlementAmount)}</div>
                 <div style="margin-top: 3px;"><strong>Remaining Liability Balance:</strong> ${pendingSettlementBalance > 0 ? amountInWords(pendingSettlementBalance) : 'Nil / Fully Settled'}</div>`
          }
        </div>

        <!-- Footer Signatures -->
        <div class="footer-signs">
          <div class="sign-cell">
            <div class="sign-line"></div>
            <strong>Customer / Allottee</strong>
          </div>
          <div class="sign-cell">
            <div class="sign-line"></div>
            <strong>Accounts Executive</strong>
          </div>
          <div class="sign-cell">
            <div class="sign-line"></div>
            <strong>Authorized Signatory</strong>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading Booking Ledger..."
        subtitle="Fetching real-time verified collections and financial entries"
        fullScreen={false}
      />
    );
  }

  if (!data || !b._id) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle size={40} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Booking Ledger Not Found</h2>
        <p className="text-xs text-slate-500">The requested booking record could not be located or has been archived.</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard/plots/booking')}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-xs flex items-center gap-1 font-semibold"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-extrabold text-slate-900 font-mono tracking-tight">
                {b.bookingNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                    : b.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : b.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : b.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : b.status === 'COMPLETED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {b.status}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                {b.scheme === 'FULL_PAYMENT' ? 'One-Time Full Payment' : 'Monthly EMI Scheme'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{customer.name || b.customerName || 'N/A'}</strong> • Plot:{' '}
              <strong className="text-teal-800">#{plot.plotNumber || 'N/A'}</strong> ({plotArea} Sq Ft) • Project:{' '}
              <strong className="text-slate-800">{project.projectName || plot.seriesId?.seriesName || 'Standard Layout'}</strong>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintStatement}
            className="text-xs flex items-center gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50"
          >
            <Printer size={15} /> Print Statement
          </Button>

          {/* Calculator Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/dashboard/plots/interest-calculator?bookingId=${b._id}&bookingNumber=${encodeURIComponent(b.bookingNumber || '')}`
              )
            }
            className="text-xs flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Sparkles size={14} className="text-teal-700" /> Settlement Calculator
          </Button>

          {/* Active Booking: Collect Payment */}
          {!isCancelled && outstandingVal > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const isEmi =
                  b.scheme === 'MONTHLY_INSTALLMENT' &&
                  (b.downpaymentCleared || (b.bookingAmount && b.bookingAmount > 0));
                const target = isEmi
                  ? `/dashboard/plots/collections/emi/add?bookingId=${b._id}`
                  : `/dashboard/plots/collections/downpayment/add?bookingId=${b._id}`;
                navigate(target);
              }}
              className="text-xs flex items-center gap-1.5"
            >
              <DollarSign size={15} /> Collect Payment
            </Button>
          )}

          {/* Cancelled Booking: Disburse Refund Payment Button */}
          {isCancelled && pendingSettlementBalance > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenDisburseModal}
              className="text-xs flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <Banknote size={15} /> Disburse Refund Payment
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/dashboard/plots/booking/${b._id}`)}
            className="text-xs flex items-center gap-1.5"
          >
            <Eye size={15} /> View Full Contract
          </Button>
        </div>
      </div>

      {/* Cancellation & Settlement Status Banner */}
      {isCancelled && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border border-rose-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <XCircle size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Booking Cancelled &amp; Settlement Account Active
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isFullySettled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {isFullySettled ? 'Fully Settled (₹0.00 Outstanding)' : 'Part-Payment Payout Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {summary.refundSettlementType === 'DEDUCTION_PENALTY'
                    ? `Plot #${plot.plotNumber || ''} has been released to inventory. Cancelled with ${summary.refundDeductionPercent > 0 ? `${summary.refundDeductionPercent}%` : 'Flat ₹'} administrative penalty deduction of ₹${summary.refundDeduction.toLocaleString('en-IN')}.`
                    : summary.refundSettlementType === 'INTEREST_RETURN'
                    ? `Plot #${plot.plotNumber || ''} has been released to inventory. Settled with extra growth/interest return of ${summary.refundInterestRate}% P.A. (+₹${summary.refundInterestAmount.toLocaleString('en-IN')}).`
                    : `Plot #${plot.plotNumber || ''} has been released back to stock upon cancellation.`}
                </p>
              </div>
            </div>

            {pendingSettlementBalance > 0 && (
              <button
                type="button"
                onClick={handleOpenDisburseModal}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Banknote size={15} /> Disburse Part-Payment
              </button>
            )}
          </div>

          {/* Disbursement Progress Bar */}
          <div className="pt-2 border-t border-rose-200/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">
                Refund Disbursement Progress: <strong className="text-emerald-800 font-mono">₹{totalRefundPaid.toLocaleString('en-IN')}</strong> of{' '}
                <strong className="font-mono text-slate-900">₹{netSettlementAmount.toLocaleString('en-IN')}</strong>
              </span>
              <span className="font-mono font-bold text-slate-800">
                {netSettlementAmount > 0
                  ? Math.min(100, Math.round((totalRefundPaid / netSettlementAmount) * 100))
                  : 100}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${netSettlementAmount > 0 ? Math.min(100, Math.round((totalRefundPaid / netSettlementAmount) * 100)) : 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      {!isCancelled ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gross Consideration</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              ₹{grossVal.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {plotArea} Sq Ft @ ₹{effectiveRate.toLocaleString('en-IN')}/SqFt
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Discount Granted</div>
            <div className="text-lg font-black text-slate-700 font-mono mt-1">
              {discountVal > 0 ? `₹${discountVal.toLocaleString('en-IN')}` : '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Net: ₹{netVal.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs bg-gradient-to-br from-teal-50/50 to-white">
            <div className="text-[10px] uppercase font-bold text-teal-800">Net Payable (Debit)</div>
            <div className="text-lg font-black text-teal-900 font-mono mt-1">
              ₹{netVal.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-teal-700 mt-0.5 font-medium">Contract Consideration</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Total Realized (Credit)</div>
            <div className="text-lg font-black text-emerald-800 font-mono mt-1">
              ₹{paidVal.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              {receipts.length} Receipt{receipts.length === 1 ? '' : 's'} Collected
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border shadow-xs bg-white ${
              outstandingVal > 0
                ? 'border-rose-200 bg-gradient-to-br from-rose-50/50 to-white'
                : 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
            }`}
          >
            <div
              className={`text-[10px] uppercase font-bold ${
                outstandingVal > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              Outstanding Balance
            </div>
            <div
              className={`text-lg font-black font-mono mt-1 ${
                outstandingVal > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              ₹{outstandingVal.toLocaleString('en-IN')}
            </div>
            <div
              className={`text-[11px] font-medium mt-0.5 ${
                outstandingVal > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {outstandingVal > 0 ? 'Dr (Pending Balance)' : 'Nil (Fully Cleared)'}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: Total Customer Deposited */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Principal Deposited</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              ₹{paidVal.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across {receipts.length} collection receipt(s)
            </div>
          </div>

          {/* Card 2: Settlement Adjustment (Penalty Deduction OR Extra Interest) */}
          <div
            className={`p-4 rounded-2xl border shadow-xs ${
              summary.refundSettlementType === 'DEDUCTION_PENALTY'
                ? 'bg-rose-50/40 border-rose-200'
                : 'bg-teal-50/40 border-teal-200'
            }`}
          >
            <div
              className={`text-[10px] uppercase font-bold ${
                summary.refundSettlementType === 'DEDUCTION_PENALTY' ? 'text-rose-800' : 'text-teal-800'
              }`}
            >
              {summary.refundSettlementType === 'DEDUCTION_PENALTY'
                ? 'Cancellation Penalty'
                : 'Accrued Return / Interest'}
            </div>
            <div
              className={`text-lg font-black font-mono mt-1 ${
                summary.refundSettlementType === 'DEDUCTION_PENALTY' ? 'text-rose-700' : 'text-teal-700'
              }`}
            >
              {summary.refundSettlementType === 'DEDUCTION_PENALTY'
                ? `- ₹${summary.refundDeduction.toLocaleString('en-IN')}`
                : `+ ₹${summary.refundInterestAmount.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {summary.refundSettlementType === 'DEDUCTION_PENALTY'
                ? summary.refundDeductionPercent > 0
                  ? `${summary.refundDeductionPercent}% Penalty Rate`
                  : 'Flat Amount'
                : `${summary.refundInterestRate}% P.A. Return Rate`}
            </div>
          </div>

          {/* Card 3: Net Settlement Liability */}
          <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Net Refund Liability</div>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">
              ₹{netSettlementAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Payable to customer</div>
          </div>

          {/* Card 4: Total Refund Disbursed */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Refund Disbursed</div>
            <div className="text-lg font-black text-emerald-800 font-mono mt-1">
              ₹{totalRefundPaid.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              {b.refundPayments?.length || (totalRefundPaid > 0 ? 1 : 0)} payment(s) made
            </div>
          </div>

          {/* Card 5: Remaining Settlement Balance */}
          <div
            className={`p-4 rounded-2xl border shadow-xs ${
              pendingSettlementBalance > 0
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-emerald-50/40 border-emerald-200'
            }`}
          >
            <div
              className={`text-[10px] uppercase font-bold ${
                pendingSettlementBalance > 0 ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              Remaining Balance
            </div>
            <div
              className={`text-lg font-black font-mono mt-1 ${
                pendingSettlementBalance > 0 ? 'text-amber-900' : 'text-emerald-800'
              }`}
            >
              ₹{pendingSettlementBalance.toLocaleString('en-IN')}
            </div>
            <div
              className={`text-[11px] font-medium mt-0.5 ${
                pendingSettlementBalance > 0 ? 'text-amber-700' : 'text-emerald-600'
              }`}
            >
              {pendingSettlementBalance > 0 ? 'Cr (Owed to Customer)' : 'Nil (₹0.00 Fully Settled)'}
            </div>
          </div>
        </div>
      )}

      {/* Words Banner */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 text-slate-700 shadow-xs">
        {!isCancelled ? (
          <>
            <div>
              <span className="font-bold text-slate-900">Total Realized In Words: </span>
              <span className="text-emerald-800 font-semibold">{amountInWords(paidVal)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Outstanding In Words: </span>
              <span className={outstandingVal > 0 ? 'text-rose-800 font-semibold' : 'text-emerald-800 font-semibold'}>
                {outstandingVal > 0 ? amountInWords(outstandingVal) : 'Nil / Fully Cleared'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="font-bold text-slate-900">Net Refund Liability In Words: </span>
              <span className="text-slate-900 font-semibold">{amountInWords(netSettlementAmount)}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Remaining Balance In Words: </span>
              <span className={pendingSettlementBalance > 0 ? 'text-amber-800 font-semibold' : 'text-emerald-800 font-semibold'}>
                {pendingSettlementBalance > 0 ? amountInWords(pendingSettlementBalance) : 'Nil / Fully Settled (₹0.00)'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main Content Box with Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tab Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'statement'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen size={14} /> Financial Statement ({ledgerEntries.length})
            </button>

            {installments.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('installments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'installments'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Calendar size={14} /> Installments Schedule ({installments.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'specs'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 size={14} /> Allottee &amp; Plot Details
            </button>
          </div>

          {activeTab === 'statement' && (
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions or ref #..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 shadow-2xs"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Financial Running Ledger Statement */}
        {activeTab === 'statement' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3 whitespace-nowrap">Date</th>
                  <th className="p-3 min-w-[240px]">Particulars / Narration</th>
                  <th className="p-3 whitespace-nowrap">Doc / Voucher / Receipt #</th>
                  <th className="p-3 whitespace-nowrap">Payment Mode</th>
                  <th className="p-3 text-right whitespace-nowrap">Debit (₹)</th>
                  <th className="p-3 text-right whitespace-nowrap">Credit (₹)</th>
                  <th className="p-3 text-right whitespace-nowrap">Running Balance (₹)</th>
                  <th className="p-3 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 italic">
                      No statement transactions match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => {
                    const isDebit = e.debit > 0;
                    const isCredit = e.credit > 0;
                    const dateStr = new Date(e.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={e._id || idx}
                        className={`hover:bg-slate-50/80 transition ${
                          isDebit ? 'bg-rose-50/15' : isCredit ? 'bg-emerald-50/15' : ''
                        }`}
                      >
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 whitespace-nowrap text-slate-700">{dateStr}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{e.particulars}</span>
                          {e.notes && <span className="text-[11px] text-slate-500 block mt-0.5">{e.notes}</span>}
                        </td>
                        <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-800">
                          {e.referenceNumber || '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {e.paymentMode || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-rose-800 whitespace-nowrap">
                          {isDebit ? `₹${e.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {isCredit ? `₹${e.credit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{Math.abs(e.balance).toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {e.balance > 0 ? 'Dr' : e.balance === 0 ? 'Nil' : 'Cr'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {e.receiptId ? (
                            <button
                              type="button"
                              onClick={() => window.open(`/dashboard/plots/receipts/${e.receiptId}`, '_blank')}
                              title="Print Receipt"
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Receipt size={13} /> Print
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={5} className="p-3.5 uppercase tracking-wide text-slate-700">
                    Total Account Statement Balance
                  </td>
                  <td className="p-3.5 text-right font-mono text-rose-800">
                    ₹{ledgerEntries.reduce((s, e) => s + (Number(e.debit) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-800">
                    ₹{ledgerEntries.reduce((s, e) => s + (Number(e.credit) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-950">
                    {isCancelled ? (
                      pendingSettlementBalance > 0 ? (
                        <>
                          ₹{pendingSettlementBalance.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] text-amber-700 font-semibold">Cr (Owed)</span>
                        </>
                      ) : (
                        <span className="text-emerald-700">₹0.00 Settled</span>
                      )
                    ) : (
                      <>
                        ₹{outstandingVal.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-600 font-semibold">
                          {outstandingVal > 0 ? 'Dr' : 'Nil'}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2: Installments Schedule */}
        {activeTab === 'installments' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <tr>
                  <th className="p-3 w-16 text-center">Inst #</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Principal Due</th>
                  <th className="p-3 text-right">Late Fine</th>
                  <th className="p-3 text-right">Total Due</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Paid Date</th>
                  <th className="p-3">Receipt #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {installments.map((inst, idx) => {
                  const isPaid = inst.status === 'PAID';
                  const fine = Number(inst.lateFine || 0);
                  const totalDue = Number(inst.dueAmount || 0) + fine;
                  const dueDateStr = inst.dueDate
                    ? new Date(inst.dueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Awaiting DP';

                  return (
                    <tr
                      key={inst._id || idx}
                      className={`hover:bg-slate-50 transition ${isPaid ? 'bg-emerald-50/15' : ''}`}
                    >
                      <td className="p-3 text-center font-bold font-mono text-slate-700">
                        {inst.installmentNumber === 0 ? 'Downpmt' : `#${inst.installmentNumber}`}
                      </td>
                      <td className="p-3 text-slate-800">{dueDateStr}</td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        ₹{(inst.dueAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-700">
                        {fine > 0 ? `₹${fine.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900">
                        ₹{totalDue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        ₹{(inst.paidAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {inst.paidDate
                          ? new Date(inst.paidDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {inst.receiptNumber ? (
                          <button
                            type="button"
                            onClick={() => {
                              const rc = receipts.find((r) => r.receiptNumber === inst.receiptNumber);
                              if (rc) window.open(`/dashboard/plots/receipts/${rc._id}`, '_blank');
                            }}
                            className="text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{inst.receiptNumber}</span>
                            <Printer size={12} className="text-slate-400" />
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={2} className="p-3.5 uppercase tracking-wide text-slate-700">
                    Total Installments Due
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    ₹{installments.reduce((sum, i) => sum + (Number(i.dueAmount) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-rose-700">
                    {lateFineAccrued > 0 ? `₹${lateFineAccrued.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    ₹
                    {installments
                      .reduce((sum, i) => sum + (Number(i.dueAmount) || 0) + (Number(i.lateFine) || 0), 0)
                      .toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-800">
                    ₹{installments.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td colSpan={3} className="p-3.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 3: Allottee & Plot Details */}
        {activeTab === 'specs' && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Customer Details Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-2">
                <User size={16} className="text-teal-700" /> Customer / Allottee Master Record
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm">{customer.name || b.customerName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Customer ID</span>
                  <span className="font-mono font-bold text-slate-800">
                    {customer.customerId || customer.customerCode || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Father / Husband</span>
                  <span className="font-semibold">{customer.fatherOrHusbandName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Mobile Number</span>
                  <span className="font-semibold">{customer.mobile || b.customerMobile || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Registered Address</span>
                  <span className="font-medium">{customer.address || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Nominee Name</span>
                  <span className="font-semibold">{customer.nominee?.name || customer.nomineeName || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Nominee Relation</span>
                  <span className="font-semibold">{customer.nominee?.relation || customer.nomineeRelation || '-'}</span>
                </div>
              </div>
            </div>

            {/* Plot Dimensions & Boundaries */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-2">
                <MapPin size={16} className="text-teal-700" /> Plot Specifications &amp; Boundaries
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Plot Number</span>
                  <span className="font-bold text-teal-800 text-sm">Plot #{plot.plotNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Allocated Area</span>
                  <span className="font-bold text-slate-900">
                    {plotArea} Sq Ft ({plot.dismil || (plotArea > 0 ? (plotArea / 435.6).toFixed(2) : 0)} Dismil)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Project Layout</span>
                  <span className="font-semibold">{project.projectName || plot.seriesId?.seriesName || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Sponsor / Referral</span>
                  <span className="font-semibold">{sponsor.name || 'Direct / Company'}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase mb-1">
                    Plot Dimensions (North / South / East / West)
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 font-bold">
                      N: {plot.dimensions?.north || '-'} ft
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200 font-bold">
                      S: {plot.dimensions?.south || '-'} ft
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200 font-bold">
                      E: {plot.dimensions?.east || '-'} ft
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200 font-bold">
                      W: {plot.dimensions?.west || '-'} ft
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ──────────────── DISBURSE REFUND PART-PAYMENT MODAL ──────────────── */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Banknote size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Disburse Refund Payment</h3>
                  <p className="text-xs text-slate-500">
                    Booking #{b.bookingNumber} • {customer.name || b.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDisburseModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleDisburseSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Remaining Liability</span>
                  <span className="text-base font-mono font-black text-slate-900">
                    ₹{pendingSettlementBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Already Disbursed</span>
                  <span className="text-base font-mono font-bold text-emerald-700">
                    ₹{totalRefundPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursement Amount (₹) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={pendingSettlementBalance}
                    step="0.01"
                    required
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl font-mono font-bold text-sm text-slate-900 outline-none"
                    placeholder="Enter amount..."
                  />
                  {pendingSettlementBalance > 0 && Number(disburseAmount) !== pendingSettlementBalance && (
                    <button
                      type="button"
                      onClick={() => setDisburseAmount(pendingSettlementBalance)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition"
                    >
                      Full Balance
                    </button>
                  )}
                </div>
              </div>

              <div>
                <DateInput
                  label="Disbursement Date"
                  value={disburseDate}
                  onChange={(e) => setDisburseDate(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={disburseMode}
                  onChange={(e) => setDisburseMode(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / Cheque Reference #
                </label>
                <input
                  type="text"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  placeholder="e.g. UTR / CHQ-104928"
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Narration / Remarks
                </label>
                <textarea
                  rows={2}
                  value={disburseRemarks}
                  onChange={(e) => setDisburseRemarks(e.target.value)}
                  placeholder="Payment remarks..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submittingPayment}
                  onClick={() => setShowDisburseModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm &amp; Disburse Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotBookingLedgerPage;
