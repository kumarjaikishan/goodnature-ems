import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { Printer, ArrowLeft } from 'lucide-react';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

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
    const bookingDateFormatted = new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

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

        {/* Printable Certificate Paper */}
        <div className="w-full max-w-4xl bg-white text-slate-900 p-6 sm:p-7 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print-half-a4">
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

          {/* Background Logo Watermark */}
          {company?.logo ? (
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
              <img
                src={cloudinaryUrl(company.logo, { format: 'webp', width: 400, height: 400 })}
                alt="Watermark Logo"
                className="w-72 h-72 object-contain grayscale opacity-[0.06] filter contrast-200"
              />
            </div>
          ) : null}

          {/* Company Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {company?.logo ? (
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden rounded-md">
                    <img
                      src={cloudinaryUrl(company.logo, { format: 'webp', width: 120, height: 120 })}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : null}
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-tight">
                    {companyName}
                  </h1>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
                <p>{companyAddress}</p>
              </div>
            </div>


          </div>

          {/* Certificate Title */}
          <div className="text-center mb-3 select-none relative z-10">
            <span className="px-4 py-1 text-slate-900 text-[1rem] font-black uppercase tracking-wider rounded-sm inline-block border-b-2 border-slate-900">
              {isFullPayment ? 'PLOT ALLOTMENT CERTIFICATE' : 'CERTIFICATE OF PLOT ALLOTMENT'}
            </span>
          </div>

          {/* Details Table: Name: Value Format */}
          <table className="w-full border border-slate-200 text-[11px] font-semibold mb-3 select-none border-collapse relative z-10">
            <tbody>
              {/* Row 1: Booking ID and Booking Date */}
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
                <td className="p-2 font-bold text-slate-900 w-[32%]">{bookingDateFormatted}</td>
              </tr>

              {/* Row 2: Customer Name and ID */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Customer Name</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-black text-slate-900">{customer.name || '-'}</td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Customer ID</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 font-mono">
                  {customer.customerCode || customer.customerId || '-'}
                </td>
              </tr>

              {/* Row 3: Mobile & Guardian */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Mobile No</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">{customer.mobile || '-'}</td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Guardian / Father</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {customer.fatherOrHusbandName ? `${customer.relationType || 'S/o'} ${customer.fatherOrHusbandName}` : '-'}
                </td>
              </tr>

              {/* Row 4: Address */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Address</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 font-bold text-slate-900">
                  {customer.currentAddress || customer.address || '-'}
                </td>
              </tr>

              {/* Row 5: Booking Status */}
              <tr className="border-b border-slate-100 bg-slate-50/20">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Booking Status</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 font-bold text-slate-900 uppercase">
                  OK
                </td>
              </tr>

              {/* Row 6: Mauja & Thana */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Mauja / मौजा</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 uppercase">
                  {maujaList}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Thana No. / थाना</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {thanaList}
                </td>
              </tr>

              {/* Row 7: Khata & Khesra */}
              <tr className="border-b border-slate-100 bg-slate-50/20">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Khata No. / खाता</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 font-mono">
                  {khataList}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Khesra No. / खेसरा</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 font-mono">
                  {khesraList}
                </td>
              </tr>

              {/* Row 8: Total Area & Dimensions */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium w-[18%]">
                  <div className="flex justify-between items-center">
                    <span>Total Area / कुल रकबा</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 font-bold text-slate-900">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="font-black text-teal-900 text-xs font-mono">
                      {totalArea.toLocaleString('en-IN')} Sq.Ft
                    </span>
                    {(lengthFt > 0 && widthFt > 0) ? (
                      <span className="font-bold text-slate-700 font-mono text-xs">
                        ({lengthFt}ft x {widthFt} ft)
                      </span>
                    ) : product.dimensionLabel ? (
                      <span className="font-bold text-slate-700 font-mono text-xs">
                        ({product.dimensionLabel})
                      </span>
                    ) : null}
                  </div>
                  {(dims.north || dims.northSouth) && (
                    <span className="text-[10px] text-slate-500 block font-sans font-normal mt-0.5">
                      North: {dims.north ?? dims.northSouth} ft | South: {dims.south ?? dims.northSouth} ft | East: {dims.east ?? dims.eastWest} ft | West: {dims.west ?? dims.eastWest} ft
                    </span>
                  )}
                </td>
              </tr>

              {/* Row 9: Total Valuation & Payment Scheme */}
              <tr className="border-b border-slate-100 bg-slate-50/20">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Total Valuation</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2">
                  <span className="font-black text-slate-900 text-xs">
                    ₹{totalValuation.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans font-normal block mt-0.5 capitalize">
                    ({numberToWords(totalValuation)})
                  </span>
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Payment Scheme</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {isFullPayment ? 'One Time Payment' : 'Monthly Installment (EMI)'}
                </td>
              </tr>

              {/* Row 10: Payment Details / Settlement */}
              {isFullPayment ? (
                <tr className="border-b border-slate-100">
                  <td className="p-2 text-slate-500 font-medium">
                    <div className="flex justify-between items-center">
                      <span>Upfront Paid</span>
                      <span>:</span>
                    </div>
                  </td>
                  <td className="p-2 font-bold text-slate-900">
                    ₹{totalValuation.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2 text-slate-500 font-medium">
                    <div className="flex justify-between items-center">
                      <span>Payment Status</span>
                      <span>:</span>
                    </div>
                  </td>
                  <td className="p-2 font-bold text-emerald-700">
                    FULLY PAID
                  </td>
                </tr>
              ) : (
                <>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>Downpayment Paid</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      ₹{downPayment.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>EMI Payment</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      ₹{remainingBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/20">
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>EMI Tenure & Monthly</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td colSpan={3} className="p-2 font-bold text-slate-900">
                      ₹{monthlyEmi.toLocaleString('en-IN')} / month for {tenureMonths} months
                    </td>
                  </tr>
                </>
              )}


            </tbody>
          </table>

          {/* Bottom Signatory area */}
          <div className="flex justify-between items-end pt-8 select-none relative z-10">
            <div className="text-center w-44 pt-1 border-t border-slate-300">
              <strong className="text-slate-900 block text-xs">Customer Signature</strong>
            </div>
            <div className="text-center w-48 pt-1 border-t border-slate-300">
              <strong className="text-slate-900 block text-xs">Authorized Signatory</strong>
              <span className="text-[10px] text-slate-500 font-normal">{companyName}</span>
            </div>
          </div>

          {/* Notice line */}
          <div className="mt-4 text-[9px] text-slate-500 font-bold italic select-none relative z-10">
            * This certificate is an official confirmation of fractional unit allotment and is subject to the terms and timely scheduled collections.
          </div>
        </div>
      </div>
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
          <Printer size={14} /> Print Receipt
        </button>
      </div>

      {/* Printable Certificate Container */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-4 sm:p-5 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print-half-a4">
        <style>{`
          @media print {
            @page {
              size: portrait;
              margin: 0 !important;
            }
            html, body, #root {
              height: 100% !important;
              max-height: 100% !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
            }
            .print-container {
              min-height: 0 !important;
              height: 100% !important;
              max-height: 100% !important;
              background-color: white !important;
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .print-half-a4 {
              box-sizing: border-box !important;
              width: calc(100% - 10mm) !important;
              max-width: 100% !important;
              max-height: 95mm !important;
              height: 95mm !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin-top: 35mm !important;
              margin-left: 5mm !important;
              margin-right: 5mm !important;
              margin-bottom: 0 !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>

        {/* Background Logo Watermark (Black & White / Grayscale) */}
        {company?.logo ? (
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
            <img
              src={cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 })}
              alt="Watermark Logo"
              className="w-72 h-72 object-contain grayscale opacity-[0.06] filter contrast-200"
            />
          </div>
        ) : null}

        {/* Booking Receipt Title */}
        <div className="text-center mb-1 select-none relative z-10 print:mb-0.5">
          <span className="px-2 py-0.2 text-slate-900 text-[11px] md:text-[12px] font-black uppercase tracking-wider rounded-sm print:text-[10px]">
            BOOKING RECEIPT
          </span>
        </div>

        {/* Details Table: Name: Value Format with Specified Widths & Subtle Lines */}
        <table className="w-full border border-slate-200 text-[8px] font-semibold mb-1 select-none border-collapse relative z-10 leading-tight print:text-[7.5px] print:mb-0.5">
          <tbody>
            {/* Row 1: Booking ID | Booking Date/Time */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-black text-slate-900 w-[32%] font-mono">{booking.bookingNumber}</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking Date/Time</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">{bookingDateTimeStr}</td>
            </tr>

            {/* Row 2: Customer ID | Plot Number */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Customer ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%] font-mono">{customer.customerId || '-'}</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Plot Number</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%] font-mono">{plot.plotNumber || booking.plotNumber || '-'}</td>
            </tr>

            {/* Row 3: Customer Name | Guardian / Father */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Customer Name</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-black text-slate-900 w-[32%] uppercase">{customer.name || booking.customerName || '-'}</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Guardian / Father</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">
                {customer.fatherOrHusbandName ? `${customer.relationType || 'Son of'} ${customer.fatherOrHusbandName}` : (customer.guardianName || '-')}
              </td>
            </tr>

            {/* Row 4: Address | Mobile No */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Address</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%] truncate max-w-[200px]">{customer.address || booking.customerAddress || '-'}</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Mobile No</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">{customer.mobile || booking.customerMobile || '-'}</td>
            </tr>

            {/* Row 5: Plot Area | Mauja / थाना */}
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Plot Area</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">{plot.plotSize || booking.plotArea || 0} Sq Ft</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Mauja / थाना</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%] uppercase truncate max-w-[200px]">{maujaThanaDisplay}</td>
            </tr>

            {/* Row 6: Khata | Khesra No */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Khata</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%] font-mono">{khataList}</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Khesra No</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%] font-mono">{khesraList}</td>
            </tr>

            {/* Row 7: Dimensions / पैमाइश */}
            <tr className="border-b border-slate-100 bg-slate-50/40">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Dimensions / पैमाइश</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="py-0.5 px-1.5 font-bold text-slate-900 font-mono text-[7.5px] print:text-[7px]">
                {dimensionsDisplay}
              </td>
            </tr>

            {/* Row 8: Booked Rate | Gross Plot Value */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booked Rate</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">₹{bookedRateVal.toLocaleString('en-IN')} / Sq Ft</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Gross Plot Value</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-black text-slate-900 w-[32%]">₹{grossPlotValDisplay.toLocaleString('en-IN')}</td>
            </tr>

            {/* Row 9: Total Discount | Net Payable Amount */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Total Discount</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-emerald-700 w-[32%]">
                <div>
                  <span>₹{totalCombinedDisc.toLocaleString('en-IN')}</span>
                  {tenureDisc > 0 && manualDisc > 0 ? (
                    <span className="text-[7px] text-slate-500 font-normal ml-1">
                      (₹{tenureDisc.toLocaleString('en-IN')} + ₹{manualDisc.toLocaleString('en-IN')})
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Net Payable Amount</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 w-[32%]">
                <span className="font-black text-slate-900 text-[8.5px] print:text-[8px]">
                  ₹{netPayable.toLocaleString('en-IN')}
                </span>
                <span className="text-[7px] text-slate-500 font-sans font-normal block capitalize truncate max-w-[200px]">
                  ({numberToWords(netPayable)})
                </span>
              </td>
            </tr>

            {/* Row 10: Down Payment (D.P) | EMI Payment */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Down Payment (D.P)</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">
                ₹{dpAmount.toLocaleString('en-IN')}
                {booking.downpaymentDays ? (
                  <span className="text-[7px] text-slate-500 font-normal ml-1">({booking.downpaymentDays} Days)</span>
                ) : null}
              </td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>EMI Payment</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">
                ₹{remEmiAmount.toLocaleString('en-IN')}
              </td>
            </tr>

            {/* Row 11: D.P End Due Date/Duration | EMI End Due DateDuration */}
            <tr className="border-b border-slate-100">
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>D.P End Due Date/Duration</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-amber-800 w-[32%]">{dpEndDueDisplay}</td>
              <td className="py-0.5 px-1.5 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>EMI End Due DateDuration</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-0.5 px-1.5 font-bold text-slate-900 w-[32%]">{emiEndDueDisplay}</td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Signatory area */}
        <div className="flex justify-end items-end pt-1.5 select-none print:pt-1">
          <div className="text-center w-36 pt-0.5 border-t border-slate-400">
            <strong className="text-slate-900 block text-[9px] print:text-[8px]">Authorized Signatory</strong>
          </div>
        </div>

        {/* Notice line */}
        <div className="mt-1 text-[7px] text-slate-500 font-bold italic select-none print:text-[6.5px]">
          * This receipt is an official confirmation of booking slot allotment and is subject to the terms and conditions.
        </div>
      </div>
    </div>
  );
};

export default BookingCertificateViewer;
