import React from "react";
import { CalendarCheck } from "lucide-react";

const LeaveBalanceCards = ({ balances = [] }) => {
    if (!balances || balances.length === 0) {
        return (
            <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl mb-4 text-xs font-semibold text-slate-500">
                No leave balance records configured yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {balances.map((bal) => (
                <div
                    key={bal._id}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 relative overflow-hidden flex flex-col justify-between"
                >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600"></div>

                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {bal.policyId?.name || "General Leave"}
                        </span>
                        <CalendarCheck size={18} className="text-teal-600" />
                    </div>

                    <div className="my-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tight">
                            {bal.remaining}
                        </span>
                        <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">Days Available</span>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>Allotted: <strong className="text-slate-700">{bal.totalAllocated}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Used: <strong className="text-slate-700">{bal.used}</strong></span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LeaveBalanceCards;
