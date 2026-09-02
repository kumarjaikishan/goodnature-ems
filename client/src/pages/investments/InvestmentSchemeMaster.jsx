import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Save,
  ShieldCheck,
  Percent,
  TrendingUp,
  Coins,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

const InvestmentSchemeMaster = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [config, setConfig] = useState({
    minRdAmount: 1000,
    rdStepAmount: 1000,
    minFdAmount: 10000,
    fdStepAmount: 10000,
    prematureAnnualInterestPercent: 6.0,
    rdPrematureAnnualInterestPercent: 6.0,
    fdPrematureAnnualInterestPercent: 6.0,
    slabs: [],
    rulesAndRegulations: [],
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/investments/config');
      if (res.data.data) {
        setConfig(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load investment scheme matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleAddSlab = () => {
    setConfig({
      ...config,
      slabs: [
        ...config.slabs,
        {
          tenureMonths: 12,
          rdMaturityPercent: 106,
          fdMaturityPercent: 110,
          rdPromoterCommissionPercent: 3.0,
          fdPromoterCommissionPercent: 4.0,
          developerCommissionPercent: 1.0,
        },
      ],
    });
  };

  const handleRemoveSlab = (index) => {
    const updated = [...config.slabs];
    updated.splice(index, 1);
    setConfig({ ...config, slabs: updated });
  };

  const handleSlabChange = (index, field, value) => {
    const updated = [...config.slabs];
    updated[index][field] = Number(value) || 0;
    setConfig({ ...config, slabs: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.put('/investments/config', config);
      toast.success('Investment scheme configuration saved successfully');
      fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader title="Loading Scheme Matrix..." subtitle="Fetching RD/FD interest slabs and commission rates" />;
  }

  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
  const inputCls =
    'h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl font-medium text-xs text-slate-800 transition';

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <SlidersHorizontal size={22} />
            </span>
            Investment Scheme Matrix & Slabs
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Define RD/FD maturity percentages, promoter commission, business developer override, and premature rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deposit Minimums & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Coins size={16} className="text-teal-700" />
              Recurring Deposit (R.D.) Bounds
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min. Monthly (₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={config.minRdAmount}
                  onChange={(e) => setConfig({ ...config, minRdAmount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Multiple Step (₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={config.rdStepAmount}
                  onChange={(e) => setConfig({ ...config, rdStepAmount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">e.g. ₹1,000, ₹2,000, ₹5,000/mo.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-700" />
              Fixed Deposit (F.D.) Bounds
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min. Principal (₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={config.minFdAmount}
                  onChange={(e) => setConfig({ ...config, minFdAmount: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Multiple Step (₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={config.fdStepAmount}
                  onChange={(e) => setConfig({ ...config, fdStepAmount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">e.g. ₹10,000, ₹20,000, ₹1,00,000.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Percent size={16} className="text-indigo-700" />
              Premature Interest Rates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>R.D. Premature (% P.A.)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputCls}
                  value={config.rdPrematureAnnualInterestPercent ?? config.prematureAnnualInterestPercent ?? 6.0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rdPrematureAnnualInterestPercent: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className={labelCls}>F.D. Premature (% P.A.)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputCls}
                  value={config.fdPrematureAnnualInterestPercent ?? config.prematureAnnualInterestPercent ?? 6.0}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      fdPrematureAnnualInterestPercent: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Separate simple interest rates applied on premature RD and FD closures.</p>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Tenure Returns & Sponsor Commission Matrix</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Exact payout percentages promised on maturity alongside promoter and developer commission schedule.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSlab}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shrink-0"
            >
              <Plus size={16} /> Add Tenure Slab
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3">Tenure (Months)</th>
                  <th className="p-3">R.D. Maturity Return (%)</th>
                  <th className="p-3">F.D. Maturity Return (%)</th>
                  <th className="p-3 bg-teal-50/50">Promoter Comm. % (R.D.)</th>
                  <th className="p-3 bg-teal-50/50">Promoter Comm. % (F.D.)</th>
                  <th className="p-3 bg-indigo-50/50">Business Dev Override (%)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.slabs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-slate-900"
                          value={s.tenureMonths}
                          onChange={(e) => handleSlabChange(idx, 'tenureMonths', e.target.value)}
                          required
                        />
                        <span className="text-slate-500 font-semibold">Mos</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-emerald-800"
                          value={s.rdMaturityPercent}
                          onChange={(e) => handleSlabChange(idx, 'rdMaturityPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-slate-600">%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-emerald-800"
                          value={s.fdMaturityPercent}
                          onChange={(e) => handleSlabChange(idx, 'fdMaturityPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-slate-600">%</span>
                      </div>
                    </td>
                    <td className="p-3 bg-teal-50/20">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-teal-800"
                          value={s.rdPromoterCommissionPercent}
                          onChange={(e) => handleSlabChange(idx, 'rdPromoterCommissionPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-slate-600">%</span>
                      </div>
                    </td>
                    <td className="p-3 bg-teal-50/20">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-teal-800"
                          value={s.fdPromoterCommissionPercent}
                          onChange={(e) => handleSlabChange(idx, 'fdPromoterCommissionPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-slate-600">%</span>
                      </div>
                    </td>
                    <td className="p-3 bg-indigo-50/20">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-indigo-800"
                          value={s.developerCommissionPercent}
                          onChange={(e) => handleSlabChange(idx, 'developerCommissionPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-slate-600">%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(idx)}
                        disabled={config.slabs.length <= 1}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                        title="Remove Slab"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              {submitLoading ? 'Saving Configuration...' : 'Save Scheme Matrix'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvestmentSchemeMaster;
