import React from 'react';
import { Eye, BookOpen, Receipt, Printer, ScrollText, Edit3, History, Trash2, Calculator } from 'lucide-react';
import { toast } from '@/utils/toast';
import api from '@/api/axios';

export const getBookingColumns = ({
  navigate,
  handleEditClick,
  openRevisionsModal,
  openDeleteBookingModal,
  openBookingLedgerModal,
  deletingId,
  canUpdate = true,
  canDelete = true,
}) => [
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
    name: 'Booking & Plot #',
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
    minWidth: '150px',
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
    minWidth: '170px',
    grow: 2,
  },
  {
    name: 'Plot Value',
    selector: (row) => row.plotValue || 0,
    cell: (row) => {
      const area = row.plotId?.plotSize || row.plotId?.area || row.plotId?.areaSqFt || 0;
      return (
        <div className="flex flex-col leading-tight py-1">
          <span className="font-semibold text-slate-700 font-mono text-[13px]">
            ₹{(row.plotValue || 0).toLocaleString('en-IN')}
          </span>
          {area > 0 && (
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              {area} Sq Ft
            </span>
          )}
        </div>
      );
    },
    sortable: true,
    minWidth: '120px',
  },
  {
    name: 'Discount',
    selector: (row) => row.discount || 0,
    cell: (row) =>
      row.discount > 0 ? (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 font-mono">
          -₹{(row.discount).toLocaleString('en-IN')}
        </span>
      ) : (
        <span className="text-slate-300 font-mono text-xs select-none">—</span>
      ),
    sortable: true,
    minWidth: '100px',
  },
  {
    name: 'Paid Amount',
    selector: (row) => Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)),
    cell: (row) => {
      const netVal = Math.max(0, (row.plotValue || 0) - (row.discount || 0));
      const paid = Math.max(0, netVal - (row.remainingAmount || 0));

      return (
        <span
          className={`font-mono text-[13px] ${
            paid > 0 ? 'font-bold text-emerald-700' : 'font-medium text-slate-400'
          }`}
        >
          ₹{paid.toLocaleString('en-IN')}
        </span>
      );
    },
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Outstanding',
    selector: (row) => row.remainingAmount || 0,
    cell: (row) => {
      const remaining = Number(row.remainingAmount || 0);
      return remaining > 0 ? (
        <span className="font-black text-rose-700 font-mono text-[13px]">
          ₹{remaining.toLocaleString('en-IN')}
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ✓ Cleared
        </span>
      );
    },
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Status',
    selector: (row) => row.status,
    cell: (row) => {
      const statusStyles = {
        ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
        REJECTED: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
        HOLD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
        COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
        CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
      };
      const style = statusStyles[row.status] || {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} border ${style.border} shadow-2xs`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {row.status}
        </span>
      );
    },
    sortable: true,
    minWidth: '115px',
  },
  {
    name: 'Actions',
    minWidth: '150px',
    cell: (b) => (
      <div className="flex flex-col gap-1.5 py-1.5 w-fit">
        {/* Row 1: 4 action buttons */}
        <div className="flex items-center gap-1.5">
          {/* 1. View Full Details */}
          <button
            onClick={() => navigate(`/dashboard/plots/booking/${b._id}`)}
            title="View Full Plot & Booking Details"
            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition cursor-pointer border border-slate-200 shadow-2xs hover:border-teal-400"
          >
            <Eye size={14} />
          </button>

          {/* 2. View Booking Financial Ledger Page */}
          <button
            onClick={() => navigate(`/dashboard/plots/booking/${b._id}/ledger`)}
            title="View Booking Financial Ledger & Statement"
            className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition cursor-pointer border border-emerald-200 shadow-2xs hover:border-emerald-400"
          >
            <BookOpen size={14} />
          </button>

          {/* 3. Settlement & Interest Calculator (Hidden when cancelled) */}
          {b.status !== 'CANCELLED' && (
            <button
              onClick={() => navigate(`/dashboard/plots/interest-calculator?bookingId=${b._id}&bookingNumber=${b.bookingNumber}`)}
              title="Plot Refund, Return & Settlement Calculator"
              className="w-7 h-7 flex items-center justify-center bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition cursor-pointer border border-teal-200 shadow-2xs hover:border-teal-400"
            >
              <Calculator size={14} />
            </button>
          )}

          {/* 4. Print Booking Receipt (or Certificate) */}
          {b.receiptId ? (
            <button
              onClick={() => navigate(`/dashboard/plots/receipts/${b.receiptId}`)}
              title="Print Payment Receipt"
              className="w-7 h-7 flex items-center justify-center bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition cursor-pointer border border-sky-200 shadow-2xs"
            >
              <Receipt size={14} />
            </button>
          ) : (
            <button
              onClick={() => navigate(`/dashboard/plots/certificates/${b._id}`)}
              title="Print Booking Certificate"
              className="w-7 h-7 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer border border-purple-200 shadow-2xs"
            >
              <Printer size={14} />
            </button>
          )}

          {/* Fallback if both receipt and certificate present */}
          {b.receiptId && (
            <button
              onClick={() => navigate(`/dashboard/plots/certificates/${b._id}`)}
              title="Print Booking Certificate"
              className="w-7 h-7 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer border border-purple-200 shadow-2xs"
            >
              <Printer size={14} />
            </button>
          )}
        </div>

        {/* Row 2: 4 action buttons */}
        <div className="flex items-center gap-1.5">
          {/* 5. Print Plot Agreement */}
          {(() => {
            const netVal = Math.max(0, (b.plotValue || 0) - (b.discount || 0));
            const paid = Math.max(0, netVal - (b.remainingAmount || 0));
            const plotArea = Number(b.plotId?.plotSize || b.plotId?.area || 0);
            const dpReq =
              b.scheme === 'FULL_PAYMENT'
                ? netVal
                : b.downpaymentAmount ||
                  b.bookingAmount ||
                  (b.downpaymentRate && plotArea > 0 ? b.downpaymentRate * plotArea : Math.round(netVal * 0.4));
            const isDpComplete = paid >= dpReq - 1;

            return (
              <button
                onClick={async () => {
                  if (!isDpComplete) {
                    toast.warning(
                      `Agreement available only after downpayment is completed. Required: ₹${dpReq.toLocaleString('en-IN')}, Paid: ₹${paid.toLocaleString('en-IN')}`
                    );
                    return;
                  }

                  navigate(`/dashboard/plots/agreements/${b._id}`);
                }}
                title={
                  !isDpComplete
                    ? `Agreement Locked: Downpayment pending (Paid: ₹${paid.toLocaleString('en-IN')} / ₹${dpReq.toLocaleString('en-IN')})`
                    : 'Print Legal Plot Agreement'
                }
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition shadow-2xs border ${
                  isDpComplete
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 cursor-pointer'
                    : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <ScrollText size={14} />
              </button>
            );
          })()}

          {/* 6. Edit Booking Contract (Hidden when cancelled) */}
          {canUpdate && b.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                if (handleEditClick) {
                  handleEditClick(b);
                } else if (navigate) {
                  navigate(`/dashboard/plots/booking/edit/${b._id}`);
                }
              }}
              title="Edit Booking Contract"
              className="w-7 h-7 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer border border-indigo-200 shadow-2xs"
            >
              <Edit3 size={14} />
            </button>
          )}

          {/* 7. View Revision & Restructuring History */}
          {canUpdate && b.status !== 'CANCELLED' && (
            <button
              onClick={() => openRevisionsModal(b)}
              title="View Contract Revision History & Audits"
              className="w-7 h-7 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer border border-purple-200 shadow-2xs relative"
            >
              <History size={14} />
              {(b.revisionCount || 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal-700 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {b.revisionCount}
                </span>
              )}
            </button>
          )}

          {/* 8. Delete Booking */}
          {canDelete && (
            <button
              onClick={() => openDeleteBookingModal(b)}
              disabled={deletingId === b._id}
              title="Delete Booking"
              className="w-7 h-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer border border-rose-200 disabled:opacity-50 shadow-2xs"
            >
              {deletingId === b._id ? (
                <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          )}
        </div>
      </div>
    ),
  },
];
