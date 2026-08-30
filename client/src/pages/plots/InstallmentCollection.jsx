import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import PageLoader from '../../components/common/PageLoader';
import { CircularProgress } from '@mui/material';
import {
  Banknote,
  CheckCircle,
  Printer,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import Modalbox from '../../components/custommodal/Modalbox';
import numberToWords from '../../utils/numToWord';

const InstallmentCollection = () => {
  const navigate = useNavigate();
  const customStyles = useCustomStyles();
  const [view, setView] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [selectedInstIds, setSelectedInstIds] = useState([]);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');

  const getLateFine = (inst, graceDays, customDate = null) => {
    if (selectedBooking?.scheme !== 'MONTHLY_INSTALLMENT') return 0;
    if (inst.status === 'PAID') return inst.lateFine || 0;
    if (inst.installmentNumber === 0) return 0;

    const due = new Date(inst.dueDate);
    const dateStr = customDate || form?.createdAt;
    const payDate = dateStr ? new Date(dateStr) : new Date();

    const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    const diffTime = d2 - d1;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let dynamicFine = 0;
    if (diffDays > graceDays) {
      const principal = inst.dueAmount - inst.paidAmount;
      dynamicFine = Math.round(principal * 0.0005 * diffDays);
    }

    const storedUnpaidFine = Math.max(0, (inst.lateFine || 0) - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
    return Math.max(dynamicFine, storedUnpaidFine);
  };

  const getLateDays = (inst, graceDays, customDate = null) => {
    if (selectedBooking?.scheme !== 'MONTHLY_INSTALLMENT') return 0;
    if (inst.status === 'PAID') return inst.lateDays || 0;
    if (inst.installmentNumber === 0) return 0;

    const due = new Date(inst.dueDate);
    const dateStr = customDate || form?.createdAt;
    const payDate = dateStr ? new Date(dateStr) : new Date();

    const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    const diffTime = d2 - d1;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > graceDays) {
      return diffDays;
    }
    return 0;
  };

  // Receipts / Collections list
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);

  // Collection form state
  const [form, setForm] = useState({
    amountPaid: '',
    lateFineRebate: '',
    paymentMode: 'cash',
    transactionReference: '',
    remarks: '',
    createdAt: new Date().toISOString().split('T')[0],
  });

  // Edit Modal State
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [editForm, setEditForm] = useState({
    paymentMode: 'cash',
    transactionReference: '',
    remarks: '',
    createdAt: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Confirmation State
  const [deletingReceipt, setDeletingReceipt] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch receipts list for list view
  const fetchReceipts = async () => {
    setReceiptsLoading(true);
    try {
      const res = await api.get('/plots/receipts/list');
      setReceipts(res.data.data || []);
    } catch {
      toast.error('Failed to load receipts list');
    } finally {
      setReceiptsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchReceipts();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/plots/bookings/list?status=ACTIVE');
      setBookings(res.data.data || []);
      setLoading(false);
    } catch {
      toast.error('Failed to load active contracts');
      setLoading(false);
    }
  };

  const handleBookingSelect = async (bookingId) => {
    if (!bookingId) {
      setSelectedBooking(null);
      setInstallments([]);
      setSelectedInstIds([]);
      setForm(f => ({ ...f, amountPaid: '' }));
      return;
    }
    const b = bookings.find(item => item._id === bookingId);
    setSelectedBooking(b);
    setSelectedInstIds([]);

    setDetailsLoading(true);
    try {
      const rateRes = await api.get('/plots/rate-config');
      setGracePeriod(rateRes.data.data?.lateFineGraceDays || 15);

      if (b.scheme === 'MONTHLY_INSTALLMENT') {
        const instRes = await api.get(`/plots/bookings/${bookingId}/installments`);
        const fetchedInsts = instRes.data.data || [];
        setInstallments(fetchedInsts);

        const firstUnpaid = fetchedInsts.find(i => i.status !== 'PAID');
        if (firstUnpaid) {
          setSelectedInstIds([firstUnpaid._id]);
          const principalDue = firstUnpaid.dueAmount - firstUnpaid.paidAmount;
          const fine = getLateFine(firstUnpaid, rateRes.data.data?.lateFineGraceDays || 15);
          setForm(f => ({ ...f, amountPaid: String(principalDue + fine), lateFineRebate: '' }));
        } else {
          setForm(f => ({ ...f, amountPaid: '', lateFineRebate: '' }));
        }
      } else {
        setForm(f => ({ ...f, amountPaid: String(b.remainingAmount || 0), lateFineRebate: '' }));
      }
    } catch {
      toast.error('Failed to load booking installment schedule');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCollectionDateChange = (newDate) => {
    setForm(f => {
      const updatedForm = { ...f, createdAt: newDate };
      if (selectedBooking?.scheme === 'MONTHLY_INSTALLMENT') {
        const totalCalculated = installments
          .filter(i => selectedInstIds.includes(i._id))
          .reduce((sum, i) => {
            const p = i.dueAmount - i.paidAmount;
            const f = getLateFine(i, gracePeriod, newDate);
            return sum + p + f;
          }, 0);
        if (totalCalculated > 0) {
          updatedForm.amountPaid = String(totalCalculated);
        }
      }
      return updatedForm;
    });
  };

  const handleCheckboxToggle = (inst) => {
    const isSelected = selectedInstIds.includes(inst._id);
    let updated = [];
    if (isSelected) {
      updated = selectedInstIds.filter(id => id !== inst._id);
    } else {
      updated = [...selectedInstIds, inst._id];
    }
    setSelectedInstIds(updated);

    const totalCalculated = installments
      .filter(i => updated.includes(i._id))
      .reduce((sum, i) => {
        const p = i.dueAmount - i.paidAmount;
        const f = getLateFine(i, gracePeriod, form.createdAt);
        return sum + p + f;
      }, 0);

    setForm(f => ({ ...f, amountPaid: totalCalculated > 0 ? String(totalCalculated) : '' }));
  };

  const getSelectedLateFineTotal = () => {
    return installments
      .filter(i => selectedInstIds.includes(i._id))
      .reduce((sum, i) => sum + getLateFine(i, gracePeriod, form.createdAt), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return toast.error('Select a booking contract');
    if (!form.amountPaid || Number(form.amountPaid) <= 0) return toast.error('Enter a valid collection amount');

    setSubmitLoading(true);
    try {
      const payload = {
        amountPaid: Number(form.amountPaid),
        lateFineRebate: Number(form.lateFineRebate) || 0,
        paymentMode: form.paymentMode,
        transactionReference: form.paymentMode === 'cash' ? '' : form.transactionReference,
        remarks: form.remarks,
        selectedInstallmentIds: selectedBooking.scheme === 'MONTHLY_INSTALLMENT' ? selectedInstIds : undefined,
        createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined,
      };

      const res = await api.post(`/plots/bookings/${selectedBooking._id}/collect`, payload);
      toast.success('Collection recorded successfully');

      const receiptId = res.data.data?.receipt?._id || res.data.data?._id;
      if (receiptId) {
        navigate(`/dashboard/plots/receipts/${receiptId}`);
      } else {
        setView('list');
        fetchReceipts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Collection process failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (receipt) => {
    setEditingReceipt(receipt);
    setEditForm({
      amount: String(receipt.amount || ''),
      lateFineRebate: String(receipt.lateFineRebate || ''),
      paymentMode: receipt.paymentMode || 'cash',
      transactionReference: receipt.transactionReference || '',
      remarks: receipt.remarks || '',
      createdAt: receipt.createdAt ? new Date(receipt.createdAt).toISOString().split('T')[0] : '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/plots/receipts/${editingReceipt._id}`, {
        amount: Number(editForm.amount),
        lateFineRebate: Number(editForm.lateFineRebate) || 0,
        paymentMode: editForm.paymentMode,
        transactionReference: editForm.paymentMode === 'cash' ? '' : editForm.transactionReference,
        remarks: editForm.remarks,
        createdAt: editForm.createdAt ? new Date(editForm.createdAt).toISOString() : undefined,
      });
      toast.success('Collection updated successfully');
      setEditingReceipt(null);
      fetchReceipts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/plots/receipts/${deletingReceipt._id}`);
      toast.success('Collection deleted & outstanding balance restored');
      setDeletingReceipt(null);
      fetchReceipts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading Collections Ledger..."
        subtitle="Fetching payment receipts, installment schedules & transactions"
      />
    );
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none";

  const filteredReceipts = receipts.filter(r => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const bookingNo = (r.bookingId?.bookingNumber || '').toLowerCase();
    const plotNo = (r.bookingId?.plotId?.plotNumber || '').toLowerCase();
    const customerName = (r.bookingId?.customerId?.name || '').toLowerCase();
    const receiptType = (r.receiptType || '').toLowerCase();
    const paymentMode = (r.paymentMode || '').toLowerCase();
    const txRef = (r.transactionReference || '').toLowerCase();

    return bookingNo.includes(query) ||
      plotNo.includes(query) ||
      customerName.includes(query) ||
      receiptType.includes(query) ||
      paymentMode.includes(query) ||
      txRef.includes(query);
  });

  const receiptColumns = [
    {
      name: 'Date',
      selector: (row) => row.createdAt,
      cell: (row) => (
        <span className="text-slate-600 font-medium whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Booking No.',
      selector: (row) => row.bookingId?.bookingNumber || '-',
      cell: (row) => (
        <span className="font-bold text-slate-900 tracking-wide font-mono">
          {row.bookingId?.bookingNumber || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '140px',
    },
    {
      name: 'Plot #',
      selector: (row) => row.bookingId?.plotId?.plotNumber || '-',
      cell: (row) => (
        <span className="font-bold text-slate-800">
          {row.bookingId?.plotId?.plotNumber || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Customer',
      selector: (row) => row.bookingId?.customerId?.name || '-',
      cell: (row) => (
        <span className="font-bold text-slate-900">
          {row.bookingId?.customerId?.name || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '160px',
      grow: 2,
    },
    {
      name: 'Amount Paid',
      selector: (row) => row.amount || 0,
      cell: (row) => (
        <span className="font-bold text-emerald-700 font-mono">
          ₹{(row.amount || 0).toLocaleString('en-IN')}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: 'Type',
      selector: (row) => row.receiptType,
      cell: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            row.receiptType === 'DOWNPAYMENT'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : row.receiptType === 'FULL_PAYMENT'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {row.receiptType === 'DOWNPAYMENT' ? 'Down Payment' : row.receiptType === 'FULL_PAYMENT' ? 'Full Payment' : 'Installment'}
        </span>
      ),
      sortable: true,
      minWidth: '140px',
    },
    {
      name: 'Mode',
      selector: (row) => row.paymentMode,
      cell: (row) => (
        <span className="font-bold uppercase text-xs text-slate-600">
          {row.paymentMode}
        </span>
      ),
      sortable: true,
      minWidth: '100px',
    },
    {
      name: 'Ref No.',
      selector: (row) => row.transactionReference || '-',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.transactionReference || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '120px',
    },
    {
      name: 'Actions',
      minWidth: '140px',
      cell: (r) => (
        <div className="flex items-center gap-1.5 py-1">
          <button
            onClick={() => navigate(`/dashboard/plots/receipts/${r._id}`)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-semibold border border-slate-200 transition cursor-pointer flex items-center justify-center"
            title="Print Receipt"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={() => handleEditClick(r)}
            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold border border-indigo-200 transition cursor-pointer flex items-center justify-center"
            title="Edit Collection"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setDeletingReceipt(r)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition cursor-pointer flex items-center justify-center"
            title="Delete / Reverse"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {view === 'list' ? 'Installment Collections & Receipts' : 'Record Installment Collection'}
          </h1>
          <p className="text-slate-500 text-sm">
            {view === 'list'
              ? 'View collections ledger history and print payment vouchers/receipts.'
              : 'Record and process incoming monthly installments for active plot contracts.'}
          </p>
        </div>
        <div>
          {view === 'list' ? (
            <button
              onClick={() => setView('add')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition cursor-pointer shadow-sm"
              type="button"
            >
              <Plus size={16} /> Add Collection
            </button>
          ) : (
            <button
              onClick={() => {
                setView('list');
                setSelectedBooking(null);
                setInstallments([]);
                setSelectedInstIds([]);
                setForm({ amountPaid: '', paymentMode: 'cash', transactionReference: '', remarks: '', createdAt: new Date().toISOString().split('T')[0] });
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium text-sm transition cursor-pointer"
              type="button"
            >
              <ArrowLeft size={16} /> Back to Collections
            </button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4 border border-slate-200">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by Booking No, Plot #, Customer, Mode, Ref..."
                className="w-full h-10 pl-9 pr-9 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none rounded-xl font-medium text-xs text-slate-800 transition"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                  title="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Showing {filteredReceipts.length} of {receipts.length} collections
            </div>
          </div>

          {/* DataTable */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <DataTable
              columns={receiptColumns}
              data={filteredReceipts}
              progressPending={receiptsLoading}
              progressComponent={
                <PageLoader
                  fullScreen={false}
                  minHeight="min-h-[220px]"
                  title="Loading Collections Ledger..."
                  subtitle="Fetching payment receipts & transactions"
                />
              }
              customStyles={customStyles}
              pagination
              responsive
              highlightOnHover
              noDataComponent={
                <div className="p-8 text-center text-slate-400 italic font-medium">
                  {receipts.length === 0 ? 'No receipt records found.' : 'No matching records found.'}
                </div>
              }
            />
          </div>
        </div>
      ) : (
        /* Form View (Record Collection) */
        <div className="max-w-5xl mx-auto w-full">
          {/* Booking Selection & Payment Form */}
          <div className="flex flex-col gap-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Banknote size={20} className="text-indigo-600" /> Receive Payment
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Active Contracts</label>
                <select
                  className={inputCls}
                  onChange={e => handleBookingSelect(e.target.value)}
                  value={selectedBooking?._id || ''}
                >
                  <option value="">Select Customer / Plot Booking...</option>
                  {bookings.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.customerId?.name || b.customerName} |  {b.bookingNumber} | {b.plotId?.plotNumber}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBooking && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs select-none">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Customer Name</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedBooking.customerId?.name || selectedBooking.customerName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Booking No</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">{selectedBooking.bookingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Total Plot Value</span>
                      <span className="font-bold text-slate-800 text-sm">₹{(selectedBooking.plotValue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold block text-[0.68rem]">Outstanding Balance</span>
                      <span className="font-bold text-indigo-600 text-sm">₹{(selectedBooking.remainingAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {detailsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  ) : (selectedBooking?.scheme === 'MONTHLY_INSTALLMENT' && installments.length > 0) ? (
                    <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <label className="text-[0.68rem] font-bold text-slate-500 uppercase tracking-wide px-1">Installments Ledger / Select to Pay</label>
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-semibold select-none">
                            <th className="p-2 w-8"></th>
                            <th className="p-2">Inst #</th>
                            <th className="p-2">Due Date</th>
                            <th className="p-2 text-right">Principal</th>
                            <th className="p-2 text-right">Late Fine</th>
                            <th className="p-2 text-right font-bold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {installments.map(inst => {
                            const isPaid = inst.status === 'PAID';
                            const principalDue = inst.dueAmount - inst.paidAmount;
                            const fine = getLateFine(inst, gracePeriod, form.createdAt);
                            const lateDays = getLateDays(inst, gracePeriod, form.createdAt);
                            const totalDue = principalDue + fine;
                            const isSelected = selectedInstIds.includes(inst._id);

                            const collectionDateObj = form.createdAt ? new Date(form.createdAt) : new Date();
                            const currentYear = collectionDateObj.getFullYear();
                            const currentMonth = collectionDateObj.getMonth();
                            const dueDate = new Date(inst.dueDate);
                            const dueYear = dueDate.getFullYear();
                            const dueMonth = dueDate.getMonth();

                            const isOverdue = !isPaid && (dueYear < currentYear || (dueYear === currentYear && dueMonth < currentMonth));
                            const isCurrentMonthDue = !isPaid && dueYear === currentYear && dueMonth === currentMonth;

                            let rowBgClass = '';
                            let statusBadge = null;

                            if (isPaid) {
                              rowBgClass = 'opacity-50 cursor-not-allowed';
                            } else if (isSelected) {
                              rowBgClass = 'bg-indigo-50';
                            } else if (isOverdue) {
                              rowBgClass = 'bg-rose-50 hover:bg-rose-100';
                              statusBadge = (
                                <span className="ml-1.5 px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded-full bg-rose-100 text-rose-700">
                                  Overdue
                                </span>
                              );
                            } else if (isCurrentMonthDue) {
                              rowBgClass = 'bg-amber-50 hover:bg-amber-100';
                              statusBadge = (
                                <span className="ml-1.5 px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded-full bg-amber-100 text-amber-700">
                                  Due
                                </span>
                              );
                            } else {
                              rowBgClass = 'hover:bg-slate-100';
                            }

                            return (
                              <tr
                                key={inst._id}
                                onClick={() => !isPaid && handleCheckboxToggle(inst)}
                                className={`border-b border-slate-100 cursor-pointer select-none transition ${rowBgClass}`}
                              >
                                <td className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isPaid}
                                    onChange={() => { }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2 font-bold text-slate-800 flex items-center">
                                  <span>{inst.installmentNumber === 0 ? 'Downpmt' : `#${inst.installmentNumber}`}</span>
                                  {statusBadge}
                                </td>
                                <td className="p-2 text-slate-600">
                                  {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="p-2 text-right text-slate-700">
                                  ₹{principalDue.toLocaleString('en-IN')}
                                </td>
                                <td className="p-2 text-right font-bold text-rose-600">
                                  {fine > 0 ? (
                                    <div className="flex flex-col items-end leading-tight">
                                      <span>₹{fine.toLocaleString('en-IN')}</span>
                                      <span className="text-[0.65rem] font-medium text-slate-500">
                                        ({lateDays} days)
                                      </span>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td className="p-2 text-right font-bold text-slate-800">
                                  ₹{totalDue.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              )}

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Collection Amount (₹)</label>
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    value={form.amountPaid}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setForm({ ...form, amountPaid: val });
                    }}
                    placeholder="Enter collected cash"
                    required
                  />
                  {form.amountPaid && Number(form.amountPaid) > 0 ? (
                    <p className="text-[0.7rem] font-bold text-indigo-700 mt-1 capitalize bg-indigo-50/70 border border-indigo-100 rounded-lg px-2.5 py-1">
                      {numberToWords(Math.floor(Number(form.amountPaid)))} Rupees Only
                    </p>
                  ) : null}
                </div>

                {selectedBooking?.scheme === 'MONTHLY_INSTALLMENT' && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className={labelCls}>Late Fine Rebate (₹)</label>
                      <span className="text-[0.65rem] text-slate-400 font-medium">
                        Max: ₹{getSelectedLateFineTotal().toLocaleString('en-IN')}
                      </span>
                    </div>
                    <input
                      className={inputCls}
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      value={form.lateFineRebate}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setForm({ ...form, lateFineRebate: val });
                      }}
                      placeholder="Enter rebate amount if any"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Payment Mode</label>
                  <select
                    className={inputCls}
                    value={form.paymentMode}
                    onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / Online</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="neft_rtgs">NEFT / RTGS</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Collection Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.createdAt}
                    onChange={e => handleCollectionDateChange(e.target.value)}
                    required
                  />
                </div>

                {form.paymentMode !== 'cash' && (
                  <div className="flex flex-col gap-1">
                    <label className={labelCls}>
                      {form.paymentMode === 'cheque' ? 'Cheque Number' : 'Reference / UTR / Transaction No.'}
                    </label>
                    <input
                      className={inputCls}
                      placeholder={form.paymentMode === 'cheque' ? 'Enter Cheque Number' : 'Enter UTR / Transaction Reference'}
                      value={form.transactionReference}
                      onChange={e => setForm({ ...form, transactionReference: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Narration / Remarks</label>
                  <textarea
                    className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition min-h-[70px] resize-none"
                    placeholder="Enter narration notes for this payment..."
                    value={form.remarks}
                    onChange={e => setForm({ ...form, remarks: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading || !selectedBooking || !form.amountPaid || Number(form.amountPaid) <= 0}
                className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm cursor-pointer transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <CheckCircle size={18} /> {submitLoading ? 'Saving...' : 'Collect Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      <Modalbox open={Boolean(editingReceipt)} onClose={() => setEditingReceipt(null)}>
        <div className="p-6 bg-white rounded-2xl w-[600px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">
              Edit Collection: {editingReceipt?.receiptNumber}
            </h3>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setEditingReceipt(null)}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Collection Amount (₹)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  className={inputCls}
                  value={editForm.amount}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setEditForm({ ...editForm, amount: val });
                  }}
                  placeholder="Enter collected cash"
                  required
                />
                {editForm.amount && Number(editForm.amount) > 0 ? (
                  <p className="text-[0.7rem] font-bold text-indigo-700 mt-1 capitalize bg-indigo-50/70 border border-indigo-100 rounded-lg px-2.5 py-1">
                    {numberToWords(Math.floor(Number(editForm.amount)))} Rupees Only
                  </p>
                ) : null}
              </div>

              {editingReceipt?.bookingId?.scheme === 'MONTHLY_INSTALLMENT' && (
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Late Fine Rebate (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    className={inputCls}
                    value={editForm.lateFineRebate}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setEditForm({ ...editForm, lateFineRebate: val });
                    }}
                    placeholder="Enter rebate amount"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Payment Mode</label>
                <select
                  className={inputCls}
                  value={editForm.paymentMode}
                  onChange={e => setEditForm({ ...editForm, paymentMode: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="neft_rtgs">NEFT / RTGS</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Payment Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={editForm.createdAt}
                  onChange={e => setEditForm({ ...editForm, createdAt: e.target.value })}
                />
              </div>

              {editForm.paymentMode !== 'cash' && (
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className={labelCls}>
                    {editForm.paymentMode === 'cheque' ? 'Cheque Number' : 'Reference / UTR / Transaction No.'}
                  </label>
                  <input
                    className={inputCls}
                    value={editForm.transactionReference}
                    onChange={e => setEditForm({ ...editForm, transactionReference: e.target.value })}
                    placeholder={editForm.paymentMode === 'cheque' ? 'Enter Cheque Number' : 'Enter UTR / Transaction Reference'}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className={labelCls}>Narration / Remarks</label>
                <textarea
                  className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition min-h-[70px] resize-none"
                  value={editForm.remarks}
                  onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Enter notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setEditingReceipt(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-xs text-slate-600 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-sm transition min-w-[100px] flex items-center justify-center disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* Delete / Reversal Confirmation Modal */}
      <Modalbox open={Boolean(deletingReceipt)} onClose={() => setDeletingReceipt(null)}>
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
            <h3 className="text-base font-bold text-rose-600">
              Reverse Collection: {deletingReceipt?.receiptNumber}
            </h3>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setDeletingReceipt(null)}
            >
              ✕
            </button>
          </div>

          <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-2">
            <p>
              Are you sure you want to reverse and delete this installment payment of <strong className="text-rose-600 font-bold">₹{(deletingReceipt?.amount || 0).toLocaleString('en-IN')}</strong>?
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>Restore the customer's outstanding balance.</li>
              <li>Reset the paid installments to PENDING status.</li>
              <li>Permanently delete sponsor commission schedules generated by this transaction.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setDeletingReceipt(null)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-xs text-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleDeleteSubmit}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 font-medium text-xs text-white rounded-xl shadow-sm transition min-w-[120px] flex items-center justify-center disabled:opacity-50"
            >
              {deleteLoading ? 'Reversing...' : 'Yes, Delete & Reverse'}
            </button>
          </div>
        </div>
      </Modalbox>
    </div>
  );
};

export default InstallmentCollection;
