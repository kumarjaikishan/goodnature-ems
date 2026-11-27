import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Download, Eye, Search, X } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import Input from "@/components/ui/Input";
import DateInput from "@/components/ui/DateInput";
import Select from "@/components/ui/Select";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Loader from "../../utils/loader";

const CustomLedgerReportTab = ({
  vouchers = [],
  customLedgers = [],
  loading = false,
  themes,
}) => {
  const navigate = useNavigate();

  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const customLedgerIds = useMemo(
    () => new Set(customLedgers.map((l) => String(l._id))),
    [customLedgers]
  );

  const customLedgerNames = useMemo(
    () => new Set(customLedgers.map((l) => (l.name || "").trim().toLowerCase())),
    [customLedgers]
  );

  const ledgerOptions = useMemo(
    () => [
      { label: "All Custom Ledgers", value: "" },
      ...customLedgers.map((l) => ({ label: l.name, value: l._id })),
    ],
    [customLedgers]
  );

  const resolveVoucherLedgerName = (v) => {
    const debitEntry = v.entries?.find((e) => e.type === "DEBIT");
    return (v.ledgerId?.name || debitEntry?.accountName || "Uncategorized").trim();
  };

  const resolveVoucherLedgerId = (v) => {
    if (v.ledgerId?._id) return String(v.ledgerId._id);
    if (typeof v.ledgerId === "string") return v.ledgerId;
    const name = resolveVoucherLedgerName(v).toLowerCase();
    const match = customLedgers.find((l) => (l.name || "").trim().toLowerCase() === name);
    return match ? String(match._id) : "";
  };

  // All vouchers belonging to custom ledgers
  const customVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const lId = v.ledgerId?._id ? String(v.ledgerId._id) : (typeof v.ledgerId === "string" ? v.ledgerId : "");
      const lType = v.ledgerId?.ledgerType;
      if (lType === "custom" || (lId && customLedgerIds.has(lId))) return true;
      const debitName = (v.entries?.find((e) => e.type === "DEBIT")?.accountName || "").trim().toLowerCase();
      return Boolean(debitName && customLedgerNames.has(debitName));
    });
  }, [vouchers, customLedgerIds, customLedgerNames]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return customVouchers.filter((v) => {
      const lId = resolveVoucherLedgerId(v);
      const lName = resolveVoucherLedgerName(v);
      const vStatus = v.status || "APPROVED";
      const vDateStr = dayjs(v.date).format("YYYY-MM-DD");

      if (selectedLedgerId && lId !== String(selectedLedgerId)) return false;
      if (statusFilter !== "all" && vStatus !== statusFilter) return false;
      if (startDate && vDateStr < startDate) return false;
      if (endDate && vDateStr > endDate) return false;

      if (q) {
        const matchesNo = (v.voucherNo || "").toLowerCase().includes(q);
        const matchesLedger = lName.toLowerCase().includes(q);
        const matchesRemarks = (v.remarks || "").toLowerCase().includes(q);
        if (!matchesNo && !matchesLedger && !matchesRemarks) return false;
      }
      return true;
    });
  }, [customVouchers, selectedLedgerId, statusFilter, startDate, endDate, searchText]);

  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;
    let due = 0;
    filteredRows.forEach((v) => {
      const amt =
        v.totalAmount ||
        v.entries?.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (Number(e.amount) || 0), 0) ||
        0;
      const p = Number(v.paidAmount) || 0;
      const r = v.remainingAmount !== undefined ? Number(v.remainingAmount) : Math.max(amt - p, 0);
      total += amt;
      paid += p;
      if (v.status !== "REJECTED") {
        due += r;
      }
    });
    return { count: filteredRows.length, total, paid, due };
  }, [filteredRows]);

  // Grouped summary per custom ledger
  const ledgerSummary = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((v) => {
      const lId = resolveVoucherLedgerId(v) || resolveVoucherLedgerName(v);
      const lName = resolveVoucherLedgerName(v);
      const amt =
        v.totalAmount ||
        v.entries?.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (Number(e.amount) || 0), 0) ||
        0;
      const p = Number(v.paidAmount) || 0;
      const r = v.status === "REJECTED"
        ? 0
        : (v.remainingAmount !== undefined ? Number(v.remainingAmount) : Math.max(amt - p, 0));

      const prev = map.get(lId) || { id: lId, name: lName, count: 0, total: 0, paid: 0, due: 0 };
      prev.count += 1;
      prev.total += amt;
      prev.paid += p;
      prev.due += r;
      map.set(lId, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredRows]);

  const hasActiveFilters = Boolean(
    selectedLedgerId || startDate || endDate || statusFilter !== "all" || searchText.trim()
  );

  const handleClearFilters = () => {
    setSelectedLedgerId("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setSearchText("");
  };

  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;
    const headers = ["Voucher No", "Date", "Custom Ledger", "Narration", "Amount", "Paid", "Due", "Status"];
    const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const lines = [
      headers.join(","),
      ...filteredRows.map((v) => {
        const amt =
          v.totalAmount ||
          v.entries?.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (Number(e.amount) || 0), 0) ||
          0;
        const paid = Number(v.paidAmount) || 0;
        const due = v.status === "REJECTED"
          ? 0
          : (v.remainingAmount !== undefined ? Number(v.remainingAmount) : Math.max(amt - paid, 0));
        return [
          escapeCsv(v.voucherNo),
          escapeCsv(dayjs(v.date).format("DD-MM-YYYY")),
          escapeCsv(resolveVoucherLedgerName(v)),
          escapeCsv(v.remarks || ""),
          amt,
          paid,
          due,
          escapeCsv(v.status || "APPROVED"),
        ].join(",");
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Custom_Ledger_Report_${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (status) => {
    const s = status || "APPROVED";
    switch (s) {
      case "PENDING":
        return <Badge variant="warning" dot size="sm">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="info" dot size="sm">Approved</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="primary" dot size="sm">Partial</Badge>;
      case "PAID":
        return <Badge variant="success" dot size="sm">Paid</Badge>;
      case "REJECTED":
        return <Badge variant="danger" dot size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{s}</Badge>;
    }
  };

  const columns = [
    {
      name: "S.No",
      cell: (_row, idx) => <span className="text-slate-500 font-medium text-xs">{idx + 1}</span>,
      width: "60px",
    },
    {
      name: "Voucher / Date",
      selector: (row) => row.voucherNo,
      cell: (row) => (
        <div className="py-1.5">
          <div className="font-bold text-slate-800 text-xs">{row.voucherNo}</div>
          <div className="text-[11px] text-slate-500">{dayjs(row.date).format("DD MMM YYYY")}</div>
        </div>
      ),
      sortable: true,
      width: "145px",
    },
    {
      name: "Custom Ledger",
      selector: (row) => resolveVoucherLedgerName(row),
      cell: (row) => (
        <span className="font-semibold text-teal-800 text-xs">{resolveVoucherLedgerName(row)}</span>
      ),
      sortable: true,
      width: "190px",
    },
    {
      name: "Narration",
      selector: (row) => row.remarks || "",
      cell: (row) => (
        <div className="text-xs text-slate-600 line-clamp-2 py-1">{row.remarks || "—"}</div>
      ),
      minWidth: "200px",
    },
    {
      name: "Amount",
      selector: (row) =>
        row.totalAmount ||
        row.entries?.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (Number(e.amount) || 0), 0) ||
        0,
      cell: (row) => {
        const amt =
          row.totalAmount ||
          row.entries?.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (Number(e.amount) || 0), 0) ||
          0;
        const paid = Number(row.paidAmount) || 0;
        const due = row.remainingAmount !== undefined ? Number(row.remainingAmount) : Math.max(amt - paid, 0);
        return (
          <div className="py-1 text-xs">
            <div className="font-bold text-slate-900">₹ {amt.toLocaleString("en-IN")}</div>
            {due > 0 && row.status !== "REJECTED" && (
              <div className="text-[10px] text-amber-700 font-medium">Due: ₹{due.toLocaleString("en-IN")}</div>
            )}
          </div>
        );
      },
      sortable: true,
      width: "130px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => renderStatusBadge(row.status),
      sortable: true,
      width: "120px",
    },
    {
      name: "Action",
      cell: (row) => (
        <button
          onClick={() => navigate(`/dashboard/vouchers/${row._id}`)}
          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
          title="View Voucher Details"
        >
          <Eye size={16} />
        </button>
      ),
      width: "80px",
    },
  ];

  return (
    <div>
      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-3">
            <SearchableSelect
              size="sm"
              label="Custom Ledger"
              options={ledgerOptions}
              placeholder="All Custom Ledgers"
              value={selectedLedgerId}
              onChange={(val) => setSelectedLedgerId(val || "")}
              allowClear
            />
          </div>
          <div className="lg:col-span-2">
            <DateInput
              size="sm"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <DateInput
              size="sm"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              size="sm"
              label="Status"
              options={[
                { label: "All Status", value: "all" },
                { label: "Pending Approval", value: "PENDING" },
                { label: "Approved (Unpaid)", value: "APPROVED" },
                { label: "Partially Paid", value: "PARTIALLY_PAID" },
                { label: "Fully Paid", value: "PAID" },
                { label: "Rejected", value: "REJECTED" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3 flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Input
                size="sm"
                label="Search"
                startIcon={Search}
                placeholder="Voucher no, narration..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilters}
                title="Clear Filters"
                className="shrink-0"
              >
                <X size={14} />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              startIcon={Download}
              onClick={handleExportCsv}
              disabled={filteredRows.length === 0}
              className="shrink-0"
              title="Export CSV"
            >
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/70 border-b border-slate-100">
        <div className="bg-white border border-slate-200/80 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vouchers</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{stats.count}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Expense</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">₹ {stats.total.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Paid</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">₹ {stats.paid.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-lg px-3.5 py-2.5">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Total Due</div>
          <div className="text-lg font-bold text-amber-700 mt-0.5">₹ {stats.due.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Ledger-wise Breakdown (click to filter) */}
      {ledgerSummary.length > 0 && (
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ledger-Wise Summary
            </h3>
            {selectedLedgerId && (
              <button
                type="button"
                onClick={() => setSelectedLedgerId("")}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                Show All Custom Ledgers
              </button>
            )}
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2 px-3">Custom Ledger</th>
                  <th className="py-2 px-3 text-right">Vouchers</th>
                  <th className="py-2 px-3 text-right">Total Amount</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                  <th className="py-2 px-3 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerSummary.map((item) => {
                  const isSelected = String(selectedLedgerId) === String(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedLedgerId(isSelected ? "" : item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-teal-50/80" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{item.count}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹ {item.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                        ₹ {item.paid.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-amber-700">
                        ₹ {item.due.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Voucher Entries */}
      <DataTable
        columns={columns}
        data={filteredRows}
        pagination
        customStyles={themes}
        highlightOnHover
        progressPending={loading}
        progressComponent={<Loader />}
        footerComponent={({ displayData }) => {
          const visibleSum = (displayData || []).reduce((acc, row) => {
            const amt =
              row.totalAmount ||
              row.entries?.filter((e) => e.type === "DEBIT").reduce((s, e) => s + (Number(e.amount) || 0), 0) ||
              0;
            return acc + amt;
          }, 0);
          return (
            <div className="flex items-center gap-2 py-0.5 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">TOTAL:</span>
              <span className="font-extrabold text-teal-800 text-sm">
                ₹ {visibleSum.toLocaleString("en-IN")}
              </span>
            </div>
          );
        }}
        noDataComponent={
          <div className="py-12 text-center text-slate-500 font-medium text-sm">
            No custom ledger vouchers found matching the selected filters.
          </div>
        }
      />
    </div>
  );
};

export default CustomLedgerReportTab;
