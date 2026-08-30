import React, { useEffect, useState } from 'react';
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

const PlotPayoutVoucherPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
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
    api.get(`/plots/payout-vouchers/${id}`)
      .then(res => {
        setVoucher(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load payout voucher details');
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
        <p className="text-sm font-bold text-slate-500">Voucher not found or permission denied.</p>
        <button onClick={() => navigate('/plot-reports')} className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold">Go Back</button>
      </div>
    );
  }

  const booking = voucher.bookingId || {};
  const customer = booking.customerId || {};
  const plot = booking.plotId || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print:dark:bg-white">
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
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm font-bold text-xs transition shadow-lg shadow-indigo-500/10"
        >
          <Printer size={14} /> Print Voucher
        </button>
      </div>

      {/* Printable Voucher Container */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-8 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:shadow-none print:border-none print:p-0">

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.03] rotate-[-30deg]">
          <span className="text-8xl font-black tracking-widest uppercase">{companyName}</span>
        </div>

        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <div className="w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden rounded-md">
                  <img src={cloudinaryUrl(company.logo, { format: "webp", width: 120, height: 120 })} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              ) : null}
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{companyName}</h1>
                <p className="text-xs text-gray-500">Plot Management & Development</p>
              </div>
            </div>

            {/* Address & Details */}
            <div className="mt-0.5 text-xs text-slate-600 space-y-1 font-medium">
              <p>{companyAddress}</p>
              <p><span className="font-bold text-slate-800">Contact:</span> {companyMobile} {companyGstin ? `| ` : ''}{companyGstin ? <><span className="font-bold text-slate-800">GSTIN:</span> {companyGstin}</> : null}</p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="px-3 py-1 bg-indigo-600 text-white text-[0.68rem] font-black uppercase tracking-wider rounded-sm mb-3">
              Money Back Payout Voucher
            </span>
            <div className="text-xs text-slate-600 space-y-1 font-medium select-none">
              <div className="grid grid-cols-[82px_10px_120px] items-center gap-1 text-right">
                <span className="text-slate-500 text-right">Voucher No.</span>
                <span className="text-slate-400 text-center">:</span>
                <strong className="text-slate-800 text-right truncate font-mono">{voucher.voucherNumber}</strong>
              </div>
              <div className="grid grid-cols-[82px_10px_120px] items-center gap-1 text-right">
                <span className="text-slate-500 text-right">Date</span>
                <span className="text-slate-400 text-center">:</span>
                <span className="text-slate-800 text-right">{new Date(voucher.payoutDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs font-medium">
          {/* Customer Details */}
          <div className="border border-slate-200 p-4 rounded-sm">
            <h3 className="font-black text-slate-950 uppercase border-b border-slate-200 pb-1.5 mb-2.5 tracking-wider">Customer Details</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-bold text-slate-900">{customer.name || booking.customerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mobile:</span> <span className="font-bold text-slate-900">{customer.mobile || booking.customerMobile}</span></div>
              {customer.customerId && <div className="flex justify-between"><span className="text-slate-500">Customer ID:</span> <span className="font-bold text-slate-900">{customer.customerId}</span></div>}
            </div>
          </div>

          {/* Plot Details */}
          <div className="border border-slate-200 p-4 rounded-sm">
            <h3 className="font-black text-slate-950 uppercase border-b border-slate-200 pb-1.5 mb-2.5 tracking-wider">Plot Details</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Booking ID:</span> <span className="font-bold text-slate-900">{booking.bookingNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Plot Number:</span> <span className="font-bold text-slate-900">{plot.plotNumber}</span></div>
              {plot.plotSize && (
                <div className="flex justify-between"><span className="text-slate-500">Area / Dimensions:</span> <span className="font-bold text-slate-900">{plot.plotSize} Sq Ft ({plot.plotType})</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Statement */}
        <table className="w-full border-collapse mb-8 text-xs">
          <thead>
            <tr className="bg-slate-100 border border-slate-200 text-left font-black uppercase text-slate-700 select-none">
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody className="border border-slate-200 divide-y divide-slate-200 font-medium">
            <tr>
              <td className="p-3">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">
                    Weekly return payout return payment under FULL_PAYMENT money back scheme.
                  </span>
                  {voucher.remarks && <span className="text-[0.68rem] text-slate-500 italic mt-0.5">{voucher.remarks}</span>}
                </div>
              </td>
              <td className="p-3 text-right font-black text-slate-900 text-sm">₹{voucher.amountPaid?.toLocaleString('en-IN')}</td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="p-3 text-right font-bold text-slate-500">Amount Paid (in words):</td>
              <td className="p-3 text-right font-black text-slate-900 text-xs max-w-xs">{numberToWords(voucher.amountPaid || 0)}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment Metadata */}
        <div className={`grid ${voucher.paymentMode?.toLowerCase() === 'cash' ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mb-12 text-xs font-semibold select-none`}>
          <div className="border border-slate-200 p-3 rounded-sm text-center">
            <span className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-wider">Payment Mode</span>
            <p className="font-black text-slate-900 mt-1 uppercase">{voucher.paymentMode}</p>
          </div>
          {voucher.paymentMode?.toLowerCase() !== 'cash' && (
            <div className="border border-slate-200 p-3 rounded-sm text-center">
              <span className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-wider">Reference No. (UTR)</span>
              <p className="font-black text-slate-900 mt-1 uppercase font-mono">{voucher.transactionReference || 'N/A'}</p>
            </div>
          )}
          <div className="border border-slate-200 p-3 rounded-sm text-center">
            <span className="text-[0.65rem] text-slate-500 uppercase font-bold tracking-wider">Processed By</span>
            <p className="font-black text-indigo-600 mt-1 uppercase">{voucher.processedBy?.name || 'Authorized Officer'}</p>
          </div>
        </div>

        {/* Terms and Signatures */}
        <div className="flex justify-between items-end pt-12 border-t border-slate-200 text-xs">
          <div className="max-w-md text-slate-500 font-medium">
            <p className="font-bold text-slate-800 uppercase tracking-wider mb-1 text-[0.65rem]">Terms & Conditions</p>
            <ul className="list-decimal pl-4 space-y-0.5 text-[0.65rem] leading-normal">
              <li>This payout voucher certifies the payout return under terms of the {companyName} plot booking scheme.</li>
              <li>Customers should preserve all issued payout vouchers for ledger audit matching at project completion.</li>
              <li>This is a system generated validated voucher. No physical stamp is necessary.</li>
            </ul>
          </div>
          <div className="text-center w-48 border-t border-slate-900 pt-1.5 select-none">
            <strong className="text-slate-900 block text-xs">Customer Signature</strong>
            <span className="text-[0.6rem] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Payee Acknowledgment</span>
          </div>
          <div className="text-center w-48 border-t border-slate-900 pt-1.5 select-none">
            <strong className="text-slate-900 block text-xs">Authorized Signatory</strong>
            <span className="text-[0.6rem] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Corporate Officer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotPayoutVoucherPrint;
