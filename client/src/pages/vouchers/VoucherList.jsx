import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import { Edit2, Eye, Trash2, Plus, Search, X } from "lucide-react";
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

  const [vouchers, setVouchers] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFilterLedgerId, setSelectedFilterLedgerId] = useState("");
  const [selectedReferenceType, setSelectedReferenceType] = useState("all");

  // Voucher Modal State
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Voucher Form State
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [voucherDate, setVoucherDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [voucherAmount, setVoucherAmount] = useState("");
  const [voucherNarration, setVoucherNarration] = useState("");

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
    setOpenModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVoucher(v);

    const debitEntry = v.entries?.find(e => e.type === 'DEBIT');
    const ledgerName = debitEntry ? debitEntry.accountName : '';
    const matchingLedger = ledgers.find(l => l.name === ledgerName);

    setSelectedLedgerId(matchingLedger ? matchingLedger._id : "");
    setVoucherDate(dayjs(v.date).format("YYYY-MM-DD"));

    const totalAmount = v.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    setVoucherAmount(totalAmount.toString());
    setVoucherNarration(v.remarks || "");
    setOpenModal(true);
  };

  const handleDeleteVoucher = async (id) => {
    swal({
      title: "Are you sure you want to Delete this voucher?",
      text: "Once deleted, the ledger entry and balance will be adjusted accordingly.",
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
        ledgerId: selectedLedgerId
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
        toast.success("Voucher created successfully");
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

  // Filter vouchers based on search text
  const filteredVouchers = (Array.isArray(vouchers) ? vouchers : []).filter((v) => {
    const debitEntry = v.entries?.find(e => e.type === 'DEBIT');
    const ledgerName = debitEntry ? debitEntry.accountName : (v.employeeId?.userid?.name || "N/A");

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
  const totalAmountSum = filteredVouchers.reduce((sum, v) => {
    const amt = v.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
    return sum + amt;
  }, 0);

  // Columns for Vouchers List
  const voucherColumns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "60px",
    },
    {
      name: "Voucher No",
      selector: (row) => row.voucherNo,
      cell: (row) => (
        <span className="font-mono text-slate-800 text-xs font-bold">
          {(row.voucherNo || "").replace(/^(GN-)?INV-/, "INV-")}
        </span>
      ),
      sortable: true,
      width: "140px"
    },
    {
      name: "Date",
      selector: (row) => row.date,
      cell: (row) => dayjs(row.date).format("DD MMM YYYY"),
      sortable: true,
      width: "110px"
    },
    {
      name: "Ledger",
      selector: (row) => {
        const debitEntry = row.entries?.find(e => e.type === 'DEBIT');
        return debitEntry ? debitEntry.accountName : (row.employeeId?.userid?.name || row.sponsorId?.name || "N/A");
      },
      cell: (row) => {
        const debitEntry = row.entries?.find(e => e.type === 'DEBIT');
        const name = debitEntry ? debitEntry.accountName : (row.employeeId?.userid?.name || row.sponsorId?.name || "N/A");
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
      width: "180px",
    },
    {
      name: "Amount",
      selector: (row) => {
        return row.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
      },
      cell: (row) => {
        const amt = row.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
        return <span className="font-bold text-slate-900">₹ {amt.toLocaleString()}</span>;
      },
      sortable: true,
      width: "110px"
    },
    {
      name: "Narration",
      selector: (row) => row.remarks || "-",
      wrap: true
    },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => {
        const isManual = row.referenceType === "MANUAL";
        return (
          <div className="flex gap-1.5 items-center">
            <button
              title="View Details"
              onClick={() => navigate(`/dashboard/vouchers/${row._id}`)}
              className="p-1 rounded text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
            >
              <Eye size={15} />
            </button>

            {isManual ? (
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
            ) : (
              <Badge variant="neutral" size="sm">System</Badge>
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

  const ledgerSelectOptions = ledgers.map(l => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {activeTab === "vouchers" ? "Total Vouchers" : "Total Custom Ledgers"}
          </span>
          <span className="text-3xl font-black text-slate-800 mt-2">
            {activeTab === "vouchers" ? filteredVouchers.length : filteredCustomLedgers.length}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transaction Volume</span>
          <span className="text-3xl font-black text-teal-700 mt-2">₹ {totalAmountSum.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tabs System */}
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
              Vouchers
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
                {(startDate || endDate || selectedFilterLedgerId || selectedReferenceType !== "all") && (
                  <Button
                    size="sm"
                    variant="outline"
                    startIcon={X}
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setSelectedFilterLedgerId("");
                      setSelectedReferenceType("all");
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
                options={ledgerSelectOptions}
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
                  No financial vouchers found.
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

      {/* Create / Edit Voucher Dialog Modal */}
      <Modal
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        title={editingVoucher ? `Edit Voucher [${editingVoucher.voucherNo}]` : "Create Financial Voucher"}
        subtitle="Manage financial vouchers and manual debits"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitVoucher} className="space-y-4">
          <SearchableSelect
            label="Select Ledger"
            required
            options={ledgerSelectOptions}
            placeholder="Select ledger (Employee, Sponsor or Custom)..."
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
              label="Amount"
              currency
              required
              min="1"
              step="any"
              placeholder="Enter amount"
              value={voucherAmount}
              onChange={(e) => setVoucherAmount(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">Narration / Remarks</label>
            <textarea
              rows={3}
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
              {editingVoucher ? "Update Voucher" : "Create Voucher"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Ledger Dialog Modal */}
      <Modal
        open={openModal && false ? false : openLedgerModal}
        onClose={() => !submittingLedger && setOpenLedgerModal(false)}
        title={editingLedger ? "Edit Custom Ledger" : "Create Custom Ledger"}
        subtitle="Manage standalone custom ledger accounts"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitLedger} className="space-y-4">
          <Input
            label="Ledger Name"
            placeholder="Enter custom ledger name (e.g. Tea, Newspaper)"
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
