import React from 'react';
import { Clock, XCircle, Check, Printer, Trash2 } from 'lucide-react';

export const getReceiptColumns = ({
  navigate,
  setApprovingReceipt,
  setRejectingReceipt,
  setRejectionReason,
  setDeletingReceipt,
}) => [
  {
    name: 'Date',
    selector: (row) => row.createdAt,
    cell: (row) => (
      <span className="text-slate-600 font-medium whitespace-nowrap text-xs">
        {new Date(row.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    ),
    sortable: true,
    minWidth: '110px',
  },
  {
    name: 'Booking No.',
    selector: (row) => row.bookingId?.bookingNumber || '-',
    cell: (row) => (
      <span className="font-bold text-slate-900 tracking-wide font-mono text-xs">
        {row.bookingId?.bookingNumber || '-'}
      </span>
    ),
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Plot #',
    selector: (row) => row.bookingId?.plotId?.plotNumber || '-',
    cell: (row) => (
      <span className="font-bold text-teal-800 text-xs font-mono">
        Plot #{row.bookingId?.plotId?.plotNumber || '-'}
      </span>
    ),
    sortable: true,
    minWidth: '95px',
  },
  {
    name: 'Customer',
    selector: (row) => row.bookingId?.customerId?.name || '-',
    cell: (row) => (
      <span className="font-bold text-slate-900 text-xs truncate">
        {row.bookingId?.customerId?.name || '-'}
      </span>
    ),
    sortable: true,
    minWidth: '150px',
    grow: 2,
  },
  {
    name: 'Amount Paid',
    selector: (row) => row.amount || 0,
    cell: (row) => (
      <span className="font-bold text-emerald-800 font-mono text-xs">
        ₹{(row.amount || 0).toLocaleString('en-IN')}
      </span>
    ),
    sortable: true,
    minWidth: '120px',
  },
  {
    name: 'Mode',
    selector: (row) => row.paymentMode,
    cell: (row) => (
      <span className="font-bold uppercase text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
        {row.paymentMode}
      </span>
    ),
    sortable: true,
    minWidth: '95px',
  },
  {
    name: 'Status',
    selector: (row) => row.status || 'APPROVED',
    cell: (row) => {
      const status = (row.status || 'APPROVED').toUpperCase();
      if (status === 'PENDING') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={11} /> Pending Approval
          </span>
        );
      }
      if (status === 'REJECTED') {
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
            title={row.rejectionReason || 'Rejected'}
          >
            <XCircle size={11} /> Rejected
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check size={11} /> Approved
        </span>
      );
    },
    sortable: true,
    minWidth: '145px',
  },
  {
    name: 'Ref No.',
    selector: (row) => row.transactionReference || '-',
    cell: (row) => (
      <span className="font-mono text-xs text-slate-500">{row.transactionReference || '-'}</span>
    ),
    sortable: true,
    minWidth: '110px',
  },
  {
    name: 'Actions',
    minWidth: '180px',
    cell: (r) => {
      const isPending = (r.status || 'APPROVED').toUpperCase() === 'PENDING';
      return (
        <div className="flex items-center gap-1.5 py-1">
          {isPending && (
            <>
              <button
                onClick={() => setApprovingReceipt(r)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Approve Collection"
              >
                <Check size={13} /> Approve
              </button>
              <button
                onClick={() => {
                  setRejectingReceipt(r);
                  setRejectionReason('');
                }}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition cursor-pointer flex items-center justify-center shadow-2xs"
                title="Reject Collection"
              >
                <XCircle size={15} />
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/dashboard/plots/receipts/${r._id}`)}
            className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-700 font-semibold border border-slate-200 transition cursor-pointer flex items-center justify-center shadow-2xs hover:border-teal-400"
            title="Print Receipt"
          >
            <Printer size={15} />
          </button>
          <button
            onClick={() => setDeletingReceipt(r)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition cursor-pointer flex items-center justify-center shadow-2xs"
            title="Delete / Reverse"
          >
            <Trash2 size={15} />
          </button>
        </div>
      );
    },
  },
];
