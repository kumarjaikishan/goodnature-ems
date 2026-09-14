import React from 'react';
import { FileText, Layers, ShieldCheck, DollarSign } from 'lucide-react';

const KisanSummaryMetrics = ({ total, agreements, allRegistryDeeds }) => {
  const totalAgreedDismil = agreements.reduce((sum, a) => sum + (a.araziDismil || 0), 0);
  const totalAgreedSqFt = agreements.reduce((sum, a) => sum + (a.totalSqFt || 0), 0);
  const totalRegDismil = agreements.reduce((sum, a) => sum + (a.totalRegisteredDismil || 0), 0);
  const totalDue = agreements.reduce((sum, a) => sum + (a.financialSummary?.balanceDue || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Agreements */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
          <FileText size={22} />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Agreements</span>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{total || agreements.length}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Active acquisition files</p>
        </div>
      </div>

      {/* Total Agreed Area */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Layers size={22} />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Agreed Area</span>
          <h3 className="text-2xl font-black text-emerald-800 font-mono mt-0.5">
            {totalAgreedDismil.toFixed(2)}{' '}
            <span className="text-xs font-semibold text-slate-500">Dismil</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ≈ {totalAgreedSqFt.toLocaleString('en-IN')} Sq.Ft.
          </p>
        </div>
      </div>

      {/* Registered Deeds */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
          <ShieldCheck size={22} />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Registered Deeds</span>
          <h3 className="text-2xl font-black text-purple-800 font-mono mt-0.5">
            {allRegistryDeeds.length}{' '}
            <span className="text-xs font-semibold text-slate-500">
              ({totalRegDismil.toFixed(2)} Dismil)
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Converted official deeds</p>
        </div>
      </div>

      {/* Outstanding Farmer Due */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <DollarSign size={22} />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Outstanding Farmer Due</span>
          <h3 className="text-2xl font-black text-amber-800 font-mono mt-0.5">
            ₹{totalDue.toLocaleString('en-IN')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Balance land cost payable</p>
        </div>
      </div>
    </div>
  );
};

export default KisanSummaryMetrics;
