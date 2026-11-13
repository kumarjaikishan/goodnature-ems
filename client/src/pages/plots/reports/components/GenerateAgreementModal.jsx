import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import api from '@/api/axios';
import { toast } from '@/utils/toast';

const getLocalDateString = (d = new Date()) => {
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const GenerateAgreementModal = ({
  open,
  onClose,
  booking,
  bookingType = 'PLOT', // 'PLOT' | 'PRODUCT'
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [agreementDate, setAgreementDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract booking creation/effective date
  const rawBookingDate = booking?.bookingDate || booking?.createdAt;
  const bookingDateStr = getLocalDateString(rawBookingDate);

  useEffect(() => {
    if (open) {
      const todayStr = getLocalDateString();
      // If booking date is somehow in the future, prefill booking date, otherwise today
      const defaultDate = (bookingDateStr && bookingDateStr > todayStr) ? bookingDateStr : todayStr;
      setAgreementDate(defaultDate);
      setError('');
      setLoading(false);
    }
  }, [open, bookingDateStr]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    setAgreementDate(val);
    if (!val) {
      setError('Please select an agreement date.');
    } else if (bookingDateStr && val < bookingDateStr) {
      setError(`Agreement date cannot be earlier than booking date (${formatDateDisplay(rawBookingDate)}).`);
    } else {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!booking?._id) return;

    if (!agreementDate) {
      setError('Please select an agreement date.');
      return;
    }

    if (bookingDateStr && agreementDate < bookingDateStr) {
      setError(`Agreement date cannot be earlier than booking date (${formatDateDisplay(rawBookingDate)}).`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = bookingType === 'PRODUCT'
        ? `/plots/product-bookings/${booking._id}/generate-agreement`
        : `/plots/bookings/${booking._id}/generate-agreement`;

      const res = await api.post(endpoint, { agreementDate });
      const updatedBooking = res.data?.data || { ...booking, agreementDate };

      toast.success('Agreement generated successfully!');

      if (onSuccess) {
        onSuccess(updatedBooking);
      }

      onClose();

      // Navigate to the respective agreement viewer
      if (bookingType === 'PRODUCT') {
        navigate(`/dashboard/plots/product-agreements/${booking._id}`);
      } else {
        navigate(`/dashboard/plots/agreements/${booking._id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate agreement.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const customerName = booking.customerId?.name || booking.customerName || 'N/A';
  const customerMobile = booking.customerId?.mobile || booking.customerMobile || '';
  const itemLabel = bookingType === 'PRODUCT'
    ? (booking.productId?.productName || booking.planName || 'Investment Product')
    : `Plot #${booking.plotId?.plotNumber || 'N/A'}`;

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      title="Generate Buyer's Agreement"
      subtitle="Set official execution date to create and register legal agreement"
      icon={<FileText size={20} className="text-teal-700" />}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Booking Summary Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Booking Number:</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {booking.bookingNumber}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Customer:</span>
            <span className="font-semibold text-slate-800">
              {customerName} {customerMobile && <span className="text-slate-400 font-normal">({customerMobile})</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">
              {bookingType === 'PRODUCT' ? 'Product:' : 'Plot:'}
            </span>
            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {itemLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Booking Date:</span>
            <span className="font-medium text-slate-700">
              {formatDateDisplay(rawBookingDate)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Downpayment:</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
              <CheckCircle2 size={12} />
              100% Completed
            </span>
          </div>
        </div>

        {/* Date Input Section */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Agreement Execution Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={agreementDate}
              min={bookingDateStr}
              onChange={handleDateChange}
              required
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl shadow-2xs font-medium focus:outline-none focus:ring-2 transition ${
                error
                  ? 'border-rose-400 focus:ring-rose-200 text-rose-900'
                  : 'border-slate-300 focus:border-teal-600 focus:ring-teal-100 text-slate-800'
              }`}
            />
            <Calendar
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Defaults to today. Must be on or after booking date ({formatDateDisplay(rawBookingDate)}).
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={loading || Boolean(error) || !agreementDate}
            className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={14} />
                Confirm & Generate Agreement
              </>
            )}
          </Button>
        </div>
      </form>
    </Modalbox>
  );
};

export default GenerateAgreementModal;

