import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';

const DeleteBookingModal = ({ bookingToDelete, onClose, onConfirm, deletingId }) => {
  if (!bookingToDelete) return null;

  const paidAmt =
    (bookingToDelete.plotValue || 0) -
    (bookingToDelete.discount || 0) -
    (bookingToDelete.remainingAmount || 0);
  const hasCollections = paidAmt > 0;

  return (
    <Modalbox open={Boolean(bookingToDelete)} onClose={onClose} size="md">
      <div className="p-6 flex flex-col gap-4 w-full">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
              hasCollections ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {hasCollections ? '⚠️' : '🗑️'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {hasCollections ? 'Cannot Delete Booking' : 'Delete Plot Booking?'}
            </h3>
            <p className="text-xs text-slate-500">Booking #{bookingToDelete.bookingNumber}</p>
          </div>
        </div>

        {/* Booking Info Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold text-slate-800">
              {bookingToDelete.customerId?.name || bookingToDelete.customerName || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plot #:</span>
            <span className="font-bold text-teal-800">
              {bookingToDelete.plotId?.plotNumber || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plot Value:</span>
            <span className="font-bold text-slate-800">
              ₹{(bookingToDelete.plotValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Collected:</span>
            <span className={`font-bold ${hasCollections ? 'text-amber-700' : 'text-slate-600'}`}>
              ₹{paidAmt.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Message based on collection existence */}
        {hasCollections ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed font-medium">
            <strong>Notice:</strong> ₹{paidAmt.toLocaleString('en-IN')} has already been collected for this booking. You
            cannot delete a booking with existing collections. Please reverse or delete all receipts from the{' '}
            <strong>Collections</strong> page first.
          </div>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete this booking? This will restore plot{' '}
            <strong className="text-slate-900">{bookingToDelete.plotId?.plotNumber}</strong> status back to{' '}
            <strong className="text-emerald-700">AVAILABLE</strong> and remove the contract schedule.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {hasCollections ? 'Close' : 'Cancel'}
          </Button>
          {!hasCollections && (
            <Button
              variant="danger"
              size="sm"
              loading={deletingId === bookingToDelete._id}
              onClick={onConfirm}
            >
              Yes, Delete Booking
            </Button>
          )}
        </div>
      </div>
    </Modalbox>
  );
};

export default DeleteBookingModal;
