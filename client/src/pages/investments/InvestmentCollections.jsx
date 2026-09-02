import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  CheckCircle,
  Clock,
  Search,
  Plus,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  Check,
  X,
  CreditCard,
  Printer,
  Calendar,
  Filter,
  Edit,
  Trash2,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';
import Modalbox from '../../components/custommodal/Modalbox';

const InvestmentCollections = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('RD'); // RD, FD
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Collect Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectTargetType, setCollectTargetType] = useState('RD'); // RD or FD
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [collectForm, setCollectForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    transactionReference: '',
    bankName: '',
    chequeNumber: '',
    chequeDate: '',
    remarks: '',
  });

  // Edit Receipt Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editReceiptData, setEditReceiptData] = useState(null);
  const [editForm, setEditForm] = useState({
    paymentDate: '',
    paymentMode: 'cash',
    transactionReference: '',
    bankName: '',
    chequeNumber: '',
    chequeDate: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page);
      queryParams.set('limit', 50);
      if (filterType !== 'ALL') queryParams.set('accountType', filterType);
      if (filterStatus) queryParams.set('status', filterStatus);
      if (searchTerm) queryParams.set('search', searchTerm);

      const [accRes, recRes] = await Promise.all([
        api.get('/investments/accounts?status=ACTIVE&limit=1000'),
        api.get(`/investments/receipts?${queryParams.toString()}`),
      ]);

      setActiveAccounts(accRes.data.accounts || []);
      setReceipts(recRes.data.data?.receipts || []);
      setTotalReceipts(recRes.data.data?.total || 0);
    } catch (err) {
      toast.error('Failed to load collections ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filterType, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const openEditModal = (r) => {
    setEditReceiptData(r);
    setEditForm({
      paymentDate: r.paymentDate ? new Date(r.paymentDate).toISOString().split('T')[0] : '',
      paymentMode: r.paymentMode || 'cash',
      transactionReference: r.transactionReference || '',
      bankName: r.bankName || '',
      chequeNumber: r.chequeNumber || '',
      chequeDate: r.chequeDate ? new Date(r.chequeDate).toISOString().split('T')[0] : '',
      remarks: r.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editReceiptData) return;
    setSubmitLoading(true);
    try {
      await api.put(`/investments/receipts/${editReceiptData._id}`, editForm);
      toast.success('Collection receipt updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update receipt');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteReceipt = async (receiptId, receiptNo) => {
    if (
      !window.confirm(
        `Are you sure you want to delete receipt ${receiptNo}? This will rollback the deposit balance and covered installments on this account.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/investments/receipts/${receiptId}`);
      toast.success('Receipt deleted and ledger balance reverted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete receipt');
    }
  };

  const openModalForType = (type) => {
    setCollectTargetType(type);
    setSelectedAccount(null);
    setAccountSearchQuery('');
    setCollectForm({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      transactionReference: '',
      bankName: '',
      chequeNumber: '',
      chequeDate: '',
      remarks: '',
    });
    setShowCollectModal(true);
  };

  const handleSelectAccount = (acc) => {
    setSelectedAccount(acc);
    const defaultAmount =
      acc.accountType === 'RD'
        ? (acc.pendingDues > 0 ? acc.pendingDues : acc.depositAmount)
        : Math.max(0, (acc.depositAmount || 0) - (acc.totalPaidAmount || 0));

    setCollectForm((prev) => ({
      ...prev,
      amount: String(defaultAmount || ''),
    }));
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return toast.warn('Please select an account first');

    if (collectForm.paymentMode === 'cheque') {
      if (!/^\d{6}$/.test(collectForm.chequeNumber)) {
        return toast.warn('Please enter a valid 6-digit cheque number');
      }
    }

    setSubmitLoading(true);
    try {
      const res = await api.post(`/investments/accounts/${selectedAccount._id}/collect`, collectForm);
      toast.success(
        collectForm.paymentMode === 'cash'
          ? 'Payment collected and approved successfully!'
          : 'Payment recorded as PENDING approval.'
      );
      setShowCollectModal(false);
      fetchData();
      if (res.data.data?._id) {
        navigate(`/dashboard/investments/receipts/${res.data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to collect deposit');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (receiptId) => {
    if (!window.confirm('Are you sure you want to approve this non-cash payment?')) return;
    try {
      await api.put(`/investments/receipts/${receiptId}/approve`);
      toast.success('Payment approved and credited to ledger');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (receiptId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.put(`/investments/receipts/${receiptId}/reject`, { reason });
      toast.info('Payment rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment');
    }
  };

  // Filter accounts in modal by search query
  const eligibleAccounts = activeAccounts.filter((acc) => {
    if (acc.accountType !== collectTargetType) return false;
    if (!accountSearchQuery) return true;
    const q = accountSearchQuery.toLowerCase();
    const accNo = acc.accountNumber?.toLowerCase() || '';
    const custName = acc.customerId?.name?.toLowerCase() || '';
    const custMob = acc.customerId?.mobile?.toLowerCase() || '';
    const custId = acc.customerId?.customerId?.toLowerCase() || '';
    return accNo.includes(q) || custName.includes(q) || custMob.includes(q) || custId.includes(q);
  });

  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
  const inputCls =
    'h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs md:text-sm text-slate-800 transition';

  if (loading && receipts.length === 0) {
    return <PageLoader title="Loading Collections Ledger..." subtitle="Fetching payment transactions" />;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Header & Top Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <Coins size={22} />
            </span>
            Deposit Collections & Payment Ledger
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Accept recurring installments, collect fixed deposits, and view all verified transactions.
          </p>
        </div>

        {/* 2 Dedicated Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openModalForType('RD')}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <CreditCard size={15} /> Collect R.D. Payment
          </button>
          <button
            onClick={() => openModalForType('FD')}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <CreditCard size={15} /> Collect F.D. Payment
          </button>
        </div>
      </div>

      {/* Filter & Scheme Tabs */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
        {/* Underline Tabs: RD & FD */}
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
            R.D. Collections
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
            F.D. Collections
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Receipt No, Account, Customer..."
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
              <option value="APPROVED">Approved / Realized</option>
              <option value="PENDING">Pending Approval</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions / Receipts Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700">
            Receipt Transactions Found: {totalReceipts}
          </span>
        </div>

        {receipts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium italic">
            No collection transactions match current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5">Customer / Member</th>
                  <th className="p-3.5">Account Details</th>
                  <th className="p-3.5">Amount Collected</th>
                  <th className="p-3.5">Payment Mode</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r) => {
                  const acc = r.accountId;
                  const cust = acc?.customerId;
                  const isApproved = r.status === 'APPROVED';
                  const isPending = r.status === 'PENDING';

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition">
                      {/* 1. Payment Date */}
                      <td className="p-3.5 text-slate-700 font-semibold">
                        <div>
                          {new Date(r.paymentDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.receiptNumber}
                        </span>
                      </td>

                      {/* 2. Customer / Member */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{cust?.name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cust?.mobile || '-'}</div>
                      </td>

                      {/* 3. Account Details */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-teal-800 block text-xs">
                          {acc?.accountNumber}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {acc?.accountType === 'RD' ? 'Recurring Deposit' : 'Fixed Deposit'}
                        </span>
                      </td>

                      {/* 4. Amount Collected */}
                      <td className="p-3.5 font-mono font-black text-emerald-800 text-sm">
                        ₹{(r.amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 5. Payment Mode */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-700 uppercase">{r.paymentMode}</span>
                        {r.paymentMode === 'cheque' && (
                          <div className="text-[10px] text-slate-400">
                            Chq: {r.chequeNumber} {r.bankName ? `(${r.bankName})` : ''}
                          </div>
                        )}
                        {r.transactionReference && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            Ref: {r.transactionReference}
                          </div>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(r._id)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] rounded-lg border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                                title="Approve Payment"
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(r._id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1"
                                title="Reject Payment"
                              >
                                <X size={12} /> Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/dashboard/investments/receipts/${r._id}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Printer size={12} /> Print
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
                            title="Edit Collection Details"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReceipt(r._id, r.receiptNumber)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1"
                            title="Delete and Revert Collection"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
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

      {/* Collect Modal with Searchable Typeahead */}
      {showCollectModal && (
        <Modalbox open={showCollectModal} onClose={() => setShowCollectModal(false)}>
          <div className="p-6 bg-white rounded-2xl w-[560px] max-w-[92vw] space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-teal-700" />
                  Collect {collectTargetType === 'RD' ? 'Recurring Deposit (R.D.)' : 'Fixed Deposit (F.D.)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Search active account by member name or account number to accept payment.
                </p>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Account Search / Picker */}
            <div className="space-y-2">
              <label className={labelCls}>Search & Select Active Account *</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type account number, customer name, mobile..."
                  className="w-full h-10 pl-9 pr-3.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-teal-600 outline-none rounded-xl text-xs font-medium text-slate-800 transition"
                  value={accountSearchQuery}
                  onChange={(e) => {
                    setAccountSearchQuery(e.target.value);
                    if (selectedAccount) setSelectedAccount(null);
                  }}
                />
              </div>

              {/* Matching Account Results Dropdown */}
              {!selectedAccount && (
                <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                  {eligibleAccounts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No active {collectTargetType} accounts found matching query.
                    </div>
                  ) : (
                    eligibleAccounts.map((acc) => (
                      <div
                        key={acc._id}
                        onClick={() => handleSelectAccount(acc)}
                        className="p-3 hover:bg-teal-50/70 transition cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-teal-800">{acc.accountNumber}</span>
                          <span className="font-bold text-slate-800 ml-2">{acc.customerId?.name}</span>
                          <span className="text-[11px] text-slate-400 block">{acc.customerId?.mobile}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 block">
                            ₹{(acc.depositAmount || 0).toLocaleString('en-IN')}
                            <span className="text-[10px] text-slate-400 font-normal">
                              {acc.accountType === 'RD' ? '/mo' : ' total'}
                            </span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Paid: ₹{(acc.totalPaidAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected Account Rich Financial Card */}
              {selectedAccount && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded bg-teal-800 text-white flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-teal-900 text-xs block">
                          {selectedAccount.accountNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {selectedAccount.accountType === 'RD' ? 'Recurring Deposit Plan' : 'Fixed Deposit Plan'} (₹{(selectedAccount.depositAmount || 0).toLocaleString('en-IN')}{selectedAccount.accountType === 'RD' ? '/mo' : ' total'})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block font-mono">
                        Bal: ₹{(selectedAccount.totalPaidAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAccount(null)}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer mt-0.5"
                      >
                        Change Account
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700 font-bold">
                        Paid: ₹{(selectedAccount.totalPaidAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-amber-700 font-bold">
                        Dues: ₹{(selectedAccount.pendingDues || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {selectedAccount.paidInstallmentsCount || 0}/{selectedAccount.tenureMonths || 24} Installments
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details Form */}
            {selectedAccount && (
              <form onSubmit={handleCollectSubmit} className="space-y-4 pt-1">
                {/* Collection Amount Field with DUES tag */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Collection Amt:
                  </span>
                  <div className="relative flex-1 max-w-[220px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      className="h-9 w-full bg-white border border-slate-300 focus:border-teal-600 outline-none px-3 pr-14 rounded-lg font-mono font-bold text-xs text-slate-900 text-right"
                      value={collectForm.amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setCollectForm({ ...collectForm, amount: val });
                      }}
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase text-amber-700 tracking-wider">
                      DUES
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Payment Date *</label>
                    <input
                      type="date"
                      className={inputCls}
                      value={collectForm.paymentDate}
                      onChange={(e) => setCollectForm({ ...collectForm, paymentDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Payment Mode *</label>
                    <select
                      className={inputCls}
                      value={collectForm.paymentMode}
                      onChange={(e) => setCollectForm({ ...collectForm, paymentMode: e.target.value })}
                    >
                      <option value="cash">Cash (Auto-Approved)</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {collectForm.paymentMode === 'cheque' && (
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <label className={labelCls}>Cheque Number (6 Digits) *</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 045123"
                        className={inputCls}
                        value={collectForm.chequeNumber}
                        onChange={(e) =>
                          setCollectForm({
                            ...collectForm,
                            chequeNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. SBI, HDFC"
                        className={inputCls}
                        value={collectForm.bankName}
                        onChange={(e) => setCollectForm({ ...collectForm, bankName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {collectForm.paymentMode !== 'cash' && collectForm.paymentMode !== 'cheque' && (
                  <div>
                    <label className={labelCls}>Transaction / UTR Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR / Ref Number"
                      className={inputCls}
                      value={collectForm.transactionReference}
                      onChange={(e) => setCollectForm({ ...collectForm, transactionReference: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Remarks / Note</label>
                  <textarea
                    className="w-full h-16 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                    value={collectForm.remarks}
                    onChange={(e) => setCollectForm({ ...collectForm, remarks: e.target.value })}
                    placeholder="Optional collection notes..."
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCollectModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    {submitLoading ? 'Saving...' : 'Submit Collection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modalbox>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && editReceiptData && (
        <Modalbox open={showEditModal} onClose={() => setShowEditModal(false)}>
          <div className="p-6 bg-white rounded-2xl w-[520px] max-w-[92vw] space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit size={18} className="text-blue-700" />
                  Edit Collection: {editReceiptData.receiptNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {editReceiptData.accountId?.accountNumber} • ₹{(editReceiptData.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Payment Date *</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={editForm.paymentDate}
                    onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Payment Mode *</label>
                  <select
                    className={inputCls}
                    value={editForm.paymentMode}
                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="bank_transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {editForm.paymentMode === 'cheque' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className={labelCls}>Cheque Number</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={editForm.chequeNumber}
                      onChange={(e) => setEditForm({ ...editForm, chequeNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Bank Name</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={editForm.bankName}
                      onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {editForm.paymentMode !== 'cash' && editForm.paymentMode !== 'cheque' && (
                <div>
                  <label className={labelCls}>Transaction / UTR Reference</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={editForm.transactionReference}
                    onChange={(e) => setEditForm({ ...editForm, transactionReference: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>Remarks / Note</label>
                <textarea
                  className="w-full h-16 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {submitLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </Modalbox>
      )}
    </div>
  );
};

export default InvestmentCollections;
