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
    window.print();
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
    const sponsor = booking.sponsorId || {};
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
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">
                    Plot &amp; Fractional Land Development Division
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
                <p>{companyAddress}</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                Official Product Certificate
              </span>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                Booking No: <strong className="font-mono text-slate-900">{booking.bookingNumber}</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Date: <strong className="text-slate-900">{bookingDateFormatted}</strong>
              </div>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center mb-3 select-none relative z-10">
            <span className="px-4 py-1 text-slate-900 text-[1rem] font-black uppercase tracking-wider rounded-sm inline-block">
              CERTIFICATE OF PRODUCT BOOKING &amp; ALLOCATION
            </span>
            <p className="text-[10px] text-slate-500 font-medium max-w-xl mx-auto mt-0.5">
              This certifies that the subscriber mentioned herein has booked fractional plot units under the official scheme subject to the terms and schedule specified below.
            </p>
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

              {/* Row 5: Sponsoring Business Associate */}
              <tr className="border-b border-slate-100 bg-slate-50/20">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Business Associate</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {sponsor.name || 'Direct Company'} {sponsor.sponsorCode ? `(${sponsor.sponsorCode})` : ''}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Partner Supervisor</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {sponsor.sponsorId?.name || '-'}
                </td>
              </tr>

              {/* Row 6: Product Name & Code */}
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Product Item</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {product.productName || 'Micro Plot Unit'} {product.productCode ? `(${product.productCode})` : ''}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Booking Status</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2">
                  <span className="font-bold text-emerald-800 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {booking.status || 'ACTIVE'}
                  </span>
                </td>
              </tr>

              {/* Row 7: Dimensions & Unit Area */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Dimensions / पैमाइश</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 font-mono text-[10px]">
                  उत्तर: {dims.north ?? 1} ft | दक्षिण: {dims.south ?? 1} ft | पूरब: {dims.east ?? 2} ft | पश्चिम: {dims.west ?? 2} ft
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Unit Area &amp; Quantity</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {(product.areaSqFt || (dims.north && dims.east ? dims.north * dims.east : 2))} Sq.Ft • <span className="text-teal-800 font-black">{qty} {qty === 1 ? 'Unit' : 'Units'}</span>
                </td>
              </tr>

              {/* Row 8: Land Sourcing & Mauja / Thana if available */}
              {landSourcing.length > 0 && (
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <td className="p-2 text-slate-500 font-medium">
                    <div className="flex justify-between items-center">
                      <span>Land Stock Reference</span>
                      <span>:</span>
                    </div>
                  </td>
                  <td colSpan={3} className="p-2 text-slate-900 font-semibold text-[10.5px]">
                    {landSourcing.map((src, idx) => (
                      <span key={idx} className="mr-3 inline-block">
                        {src.agreementNumber ? <strong className="font-mono text-teal-900 mr-1">Agr #{src.agreementNumber}</strong> : null}
                        {src.mauja ? `(Mauja: ${src.mauja}${src.thanaNumber ? `, Thana: ${src.thanaNumber}` : ''}) ` : ''}
                        {src.khataNumber || src.khesraNumber ? `[Khata: ${src.khataNumber || '-'}, Khesra: ${src.khesraNumber || '-'}] ` : ''}
                        {src.allocatedSqFt ? <span className="text-emerald-700 font-bold">Allocated: {src.allocatedSqFt} Sq.Ft</span> : ''}
                      </span>
                    ))}
                    {plot.plotNumber && (
                      <span className="font-bold text-slate-900"> | Master Plot #{plot.plotNumber}</span>
                    )}
                  </td>
                </tr>
              )}

              {/* Row 9: Unit Price & Total Valuation */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Unit Price Rate</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">₹{unitPrice.toLocaleString('en-IN')} / Unit</td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Total Valuation</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-black text-slate-900 text-xs">₹{totalValuation.toLocaleString('en-IN')}</td>
              </tr>

              {/* Row 10: Payment Scheme & Downpayment */}
              <tr className="border-b border-slate-100 bg-slate-50/20">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Payment Scheme</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {isFullPayment ? 'One Time (100% Upfront Settlement)' : 'Monthly Installment (EMI)'}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>{isFullPayment ? 'Upfront Paid' : 'Initial Downpayment'}</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  ₹{downPayment.toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Row 11: Remaining Balance & EMI Duration */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Remaining Balance</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  ₹{remainingBalance.toLocaleString('en-IN')}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>{isFullPayment ? 'Payment Status' : 'EMI Tenure & Monthly'}</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {isFullPayment ? (
                    <span className="text-emerald-700 font-black">FULLY SETTLED</span>
                  ) : (
                    `₹${monthlyEmi.toLocaleString('en-IN')} / month for ${tenureMonths} months`
                  )}
                </td>
              </tr>

              {/* Row 12: Total Amount in Words */}
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Amount in Words</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 font-bold text-slate-900">
                  {numberToWords(totalValuation)}
                </td>
              </tr>
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
  // 2. REGULAR PLOT BOOKING CERTIFICATE
  // ─────────────────────────────────────────────────────────────
  const customer = booking.customerId || {};
  const plot = booking.plotId || {};

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

        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden rounded-md">
                  <img src={cloudinaryUrl(company.logo, { format: "webp", width: 120, height: 120 })} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : null}
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{companyName}</h1>
              </div>
            </div>

            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>{companyAddress}</p>
            </div>
          </div>
        </div>

        {/* Booking Certificate Title */}
        <div className="text-center mb-4 select-none relative z-10">
          <span className="px-4 py-1 text-slate-900 text-[1rem] font-black uppercase tracking-wider rounded-sm">
            PLOT BOOKING CERTIFICATE
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

            {/* Row 1: Customer Details */}
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
              <td className="p-2 font-bold text-slate-900 font-mono">{customer.customerId || '-'}</td>
            </tr>

            {/* Row 2: Mobile & Father/Husband */}
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
                  <span>Guardian / Father</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">{customer.fatherOrHusbandName ? `${customer.relationType || 'S/o'} ${customer.fatherOrHusbandName}` : '-'}</td>
            </tr>

            {/* Row 3: Address */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Address</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="p-2 font-bold text-slate-900">{customer.address || '-'}</td>
            </tr>

            {/* Row 4: Plot Specifications & Land Location */}
            <tr className="border-b border-slate-100 bg-slate-50/30">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Plot Number</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">{plot.plotNumber || '-'}</td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Plot Area</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">
                {plot.plotSize || 0} Sq Ft
              </td>
            </tr>

            {/* Row 5: Mauja, Thana, Khata & Jamabandi No. */}
            {(() => {
              const sourcing = booking.landSourcing || [];
              const khataList = Array.from(new Set(sourcing.map(s => s.khataNumber || s.agreementId?.khataNumber).filter(Boolean))).join(', ') || plot.khataNo || '-';
              const khesraList = Array.from(new Set(sourcing.map(s => s.khesraNumber || s.agreementId?.khesraNumber).filter(Boolean))).join(', ') || plot.plotNumber || '-';
              const jamabandiList = Array.from(new Set(sourcing.map(s => s.agreementId?.jamabandiNumber).filter(Boolean))).join(', ') || '-';
              const maujaList = Array.from(new Set(sourcing.map(s => s.mauja || s.agreementId?.mauja).filter(Boolean))).join(', ') || plot.mauja || '-';
              const thanaList = Array.from(new Set(sourcing.map(s => s.thanaNumber || s.agreementId?.thanaNumber).filter(Boolean))).join(', ') || '-';

              return (
                <>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>Mauja / थाना</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold text-slate-900 uppercase">
                      {maujaList} {thanaList !== '-' ? `(Thana: ${thanaList})` : ''}
                    </td>
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>Khata / Khesra No</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold text-slate-900 font-mono">
                      Khata: {khataList} | Khesra: {khesraList}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>Jamabandi No.</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold text-slate-900 font-mono">{jamabandiList}</td>
                    <td className="p-2 text-slate-500 font-medium">
                      <div className="flex justify-between items-center">
                        <span>Booked Rate</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      ₹{Number(booking.effectivePlotRate || booking.basePlotRate || (plot.plotSize ? (booking.plotValue || 0) / plot.plotSize : 0)).toLocaleString('en-IN')} / Sq Ft
                    </td>
                  </tr>
                </>
              );
            })()}

            {/* Row 6: Plot Dimensions & Chaudhi (Boundaries) */}
            {(plot.dimensions || plot.boundaries) && (
              <tr className="border-b border-slate-100 bg-slate-50/40">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Dimensions / पैमाइश</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 font-mono text-[10px]">
                  {typeof plot.dimensions === 'object' && plot.dimensions !== null ? (
                    <span>उत्तर: {plot.dimensions?.north || 0} ft | दक्षिण: {plot.dimensions?.south || 0} ft | पूरब: {plot.dimensions?.east || 0} ft | पश्चिम: {plot.dimensions?.west || 0} ft</span>
                  ) : (
                    <span>{typeof plot.dimensions === 'string' ? plot.dimensions : '-'}</span>
                  )}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>चौहद्दी / Bounds</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-medium text-slate-800 text-[10px]">
                  {typeof plot.boundaries === 'object' && plot.boundaries !== null ? (
                    <span>उत्तर: {plot.boundaries?.north || '-'}, दक्षिण: {plot.boundaries?.south || '-'}, पूरब: {plot.boundaries?.east || '-'}, पश्चिम: {plot.boundaries?.west || '-'}</span>
                  ) : (
                    <span>{typeof plot.boundaries === 'string' ? plot.boundaries : '-'}</span>
                  )}
                </td>
              </tr>
            )}

            {/* Row 7: Plot Value, Discount & Net Payable */}
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
                  <span>Discount</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-emerald-700">₹{(booking.discount || 0).toLocaleString('en-IN')}</td>
            </tr>

            {/* Row 8: Net Payable & Payment Scheme */}
            <tr className="border-b border-slate-100 bg-slate-50/20">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Net Payable Amount</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900 text-xs">
                ₹{Math.max(0, (booking.plotValue || 0) - (booking.discount || 0)).toLocaleString('en-IN')}
              </td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Payment Scheme</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">
                {booking.scheme === 'FULL_PAYMENT' ? 'One Time (Full Payment)' : 'Monthly Installment (EMI)'}
              </td>
            </tr>

            {/* Row 9: Downpayment Amount & Downpayment Due Date */}
            {(() => {
              const dpInst = (installments || []).find(i => i.installmentNumber === 0);
              const dpAmount = booking.bookingAmount || booking.downpaymentAmount || dpInst?.dueAmount || 0;
              let dpDueDateStr = '-';
              if (dpInst?.dueDate) {
                dpDueDateStr = new Date(dpInst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
              } else if (booking.downpaymentDays) {
                const bDate = new Date(booking.bookingDate || booking.createdAt);
                bDate.setDate(bDate.getDate() + Number(booking.downpaymentDays));
                dpDueDateStr = bDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
              }

              return (
                <tr className="border-b border-slate-100">
                  <td className="p-2 text-slate-500 font-medium">
                    <div className="flex justify-between items-center">
                      <span>Down Payment (D.P)</span>
                      <span>:</span>
                    </div>
                  </td>
                  <td className="p-2 font-bold text-slate-900">
                    ₹{dpAmount.toLocaleString('en-IN')}
                    {booking.downpaymentDays ? <span className="text-[10px] text-slate-500 font-normal ml-1">({booking.downpaymentDays} Days)</span> : null}
                  </td>
                  <td className="p-2 text-slate-500 font-medium">
                    <div className="flex justify-between items-center">
                      <span>D.P Due Date</span>
                      <span>:</span>
                    </div>
                  </td>
                  <td className="p-2 font-bold text-amber-800">
                    {dpDueDateStr}
                  </td>
                </tr>
              );
            })()}

            {/* Row 10: Remaining Balance & EMI / Duration Details */}
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
                  const dp = booking.bookingAmount || dpInst?.dueAmount || booking.downpaymentAmount || Math.max(0, net - (booking.remainingAmount || 0));
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
                    const months = regularInsts.length || booking.installmentCount || booking.tenureMonths || 0;
                    const net = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
                    const dpInst = (installments || []).find(i => i.installmentNumber === 0);
                    const dp = booking.bookingAmount || dpInst?.dueAmount || booking.downpaymentAmount || 0;
                    const rem = Math.max(0, net - dp);
                    const rawEmi = months > 0 ? (rem / months) : 0;
                    const emiFormatted = rawEmi % 1 === 0
                      ? rawEmi.toLocaleString('en-IN')
                      : rawEmi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return `₹${emiFormatted} for ${months} months`;
                  })()
                )}
              </td>
            </tr>

            {/* Row 11: Net Payable Amount in Words */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Amount in Words</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="p-2 font-bold text-slate-900">{numberToWords(Math.max(0, (booking.plotValue || 0) - (booking.discount || 0)))}</td>
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
