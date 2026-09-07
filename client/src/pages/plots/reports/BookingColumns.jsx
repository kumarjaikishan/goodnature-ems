import React from 'react';
import { Eye, Receipt, Award, ScrollText, Edit3, History, Trash2, CalendarPlus, Coins } from 'lucide-react';
import { toast } from '@/utils/toast';
import api from '@/api/axios';

export const getBookingColumns = ({
  navigate,
  handleEditClick,
  openRevisionsModal,
  openDeleteBookingModal,
  deletingId,
  setSetupPayoutBooking,
  setSetupPayoutForm,
}) => [
  {
    name: 'Booking Date',
    selector: (row) => row.bookingDate || row.createdAt,
    cell: (row) => (
      <span className="text-slate-600 font-medium whitespace-nowrap text-xs">
        {new Date(row.bookingDate || row.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    ),
    sortable: true,
    minWidth: '120px',
  },
  {
    name: 'Booking & Plot #',
    selector: (row) => row.bookingNumber,
    cell: (row) => (
      <div className="flex flex-col text-xs">
        <span className="font-bold text-slate-900 tracking-wide font-mono">{row.bookingNumber}</span>
        <span className="text-[11px] font-semibold text-teal-800">Plot: {row.plotId?.plotNumber || 'N/A'}</span>
      </div>
    ),
    sortable: true,
    minWidth: '140px',
  },
  {
    name: 'Customer',
    selector: (row) => row.customerId?.name || row.customerName,
    cell: (row) => (
      <div className="flex flex-col text-xs">
        <span className="font-bold text-slate-900 truncate">{row.customerId?.name || row.customerName}</span>
        <span className="text-[11px] text-slate-500 font-medium">{row.customerId?.mobile || row.customerMobile}</span>
      </div>
    ),
    sortable: true,
    minWidth: '160px',
    grow: 2,
  },
  {
    name: 'Plot Value',
    selector: (row) => row.plotValue || 0,
    cell: (row) => (
      <span className="font-bold text-slate-900 font-mono text-xs">
        ₹{(row.plotValue || 0).toLocaleString('en-IN')}
      </span>
    ),
    sortable: true,
    minWidth: '120px',
  },
  {
    name: 'Discount',
    selector: (row) => row.discount || 0,
    cell: (row) => (
      <span className="font-semibold text-slate-700 font-mono text-xs">
        {row.discount > 0 ? `₹${(row.discount || 0).toLocaleString('en-IN')}` : '-'}
      </span>
    ),
    sortable: true,
    minWidth: '100px',
  },
  {
    name: 'Paid Amount',
    selector: (row) => Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)),
    cell: (row) => (
      <span className="font-bold text-emerald-800 font-mono text-xs">
        ₹{Math.max(0, (row.plotValue || 0) - (row.discount || 0) - (row.remainingAmount || 0)).toLocaleString('en-IN')}
      </span>
    ),
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Outstanding',
    selector: (row) => row.remainingAmount || 0,
    cell: (row) => (
      <span className="font-bold text-rose-700 font-mono text-xs">
        ₹{(row.remainingAmount || 0).toLocaleString('en-IN')}
      </span>
    ),
    sortable: true,
    minWidth: '130px',
  },
  {
    name: 'Status',
    selector: (row) => row.status,
    cell: (row) => (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          row.status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : row.status === 'HOLD'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : row.status === 'COMPLETED'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}
      >
        {row.status}
      </span>
    ),
    sortable: true,
    minWidth: '110px',
  },
  {
    name: 'Actions',
    minWidth: '220px',
    cell: (b) => (
      <div className="flex items-center gap-1.5 py-1">
        {/* 1. View Full Details & Ledger */}
        <button
          onClick={() => navigate(`/dashboard/plots/booking/${b._id}`)}
          title="View Full Plot & Booking Details"
          className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition cursor-pointer border border-slate-200 shadow-2xs hover:border-teal-400"
        >
          <Eye size={15} />
        </button>

        {/* 2. Print Booking Receipt */}
        {b.receiptId && (
          <button
            onClick={() => navigate(`/dashboard/plots/receipts/${b.receiptId}`)}
            title="Print Payment Receipt"
            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition cursor-pointer border border-sky-200 shadow-2xs"
          >
            <Receipt size={15} />
          </button>
        )}

        {/* 3. Print Booking Certificate */}
        <button
          onClick={() => navigate(`/dashboard/plots/certificates/${b._id}`)}
          title="Print Official Booking Certificate"
          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer border border-purple-200 shadow-2xs"
        >
          <Award size={15} />
        </button>

        {/* 4. Print Plot Agreement */}
        {(() => {
          const netVal = Math.max(0, (b.plotValue || 0) - (b.discount || 0));
          const paid = Math.max(0, netVal - (b.remainingAmount || 0));
          const dpReq =
            b.scheme === 'FULL_PAYMENT'
              ? netVal
              : b.bookingAmount || b.downpaymentAmount || Math.round(netVal * 0.4);
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

                if (b.agreementNumber && b.agreementNumber.trim() !== '') {
                  navigate(`/dashboard/plots/agreements/${b._id}`);
                } else {
                  const input = window.prompt(
                    `Enter Agreement Number for Booking #${b.bookingNumber} (Plot #${b.plotId?.plotNumber || ''}):`,
                    ''
                  );
                  if (input === null) return;
                  const finalAgreementNo = input.trim();
                  if (finalAgreementNo) {
                    try {
                      await api.put(`/plots/bookings/${b._id}`, { agreementNumber: finalAgreementNo });
                      toast.success('Agreement number saved successfully');
                      b.agreementNumber = finalAgreementNo;
                    } catch (err) {
                      console.error('Failed to update agreement number:', err);
                    }
                  }
                  navigate(`/dashboard/plots/agreements/${b._id}`);
                }
              }}
              title={
                !isDpComplete
                  ? `Agreement Locked: Downpayment pending (Paid: ₹${paid.toLocaleString('en-IN')} / ₹${dpReq.toLocaleString('en-IN')})`
                  : 'Print Legal Plot Agreement'
              }
              className={`p-1.5 rounded-lg transition shadow-2xs border ${
                isDpComplete
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 cursor-pointer'
                  : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <ScrollText size={15} />
            </button>
          );
        })()}

        {/* 5. Edit Booking Contract */}
        <button
          onClick={() => handleEditClick(b)}
          title="Edit Booking Contract"
          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer border border-indigo-200 shadow-2xs"
        >
          <Edit3 size={15} />
        </button>

        {/* 6. View Revision & Restructuring History */}
        <button
          onClick={() => openRevisionsModal(b)}
          title="View Contract Revision History & Audits"
          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer border border-purple-200 shadow-2xs relative"
        >
          <History size={15} />
          {(b.revisionCount || 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-teal-700 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {b.revisionCount}
            </span>
          )}
        </button>

        {/* 7. Delete Booking */}
        <button
          onClick={() => openDeleteBookingModal(b)}
          disabled={deletingId === b._id}
          title="Delete Booking"
          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer border border-rose-200 disabled:opacity-50 shadow-2xs"
        >
          {deletingId === b._id ? (
            <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
        </button>

        {/* 8. Money-Back Payouts Setup / Ledger */}
        {b.scheme === 'FULL_PAYMENT' && b.remainingAmount === 0 && (
          <>
            {!b.payoutStatus || b.payoutStatus === 'INACTIVE' ? (
              <button
                onClick={() => {
                  setSetupPayoutBooking(b);
                  setSetupPayoutForm({
                    startDate: new Date().toISOString().split('T')[0],
                    weeklyAmount: Math.round((b.plotValue / 500) * 100) / 100,
                  });
                }}
                title="Setup Weekly Money-Back Payouts"
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer border border-emerald-200 shadow-2xs"
              >
                <CalendarPlus size={15} />
              </button>
            ) : (
              <button
                onClick={() => navigate(`/dashboard/plots/payout-ledger?bookingId=${b._id}`)}
                title="View Weekly Money-Back Payout Ledger"
                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition cursor-pointer border border-emerald-300 shadow-2xs"
              >
                <Coins size={15} />
              </button>
            )}
          </>
        )}
      </div>
    ),
  },
];
