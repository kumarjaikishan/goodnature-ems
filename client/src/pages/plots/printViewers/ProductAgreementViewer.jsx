import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { Printer, ArrowLeft, FileText, CheckCircle2, ShieldCheck, User, Building2 } from 'lucide-react';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

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

const ProductAgreementViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const { company: adminCompany } = useSelector((state) => state.user || {});
  const { companysetting: empCompany } = useSelector((state) => state.employee || {});
  const company = adminCompany || empCompany || {};
  const companyName = company?.name || company?.companyName || 'GOOD NATURE PROJECTS PVT. LTD.';
  const companyAddress = company?.address || 'Good Nature Complex, Main Road, Bihar - 803118';

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api.get(`/plots/product-bookings/${id}`)
      .then((res) => {
        setBooking(res.data?.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback in case regular plot booking id was passed
        api.get(`/plots/bookings/${id}`)
          .then((bRes) => {
            setBooking(bRes.data?.data);
            setLoading(false);
          })
          .catch(() => {
            toast.error('Failed to load product agreement details');
            setLoading(false);
          });
      });
  }, [id]);

  useEffect(() => {
    if (booking) {
      const custName = booking.customerId?.name || booking.customerName || 'Customer';
      const originalTitle = document.title;
      document.title = `${custName} - Product Agreement`;
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
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center text-slate-500">
        Agreement not found.{' '}
        <button
          onClick={() => navigate('/dashboard/plots/products')}
          className="text-emerald-600 underline font-bold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const customer = booking.customerId || {};
  const product = booking.productId || {};
  const sponsor = booking.sponsorId || {};
  const dims = booking.dimensionsSnapshot || product.dimensions || {};
  const landSourcing = booking.landSourcing || [];

  const qty = booking.quantity || 1;
  const unitPrice = Number(booking.unitPrice || product.unitPrice || 0);
  const totalValuation = Number(booking.totalAmount || (qty * unitPrice) || 0);
  const isFullPayment = booking.paymentType === 'FULL_PAYMENT';
  const downPayment = Number(booking.downPayment || (isFullPayment ? totalValuation : 0));
  const remainingBalance = Math.max(0, totalValuation - downPayment);
  const tenureMonths = booking.tenureMonths || 24;
  const monthlyEmi = Number(booking.monthlyEmi || (isFullPayment ? 0 : Math.round(remainingBalance / tenureMonths)));
  const bookingDateStr = new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print-container">
      {/* Top Action Bar (Hidden on print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/plots/certificates/${booking._id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <FileText size={14} /> View Certificate
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
          >
            <Printer size={14} /> Print Agreement
          </button>
        </div>
      </div>

      {/* Printable Agreement Document Container */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-6 sm:p-10 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print-half-a4 font-serif">
        <style>{`
          @media print {
            @page {
              size: portrait;
              margin: 12mm 15mm 12mm 15mm !important;
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

        {/* Watermark */}
        {company?.logo ? (
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
            <img
              src={cloudinaryUrl(company.logo, { format: 'webp', width: 400, height: 400 })}
              alt="Watermark Logo"
              className="w-80 h-80 object-contain grayscale opacity-[0.05] filter contrast-200"
            />
          </div>
        ) : null}

        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 relative z-10 font-sans">
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center">
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
              <p className="text-[11px] text-teal-800 font-bold uppercase tracking-wider">
                Plot &amp; Fractional Land Development Division
              </p>
              <p className="text-[10px] text-slate-500">{companyAddress}</p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="inline-block px-2.5 py-1 bg-teal-900 text-white font-mono font-bold text-[10px] rounded uppercase tracking-wider">
              Product Allotment Agreement
            </span>
            <div className="text-[11px] text-slate-600 mt-1 font-semibold">
              Agr / Booking #: <strong className="font-mono text-slate-900">{booking.bookingNumber}</strong>
            </div>
            <div className="text-[11px] text-slate-600">
              Execution Date: <strong className="text-slate-900">{bookingDateStr}</strong>
            </div>
          </div>
        </div>

        {/* Agreement Title */}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-wider">
            PLOT PRODUCT ALLOTMENT &amp; DEVELOPMENT AGREEMENT
          </h2>
          <p className="text-xs text-slate-600 italic mt-1">
            (Memorandum of Agreement for Fractional Micro-Plot Unit Booking &amp; Allocation)
          </p>
        </div>

        {/* Parties Intro */}
        <div className="text-xs text-slate-800 leading-relaxed mb-5 space-y-3 relative z-10 font-sans">
          <p>
            This Agreement of Product Allotment is executed on this <strong>{bookingDateStr}</strong> at the registered corporate office of the Company, by and between:
          </p>

          {/* First Party */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-bold text-slate-900 uppercase">
              1. First Party (Developer / Company):
            </div>
            <p className="text-slate-700">
              <strong>{companyName}</strong>, having its principal office at {companyAddress} (hereinafter referred to as the <em>&quot;DEVELOPER / FIRST PARTY&quot;</em>, which expression shall include its successors, assigns, and representatives).
            </p>
          </div>

          {/* Second Party */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-bold text-slate-900 uppercase">
              2. Second Party (Allottee / Subscriber):
            </div>
            <p className="text-slate-700">
              <strong>{customer.name || '-'}</strong>
              {customer.fatherOrHusbandName ? `, ${customer.relationType || 'S/o'} ${customer.fatherOrHusbandName}` : ''}
              , Resident of: <strong>{customer.currentAddress || customer.address || '-'}</strong>
              , Mobile: <strong>{customer.mobile || '-'}</strong>
              , Customer ID: <strong className="font-mono">{customer.customerCode || customer.customerId || '-'}</strong>
              {' '}(hereinafter referred to as the <em>&quot;ALLOTTEE / SECOND PARTY&quot;</em>).
            </p>
          </div>
        </div>

        {/* Agreement Content & Terms (Placeholder + Structured Clauses) */}
        <div className="text-xs text-slate-800 leading-relaxed space-y-4 mb-6 relative z-10 font-sans">
          <div className="border-t border-b border-slate-200 py-3 font-semibold text-slate-900 uppercase tracking-wide text-center text-xs">
            Terms &amp; Conditions of Product Allotment
          </div>

          <div className="space-y-3 text-[11.5px] leading-relaxed text-slate-700">
            <p>
              <strong>1. ALLOTMENT &amp; SPECIFICATIONS:</strong> The First Party agrees to allocate and the Second Party agrees to subscribe to <strong>{qty} Unit(s)</strong> of Plot Product titled <strong>&quot;{product.productName || 'Micro Plot Unit'}&quot;</strong> (Product Code: {product.productCode || 'PRD-001'}) having North: {dims.north ?? 1} ft, South: {dims.south ?? 1} ft, East: {dims.east ?? 2} ft, West: {dims.west ?? 2} ft dimensions, with a total unit area of <strong>{(product.areaSqFt || (dims.north * dims.east) || 2) * qty} Sq.Ft</strong>.
            </p>

            {landSourcing.length > 0 && (
              <p>
                <strong>2. LAND SOURCING IDENTIFICATION:</strong> The fractional land unit is apportioned from Kisan Agreement(s): <strong>{landSourcing.map(s => `Agr #${s.agreementNumber || '-'}`).join(', ')}</strong>, situated at Mauja: <strong>{landSourcing[0]?.mauja || '-'}</strong> (Thana #{landSourcing[0]?.thanaNumber || '-'}), Khata No: {landSourcing[0]?.khataNumber || '-'}, Khesra No: {landSourcing[0]?.khesraNumber || '-'}.
              </p>
            )}

            <p>
              <strong>3. VALUATION &amp; PAYMENT SCHEDULE:</strong> The total agreed valuation of the fractional unit(s) is <strong>₹{totalValuation.toLocaleString('en-IN')}</strong> ({numberToWords(totalValuation)}).
              {isFullPayment ? (
                <span> The payment scheme is <strong>One Time Full Payment (100% Upfront Settlement)</strong> for a contract holding period of <strong>{tenureMonths} Months</strong>.</span>
              ) : (
                <span> Payable via Monthly Installments (EMI) of <strong>₹{monthlyEmi.toLocaleString('en-IN')}</strong> per month over a period of <strong>{tenureMonths} Months</strong>.</span>
              )}
            </p>

            <p>
              <strong>4. INSTALLMENT COMPLIANCE &amp; LATE FINE:</strong> In case of installment delay beyond scheduled due dates, the Second Party agrees to the standard policy terms and late fine provisions as per official company rules.
            </p>

            <p>
              <strong>5. DELIVERY &amp; REGISTRATION:</strong> Upon complete realization of all scheduled payments and completion of contract tenure, the First Party shall execute the necessary possession/transfer deed or scheme maturity clearance in favor of the Second Party.
            </p>

            <p>
              <strong>6. JURISDICTION &amp; DISPUTE RESOLUTION:</strong> All disputes arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the competent courts in Nalanda/Patna, Bihar.
            </p>
          </div>
        </div>

        {/* Execution & Signatures */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs select-none relative z-10 font-sans text-center">
          <div>
            <div className="h-12 border-b border-slate-400 mb-1.5 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 italic font-mono">[Signature]</span>
            </div>
            <strong className="text-slate-900 block text-xs">Second Party / Allottee</strong>
            <span className="text-[10px] text-slate-500">{customer.name || 'Customer'}</span>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 mb-1.5 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 italic font-mono">[Signature / Stamp]</span>
            </div>
            <strong className="text-slate-900 block text-xs">Sponsoring Associate</strong>
            <span className="text-[10px] text-slate-500">{sponsor.name || 'Direct Associate'}</span>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 mb-1.5 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 italic font-mono">[Authorized Stamp]</span>
            </div>
            <strong className="text-slate-900 block text-xs">First Party (Developer)</strong>
            <span className="text-[10px] text-slate-500">{companyName}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-[9.5px] text-slate-500 font-semibold italic select-none text-center relative z-10 font-sans">
          * This document represents an official agreement draft issued by {companyName}.
        </div>
      </div>
    </div>
  );
};

export default ProductAgreementViewer;
