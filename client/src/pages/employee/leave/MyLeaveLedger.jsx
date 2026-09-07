import React, { useEffect, useState } from "react";
import { apiClient } from "../../../utils/apiClient";
import dayjs from "dayjs";
import Loader from "../../../utils/loader";
import LeaveBalanceCards from "./components/LeaveBalanceCards";
import Badge from "@/components/ui/Badge";

const MyLeaveLedger = () => {
    const [balances, setBalances] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balData, transData] = await Promise.all([
                apiClient({ url: "my-leave-balances" }),
                apiClient({ url: "my-leave-transactions" })
            ]);
            setBalances(balData || []);
            setTransactions(transData || []);
        } catch (err) {
            console.error("Error fetching leave data:", err);
            setError(err.message || "Failed to load leave data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-xl border border-red-200 shadow-xs max-w-lg mx-auto my-8">
                <h3 className="text-red-700 font-bold text-base mb-1">{error}</h3>
                <p className="text-xs text-slate-500">Please contact your administrator if you believe this is an error.</p>
            </div>
        );
    }

    const getBadgeVariant = (type) => {
        switch (type) {
            case 'credit': return 'success';
            case 'debit': return 'danger';
            case 'adjustment': return 'warning';
            default: return 'neutral';
        }
    };

    return (
        <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h3 className="text-base font-bold text-slate-800">My Leave Ledger & Balances</h3>
                <p className="text-xs text-slate-500">Real-time leave balance summary and credit/debit audit logs</p>
            </div>

            {/* Leave Balance Overview Cards */}
            <LeaveBalanceCards balances={balances} />

            {/* Transactions Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Leave Transaction Audit Log
                    </h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                                <th className="py-2.5 px-4">Date</th>
                                <th className="py-2.5 px-4">Type</th>
                                <th className="py-2.5 px-4">Days</th>
                                <th className="py-2.5 px-4">Policy / Particulars</th>
                                <th className="py-2.5 px-4">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50/60 transition">
                                        <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                                            {dayjs(t.createdAt).format('DD MMM YYYY, hh:mm A')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge size="sm" variant={getBadgeVariant(t.type)}>
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-900">
                                            {t.type === 'credit' ? `+${t.amount}` : `-${t.amount}`}
                                        </td>
                                        <td className="py-3 px-4 text-slate-700">
                                            <strong className="block">{t.policyId?.name || t.remarks || "General"}</strong>
                                            {t.remarks && t.policyId && (
                                                <span className="text-[11px] text-slate-400 block">{t.remarks}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge size="sm" variant="neutral">
                                                {t.source || 'MANUAL'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyLeaveLedger;
