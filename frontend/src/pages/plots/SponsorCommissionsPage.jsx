import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { CircularProgress } from '@mui/material';
import Modalbox from '../../components/custommodal/Modalbox';
import { HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineCurrencyRupee } from 'react-icons/hi2';

const SponsorCommissionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');

  // Sponsor Ledger Modal state
  const [selectedSponsorLedger, setSelectedSponsorLedger] = useState(null);
  const [sponsorLedgerData, setSponsorLedgerData] = useState([]);
  const [sponsorLedgerLoading, setSponsorLedgerLoading] = useState(false);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plots/reports/commissions');
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to load sponsor commissions');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const openSponsorLedgerModal = async (sponsor) => {
    if (!sponsor || !sponsor._id) return;
    setSelectedSponsorLedger(sponsor);
    setSponsorLedgerLoading(true);
    try {
      const res = await api.get('/plots/reports/commissions');
      const allCommissions = res.data.data || [];
      const spDetails = allCommissions.find(s => s._id === sponsor._id);
      setSponsorLedgerData(spDetails?.entries || []);
    } catch {
      toast.error('Failed to load sponsor ledger');
      setSponsorLedgerData([]);
    } finally {
      setSponsorLedgerLoading(false);
    }
  };

  const filteredSponsors = Array.isArray(data)
    ? data.filter(s => {
        if (!s || typeof s !== 'object') return false;
        const term = searchTerm.toLowerCase();
        const sName = typeof s.name === 'string' ? s.name : (s.name?.name || '');
        const sCustId = typeof s.sponsorCode === 'string' ? s.sponsorCode : (s.customerId || s.customerId?.customerId || '');
        const sEmail = typeof s.email === 'string' ? s.email : '';
        const sMobile = typeof s.mobile === 'string' ? s.mobile : (s.mobile?.mobile || '');

        const matchesSearch =
          !term ||
          sName.toLowerCase().includes(term) ||
          sCustId.toLowerCase().includes(term) ||
          sEmail.toLowerCase().includes(term) ||
          sMobile.includes(term);

        let matchesBalance = true;
        if (balanceFilter === 'with_balance') matchesBalance = (s.balance || 0) > 0;
        if (balanceFilter === 'zero_balance') matchesBalance = (s.balance || 0) === 0;

        return matchesSearch && matchesBalance;
      })
    : [];

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HiOutlineCurrencyRupee className="w-6 h-6 text-primary" /> Sponsor Commissions Ledger
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Monitor all-time sponsor commission earnings, payouts, and available balances.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by Sponsor Name, ID, Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-primary transition"
          />
          <HiOutlineMagnifyingGlass className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="w-full md:w-56">
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-primary text-slate-700"
          >
            <option value="">All Balances</option>
            <option value="with_balance">Available Balance &gt; ₹0</option>
            <option value="zero_balance">Zero Balance (₹0)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 flex justify-center items-center">
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 select-none">
                  {['Sponsor Details', 'Sponsor ID & Mobile', 'All-Time Earned', 'All-Time Paid', 'Available Balance', 'Action'].map(h => (
                    <th key={h} className="p-3.5 text-xs font-semibold uppercase text-slate-600 tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSponsors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 italic font-medium">
                      No sponsor commission records matching your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSponsors.map(s => {
                    const spName = typeof s.name === 'string' ? s.name : (s.name?.name || 'Unknown');
                    const spEmail = typeof s.email === 'string' ? s.email : '';
                    const spCustId = s.sponsorCode || (typeof s.customerId === 'string' ? s.customerId : (s.customerId?.customerId || '-'));
                    const spMobile = typeof s.mobile === 'string' ? s.mobile : (s.mobile?.mobile || '-');

                    return (
                      <tr key={s._id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{spName}</span>
                            <span className="text-xs text-slate-400 font-medium">{spEmail || 'No email'}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 font-mono">{spCustId}</span>
                            <span className="text-xs text-slate-500 font-medium">{spMobile}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">₹{Number(s.totalEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3.5 font-medium text-slate-600">₹{Number(s.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.balance > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                            ₹{Number(s.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => openSponsorLedgerModal(s)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-medium text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <HiOutlineEye className="w-3.5 h-3.5 text-slate-500" /> View Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sponsor Ledger Modal */}
      <Modalbox open={Boolean(selectedSponsorLedger)} onClose={() => setSelectedSponsorLedger(null)}>
        <div className="p-6 bg-white rounded-2xl w-[800px] max-w-[90vw] space-y-4 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Plot Sponsor Commission Ledger — {selectedSponsorLedger?.name} ({selectedSponsorLedger?.sponsorCode || selectedSponsorLedger?.customerId})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Individual plot commission credit statement for sponsor {selectedSponsorLedger?.name}
              </p>
            </div>
            <button
              onClick={() => setSelectedSponsorLedger(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {sponsorLedgerLoading ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                Loading ledger entries...
              </div>
            ) : sponsorLedgerData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic text-xs font-medium">
                No commission entries found for this sponsor.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                    <th className="p-3 uppercase">Date</th>
                    <th className="p-3 uppercase">From Customer</th>
                    <th className="p-3 uppercase">Plot #</th>
                    <th className="p-3 uppercase text-right">Collection Amount</th>
                    <th className="p-3 uppercase text-right">Commission %</th>
                    <th className="p-3 uppercase text-right font-bold">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sponsorLedgerData.map((entry) => {
                    const collectionAmount = entry.commissionPercent > 0
                      ? Math.round((entry.amount / (entry.commissionPercent / 100)) * 100) / 100
                      : (entry.installmentId?.dueAmount || entry.bookingId?.plotValue || 0);

                    return (
                      <tr key={entry._id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 whitespace-nowrap font-bold text-slate-800">
                          {entry.customerId?.name || 'Unknown'} <span className="text-[0.65rem] text-slate-400">({entry.customerId?.customerCode || entry.customerId?.customerId || '-'})</span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-600 whitespace-nowrap">
                          Plot #{entry.bookingId?.plotId?.plotNumber || '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-700 whitespace-nowrap">
                          ₹{Number(collectionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-500 whitespace-nowrap">
                          {entry.commissionPercent}%
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          +₹{Number(entry.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setSelectedSponsorLedger(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modalbox>
    </div>
  );
};

export default SponsorCommissionsPage;
