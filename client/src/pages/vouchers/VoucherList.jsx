import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import {
  Edit2, Eye, Trash2, Plus, Search, X,
  CheckCircle2, XCircle, CreditCard, Clock, FileText, Check
} from "lucide-react";
import { toast } from "../../utils/toast";
import { swal } from "../../utils/confirmDialog";
import dayjs from "dayjs";
import Input from "@/components/ui/Input";
import NumberInput from "@/components/ui/NumberInput";
import Select from "@/components/ui/Select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

const VoucherList = () => {
  const navigate = useNavigate();
  const themes = useCustomStyles();

  // Tab State: "vouchers" or "ledgers"
  const [activeTab, setActiveTab] = useState("vouchers");

  // Voucher Status Filter Tab
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "PENDING" | "APPROVED" | "PARTIALLY_PAID" | "PAID" | "REJECTED"

  const [vouchers, setVouchers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilterLedgerId, setSelectedFilterLedgerId] = useState("");
  const [selectedReferenceType, setSelectedReferenceType] = useState("all");

  // Create / Edit Voucher Modal State
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Voucher Form State
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [voucherDate, setVoucherDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [voucherAmount, setVoucherAmount] = useState("");
  const [voucherNarration, setVoucherNarration] = useState("");
  const [onlyCustomLedgers, setOnlyCustomLedgers] = useState(true); // Prioritize custom ledgers

  // Initial Payment during creation
  const [enableInitialPayment, setEnableInitialPayment] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [initialPaymentMode, setInitialPaymentMode] = useState("CASH");
  const [initialReferenceNo, setInitialReferenceNo] = useState("");

  // Approval Modal State
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [approvingVoucher, setApprovingVoucher] = useState(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [approvedLedgerId, setApprovedLedgerId] = useState("");
  const [approvedDate, setApprovedDate] = useState("");
  const [approvedNarration, setApprovedNarration] = useState("");
  const [approveDisburseAmount, setApproveDisburseAmount] = useState("0");
  const [approvePaymentMode, setApprovePaymentMode] = useState("CASH");
  const [approveReferenceNo, setApproveReferenceNo] = useState("");

  // Rejection Modal State
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectingVoucher, setRejectingVoucher] = useState(null);
  const [submittingReject, setSubmittingReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Disburse / Payment Modal State
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [payingVoucher, setPayingVoucher] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentReferenceNo, setPaymentReferenceNo] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  // Custom Ledger Management Modal State
  const [openLedgerModal, setOpenLedgerModal] = useState(false);
  const [submittingLedger, setSubmittingLedger] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [ledgerNameInput, setLedgerNameInput] = useState("");

  useEffect(() => {
    fetchVouchers();
    fetchLedgers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await apiClient({ url: "vouchers" });
      setVouchers(Array.isArray(data) ? data : (data?.list || []));
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      const data = await apiClient({ url: "ledger?view=vouchers" });
      setLedgers(data.ledgers || []);
    } catch (err) {
      console.error("Error fetching ledgers:", err);
    }
  };

  // ----------------------------------------------------
  // Voucher Operations
  // ----------------------------------------------------
  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setSelectedLedgerId("");
    setVoucherDate(dayjs().format("YYYY-MM-DD"));
    setVoucherAmount("");
    setVoucherNarration("");
    setOnlyCustomLedgers(true);
    setEnableInitialPayment(false);
    setInitialPaymentAmount("");
    setInitialPaymentMode("CASH");
    setInitialReferenceNo("");
    setOpenModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVoucher(v);

    const debitEntry = v.entries?.find(e => e.type === 'DEBIT');
    const ledgerName = debitEntry ? debitEntry.accountName : '';
    const matchingLedger = ledgers.find(l => l.name === ledgerName);

    setSelectedLedgerId(matchingLedger ? matchingLedger._id : (v.ledgerId?._id || v.ledgerId || ""));
    setVoucherDate(dayjs(v.date).format("YYYY-MM-DD"));

    const totalAmt = v.totalAmount || v.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    setVoucherAmount(totalAmt.toString());
    setVoucherNarration(v.remarks || "");
    setOnlyCustomLedgers(false);
    setEnableInitialPayment(false);
    setOpenModal(true);
  };

  const handleDeleteVoucher = async (id) => {
    swal({
      title: "Are you sure you want to Delete this voucher?",
      text: "Once deleted, the ledger entry and financial balances will be adjusted.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (proceed) => {
      if (proceed) {
        try {
          const res = await apiClient({
            url: `vouchers/${id}`,
            method: "DELETE"
          });
          toast.success(res.message || "Voucher deleted successfully");
          fetchVouchers();
        } catch (error) {
          console.error(error);
          toast.error(error.message || "Failed to delete voucher");
        }
      }
    });
  };

  const handleSubmitVoucher = async (e) => {
    e.preventDefault();

    if (!selectedLedgerId) {
      return toast.warn("Please select a ledger");
    }
    if (!voucherAmount || parseFloat(voucherAmount) <= 0) {
      return toast.warn("Please enter a valid amount greater than 0");
    }

    try {
      setSubmitting(true);
      const payload = {
        date: voucherDate,
        amount: parseFloat(voucherAmount),
        narration: voucherNarration,
        ledgerId: selectedLedgerId,
        initialPayment: enableInitialPayment ? (parseFloat(initialPaymentAmount) || 0) : 0,
        paymentMode: initialPaymentMode,
        referenceNo: initialReferenceNo,
        autoApprove: false
      };

      if (editingVoucher) {
        await apiClient({
          url: `vouchers/${editingVoucher._id}`,
          method: "PUT",
          body: payload
        });
        toast.success("Voucher updated successfully");
      } else {
        await apiClient({
          url: "vouchers",
          method: "POST",
          body: payload
        });
        toast.success("Voucher submitted for approval");
      }

      setOpenModal(false);
      fetchVouchers();
      fetchLedgers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save voucher");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Approval Operations
  // ----------------------------------------------------
  const handleOpenApprove = (v) => {
    setApprovingVoucher(v);
    const totalAmt = v.totalAmount || v.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    setApprovedAmount(totalAmt.toString());

    const debitEntry = v.entries?.find(e => e.type === 'DEBIT');
    const matchingLedger = ledgers.find(l => l.name === debitEntry?.accountName);
    setApprovedLedgerId(matchingLedger ? matchingLedger._id : (v.ledgerId?._id || v.ledgerId || ""));

    setApprovedDate(dayjs(v.date).format("YYYY-MM-DD"));
    setApprovedNarration(v.remarks || "");
    setApproveDisburseAmount("0");
    setApprovePaymentMode("CASH");
    setApproveReferenceNo("");
    setOpenApproveModal(true);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approvingVoucher) return;

    if (!approvedAmount || parseFloat(approvedAmount) <= 0) {
      return toast.warn("Please enter a valid approved amount");
    }

    const disbAmt = parseFloat(approveDisburseAmount) || 0;
    if (disbAmt > parseFloat(approvedAmount)) {
      return toast.warn("Disbursement amount cannot exceed the approved voucher total");
    }

    try {
      setSubmittingApproval(true);
      await apiClient({
        url: `vouchers/${approvingVoucher._id}/approve`,
        method: "PUT",
        body: {
          approvedAmount: parseFloat(approvedAmount),
          ledgerId: approvedLedgerId,
          date: approvedDate,
          narration: approvedNarration,
          disbursementAmount: disbAmt,
          paymentMode: approvePaymentMode,
          referenceNo: approveReferenceNo
        }
      });

      toast.success(`Voucher ${approvingVoucher.voucherNo} approved successfully`);
      setOpenApproveModal(false);
      fetchVouchers();
      fetchLedgers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to approve voucher");
    } finally {
      setSubmittingApproval(false);
    }
  };

  // ----------------------------------------------------
  // Reject Operations
  // ----------------------------------------------------
  const handleOpenReject = (v) => {
    setRejectingVoucher(v);
    setRejectionReason("");
    setOpenRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingVoucher) return;

    try {
      setSubmittingReject(true);
      await apiClient({
        url: `vouchers/${rejectingVoucher._id}/reject`,
        method: "PUT",
        body: {
          rejectionReason: rejectionReason.trim() || "Rejected by authorized manager"
        }
      });

      toast.success(`Voucher ${rejectingVoucher.voucherNo} rejected`);
      setOpenRejectModal(false);
      fetchVouchers();
      fetchLedgers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to reject voucher");
    } finally {
      setSubmittingReject(false);
    }
  };

  // ----------------------------------------------------
  // Disburse / Payment Operations
  // ----------------------------------------------------
  const handleOpenPayment = (v) => {
    setPayingVoucher(v);
    const total = v.totalAmount || v.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    const paid = Number(v.paidAmount) || 0;
    const remaining = v.remainingAmount !== undefined ? Number(v.remainingAmount) : Math.max(total - paid, 0);

    setPaymentAmount(remaining.toString());
    setPaymentDate(dayjs().format("YYYY-MM-DD"));
    setPaymentMode("CASH");
    setPaymentReferenceNo("");
    setPaymentRemarks("");
    setOpenPaymentModal(true);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payingVoucher) return;

    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) {
      return toast.warn("Please enter a payment amount greater than 0");
    }

    const total = payingVoucher.totalAmount || payingVoucher.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    const paid = Number(payingVoucher.paidAmount) || 0;
    const maxRemaining = Math.max(total - paid, 0);

    if (amt > maxRemaining) {
      return toast.warn(`Disbursement cannot exceed remaining balance (₹ ${maxRemaining.toLocaleString()})`);
    }

    try {
      setSubmittingPayment(true);
      await apiClient({
        url: `vouchers/${payingVoucher._id}/payments`,
        method: "POST",
        body: {
          amount: amt,
          paymentDate,
          paymentMode,
          referenceNo: paymentReferenceNo,
          remarks: paymentRemarks
        }
      });

      toast.success(`Disbursement of ₹ ${amt.toLocaleString()} recorded successfully`);
      setOpenPaymentModal(false);
      fetchVouchers();
      fetchLedgers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // ----------------------------------------------------
  // Custom Ledger Operations
  // ----------------------------------------------------
  const handleOpenCreateLedger = () => {
    setEditingLedger(null);
    setLedgerNameInput("");
    setOpenLedgerModal(true);
  };

  const handleOpenEditLedger = (ledger) => {
    setEditingLedger(ledger);
    setLedgerNameInput(ledger.name);
    setOpenLedgerModal(true);
  };

  const handleDeleteLedger = async (id) => {
    swal({
      title: "Are you sure you want to Delete this custom ledger?",
      text: "Warning: This will delete the ledger account and all manual entries associated with it.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (proceed) => {
      if (proceed) {
        try {
          await apiClient({
            url: `ledger/${id}`,
            method: "DELETE"
          });
          toast.success("Custom ledger deleted successfully");
          fetchLedgers();
          fetchVouchers();
        } catch (error) {
          console.error(error);
          toast.error(error.message || "Failed to delete custom ledger");
        }
      }
    });
  };

  const handleSubmitLedger = async (e) => {
    e.preventDefault();
    if (!ledgerNameInput.trim()) {
      return toast.warn("Ledger name is required");
    }

    try {
      setSubmittingLedger(true);
      const payload = {
        name: ledgerNameInput.trim(),
        isVoucherLedger: true
      };

      if (editingLedger) {
        await apiClient({
          url: `ledger/${editingLedger._id}`,
          method: "PUT",
          body: payload
        });
        toast.success("Custom ledger updated successfully");
      } else {
        await apiClient({
          url: "ledger",
          method: "POST",
          body: payload
        });
        toast.success("Custom ledger created successfully");
      }

      setOpenLedgerModal(false);
      fetchLedgers();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save custom ledger");
    } finally {
      setSubmittingLedger(false);
    }
  };

  const selectedFilterLedger = ledgers.find(l => l._id === selectedFilterLedgerId);

  // Filter vouchers based on search text and status
  const filteredVouchers = (Array.isArray(vouchers) ? vouchers : []).filter((v) => {
    const debitEntry = v.entries?.find(e => e.type === 'DEBIT');
    const ledgerName = debitEntry ? debitEntry.accountName : (v.employeeId?.userid?.name || v.ledgerId?.name || "N/A");
    const vStatus = v.status || "APPROVED";

    // Status filter
    if (statusFilter !== "all" && vStatus !== statusFilter) {
      return false;
    }

    // Search filter
    const matchesSearch =
      v.voucherNo.toLowerCase().includes(searchText.toLowerCase()) ||
      ledgerName.toLowerCase().includes(searchText.toLowerCase()) ||
      (v.remarks && v.remarks.toLowerCase().includes(searchText.toLowerCase()));

    // Reference Type filter
    const matchesRefType =
      selectedReferenceType === "all" ||
      (selectedReferenceType === "MANUAL" && v.referenceType === "MANUAL") ||
      (selectedReferenceType === "SYSTEM" && v.referenceType !== "MANUAL");

    // Ledger filter
    const matchesLedger =
      !selectedFilterLedgerId ||
      ledgerName === selectedFilterLedger?.name;

    // Date Range filter
    let matchesDate = true;
    const vDateStr = dayjs(v.date).format("YYYY-MM-DD");
    if (startDate) {
      matchesDate = matchesDate && vDateStr >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && vDateStr <= endDate;
    }

    return matchesSearch && matchesRefType && matchesLedger && matchesDate;
  });

  // Filter custom ledgers based on search text
  const customLedgers = ledgers.filter(l => l.ledgerType === 'custom');
  const filteredCustomLedgers = customLedgers.filter((l) => {
    return l.name.toLowerCase().includes(searchText.toLowerCase());
  });

  // Calculate high-level stats
  const pendingVouchersCount = vouchers.filter(v => v.status === 'PENDING').length;
  const approvedVouchersCount = vouchers.filter(v => v.status === 'APPROVED' || v.status === 'PARTIALLY_PAID').length;
  const totalAmountSum = filteredVouchers.reduce((sum, v) => {
    const amt = v.totalAmount || v.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    return sum + amt;
  }, 0);
  const totalPaidSum = filteredVouchers.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = status || "APPROVED";
    switch (s) {
      case "PENDING":
        return <Badge variant="warning" dot size="sm">Pending Approval</Badge>;
      case "APPROVED":
        return <Badge variant="info" dot size="sm">Approved (Unpaid)</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="primary" dot size="sm">Partially Paid</Badge>;
      case "PAID":
        return <Badge variant="success" dot size="sm">Fully Paid</Badge>;
      case "REJECTED":
        return <Badge variant="danger" dot size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{s}</Badge>;
    }
  };

  // Columns for Vouchers List
  const voucherColumns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "55px",
    },
    {
      name: "Voucher No",
      selector: (row) => row.voucherNo,
      cell: (row) => (
        <button
          onClick={() => navigate(`/dashboard/vouchers/${row._id}`)}
          className="font-mono text-teal-800 hover:text-teal-950 font-bold text-xs hover:underline cursor-pointer text-left"
        >
          {(row.voucherNo || "").replace(/^(GN-)?INV-/, "INV-")}
        </button>
      ),
      sortable: true,
      width: "125px"
    },
    {
      name: "Date",
      selector: (row) => row.date,
      cell: (row) => dayjs(row.date).format("DD MMM YYYY"),
      sortable: true,
      width: "105px"
    },
    {
      name: "Ledger",
      selector: (row) => {
        const debitEntry = row.entries?.find(e => e.type === 'DEBIT');
        return debitEntry ? debitEntry.accountName : (row.ledgerId?.name || row.employeeId?.userid?.name || row.sponsorId?.name || "N/A");
      },
      cell: (row) => {
        const debitEntry = row.entries?.find(e => e.type === 'DEBIT');
        const name = debitEntry ? debitEntry.accountName : (row.ledgerId?.name || row.employeeId?.userid?.name || row.sponsorId?.name || "N/A");
        const isSponsor = Boolean(row.sponsorId);
        const isEmployee = Boolean(row.employeeId);

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-xs">{name}</span>
            {isSponsor && (
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 w-fit mt-0.5 font-medium">
                Sponsor {row.sponsorId?.sponsorCode ? `(${row.sponsorId.sponsorCode})` : ''}
              </span>
            )}
            {isEmployee && (
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.2 w-fit mt-0.5 font-medium">
                Employee
              </span>
            )}
          </div>
        );
      },
      sortable: true,
      wrap: true,
      width: "160px",
    },
    {
      name: "Total Amount",
      selector: (row) => row.totalAmount || row.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0,
      cell: (row) => {
        const amt = row.totalAmount || row.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
        return <span className="font-bold text-slate-900">₹ {amt.toLocaleString()}</span>;
      },
      sortable: true,
      width: "115px"
    },
    {
      name: "Payment Status",
      selector: (row) => row.paidAmount || 0,
      cell: (row) => {
        const total = row.totalAmount || row.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
        const paid = Number(row.paidAmount) || 0;
        const remaining = row.remainingAmount !== undefined ? Number(row.remainingAmount) : Math.max(total - paid, 0);
        const status = row.status || "APPROVED";

        if (status === 'REJECTED') {
          return <span className="text-xs text-rose-600 font-medium">Cancelled</span>;
        }

        return (
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="text-emerald-700 font-semibold">Paid: ₹{paid.toLocaleString()}</span>
            {remaining > 0 && status !== 'PENDING' && (
              <span className="text-amber-700 font-medium">Due: ₹{remaining.toLocaleString()}</span>
            )}
          </div>
        );
      },
      width: "125px"
    },
    {
      name: "Status",
      selector: (row) => row.status || "APPROVED",
      cell: (row) => renderStatusBadge(row.status),
      sortable: true,
      width: "140px"
    },
    {
      name: "Narration",
      selector: (row) => row.remarks || "-",
      wrap: true
    },
    {
      name: "Actions",
      width: "160px",
      cell: (row) => {
        const isManual = row.referenceType === "MANUAL";
        const status = row.status || "APPROVED";

        return (
          <div className="flex gap-1 items-center flex-wrap">
            {/* View Details */}
            <button
              title="View Details"
              onClick={() => navigate(`/dashboard/vouchers/${row._id}`)}
              className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
            >
              <Eye size={15} />
            </button>

            {/* If PENDING: Show Approve & Reject */}
            {status === "PENDING" && (
              <>
                <button
                  title="Review & Approve"
                  onClick={() => handleOpenApprove(row)}
                  className="p-1 rounded text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                </button>
                <button
                  title="Reject Voucher"
                  onClick={() => handleOpenReject(row)}
                  className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                >
                  <XCircle size={15} />
                </button>
              </>
            )}

            {/* If APPROVED or PARTIALLY_PAID: Show Disburse Payment Button */}
            {(status === "APPROVED" || status === "PARTIALLY_PAID") && (
              <button
                title="Record / Disburse Payment"
                onClick={() => handleOpenPayment(row)}
                className="p-1 rounded text-teal-700 hover:text-teal-900 hover:bg-teal-50 transition cursor-pointer flex items-center gap-0.5 text-xs font-semibold px-1.5 bg-teal-50/80 border border-teal-200/60"
              >
                <CreditCard size={13} />
                <span>Pay</span>
              </button>
            )}

            {/* Edit / Delete for Manual Vouchers before approval or by admin */}
            {isManual && status === "PENDING" && (
              <>
                <button
                  title="Edit Voucher"
                  onClick={() => handleOpenEdit(row)}
                  className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  title="Delete Voucher"
                  onClick={() => handleDeleteVoucher(row._id)}
                  className="p-1 rounded text-slate-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Columns for Ledgers List
  const ledgerColumns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "80px",
    },
    {
      name: "Ledger Name",
      selector: (row) => row.name,
      sortable: true,
      wrap: true
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => (
        <div className="flex gap-1.5 items-center">
          <button
            title="Edit Ledger Name"
            onClick={() => handleOpenEditLedger(row)}
            className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
          >
            <Edit2 size={15} />
          </button>
          <button
            title="Delete Ledger"
            onClick={() => handleDeleteLedger(row._id)}
            className="p-1 rounded text-slate-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  // Prepare select options: Custom ledgers prioritized or all
  const availableLedgers = onlyCustomLedgers
    ? ledgers.filter(l => l.ledgerType === 'custom')
    : ledgers;

  const ledgerSelectOptions = availableLedgers.map(l => {
    const tag = l.ledgerType === 'sponsor'
      ? ` [Sponsor${l.empId ? `: ${l.empId}` : ''}]`
      : l.ledgerType === 'employee' && l.empId
        ? ` [Emp: ${l.empId}]`
        : ' [Custom]';
    return {
      label: `${l.name}${tag}`,
      value: l._id
    };
  });

  const allLedgersSelectOptions = ledgers.map(l => {
    const tag = l.ledgerType === 'sponsor'
      ? ` [Sponsor${l.empId ? `: ${l.empId}` : ''}]`
      : l.ledgerType === 'employee' && l.empId
        ? ` [Emp: ${l.empId}]`
        : ' [Custom]';
    return {
      label: `${l.name}${tag}`,
      value: l._id
    };
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-2 md:p-6 space-y-6">
      {/* Header section with Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {activeTab === "vouchers" ? "Total Vouchers" : "Total Custom Ledgers"}
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1">
            {activeTab === "vouchers" ? vouchers.length : customLedgers.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Clock size={14} /> Pending Approval
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1">
            {pendingVouchersCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Volume</span>
          <span className="text-2xl font-black text-slate-800 mt-1">₹ {totalAmountSum.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Total Disbursed</span>
          <span className="text-2xl font-black text-teal-700 mt-1">₹ {totalPaidSum.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Main Tabs System */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 pt-3 gap-3 bg-slate-50/50">
          <div className="flex gap-2">
            <button
              className={`py-2.5 px-4 font-bold border-b-2 text-sm transition-all outline-none cursor-pointer ${activeTab === "vouchers"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              onClick={() => {
                setActiveTab("vouchers");
                setSearchText("");
              }}
            >
              Vouchers List
            </button>
            <button
              className={`py-2.5 px-4 font-bold border-b-2 text-sm transition-all outline-none cursor-pointer ${activeTab === "ledgers"
                ? "border-teal-700 text-teal-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              onClick={() => {
                setActiveTab("ledgers");
                setSearchText("");
              }}
            >
              Manage Custom Ledgers
            </button>
          </div>

          <div className="pb-2">
            {activeTab === "vouchers" ? (
              <Button
                variant="primary"
                size="sm"
                startIcon={Plus}
                onClick={handleOpenCreate}
              >
                Create Voucher
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                startIcon={Plus}
                onClick={handleOpenCreateLedger}
              >
                Create Custom Ledger
              </Button>
            )}
          </div>
        </div>

        {/* Voucher Status Filter Pills (Only on Vouchers tab) */}
        {activeTab === "vouchers" && (
          <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/70 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider whitespace-nowrap">
              Status:
            </span>
            {[
              { label: "All", value: "all", count: vouchers.length },
              { label: "Pending Approval", value: "PENDING", count: pendingVouchersCount },
              { label: "Approved / Unpaid", value: "APPROVED", count: vouchers.filter(v => v.status === 'APPROVED').length },
              { label: "Partially Paid", value: "PARTIALLY_PAID", count: vouchers.filter(v => v.status === 'PARTIALLY_PAID').length },
              { label: "Fully Paid", value: "PAID", count: vouchers.filter(v => v.status === 'PAID').length },
              { label: "Rejected", value: "REJECTED", count: vouchers.filter(v => v.status === 'REJECTED').length },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === tab.value
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <Input
                size="sm"
                startIcon={Search}
                placeholder={
                  activeTab === "vouchers"
                    ? "Search Voucher No, Ledger, Narration..."
                    : "Search Custom Ledgers..."
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {activeTab === "vouchers" && (
              <div className="flex flex-wrap gap-2 items-center">
                {(startDate || endDate || selectedFilterLedgerId || selectedReferenceType !== "all" || statusFilter !== "all") && (
                  <Button
                    size="sm"
                    variant="outline"
                    startIcon={X}
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setSelectedFilterLedgerId("");
                      setSelectedReferenceType("all");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Vouchers Specific Filters */}
          {activeTab === "vouchers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <DateInput
                size="sm"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <DateInput
                size="sm"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <SearchableSelect
                size="sm"
                label="Filter by Ledger"
                options={allLedgersSelectOptions}
                placeholder="All Ledgers"
                value={selectedFilterLedgerId}
                onChange={(val) => setSelectedFilterLedgerId(val)}
                allowClear
              />
              <Select
                size="sm"
                label="Source Type"
                options={[
                  { label: "All Vouchers", value: "all" },
                  { label: "Manual Receipts", value: "MANUAL" },
                  { label: "System Generated", value: "SYSTEM" },
                ]}
                value={selectedReferenceType}
                onChange={(e) => setSelectedReferenceType(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden">
          {activeTab === "vouchers" ? (
            <DataTable
              columns={voucherColumns}
              data={filteredVouchers}
              pagination
              customStyles={themes}
              highlightOnHover
              progressPending={loading}
              progressComponent={<Loader />}
              noDataComponent={
                <div className="py-12 text-center text-slate-500 font-medium text-sm">
                  No financial vouchers found matching the criteria.
                </div>
              }
            />
          ) : (
            <DataTable
              columns={ledgerColumns}
              data={filteredCustomLedgers}
              pagination
              customStyles={themes}
              highlightOnHover
              progressPending={loading}
              progressComponent={<Loader />}
              noDataComponent={
                <div className="py-12 text-center text-slate-500 font-medium text-sm">
                  No custom ledgers found. Click "Create Custom Ledger" to start.
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT VOUCHER MODAL ── */}
      <Modal
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        title={editingVoucher ? `Edit Voucher [${editingVoucher.voucherNo}]` : "Create Financial Voucher"}
        subtitle="Custom expense voucher creation & approval submission"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitVoucher} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 tracking-wide">
              Select Ledger <span className="text-rose-500">*</span>
            </label>
            {!editingVoucher && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyCustomLedgers}
                  onChange={(e) => setOnlyCustomLedgers(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Show Custom Ledgers Only</span>
              </label>
            )}
          </div>

          <SearchableSelect
            options={ledgerSelectOptions}
            placeholder={onlyCustomLedgers ? "Select Custom Expense Ledger..." : "Select Ledger (Custom, Employee, Sponsor)..."}
            value={selectedLedgerId}
            onChange={(val) => setSelectedLedgerId(val)}
            disabled={Boolean(editingVoucher)}
            allowClear={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DateInput
              label="Voucher Date"
              required
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
            />
            <NumberInput
              label="Total Voucher Amount (₹)"
              currency
              required
              min="1"
              step="any"
              placeholder="Enter amount"
              value={voucherAmount}
              onChange={(e) => setVoucherAmount(e.target.value)}
            />
          </div>

          {/* Initial Disbursement Toggle (For New Vouchers) */}
          {!editingVoucher && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableInitialPayment}
                  onChange={(e) => {
                    setEnableInitialPayment(e.target.checked);
                    if (e.target.checked && !initialPaymentAmount) {
                      setInitialPaymentAmount(voucherAmount);
                    }
                  }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Record Immediate Partial / Full Payment Disbursement</span>
              </label>

              {enableInitialPayment && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <NumberInput
                    label="Paid Amount (₹)"
                    size="sm"
                    currency
                    min="1"
                    max={voucherAmount || undefined}
                    placeholder="Disbursed"
                    value={initialPaymentAmount}
                    onChange={(e) => setInitialPaymentAmount(e.target.value)}
                  />
                  <Select
                    label="Payment Mode"
                    size="sm"
                    options={[
                      { label: "Cash", value: "CASH" },
                      { label: "Bank Transfer", value: "BANK_TRANSFER" },
                      { label: "UPI", value: "UPI" },
                      { label: "Cheque", value: "CHEQUE" },
                    ]}
                    value={initialPaymentMode}
                    onChange={(e) => setInitialPaymentMode(e.target.value)}
                  />
                  <Input
                    label="Reference / Cheque No"
                    size="sm"
                    placeholder="Ref No."
                    value={initialReferenceNo}
                    onChange={(e) => setInitialReferenceNo(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">Narration / Particulars</label>
            <textarea
              rows={2}
              placeholder="Enter transactional particulars or remarks..."
              value={voucherNarration}
              onChange={(e) => setVoucherNarration(e.target.value)}
              className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {editingVoucher ? "Update Voucher" : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── APPROVE & EDIT VOUCHER MODAL ── */}
      <Modal
        open={openApproveModal}
        onClose={() => !submittingApproval && setOpenApproveModal(false)}
        title={approvingVoucher ? `Review & Approve Voucher [${approvingVoucher.voucherNo}]` : "Approve Voucher"}
        subtitle="Verify amount, ledger account, and optionally authorize disbursement"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleConfirmApprove} className="space-y-4">
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-teal-800 font-bold block">Voucher Authorization</span>
              <span className="text-xs text-teal-700">Review requested values and adjust if needed before approving.</span>
            </div>
          </div>

          <SearchableSelect
            label="Ledger Account"
            required
            options={allLedgersSelectOptions}
            value={approvedLedgerId}
            onChange={(val) => setApprovedLedgerId(val)}
            allowClear={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DateInput
              label="Approved Date"
              required
              value={approvedDate}
              onChange={(e) => setApprovedDate(e.target.value)}
            />
            <NumberInput
              label="Approved Total (₹)"
              currency
              required
              min="1"
              step="any"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
            />
          </div>

          {/* Optional immediate disbursement during approval */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Initial Disbursement (Optional)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumberInput
                label="Disburse Now (₹)"
                size="sm"
                currency
                min="0"
                max={approvedAmount || undefined}
                placeholder="0 for Unpaid"
                value={approveDisburseAmount}
                onChange={(e) => setApproveDisburseAmount(e.target.value)}
              />
              <Select
                label="Payment Mode"
                size="sm"
                options={[
                  { label: "Cash", value: "CASH" },
                  { label: "Bank Transfer", value: "BANK_TRANSFER" },
                  { label: "UPI", value: "UPI" },
                  { label: "Cheque", value: "CHEQUE" },
                ]}
                value={approvePaymentMode}
                onChange={(e) => setApprovePaymentMode(e.target.value)}
              />
              <Input
                label="Reference No"
                size="sm"
                placeholder="Ref / Cheque #"
                value={approveReferenceNo}
                onChange={(e) => setApproveReferenceNo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">Approval Remarks</label>
            <textarea
              rows={2}
              placeholder="Approval comments or particulars..."
              value={approvedNarration}
              onChange={(e) => setApprovedNarration(e.target.value)}
              className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenApproveModal(false)}
              disabled={submittingApproval}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              startIcon={Check}
              loading={submittingApproval}
            >
              Approve Voucher
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── REJECT VOUCHER MODAL ── */}
      <Modal
        open={openRejectModal}
        onClose={() => !submittingReject && setOpenRejectModal(false)}
        title={rejectingVoucher ? `Reject Voucher [${rejectingVoucher.voucherNo}]` : "Reject Voucher"}
        subtitle="Please provide a reason for rejecting this financial voucher"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 tracking-wide">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Enter reason for rejection (e.g., Incomplete documentation, incorrect amount)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 p-3 text-sm text-slate-800 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenRejectModal(false)}
              disabled={submittingReject}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              startIcon={XCircle}
              loading={submittingReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── RECORD PAYMENT / DISBURSEMENT MODAL ── */}
      <Modal
        open={openPaymentModal}
        onClose={() => !submittingPayment && setOpenPaymentModal(false)}
        title={payingVoucher ? `Record Payment [${payingVoucher.voucherNo}]` : "Record Voucher Payment"}
        subtitle="Disburse partial or full funds against this approved voucher"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          {payingVoucher && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Approved:</span>
                <span className="font-bold text-slate-800">
                  ₹ {(payingVoucher.totalAmount || payingVoucher.entries?.[0]?.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Paid:</span>
                <span className="font-bold text-emerald-700">
                  ₹ {(Number(payingVoucher.paidAmount) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="font-bold text-slate-700">Remaining Balance:</span>
                <span className="font-bold text-amber-700">
                  ₹ {(payingVoucher.remainingAmount !== undefined
                    ? Number(payingVoucher.remainingAmount)
                    : Math.max((payingVoucher.totalAmount || 0) - (payingVoucher.paidAmount || 0), 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput
              label="Disbursement Amount (₹)"
              currency
              required
              min="1"
              step="any"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <DateInput
              label="Payment Date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Mode"
              required
              options={[
                { label: "Cash", value: "CASH" },
                { label: "Bank Transfer", value: "BANK_TRANSFER" },
                { label: "UPI", value: "UPI" },
                { label: "Cheque", value: "CHEQUE" },
              ]}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            />
            <Input
              label="Reference / Transaction No"
              placeholder="e.g. UTR / Cheque #"
              value={paymentReferenceNo}
              onChange={(e) => setPaymentReferenceNo(e.target.value)}
            />
          </div>

          <Input
            label="Payment Remarks / Notes"
            placeholder="e.g. 2nd Installment disbursement"
            value={paymentRemarks}
            onChange={(e) => setPaymentRemarks(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPaymentModal(false)}
              disabled={submittingPayment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              startIcon={CreditCard}
              loading={submittingPayment}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── CREATE / EDIT CUSTOM LEDGER MODAL ── */}
      <Modal
        open={openLedgerModal}
        onClose={() => !submittingLedger && setOpenLedgerModal(false)}
        title={editingLedger ? "Edit Custom Ledger" : "Create Custom Ledger"}
        subtitle="Manage standalone custom expense ledger accounts"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitLedger} className="space-y-4">
          <Input
            label="Ledger Name"
            placeholder="Enter custom ledger name (e.g. Tea, Newspaper, Generator Fuel)"
            required
            value={ledgerNameInput}
            onChange={(e) => setLedgerNameInput(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenLedgerModal(false)}
              disabled={submittingLedger}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submittingLedger}
            >
              {editingLedger ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VoucherList;
