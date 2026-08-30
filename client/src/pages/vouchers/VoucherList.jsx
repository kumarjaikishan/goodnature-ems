import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Grid
} from "@mui/material";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from "../admin/attandence/attandencehelper";
import { BiEdit, BiShow, BiTrash, BiPlus } from "react-icons/bi";
import { IoSearch } from "react-icons/io5";
import { CiFilter } from "react-icons/ci";
import { toast } from "react-toastify";
import swal from "sweetalert";
import dayjs from "dayjs";
import { motion } from "framer-motion";

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
  const [selectedFilterLedger, setSelectedFilterLedger] = useState(null);
  const [selectedReferenceType, setSelectedReferenceType] = useState("all");

  // Voucher Modal State
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Voucher Form State
  const [selectedLedger, setSelectedLedger] = useState(null);
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
    setSelectedLedger(null);
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

    setSelectedLedger(matchingLedger || null);
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

    if (!selectedLedger) {
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
        ledgerId: selectedLedger._id
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
          fetchVouchers(); // Refresh in case vouchers list used it
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
      !selectedFilterLedger ||
      ledgerName === selectedFilterLedger.name;

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
      width: "50px",
    },
    {
      name: "Voucher No",
      selector: (row) => row.voucherNo,
      cell: (row) => (
        <span className="font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs border border-slate-200">
          {row.voucherNo}
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
      width: "100px"
    },
    {
      name: "Ledger",
      selector: (row) => {
        const debitEntry = row.entries?.find(e => e.type === 'DEBIT');
        return debitEntry ? debitEntry.accountName : (row.employeeId?.userid?.name || "N/A");
      },
      sortable: true,
      wrap: true,
      width: "160px",
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
      width: "100px"
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
          <div className="flex gap-1">
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => navigate(`/dashboard/vouchers/${row._id}`)}>
                <BiShow className="text-teal-600" />
              </IconButton>
            </Tooltip>

            {isManual ? (
              <>
                <Tooltip title="Edit Voucher">
                  <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                    <BiEdit className="text-blue-600" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Voucher">
                  <IconButton size="small" onClick={() => handleDeleteVoucher(row._id)}>
                    <BiTrash className="text-red-600" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic self-center px-2">System</span>
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
    // {
    //   name: "Net Balance",
    //   selector: (row) => row.netBalance || 0,
    //   cell: (row) => {
    //     const bal = row.netBalance || 0;
    //     const color = bal >= 0 ? "text-green-700" : "text-red-700";
    //     return (
    //       <span className={`font-bold ${color}`}>
    //         ₹ {bal.toLocaleString()}
    //       </span>
    //     );
    //   },
    //   sortable: true,
    //   width: "180px"
    // },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => (
        <div className="flex gap-1">
          <Tooltip title="Edit Ledger Name">
            <IconButton size="small" onClick={() => handleOpenEditLedger(row)}>
              <BiEdit className="text-blue-600" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Ledger">
            <IconButton size="small" onClick={() => handleDeleteLedger(row._id)}>
              <BiTrash className="text-red-600" />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-1 md:p-4">
      {/* Header section with Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <span className="text-sm font-semibold text-slate-500 uppercase">Total Vouchers / Ledgers</span>
          <span className="text-3xl font-black text-slate-800 mt-2">
            {activeTab === "vouchers" ? filteredVouchers.length : filteredCustomLedgers.length}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <span className="text-sm font-semibold text-slate-500 uppercase">Total Transaction Volume</span>
          <span className="text-3xl font-black text-teal-700 mt-2">₹ {totalAmountSum.toLocaleString()}</span>
        </motion.div>
      </div>

      {/* Tabs System */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg border-t border-x border-slate-200 gap-2">
        <div className="flex">
          <button
            className={`py-3 px-6 font-bold border-b-2 text-sm transition-all outline-none ${activeTab === "vouchers"
              ? "border-teal-600 text-teal-700"
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
            className={`py-3 px-6 font-bold border-b-2 text-sm transition-all outline-none ${activeTab === "ledgers"
              ? "border-teal-600 text-teal-700"
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
              variant="contained"
              color="primary"
              size="small"
              startIcon={<BiPlus />}
              onClick={handleOpenCreate}
              className="font-bold py-1.5 px-4 shadow-sm"
            >
              Create Voucher
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<BiPlus />}
              onClick={handleOpenCreateLedger}
              className="font-bold py-1.5 px-4 shadow-sm"
            >
              Create Custom Ledger
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border-x border-slate-200 flex flex-col gap-4">
        {/* Row 1: Search & Tab Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TextField
            size="small"
            placeholder={
              activeTab === "vouchers"
                ? "Search Voucher No, Ledger, Narration..."
                : "Search Custom Ledgers..."
            }
            className="w-full md:w-[320px]"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IoSearch />
                </InputAdornment>
              ),
            }}
          />

          {activeTab === "vouchers" && (
            <div className="flex flex-wrap gap-2 items-center">
              {(startDate || endDate || selectedFilterLedger || selectedReferenceType !== "all") && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSelectedFilterLedger(null);
                    setSelectedReferenceType("all");
                  }}
                  className="font-bold"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Vouchers Specific Advanced Filters */}
        {activeTab === "vouchers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {/* Start Date */}
            <TextField
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
            {/* End Date */}
            <TextField
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />
            {/* Ledger Select */}
            <Autocomplete
              options={ledgers}
              getOptionLabel={(option) => {
                const subText = option.ledgerType === 'employee' && option.empId ? ` (${option.empId})` : '';
                return `${option.name}${subText}`;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Ledger"
                  size="small"
                  placeholder="Select ledger..."
                />
              )}
              value={selectedFilterLedger}
              onChange={(event, newValue) => setSelectedFilterLedger(newValue)}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              fullWidth
            />
            {/* Reference Type */}
            <FormControl size="small" fullWidth>
              <InputLabel id="ref-type-filter-label">Source Type</InputLabel>
              <Select
                labelId="ref-type-filter-label"
                value={selectedReferenceType}
                label="Source Type"
                onChange={(e) => setSelectedReferenceType(e.target.value)}
              >
                <MenuItem value="all">All Vouchers</MenuItem>
                <MenuItem value="MANUAL">Manual Receipts</MenuItem>
                <MenuItem value="SYSTEM">System Generated</MenuItem>
              </Select>
            </FormControl>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-b-lg border border-slate-200 overflow-hidden shadow-sm">
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
              <div className="py-8 text-center text-slate-500 font-medium">
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
              <div className="py-8 text-center text-slate-500 font-medium">
                No custom ledgers found. Click "Create Custom Ledger" to start.
              </div>
            }
          />
        )}
      </div>

      {/* Create / Edit Voucher Dialog Modal */}
      <Dialog
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="font-bold border-b border-slate-100 text-slate-800">
          {editingVoucher ? `Edit Voucher [${editingVoucher.voucherNo}]` : "Create Financial Voucher"}
        </DialogTitle>
        <form onSubmit={handleSubmitVoucher}>
          <DialogContent className="space-y-4 pt-6">
            <Autocomplete
              options={ledgers}
              getOptionLabel={(option) => {
                const subText = option.ledgerType === 'employee' && option.empId ? ` (${option.empId})` : '';
                return `${option.name}${subText}`;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Ledger"
                  size="small"
                  required
                  placeholder="Search ledgers (Employee or Custom)..."
                />
              )}
              value={selectedLedger}
              onChange={(event, newValue) => setSelectedLedger(newValue)}
              disabled={Boolean(editingVoucher)}
              isOptionEqualToValue={(option, value) => option._id === value._id}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Voucher Date"
                  size="small"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount (₹)"
                  placeholder="Enter amount"
                  size="small"
                  required
                  inputProps={{ min: 1, step: "any" }}
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Narration / Remarks"
              placeholder="Enter transactional particulars or remarks..."
              size="small"
              value={voucherNarration}
              onChange={(e) => setVoucherNarration(e.target.value)}
            />
          </DialogContent>
          <DialogActions className="border-t border-slate-100 p-4 gap-2">
            <Button
              onClick={() => setOpenModal(false)}
              variant="outlined"
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {editingVoucher ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create / Edit Ledger Dialog Modal */}
      <Dialog
        open={openLedgerModal}
        onClose={() => !submittingLedger && setOpenLedgerModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="font-bold border-b border-slate-100 text-slate-800">
          {editingLedger ? "Edit Custom Ledger" : "Create Custom Ledger"}
        </DialogTitle>
        <form onSubmit={handleSubmitLedger}>
          <DialogContent className="space-y-4 pt-6">
            <TextField
              fullWidth
              label="Ledger Name"
              placeholder="Enter custom ledger name (e.g. Tea, Newspaper)"
              size="small"
              required
              value={ledgerNameInput}
              onChange={(e) => setLedgerNameInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions className="border-t border-slate-100 p-4 gap-2">
            <Button
              onClick={() => setOpenLedgerModal(false)}
              variant="outlined"
              color="inherit"
              disabled={submittingLedger}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submittingLedger}
              startIcon={submittingLedger ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {editingLedger ? "Save Changes" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default VoucherList;
