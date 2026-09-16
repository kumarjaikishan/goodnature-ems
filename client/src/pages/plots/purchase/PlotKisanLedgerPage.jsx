import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Layers,
  Printer,
  ShieldCheck,
  User,
  Phone,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Tag,
  Edit3,
  Trash2,
} from 'lucide-react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PageLoader from '../../../components/common/PageLoader';
import RecordPaymentModal from './components/RecordPaymentModal';
import CreateDeedModal from './components/CreateDeedModal';
import EditDeedModal from './components/EditDeedModal';
import confirmDialog from '../../../utils/confirmDialog';

const PlotKisanLedgerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' | 'stock' | 'deeds'
  const [search, setSearch] = useState('');

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    transactionReference: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [deedModalOpen, setDeedModalOpen] = useState(false);
  const [deedLoading, setDeedLoading] = useState(false);
  const [deedForm, setDeedForm] = useState({
    deedNumber: '',
    deedDate: new Date().toISOString().split('T')[0],
    subRegistrarOffice: '',
    registeredDismil: '',
    remarks: '',
  });

  const [editDeedModalOpen, setEditDeedModalOpen] = useState(false);
  const [editDeedLoading, setEditDeedLoading] = useState(false);
  const [editingDeedTarget, setEditingDeedTarget] = useState(null);
  const [editDeedForm, setEditDeedForm] = useState({
    deedNumber: '',
    deedDate: '',
    subRegistrarOffice: '',
    remarks: '',
  });

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/plots/kisan-agreements/${id}`);
      setData(res.data?.data || res.data);
    } catch {
      toast.error('Failed to load Kisan Land Agreement Ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLedgerData();
  }, [id]);

  // Open Payment Modal
  const openPaymentModal = () => {
    setPaymentForm({
      amount: '',
      paymentMode: 'BANK_TRANSFER',
      transactionReference: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSavePayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      await api.post(`/plots/kisan-agreements/${id}/payments`, paymentForm);
      toast.success('Payment recorded and Kisan ledger balance updated!');
      setPaymentModalOpen(false);
      fetchLedgerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Open Create Deed Modal
  const openCreateDeedModal = () => {
    const agr = data?.agreement;
    setDeedForm({
      deedNumber: agr?.agreementNumber ? `${agr.agreementNumber}/` : '',
      deedDate: new Date().toISOString().split('T')[0],
      subRegistrarOffice: '',
      registeredDismil: agr?.unregisteredAgreedSqFt
        ? (Math.round((agr.unregisteredAgreedSqFt / 435.6) * 100) / 100).toString()
        : '',
      remarks: '',
    });
    setDeedModalOpen(true);
  };

  // Submit Create Deed
  const handleSaveRegistryDeed = async (e, customPayload) => {
    if (e && e.preventDefault) e.preventDefault();
    setDeedLoading(true);
    const dataToSend = customPayload || deedForm;
    try {
      await api.post(`/plots/kisan-agreements/${id}/deeds`, dataToSend);
      toast.success('Registry Deed converted & registered into land stock pool!');
      setDeedModalOpen(false);
      fetchLedgerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register deed');
    } finally {
      setDeedLoading(false);
    }
  };

  // Open Edit Deed Modal
  const openEditDeedModal = (agreementId, deed) => {
    setEditingDeedTarget({ agreementId, deed, parentAgreement: agreement });
    setEditDeedForm({
      deedNumber: deed.deedNumber || '',
      deedDate: deed.deedDate ? new Date(deed.deedDate).toISOString().split('T')[0] : '',
      subRegistrarOffice: deed.subRegistrarOffice || '',
      remarks: deed.remarks || '',
    });
    setEditDeedModalOpen(true);
  };

  // Save Edit Deed
  const handleSaveEditDeed = async (e, customPayload) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingDeedTarget) return;
    setEditDeedLoading(true);
    const dataToSend = customPayload || editDeedForm;
    try {
      await api.put(
        `/plots/kisan-agreements/${editingDeedTarget.agreementId}/deeds/${editingDeedTarget.deed._id}`,
        dataToSend
      );
      toast.success('Registry Deed updated successfully!');
      setEditDeedModalOpen(false);
      fetchLedgerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update registry deed');
    } finally {
      setEditDeedLoading(false);
    }
  };

  // Delete Deed
  const handleDeleteDeed = async (agreementId, deed) => {
    const proceed = await confirmDialog({
      title: `Delete Registry Deed #${deed.deedNumber}?`,
      text: `This will remove the registry deed and revert ${deed.registeredSqFt} Sq.Ft. (${deed.registeredDismil} Dismil) back into the unregistered agreement land pool. Cannot be deleted if allocated to customer bookings.`,
      confirmText: 'Delete Deed',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;

    try {
      await api.delete(`/plots/kisan-agreements/${agreementId}/deeds/${deed._id}`);
      toast.success(`Registry Deed #${deed.deedNumber} deleted and stock restored.`);
      fetchLedgerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete registry deed');
    }
  };

  if (loading || !data) {
    return (
      <PageLoader
        title="Loading Kisan Financial Ledger..."
        subtitle="Calculating debit payments, credit agreed land value, and running balances"
      />
    );
  }

  const { agreement, financialSummary, kisanLedgers = [], stockLedgers = [] } = data;

  const filteredFinancialLedgers = kisanLedgers.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      l.farmerName?.toLowerCase().includes(q) ||
      l.receiptNumber?.toLowerCase().includes(q) ||
      l.transactionReference?.toLowerCase().includes(q) ||
      l.paymentMode?.toLowerCase().includes(q) ||
      l.remarks?.toLowerCase().includes(q)
    );
  });

  const totalDebit = kisanLedgers
    .filter((l) => l.type === 'DEBIT')
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  const totalCredit = kisanLedgers
    .filter((l) => l.type === 'CREDIT')
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto print:p-0 print:bg-white">
      {/* ── TOP HEADER / NAVIGATION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/plots/purchase')}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition cursor-pointer shadow-xs"
            title="Back to Plot Purchase"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-900">{agreement?.agreementNumber}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  agreement?.status === 'FULLY_REGISTERED'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : agreement?.status === 'PARTIALLY_REGISTERED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {agreement?.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Kisan Land Acquisition Official Financial & Stock Audit Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreateDeedModal}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck size={15} /> + Add Registry Deed
          </button>

          <button
            onClick={openPaymentModal}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <CreditCard size={15} /> + Pay Seller
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* ── PRINT HEADER (Visible only on Print) ── */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase">GOOD NATURE EMS</h1>
            <p className="text-xs text-slate-600">Farmer Land Acquisition & Payment Statement</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p className="font-bold text-slate-800">Agreement #{agreement?.agreementNumber}</p>
            <p className="text-slate-500">Date: {new Date(agreement?.agreementDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* ── HERO FINANCIAL SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agreed Value (Credit) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Agreed Value (Credit)
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-2">
            ₹{(financialSummary?.totalCost || 0).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Rate: ₹{(agreement?.ratePerDismil || 0).toLocaleString('en-IN')} / Dismil
          </p>
        </div>

        {/* Total Paid to Farmer (Debit) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
              Total Paid to Kisan (Debit)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CreditCard size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 font-mono mt-2">
            ₹{(financialSummary?.totalPaid || 0).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-emerald-600 mt-1">
            {financialSummary?.paymentCount || 0} Disbursement Transaction(s)
          </p>
        </div>

        {/* Balance Due */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
              Outstanding Balance Due
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-800 font-mono mt-2">
            ₹{(financialSummary?.balanceDue || 0).toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {financialSummary?.balanceDue <= 0 ? '✓ Fully Cleared & Settled' : 'Pending Farmer Settlement'}
          </p>
        </div>

        {/* Total Registered Deeds Count & Value */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
              Registered Deeds
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-purple-900 font-mono mt-2">
            {agreement?.registryDeeds?.length || 0} <span className="text-xs font-semibold text-slate-500">Deed(s)</span>
          </h3>
          <p className="text-[11px] text-purple-700 mt-1">
            Reg: {agreement?.totalRegisteredDismil || 0} Dismil Converted
          </p>
        </div>
      </div>

      {/* ── LAND STOCK & BOOKING ALLOCATION STATS (Exact user requested stats) ── */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Total Agreed Area
            </span>
            <span className="font-black text-slate-900 text-base font-mono block mt-0.5">
              {agreement?.araziDismil} Dismil <span className="text-xs font-medium text-slate-500">({agreement?.totalSqFt} SqFt)</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-purple-600 block uppercase font-bold tracking-wider">
              Registered Area
            </span>
            <span className="font-black text-purple-700 text-base font-mono block mt-0.5">
              {agreement?.totalRegisteredDismil || 0} Dismil
            </span>
          </div>
          <div>
            <span className="text-[10px] text-amber-600 block uppercase font-bold tracking-wider">
              Allocated to Bookings
            </span>
            <span className="font-black text-amber-700 text-base font-mono block mt-0.5">
              {(agreement?.totalAllocatedSqFt || 0).toLocaleString('en-IN')} SqFt
            </span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 block uppercase font-bold tracking-wider">
              Free Available Stock
            </span>
            <span className="font-black text-emerald-700 text-base font-mono block mt-0.5">
              {(agreement?.totalAvailableSqFt || 0).toLocaleString('en-IN')} SqFt
            </span>
          </div>
        </div>
      </div>

      {/* ── LAND & FARMER PARTICULARS ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={16} className="text-teal-700" />
          Land & Farmer Acquisition Particulars
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Mauja / Village</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{agreement?.mauja}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Khata Number</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{agreement?.khataNumber}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Khesra / Plot</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{agreement?.khesraNumber}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Thana No</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{agreement?.thanaNumber || '-'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Jamabandi</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{agreement?.jamabandiNumber || '-'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Agreement Date</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {new Date(agreement?.agreementDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Associated Farmers */}
        <div>
          <span className="text-[11px] font-bold text-slate-600 block mb-2">Registered Land Owner(s) / Kisans:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agreement?.farmers?.map((f, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full font-bold text-[10px]">
                    {f.sharePercent}% Share
                  </span>
                </div>
                {f.guardianName && <p className="text-slate-500 text-[11px]">Father/Guardian: {f.guardianName}</p>}
                {f.mobile && <p className="text-slate-500 text-[11px]">Mobile: {f.mobile}</p>}
                <p className="text-slate-400 text-[10px]">
                  Aadhaar: {f.aadhaarNumber || '-'} | PAN: {f.panNumber || '-'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUB-TABS ── */}
      <div className="flex items-center gap-3 border-b border-slate-200 print:hidden">
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'financial'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={17} />
          Kisan Financial Ledger ({kisanLedgers.length})
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'stock'
              ? 'border-teal-700 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={17} />
          Land Stock Allocation Audit ({stockLedgers.length})
        </button>

        <button
          onClick={() => setActiveTab('deeds')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'deeds'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={17} />
          Registry Deeds ({agreement?.registryDeeds?.length || 0})
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: KISAN FINANCIAL LEDGER (Debit, Credit, Balance)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between print:hidden">
            <div className="relative w-full sm:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Receipt, Farmer, Mode, Remarks..."
                className="h-10 w-full pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none shadow-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                    <th className="p-3.5 uppercase">Date</th>
                    <th className="p-3.5 uppercase">Ref / Receipt #</th>
                    <th className="p-3.5 uppercase">Particulars / Mode</th>
                    <th className="p-3.5 uppercase text-right text-emerald-700 font-bold">Debit / Paid (₹)</th>
                    <th className="p-3.5 uppercase text-right text-slate-700 font-bold">Credit / Agreed (₹)</th>
                    <th className="p-3.5 uppercase text-right text-amber-800 font-bold">Balance Due (₹)</th>
                    <th className="p-3.5 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredFinancialLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No financial transactions recorded yet. Click "+ Pay Kisan" above to record a payment.
                      </td>
                    </tr>
                  ) : (
                    filteredFinancialLedgers.map((l) => (
                      <tr key={l._id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono text-slate-600">
                          {new Date(l.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {l.receiptNumber || l.transactionReference || '-'}
                        </td>
                        <td className="p-3.5 text-slate-800">
                          <span className="font-bold text-slate-900 block">{l.farmerName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {l.paymentMode || 'BANK_TRANSFER'}
                          </span>
                        </td>
                        {/* Debit Column (Disbursed to Kisan) */}
                        <td className="p-3.5 text-right font-mono font-bold">
                          {l.type === 'DEBIT' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              ₹{l.amount?.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        {/* Credit Column (Agreed Value) */}
                        <td className="p-3.5 text-right font-mono font-bold">
                          {l.type === 'CREDIT' ? (
                            <span className="text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                              ₹{l.amount?.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        {/* Balance Due Column */}
                        <td className="p-3.5 text-right font-mono font-bold text-amber-800 text-sm">
                          ₹{l.runningBalance?.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px] max-w-xs">{l.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Total Footer */}
                {kisanLedgers.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="p-3.5 uppercase text-slate-600">
                        Total Summary
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-700 text-sm">
                        ₹{totalDebit.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-800 text-sm">
                        ₹{totalCredit.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-800 text-sm font-black">
                        ₹{(financialSummary?.balanceDue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: LAND STOCK ALLOCATION AUDIT (Debit, Credit, Balance Stock)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                  <th className="p-3.5 uppercase">Date</th>
                  <th className="p-3.5 uppercase">Transaction & Source</th>
                  <th className="p-3.5 uppercase">Booking / Plot</th>
                  <th className="p-3.5 uppercase text-right text-rose-700 font-bold">Debit / Out (Sq.Ft.)</th>
                  <th className="p-3.5 uppercase text-right text-emerald-700 font-bold">Credit / In (Sq.Ft.)</th>
                  <th className="p-3.5 uppercase text-right text-slate-900 font-bold">Balance Stock (Sq.Ft.)</th>
                  <th className="p-3.5 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {stockLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      No land stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockLedgers.map((sl) => (
                    <tr key={sl._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono text-slate-600">
                        {new Date(sl.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{sl.transactionType}</span>
                        <span className="text-[10px] text-teal-700 font-mono block">
                          Agreement Stock Pool
                        </span>
                      </td>
                      <td className="p-3.5">
                        {sl.bookingNumber ? (
                          <div>
                            <span className="font-mono font-bold text-teal-800 block">{sl.bookingNumber}</span>
                            {sl.customerName && (
                              <span className="text-[10px] text-slate-500 block">{sl.customerName}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      {/* Debit Column (Allocated Out) */}
                      <td className="p-3.5 text-right font-mono font-bold">
                        {sl.entryType === 'DEBIT' ? (
                          <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                            -{sl.sqFt?.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      {/* Credit Column (Stock Inward) */}
                      <td className="p-3.5 text-right font-mono font-bold">
                        {sl.entryType === 'CREDIT' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                            +{sl.sqFt?.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      {/* Balance Stock Column */}
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        {(sl.runningAvailableSqFt || sl.runningBalance || sl.sqFt)?.toLocaleString('en-IN')} SqFt
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] max-w-xs">{sl.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: REGISTRY DEEDS TABLE
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'deeds' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                  <th className="p-3.5 uppercase">Deed Number</th>
                  <th className="p-3.5 uppercase">Deed Date</th>
                  <th className="p-3.5 uppercase">Registrar Office</th>
                  <th className="p-3.5 uppercase text-right">Registered Area</th>
                  <th className="p-3.5 uppercase text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {agreement?.registryDeeds?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      No registry deeds converted yet from this agreement. Click "+ Add Registry Deed" above to convert.
                    </td>
                  </tr>
                ) : (
                  agreement?.registryDeeds?.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-purple-900 font-mono">{d.deedNumber}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{new Date(d.deedDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3.5 text-slate-700">{d.subRegistrarOffice || '-'}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-purple-950">
                        {d.registeredDismil} Dismil ({d.registeredSqFt} SqFt)
                      </td>
                      <td className="p-3.5 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditDeedModal(agreement._id, d)}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg cursor-pointer transition"
                            title="Edit Deed"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteDeed(agreement._id, d)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition"
                            title="Delete Deed"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <RecordPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        targetAgreementForPayment={agreement}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        paymentLoading={paymentLoading}
        handleSavePayment={handleSavePayment}
      />

      <CreateDeedModal
        open={deedModalOpen}
        onClose={() => setDeedModalOpen(false)}
        targetAgreementForDeed={agreement}
        deedForm={deedForm}
        setDeedForm={setDeedForm}
        deedLoading={deedLoading}
        handleSaveRegistryDeed={handleSaveRegistryDeed}
      />

      <EditDeedModal
        open={editDeedModalOpen}
        onClose={() => setEditDeedModalOpen(false)}
        editingDeedTarget={editingDeedTarget}
        editDeedForm={editDeedForm}
        setEditDeedForm={setEditDeedForm}
        editDeedLoading={editDeedLoading}
        handleSaveEditDeed={handleSaveEditDeed}
      />
    </div>
  );
};

export default PlotKisanLedgerPage;
