import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { Printer, ArrowLeft } from 'lucide-react';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

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
  const companyMobile = company?.mobile || company?.phone || '7766954518';
  const companyGstin = company?.gstin || '10AAJCR9358L1ZX';

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
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
        <p className="text-sm font-bold text-slate-500">Receipt not found or permission denied.</p>
        <button onClick={() => navigate('/plot-reports')} className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold">Go Back</button>
      </div>
    );
  }

  const { bookingId = {} } = receipt;
  const customer = bookingId.customerId || {};
  const plot = bookingId.plotId || {};
  const outstandingBalance = receipt.asOfRemainingAmount !== undefined
    ? receipt.asOfRemainingAmount
    : (bookingId.remainingAmount || 0);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print-container">
      {/* Action Buttons (Hidden on Print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-450 text-white rounded-sm font-bold text-xs transition shadow-lg shadow-emerald-500/10"
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

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-[-30deg]">
          <span className="text-8xl font-black tracking-widest uppercase">{companyName}</span>
        </div>

        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex flex-col gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden rounded-md">
                  <img src={cloudinaryUrl(company.logo, { format: "webp", width: 120, height: 120 })} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : null}
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{companyName}</h1>
                <p className="text-[10px] text-gray-500">Plot Management & Development</p>
              </div>
            </div>

            {/* Address & Details */}
            <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
              <p>{companyAddress}</p>
              <p><span className="font-bold text-slate-800">Contact:</span> {companyMobile} {companyGstin ? `| ` : ''}{companyGstin ? <><span className="font-bold text-slate-800">GSTIN:</span> {companyGstin}</> : null}</p>
            </div>
          </div>
        </div>

        {/* Payment Receipt Title */}
        <div className="text-center mb-3 select-none relative z-10">
          <span className="px-4 py-1 text-slate-900 text-[1rem] font-black uppercase tracking-wider rounded-sm">
            Payment Receipt
          </span>
        </div>

        {/* Details Table: Name: Value Format */}
        <table className="w-full border border-slate-200 text-[11px] font-semibold mb-3 select-none border-collapse">
          <tbody>
            {/* Receipt ID and Date */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Receipt No.</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900 w-[32%] font-mono">{receipt.receiptNumber}</td>
              <td className="p-2 text-slate-500 font-medium w-[18%]">
                <div className="flex justify-between items-center">
                  <span>Date</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900 w-[32%]">
                {new Date(receipt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
              <td className="p-2 font-black text-slate-900">{customer.name || bookingId.customerName}</td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Booking ID</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">{bookingId.bookingNumber}</td>
            </tr>

            {/* Row 2 */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Mobile No</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900">{customer.mobile || bookingId.customerMobile}</td>
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

            {/* Row 4 */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Amount Paid</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-slate-900">₹{receipt.amount?.toLocaleString('en-IN')}</td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Late Fine Paid</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-red-600">₹{(receipt.lateFinePaid || 0).toLocaleString('en-IN')}</td>
            </tr>

            {/* Row 5 */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Payment Mode</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-bold text-slate-900 uppercase">
                {receipt.paymentMode} {receipt.transactionReference ? `(${receipt.transactionReference})` : ''}
              </td>
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Outstanding Balance</span>
                  <span>:</span>
                </div>
              </td>
              <td className="p-2 font-black text-indigo-700">₹{(outstandingBalance || 0).toLocaleString('en-IN')}</td>
            </tr>

            {/* Row 7 (Late Fine Rebate, if any) */}
            {receipt.lateFineRebate > 0 && (
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Late Fine Rebate</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 font-bold text-emerald-600">₹{receipt.lateFineRebate.toLocaleString('en-IN')}</td>
              </tr>
            )}

            {/* Row 6 (Amount in Words) */}
            <tr className="border-b border-slate-100">
              <td className="p-2 text-slate-500 font-medium">
                <div className="flex justify-between items-center">
                  <span>Amount in Words</span>
                  <span>:</span>
                </div>
              </td>
              <td colSpan={3} className="p-2 font-bold text-slate-900">{numberToWords(receipt.amount || 0)}</td>
            </tr>

            {/* Row 8 (Narration / Description) */}
            {receipt.remarks && (
              <tr>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Narration</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 text-slate-800 font-bold italic">{receipt.remarks}</td>
              </tr>
            )}
          </tbody>
        </table>



        {/* Bottom Signatory area */}
        <div className="flex justify-end items-end pt-8  select-none">
          <div className="text-center w-48 pt-1 border-t border-slate-100">
            <strong className="text-slate-900 block text-xs">Authorized Signatory</strong>
          </div>
        </div>

        {/* Notice line */}
        <div className="mb-2 text-[9px] text-slate-500 font-bold italic select-none">
          * Receipt is subject to realization of payment (applicable for Cheque, DD, UPI, RTGS, NEFT, etc.).
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
