import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  CircularProgress,
  Avatar,
  Box,
  Typography,
} from "@mui/material";
import { MdDelete } from "react-icons/md";
import { FaClock, FaPlus, FaMinus, FaSync } from "react-icons/fa";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const WeeklyOffLedgerModal = ({ open, onClose, employee }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);

  // Form State
  const [entryType, setEntryType] = useState("MANUAL_DEDUCT");
  const [minutes, setMinutes] = useState("");
  const [particulars, setParticulars] = useState("");

  const empId = employee?._id || employee?.id;

  const fetchLedger = useCallback(async () => {
    if (!empId) return;
    try {
      setLoading(true);
      const res = await apiClient({
        url: `weekly-off-ledger/${empId}`,
      });
      if (res.success) {
        setLedger(res.ledger || []);
        setBalance(res.balance || 0);
      }
    } catch (err) {
      console.error("Failed to fetch weekly off ledger:", err);
    } finally {
      setLoading(false);
    }
  }, [empId]);

  const handleRebuildSync = async () => {
    try {
      setRebuilding(true);
      const res = await apiClient({
        url: "weekly-off-ledger-rebuild",
        method: "POST",
      });
      if (res.success) {
        toast.success(res.message || "Historical weekly off ledger rebuilt successfully!");
        fetchLedger();
      }
    } catch (err) {
      console.error("Failed to rebuild ledger:", err);
    } finally {
      setRebuilding(false);
    }
  };

  useEffect(() => {
    if (open && empId) {
      fetchLedger();
    }
  }, [open, empId, fetchLedger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const minNum = Number(minutes);
    if (!minNum || minNum <= 0) {
      toast.warn("Please enter a valid number of minutes (> 0)");
      return;
    }
    if (!particulars.trim()) {
      toast.warn("Please enter particulars / reason for this entry");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient({
        url: "weekly-off-ledger",
        method: "POST",
        body: {
          employeeId: empId,
          type: entryType,
          minutes: minNum,
          particulars: particulars.trim(),
        },
      });

      if (res.success) {
        toast.success(res.message || "Entry added successfully!");
        setMinutes("");
        setParticulars("");
        fetchLedger();
      }
    } catch (err) {
      console.error("Failed to add entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this ledger entry?")) return;
    try {
      const res = await apiClient({
        url: `weekly-off-ledger/${entryId}`,
        method: "DELETE",
      });
      if (res.success) {
        toast.success("Entry deleted successfully!");
        fetchLedger();
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "EARNED":
        return <Chip label="Earned (Attendance)" size="small" color="purple" className="!bg-purple-100 !text-purple-800 !font-bold" />;
      case "PAYROLL_PAID":
        return <Chip label="Paid in Payroll" size="small" className="!bg-emerald-100 !text-emerald-800 !font-bold" />;
      case "MANUAL_ADD":
        return <Chip label="Manual Addition" size="small" className="!bg-blue-100 !text-blue-800 !font-bold" />;
      case "MANUAL_DEDUCT":
        return <Chip label="Manual Deduction" size="small" className="!bg-rose-100 !text-rose-800 !font-bold" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  // Compute running balances chronologically for table display
  const sortedChrono = [...ledger].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : (a.year && a.month ? new Date(a.year, a.month - 1).getTime() : new Date(a.createdAt).getTime());
    const timeB = b.date ? new Date(b.date).getTime() : (b.year && b.month ? new Date(b.year, b.month - 1).getTime() : new Date(b.createdAt).getTime());

    if (timeA !== timeB) return timeA - timeB;

    // For the same period: EARNED / MANUAL_ADD first (+), then PAYROLL_PAID / MANUAL_DEDUCT (-)
    const rank = (type) => (type === "EARNED" || type === "MANUAL_ADD" ? 1 : 2);
    if (rank(a.type) !== rank(b.type)) return rank(a.type) - rank(b.type);

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  let running = 0;
  const ledgerWithRunning = sortedChrono.map((item) => {
    const isAdd = item.type === "EARNED" || item.type === "MANUAL_ADD";
    running = isAdd ? running + item.minutes : Math.max(0, running - item.minutes);
    return { ...item, closingBalance: running, isAdd };
  }).reverse(); // Latest on top for UI

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="!font-bold !text-slate-800 !text-base border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="!bg-purple-600">
            <FaClock />
          </Avatar>
          <div>
            <Typography variant="subtitle1" className="!font-bold !text-slate-900 leading-tight">
              Weekly Off Work Ledger
            </Typography>
            <p className="text-xs text-slate-500 font-normal">
              {employee?.userid?.name || employee?.rawname || employee?.name} ({employee?.empId || "EMP"})
            </p>
          </div>
        </div>

        <Button
          size="small"
          variant="outlined"
          startIcon={<FaSync className={rebuilding ? "animate-spin" : ""} />}
          onClick={handleRebuildSync}
          disabled={rebuilding}
          className="!text-purple-700 !border-purple-300 hover:!bg-purple-50 text-xs"
        >
          {rebuilding ? "Syncing..." : "Sync Past Attendance"}
        </Button>
      </DialogTitle>

      <DialogContent className="!pt-4 !space-y-4">
        {/* Balance Overview Card */}
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider block">Current Carried Forward Balance</span>
            <span className="text-2xl font-black text-purple-800 block">
              {balance} <span className="text-sm font-bold text-purple-600">Minutes</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Equivalent Hours</span>
            <span className="text-lg font-bold text-slate-800">
              {(balance / 60).toFixed(1)} <span className="text-xs text-slate-600 font-normal">Hours</span>
            </span>
          </div>
        </div>

        {/* Manual Add/Deduct Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Manual Ledger Adjustment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
            <FormControl size="small" className="sm:col-span-1 bg-white">
              <InputLabel>Type</InputLabel>
              <Select
                value={entryType}
                label="Type"
                onChange={(e) => setEntryType(e.target.value)}
              >
                <MenuItem value="MANUAL_DEDUCT">Manual Deduct (-)</MenuItem>
                <MenuItem value="MANUAL_ADD">Manual Add (+)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="tel"
              size="small"
              className="sm:col-span-1 bg-white"
              label="Minutes"
              placeholder="e.g. 480"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            />

            <TextField
              size="small"
              className="sm:col-span-2 bg-white"
              label="Particulars / Reason"
              placeholder="e.g. Comp-off taken for 12 Aug"
              value={particulars}
              onChange={(e) => setParticulars(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-500 italic">
              {minutes ? `= ${(Number(minutes) / 60).toFixed(1)} hrs` : "Specify minutes and particulars to record manual deduction or credit."}
            </span>
            <Button
              type="submit"
              variant="contained"
              color={entryType === "MANUAL_DEDUCT" ? "error" : "primary"}
              size="small"
              disabled={submitting}
              startIcon={entryType === "MANUAL_DEDUCT" ? <FaMinus /> : <FaPlus />}
            >
              {submitting ? "Saving..." : entryType === "MANUAL_DEDUCT" ? "Deduct Minutes" : "Add Minutes"}
            </Button>
          </div>
        </form>

        {/* Ledger History Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transaction History</h4>
            <span className="text-xs font-semibold text-slate-500">{ledger.length} records</span>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <CircularProgress size={28} />
              <p className="text-xs text-slate-500 mt-2">Loading ledger history...</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="!font-bold !text-xs !bg-slate-50">Date</TableCell>
                    <TableCell className="!font-bold !text-xs !bg-slate-50">Type</TableCell>
                    <TableCell className="!font-bold !text-xs !bg-slate-50">Particulars / Reason</TableCell>
                    <TableCell className="!font-bold !text-xs !bg-slate-50 !text-center">Minutes</TableCell>
                    <TableCell className="!font-bold !text-xs !bg-slate-50 !text-right">Balance</TableCell>
                    <TableCell className="!font-bold !text-xs !bg-slate-50 !text-center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerWithRunning.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 text-xs py-6">
                        No ledger transactions found for this employee.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerWithRunning.map((row) => (
                      <TableRow key={row._id} hover>
                        <TableCell className="!text-xs !whitespace-nowrap">
                          {dayjs(row.date || row.createdAt).format("DD MMM YYYY")}
                          <span className="text-[10px] text-slate-400 block">
                            {dayjs(row.createdAt).format("hh:mm A")}
                          </span>
                        </TableCell>
                        <TableCell className="!text-xs">
                          {getTypeBadge(row.type)}
                        </TableCell>
                        <TableCell className="!text-xs !font-medium text-slate-700">
                          {row.particulars}
                          {row.createdBy && <span className="text-[10px] text-slate-400 block italic">by {row.createdBy}</span>}
                        </TableCell>
                        <TableCell className={`!text-xs !text-center !whitespace-nowrap !font-extrabold ${row.isAdd ? "text-emerald-700" : "text-rose-700"}`}>
                          {row.isAdd ? `+${row.minutes}` : `-${row.minutes}`} m
                        </TableCell>
                        <TableCell className="!text-xs !text-right !whitespace-nowrap !font-bold text-purple-800">
                          {row.closingBalance} m
                        </TableCell>
                        <TableCell className="!text-xs !text-center">
                          {row.type.startsWith("MANUAL") ? (
                            <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}>
                              <MdDelete className="text-base" />
                            </IconButton>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions className="!px-6 !pb-4">
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeeklyOffLedgerModal;
