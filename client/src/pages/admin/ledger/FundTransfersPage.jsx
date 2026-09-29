import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import { confirmDialog } from "../../../utils/confirmDialog";
import Modalbox from "../../../components/custommodal/Modalbox";
import PageLoader from "../../../components/common/PageLoader";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  UploadCloud,
  FileText,
  Landmark,
  Wallet,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Eye
} from "lucide-react";

export default function FundTransfersPage() {
  const userState = useSelector((state) => state.user || {});
  const currentUser = userState.profile || userState.user || userState || {};
  const currentUserId = String(currentUser._id || currentUser.id || "");
  const currentUserRole = String(currentUser.role || "").toLowerCase();
  const isSuperAdmin = ['superadmin', 'admin', 'developer', 'grant'].includes(currentUserRole);

  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    totalApprovedAmount: 0,
    totalApprovedCount: 0,
    totalPendingAmount: 0,
    totalPendingCount: 0
  });

  const [statusTab, setStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [treasuryLedgers, setTreasuryLedgers] = useState({ bankLedgers: [], cashLedgers: [] });
  const [myCashAccount, setMyCashAccount] = useState(null);

  // Initiate Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromLedgerId, setFromLedgerId] = useState("");
  const [toLedgerId, setToLedgerId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferMode, setTransferMode] = useState("CASH_DEPOSIT");
  const [referenceNo, setReferenceNo] = useState("");
  const [narration, setNarration] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [depositSlipFile, setDepositSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reject Reason Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Slip Preview Modal State
  const [previewSlipUrl, setPreviewSlipUrl] = useState(null);

  useEffect(() => {
    fetchTransfers();
    fetchStats();
    fetchTreasury();
  }, [statusTab]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await apiClient({
        url: `ledger/transfers?status=${statusTab}&search=${searchQuery}`
      });
      setTransfers(res.transfers || []);
    } catch (err) {
      console.error("Error fetching transfers:", err);
      toast.error("Failed to load transfer records");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient({ url: "ledger/transfers/stats" });
      setStats(res);
    } catch (err) {}
  };

  const fetchTreasury = async () => {
    try {
      const [res, myCashRes] = await Promise.all([
        apiClient({ url: "ledger/treasury" }),
        apiClient({ url: "ledger/my-cash-account" }).catch(() => null)
      ]);
      const bList = res?.bankLedgers || res?.bankAccounts || [];
      const cList = res?.cashLedgers || res?.cashAccounts || [];
      setTreasuryLedgers({
        bankLedgers: bList,
        cashLedgers: cList
      });

      const myCash = myCashRes?.data || myCashRes || null;
      if (myCash && myCash._id) {
        setMyCashAccount(myCash);
      }
    } catch (err) {}
  };

  const activeMyCash =
    myCashAccount ||
    treasuryLedgers.cashLedgers.find(
      (c) => String(c.assignedUserId?._id || c.assignedUserId) === currentUserId
    ) ||
    treasuryLedgers.cashLedgers[0] ||
    null;

  const handleOpenTransferModal = () => {
    const myCash = activeMyCash;
    if (myCash) {
      setFromLedgerId(myCash._id);
    } else if (treasuryLedgers.bankLedgers.length > 0) {
      setFromLedgerId(treasuryLedgers.bankLedgers[0]._id);
    }

    if (treasuryLedgers.bankLedgers.length > 0) {
      setToLedgerId(treasuryLedgers.bankLedgers[0]._id);
    } else if (treasuryLedgers.cashLedgers.length > 0) {
      const otherCash = treasuryLedgers.cashLedgers.find((c) => c._id !== myCash?._id);
      setToLedgerId(otherCash?._id || treasuryLedgers.cashLedgers[0]._id);
    }

    setAmount("");
    setTransferMode("CASH_DEPOSIT");
    setReferenceNo("");
    setNarration("");
    setDepositSlipFile(null);
    setTransferDate(new Date().toISOString().slice(0, 10));
    setTransferModalOpen(true);
  };

  const selectedFromLedger =
    [...treasuryLedgers.cashLedgers, ...treasuryLedgers.bankLedgers].find((l) => l._id === fromLedgerId) ||
    (activeMyCash?._id === fromLedgerId ? activeMyCash : null);

  const availableSourceBal = selectedFromLedger
    ? Number(selectedFromLedger.availableBalance !== undefined ? selectedFromLedger.availableBalance : selectedFromLedger.balance) || 0
    : 0;

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) {
      return toast.warn("Please enter a valid transfer amount");
    }
    if (!fromLedgerId || !toLedgerId) {
      return toast.warn("Please select both source and destination accounts");
    }
    if (fromLedgerId === toLedgerId) {
      return toast.warn("Source and Destination accounts cannot be the same");
    }
    if (amtNum > availableSourceBal) {
      return toast.error(
        `Amount ₹${amtNum.toLocaleString("en-IN")} exceeds available balance of ₹${availableSourceBal.toLocaleString("en-IN")}`
      );
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("fromLedgerId", fromLedgerId);
      formData.append("toLedgerId", toLedgerId);
      formData.append("amount", amtNum);
      formData.append("transferMode", transferMode);
      formData.append("referenceNo", referenceNo);
      formData.append("narration", narration);
      formData.append("transferDate", transferDate);
      if (depositSlipFile) {
        formData.append("depositSlip", depositSlipFile);
      }

      const res = await apiClient({
        url: "ledger/transfers",
        method: "POST",
        body: formData
      });

      toast.success(res.message || "Transfer request submitted successfully");
      setTransferModalOpen(false);
      fetchTransfers();
      fetchStats();
      fetchTreasury();
    } catch (err) {
      console.error("Submit transfer error:", err);
      toast.error(err.message || "Failed to submit transfer request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (transfer) => {
    const proceed = await confirmDialog({
      title: `Approve Fund Transfer ${transfer.transferNo}?`,
      text: `Confirm transfer of ₹${(transfer.amount || 0).toLocaleString(
        "en-IN"
      )} from ${transfer.fromLedgerId?.name} to ${transfer.toLedgerId?.name}. This will debit the source ledger and credit the destination ledger immediately.`,
      confirmText: "Approve & Transfer",
      cancelText: "Cancel",
      isDanger: false
    });

    if (!proceed) return;

    try {
      const res = await apiClient({
        url: `ledger/transfers/${transfer._id}/approve`,
        method: "PUT",
        body: {}
      });

      toast.success(res.message || "Transfer approved successfully");
      fetchTransfers();
      fetchStats();
      fetchTreasury();
    } catch (err) {
      console.error("Approve transfer error:", err);
      toast.error(err.message || "Failed to approve transfer");
    }
  };

  const handleOpenReject = (transfer) => {
    setSelectedTransfer(transfer);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      return toast.warn("Please enter a rejection reason");
    }

    try {
      setRejecting(true);
      const res = await apiClient({
        url: `ledger/transfers/${selectedTransfer._id}/reject`,
        method: "PUT",
        body: { reason: rejectReason.trim() }
      });

      toast.success(res.message || "Transfer request rejected");
      setRejectModalOpen(false);
      fetchTransfers();
      fetchStats();
      fetchTreasury();
    } catch (err) {
      toast.error(err.message || "Failed to reject transfer");
    } finally {
      setRejecting(false);
    }
  };

  const handleCancel = async (transfer) => {
    const proceed = await confirmDialog({
      title: `Cancel Transfer Request ${transfer.transferNo}?`,
      text: "This will unlock the held balance in your cash ledger.",
      confirmText: "Yes, Cancel",
      cancelText: "Back",
      isDanger: true
    });

    if (!proceed) return;

    try {
      const res = await apiClient({
        url: `ledger/transfers/${transfer._id}/cancel`,
        method: "PUT"
      });

      toast.success(res.message || "Transfer request cancelled");
      fetchTransfers();
      fetchStats();
      fetchTreasury();
    } catch (err) {
      toast.error(err.message || "Failed to cancel transfer");
    }
  };

  const isSuperOrAdmin = isSuperAdmin || ["superadmin", "admin", "developer", "grant"].includes(currentUserRole);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-700 text-white rounded-xl shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Inter-Account Fund Transfers
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Dual-approval Maker-Checker transfers between Cashiers, Petty Cash and Corporate Banks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={handleOpenTransferModal}
          >
            Initiate Transfer Request
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Approvals */}
        <div
          onClick={() => setStatusTab("PENDING")}
          className={`rounded-2xl p-5 shadow-xs transition-all cursor-pointer border ${
            statusTab === "PENDING"
              ? "bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Pending Verification
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 animate-pulse">
              {stats.pendingCount || 0}
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-950 mt-2 tracking-tight">
            ₹ {(stats.totalPendingAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">
            Awaiting checker / recipient sign-off
          </p>
        </div>

        {/* Total Approved */}
        <div
          onClick={() => setStatusTab("APPROVED")}
          className={`rounded-2xl p-5 shadow-xs transition-all cursor-pointer border ${
            statusTab === "APPROVED"
              ? "bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Approved & Completed
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
              {stats.totalApprovedCount || 0}
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-950 mt-2 tracking-tight">
            ₹ {(stats.totalApprovedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-700/80 font-medium mt-0.5">
            Successfully credited into destination ledgers
          </p>
        </div>

        {/* Quick Balance Status */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
              Settlement Safeguard
            </span>
            <ShieldCheck className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-teal-100">Zero Overdraft Protection</p>
            <p className="text-[11px] text-teal-300/80 mt-0.5">
              All transfers lock in-transit amounts until checker verifies physical cash or bank deposit.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5 text-xs font-bold">
          {[
            { id: "all", label: "All Transfers" },
            { id: "PENDING", label: `Pending (${stats.pendingCount || 0})` },
            { id: "APPROVED", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
            { id: "CANCELLED", label: "Cancelled" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusTab === tab.id
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            size="sm"
            placeholder="Search transfer #, ref, narration..."
            icon={<Search size={14} className="text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Transfers Data Table */}
      {loading ? (
        <PageLoader
          title="Loading Fund Transfers..."
          subtitle="Fetching inter-account settlements and approvals"
          fullScreen={false}
        />
      ) : transfers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <ArrowRightLeft className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Fund Transfers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No transfer requests match the selected status filter. Click Initiate Transfer to send funds.
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={handleOpenTransferModal}
          >
            Initiate Transfer Request
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left">Transfer # & Date</th>
                <th className="px-5 py-3.5 text-left">From (Source)</th>
                <th className="px-5 py-3.5 text-center w-8"></th>
                <th className="px-5 py-3.5 text-left">To (Destination)</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-left">Mode & Ref</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Slip</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => {
                const isPending = t.status === "PENDING";
                const isApproved = t.status === "APPROVED";
                const isRejected = t.status === "REJECTED";
                const isCancelled = t.status === "CANCELLED";

                const canApprove =
                  isPending &&
                  (isSuperOrAdmin ||
                    String(t.toUserId?._id || t.toUserId) === currentUserId);

                const canCancel =
                  isPending &&
                  (String(t.fromUserId?._id || t.fromUserId) === currentUserId ||
                    isSuperOrAdmin);

                return (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Transfer No & Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-teal-800">{t.transferNo}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(t.transferDate || t.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        By: <span className="font-medium text-slate-600">{t.fromUserId?.name || "User"}</span>
                      </div>
                    </td>

                    {/* Source Ledger */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {t.fromLedgerId?.ledgerType === "bank" ? (
                          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                            <Landmark size={14} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Wallet size={14} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {t.fromLedgerId?.name || "Source Account"}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">
                            {t.fromLedgerId?.ledgerType === "bank" ? "Bank A/c" : "Cashier Wallet"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Arrow */}
                    <td className="px-1 py-3.5 text-center text-slate-300">
                      <ArrowRight size={14} className="mx-auto" />
                    </td>

                    {/* Destination Ledger */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {t.toLedgerId?.ledgerType === "bank" ? (
                          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                            <Landmark size={14} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Wallet size={14} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {t.toLedgerId?.name || "Destination Account"}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">
                            {t.toLedgerId?.ledgerType === "bank" ? "Bank A/c" : "Cashier Wallet"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                      ₹ {(Number(t.amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Mode & Ref */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 block w-fit">
                        {t.transferMode?.replace("_", " ") || "TRANSFER"}
                      </span>
                      {t.referenceNo && (
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Ref: {t.referenceNo}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={11} className="animate-spin" /> Pending
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle size={11} /> Rejected
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          <Ban size={11} /> Cancelled
                        </span>
                      )}

                      {/* Approver / Rejection remarks */}
                      {isApproved && t.approvedBy && (
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          By: {t.approvedBy.name}
                        </div>
                      )}
                      {isRejected && t.rejectionReason && (
                        <div className="text-[10px] text-rose-600 font-medium mt-0.5 max-w-[130px] truncate" title={t.rejectionReason}>
                          {t.rejectionReason}
                        </div>
                      )}
                    </td>

                    {/* Challan / Deposit Slip */}
                    <td className="px-5 py-3.5 text-center">
                      {t.depositSlipUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewSlipUrl(t.depositSlipUrl)}
                          className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="View Deposit Slip"
                        >
                          <Eye size={15} />
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {canApprove && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(t)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(t)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}

                        {canCancel && !canApprove && (
                          <button
                            type="button"
                            onClick={() => handleCancel(t)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        {!isPending && (
                          <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Initiate Fund Transfer ── */}
      <Modalbox
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        size="lg"
        title="Initiate Inter-Account Transfer"
      >
        <form onSubmit={handleSubmitTransfer} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Source Ledger */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                From Account (Source) <span className="text-rose-500">*</span>
              </label>
              <select
                value={fromLedgerId}
                onChange={(e) => setFromLedgerId(e.target.value)}
                required
                className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition"
              >
                {activeMyCash && (
                  <optgroup label="My Personal Cash Account">
                    <option value={activeMyCash._id}>
                      {activeMyCash.name} (Avail: ₹{(Number(activeMyCash.availableBalance !== undefined ? activeMyCash.availableBalance : activeMyCash.balance) || 0).toLocaleString("en-IN")})
                    </option>
                  </optgroup>
                )}

                {isSuperAdmin && (
                  <optgroup label="Corporate Bank Accounts">
                    {treasuryLedgers.bankLedgers.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} (Avail: ₹{(Number(b.availableBalance !== undefined ? b.availableBalance : b.balance) || 0).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </optgroup>
                )}

                {!activeMyCash && !isSuperAdmin && treasuryLedgers.cashLedgers.length > 0 && (
                  <optgroup label="Cash Accounts">
                    {treasuryLedgers.cashLedgers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} (Avail: ₹{(Number(c.availableBalance !== undefined ? c.availableBalance : c.balance) || 0).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {selectedFromLedger && (
                <p className="text-[11px] text-teal-700 font-bold mt-1">
                  Available Balance: ₹{availableSourceBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Destination Ledger */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                To Account (Destination) <span className="text-rose-500">*</span>
              </label>
              <select
                value={toLedgerId}
                onChange={(e) => setToLedgerId(e.target.value)}
                required
                className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition"
              >
                <optgroup label="Corporate Bank Accounts">
                  {treasuryLedgers.bankLedgers
                    .filter((b) => b._id !== fromLedgerId)
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.bankName || b.name} {b.accountNumber ? `(A/C: ${b.accountNumber})` : ''}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Recipient Cash Accounts">
                  {treasuryLedgers.cashLedgers
                    .filter((c) => c._id !== fromLedgerId)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transfer Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max={availableSourceBal > 0 ? availableSourceBal : undefined}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Transfer Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transfer Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={transferMode}
                onChange={(e) => setTransferMode(e.target.value)}
                className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs text-slate-800 transition"
              >
                <option value="CASH_DEPOSIT">Cash Deposit into Bank</option>
                <option value="BANK_TRANSFER">Bank to Bank Transfer (RTGS / NEFT)</option>
                <option value="CASH_HANDOVER">Cash Handover to Staff</option>
                <option value="CHEQUE">Cheque Deposit</option>
                <option value="UPI">UPI / Online Transfer</option>
                <option value="INTERNAL_TRANSFER">Internal Adjustment</option>
              </select>
            </div>

            {/* Reference No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Challan / UTR / Reference No
              </label>
              <Input
                placeholder="e.g. Bank Challan #, UTR #, Cheque #"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>

            {/* Transfer Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Date</label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
              />
            </div>

            {/* Deposit Slip / Proof Upload */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attach Bank Deposit Slip / Challan Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDepositSlipFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
            </div>

            {/* Narration */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Narration / Transfer Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cash collection deposited to Axis Bank main account"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-xs text-slate-800 transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setTransferModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              Submit Transfer Request
            </Button>
          </div>
        </form>
      </Modalbox>

      {/* ── Modal: Reject Transfer Reason ── */}
      <Modalbox
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        size="md"
        title={`Reject Transfer ${selectedTransfer?.transferNo || ""}`}
      >
        <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Amount mismatch on physical cash count, or invalid bank challan"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none p-3 rounded-xl font-medium text-xs text-slate-800 transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setRejectModalOpen(false)}
            >
              Back
            </Button>
            <Button variant="danger" size="sm" type="submit" loading={rejecting}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modalbox>

      {/* ── Modal: Preview Deposit Slip ── */}
      <Modalbox
        open={Boolean(previewSlipUrl)}
        onClose={() => setPreviewSlipUrl(null)}
        size="lg"
        title="Bank Deposit Slip / Proof"
      >
        <div className="p-6 text-center space-y-4">
          <img
            src={previewSlipUrl}
            alt="Bank Deposit Slip"
            className="max-h-[500px] w-auto mx-auto rounded-xl border border-slate-200 shadow-sm"
          />
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setPreviewSlipUrl(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modalbox>
    </div>
  );
}
