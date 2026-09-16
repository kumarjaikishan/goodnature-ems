import { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import PageLoader from '../../../components/common/PageLoader';
import Button from '@/components/ui/Button';
import { Plus, ArrowLeft, Search } from 'lucide-react';

import { getReceiptColumns } from './components/ReceiptColumns';
import ReceivePaymentForm from './components/ReceivePaymentForm';
import {
  EditReceiptModal,
  ApproveReceiptModal,
  RejectReceiptModal,
  DeleteReceiptModal,
} from './components/CollectionModals';

const InstallmentCollection = ({ type }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = type || (location.pathname.includes('/collections/downpayment') ? 'DOWNPAYMENT' : location.pathname.includes('/collections/emi') ? 'EMI' : 'ALL');

  const customStyles = useCustomStyles();
  const [view, setView] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [selectedInstIds, setSelectedInstIds] = useState([]);
  const [dpGracePeriod, setDpGracePeriod] = useState(15);
  const [emiGracePeriod, setEmiGracePeriod] = useState(15);
  const [lateFineFrequency, setLateFineFrequency] = useState('YEARLY');
  const [lateFineRate, setLateFineRate] = useState(24);
  const [lateFineDailyPercent, setLateFineDailyPercent] = useState(24 / 365);
  const [searchQuery, setSearchQuery] = useState('');

  const getLateFine = (inst, customGrace = null, customDate = null, fineDailyPercent = lateFineDailyPercent) => {
    if (!inst || !inst.dueDate) return 0;
    if (inst.status === 'PAID') return inst.lateFine || 0;

    const resolvedGrace = customGrace !== null
      ? customGrace
      : (inst.installmentNumber === 0 || selectedBooking?.scheme === 'FULL_PAYMENT' ? dpGracePeriod : emiGracePeriod);

    const dateStr = customDate || form?.createdAt;
    const payDate = dateStr ? new Date(dateStr) : new Date();
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    const rate = (Number(fineDailyPercent) || (24 / 365)) / 100;
    const principal = Math.max(0, inst.dueAmount - (inst.paidAmount || 0));

    let newlyAccruedFine = 0;
    if (!inst.paidDate || !inst.paidAmount) {
      // First collection: calculate from dueDate with grace period
      const due = new Date(inst.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > resolvedGrace) {
        newlyAccruedFine = Math.round(principal * rate * diffDays);
      }
    } else {
      // Subsequent collection on partially paid installment: calculate incremental fine since last payment date
      const lastPaid = new Date(inst.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        newlyAccruedFine = Math.round(principal * rate * diffDays);
      }
    }

    const storedUnpaidFine = Math.max(0, (inst.lateFine || 0) - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
    return storedUnpaidFine + newlyAccruedFine;
  };

  const getLateDays = (inst, customGrace = null, customDate = null) => {
    if (!inst || !inst.dueDate) return 0;
    if (inst.status === 'PAID') return inst.lateDays || 0;

    const resolvedGrace = customGrace !== null
      ? customGrace
      : (inst.installmentNumber === 0 || selectedBooking?.scheme === 'FULL_PAYMENT' ? dpGracePeriod : emiGracePeriod);

    const dateStr = customDate || form?.createdAt;
    const payDate = dateStr ? new Date(dateStr) : new Date();
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth(), payDate.getDate());

    if (!inst.paidDate || !inst.paidAmount) {
      const due = new Date(inst.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > resolvedGrace) {
        return diffDays;
      }
      return 0;
    } else {
      const lastPaid = new Date(inst.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
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
  // Fetch receipts and rate config
  const fetchRateConfig = async () => {
    try {
      const res = await api.get('/plots/rate-config');
      const rateData = res.data?.data || {};
      const dpGrace = rateData.dpGracePeriodDays ?? rateData.lateFineGraceDays ?? 15;
      const emiGrace = rateData.emiGracePeriodDays ?? rateData.lateFineGraceDays ?? 15;
      const freq = rateData.lateFineFrequency || 'YEARLY';
      const rate = rateData.lateFineRate !== undefined && rateData.lateFineRate !== null ? Number(rateData.lateFineRate) : 24;
      let dailyPercent = rateData.lateFineDailyPercent;
      if (dailyPercent === undefined || dailyPercent === null) {
        if (freq === 'YEARLY') dailyPercent = rate / 365;
        else if (freq === 'MONTHLY') dailyPercent = rate / 30;
        else dailyPercent = rate;
      }
      setDpGracePeriod(dpGrace);
      setEmiGracePeriod(emiGrace);
      setLateFineFrequency(freq);
      setLateFineRate(rate);
      setLateFineDailyPercent(dailyPercent);
    } catch {
      // Fallback to defaults
    }
  };

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
    fetchRateConfig();
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

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const remaining = Number(b.remainingAmount) || 0;
      if (remaining <= 0) return false;

      const netValue = Math.max(0, (Number(b.plotValue) || 0) - (Number(b.discount) || 0));
      const paidSoFar = netValue - remaining;
      const dpTarget = Number(b.downpaymentAmount) || Number(b.bookingAmount) || 0;
      const isDpDone = dpTarget <= 0 || paidSoFar >= dpTarget;

      if (mode === 'DOWNPAYMENT') {
        return b.scheme === 'FULL_PAYMENT' || !isDpDone;
      }
      if (mode === 'EMI') {
        return b.scheme === 'MONTHLY_INSTALLMENT' && isDpDone;
      }
      return true;
    });
  }, [bookings, mode]);

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

      const rateData = rateRes.data?.data || {};
      const resolvedDpGrace = rateData.dpGracePeriodDays ?? rateData.lateFineGraceDays ?? 15;
      const resolvedEmiGrace = rateData.emiGracePeriodDays ?? rateData.lateFineGraceDays ?? 15;
      const resolvedFreq = rateData.lateFineFrequency || 'YEARLY';
      const resolvedRate = rateData.lateFineRate !== undefined && rateData.lateFineRate !== null
        ? Number(rateData.lateFineRate)
        : 24;

      let dailyPercent = rateData.lateFineDailyPercent;
      if (dailyPercent === undefined || dailyPercent === null) {
        if (resolvedFreq === 'YEARLY') {
          dailyPercent = resolvedRate / 365;
        } else if (resolvedFreq === 'MONTHLY') {
          dailyPercent = resolvedRate / 30;
        } else {
          dailyPercent = resolvedRate;
        }
      }

      setDpGracePeriod(resolvedDpGrace);
      setEmiGracePeriod(resolvedEmiGrace);
      setLateFineFrequency(resolvedFreq);
      setLateFineRate(resolvedRate);
      setLateFineDailyPercent(dailyPercent);

      const instRes = await api.get(`/plots/bookings/${bookingId}/installments`);
      if (currentReqId !== activeSelectRequestId.current) return;

      const fetchedInsts = instRes.data.data || [];
      let targetInsts = fetchedInsts;
      if (mode === 'DOWNPAYMENT') {
        targetInsts = fetchedInsts.filter(i => i.installmentNumber === 0 || b?.scheme === 'FULL_PAYMENT');
      } else if (mode === 'EMI') {
        targetInsts = fetchedInsts.filter(i => i.installmentNumber > 0);
      }
      setInstallments(targetInsts);

      const firstUnpaid = targetInsts.find((i) => i.status !== 'PAID');
      if (firstUnpaid) {
        setSelectedInstIds([firstUnpaid._id]);
        const principalDue = firstUnpaid.dueAmount - firstUnpaid.paidAmount;
        const targetGrace = (firstUnpaid.installmentNumber === 0 || b?.scheme === 'FULL_PAYMENT') ? resolvedDpGrace : resolvedEmiGrace;
        const fine = getLateFine(firstUnpaid, targetGrace, form.createdAt, dailyPercent);
        setForm((f) => ({ ...f, amountPaid: String(principalDue + fine), lateFineRebate: '' }));
      } else {
        setForm((f) => ({ ...f, amountPaid: String(b?.remainingAmount || 0), lateFineRebate: '' }));
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
      if (installments && installments.length > 0) {
        let targetInsts = [];
        if (mode === 'DOWNPAYMENT') {
          targetInsts = installments.filter((i) => i.installmentNumber === 0 || selectedBooking?.scheme === 'FULL_PAYMENT');
        } else if (mode === 'EMI') {
          const firstUnpaid = installments.find((i) => i.installmentNumber > 0 && i.status !== 'PAID') || installments.find((i) => i.installmentNumber > 0);
          targetInsts = firstUnpaid ? [firstUnpaid] : [];
        } else {
          targetInsts = installments.filter((i) => selectedInstIds.includes(i._id));
        }

        const totalCalculated = targetInsts.reduce((sum, i) => {
          const p = Math.max(0, i.dueAmount - (i.paidAmount || 0));
          const fVal = getLateFine(i, null, newDate);
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
        const p = Math.max(0, i.dueAmount - (i.paidAmount || 0));
        const fVal = getLateFine(i, null, form.createdAt);
        return sum + p + fVal;
      }, 0);

    setForm((f) => ({ ...f, amountPaid: totalCalculated > 0 ? String(totalCalculated) : '' }));
  };

  const getSelectedLateFineTotal = () => {
    if (mode === 'DOWNPAYMENT') {
      const dpInst = installments?.find((i) => i.installmentNumber === 0) || (installments && installments[0]);
      return dpInst ? getLateFine(dpInst, dpGracePeriod, form.createdAt) : 0;
    }
    if (mode === 'EMI') {
      const activeEmi = installments?.find((i) => i.installmentNumber > 0 && i.status !== 'PAID') || installments?.find((i) => i.installmentNumber > 0);
      return activeEmi ? getLateFine(activeEmi, emiGracePeriod, form.createdAt) : 0;
    }
    return installments
      .filter((i) => selectedInstIds.includes(i._id))
      .reduce((sum, i) => sum + getLateFine(i, null, form.createdAt), 0);
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

    if (mode === 'DOWNPAYMENT') {
      const dpInst = installments?.find((i) => i.installmentNumber === 0) || (installments && installments[0]);
      const dpPrincipalDue = dpInst ? Math.max(0, dpInst.dueAmount - dpInst.paidAmount) : 0;
      const dpFine = dpInst ? getLateFine(dpInst, dpGracePeriod, form.createdAt) : 0;
      const netFine = Math.max(0, dpFine - (Number(form.lateFineRebate) || 0));
      const maxAllowed = dpPrincipalDue + netFine;

      if (Number(form.amountPaid) > maxAllowed && maxAllowed > 0) {
        return toast.error(
          `Maximum allowed downpayment collection is ₹${maxAllowed.toLocaleString('en-IN')}. Please collect EMI installments from the EMI page.`
        );
      }
    }

    setSubmitLoading(true);
    try {
      let targetIds = selectedInstIds;
      if (mode === 'DOWNPAYMENT') {
        const dpInst = installments?.find((i) => i.installmentNumber === 0) || (installments && installments[0]);
        if (dpInst) targetIds = [dpInst._id];
      }

      const payload = {
        amountPaid: Number(form.amountPaid),
        lateFineRebate: Number(form.lateFineRebate) || 0,
        paymentMode: form.paymentMode,
        transactionReference: form.paymentMode === 'cash' ? '' : form.transactionReference.trim(),
        remarks: form.remarks,
        installmentIds: targetIds,
        selectedInstallmentIds: targetIds,
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

      // Mode-level filtering for Downpayment vs EMI
      if (mode === 'DOWNPAYMENT') {
        if (r.receiptType !== 'DOWNPAYMENT' && r.receiptType !== 'FULL_PAYMENT') return false;
      } else if (mode === 'EMI') {
        if (r.receiptType !== 'INSTALLMENT') return false;
      }

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
  }, [receipts, searchQuery, statusFilter, paymentTypeFilter, paymentModeFilter, mode]);

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

  const pageTitle = mode === 'DOWNPAYMENT'
    ? (view === 'list' ? 'Downpayment Collections & Receipts' : 'Record Downpayment Collection')
    : mode === 'EMI'
    ? (view === 'list' ? 'EMI Collections & Receipts' : 'Record EMI Installment Collection')
    : (view === 'list' ? 'Installment Collections & Receipts' : 'Record Installment Collection');

  const pageSubtitle = mode === 'DOWNPAYMENT'
    ? (view === 'list' ? 'View initial downpayment receipts and print payment vouchers.' : 'Record and process downpayments for active plot contracts.')
    : mode === 'EMI'
    ? (view === 'list' ? 'View EMI receipts and print payment vouchers.' : 'Record and process monthly/quarterly EMI installments for active plot contracts with completed downpayment.')
    : (view === 'list' ? 'View collections ledger history and print payment vouchers/receipts.' : 'Record and process incoming monthly installments for active plot contracts.');

  const addBtnLabel = mode === 'DOWNPAYMENT' ? 'Add Downpayment' : mode === 'EMI' ? 'Add EMI' : 'Add Collection';

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
          <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
          <p className="text-slate-500 text-xs mt-0.5">{pageSubtitle}</p>
        </div>
        <div>
          {view === 'list' ? (
            <Button variant="primary" size="md" startIcon={Plus} onClick={() => setView('add')}>
              {addBtnLabel}
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
          bookings={filteredBookings}
          selectedBooking={selectedBooking}
          handleBookingSelect={handleBookingSelect}
          detailsLoading={detailsLoading}
          installments={installments}
          selectedInstIds={selectedInstIds}
          handleCheckboxToggle={handleCheckboxToggle}
          getLateFine={getLateFine}
          getLateDays={getLateDays}
          dpGracePeriod={dpGracePeriod}
          emiGracePeriod={emiGracePeriod}
          lateFineFrequency={lateFineFrequency}
          lateFineRate={lateFineRate}
          lateFineDailyPercent={lateFineDailyPercent}
          getSelectedLateFineTotal={getSelectedLateFineTotal}
          form={form}
          setForm={setForm}
          handleCollectionDateChange={handleCollectionDateChange}
          submitLoading={submitLoading}
          mode={mode}
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
