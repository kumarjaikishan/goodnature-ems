import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import ReceiptPrintWrapper from './components/ReceiptPrintWrapper';

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

  const { company: adminCompany } = useSelector((state) => state.user || {});
  const { companysetting: empCompany } = useSelector((state) => state.employee || {});
  const company = adminCompany || empCompany || {};
  const companyName = company?.name || company?.companyName || 'GOODFEEL';
  const companyAddress = company?.address || 'At- Nala Road, Bihar sharif, Nalanda, Bihar';

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. Try standard plot booking first
    api.get(`/plots/bookings/${id}`)
      .then(async (bookingRes) => {
        const bData = bookingRes.data?.data;
        let instList = [];
        try {
          const instRes = await api.get(`/plots/bookings/${id}/installments`);
          instList = instRes.data?.data || [];
        } catch {
          instList = bData?.installments || [];
        }
        setBooking({ ...bData, isProductBooking: false });
        setInstallments(instList);
        setLoading(false);
      })
      .catch(() => {
        // 2. Fallback to plot product booking
        api.get(`/plots/product-bookings/${id}`)
          .then((prdRes) => {
            const prdData = prdRes.data?.data;
            setBooking({ ...prdData, isProductBooking: true });
            setInstallments(prdData?.installments || []);
            setLoading(false);
          })
          .catch(() => {
            toast.error('Failed to load booking certificate details');
            setLoading(false);
          });
      });
  }, [id]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center text-slate-500">
        Booking certificate not found.{' '}
        <button
          onClick={() => navigate('/dashboard/plots/products')}
          className="text-emerald-600 underline font-bold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isProductBooking = Boolean(booking.isProductBooking || booking.productId);

  // ─────────────────────────────────────────────────────────────
  // 1. PLOT PRODUCT BOOKING CERTIFICATE / SALE RECEIPT
  // ─────────────────────────────────────────────────────────────
  if (isProductBooking) {
    const customer = booking.customerId || {};
    const product = booking.productId || {};
    const dims = booking.dimensionsSnapshot || product.dimensions || {};
    const landSourcing = booking.landSourcing || [];
    const plot = booking.plotId || {};

    const qty = booking.quantity || 1;
    const unitPrice = Number(booking.unitPrice || product.unitPrice || 0);
    const totalValuation = Number(booking.totalAmount || (qty * unitPrice) || 0);
    const isFullPayment = booking.paymentType === 'FULL_PAYMENT';
    const downPayment = Number(booking.downPayment || (isFullPayment ? totalValuation : 0));
    const remainingBalance = Math.max(0, totalValuation - downPayment);
    const tenureMonths = booking.tenureMonths || 24;
    const monthlyEmi = Number(booking.monthlyEmi || (isFullPayment ? 0 : Math.round(remainingBalance / tenureMonths)));
    const rawBDate = booking.bookingDate || booking.createdAt;
    let bookingDateTimeStr = '-';
    let bookingDateFormatted = '-';
    if (rawBDate) {
      const bDateObj = new Date(rawBDate);
      bookingDateFormatted = bDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeSource = booking.createdAt ? new Date(booking.createdAt) : bDateObj;
      const timePart = timeSource.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      bookingDateTimeStr = `${bookingDateFormatted}, ${timePart}`;
    }

    const lengthFt = Number(dims.northSouth || dims.north || dims.south || 1);
    const widthFt = Number(dims.eastWest || dims.east || dims.west || 1);
    const calculatedUnitArea = lengthFt * widthFt;
    const unitArea = Number(product.areaSqFt || calculatedUnitArea || 1);
    const totalArea = Number(booking.totalAreaSqFt || dims.totalAreaSqFt || (unitArea * qty) || 0);

    const maujaList =
      Array.from(new Set(landSourcing.map((s) => s.mauja || s.agreementId?.mauja).filter(Boolean))).join(', ') ||
      plot.mauja ||
      '-';
    const thanaList =
      Array.from(new Set(landSourcing.map((s) => s.thanaNumber || s.agreementId?.thanaNumber).filter(Boolean))).join(', ') ||
      '-';
    const khataList =
      Array.from(new Set(landSourcing.map((s) => s.khataNumber || s.agreementId?.khataNumber).filter(Boolean))).join(', ') ||
      plot.khataNo ||
      '-';
    const khesraList =
      Array.from(new Set(landSourcing.map((s) => s.khesraNumber || s.agreementId?.khesraNumber).filter(Boolean))).join(', ') ||
      plot.plotNumber ||
      '-';

    return (
      <ReceiptPrintWrapper onPrint={handlePrint} onBack={() => navigate(-1)}>
        {/* Background Logo Watermark (Black & White / Grayscale) */}
        {company?.logo ? (
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 print:hidden">
            <img
              src={cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 })}
              alt="Watermark Logo"
              className="w-72 h-72 object-contain grayscale opacity-[0.06] filter contrast-200"
            />
          </div>
        ) : null}

        {/* Booking Receipt Title */}
        <div className="text-center mb-1.5 select-none relative z-10 print:mb-1">
          <span className="px-2 py-0.5 text-slate-900 text-xs md:text-sm font-black uppercase tracking-wider rounded-sm print:text-[11px]">
            BOOKING RECEIPT
          </span>
        </div>

        {/* Details Table: Name: Value Format with Specified Widths & Subtle Lines */}
        <table className="w-full border border-slate-200 print:border-none text-[10.5px] print:text-[9.5px] font-semibold mb-1.5 select-none border-collapse relative z-10 leading-tight print:mb-1">
          <tbody>
            {/* Row 1: Booking ID | Booking Date/Time */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-black text-slate-900 w-[32%] font-mono">{booking.bookingNumber}</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking Date/Time</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{bookingDateTimeStr}</td>
            </tr>

            {/* Row 2: Customer ID | Plot / Unit Number */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Customer ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{customer.customerCode || customer.customerId || '-'}</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Plot Number</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{plot.plotNumber || booking.plotNumber || (booking.quantity ? `${booking.quantity} Unit(s)` : '-')}</td>
            </tr>

            {/* Row 3: Customer Name | Guardian / Father */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Customer Name</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-black text-slate-900 w-[32%] uppercase">{customer.name || booking.customerName || '-'}</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Guardian / Father</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
                {customer.fatherOrHusbandName ? `${customer.relationType || 'Son of'} ${customer.fatherOrHusbandName}` : (customer.guardianName || '-')}
              </td>
            </tr>

            {/* Row 4: Address | Mobile No */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Address</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] truncate max-w-[200px]">{customer.currentAddress || customer.address || booking.customerAddress || '-'}</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Mobile No</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{customer.mobile || booking.customerMobile || '-'}</td>
            </tr>

            {/* Row 5: Plot Area | Mauja / थाना */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Plot Area</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">{totalArea.toLocaleString('en-IN')} Sq Ft</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Mauja / थाना</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] uppercase truncate max-w-[200px]">{maujaList}{thanaList && thanaList !== '-' ? ` (THANA: ${thanaList})` : ''}</td>
            </tr>

            {/* Row 6: Khata | Khesra No */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Khata</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{khataList}</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Khesra No</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{khesraList}</td>
            </tr>

            {/* Row 7: Dimensions / पैमाइश */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Dimensions / पैमाइश</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 font-mono text-[9.5px] print:text-[8.5px]">
                {lengthFt > 0 && widthFt > 0
                  ? `उत्तर: ${dims.north ?? lengthFt} ft | दक्षिण: ${dims.south ?? lengthFt} ft | पूरब: ${dims.east ?? widthFt} ft | पश्चिम: ${dims.west ?? widthFt} ft`
                  : product.dimensionLabel || '-'}
              </td>
            </tr>

            {/* Row 8: Booked Rate | Gross Plot Value */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booked Rate</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
                {totalArea > 0 ? `₹${Math.round(totalValuation / totalArea).toLocaleString('en-IN')} / Sq Ft` : `₹${unitPrice.toLocaleString('en-IN')} / unit`}
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Gross Plot Value</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-black text-slate-900 w-[32%]">₹{totalValuation.toLocaleString('en-IN')}</td>
            </tr>

            {/* Row 9: Total Discount | Net Payable Amount */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Total Discount</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-emerald-700 w-[32%]">₹0</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Net Payable Amount</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 w-[32%]">
                <span className="font-black text-slate-900 text-[11px] print:text-[10px]">
                  ₹{totalValuation.toLocaleString('en-IN')}
                </span>
                <span className="text-[8.5px] print:text-[7.5px] text-slate-500 font-sans font-normal block capitalize truncate max-w-[220px]">
                  ({numberToWords(totalValuation)})
                </span>
              </td>
            </tr>

            {/* Row 10: Down Payment (D.P) | EMI Payment */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>{isFullPayment ? 'Upfront Paid' : 'Down Payment (D.P)'}</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
                ₹{downPayment.toLocaleString('en-IN')}
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>EMI Payment</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
                ₹{remainingBalance.toLocaleString('en-IN')}
              </td>
            </tr>

            {/* Row 11: D.P End Due Date/Duration | EMI End Due DateDuration */}
            <tr>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>D.P End Due Date/Duration</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-amber-800 w-[32%]">{isFullPayment ? 'One-Time Full Paid' : bookingDateFormatted}</td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>EMI End Due DateDuration</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
                {isFullPayment ? `${tenureMonths} Months Lock-in` : (monthlyEmi > 0 ? `₹${monthlyEmi.toLocaleString('en-IN')} / mo (${tenureMonths} Mos)` : '-')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Signatory area & Notice notes in Side-by-Side Flex Layout */}
        <div className="flex justify-between items-end pt-2 select-none print:pt-1">
          {/* Left: Notice line */}
          <div className="text-[9px] print:text-[8px] text-slate-500 font-semibold italic max-w-[65%] leading-tight">
            * This receipt is an official confirmation of booking slot allotment and is subject to the terms and conditions.
          </div>

          {/* Right: Authorized Signatory */}
          <div className="text-center w-36 pt-1 border-t border-slate-700 shrink-0 signatory-line">
            <strong className="text-slate-900 block text-[10.5px] print:text-[9.5px]">Authorized Signatory</strong>
          </div>
        </div>
      </ReceiptPrintWrapper>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. REGULAR PLOT BOOKING CERTIFICATE / RECEIPT
  // ─────────────────────────────────────────────────────────────
  const customer = booking.customerId || {};
  const plot = booking.plotId || {};

  // 1. Booking Date / Time
  const rawBDate = booking.bookingDate || booking.createdAt;
  let bookingDateTimeStr = '-';
  if (rawBDate) {
    const bDateObj = new Date(rawBDate);
    const datePart = bDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeSource = booking.createdAt ? new Date(booking.createdAt) : bDateObj;
    const timePart = timeSource.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    bookingDateTimeStr = `${datePart}, ${timePart}`;
  }

  // 2. Land details
  const sourcing = booking.landSourcing || [];
  const khataList = Array.from(new Set(sourcing.map(s => s.khataNumber || s.agreementId?.khataNumber).filter(Boolean))).join(', ') || plot.khataNo || '-';
  const khesraList = Array.from(new Set(sourcing.map(s => s.khesraNumber || s.agreementId?.khesraNumber).filter(Boolean))).join(', ') || plot.plotNumber || '-';
  const maujaList = Array.from(new Set(sourcing.map(s => s.mauja || s.agreementId?.mauja).filter(Boolean))).join(', ') || plot.mauja || '-';
  const thanaList = Array.from(new Set(sourcing.map(s => s.thanaNumber || s.agreementId?.thanaNumber).filter(Boolean))).join(', ') || '-';
  const maujaThanaDisplay = `${maujaList}${thanaList && thanaList !== '-' ? ` (THANA: ${thanaList})` : ''}`;

  // 3. Dimensions
  let dimensionsDisplay = '-';
  if (typeof plot.dimensions === 'object' && plot.dimensions !== null) {
    dimensionsDisplay = `उत्तर: ${plot.dimensions?.north || 0} ft | दक्षिण: ${plot.dimensions?.south || 0} ft | पूरब: ${plot.dimensions?.east || 0} ft | पश्चिम: ${plot.dimensions?.west || 0} ft`;
  } else if (typeof plot.dimensions === 'string' && plot.dimensions.trim()) {
    dimensionsDisplay = plot.dimensions;
  }

  // 4. Financials
  const manualDisc = Number(booking.discount || 0);
  const tenureDisc = booking.emiTenureAdjustmentAction === 'DEDUCT' ? Number(booking.emiTenureAdjustmentAmount || 0) : 0;
  const tenureMarkup = booking.emiTenureAdjustmentAction === 'ADD' ? Number(booking.emiTenureAdjustmentAmount || 0) : 0;
  const totalCombinedDisc = manualDisc + tenureDisc;
  const baseGrossPlotVal = Number(booking.plotValue || 0) + tenureDisc - tenureMarkup;
  const grossPlotValDisplay = baseGrossPlotVal > 0 ? baseGrossPlotVal : Number(booking.plotValue || 0);
  const netPayable = Math.max(0, Number(booking.plotValue || 0) - manualDisc);
  const bookedRateVal = Number(booking.effectivePlotRate || booking.basePlotRate || (plot.plotSize ? (booking.plotValue || 0) / plot.plotSize : 0));

  // 5. Down payment
  const dpInst = (installments || []).find(i => i.installmentNumber === 0);
  const dpAmount = Number(booking.bookingAmount || booking.downpaymentAmount || dpInst?.dueAmount || 0);
  let dpDueDateStr = '-';
  if (dpInst?.dueDate) {
    dpDueDateStr = new Date(dpInst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } else if (booking.downpaymentDays) {
    const bDate = new Date(booking.bookingDate || booking.createdAt);
    bDate.setDate(bDate.getDate() + Number(booking.downpaymentDays));
    dpDueDateStr = bDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  const dpDurationStr = booking.downpaymentDays ? `${booking.downpaymentDays} Days` : '';
  const dpEndDueDisplay = dpDueDateStr !== '-' && dpDurationStr
    ? `${dpDueDateStr} (${dpDurationStr})`
    : (dpDueDateStr !== '-' ? dpDueDateStr : (dpDurationStr || '-'));

  // 6. EMI Payment and End Date / Duration
  const net = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
  const dpPaidOrDue = booking.bookingAmount || dpInst?.dueAmount || booking.downpaymentAmount || Math.max(0, net - (booking.remainingAmount || 0));
  const remEmiAmount = Math.max(0, net - dpPaidOrDue);

  let emiEndDueDisplay = '-';
  if (booking.scheme === 'FULL_PAYMENT') {
    emiEndDueDisplay = `${booking.oneTimeMonths || 1} Month(s)`;
  } else {
    const regularInsts = (installments || []).filter(i => i.installmentNumber > 0);
    const months = regularInsts.length || booking.installmentCount || booking.tenureMonths || 0;
    const lastInst = regularInsts[regularInsts.length - 1];
    let lastDueDateStr = '';
    if (lastInst?.dueDate) {
      lastDueDateStr = new Date(lastInst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (lastDueDateStr && months > 0) {
      emiEndDueDisplay = `${lastDueDateStr} (${months} Months)`;
    } else if (lastDueDateStr) {
      emiEndDueDisplay = lastDueDateStr;
    } else if (months > 0) {
      emiEndDueDisplay = `${months} Month(s)`;
    }
  }

  return (
    <ReceiptPrintWrapper onPrint={handlePrint} onBack={() => navigate(-1)}>
      {/* Background Logo Watermark (Black & White / Grayscale) */}
      {company?.logo ? (
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 print:hidden">
          <img
            src={cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 })}
            alt="Watermark Logo"
            className="w-72 h-72 object-contain grayscale opacity-[0.06] filter contrast-200"
          />
        </div>
      ) : null}

      {/* Booking Receipt Title */}
      <div className="text-center mb-1.5 select-none relative z-10 print:mb-1">
        <span className="px-2 py-0.5 text-slate-900 text-xs md:text-sm font-black uppercase tracking-wider rounded-sm print:text-[11px]">
          BOOKING RECEIPT
        </span>
      </div>

      {/* Details Table: Name: Value Format with Specified Widths & Subtle Lines */}
      <table className="w-full border border-slate-200 print:border-none text-[10.5px] print:text-[9.5px] font-semibold mb-1.5 select-none border-collapse relative z-10 leading-tight print:mb-1">
        <tbody>
          {/* Row 1: Booking ID | Booking Date/Time */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Booking ID</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-black text-slate-900 w-[32%] font-mono">{booking.bookingNumber}</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Booking Date/Time</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{bookingDateTimeStr}</td>
          </tr>

          {/* Row 2: Customer ID | Plot Number */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Customer ID</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{customer.customerId || '-'}</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Plot Number</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{plot.plotNumber || booking.plotNumber || '-'}</td>
          </tr>

          {/* Row 3: Customer Name | Guardian / Father */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Customer Name</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-black text-slate-900 w-[32%] uppercase">{customer.name || booking.customerName || '-'}</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Guardian / Father</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
              {customer.fatherOrHusbandName ? `${customer.relationType || 'Son of'} ${customer.fatherOrHusbandName}` : (customer.guardianName || '-')}
            </td>
          </tr>

          {/* Row 4: Address | Mobile No */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Address</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] truncate max-w-[200px]">{customer.address || booking.customerAddress || '-'}</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Mobile No</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{customer.mobile || booking.customerMobile || '-'}</td>
          </tr>

          {/* Row 5: Plot Area | Mauja / थाना */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Plot Area</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">{plot.plotSize || booking.plotArea || 0} Sq Ft</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Mauja / थाना</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] uppercase truncate max-w-[200px]">{maujaThanaDisplay}</td>
          </tr>

          {/* Row 6: Khata | Khesra No */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Khata</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{khataList}</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Khesra No</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">{khesraList}</td>
          </tr>

          {/* Row 7: Dimensions / पैमाइश */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Dimensions / पैमाइश</span>
                <span>:</span>
              </div>
            </td>
            <td colSpan={3} className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 font-mono text-[9.5px] print:text-[8.5px]">
              {dimensionsDisplay}
            </td>
          </tr>

          {/* Row 8: Booked Rate | Gross Plot Value */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Booked Rate</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">₹{bookedRateVal.toLocaleString('en-IN')} / Sq Ft</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Gross Plot Value</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-black text-slate-900 w-[32%]">₹{grossPlotValDisplay.toLocaleString('en-IN')}</td>
          </tr>

          {/* Row 9: Total Discount | Net Payable Amount */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Total Discount</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-emerald-700 w-[32%]">
              <div>
                <span>₹{totalCombinedDisc.toLocaleString('en-IN')}</span>
                {tenureDisc > 0 && manualDisc > 0 ? (
                  <span className="text-[7.5px] text-slate-500 font-normal ml-1">
                    (₹{tenureDisc.toLocaleString('en-IN')} + ₹{manualDisc.toLocaleString('en-IN')})
                  </span>
                ) : null}
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Net Payable Amount</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 w-[32%]">
              <span className="font-black text-slate-900 text-[11px] print:text-[10px]">
                ₹{netPayable.toLocaleString('en-IN')}
              </span>
              <span className="text-[8.5px] print:text-[7.5px] text-slate-500 font-sans font-normal block capitalize truncate max-w-[220px]">
                ({numberToWords(netPayable)})
              </span>
            </td>
          </tr>

          {/* Row 10: Down Payment (D.P) | EMI Payment */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Down Payment (D.P)</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
              ₹{dpAmount.toLocaleString('en-IN')}
              {booking.downpaymentDays ? (
                <span className="text-[8px] text-slate-500 font-normal ml-1">({booking.downpaymentDays} Days)</span>
              ) : null}
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>EMI Payment</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">
              ₹{remEmiAmount.toLocaleString('en-IN')}
            </td>
          </tr>

          {/* Row 11: D.P End Due Date/Duration | EMI End Due DateDuration */}
          <tr>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>D.P End Due Date/Duration</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-amber-800 w-[32%]">{dpEndDueDisplay}</td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>EMI End Due DateDuration</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1 px-2.5 print:py-[2px] print:px-2 font-bold text-slate-900 w-[32%]">{emiEndDueDisplay}</td>
          </tr>
        </tbody>
      </table>

      {/* Bottom Signatory area & Notice notes in Side-by-Side Flex Layout */}
      <div className="flex justify-between items-end pt-2 select-none print:pt-1">
        {/* Left: Notice line */}
        <div className="text-[9px] print:text-[8px] text-slate-500 font-semibold italic max-w-[65%] leading-tight">
          * This receipt is an official confirmation of booking slot allotment and is subject to the terms and conditions.
        </div>

        {/* Right: Authorized Signatory */}
        <div className="text-center w-36 pt-1 border-t border-slate-700 shrink-0 signatory-line">
          <strong className="text-slate-900 block text-[10.5px] print:text-[9.5px]">Authorized Signatory</strong>
        </div>
      </div>
    </ReceiptPrintWrapper>
  );
};

export default BookingCertificateViewer;
