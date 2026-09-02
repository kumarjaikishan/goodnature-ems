import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Printer, ArrowLeft } from 'lucide-react';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

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
    if (n > 0) {
      r += lt1000(n);
    }
    return r.trim();
  };

  const str = convert(Math.floor(Math.abs(num)));
  return `${str} Rupees Only`;
};

const InvestmentCertificateViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [apiCompany, setApiCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templateFormat, setTemplateFormat] = useState('STANDARD'); // 'STANDARD' (New voucher layout) or 'CLASSIC' (Gold Bond layout)

  const { company: adminCompany, profile: adminProfile } = useSelector((state) => state.user || {});
  const { companysetting: empCompany, profile: empProfile } = useSelector((state) => state.employee || {});
  const user = useSelector((state) => state.user || {});
  const role = user?.profile?.role;
  const company = (role === 'employee' ? empCompany : adminCompany) || adminCompany || empCompany || apiCompany || {};
  const companyLogo = company?.logo;
  const companyName = company?.name || company?.companyName || 'GOODFEEL';
  const companyAddress = company?.address || 'At- Nala Road, Bihar sharif, Nalanda, Bihar';
  const companyPhone = company?.mobile || company?.phone || company?.contactNumber || '7766954518';
  const companyEmail = company?.email || '';
  const companyGstin = company?.gstin || '10AAJCR9358L1ZX';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, compRes] = await Promise.all([
          api.get(`/investments/accounts/${id}`),
          api.get('/getcompany').catch(() => api.get('/organization/company').catch(() => ({ data: { data: {} } }))),
        ]);
        setData(accRes.data.data);
        if (compRes?.data?.data || compRes?.data?.company) {
          setApiCompany(compRes?.data?.data || compRes?.data?.company);
        }
      } catch (err) {
        toast.error('Failed to load investment certificate');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <PageLoader title="Generating Certificate..." subtitle="Formatting deposit bond agreement" />;
  }

  const account = data?.account;
  if (!account) {
    return (
      <div className="p-8 text-center text-slate-500">
        Account not found.{' '}
        <button onClick={() => navigate(-1)} className="text-teal-700 underline font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const isRd = account.accountType === 'RD';
  const customer = account.customerId || {};
  const amountInWords = numberToWords(account.maturityAmount || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      {/* ── ACTION BAR WITH FORMAT SWITCHER (HIDDEN IN PRINT) ── */}
      <div className="max-w-[780px] mx-auto mb-5 flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Ledger
        </button>

        {/* Format Selector Toggle */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setTemplateFormat('STANDARD')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              templateFormat === 'STANDARD'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Format 1 (Voucher Layout)
          </button>
          <button
            onClick={() => setTemplateFormat('CLASSIC')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              templateFormat === 'CLASSIC'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Format 2 (Classic Certificate Bond)
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
        >
          <Printer size={16} /> Print Certificate
        </button>
      </div>

      {/* ── TEMPLATE FORMAT 1: VOUCHER / INVESTMENT CERTIFICATE (REFERENCE LAYOUT) ── */}
      {templateFormat === 'STANDARD' ? (
        <div className="w-full max-w-4xl mx-auto bg-white text-slate-900 p-8 border border-slate-200 rounded-sm shadow-xl relative overflow-hidden print:p-0 print:shadow-none print:border-none">
          {/* Background Logo Watermark (Black & White / Grayscale - Exact Match with Plot Receipt) */}
          {company?.logo ? (
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
              <img
                src={cloudinaryUrl(company.logo, { format: 'webp', width: 400, height: 400 })}
                alt="Watermark Logo"
                className="w-72 h-72 object-contain grayscale opacity-[0.06] filter contrast-200"
              />
            </div>
          ) : null}

          {/* 1. Header (Brand & Company Meta) */}
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
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {companyName}
                  </h1>
                  <p className="text-[10px] text-gray-500">Marketing & Financial Solutions Division</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5 font-medium">
                <p>{companyAddress}</p>
              </div>
            </div>
          </div>

          {/* 2. Certificate Title Banner */}
          <div className="text-center mb-3 select-none relative z-10">
            <span className="px-4 py-1 text-slate-900 text-[1rem] font-black uppercase tracking-wider rounded-sm">
              INVESTMENT CERTIFICATE
            </span>
          </div>

          {/* 3. Structured Details Table (Name: Value format matching Plot Receipt) */}
          <table className="w-full border border-slate-200 text-[11px] font-semibold mb-4 select-none border-collapse relative z-10">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium w-[18%]">
                  <div className="flex justify-between items-center">
                    <span>Plan ID</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-black text-slate-900 w-[32%] font-mono">{account.accountNumber}</td>
                <td className="p-2 text-slate-500 font-medium w-[18%]">
                  <div className="flex justify-between items-center">
                    <span>Booking Date</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900 w-[32%]">{formatDate(account.startDate)}</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Investor Name</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-black text-slate-900 capitalize">{customer.name || 'N/A'}</td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Investor ID</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-mono font-bold text-slate-900">{customer.customerId || 'N/A'}</td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Mobile No</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-mono font-bold text-slate-900">{customer.mobile || '-'}</td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Nominee</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {account.nominee?.name ? `${account.nominee.name} (${account.nominee.relation || 'Nominee'})` : '-'}
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Address</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 text-slate-800 font-medium">
                  {customer.address || customer.city || '-'}
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Scheme Name</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-black text-slate-900 uppercase">
                  {isRd ? 'RECURRING DEPOSIT (R.D.)' : 'FIXED DEPOSIT (F.D.)'}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Duration</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {isRd
                    ? `₹${(account.depositAmount || 0).toLocaleString('en-IN')} / Month (${account.tenureMonths} Cycles)`
                    : `${account.tenureMonths} Months`}
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>{isRd ? 'Total Investment' : 'Lump Sum Investment'}</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-mono font-bold text-slate-900">
                  ₹{(account.totalDepositExpected || account.depositAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Total Payout</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-mono font-black text-emerald-800 text-sm">
                  ₹{(account.maturityAmount || 0).toLocaleString('en-IN')}
                </td>
              </tr>

              <tr className="border-b border-slate-100">
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>1st Installment Date</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">{formatDate(account.startDate)}</td>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Maturity Date</span>
                    <span>:</span>
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">{formatDate(account.maturityDate)}</td>
              </tr>

              <tr>
                <td className="p-2 text-slate-500 font-medium">
                  <div className="flex justify-between items-center">
                    <span>Amount In Words</span>
                    <span>:</span>
                  </div>
                </td>
                <td colSpan={3} className="p-2 font-bold text-slate-900 italic">
                  {amountInWords}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 4. Bilingual Terms & Conditions */}
          <div className="pt-2 border-t border-slate-200 space-y-2.5 text-[10.5px] leading-relaxed text-slate-700 relative z-10">
            <h3 className="text-center font-black uppercase tracking-wider text-xs text-slate-900 pb-1">
              नियम एवं शर्तें / TERMS & CONDITIONS
            </h3>

            <div className="space-y-2">
              <div>
                <p className="font-semibold text-slate-900">
                  <span className="font-bold">1. Interest Rate:</span> The investor will receive a total return of{' '}
                  <span className="font-bold text-emerald-800">{account.maturityRatePercent}%</span> as per the plan schedule.
                </p>
                <p className="text-slate-500 text-[10px]">
                  १. निवेशक को कुल {account.maturityRatePercent}% का रिटर्न प्लान के हिसाब से मिलेगा।
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  <span className="font-bold">2. Installment Schedule:</span>{' '}
                  {isRd
                    ? 'Monthly installments must be paid by the assigned due date each month.'
                    : 'Full principal deposit is received and registered for one-time lock-in tenure.'}
                </p>
                <p className="text-slate-500 text-[10px]">
                  २. किश्त मिलने का नियम: तय की गई तारीख के अनुसार किश्तों का भुगतान अनिवार्य है।
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  <span className="font-bold">3. Maturity Release:</span> Scheduled on or after{' '}
                  <span className="font-bold text-slate-900">{formatDate(account.maturityDate)}</span> upon original certificate surrender.
                </p>
                <p className="text-slate-500 text-[10px]">
                  ३. मैच्योरिटी भुगतान {formatDate(account.maturityDate)} को या उसके बाद मूल प्रमाण पत्र के सत्यापन पर किया जाएगा।
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  <span className="font-bold">4. Lock-in & Pre-closure:</span> Early closure or cancellation will incur deductions depending on company premature settlement policies.
                </p>
                <p className="text-slate-500 text-[10px]">
                  ४. समय से पहले प्लान बंद करने या कैंसिल करने पर कंपनी के नियमों के अनुसार पैसे काटे जाएंगे।
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  <span className="font-bold">5. Payment Modality:</span> All payouts/payments processed via Cash or to registered verified bank account.
                </p>
                <p className="text-slate-500 text-[10px]">
                  ५. सभी किश्त या भुगतान Cash (नकद) में या आपके रजिस्टर्ड बैंक खाते में दिए जाएंगे।
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  <span className="font-bold">6. Dispute Resolution:</span> Subject to registered office jurisdiction of {companyName}
                </p>
                <p className="text-slate-500 text-[10px]">
                  ६. कोई भी विवाद होने पर उसका निपटारा कंपनी के ऑफिस क्षेत्र के अधीन होगा।
                </p>
              </div>
            </div>
          </div>

          {/* 5. Three Signature Columns */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs relative z-10">
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <span className="block font-bold text-slate-900">Customer Signature</span>
              <span className="text-[10px] text-slate-500 block">(ग्राहक के हस्ताक्षर)</span>
              <span className="text-[11px] font-bold text-slate-800 capitalize block pt-1">
                {customer.name || 'Investor'}
              </span>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <span className="block font-bold text-slate-900">Authorised Signatory</span>
              <span className="text-[10px] text-slate-500 block">(अधिकृत हस्ताक्षर)</span>
              <span className="text-[10px] text-slate-400 block pt-1">Branch / Verifier</span>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <span className="block font-bold text-slate-900">Authorised Signatory</span>
              <span className="text-[10px] text-slate-500 block">(अधिकृत हस्ताक्षर)</span>
              <span className="text-[10px] text-slate-400 block pt-1">Director / Head Office</span>
            </div>
          </div>

          {/* 6. Footer Brand Notice */}
          <div className="text-center border-t border-slate-100 pt-4 mt-4 space-y-0.5 relative z-10">
            <h4 className="font-bold text-xs text-slate-800">{companyName}</h4>
            <p className="text-[10px] text-slate-400">
              Welcome to the Investment Family! This document is valid with customer signature and company stamp.
            </p>
          </div>
        </div>
      ) : (
        /* ── TEMPLATE FORMAT 2: CLASSIC CERTIFICATE BOND (ORNAATE / EMBOSSED BORDER) ── */
        <div className="max-w-4xl mx-auto bg-white p-10 md:p-14 shadow-2xl rounded-3xl border-8 border-teal-800/10 relative overflow-hidden print:p-8 print:shadow-none print:border-none">
          {/* Background Logo Watermark (Black & White / Grayscale - Same as Plot Receipt) */}
          {company?.logo ? (
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
              <img
                src={cloudinaryUrl(company.logo, { format: 'webp', width: 400, height: 400 })}
                alt="Watermark Logo"
                className="w-96 h-96 object-contain grayscale opacity-[0.12] filter contrast-200"
              />
            </div>
          ) : null}

          <div className="relative z-10 space-y-6">
            <div className="border-b-2 border-teal-800/20 pb-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-teal-800 font-bold uppercase tracking-widest text-xs">
                <span>{companyName}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-serif uppercase">
                Certificate of Deposit
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                {isRd ? 'आवर्ती जमा प्रमाण पत्र (Recurring Deposit Bond)' : 'सावधि जमा प्रमाण पत्र (Fixed Deposit Bond)'}
              </p>
            </div>

            {/* Account Meta Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Number</span>
                <span className="font-mono font-bold text-teal-900 text-sm">{account.accountNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue Date</span>
                <span className="font-bold text-slate-800">{formatDate(account.startDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tenure Period</span>
                <span className="font-bold text-slate-800">{account.tenureMonths} Months</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Maturity Date</span>
                <span className="font-bold text-emerald-800">{formatDate(account.maturityDate)}</span>
              </div>
            </div>

            {/* Member & Deposit Particulars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
              {/* Investor Details */}
              <div className="p-5 border border-slate-200 rounded-2xl space-y-3 bg-transparent">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Investor / Depositor Particulars
                </h3>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-bold text-slate-900">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer ID:</span>
                    <span className="font-mono font-bold">{customer.customerId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile No:</span>
                    <span className="font-mono font-bold">{customer.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nominee:</span>
                    <span className="font-bold text-slate-900">
                      {account.nominee?.name || 'Not Declared'} ({account.nominee?.relation || '-'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Scheme Payout Particulars */}
              <div className="p-5 border border-teal-200 bg-transparent rounded-2xl space-y-3">
                <h3 className="font-bold text-teal-950 text-sm border-b border-teal-100 pb-2">
                  Deposit & Payout Schedule
                </h3>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRd ? 'Monthly Installment:' : 'Principal Deposited:'}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(account.depositAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Contract Value:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(account.totalDepositExpected || account.depositAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Promised Return Rate:</span>
                    <span className="font-mono font-bold text-emerald-700">{account.maturityRatePercent}%</span>
                  </div>
                  <div className="flex justify-between border-t border-teal-200/60 pt-2 font-bold text-slate-900 text-sm">
                    <span>Maturity Payout:</span>
                    <span className="font-mono text-teal-900 text-base">
                      ₹{(account.maturityAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions Notice */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] text-slate-500 space-y-1 leading-relaxed">
              <h4 className="font-bold text-slate-700 text-[11px]">Important Terms & Legal Clearance:</h4>
              <p>1. This bond certificate confirms registration under the company's approved deposit scheme.</p>
              <p>2. Maturity claim requires original certificate submission along with depositor identity verification.</p>
              <p>3. Premature closure is subject to company premature settlement policies and agreed interest rules.</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
              <div className="border-t border-slate-300 pt-2 text-slate-600">
                <span className="block font-bold text-slate-800">Depositor Signature</span>
                <span className="text-[10px] text-slate-400">Authorized Member</span>
              </div>
              <div className="border-t border-slate-300 pt-2 text-slate-600">
                <span className="block font-bold text-slate-800">Sponsor / Verifier</span>
                <span className="text-[10px] text-slate-400">{account.sponsorId?.name || 'Authorized'}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 text-slate-600">
                <span className="block font-bold text-slate-800">For {companyName}</span>
                <span className="text-[10px] text-slate-400">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentCertificateViewer;
