import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { Printer, ArrowLeft } from 'lucide-react';

const numberToWords = (num) => {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const lt1000 = (n) => {
    if (n === 0) return '';
    let t = '';
    if (n >= 100) { t += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n > 0) {
      if (t) t += 'and ';
      t += n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? '-' + a[n % 10] : '');
    }
    return t.trim();
  };

  const convert = (n) => {
    if (n === 0) return '';
    let r = '';
    if (n >= 10000000) { r += convert(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
    if (n >= 100000) { r += lt1000(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000) { r += lt1000(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n > 0) r += lt1000(n);
    return r.trim();
  };

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  let words = convert(intPart);
  if (decPart > 0) {
    const dw = decPart < 20 ? a[decPart] : b[Math.floor(decPart / 10)] + (decPart % 10 ? '-' + a[decPart % 10] : '');
    words += ' and ' + dw + ' Paise';
  }
  return words + ' Rupees Only';
};

const BookingCertificateViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/plots/bookings/${id}`),
      api.get(`/plots/bookings/${id}/installments`)
    ])
      .then(([bookingRes, instRes]) => {
        setBooking(bookingRes.data.data);
        setInstallments(instRes.data.data || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load booking details');
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <p className="text-sm font-bold text-slate-500">Booking details not found or permission denied.</p>
        <button onClick={() => navigate('/dashboard/plots/booking')} className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold">Go Back</button>
      </div>
    );
  }

  const customer = booking.customerId || {};
  const plot = booking.plotId || {};
  const sponsor = booking.sponsorId || {};

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print-container">
      {/* Action Buttons (Hidden on Print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
        >
          <Printer size={14} /> Print Certificate
        </button>
      </div>

      {/* Printable Certificate Container */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-6 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print-half-a4">
        <style>{`
          @media print {
            @page {
              size: portrait;
              margin: 10mm 15mm 10mm 15mm !important;
            }
            body {
              margin: 0;
              background: white !important;
              color: black !important;
            }
            .print-container {
              min-height: 0 !important;
              background-color: white !important;
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
            }
            .print-half-a4 {
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        `}</style>

        {/* Booking Certificate Title */}
        <div className="text-center mb-5 pb-3 border-b-2 border-slate-900 select-none relative z-10">
          <span className="text-slate-900 text-lg font-black uppercase tracking-wider">
            Plot Booking
          </span>
        </div>

        {/* Details Table: Name: Value Format */}
        <table className="w-full border border-slate-200 text-[11px] font-semibold mb-3 select-none border-collapse">
          <tbody>
            {/* Booking ID and Booking Date */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900 w-[32%] font-mono">{booking.bookingNumber}</td>
              <td className="p-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking Date</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900 w-[32%]">
                {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
            </tr>

            {/* Row 1 */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Customer Name</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900">{customer.name || booking.customerName}</td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Customer ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">{customer.customerId || '-'}</td>
            </tr>

            {/* Row 2 */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Mobile No</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">{customer.mobile || booking.customerMobile}</td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Plot Number</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">#{plot.plotNumber} ({plot.plotSize} Sq Ft)</td>
            </tr>

            {/* Row 3 (Address takes full width) */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Address</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="p-2 font-bold text-slate-900">{customer.address || '-'}</td>
            </tr>

            {/* Row 3b: Plot Dimensions & Chaudhi (Boundaries) */}
            {(plot.dimensions?.north || plot.dimensions?.east || plot.boundaries?.north || plot.boundaries?.east) && (
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Dimensions / पैमाइश</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 font-mono text-[10px]">
                  <span>उत्तर: {plot.dimensions?.north || 0} ft | दक्षिण: {plot.dimensions?.south || 0} ft | पूरब: {plot.dimensions?.east || 0} ft | पश्चिम: {plot.dimensions?.west || 0} ft</span>
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>चौहद्दी / Bounds</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-medium text-slate-800 text-[10px]">
                  <span>उत्तर: {plot.boundaries?.north || '-'}, दक्षिण: {plot.boundaries?.south || '-'}, पूरब: {plot.boundaries?.east || '-'}, पश्चिम: {plot.boundaries?.west || '-'}</span>
                </td>
              </tr>
            )}

            {/* Numeric details row */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Plot Value</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900">₹{(booking.plotValue || 0).toLocaleString('en-IN')}</td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Net Payable</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900">₹{((booking.plotValue || 0) - (booking.discount || 0)).toLocaleString('en-IN')}</td>
            </tr>

            {/* Payment Type & Downpayment details */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Payment Type</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">
                {booking.scheme === 'FULL_PAYMENT' ? 'One Time' : 'EMI'}
              </td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Down Payment</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">
                {(() => {
                  const net = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
                  const dpInst = (installments || []).find(i => i.installmentNumber === 0);
                  const dp = booking.bookingAmount || dpInst?.dueAmount || Math.max(0, net - (booking.remainingAmount || 0));
                  return `₹${dp.toLocaleString('en-IN')}`;
                })()}
              </td>
            </tr>

            {/* Swapped: Remaining Balance (Left) & EMI Details (Right) */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Remaining Balance</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">
                {(() => {
                  const net = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
                  const dpInst = (installments || []).find(i => i.installmentNumber === 0);
                  const dp = booking.bookingAmount || dpInst?.dueAmount || Math.max(0, net - (booking.remainingAmount || 0));
                  const rem = Math.max(0, net - dp);
                  return `₹${rem.toLocaleString('en-IN')}`;
                })()}
              </td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>{booking.scheme === 'FULL_PAYMENT' ? 'Duration' : 'EMI Details'}</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">
                {booking.scheme === 'FULL_PAYMENT' ? (
                  `${booking.oneTimeMonths || 1} Month(s)`
                ) : (
                  (() => {
                    const regularInsts = (installments || []).filter(i => i.installmentNumber > 0);
                    const months = regularInsts.length || booking.installmentCount || 0;
                    const net = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
                    const dpInst = (installments || []).find(i => i.installmentNumber === 0);
                    const dp = booking.bookingAmount || dpInst?.dueAmount || 0;
                    const rem = Math.max(0, net - dp);
                    const standardEmiAmt = booking.installmentAmount || booking.emiAmount || regularInsts[0]?.dueAmount || (months > 0 ? Math.round(rem / months) : 0);
                    const lastEmiInst = regularInsts.length > 0 ? regularInsts[regularInsts.length - 1] : null;
                    const lastEmiAmt = lastEmiInst ? lastEmiInst.dueAmount : standardEmiAmt;
                    const isEmiUniform = standardEmiAmt === lastEmiAmt;
                    const regularEmiCount = regularInsts.length > 1 ? regularInsts.filter(i => i.dueAmount === standardEmiAmt).length : (months - (isEmiUniform ? 0 : 1));

                    if (isEmiUniform) {
                      return `${months} Month(s) @ ₹${standardEmiAmt.toLocaleString('en-IN')}/mo`;
                    } else {
                      return `${months} Month(s) (${regularEmiCount} @ ₹${standardEmiAmt.toLocaleString('en-IN')} + 1 @ ₹${lastEmiAmt.toLocaleString('en-IN')})`;
                    }
                  })()
                )}
              </td>
            </tr>

            {/* Row 8 (Net Payable Amount in Words) */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Amount in Words</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="p-2 font-bold text-slate-900">{numberToWords((booking.plotValue || 0) - (booking.discount || 0))}</td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Signatory area */}
        <div className="flex justify-end items-end pt-8 select-none">
          <div className="text-center w-48 pt-1 border-t border-slate-100">
            <strong className="text-slate-900 block text-xs">Authorized Signatory</strong>
          </div>
        </div>

        {/* Notice line */}
        <div className="mt-4 text-[9px] text-slate-500 font-bold italic select-none">
          * This certificate is a confirmation of booking slot allotment and is subject to the terms, conditions.
        </div>
      </div>
    </div>
  );
};

export default BookingCertificateViewer;
