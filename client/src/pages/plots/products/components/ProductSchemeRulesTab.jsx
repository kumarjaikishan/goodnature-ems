import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  TrendingUp,
  Coins,
  Percent,
} from 'lucide-react';
import api from '../../../../api/axios';
import PageLoader from '../../../../components/common/PageLoader';
import { toast } from '../../../../utils/toast';

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
      if (res.data?.success && res.data?.data) {
        setConfig({
          minRdAmount: res.data.data.minRdAmount ?? 2000,
          rdStepAmount: res.data.data.rdStepAmount ?? 1000,
          minFdAmount: res.data.data.minFdAmount ?? 50000,
          fdStepAmount: res.data.data.fdStepAmount ?? 1000,
          prematureAnnualInterestPercent: res.data.data.prematureAnnualInterestPercent ?? 6.0,
          rdPrematureAnnualInterestPercent: res.data.data.rdPrematureAnnualInterestPercent ?? 6.0,
          fdPrematureAnnualInterestPercent: res.data.data.fdPrematureAnnualInterestPercent ?? 6.0,
          slabs: (res.data.data.slabs || []).map((s) => ({
            tenureMonths: s.tenureMonths,
            rdMaturityPercent: s.rdMaturityPercent,
            fdMaturityPercent: s.fdMaturityPercent,
            rdPromoterCommissionPercent: s.rdPromoterCommissionPercent ?? 4.0,
            fdPromoterCommissionPercent: s.fdPromoterCommissionPercent ?? 5.0,
            bpRdCommissionPercent: s.bpRdCommissionPercent ?? s.developerCommissionPercent ?? 1.0,
            bpFdCommissionPercent: s.bpFdCommissionPercent ?? s.developerCommissionPercent ?? 1.0,
            branchRdCommissionPercent: s.branchRdCommissionPercent ?? 0.5,
            branchFdCommissionPercent: s.branchFdCommissionPercent ?? 0.5,
          })),
          rulesAndRegulations: res.data.data.rulesAndRegulations || [],
        });
      }
    } catch (err) {
      console.error('Failed to load scheme rules', err);
      toast.error('Failed to load scheme rules');
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
          rdPromoterCommissionPercent: lastSlab ? Number(lastSlab.rdPromoterCommissionPercent || 4) : 4.0,
          fdPromoterCommissionPercent: lastSlab ? Number(lastSlab.fdPromoterCommissionPercent || 5) : 5.0,
          bpRdCommissionPercent: lastSlab ? Number(lastSlab.bpRdCommissionPercent || 1) : 1.0,
          bpFdCommissionPercent: lastSlab ? Number(lastSlab.bpFdCommissionPercent || 1) : 1.0,
          branchRdCommissionPercent: lastSlab ? Number(lastSlab.branchRdCommissionPercent || 0.5) : 0.5,
          branchFdCommissionPercent: lastSlab ? Number(lastSlab.branchFdCommissionPercent || 0.5) : 0.5,
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
    updated[index] = { ...updated[index], [field]: Number(value) || 0 };
    setConfig({ ...config, slabs: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await api.put('/investments/config', config);
      if (res.data?.success) {
        toast.success('Product Scheme Rules updated successfully');
        if (onSchemeUpdated) onSchemeUpdated();
      } else {
        toast.error(res.data?.message || 'Failed to update scheme rules');
      }
    } catch (err) {
      console.error('Failed to update scheme rules', err);
      toast.error(err.response?.data?.message || 'Failed to update scheme rules');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader title="Loading Product Scheme Rules..." subtitle="Fetching EMI & One-Time Full Payment maturity slabs" />;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Tenure Maturity Returns & Role Fixed Commission Matrix Table */}
        <div className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Customer Tenure Returns & Hierarchy Fixed Commission Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set customer returns and instant fixed commissions for Business Associate, Business Partner, and Branch Partner based on sale period / tenure.
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
            <table className="w-full border-collapse text-left text-xs min-w-[1050px]">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3">Tenure (अवधि)</th>
                  <th className="p-3">
                    <div className="flex items-center gap-1.5 text-teal-900">
                      <Coins size={14} className="text-teal-700" />
                      <span>EMI (R.D.) Return (%)</span>
                    </div>
                  </th>
                  <th className="p-3">
                    <div className="flex items-center gap-1.5 text-emerald-900">
                      <TrendingUp size={14} className="text-emerald-700" />
                      <span>One-Time (F.D.) Return (%)</span>
                    </div>
                  </th>
                  {/* Business Associate Fixed */}
                  <th className="p-3 bg-blue-50/70 border-l border-blue-200">
                    <div className="text-blue-900">
                      <span className="font-extrabold block">BA (Associate) Fixed %</span>
                      <span className="text-[9px] font-semibold text-blue-700 block mt-0.5">EMI | One-Time</span>
                    </div>
                  </th>
                  {/* Business Partner Fixed */}
                  <th className="p-3 bg-amber-50/70 border-l border-amber-200">
                    <div className="text-amber-900">
                      <span className="font-extrabold block">BP (Partner) Fixed %</span>
                      <span className="text-[9px] font-semibold text-amber-700 block mt-0.5">EMI | One-Time</span>
                    </div>
                  </th>
                  {/* Branch Partner Fixed */}
                  <th className="p-3 bg-purple-50/70 border-l border-purple-200">
                    <div className="text-purple-900">
                      <span className="font-extrabold block">Branch Partner Fixed %</span>
                      <span className="text-[9px] font-semibold text-purple-700 block mt-0.5">EMI | One-Time</span>
                    </div>
                  </th>
                  <th className="p-3 text-center border-l border-slate-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.slabs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          className="w-16 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-slate-900"
                          value={s.tenureMonths}
                          onChange={(e) => handleSlabChange(idx, 'tenureMonths', e.target.value)}
                          required
                        />
                        <span className="text-slate-500 font-semibold text-xs whitespace-nowrap">
                          M ({+(s.tenureMonths / 12).toFixed(1)}Y)
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-teal-800"
                          value={s.rdMaturityPercent}
                          onChange={(e) => handleSlabChange(idx, 'rdMaturityPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-teal-700 text-xs">%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-emerald-800"
                          value={s.fdMaturityPercent}
                          onChange={(e) => handleSlabChange(idx, 'fdMaturityPercent', e.target.value)}
                          required
                        />
                        <span className="font-bold text-emerald-700 text-xs">%</span>
                      </div>
                    </td>

                    {/* Business Associate Fixed (EMI & One-Time) */}
                    <td className="p-3 bg-blue-50/30 border-l border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1" title="BA Monthly EMI Fixed %">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 h-8 bg-white border border-blue-300 rounded-lg px-2 text-xs font-bold text-blue-800"
                            value={s.rdPromoterCommissionPercent ?? ''}
                            placeholder="EMI %"
                            onChange={(e) => handleSlabChange(idx, 'rdPromoterCommissionPercent', e.target.value)}
                          />
                          <span className="font-bold text-blue-700 text-xs">%</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1" title="BA One-Time FD Fixed %">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 h-8 bg-white border border-blue-300 rounded-lg px-2 text-xs font-bold text-blue-800"
                            value={s.fdPromoterCommissionPercent ?? ''}
                            placeholder="FD %"
                            onChange={(e) => handleSlabChange(idx, 'fdPromoterCommissionPercent', e.target.value)}
                          />
                          <span className="font-bold text-blue-700 text-xs">%</span>
                        </div>
                      </div>
                    </td>

                    {/* Business Partner Fixed (EMI & One-Time) */}
                    <td className="p-3 bg-amber-50/30 border-l border-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1" title="BP Monthly EMI Fixed %">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 h-8 bg-white border border-amber-300 rounded-lg px-2 text-xs font-bold text-amber-900"
                            value={s.bpRdCommissionPercent ?? ''}
                            placeholder="EMI %"
                            onChange={(e) => handleSlabChange(idx, 'bpRdCommissionPercent', e.target.value)}
                          />
                          <span className="font-bold text-amber-800 text-xs">%</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1" title="BP One-Time FD Fixed %">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 h-8 bg-white border border-amber-300 rounded-lg px-2 text-xs font-bold text-amber-900"
                            value={s.bpFdCommissionPercent ?? ''}
                            placeholder="FD %"
                            onChange={(e) => handleSlabChange(idx, 'bpFdCommissionPercent', e.target.value)}
                          />
                          <span className="font-bold text-amber-800 text-xs">%</span>
                        </div>
                      </div>
                    </td>

                    {/* Branch Partner Fixed (EMI & One-Time) */}
                    <td className="p-3 bg-purple-50/30 border-l border-purple-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1" title="Branch Partner Monthly EMI Fixed %">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 h-8 bg-white border border-purple-300 rounded-lg px-2 text-xs font-bold text-purple-900"
                            value={s.branchRdCommissionPercent ?? ''}
                            placeholder="EMI %"
                            onChange={(e) => handleSlabChange(idx, 'branchRdCommissionPercent', e.target.value)}
                          />
                          <span className="font-bold text-purple-800 text-xs">%</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1" title="Branch Partner One-Time FD Fixed %">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 h-8 bg-white border border-purple-300 rounded-lg px-2 text-xs font-bold text-purple-900"
                            value={s.branchFdCommissionPercent ?? ''}
                            placeholder="FD %"
                            onChange={(e) => handleSlabChange(idx, 'branchFdCommissionPercent', e.target.value)}
                          />
                          <span className="font-bold text-purple-800 text-xs">%</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center border-l border-slate-100">
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

export default ProductSchemeRulesTab;
