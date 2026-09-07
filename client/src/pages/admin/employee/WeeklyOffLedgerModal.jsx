import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Clock, Plus, Minus, X, AlertCircle } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import dayjs from "dayjs";

// Custom UI Components
import Modalbox from "../../../components/custommodal/Modalbox";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import NumberInput from "../../../components/ui/NumberInput";
import Select from "../../../components/ui/Select";

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
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Earned (Attendance)
          </span>
        );
      case "PAYROLL_PAID":
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Paid in Payroll
          </span>
        );
      case "MANUAL_ADD":
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            Manual Addition
          </span>
        );
      case "MANUAL_DEDUCT":
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Manual Deduction
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  // Compute running balances chronologically for table display
  const sortedChrono = [...ledger].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : (a.year && a.month ? new Date(a.year, a.month - 1).getTime() : new Date(a.createdAt).getTime());
    const timeB = b.date ? new Date(b.date).getTime() : (b.year && b.month ? new Date(b.year, b.month - 1).getTime() : new Date(b.createdAt).getTime());

    if (timeA !== timeB) return timeA - timeB;

    const rank = (type) => (type === "EARNED" || type === "MANUAL_ADD" ? 1 : 2);
    if (rank(a.type) !== rank(b.type)) return rank(a.type) - rank(b.type);

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  let running = 0;
  const ledgerWithRunning = sortedChrono.map((item) => {
    const isAdd = item.type === "EARNED" || item.type === "MANUAL_ADD";
    running = isAdd ? running + item.minutes : Math.max(0, running - item.minutes);
    return { ...item, closingBalance: running, isAdd };
  }).reverse();

  if (!open) return null;

  return (
    <Modalbox open={open} onClose={onClose}>
      <div className="w-full max-w-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Weekly Off Work Ledger
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {employee?.userid?.name || employee?.rawname || employee?.name} ({employee?.empId || "EMP"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

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

        {/* Manual Adjustment Form */}
        <form onSubmit={handleSubmit} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Manual Ledger Adjustment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-1">
              <Select
                size="sm"
                label="Type"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                options={[
                  { value: "MANUAL_DEDUCT", label: "Manual Deduct (-)" },
                  { value: "MANUAL_ADD", label: "Manual Add (+)" }
                ]}
              />
            </div>

            <div className="sm:col-span-1">
              <Input
                size="sm"
                label="Minutes"
                placeholder="e.g. 480"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                size="sm"
                label="Particulars / Reason"
                placeholder="e.g. Comp-off taken for 12 Aug"
                value={particulars}
                onChange={(e) => setParticulars(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-500 italic">
              {minutes ? `= ${(Number(minutes) / 60).toFixed(1)} hrs` : "Specify minutes and reason to record entry."}
            </span>
            <Button
              type="submit"
              variant={entryType === "MANUAL_DEDUCT" ? "danger" : "primary"}
              size="sm"
              loading={submitting}
              icon={entryType === "MANUAL_DEDUCT" ? <Minus size={14} /> : <Plus size={14} />}
            >
              {entryType === "MANUAL_DEDUCT" ? "Deduct Minutes" : "Add Minutes"}
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
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading ledger history...
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Particulars / Reason</th>
                    <th className="p-2.5 text-center">Minutes</th>
                    <th className="p-2.5 text-right">Balance</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerWithRunning.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-500 py-6">
                        No ledger transactions found for this employee.
                      </td>
                    </tr>
                  ) : (
                    ledgerWithRunning.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="font-medium text-slate-800">{dayjs(row.date || row.createdAt).format("DD MMM YYYY")}</span>
                          <span className="text-[10px] text-slate-400 block">{dayjs(row.createdAt).format("hh:mm A")}</span>
                        </td>
                        <td className="p-2.5">
                          {getTypeBadge(row.type)}
                        </td>
                        <td className="p-2.5 font-medium text-slate-700">
                          {row.particulars}
                          {row.createdBy && <span className="text-[10px] text-slate-400 block italic">by {row.createdBy}</span>}
                        </td>
                        <td className={`p-2.5 text-center whitespace-nowrap font-extrabold ${row.isAdd ? "text-emerald-700" : "text-rose-700"}`}>
                          {row.isAdd ? `+${row.minutes}` : `-${row.minutes}`} m
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap font-bold text-purple-800">
                          {row.closingBalance} m
                        </td>
                        <td className="p-2.5 text-center">
                          {row.type.startsWith("MANUAL") ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(row._id)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </Modalbox>
  );
};

export default WeeklyOffLedgerModal;
