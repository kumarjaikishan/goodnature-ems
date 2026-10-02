import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import Modalbox from "../../../components/custommodal/Modalbox";
import PageLoader from "../../../components/common/PageLoader";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import NumberInput from "../../../components/ui/NumberInput";
import {
  Landmark,
  Plus,
  Search,
  ArrowRightLeft,
  Eye,
  Edit2,
  Building,
  CreditCard,
  CheckCircle2,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  Coins
} from "lucide-react";

export default function BankLedgersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bankLedgers, setBankLedgers] = useState([]);
  const [filteredLedgers, setFilteredLedgers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("table");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountType: "CURRENT",
    openingBalance: "0",
    status: "active"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBankLedgers();
  }, []);

  const fetchBankLedgers = async () => {
    try {
      setLoading(true);
      const res = await apiClient({ url: "ledger/banks" });
      const banks = res.bankLedgers || [];
      setBankLedgers(banks);
      setFilteredLedgers(banks);
    } catch (err) {
      console.error("Error fetching bank ledgers:", err);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bankLedgers) return;
    let result = [...bankLedgers];
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.bankName?.toLowerCase().includes(q) ||
          b.accountNumber?.toLowerCase().includes(q) ||
          b.ifscCode?.toLowerCase().includes(q) ||
          b.branchName?.toLowerCase().includes(q)
      );
    }
    setFilteredLedgers(result);
  }, [searchQuery, bankLedgers]);

  const handleOpenModal = (bank = null) => {
    if (bank) {
      setEditId(bank._id);
      setFormData({
        name: bank.name || "",
        bankName: bank.bankName || "",
        accountNumber: bank.accountNumber || "",
        ifscCode: bank.ifscCode || "",
        branchName: bank.branchName || "",
        accountType: bank.accountType || "CURRENT",
        openingBalance: String(bank.openingBalance || 0),
        status: bank.status || "active"
      });
    } else {
      setEditId(null);
      setFormData({
        name: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
        accountType: "CURRENT",
        openingBalance: "0",
        status: "active"
      });
    }
    setModalOpen(true);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.warn("Please enter a ledger account name");
    }
    if (!formData.accountNumber.trim()) {
      return toast.warn("Please enter the bank account number");
    }

    try {
      setSaving(true);
      const url = editId ? `ledger/banks/${editId}` : "ledger/banks";
      const method = editId ? "PUT" : "POST";

      const res = await apiClient({
        url,
        method,
        body: formData
      });

      toast.success(res.message || (editId ? "Bank account updated" : "Bank account added"));
      setModalOpen(false);
      fetchBankLedgers();
    } catch (err) {
      console.error("Save bank error:", err);
      toast.error(err.message || "Failed to save bank account");
    } finally {
      setSaving(false);
    }
  };

  const totalBankBalance = bankLedgers.reduce((sum, b) => sum + (Number(b.netBalance) || 0), 0);
  const totalHeldBalance = bankLedgers.reduce((sum, b) => sum + (Number(b.heldBalance) || 0), 0);
  const totalAvailableBalance = totalBankBalance - totalHeldBalance;

  if (loading) {
    return (
      <PageLoader
        title="Loading Bank Treasury..."
        subtitle="Fetching corporate bank accounts and verified ledger balances"
        fullScreen={false}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-700 text-white rounded-xl shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Corporate Bank Accounts
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage company treasury, bank balances, collections, and inter-bank transfers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowRightLeft size={15} />}
            onClick={() => navigate("/dashboard/ledger/transfers")}
          >
            Inter-Account Transfers
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => handleOpenModal()}
          >
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Bank Treasury
            </span>
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹ {totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Across {bankLedgers.length} registered corporate accounts
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Available Liquid Balance
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Coins className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
            ₹ {totalAvailableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Ready for immediate disbursement</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending In-Transit Transfers
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-700 tracking-tight">
            ₹ {totalHeldBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Held awaiting checker approval</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            size="sm"
            placeholder="Search bank name, A/c #, IFSC..."
            icon={<Search size={14} className="text-slate-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewType("card")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewType === "card"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewType("table")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewType === "table"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Cards View */}
      {viewType === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLedgers.map((bank) => {
            const netBal = Number(bank.netBalance) || 0;
            return (
              <div
                key={bank._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center font-black text-base shadow-xs shrink-0">
                      {bank.bankName ? bank.bankName.slice(0, 2).toUpperCase() : "BK"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {bank.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {bank.bankName || "Corporate Bank"}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {bank.accountType || "CURRENT"}
                  </span>
                </div>

                {/* Account Details Box */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Account No:</span>
                    <span className="font-mono font-bold text-slate-800 tracking-wide">
                      {bank.accountNumber || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {bank.ifscCode || "—"}
                    </span>
                  </div>
                  {bank.branchName && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Branch:</span>
                      <span className="font-medium text-slate-700">{bank.branchName}</span>
                    </div>
                  )}
                </div>

                {/* Balance display */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Verified Balance
                    </span>
                    <p className="text-xl font-bold text-slate-800 tracking-tight">
                      ₹ {netBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(bank)}
                      className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/dashboard/ledger/${bank._id}?name=${encodeURIComponent(
                            bank.name
                          )}&ledgertype=bank`
                        )
                      }
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Eye size={13} /> Statement
                    </button>
                  </div>
                </div>

                {/* Accent line */}
                <span className="absolute top-0 left-0 h-full w-1.5 bg-teal-600 rounded-l-2xl"></span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left">Bank & Account</th>
                <th className="px-5 py-3.5 text-left">Account Number</th>
                <th className="px-5 py-3.5 text-left">IFSC Code</th>
                <th className="px-5 py-3.5 text-left">Branch</th>
                <th className="px-5 py-3.5 text-left">Type</th>
                <th className="px-5 py-3.5 text-right">Balance</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedgers.map((bank) => (
                <tr key={bank._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                        {bank.bankName ? bank.bankName.slice(0, 2).toUpperCase() : "BK"}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{bank.name}</div>
                        <div className="text-[11px] text-slate-400">{bank.bankName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                    {bank.accountNumber || "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {bank.ifscCode || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{bank.branchName || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                      {bank.accountType || "CURRENT"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-700 text-xs sm:text-sm tracking-tight">
                    ₹ {(Number(bank.netBalance) || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(bank)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/ledger/${bank._id}?name=${encodeURIComponent(
                              bank.name
                            )}&ledgertype=bank`
                          )
                        }
                        className="px-2.5 py-1 bg-teal-700 text-white rounded-lg font-bold text-xs hover:bg-teal-800 transition shadow-xs"
                      >
                        Statement
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Bank Account Modal */}
      <Modalbox
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="xl"
        title={editId ? "Edit Bank Account" : "Add New Corporate Bank Account"}
        subtitle={editId ? "Update bank account details and ledger settings" : "Create a new corporate bank ledger with opening balance"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              form="bank-ledger-form"
              variant="primary"
              size="sm"
              type="submit"
              loading={saving}
            >
              {editId ? "Update Account" : "Create Bank Account"}
            </Button>
          </>
        }
      >
        <form id="bank-ledger-form" onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <Input
                label="Account / Ledger Display Name"
                placeholder="e.g. Axis Bank - Corporate A/c (1234)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="Bank Name"
                placeholder="e.g. Axis Bank, IDBI Bank, HDFC Bank"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="Account Number"
                placeholder="e.g. 918020012345678"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="IFSC Code"
                placeholder="e.g. UTIB0001234"
                value={formData.ifscCode}
                onChange={(e) =>
                  setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div>
              <Input
                label="Branch Location"
                placeholder="e.g. Main City Branch"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
              />
            </div>

            <div>
              <Select
                label="Account Type"
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                options={[
                  { label: "Current Account", value: "CURRENT" },
                  { label: "Savings Account", value: "SAVINGS" },
                  { label: "Overdraft (OD)", value: "OVERDRAFT" },
                  { label: "Cash Credit (CC)", value: "CASH" },
                  { label: "Other", value: "OTHER" },
                ]}
              />
            </div>

            {!editId && (
              <div>
                <NumberInput
                  label="Initial / Opening Balance (₹)"
                  currency
                  min="0"
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={(val) => setFormData({ ...formData, openingBalance: val })}
                />
              </div>
            )}
          </div>
        </form>
      </Modalbox>
    </div>
  );
}
