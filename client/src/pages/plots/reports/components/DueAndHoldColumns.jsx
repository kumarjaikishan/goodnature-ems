import React from 'react';
import { Eye, Receipt, Edit3, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export const getDueColumns = ({ navigate }) => [
  {
    name: 'Booking Date',
    selector: (row) => row.bookingDate || row.createdAt,
    cell: (row) => {
      const d = new Date(row.bookingDate || row.createdAt);
      return (
        <div className="flex flex-col leading-tight py-1">
          <span className="text-slate-800 font-semibold text-xs whitespace-nowrap">
            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
          <span className="text-[11px] text-slate-400 font-medium font-mono">
            {d.getFullYear()}
          </span>
        </div>
      );
    },
    sortable: true,
    minWidth: '110px',
  },
  {
    name: 'Booking & Plot',
    selector: (row) => row.bookingNumber,
    cell: (row) => (
      <div className="flex flex-col gap-1 py-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
            Plot #{row.plotId?.plotNumber || 'N/A'}
          </span>
          {row.scheme && (
            <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {row.scheme === 'FULL_PAYMENT' ? 'Full' : 'EMI'}
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] font-medium text-slate-500 tracking-wide">
          {row.bookingNumber}
        </span>
      </div>
    ),
    sortable: true,
    minWidth: '140px',
  },
  {
    name: 'Customer',
    selector: (row) => row.customerId?.name || row.customerName,
    cell: (row) => {
      const name = row.customerId?.name || row.customerName || 'N/A';
      const phone = row.customerId?.mobile || row.customerMobile || '';
      return (
        <div className="flex flex-col py-1">
          <span className="font-bold text-slate-900 text-[13px] tracking-tight leading-snug">
            {name}
          </span>
          {phone && (
            <span className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">
              {phone}
            </span>
          )}
        </div>
      );
    },
    sortable: true,
    minWidth: '160px',
    grow: 2,
  },
  {
    name: 'Scheme',
    selector: (row) => row.scheme,
    cell: (row) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
        {row.scheme === 'FULL_PAYMENT' ? 'One Time' : 'EMI Scheme'}
      </span>
    ),
    sortable: true,
    minWidth: '95px',
  },
  {
    name: 'Net Payable',
    selector: (row) => row.netPlotValue || (row.plotValue || 0) - (row.discount || 0),
    cell: (row) => (
      <div className="flex flex-col leading-tight py-1">
        <span className="font-semibold text-slate-700 font-mono text-[13px]">
          ₹{(row.netPlotValue || (row.plotValue || 0) - (row.discount || 0)).toLocaleString('en-IN')}
        </span>
        {(row.discount || 0) > 0 && (
          <span className="text-[10px] text-amber-700 font-medium mt-0.5">
            -₹{(row.discount || 0).toLocaleString('en-IN')} disc.
          </span>
        )}
      </div>
    ),
    sortable: true,
    minWidth: '115px',
  },
  {
    name: 'Paid Amount',
    selector: (row) => row.totalPaid || 0,
    cell: (row) => (
      <div className="flex flex-col leading-tight py-1">
        <span className="font-mono text-[13px] font-bold text-emerald-700">
          ₹{(row.totalPaid || 0).toLocaleString('en-IN')}
        </span>
      </div>
    ),
    sortable: true,
    minWidth: '110px',
  },
  {
    name: 'Due Amount',
    selector: (row) => row.totalDue || row.remainingAmount || 0,
    cell: (row) => (
      <span className="font-black text-rose-700 font-mono text-[13px]">
        ₹{(row.totalDue || row.remainingAmount || 0).toLocaleString('en-IN')}
      </span>
    ),
    sortable: true,
    minWidth: '115px',
  },
  {
    name: 'EMIs Paid',
    selector: (row) => row.paidEmisCount !== undefined ? row.paidEmisCount : (row.paidInstallmentsCount || 0),
    cell: (row) => {
      if (row.scheme === 'FULL_PAYMENT') {
        return (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-slate-800 whitespace-nowrap">
              {row.dueStatus === 'COMPLETED' ? '1 / 1 Paid' : '0 / 1 Paid'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">One Time</span>
          </div>
        );
      }

      const totalEmis = row.totalEmisCount !== undefined
        ? row.totalEmisCount
        : (row.totalInstallmentsCount > 0 ? (row.hasDownpayment ? row.totalInstallmentsCount - 1 : row.totalInstallmentsCount) : (row.tenureMonths || 0));
      const paidEmis = row.paidEmisCount !== undefined
        ? row.paidEmisCount
        : (row.paidInstallmentsCount || 0);

      const dpBadge = row.hasDownpayment ? (
        <span
          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
            row.downpaymentPaid
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
          title={row.downpaymentPaid ? 'Down Payment Received' : 'Down Payment Due'}
        >
          {row.downpaymentPaid ? 'DP: Paid' : 'DP: Due'}
        </span>
      ) : null;

      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 font-mono">
              {totalEmis > 0 ? `${paidEmis} / ${totalEmis}` : '-'}
            </span>
            {dpBadge}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {totalEmis > 0 ? `${paidEmis} of ${totalEmis} EMIs` : 'EMI Scheme'}
          </span>
        </div>
      );
    },
    sortable: true,
    minWidth: '120px',
  },
  {
    name: 'Status',
    selector: (row) => row.dueStatus,
    cell: (row) => (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          row.dueStatus === 'COMPLETED'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}
      >
        {row.dueStatus}
      </span>
    ),
    sortable: true,
    minWidth: '95px',
  },
  {
    name: 'Action',
    minWidth: '85px',
    cell: (b) => {
      const isDpDue = b.hasDownpayment ? !b.downpaymentPaid : false;
      const targetPath = (b.scheme === 'MONTHLY_INSTALLMENT' && !isDpDue)
        ? `/dashboard/plots/collections/emi/add?bookingId=${b._id}`
        : `/dashboard/plots/collections/downpayment/add?bookingId=${b._id}`;
      return (
        <Button
          size="sm"
          variant="primary"
          onClick={() => navigate(targetPath)}
          className="text-xs font-semibold py-1 px-3"
        >
          Collect
        </Button>
      );
    },
  },
];

export const getHoldColumns = ({
  navigate,
  handleEditClick,
  handleDeleteBooking,
  deletingId,
  getHoldHoursLeft,
  canUpdate = true,
  canDelete = true,
}) => [
  {
    name: 'Plot #',
    selector: (row) => row.plotId?.plotNumber || '',
    cell: (row) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
        Plot #{row.plotId?.plotNumber || 'N/A'}
      </span>
    ),
    sortable: true,
    minWidth: '110px',
  },
  {
    name: 'Customer',
    selector: (row) => row.customerId?.name || row.customerName,
    cell: (row) => (
      <div className="flex flex-col py-1">
        <span className="font-bold text-slate-900 text-[13px] tracking-tight leading-snug">
          {row.customerId?.name || row.customerName || 'N/A'}
        </span>
        <span className="text-[11px] text-slate-400 font-medium font-mono mt-0.5">
          {row.customerId?.mobile || row.customerMobile || '-'}
        </span>
      </div>
    ),
    sortable: true,
    minWidth: '160px',
    grow: 2,
  },
  {
    name: 'Hold Deposit',
    selector: (row) => row.bookingAmount || 0,
    cell: (row) => (
      <span className="font-bold text-slate-800 whitespace-nowrap font-mono text-[13px]">
        ₹{(row.bookingAmount || 0).toLocaleString('en-IN')}
      </span>
    ),
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Hours Remaining',
    selector: (row) => getHoldHoursLeft(row.holdExpiryDate),
    cell: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        {getHoldHoursLeft(row.holdExpiryDate)}
      </span>
    ),
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Status',
    selector: (row) => row.status,
    cell: (row) => (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
        {row.status}
      </span>
    ),
    sortable: true,
    minWidth: '100px',
  },
  {
    name: 'Expiry Date',
    selector: (row) => row.holdExpiryDate,
    cell: (row) => (
      <span className="text-slate-800 font-medium whitespace-nowrap text-xs">
        {new Date(row.holdExpiryDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    ),
    sortable: true,
    minWidth: '160px',
  },
  {
    name: 'Action',
    minWidth: '140px',
    cell: (h) => (
      <div className="flex items-center gap-1.5 py-1">
        <button
          onClick={() => navigate(`/dashboard/plots/booking/${h._id}`)}
          title="View Full Plot & Hold Details"
          className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition cursor-pointer border border-slate-200 shadow-2xs hover:border-teal-400"
        >
          <Eye size={15} />
        </button>
        {h.receiptId && (
          <button
            onClick={() => navigate(`/dashboard/plots/receipts/${h.receiptId}`)}
            title="Print Hold Deposit Receipt"
            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition cursor-pointer border border-sky-200 shadow-2xs"
          >
            <Receipt size={15} />
          </button>
        )}

      </div>
    ),
  },
];
