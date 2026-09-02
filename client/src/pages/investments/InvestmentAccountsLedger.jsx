import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  Search,
  Filter,
  Eye,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  XCircle,
  Plus,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

const InvestmentAccountsLedger = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);

  const [filterType, setFilterType] = useState('RD');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('accountType', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page);
      params.append('limit', 50);

      const res = await api.get(`/investments/accounts?${params.toString()}`);
      setAccounts(res.data.accounts || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load investment accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [filterType, filterStatus, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAccounts();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'MATURED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Matured</span>;
      case 'PREMATURE_CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Premature Closed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Customer Investments
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Manage investments, approvals, and tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/dashboard/investments/new')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={16} /> New Investment
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards Based on Active Tab */}
      {filterType === 'RD' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Saved / Deposited */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Saved / Deposited
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                ₹{accounts.reduce((sum, a) => sum + (a.totalPaidAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total amount collected/saved across matching plans</p>
            </div>
          </div>

          {/* Card 2: Total Pending Dues */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Clock size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Pending Dues
              </span>
              <h3 className="text-2xl font-black text-amber-800 font-mono mt-0.5">
                ₹{accounts.reduce((sum, a) => sum + (a.pendingDues || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total pending dues from starting date to current date</p>
            </div>
          </div>

          {/* Card 3: Total Expected Maturity */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Coins size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Expected Maturity
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                ₹{accounts.reduce((sum, a) => sum + (a.maturityAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total maturity amount target on completion</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Total Investment */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Investment
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                ₹{accounts.reduce((sum, a) => sum + (a.depositAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total deposited/committed across matching plans</p>
            </div>
          </div>

          {/* Card 2: Total Guaranteed Maturity Payout */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Coins size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Guaranteed Maturity
              </span>
              <h3 className="text-2xl font-black text-emerald-800 font-mono mt-0.5">
                ₹{accounts.reduce((sum, a) => sum + (a.maturityAmount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Total promised payout upon maturity completion</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Selector & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
        {/* Scheme Type Underline Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-200 px-2">
          <button
            onClick={() => {
              setFilterType('RD');
              setPage(1);
            }}
            className={`pb-3 text-xs md:text-sm font-extrabold tracking-wider uppercase transition-all cursor-pointer relative ${
              filterType === 'RD'
                ? 'text-teal-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Recurring Deposit (R.D.)
          </button>
          <button
            onClick={() => {
              setFilterType('FD');
              setPage(1);
            }}
            className={`pb-3 text-xs md:text-sm font-extrabold tracking-wider uppercase transition-all cursor-pointer relative ${
              filterType === 'FD'
                ? 'text-teal-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Fixed Deposit (F.D.)
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Account No, Customer, Mobile..."
              className="w-full h-10 pl-9 pr-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
            <select
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-teal-600"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="MATURED">Matured</option>
              <option value="PREMATURE_CLOSED">Premature Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700">
            {filterType === 'RD' ? 'Recurring Deposit' : 'Fixed Deposit'} Portfolios Found: {total}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading ledger records...</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium italic">
            No {filterType} investment accounts match current criteria.
          </div>
        ) : filterType === 'RD' ? (
          /* ── RECURRING DEPOSIT (R.D.) TABLE ── */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Plan #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Monthly Installment</th>
                  <th className="p-3.5">Elapsed</th>
                  <th className="p-3.5">Deposited</th>
                  <th className="p-3.5">Pending Dues</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Enrolled / Maturity</th>
                  <th className="p-3.5 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const elapsedMonths = acc.monthsElapsed || 0;
                  const totalMonths = acc.tenureMonths || 24;
                  const paidInstallments = acc.paidInstallmentsCount || 0;
                  const overdueCount = acc.overdueInstallmentsCount || 0;

                  return (
                    <tr key={acc._id} className="hover:bg-slate-50/80 transition">
                      {/* Plan # */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-teal-800 block text-xs">
                          {acc.accountNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {acc.tenureMonths} Months ({acc.maturityRatePercent}%)
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 text-xs">{acc.customerId?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {acc.customerId?.customerId || acc.customerId?.mobile || '-'}
                        </div>
                      </td>

                      {/* Monthly Installment & Promised Maturity */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ₹{(acc.depositAmount || 0).toLocaleString('en-IN')}{' '}
                          <span className="text-[11px] font-normal text-slate-500">/ month</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Maturity: ₹{(acc.maturityAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Elapsed Expected */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          ₹{(acc.expectedDepositSoFar || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          {elapsedMonths} / {totalMonths} Months
                        </div>
                      </td>

                      {/* Deposited Funds */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          ₹{(acc.totalPaidAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          {paidInstallments} / {totalMonths} Months
                        </div>
                      </td>

                      {/* Pending Dues */}
                      <td className="p-3.5">
                        <div
                          className={`font-mono font-bold text-xs ${
                            (acc.pendingDues || 0) > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          ₹{(acc.pendingDues || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          {overdueCount > 0 ? `${overdueCount} Months Overdue` : '0 Months Due'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            acc.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : acc.status === 'MATURED'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>

                      {/* Enrolled / Maturity */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 text-xs">
                          {new Date(acc.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Maturity:{' '}
                          {new Date(acc.maturityDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-left">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/dashboard/investments/passbook/${acc._id}`)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition cursor-pointer"
                            >
                              Ledger
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/investments/certificates/${acc._id}`)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] rounded-lg border border-purple-200 transition cursor-pointer flex items-center gap-1"
                            >
                              <Printer size={12} /> Print
                            </button>
                            <button
                              onClick={() => navigate('/dashboard/investments/collections')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-lg border border-emerald-200 transition cursor-pointer"
                            >
                              Collect
                            </button>
                          </div>
                          <div>
                            <button
                              onClick={() => navigate('/dashboard/investments/settlement')}
                              className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded-lg border border-rose-200 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── FIXED DEPOSIT (F.D.) TABLE ── */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">F.D. Account #</th>
                  <th className="p-3.5">Customer / Depositor</th>
                  <th className="p-3.5">Principal Deposit</th>
                  <th className="p-3.5">Tenure & % Return</th>
                  <th className="p-3.5">Maturity Payout</th>
                  <th className="p-3.5">Deposit Received</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Start & Maturity Date</th>
                  <th className="p-3.5 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const isFullyPaid = acc.totalPaidAmount >= acc.depositAmount;

                  return (
                    <tr key={acc._id} className="hover:bg-slate-50/80 transition">
                      {/* Account # */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-emerald-800 text-xs">
                          {acc.accountNumber}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 text-xs">{acc.customerId?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {acc.customerId?.customerId || acc.customerId?.mobile || '-'}
                        </div>
                      </td>

                      {/* Principal Deposit */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ₹{(acc.depositAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">One-time Principal</span>
                      </td>

                      {/* Tenure & Return Rate */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 text-xs">{acc.tenureMonths} Months</div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          {acc.maturityRatePercent}% Return
                        </div>
                      </td>

                      {/* Guaranteed Maturity Payout */}
                      <td className="p-3.5">
                        <div className="font-mono font-black text-emerald-800 text-xs">
                          ₹{(acc.maturityAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Net Gain: +₹{((acc.maturityAmount || 0) - (acc.depositAmount || 0)).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Deposit Received */}
                      <td className="p-3.5">
                        <div className={`font-mono font-bold text-xs ${isFullyPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                          ₹{(acc.totalPaidAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className={`text-[10px] font-bold ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isFullyPaid ? '✓ Received' : 'Pending'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            acc.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : acc.status === 'MATURED'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800 text-xs">
                          {new Date(acc.startDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium">
                          Maturity:{' '}
                          {new Date(acc.maturityDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-left">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/dashboard/investments/certificates/${acc._id}`)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] rounded-lg border border-purple-200 transition cursor-pointer flex items-center gap-1"
                            >
                              <Printer size={12} /> Certificate
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/investments/passbook/${acc._id}`)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition cursor-pointer"
                            >
                              Ledger
                            </button>
                            {!isFullyPaid && (
                              <button
                                onClick={() => navigate('/dashboard/investments/collections')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-lg border border-emerald-200 transition cursor-pointer"
                              >
                                Collect
                              </button>
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate('/dashboard/investments/settlement')}
                              className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded-lg border border-rose-200 transition cursor-pointer"
                            >
                              Settlement
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentAccountsLedger;
