import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import PageLoader from "../../../components/common/PageLoader";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import {
  Wallet,
  Search,
  ArrowRightLeft,
  Eye,
  User,
  Coins,
  ShieldAlert,
  LayoutGrid,
  Table as TableIcon,
  Plus
} from "lucide-react";

import { useSelector } from "react-redux";

export default function CashLedgersPage() {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.user?.profile);
  const isSuperAccess = authUser?.role === 'superadmin' || authUser?.role === 'developer' || authUser?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [cashLedgers, setCashLedgers] = useState([]);
  const [filteredLedgers, setFilteredLedgers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("table");

  useEffect(() => {
    fetchCashLedgers();
  }, [authUser]);

  const fetchCashLedgers = async () => {
    try {
      setLoading(true);
      const res = await apiClient({ url: "ledger/treasury" });
      let cash = res.cashLedgers || [];
      // If regular staff (accountant, cashier, operator, etc.), restrict to their own in-hand cash account
      if (!isSuperAccess && authUser?._id) {
        cash = cash.filter(c => c.assignedUserId?._id === authUser._id || c.assignedUserId === authUser._id);
      }
      const isDevUser = authUser?.role === 'developer';
      if (!isDevUser) {
        cash = cash.filter(c => c.assignedUserId?.role !== 'developer');
      }
      // Ensure unique staff cash accounts
      const seen = new Set();
      const uniqueCash = [];
      for (const item of cash) {
        const key = item.assignedUserId?._id || item.assignedUserId || item._id;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCash.push(item);
        }
      }
      setCashLedgers(uniqueCash);
      setFilteredLedgers(uniqueCash);
    } catch (err) {
      console.error("Error fetching cash ledgers:", err);
      toast.error("Failed to load cashier cash accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cashLedgers) return;
    let result = [...cashLedgers];
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.assignedUserId?.name?.toLowerCase().includes(q) ||
          c.assignedUserId?.email?.toLowerCase().includes(q) ||
          c.assignedUserId?.role?.toLowerCase().includes(q)
      );
    }
    setFilteredLedgers(result);
  }, [searchQuery, cashLedgers]);

  const totalCashInCustody = cashLedgers.reduce((sum, c) => sum + (Number(c.netBalance) || 0), 0);
  const totalHeldCash = cashLedgers.reduce((sum, c) => sum + (Number(c.heldBalance) || 0), 0);
  const totalAvailableCash = totalCashInCustody - totalHeldCash;

  if (loading) {
    return (
      <PageLoader
        title="Loading Cashier Wallets..."
        subtitle="Fetching user cash ledgers and in-hand balances"
        fullScreen={false}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Cashier & Staff Cash Accounts
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Real-time tracking of in-hand cash custody, collection counters & handover settlements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRightLeft size={15} />}
            onClick={() => navigate("/dashboard/ledger/transfers")}
          >
            Initiate Fund Transfer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Cash In Custody
            </span>
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            ₹ {totalCashInCustody.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Across {cashLedgers.length} staff cashiers & operators
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Available Cash Balance
            </span>
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Coins className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-teal-800 tracking-tight">
            ₹ {totalAvailableCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Available for expenses or bank deposit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              In-Transit Pending Transfers
            </span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-700 tracking-tight">
            ₹ {totalHeldCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Locked pending bank/cashier acceptance</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            size="sm"
            placeholder="Search cashier name, role, email..."
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

      {/* Card View */}
      {viewType === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLedgers.map((cash) => {
            const netBal = Number(cash.netBalance) || 0;
            const heldBal = Number(cash.heldBalance) || 0;
            const availBal = Number(cash.availableBalance) || 0;
            const user = cash.assignedUserId || {};

            return (
              <div
                key={cash._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* User Info Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {user.profileImage ? (
                      <img
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        alt={user.name}
                        src={cloudinaryUrl(user.profileImage, {
                          format: "webp",
                          width: 100,
                          height: 100
                        })}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shadow-xs shrink-0 border border-emerald-200">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "CS"}
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {user.name || cash.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {user.role || "Staff"}
                        </span>
                        {user.email && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Breakdown Box */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total In-Hand:</span>
                    <span className="font-bold text-slate-900">
                      ₹ {netBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {heldBal > 0 && (
                    <div className="flex justify-between items-center text-amber-700">
                      <span className="font-medium">In-Transit Held:</span>
                      <span className="font-bold">
                        - ₹ {heldBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-teal-800 font-bold">Available to Transfer:</span>
                    <span className="font-black text-teal-700 text-sm">
                      ₹ {availBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Action footer */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Cashier
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/ledger/${cash._id}?name=${encodeURIComponent(
                          cash.name
                        )}&ledgertype=user_cash`
                      )
                    }
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Eye size={13} /> View Statement
                  </button>
                </div>

                {/* Accent bar */}
                <span className="absolute top-0 left-0 h-full w-1.5 bg-emerald-600 rounded-l-2xl"></span>
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
                <th className="px-5 py-3.5 text-left">Cashier / Staff</th>
                <th className="px-5 py-3.5 text-left">Role</th>
                <th className="px-5 py-3.5 text-right">Cash In Hand</th>
                <th className="px-5 py-3.5 text-right">Held in Transit</th>
                <th className="px-5 py-3.5 text-right">Available Balance</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedgers.map((cash) => {
                const user = cash.assignedUserId || {};
                return (
                  <tr key={cash._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {user.name ? user.name.slice(0, 2).toUpperCase() : "CS"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name || cash.name}</div>
                          <div className="text-[11px] text-slate-400">{user.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {user.role || "Staff"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700 text-xs sm:text-sm tracking-tight">
                      ₹ {(Number(cash.netBalance) || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-amber-700">
                      ₹ {(Number(cash.heldBalance) || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-teal-800 text-xs sm:text-sm tracking-tight">
                      ₹ {(Number(cash.availableBalance) || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/ledger/${cash._id}?name=${encodeURIComponent(
                              cash.name
                            )}&ledgertype=user_cash`
                          )
                        }
                        className="px-2.5 py-1 bg-teal-700 text-white rounded-lg font-bold text-xs hover:bg-teal-800 transition shadow-xs"
                      >
                        Statement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
