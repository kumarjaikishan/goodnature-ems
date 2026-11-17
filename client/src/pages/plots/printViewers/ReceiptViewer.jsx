import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import PageLoader from '../../../components/common/PageLoader';
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
  const resolvedPlanName = (receipt.planName || productDetails.planName || bookingId.planName || '').trim() || (
    (productDetails.tenureMonths || bookingId.tenureMonths)
      ? `GROW/${productDetails.tenureMonths || bookingId.tenureMonths}-M`
      : 'GROW/24-M'
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
    <ReceiptPrintWrapper onPrint={handlePrint} onBack={() => navigate(-1)}>
      {/* Payment Receipt Title */}
      <div className="text-center mb-2.5 select-none relative z-10 print:mb-2">
        <span className="px-3 py-0.5 text-slate-900 text-[13px] md:text-[14px] font-black uppercase tracking-wider rounded-sm print:text-[12px]">
          Payment Receipt
        </span>
      </div>

      {/* Details Table: Name: Value Format */}
      <table className="w-full border border-slate-200 print:border-none text-[11px] print:text-[10px] font-semibold mb-2.5 select-none border-collapse relative z-10 leading-tight print:mb-2">
        <tbody>
          {/* Row 1: Receipt No. | Date & Time */}
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Receipt No.</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-black text-slate-900 w-[32%] font-mono">
              {(receipt.receiptNumber || '').replace(/^RO-/, '')}
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Date & Time</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">
              {formatReceiptDateTime(receipt.createdAt, receipt.updatedAt)}
            </td>
          </tr>

          {/* Row 2: Booking ID | Customer ID */}
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Booking ID</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">
              {bookingId.bookingNumber || '-'}
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Customer ID</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 w-[32%] font-mono">
              {customer.customerId || customer.customerCode || bookingId.customerId?.customerId || '-'}
            </td>
          </tr>

          {/* Row 3: Customer Name | Guardian / S/o */}
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Customer Name</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-black text-slate-900 w-[32%] uppercase">
              {customer.name || bookingId.customerName || '-'}
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Guardian / S/o</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 w-[32%]">
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
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Address</span>
                <span>:</span>
              </div>
            </td>
            <td colSpan={3} className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900">
              {customer.address || bookingId.customerAddress || '-'}
            </td>
          </tr>

          {/* Row 5: Amount Paid | Plan / Plot Number */}
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Amount Paid</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-900 w-[32%]">
              <div className="text-[12px] print:text-[11px] font-black text-emerald-800">
                ₹{principalAmountPaid.toLocaleString('en-IN')}
              </div>
              <div className="text-[9.5px] print:text-[8.5px] font-medium text-slate-600 mt-0.5 normal-case font-sans">
                ({numberToWords(principalAmountPaid)})
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>{isProductReceipt ? 'Plan' : 'Plot Number'}</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 w-[32%]">
              {isProductReceipt ? (
                <span className="font-bold text-slate-900 uppercase">{resolvedPlanName}</span>
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

          {/* Row 6: Payment Transaction | Late Fine Paid */}
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Payment Transaction</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 uppercase w-[32%]">
              {formattedMode} {receipt.transactionReference ? `(${receipt.transactionReference})` : ''}
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Late Fine Paid</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-rose-700 w-[32%]">
              ₹{lateFinePaid.toLocaleString('en-IN')}
            </td>
          </tr>

          {/* Row 7: Narration | Outstanding Balance */}
          <tr>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>Narration</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-800 font-medium italic w-[32%]">
              {receipt.remarks || (isDownpaymentReceipt ? 'Down Payment' : 'Plot Payment Collection')}
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
              <div className="flex justify-between items-center">
                <span>{isDownpaymentReceipt ? 'Outstanding D.P.' : 'Outstanding Balance'}</span>
                <span>:</span>
              </div>
            </td>
            <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-slate-900 w-[32%]">
              ₹{(isDownpaymentReceipt ? (outstandingDownpayment || 0) : (outstandingBalance || 0)).toLocaleString('en-IN')}
              {isDownpaymentReceipt && outstandingBalance > 0 && (
                <span className="text-[9.5px] print:text-[8.5px] text-slate-500 font-normal ml-1">
                  (Total: ₹{outstandingBalance.toLocaleString('en-IN')})
                </span>
              )}
            </td>
          </tr>

          {/* Row 8: Optional Late Fine Rebate row if applied */}
          {receipt.lateFineRebate > 0 && (
            <tr>
              <td className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 text-slate-600 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Late Fine Rebate</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="py-1.5 px-2.5 print:py-[4.5px] print:px-2 font-bold text-emerald-700">
                ₹{receipt.lateFineRebate.toLocaleString('en-IN')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bottom Signatory area & Notice notes in Side-by-Side Flex Layout */}
      <div className="flex justify-between items-end pt-3.5 select-none print:pt-3">
        {/* Left: Notice & Status */}
        <div className="text-[9px] print:text-[8px] text-slate-500 font-semibold italic flex flex-col gap-0.5 max-w-[65%]">
          {isOnlinePayment && (
            <p className="text-[9.5px] print:text-[8.5px] text-amber-700 font-bold not-italic m-0">
              * Bill Status: {receipt.status === 'APPROVED' ? 'Approved' : 'Approval Pending'}
            </p>
          )}
          {!isOnlinePayment && receipt.status === 'PENDING' && (
            <p className="text-amber-700 font-bold not-italic m-0">
              * Bill Status: Approval Pending.
            </p>
          )}
          {receipt.status === 'REJECTED' && (
            <p className="text-rose-700 font-bold not-italic m-0">
              * Payment Status: Rejected ({receipt.rejectionReason || 'Declined'}).
            </p>
          )}
          <p className="m-0 leading-tight">
            * Note: This receipt is issued subject to realization of payment (applicable for Cheque, DD, UPI, RTGS, NEFT, etc.).
          </p>
        </div>

        {/* Right: Authorized Signatory */}
        <div className="text-center w-36 pt-1 border-t border-slate-700 shrink-0 signatory-line">
          <strong className="text-slate-900 block text-[10.5px] print:text-[9.5px]">Authorized Signatory</strong>
        </div>
      </div>
    </ReceiptPrintWrapper>
  );
};

export default ReceiptViewer;
