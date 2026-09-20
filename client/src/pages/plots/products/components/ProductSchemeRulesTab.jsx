import React, { useEffect, useState } from 'react';
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
  HelpCircle,
  Calendar,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../../../../api/axios';
import PageLoader from '../../../../components/common/PageLoader';
import { toast } from '../../../../utils/toast';
import CommissionPolicyMatrix from '../../seriesMaster/components/CommissionPolicyMatrix';

const ProductSchemeRulesTab = ({ onSchemeUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [config, setConfig] = useState({
    minRdAmount: 2000,
    rdStepAmount: 1000,
    minFdAmount: 50000,
    fdStepAmount: 1000,
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
      toast.error('Failed to load product scheme rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleAddSlab = () => {
    const lastSlab = config.slabs[config.slabs.length - 1];
    const newTenure = lastSlab ? Number(lastSlab.tenureMonths) + 12 : 12;
    setConfig({
      ...config,
      slabs: [
        ...config.slabs,
        {
          tenureMonths: newTenure,
          rdMaturityPercent: lastSlab ? Number(lastSlab.rdMaturityPercent) + 10 : 106,
          fdMaturityPercent: lastSlab ? Number(lastSlab.fdMaturityPercent) + 15 : 110,
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
      toast.success('Plot Product scheme & maturity rules saved successfully');
      fetchConfig();
      if (onSchemeUpdated) onSchemeUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update scheme rules');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader title="Loading Product Scheme Rules..." subtitle="Fetching EMI & One-Time Full Payment maturity slabs" />;
  }

  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
  const inputCls =
    'h-9 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl font-medium text-xs text-slate-800 transition';

  return (
    <div className="space-y-6">
      {/* Informative Explanation Header Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-lg">
              <Clock size={16} />
            </span>
            <h2 className="text-base font-bold text-white">
              Plot Product Scheme &amp; Customer Maturity Matrix
            </h2>
          </div>
          <p className="text-xs text-teal-100/90 leading-relaxed">
            When a customer purchases a plot product on <strong>Monthly EMI</strong> (considered as <strong>R.D.</strong>) or pays <strong>One-Time Full Payment</strong> (considered as <strong>F.D.</strong>), once the period is completed and time has passed, the customer receives the agreed return percentage on their investment.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-1.5 text-teal-200">
            <Coins size={14} className="text-teal-400" />
            <span>EMI Installments = R.D. Plan</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-1.5 text-emerald-200">
            <TrendingUp size={14} className="text-emerald-400" />
            <span>One-Time Payment = F.D. Plan</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deposit Minimums & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Coins size={16} className="text-teal-700" />
              Monthly EMI (R.D.) Bounds
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min. Monthly (₹)</label>
                <input
                  type="number"
                  step="100"
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
                  step="100"
                  className={inputCls}
                  value={config.rdStepAmount}
                  onChange={(e) => setConfig({ ...config, rdStepAmount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">e.g. Min ₹2,000 with ₹1,000 steps for monthly installments.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-700" />
              One-Time Payment (F.D.) Bounds
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min. Principal (₹)</label>
                <input
                  type="number"
                  step="500"
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
                  step="100"
                  className={inputCls}
                  value={config.fdStepAmount}
                  onChange={(e) => setConfig({ ...config, fdStepAmount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">e.g. Min ₹50,000 with ₹1,000 steps for full upfront payment.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Percent size={16} className="text-indigo-700" />
              Premature Interest Rates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>EMI / R.D. (% P.A.)</label>
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
                <label className={labelCls}>One-Time / F.D. (% P.A.)</label>
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
            <p className="text-[11px] text-slate-400">Simple interest rate applied on premature closure before full tenure.</p>
          </div>
        </div>

        {/* Customer Tenure Maturity Returns Matrix Table */}
        <div className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Customer Tenure Maturity Returns Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Exact payout percentage promised on maturity to customers for Monthly EMI (R.D.) vs One-Time Full Payment (F.D.).
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
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3">Tenure (समय अवधि)</th>
                  <th className="p-3">
                    <div className="flex items-center gap-1.5 text-teal-900">
                      <Coins size={14} className="text-teal-700" />
                      <span>Monthly EMI (R.D.) Maturity Return (%)</span>
                    </div>
                  </th>
                  <th className="p-3">
                    <div className="flex items-center gap-1.5 text-emerald-900">
                      <TrendingUp size={14} className="text-emerald-700" />
                      <span>One-Time Payment (F.D.) Maturity Return (%)</span>
                    </div>
                  </th>
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
                        <span className="text-slate-500 font-semibold text-xs">
                          Months ({+(s.tenureMonths / 12).toFixed(1)} {s.tenureMonths === 12 ? 'Year' : 'Years'})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-teal-800"
                          value={s.rdMaturityPercent}
                          onChange={(e) => handleSlabChange(idx, 'rdMaturityPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-teal-700 text-xs">%</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({s.rdMaturityPercent >= 100 ? `+${s.rdMaturityPercent - 100}% Gain` : `${s.rdMaturityPercent}%`})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-emerald-800"
                          value={s.fdMaturityPercent}
                          onChange={(e) => handleSlabChange(idx, 'fdMaturityPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-emerald-700 text-xs">%</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({s.fdMaturityPercent >= 100 ? `+${s.fdMaturityPercent - 100}% Gain` : `${s.fdMaturityPercent}%`})
                        </span>
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

      {/* Plot Product Target Incentive & Fixed Commission Policy Matrix */}
      <div className="pt-2">
        <CommissionPolicyMatrix
          initialBusinessType="PLOT_PRODUCT"
          showTypeToggle={false}
          title="Plot Product Target Incentive & Fixed Commission Policy"
          subtitle="Configure Plot Product collection target slabs (left side policy), base fixed commissions (2.50% Business Associate / 1.00% Business Partner), and tiered performance incentives."
        />
      </div>
    </div>
  );
};

export default ProductSchemeRulesTab;
