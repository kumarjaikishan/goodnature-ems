import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import PageLoader from '../../components/common/PageLoader';
import Button from '@/components/ui/Button';
import { Plus, ArrowLeft, Search } from 'lucide-react';

import { getReceiptColumns } from './installments/ReceiptColumns';
import ReceivePaymentForm from './installments/ReceivePaymentForm';
import {
  EditReceiptModal,
  ApproveReceiptModal,
  RejectReceiptModal,
  DeleteReceiptModal,
} from './installments/CollectionModals';

const InstallmentCollection = () => {
  const navigate = useNavigate();
  const customStyles = useCustomStyles();
  const [view, setView] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [selectedInstIds, setSelectedInstIds] = useState([]);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [lateFineDailyPercent, setLateFineDailyPercent] = useState(0.05);
  const [searchQuery, setSearchQuery] = useState('');

  const getLateFine = (inst, graceDays, customDate = null, fineDailyPercent = lateFineDailyPercent) => {
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
      const rate = (Number(fineDailyPercent) || 0.05) / 100;
      dynamicFine = Math.round(principal * rate * diffDays);
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');

  // Approval / Rejection state
  const [approvingReceipt, setApprovingReceipt] = useState(null);
  const [rejectingReceipt, setRejectingReceipt] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const activeSelectRequestId = useState({ current: 0 })[0];

  const handleBookingSelect = async (bookingId) => {
    const currentReqId = ++activeSelectRequestId.current;

    if (!bookingId) {
      setSelectedBooking(null);
      setInstallments([]);
      setSelectedInstIds([]);
      setForm((f) => ({ ...f, amountPaid: '', lateFineRebate: '' }));
      setDetailsLoading(false);
      return;
    }

    const b = bookings.find((item) => item._id === bookingId);
    setSelectedBooking(b);
    setInstallments([]);
    setSelectedInstIds([]);
    setForm((f) => ({ ...f, amountPaid: '', lateFineRebate: '' }));
    setDetailsLoading(true);

    try {
      const rateRes = await api.get('/plots/rate-config');
      if (currentReqId !== activeSelectRequestId.current) return;

      const seriesGrace = b?.plotId?.seriesId?.gracePeriodDays;
      const seriesDailyPercent = b?.plotId?.seriesId?.lateFineDailyPercent;

      const graceDays = (seriesGrace !== undefined && seriesGrace !== null)
        ? seriesGrace
        : (rateRes.data.data?.lateFineGraceDays ?? 15);

      const dailyPercent = (seriesDailyPercent !== undefined && seriesDailyPercent !== null)
        ? seriesDailyPercent
        : (rateRes.data.data?.lateFineDailyPercent ?? 0.05);

      setGracePeriod(graceDays);
      setLateFineDailyPercent(dailyPercent);

      const instRes = await api.get(`/plots/bookings/${bookingId}/installments`);
      if (currentReqId !== activeSelectRequestId.current) return;

      const fetchedInsts = instRes.data.data || [];
      setInstallments(fetchedInsts);

      const firstUnpaid = fetchedInsts.find((i) => i.status !== 'PAID');
      if (firstUnpaid) {
        setSelectedInstIds([firstUnpaid._id]);
        const principalDue = firstUnpaid.dueAmount - firstUnpaid.paidAmount;
        const fine = getLateFine(firstUnpaid, graceDays, null, dailyPercent);
        setForm((f) => ({ ...f, amountPaid: String(principalDue + fine), lateFineRebate: '' }));
      } else {
        setForm((f) => ({ ...f, amountPaid: String(b.remainingAmount || 0), lateFineRebate: '' }));
      }
    } catch {
      if (currentReqId === activeSelectRequestId.current) {
        toast.error('Failed to load booking installment schedule');
      }
    } finally {
      if (currentReqId === activeSelectRequestId.current) {
        setDetailsLoading(false);
      }
    }
  };

  const handleCollectionDateChange = (newDate) => {
    setForm((f) => {
      const updatedForm = { ...f, createdAt: newDate };
      if (selectedBooking?.scheme === 'MONTHLY_INSTALLMENT') {
        const totalCalculated = installments
          .filter((i) => selectedInstIds.includes(i._id))
          .reduce((sum, i) => {
            const p = i.dueAmount - i.paidAmount;
            const fVal = getLateFine(i, gracePeriod, newDate);
            return sum + p + fVal;
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
      updated = selectedInstIds.filter((id) => id !== inst._id);
    } else {
      updated = [...selectedInstIds, inst._id];
    }
    setSelectedInstIds(updated);

    const totalCalculated = installments
      .filter((i) => updated.includes(i._id))
      .reduce((sum, i) => {
        const p = i.dueAmount - i.paidAmount;
        const fVal = getLateFine(i, gracePeriod, form.createdAt);
        return sum + p + fVal;
      }, 0);

    setForm((f) => ({ ...f, amountPaid: totalCalculated > 0 ? String(totalCalculated) : '' }));
  };

  const getSelectedLateFineTotal = () => {
    return installments
      .filter((i) => selectedInstIds.includes(i._id))
      .reduce((sum, i) => sum + getLateFine(i, gracePeriod, form.createdAt), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return toast.error('Select a booking contract');
    if (!form.amountPaid || Number(form.amountPaid) <= 0) return toast.error('Enter a valid collection amount');

    if (form.paymentMode === 'cheque') {
      const cleanCheque = (form.transactionReference || '').trim();
      if (!/^\d{6}$/.test(cleanCheque)) {
        return toast.error('Cheque number must be exactly 6 numeric digits (e.g. 045123)');
      }
    }

    setSubmitLoading(true);
    try {
      const payload = {
        amountPaid: Number(form.amountPaid),
        lateFineRebate: Number(form.lateFineRebate) || 0,
        paymentMode: form.paymentMode,
        transactionReference: form.paymentMode === 'cash' ? '' : form.transactionReference.trim(),
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
    if (editForm.paymentMode === 'cheque') {
      const cleanCheque = (editForm.transactionReference || '').trim();
      if (!/^\d{6}$/.test(cleanCheque)) {
        return toast.error('Cheque number must be exactly 6 numeric digits (e.g. 045123)');
      }
    }

    setEditLoading(true);
    try {
      await api.put(`/plots/receipts/${editingReceipt._id}`, {
        amount: Number(editForm.amount),
        lateFineRebate: Number(editForm.lateFineRebate) || 0,
        paymentMode: editForm.paymentMode,
        transactionReference: editForm.paymentMode === 'cash' ? '' : editForm.transactionReference.trim(),
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

  const handleApproveSubmit = async () => {
    if (!approvingReceipt) return;
    setActionLoading(true);
    try {
      await api.put(`/plots/receipts/${approvingReceipt._id}/approve`);
      toast.success(`Receipt #${approvingReceipt.receiptNumber} approved & realized into ledger`);
      setApprovingReceipt(null);
      fetchReceipts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingReceipt) return;
    setActionLoading(true);
    try {
      await api.put(`/plots/receipts/${rejectingReceipt._id}/reject`, { reason: rejectionReason });
      toast.success(`Receipt #${rejectingReceipt.receiptNumber} marked as REJECTED`);
      setRejectingReceipt(null);
      setRejectionReason('');
      fetchReceipts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingReceipt) return;
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

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const receiptStatus = (r.status || 'APPROVED').toUpperCase();
      if (statusFilter !== 'ALL' && receiptStatus !== statusFilter) return false;
      if (paymentTypeFilter !== 'ALL' && r.receiptType !== paymentTypeFilter) return false;
      if (paymentModeFilter !== 'ALL' && r.paymentMode !== paymentModeFilter) return false;

      if (!query) return true;

      const bookingNo = (r.bookingId?.bookingNumber || '').toLowerCase();
      const plotNo = (r.bookingId?.plotId?.plotNumber || '').toLowerCase();
      const customerName = (r.bookingId?.customerId?.name || '').toLowerCase();
      const receiptType = (r.receiptType || '').toLowerCase();
      const paymentMode = (r.paymentMode || '').toLowerCase();
      const txRef = (r.transactionReference || '').toLowerCase();

      return (
        bookingNo.includes(query) ||
        plotNo.includes(query) ||
        customerName.includes(query) ||
        receiptType.includes(query) ||
        paymentMode.includes(query) ||
        txRef.includes(query)
      );
    });
  }, [receipts, searchQuery, statusFilter, paymentTypeFilter, paymentModeFilter]);

  const receiptColumns = useMemo(
    () =>
      getReceiptColumns({
        navigate,
        setApprovingReceipt,
        setRejectingReceipt,
        setRejectionReason,
        handleEditClick,
        setDeletingReceipt,
      }),
    [navigate]
  );

  if (loading) {
    return (
      <PageLoader
        title="Loading Collections Ledger..."
        subtitle="Fetching payment receipts, installment schedules & transactions"
      />
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {view === 'list' ? 'Installment Collections & Receipts' : 'Record Installment Collection'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {view === 'list'
              ? 'View collections ledger history and print payment vouchers/receipts.'
              : 'Record and process incoming monthly installments for active plot contracts.'}
          </p>
        </div>
        <div>
          {view === 'list' ? (
            <Button variant="primary" size="md" startIcon={Plus} onClick={() => setView('add')}>
              Add Collection
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              startIcon={ArrowLeft}
              onClick={() => {
                setView('list');
                setSelectedBooking(null);
                setInstallments([]);
                setSelectedInstIds([]);
                setForm({
                  amountPaid: '',
                  paymentMode: 'cash',
                  transactionReference: '',
                  remarks: '',
                  createdAt: new Date().toISOString().split('T')[0],
                });
              }}
            >
              Back to Collections
            </Button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 border border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition min-w-[150px]"
                >
                  <option value="ALL">All Statuses ({receipts.length})</option>
                  <option value="PENDING">
                    Pending Approval ({receipts.filter((r) => (r.status || 'APPROVED').toUpperCase() === 'PENDING').length})
                  </option>
                  <option value="APPROVED">
                    Approved ({receipts.filter((r) => (r.status || 'APPROVED').toUpperCase() === 'APPROVED').length})
                  </option>
                  <option value="REJECTED">
                    Rejected ({receipts.filter((r) => (r.status || 'APPROVED').toUpperCase() === 'REJECTED').length})
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Payment Type</label>
                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition min-w-[160px]"
                >
                  <option value="ALL">All Payment Types</option>
                  <option value="INSTALLMENT">Monthly Installments</option>
                  <option value="DOWNPAYMENT">Down Payment</option>
                  <option value="FULL_PAYMENT">Full Payment</option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Payment Mode</label>
                <select
                  value={paymentModeFilter}
                  onChange={(e) => setPaymentModeFilter(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition min-w-[150px]"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="neft_rtgs">NEFT / RTGS</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-0.5 w-full lg:max-w-xs">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Search</label>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Search Booking, Plot #, Customer..."
                  className="w-full h-10 pl-9 pr-9 bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none rounded-xl font-medium text-xs text-slate-800 transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            </div>
          </div>

          {/* DataTable */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
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
                <div className="p-8 text-center text-slate-400 italic text-xs font-medium">
                  {receipts.length === 0 ? 'No receipt records found.' : 'No matching records found.'}
                </div>
              }
            />
          </div>
        </div>
      ) : (
        <ReceivePaymentForm
          handleSubmit={handleSubmit}
          bookings={bookings}
          selectedBooking={selectedBooking}
          handleBookingSelect={handleBookingSelect}
          detailsLoading={detailsLoading}
          installments={installments}
          selectedInstIds={selectedInstIds}
          handleCheckboxToggle={handleCheckboxToggle}
          getLateFine={getLateFine}
          getLateDays={getLateDays}
          gracePeriod={gracePeriod}
          getSelectedLateFineTotal={getSelectedLateFineTotal}
          form={form}
          setForm={setForm}
          handleCollectionDateChange={handleCollectionDateChange}
          submitLoading={submitLoading}
        />
      )}

      {/* Modals */}
      <EditReceiptModal
        editingReceipt={editingReceipt}
        onClose={() => setEditingReceipt(null)}
        onSubmit={handleEditSubmit}
        editForm={editForm}
        setEditForm={setEditForm}
        editLoading={editLoading}
      />

      <ApproveReceiptModal
        approvingReceipt={approvingReceipt}
        onClose={() => setApprovingReceipt(null)}
        onSubmit={handleApproveSubmit}
        actionLoading={actionLoading}
      />

      <RejectReceiptModal
        rejectingReceipt={rejectingReceipt}
        onClose={() => setRejectingReceipt(null)}
        onSubmit={handleRejectSubmit}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        actionLoading={actionLoading}
      />

      <DeleteReceiptModal
        deletingReceipt={deletingReceipt}
        onClose={() => setDeletingReceipt(null)}
        onSubmit={handleDeleteSubmit}
        deleteLoading={deleteLoading}
      />
    </div>
  );
};

export default InstallmentCollection;
