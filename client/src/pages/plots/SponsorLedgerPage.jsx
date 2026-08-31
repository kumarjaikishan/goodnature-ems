import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../utils/apiClient';
import { toast } from '../../utils/toast';
import PageLoader from '../../components/common/PageLoader';
import {
  ArrowLeft,
  Printer,
  IndianRupee,
  Building2,
  FileText,
  User,
  Banknote,
  CheckCircle,
  Search,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const SponsorLedgerPage = () => {
  const { id: paramId } = useParams();
  const user = useSelector((state) => state.user);
  const loggedInId = user?.profile?.id || user?.profile?._id || user?.id || user?._id;
  const targetId = paramId || loggedInId;

  const navigate = useNavigate();

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'CREDIT', 'DEBIT'

  const fetchLedger = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await apiClient({
        url: `plots/sponsors/${targetId}/ledger`,
        method: 'GET'
      });
      setLedgerData(res.data);
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Failed to load sponsor ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchLedger();
    }
  }, [targetId]);

  if (loading) {
    return (
      <PageLoader
        title="Loading Sponsor Ledger..."
        subtitle="Calculating commission credits, collection bases and wallet balance"
      />
    );
  }

  if (!ledgerData || !ledgerData.sponsor) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-base font-bold text-slate-700">Sponsor record or ledger not found.</p>
        <button
          onClick={() => navigate('/dashboard/plots/sponsors')}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Sponsors
        </button>
      </div>
    );
  }

  const { sponsor, summary, transactions = [] } = ledgerData;

  const isDeveloperSponsor = !sponsor.sponsorId;
  const parentSponsor = sponsor.sponsorId;

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      (tx.bookingNumber && tx.bookingNumber.toLowerCase().includes(q)) ||
      (tx.plotNumber && tx.plotNumber.toLowerCase().includes(q)) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      (tx.receiptNumber && tx.receiptNumber.toLowerCase().includes(q)) ||
      (tx.voucherNumber && tx.voucherNumber.toLowerCase().includes(q));

    const matchType = filterType === 'ALL' || tx.type === filterType;

    return matchSearch && matchType;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/plots/sponsors')}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition shadow-2xs cursor-pointer"
            title="Back to Sponsors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Banknote className="w-7 h-7 text-teal-700" />
              Sponsor Commission Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Collection-based commission credits, payouts and wallet balance for{' '}
              <strong className="text-slate-800">{sponsor.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Printer size={16} className="text-slate-600" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Printable Header (Visible Only on Print) */}
      <div className="hidden print:block border-b-2 border-teal-800 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold uppercase text-teal-900 tracking-wider">GOOD NATURE PROJECTS</h2>
            <p className="text-xs text-slate-600">Employee Attendance & Plot Management System</p>
            <h3 className="text-base font-bold text-slate-800 mt-2">SPONSOR COMMISSION STATEMENT / LEDGER</h3>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p><strong>Generated On:</strong> {new Date().toLocaleString('en-IN')}</p>
            <p><strong>Sponsor:</strong> {sponsor.name} ({sponsor.sponsorCode || sponsor.customerId || '-'})</p>
          </div>
        </div>
      </div>

      {/* Sponsor Profile & Executive Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Profile Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-800 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              {sponsor.name ? sponsor.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{sponsor.name}</h2>
                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold border border-slate-200">
                  {sponsor.sponsorCode || sponsor.customerId || 'No Code'}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${isDeveloperSponsor
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                    }`}
                >
                  {isDeveloperSponsor ? '👑 Developer Sponsor' : 'Sub-Sponsor'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                <span>📱 {sponsor.mobile || 'No Mobile'}</span>
                <span>✉️ {sponsor.email || 'No Email'}</span>
                {sponsor.panCard && <span>PAN: <strong className="uppercase">{sponsor.panCard}</strong></span>}
                {!isDeveloperSponsor && parentSponsor && (
                  <span className="text-teal-700">
                    Parent Sponsor: <strong>{parentSponsor.name}</strong> ({parentSponsor.sponsorCode || '-'})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 1: Total Earned */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Earned (Credits)</p>
            <h3 className="text-xl font-black text-emerald-700 font-mono">
              ₹{(summary.totalCredits || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              From ₹{(summary.totalCollectionsBase || 0).toLocaleString('en-IN')} collections
            </p>
          </div>
        </div>

        {/* Metric 2: Total Paid Out */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid Out (Debits)</p>
            <h3 className="text-xl font-black text-rose-700 font-mono">
              ₹{(summary.totalDebits || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Disbursed commission payouts</p>
          </div>
        </div>

        {/* Metric 3: Available Balance */}
        <div className="bg-gradient-to-br from-teal-900 to-teal-800 text-white rounded-2xl p-5 shadow-sm flex items-center gap-4 border border-teal-700">
          <div className="p-3.5 bg-white/10 text-teal-100 rounded-2xl">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-200">Available Balance</p>
            <h3 className="text-2xl font-black text-white font-mono">
              ₹{(summary.availableBalance || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-teal-200 font-medium mt-0.5">Eligible for payout settlement</p>
          </div>
        </div>

        {/* Metric 4: Total Transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
            <h3 className="text-xl font-black text-slate-800 font-mono">{summary.totalTransactions || 0}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Audited ledger entries</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search booking #, plot #, customer, receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none rounded-xl font-medium text-xs text-slate-800 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'ALL', label: 'All Entries' },
              { id: 'CREDIT', label: 'Credits (Earned)' },
              { id: 'DEBIT', label: 'Debits (Paid)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === tab.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 select-none text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Date</th>
                <th className="p-3.5 whitespace-nowrap">Type / Role</th>
                <th className="p-3.5 min-w-[280px]">Transaction Description</th>
                <th className="p-3.5 whitespace-nowrap">Ref / Receipt #</th>
                <th className="p-3.5 text-right whitespace-nowrap bg-emerald-50/40 text-emerald-900">Credit (₹)</th>
                <th className="p-3.5 text-right whitespace-nowrap bg-rose-50/40 text-rose-900">Debit (₹)</th>
                <th className="p-3.5 text-right whitespace-nowrap bg-slate-100 text-slate-900 font-black">
                  Balance (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-400 italic">
                    No transactions found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isCredit = tx.type === 'CREDIT';
                  return (
                    <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Type / Role */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isCredit ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border bg-teal-50 text-teal-800 border-teal-200">
                            🏷️ {tx.closingNumber || tx.roleLabel || 'Closing'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border bg-rose-50 text-rose-800 border-rose-200">
                            Payout Debit
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-3.5 text-slate-800">
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold leading-relaxed text-slate-900">{tx.description}</p>
                          {tx.directBusiness > 0 && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                                Direct: ₹{tx.directBusiness.toLocaleString('en-IN')} @ {tx.directRatesStr} = <strong>₹{tx.directCommission.toLocaleString('en-IN')}</strong>
                              </span>
                              {tx.indirectBusiness > 0 && (
                                <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-semibold">
                                  Indirect Downline: ₹{tx.indirectBusiness.toLocaleString('en-IN')} @ {tx.indirectRatesStr} = <strong>₹{tx.indirectCommission.toLocaleString('en-IN')}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ref / Receipt # / Closing # */}
                      <td className="p-3.5 whitespace-nowrap font-mono text-xs">
                        {tx.closingId ? (
                          <Link
                            to={`/dashboard/plots/closings`}
                            className="text-teal-700 hover:text-teal-900 font-bold hover:underline"
                            title="View Closing Batch"
                          >
                            {tx.closingNumber || 'View Closing'}
                          </Link>
                        ) : tx.receiptId ? (
                          <Link
                            to={`/dashboard/plots/receipts/${tx.receiptId}`}
                            className="text-teal-700 hover:text-teal-900 font-bold hover:underline"
                            title="View Official Receipt"
                          >
                            {tx.receiptNumber || 'View Receipt'}
                          </Link>
                        ) : tx.voucherId ? (
                          <Link
                            to={`/dashboard/plots/vouchers/${tx.voucherId}`}
                            className="text-indigo-700 hover:text-indigo-900 font-bold hover:underline"
                            title="View Payout Voucher"
                          >
                            {tx.voucherNumber || 'View Voucher'}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Credit (₹) */}
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap bg-emerald-50/20">
                        {tx.credit > 0 ? `+₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                      </td>

                      {/* Debit (₹) */}
                      <td className="p-3.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap bg-rose-50/20">
                        {tx.debit > 0 ? `-₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                      </td>

                      {/* Running Balance (₹) */}
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 whitespace-nowrap bg-slate-100/60">
                        ₹{(tx.balance || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                  <td colSpan="4" className="p-3.5 text-right uppercase tracking-wider">
                    Total Summary:
                  </td>
                  <td className="p-3.5 text-right font-mono text-emerald-800 bg-emerald-100/50">
                    +₹{(summary.totalCredits || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-rose-800 bg-rose-100/50">
                    -₹{(summary.totalDebits || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-slate-900 bg-slate-200">
                    ₹{(summary.availableBalance || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Printable Signatures */}
      <div className="hidden print:flex justify-between items-end pt-16 px-4 text-xs text-slate-700">
        <div className="text-center">
          <div className="w-44 border-t border-slate-400 mb-1"></div>
          <p>Prepared By / Accounts</p>
        </div>
        <div className="text-center">
          <div className="w-44 border-t border-slate-400 mb-1"></div>
          <p>Sponsor Signature</p>
        </div>
        <div className="text-center">
          <div className="w-44 border-t border-slate-400 mb-1"></div>
          <p>Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};

export default SponsorLedgerPage;
