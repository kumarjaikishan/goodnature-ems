
import React from 'react';
import { Clock, XCircle, Check, Printer, Trash2 } from 'lucide-react';

export const getReceiptColumns = ({
  navigate,
  setApprovingReceipt,
  setRejectingReceipt,
  setRejectionReason,
  setDeletingReceipt,
  canUpdate = true,
  canDelete = true,
}) => [
    {
      name: 'Receipt # & Date',
      selector: (row) => (row.receiptNumber || '').replace(/^RO-/, ''),
      cell: (row) => {
        const cleanNo = (row.receiptNumber || '').replace(/^RO-/, '');
        const dateStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) : '-';

        return (
          <div className="flex flex-col gap-0.5 text-left py-0.5">
            <span
              onClick={() => navigate(`/dashboard/plots/receipts/${row._id}`)}
              className="font-bold text-teal-800 hover:text-teal-950 hover:underline tracking-tight font-mono text-xs whitespace-nowrap cursor-pointer select-all"
              title="Click to View / Print Receipt"
            >
              {cleanNo || '-'}
            </span>
            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
              {dateStr}
            </span>
          </div>
        );
      },
      sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Customer',
      selector: (row) => row.bookingId?.customerId?.name || '-',
      cell: (row) => (
        <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]" title={row.bookingId?.customerId?.name || ''}>
          {row.bookingId?.customerId?.name || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '110px',
      grow: 1,
    },
    {
      name: 'Booking No.',
      selector: (row) => row.bookingId?.bookingNumber || '-',
      cell: (row) => (
        <span className="font-bold text-slate-900 tracking-tight font-mono text-xs whitespace-nowrap select-all">
          {row.bookingId?.bookingNumber || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Plot',
      selector: (row) => row.bookingId?.plotId?.plotNumber || '-',
      cell: (row) => (
        <span className="font-bold text-teal-800 text-xs font-mono whitespace-nowrap">
          {row.bookingId?.plotId?.plotNumber || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '70px',
      compact: true,
    },
    {
      name: 'Amount Paid',
      selector: (row) => row.amount || 0,
      cell: (row) => (
        <span className="font-bold text-emerald-800 font-mono text-xs whitespace-nowrap">
          ₹{(row.amount || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '105px',
    },
    {
      name: 'Mode',
      selector: (row) => row.paymentMode,
      cell: (row) => {
        const mode = (row.paymentMode === 'bank_transfer' || row.paymentMode === 'neft_rtgs') ? 'BANK/ONLINE' : row.paymentMode;
        return (
          <div className="flex flex-col text-left gap-0.5">
            <span className="font-bold uppercase text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap w-fit">
              {mode}
            </span>
            {row.transactionReference ? (
              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[110px]" title={row.transactionReference}>
                Ref: {row.transactionReference}
              </span>
            ) : null}
          </div>
        );
      },
      sortable: true,
      minWidth: '120px',
      compact: true,
    },
    {
      name: 'Collected By',
      selector: (row) => row.createdBy?.name || '-',
      cell: (row) => (
        <div className="flex flex-col text-xs leading-tight">
          <span className="font-semibold text-slate-800 truncate max-w-[105px]" title={row.createdBy?.name || 'Self / Admin'}>
            {row.createdBy?.name || 'Self / Admin'}
          </span>
          {row.branchId?.name && (
            <span className="text-[10px] text-slate-400 truncate max-w-[105px]" title={row.branchId.name}>
              {row.branchId.name}
            </span>
          )}
        </div>
      ),
      sortable: true,
      minWidth: '110px',
    },
    {
      name: 'Status',
      selector: (row) => row.status || 'APPROVED',
      cell: (row) => {
        const status = (row.status || 'APPROVED').toUpperCase();
        if (status === 'PENDING') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
              <Clock size={10} /> Pending
            </span>
          );
        }
        if (status === 'REJECTED') {
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap"
              title={row.rejectionReason || 'Rejected'}
            >
              <XCircle size={10} /> Rejected
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <Check size={10} /> Approved
          </span>
        );
      },
      sortable: true,
      minWidth: '100px',
    },

    {
      name: 'Actions',
      minWidth: '100px',
      cell: (r) => {
        const isPending = (r.status || 'APPROVED').toUpperCase() === 'PENDING';
        return (
          <div className="flex items-center gap-1 py-1">
            {isPending && canUpdate && (
              <>
                <button
                  onClick={() => setApprovingReceipt(r)}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Approve Collection"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => {
                    setRejectingReceipt(r);
                    setRejectionReason('');
                  }}
                  className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition cursor-pointer flex items-center justify-center shadow-2xs"
                  title="Reject Collection"
                >
                  <XCircle size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/dashboard/plots/receipts/${r._id}`)}
              className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-700 font-semibold border border-slate-200 transition cursor-pointer flex items-center justify-center shadow-2xs hover:border-teal-400"
              title="Print Receipt"
            >
              <Printer size={13} />
            </button>
            {canDelete && (
              <button
                onClick={() => setDeletingReceipt(r)}
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition cursor-pointer flex items-center justify-center shadow-2xs"
                title="Delete / Reverse"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        );
      },
    },
  ];
