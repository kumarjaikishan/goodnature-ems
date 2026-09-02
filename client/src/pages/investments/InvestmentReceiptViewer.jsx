import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import PageLoader from '../../components/common/PageLoader';

const numberToWords = (num) => {
  if (!num || num === 0) return 'Zero Rupees Only';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const lt1000 = (n) => {
    if (n === 0) return '';
    let t = '';
    if (n >= 100) {
      t += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (t) t += 'and ';
      t += n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? '-' + a[n % 10] : '');
    }
    return t.trim();
  };

  const convert = (n) => {
    if (n === 0) return '';
    let r = '';
    if (n >= 10000000) {
      r += convert(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      r += lt1000(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      r += lt1000(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
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

const InvestmentReceiptViewer = () => {
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
    api
      .get(`/investments/receipts/${id}`)
      .then((res) => {
        setReceipt(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load receipt details');
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <PageLoader fullScreen={false} title="Loading Investment Receipt..." subtitle="Fetching official payment voucher" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
        <p className="text-sm font-bold text-slate-500">Receipt not found or permission denied.</p>
        <button
          onClick={() => navigate('/dashboard/investments/collections')}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const account = receipt.accountId || {};
  const customer = account.customerId || {};
  const isRd = account.accountType === 'RD';

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white flex flex-col items-center">
      {/* Top action bar */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => navigate('/dashboard/investments/collections')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Collections
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      {/* Printable Receipt Voucher */}
      <div
        id="print-area"
        className="w-full max-w-3xl bg-white border border-slate-300 print:border-none p-8 rounded-2xl shadow-sm print:shadow-none text-slate-800 font-sans"
      >
        {/* Header */}
        <div className="border-b-2 border-teal-800 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-teal-900 uppercase">
              {companyName}
            </h1>
            <p className="text-xs text-slate-600 max-w-md mt-0.5 leading-relaxed font-medium">
              {companyAddress}
            </p>
            <div className="text-[11px] text-slate-500 font-semibold mt-1 space-x-3">
              <span>Mob: {companyMobile}</span>
              {companyGstin && <span>GSTIN: {companyGstin}</span>}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-teal-800 text-white text-xs font-black tracking-wider uppercase rounded-md">
              {isRd ? 'R.D. DEPOSIT RECEIPT' : 'F.D. DEPOSIT RECEIPT'}
            </span>
            <div className="mt-2 text-xs">
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Receipt No.</span>
              <span className="font-mono font-black text-slate-800 text-sm">{receipt.receiptNumber}</span>
            </div>
          </div>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Depositor Details
            </span>
            <div className="font-bold text-slate-900 text-sm">{customer.name || 'N/A'}</div>
            <div className="text-slate-500 font-mono text-[11px]">
              Customer ID: {customer.customerId || '-'} | Mob: {customer.mobile || '-'}
            </div>
            {customer.address && (
              <div className="text-slate-500 text-[11px] mt-0.5">{customer.address}</div>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Receipt Date & Status
            </span>
            <div className="font-bold text-slate-900">
              {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div className="mt-1 flex items-center justify-end gap-1 font-bold text-emerald-700">
              <CheckCircle2 size={13} /> {receipt.status}
            </div>
          </div>
        </div>

        {/* Investment Account Info Strip */}
        <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Number</span>
            <span className="font-mono font-bold text-teal-800 text-sm">{account.accountNumber}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheme Type & Tenure</span>
            <span className="font-bold text-slate-800">
              {isRd ? 'Recurring Deposit (RD)' : 'Fixed Deposit (FD)'} • {account.tenureMonths} Months
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Committed Target</span>
            <span className="font-mono font-bold text-slate-800">
              ₹{(account.maturityAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Line Item Table */}
        <table className="w-full border-collapse text-xs my-4">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <th className="p-2.5 text-left">Particulars</th>
              <th className="p-2.5 text-center">Payment Mode</th>
              <th className="p-2.5 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            <tr>
              <td className="p-3">
                <span className="font-bold block">
                  {isRd
                    ? `Monthly Installment Collection`
                    : `Fixed Deposit Principal Contribution`}
                </span>
                {receipt.installmentsCovered && receipt.installmentsCovered.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    Installment #{receipt.installmentsCovered.join(', #')}
                  </span>
                )}
                {receipt.remarks && (
                  <span className="text-[11px] text-slate-400 block italic mt-0.5">
                    Note: {receipt.remarks}
                  </span>
                )}
              </td>
              <td className="p-3 text-center">
                <span className="uppercase font-bold">{receipt.paymentMode}</span>
                {receipt.transactionReference && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ref: {receipt.transactionReference}
                  </div>
                )}
                {receipt.chequeNumber && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Chq #{receipt.chequeNumber} ({receipt.bankName})
                  </div>
                )}
              </td>
              <td className="p-3 text-right font-mono font-bold text-sm text-slate-900">
                ₹{(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold bg-slate-50">
              <td colSpan="2" className="p-3 text-right uppercase text-slate-600 text-[11px]">
                Total Amount Received:
              </td>
              <td className="p-3 text-right font-mono text-base font-black text-emerald-800">
                ₹{(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in words */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-8">
          <span className="font-bold text-slate-500 uppercase text-[10px] block">Amount in Words:</span>
          <span className="font-bold text-slate-800 italic">{numberToWords(receipt.amount || 0)}</span>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
          <div>
            <div className="h-12 border-b border-dashed border-slate-300"></div>
            <span className="text-[11px] font-bold text-slate-500 block text-center mt-1">
              Depositor / Member Signature
            </span>
          </div>
          <div>
            <div className="h-12 border-b border-dashed border-slate-300 flex items-end justify-center">
              {receipt.collectedBy && (
                <span className="text-[11px] font-bold text-teal-800">{receipt.collectedBy.name}</span>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500 block text-center mt-1">
              Authorized Cashier / Officer
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          Computer generated official investment receipt. Subject to terms & conditions of Good Nature projects.
        </div>
      </div>
    </div>
  );
};

export default InvestmentReceiptViewer;
