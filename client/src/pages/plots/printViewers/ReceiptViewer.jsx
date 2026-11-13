import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { Printer, ArrowLeft } from 'lucide-react';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

import PageLoader from '../../../components/common/PageLoader';

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

const formatReceiptDateTime = (dateVal, fallbackVal = null) => {
  if (!dateVal) return '-';
  let d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';

  // If dateVal was stored as UTC midnight (00:00:00.000Z, which renders as 05:30 AM in IST)
  // use the actual document timestamp from fallbackVal (such as updatedAt)
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    if (fallbackVal) {
      const fb = new Date(fallbackVal);
      if (!isNaN(fb.getTime()) && !(fb.getUTCHours() === 0 && fb.getUTCMinutes() === 0 && fb.getUTCSeconds() === 0)) {
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), fb.getHours(), fb.getMinutes(), fb.getSeconds());
      }
    }
  }

  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${dateStr}, ${hoursStr}:${minutes} ${ampm}`;
};

const ReceiptViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  const { company: adminCompany } = useSelector((state) => state.user || {});
  const { companysetting: empCompany } = useSelector((state) => state.employee || {});
  const company = adminCompany || empCompany || {};
  const companyName = company?.name || 'Good Nature Projects Pvt. Ltd.';
  const companyAddress = company?.address || 'Good Nature Complex, Main Road, Bihar - 803118';

  useEffect(() => {
    if (!id) return;
    api.get(`/plots/receipts/${id}`)
      .then(res => {
        setReceipt(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load receipt details');
        setLoading(false);
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
        <PageLoader
          fullScreen={false}
          title="Loading Payment Voucher..."
          subtitle="Fetching official receipt records"
        />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <p className="text-sm font-bold text-slate-500">Receipt not found or permission denied.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">Go Back</button>
      </div>
    );
  }

  const { bookingId = {} } = receipt;
  const isProductReceipt = receipt.isProductReceipt || !!receipt.productDetails || !!bookingId.product;
  const productDetails = receipt.productDetails || {};
  const productObj = productDetails.product || bookingId.product || {};
  const productDims = productDetails.dimensions || bookingId.dimensionsSnapshot || productObj.dimensions || {};
  const productDimensionLabel = productDims.dimensionLabel || (
    (productDims.north || productDims.northSouth) && (productDims.east || productDims.eastWest)
      ? `${productDims.northSouth || productDims.north} ft x ${productDims.eastWest || productDims.east} ft (N/S: ${productDims.northSouth || productDims.north} ft, E/W: ${productDims.eastWest || productDims.east} ft)`
      : (productObj.dimensionLabel || '')
  );
  const productTotalArea = productDetails.totalAreaSqFt || bookingId.totalAreaSqFt || (
    productDetails.quantity && productObj.areaSqFt ? productDetails.quantity * productObj.areaSqFt : null
  );
  const customer = bookingId.customerId || {};
  const plot = bookingId.plotId || {};
  const isDownpaymentReceipt = receipt.receiptType === 'DOWNPAYMENT' || receipt.receiptType === 'BOOKING';
  const outstandingBalance = receipt.asOfRemainingAmount !== undefined
    ? receipt.asOfRemainingAmount
    : (bookingId.remainingAmount || 0);
  const outstandingDownpayment = receipt.asOfRemainingDownpayment !== undefined
    ? receipt.asOfRemainingDownpayment
    : 0;
  const formattedMode = (receipt.paymentMode === 'bank_transfer' || receipt.paymentMode === 'neft_rtgs') ? 'BANK/ONLINE' : (receipt.paymentMode || '').toUpperCase();
  const isOnlinePayment = receipt.paymentMode === 'bank_transfer' ||
    receipt.paymentMode === 'neft_rtgs' ||
    receipt.paymentMode === 'online' ||
    receipt.paymentMode === 'cheque' ||
    formattedMode.includes('BANK') ||
    formattedMode.includes('ONLINE');

  const totalPaidAmount = Number(receipt.amount || 0);
  const lateFinePaid = Number(receipt.lateFinePaid || 0);
  // Principal paid = total receipt amount minus late fine paid (if any)
  const principalAmountPaid = Math.max(0, totalPaidAmount - lateFinePaid);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print-container">
      {/* Action Buttons (Hidden on Print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm cursor-pointer"
        >
          <Printer size={14} /> Print Receipt
        </button>
      </div>

      {/* Printable Receipt Container */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-6 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0 print-half-a4">
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

        {/* Company Header (Hidden per requirement: pre-printed stationary / clean header) */}
        <div className="hidden" style={{ display: 'none' }}>
          <div className="flex flex-col gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden rounded-md">
                  <img src={cloudinaryUrl(company.logo, { format: "webp", width: 120, height: 120 })} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : null}
              <div className="flex flex-col">
                <img
                  src="/name_and_tagline.webp"
                  alt={companyName}
                  className="h-10 object-contain object-left"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <div className="hidden">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{companyName}</h1>
                  <p className="text-[10px] text-gray-500">Plot Management & Development</p>
                </div>
              </div>
            </div>

            {/* Address & Details */}
            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>{companyAddress}</p>
            </div>
          </div>
        </div>

        {/* Payment Receipt Title */}
        <div className="text-center mb-2.5 select-none relative z-10">
          <span className="px-3 py-0.5 text-slate-900 text-[13px] md:text-[14px] font-black uppercase tracking-wider rounded-sm">
            Payment Receipt
          </span>
        </div>

        {/* Details Table: Name: Value Format */}
        <table className="w-full border border-slate-200 text-[9.5px] font-semibold mb-2 select-none border-collapse relative z-10 leading-tight">
          <tbody>
            {/* Row 1: Receipt No. | Date & Time */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Receipt No.</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-black text-slate-900 w-[32%] font-mono">
                {(receipt.receiptNumber || '').replace(/^RO-/, '')}
              </td>
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Date & Time</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 w-[32%] font-mono">
                {formatReceiptDateTime(receipt.createdAt, receipt.updatedAt)}
              </td>
            </tr>

            {/* Row 2: Booking ID | Customer ID */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Booking ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 w-[32%] font-mono">
                {bookingId.bookingNumber || '-'}
              </td>
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Customer ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 w-[32%] font-mono">
                {customer.customerId || customer.customerCode || bookingId.customerId?.customerId || '-'}
              </td>
            </tr>

            {/* Row 3: Customer Name | Guardian / S/o */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Customer Name</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-black text-slate-900 w-[32%] uppercase">
                {customer.name || bookingId.customerName || '-'}
              </td>
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Guardian / S/o</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 w-[32%]">
                {customer.fatherOrHusbandName || customer.guardianName || bookingId.guardianName || bookingId.fatherOrHusbandName ? (
                  <span>
                    {customer.relationType ? `${customer.relationType} ` : ''}
                    {customer.fatherOrHusbandName || customer.guardianName || bookingId.guardianName || bookingId.fatherOrHusbandName}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>

            {/* Row 4: Address (Full Row Width) */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Address</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="py-1 px-2 font-bold text-slate-900">
                {customer.address || bookingId.customerAddress || '-'}
              </td>
            </tr>

            {/* Row 5: Amount Paid | Plot Number */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Amount Paid</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 text-slate-900 w-[32%]">
                <div className="text-[11px] font-black text-emerald-800">
                  ₹{principalAmountPaid.toLocaleString('en-IN')}
                </div>
                <div className="text-[8.5px] font-medium text-slate-500 mt-0.5 normal-case font-sans">
                  ({numberToWords(principalAmountPaid)})
                </div>
              </td>
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>{isProductReceipt ? 'Product / Unit' : 'Plot Number'}</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 w-[32%]">
                {isProductReceipt ? (
                  <div className="space-y-0.5">
                    <div>
                      <span>{productObj.productName || 'Micro Plot Unit'}</span>
                      {productDetails.quantity ? ` (${productDetails.quantity} Units)` : ''}
                      {productDimensionLabel ? ` • ${productDimensionLabel}` : ''}
                    </div>
                    {productTotalArea ? (
                      <div className="text-[9px] text-teal-800 font-bold font-mono">
                        Total Area: {productTotalArea.toLocaleString('en-IN')} Sq.Ft
                      </div>
                    ) : null}
                  </div>
                ) : (
                  (() => {
                    const cleanPlotNo = (plot.plotNumber || bookingId.plotNumber || '').replace(/^#/, '');
                    const size = plot.plotSize || bookingId.plotSize || bookingId.areaSqFt;
                    if (!cleanPlotNo && !size) return '-';
                    if (cleanPlotNo && size) return `${cleanPlotNo} | ${size} sqft`;
                    return cleanPlotNo || `${size} sqft`;
                  })()
                )}
              </td>
            </tr>

            {/* Row 6: Payment Mode | Late Fine Paid */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Payment Mode</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 uppercase w-[32%]">
                {formattedMode} {receipt.transactionReference ? `(${receipt.transactionReference})` : ''}
              </td>
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Late Fine Paid</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-rose-700 w-[32%]">
                ₹{lateFinePaid.toLocaleString('en-IN')}
              </td>
            </tr>

            {/* Row 7: Narration | Outstanding Balance */}
            <tr className="border-b border-slate-100">
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Narration</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 text-slate-800 font-medium italic w-[32%]">
                {receipt.remarks || (isDownpaymentReceipt ? 'Down Payment' : 'Plot Payment Collection')}
              </td>
              <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>{isDownpaymentReceipt ? 'Outstanding D.P.' : 'Outstanding Balance'}</span>
                  <span>:</span>
                </div>
              </td>
              <td className="py-1 px-2 font-bold text-slate-900 w-[32%]">
                ₹{(isDownpaymentReceipt ? (outstandingDownpayment || 0) : (outstandingBalance || 0)).toLocaleString('en-IN')}
                {isDownpaymentReceipt && outstandingBalance > 0 && (
                  <span className="text-[8.5px] text-slate-500 font-normal ml-1">
                    (Total: ₹{outstandingBalance.toLocaleString('en-IN')})
                  </span>
                )}
              </td>
            </tr>

            {/* Row 8: Optional Late Fine Rebate row if applied */}
            {receipt.lateFineRebate > 0 && (
              <tr className="border-b border-slate-100">
                <td className="py-1 px-2 text-slate-500 font-medium w-[18%]">
                  <div className="flex justify-between items-center">
                    <span>Late Fine Rebate</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="py-1 px-2 font-bold text-emerald-700">
                  ₹{receipt.lateFineRebate.toLocaleString('en-IN')}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Bottom Signatory area */}
        <div className="flex justify-end items-end pt-4 select-none">
          <div className="text-center w-40 pt-1 border-t border-slate-400">
            <strong className="text-slate-900 block text-[10px]">Authorized Signatory</strong>
          </div>
        </div>

        {/* Notice line & Bill Status */}
        <div className="mt-3 mb-1 text-[8.5px] text-slate-500 font-semibold italic select-none border-t border-slate-100 pt-1.5 flex flex-col gap-0.5">
          {isOnlinePayment && (
            <p className="text-[9px] text-amber-700 font-bold not-italic">
              * Bill Status: {receipt.status === 'APPROVED' ? 'Approved' : 'Approval Pending'}
            </p>
          )}
          <p>
            * Note: This receipt is issued subject to realization of payment (applicable for Cheque, DD, UPI, RTGS, NEFT, etc.).
          </p>
          {!isOnlinePayment && receipt.status === 'PENDING' && (
            <p className="text-amber-700 font-bold not-italic">
              * Bill Status: Approval Pending.
            </p>
          )}
          {receipt.status === 'REJECTED' && (
            <p className="text-rose-700 font-bold not-italic">
              * Payment Status: Rejected ({receipt.rejectionReason || 'Declined'}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
