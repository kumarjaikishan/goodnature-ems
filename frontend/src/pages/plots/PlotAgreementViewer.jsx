import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { HiOutlinePrinter, HiOutlineArrowLeft, HiOutlineLanguage } from 'react-icons/hi2';
import PlotAgreementHindi from './PlotAgreementHindi';
import PlotAgreementEnglish from './PlotAgreementEnglish';

const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero Rupees Only';
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
  return words ? `${words} Rupees Only` : 'Zero Rupees Only';
};

const PlotAgreementViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('hi'); // Default Hindi ('hi'), switcher for English ('en')

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/plots/bookings/${id}`),
      api.get(`/plots/bookings/${id}/installments`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([bookingRes, instRes]) => {
        setBooking(bookingRes.data.data);
        setInstallments(instRes.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load agreement booking details:', err);
        toast.error('Failed to load agreement details');
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-4">
        <p className="text-sm font-bold text-slate-500">Booking details not found or permission denied.</p>
        <button onClick={() => navigate('/plot-reports')} className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold">Go Back</button>
      </div>
    );
  }

  const customer = booking.customerId || {};
  const plot = booking.plotId || {};
  const series = plot.seriesId || {};

  const bookingDate = new Date(booking.bookingDate || booking.createdAt);
  const formattedDate = bookingDate.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const netPlotValue = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
  const customerName = customer.name || booking.customerName || 'Allottee';

  const downpaymentInst = (installments || []).find(i => i.installmentNumber === 0);
  const downpaymentAmount = booking.bookingAmount || downpaymentInst?.dueAmount || Math.max(0, netPlotValue - (booking.remainingAmount || 0));
  const remainingBalanceAmount = Math.max(0, netPlotValue - downpaymentAmount);

  const regularInsts = (installments || []).filter(i => i.installmentNumber > 0);
  const installmentCount = regularInsts.length || booking.installmentCount || 100;
  const standardEmiAmt = booking.installmentAmount || booking.emiAmount || regularInsts[0]?.dueAmount || (installmentCount > 0 ? Math.round(remainingBalanceAmount / installmentCount) : 0);
  const lastEmiInst = regularInsts.length > 0 ? regularInsts[regularInsts.length - 1] : null;
  const lastEmiAmt = lastEmiInst ? lastEmiInst.dueAmount : standardEmiAmt;
  const isEmiUniform = standardEmiAmt === lastEmiAmt;
  const regularEmiCount = regularInsts.length > 1 ? regularInsts.filter(i => i.dueAmount === standardEmiAmt).length : (installmentCount - (isEmiUniform ? 0 : 1));

  const dailyLateFineRate = 0.0005; // 0.05% per day
  const dailyLateFineAmt = standardEmiAmt * dailyLateFineRate;

  const sharedProps = {
    booking,
    customer,
    plot,
    series,
    formattedDate,
    netPlotValue,
    customerName,
    downpaymentAmount,
    remainingBalanceAmount,
    installmentCount,
    standardEmiAmt,
    lastEmiAmt,
    isEmiUniform,
    regularEmiCount,
    dailyLateFineAmt,
    numberToWords
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white">

      {/* Strict A4 Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body, .agreement-page {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            font-family: Arial, 'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
          .agreement-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 10mm 14mm 10mm 14mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
          .agreement-page:last-child {
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden on Print) */}
      <div className="w-full max-w-[210mm] flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          {/* Language Selector Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setLang('hi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                lang === 'hi'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <HiOutlineLanguage className="w-3.5 h-3.5" /> हिंदी / Hinglish
            </button>
            <button
              onClick={() => setLang('en')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <HiOutlineLanguage className="w-3.5 h-3.5" /> English
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer border-none"
          >
            <HiOutlinePrinter className="w-4 h-4" /> Print ({lang === 'hi' ? 'हिंदी' : 'English'})
          </button>
        </div>
      </div>

      {/* Agreement Printable Container */}
      <div className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl rounded-none print:shadow-none print:w-full text-xs leading-relaxed font-sans">
        {lang === 'hi' ? (
          <PlotAgreementHindi {...sharedProps} />
        ) : (
          <PlotAgreementEnglish {...sharedProps} />
        )}
      </div>

      {/* Bottom Action Bar (Hidden on Print) */}
      <div className="w-full max-w-[210mm] flex items-center justify-center gap-4 mt-8 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer border-none"
        >
          <HiOutlinePrinter className="w-4 h-4" /> Print Agreement ({lang === 'hi' ? 'हिंदी' : 'English'})
        </button>
      </div>
    </div>
  );
};

export default PlotAgreementViewer;
