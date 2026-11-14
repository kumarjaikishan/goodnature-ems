import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { Printer, ArrowLeft } from 'lucide-react';
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
  const [receipts, setReceipts] = useState([]);
  const [refundRatePercent, setRefundRatePercent] = useState(10.88);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/plots/bookings/${id}`),
      api.get(`/plots/bookings/${id}/installments`).catch(() => ({ data: { data: [] } })),
      api.get(`/plots/receipts/list?bookingId=${id}`).catch(() => ({ data: { data: [] } })),
      api.get('/plots/rate-config').catch(() => ({ data: { data: null } }))
    ])
      .then(([bookingRes, instRes, receiptsRes, rateConfigRes]) => {
        setBooking(bookingRes.data.data);
        setInstallments(instRes.data.data || []);
        setReceipts(receiptsRes.data?.data || []);
        if (rateConfigRes.data?.data?.interestRatePercent !== undefined) {
          setRefundRatePercent(Number(rateConfigRes.data.data.interestRatePercent));
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback for investment product booking
        api.get(`/plots/product-bookings/${id}`)
          .then((pRes) => {
            const pBooking = pRes.data?.data;
            setBooking(pBooking);
            setInstallments(pBooking?.installments || []);
            setReceipts(pBooking?.collections || []);
            api.get('/plots/rate-config')
              .then((rcRes) => {
                if (rcRes.data?.data?.interestRatePercent !== undefined) {
                  setRefundRatePercent(Number(rcRes.data.data.interestRatePercent));
                }
              })
              .catch(() => {})
              .finally(() => setLoading(false));
          })
          .catch((err) => {
            console.error('Failed to load agreement booking details:', err);
            toast.error('Failed to load agreement details');
            setLoading(false);
          });
      });
  }, [id]);

  // Dynamic Document Title for PDF Download filename: "[Customer Name] Agreement"
  useEffect(() => {
    if (booking) {
      const customer = booking.customerId || {};
      const custName = customer.name || booking.customerName || 'Customer';
      const originalTitle = document.title;
      document.title = `${custName} Agreement`;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [booking]);

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
        <button onClick={() => navigate('/dashboard/plots/reports')} className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold">Go Back</button>
      </div>
    );
  }

  const customer = booking.customerId || {};
  const dims = booking.dimensionsSnapshot || booking.productId?.dimensions || {};
  const plotAreaSize = Number(booking.plotId?.plotSize || booking.plotId?.area || booking.totalAreaSqFt || dims.totalAreaSqFt || booking.productId?.areaSqFt || 0);

  const firstLand = (booking.landSourcing && booking.landSourcing.length > 0) ? booking.landSourcing[0] : {};
  const allKhata = booking.landSourcing && booking.landSourcing.length > 0
    ? Array.from(new Set(booking.landSourcing.map((l) => l.khataNumber || l.agreementId?.khataNumber).filter(Boolean))).join(', ')
    : '';
  const allKhasra = booking.landSourcing && booking.landSourcing.length > 0
    ? Array.from(new Set(booking.landSourcing.map((l) => l.khesraNumber || l.agreementId?.khesraNumber).filter(Boolean))).join(', ')
    : '';
  const mauzaName = firstLand.mauja || firstLand.agreementId?.mauja || booking.mauza || 'Samsera';

  const plot = booking.plotId || {
    plotNumber: dims.dimensionLabel || booking.productId?.productCode || booking.productId?.productName || booking.planName || booking.bookingNumber || 'N/A',
    plotSize: plotAreaSize,
    area: plotAreaSize,
    areaSqFt: plotAreaSize,
    dimensions: dims,
    khataNo: allKhata || firstLand.khataNumber || firstLand.agreementId?.khataNumber || '56',
    khesraNo: allKhasra || firstLand.khesraNumber || firstLand.agreementId?.khesraNumber || '358',
    mauza: mauzaName,
    city: booking.projectId?.location?.city || 'Rajgir',
    district: booking.projectId?.location?.district || 'Nalanda',
    state: booking.projectId?.location?.state || 'Bihar',
  };

  const series = booking.plotId?.seriesId || {
    seriesName: booking.projectName || booking.projectId?.name || 'Nalanda New City',
    projectArea: '19.5 Acres Approx.',
    city: booking.projectId?.location?.city || 'Rajgir',
    district: booking.projectId?.location?.district || 'Nalanda',
    state: booking.projectId?.location?.state || 'Bihar',
    khataNo: plot.khataNo,
  };

  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };

  const netPlotValue = Math.max(0, Number(booking.plotValue || booking.totalAmount || 0) - Number(booking.discount || 0));
  const isFullPayment = booking.scheme === 'FULL_PAYMENT' || booking.paymentType === 'FULL_PAYMENT';
  const paidAmount = booking.totalPaid !== undefined
    ? Number(booking.totalPaid || 0)
    : Math.max(0, netPlotValue - Number(booking.remainingAmount || 0));
  const downpaymentInst = (installments || []).find(i => i.installmentNumber === 0);

  const downpaymentRequired = isFullPayment
    ? netPlotValue
    : (booking.downPayment || booking.downpaymentAmount || booking.bookingAmount || downpaymentInst?.dueAmount || (booking.downpaymentRate && plotAreaSize > 0 ? booking.downpaymentRate * plotAreaSize : Math.round(netPlotValue * 0.40)));
  const isDownpaymentCompleted = paidAmount >= (downpaymentRequired - 1);

  // Determine the effective date: use explicit agreementDate if set, or when downpayment was completed
  let completionDate = null;
  if (booking.agreementDate) {
    completionDate = new Date(booking.agreementDate);
  } else {
    const approvedReceipts = (receipts || [])
      .filter(r => (r.status || 'APPROVED').toUpperCase() !== 'REJECTED')
      .sort((a, b) => new Date(a.paymentDate || a.createdAt) - new Date(b.paymentDate || b.createdAt));

    let cumPaid = 0;
    for (const rc of approvedReceipts) {
      cumPaid += Number(rc.amount || 0);
      if (cumPaid >= (downpaymentRequired - 1)) {
        completionDate = new Date(rc.paymentDate || rc.createdAt);
        break;
      }
    }

    // Fallback to downpayment installment paidDate, or last approved receipt, or booking date
    if (!completionDate) {
      if (downpaymentInst && downpaymentInst.paidDate) {
        completionDate = new Date(downpaymentInst.paidDate);
      } else if (approvedReceipts.length > 0) {
        const lastRc = approvedReceipts[approvedReceipts.length - 1];
        completionDate = new Date(lastRc.paymentDate || lastRc.createdAt);
      } else {
        completionDate = new Date(booking.bookingDate || booking.createdAt);
      }
    }
  }

  const dayNum = completionDate.getDate();
  const monthName = completionDate.toLocaleDateString('en-IN', { month: 'long' });
  const yearNum = completionDate.getFullYear();
  const formattedDate = `${getOrdinal(dayNum)} Day of ${monthName} ${yearNum}`;

  if (!isDownpaymentCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white border border-amber-200 shadow-xl rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-slate-800">Agreement Locked</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The legal plot agreement for Booking <strong className="font-mono text-slate-900">#{booking.bookingNumber}</strong> (Plot <strong className="text-slate-900">#{plot.plotNumber}</strong>) can only be generated and printed <strong className="text-emerald-700">after the downpayment is fully completed</strong>.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Scheme:</span>
              <span className="font-bold text-slate-800">{isFullPayment ? 'One Time (Full Payment)' : 'EMI (Monthly Installment)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Downpayment Required:</span>
              <span className="font-bold text-amber-700">₹{downpaymentRequired.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid So Far:</span>
              <span className="font-bold text-slate-800">₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Pending Downpayment:</span>
              <span className="font-bold text-rose-600">₹{Math.max(0, downpaymentRequired - paidAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => navigate(booking.paymentType ? `/dashboard/plots/collections/products/add?bookingId=${booking._id}` : `/dashboard/plots/collections/downpayment/add?bookingId=${booking._id}`)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              Collect Downpayment
            </button>
          </div>
        </div>
      </div>
    );
  }

  const customerName = customer.name || booking.customerName || 'Allottee';

  const downpaymentAmount = downpaymentRequired;
  const remainingBalanceAmount = Math.max(0, netPlotValue - downpaymentAmount);

  const regularInsts = (installments || []).filter(i => i.installmentNumber > 0);
  const installmentCount = isFullPayment ? 0 : (regularInsts.length || booking.installmentCount || booking.tenureMonths || 0);
  const standardEmiAmt = isFullPayment ? 0 : (booking.monthlyEmi || booking.installmentAmount || booking.emiAmount || regularInsts[0]?.dueAmount || (installmentCount > 0 ? Math.round(remainingBalanceAmount / installmentCount) : 0));
  const lastEmiInst = regularInsts.length > 0 ? regularInsts[regularInsts.length - 1] : null;
  const lastEmiAmt = lastEmiInst ? (lastEmiInst.dueAmount || lastEmiInst.principalDue) : standardEmiAmt;
  const isEmiUniform = standardEmiAmt === lastEmiAmt;
  const regularEmiCount = regularInsts.length > 1 ? regularInsts.filter(i => (i.dueAmount || i.principalDue) === standardEmiAmt).length : (installmentCount - (isEmiUniform ? 0 : 1));

  const dailyLateFineRate = 0.0005; // 0.05% per day
  const dailyLateFineAmt = standardEmiAmt * dailyLateFineRate;

  const adaptedBooking = {
    ...booking,
    scheme: isFullPayment ? 'FULL_PAYMENT' : 'INSTALLMENT',
    paymentMode: booking.collections?.[0]?.paymentMode || booking.paymentMode || 'WIRE TRANSFER / CHEQUE / DD',
    agreementNumber: booking.agreementNumber || booking.bookingNumber,
    plotNumber: plot.plotNumber,
    plotAreaSqFt: plot.plotSize,
    landSourcing: booking.landSourcing || [],
  };

  const sharedProps = {
    booking: adaptedBooking,
    customer,
    plot,
    series,
    formattedDate,
    completionDate,
    installments,
    netPlotValue,
    customerName,
    downpaymentAmount,
    downpaymentRequired,
    paidAmount,
    remainingBalanceAmount,
    installmentCount,
    standardEmiAmt,
    lastEmiAmt,
    isEmiUniform,
    regularEmiCount,
    dailyLateFineAmt,
    refundRatePercent,
    numberToWords
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print:min-h-0 print:h-auto print:block">

      {/* Dynamic A4 Print Styles & Paginated Screen View */}
      <style>{`
        @media screen {
          .agreement-print-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .agreement-page {
            width: 210mm;
            min-height: 297mm;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
            background: white;
            padding: 10mm 14mm 10mm 14mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          html, body, #root {
            background: white !important;
            color: black !important;
            font-family: Arial, 'Segoe UI', Inter, sans-serif !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
          }

          div {
            max-height: none !important;
          }

          .no-print, nav, header, aside, .navbar, .sidebar {
            display: none !important;
          }

          .agreement-print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          .agreement-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm 14mm 8mm 14mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }

          .agreement-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden on Print) */}
      <div className="w-full max-w-[210mm] flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition cursor-pointer shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer border-none"
        >
          <Printer size={16} /> Print / Save PDF ({customerName} Agreement)
        </button>
      </div>

      {/* Agreement Printable Container */}
      <div className="agreement-print-container w-full">
        <PlotAgreementEnglish {...sharedProps} />
      </div>

      {/* Bottom Action Bar (Hidden on Print) */}
      <div className="w-full max-w-[210mm] flex items-center justify-center gap-4 mt-8 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer border-none"
        >
          <Printer size={16} /> Print / Save PDF ({customerName} Agreement)
        </button>
      </div>
    </div>
  );
};

export default PlotAgreementViewer;
