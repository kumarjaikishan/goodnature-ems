import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';
import PageLoader from '../../../../components/common/PageLoader';

// 0 Month (One Time Full Payment) -> 20% DEDUCT (discount)
// 1 Month -> 19% DEDUCT
// ...
// 20 Month -> 0% DEDUCT
// 21 Month -> 1% ADD
// 22 Month -> 2% ADD
// 23 Month -> 3% ADD
// 24 Month -> 4% ADD
const generateDefaultScaleSlabs = () => {
  const list = [];
  for (let m = 0; m <= 24; m++) {
    if (m <= 20) {
      list.push({
        tenureMonths: m,
        action: 'DEDUCT',
        percentage: 20 - m,
      });
    } else {
      list.push({
        tenureMonths: m,
        action: 'ADD',
        percentage: m - 20,
      });
    }
  }
  return list;
};

export default function ProductEmiTenureSlabsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rateConfig, setRateConfig] = useState(null);
  const [slabs, setSlabs] = useState([]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plots/rate-config');
      const data = res.data?.data || res.data || {};
      setRateConfig(data);
      if (Array.isArray(data.emiTenureAdjustments) && data.emiTenureAdjustments.length > 0) {
        setSlabs(data.emiTenureAdjustments);
      } else {
        setSlabs(generateDefaultScaleSlabs());
      }
    } catch (err) {
      console.error('Failed to load EMI tenure slabs config:', err);
      toast.error('Failed to load EMI tenure adjustment slabs');
      setSlabs(generateDefaultScaleSlabs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSlabChange = (index, field, value) => {
    setSlabs((prev) => {
      const next = [...prev];
      let formattedVal = value;
      if (field === 'tenureMonths') {
        formattedVal = Math.max(0, parseInt(value, 10) || 0);
      } else if (field === 'percentage') {
        formattedVal = Math.max(0, Math.min(100, parseFloat(value) || 0));
      }
      next[index] = { ...next[index], [field]: formattedVal };
      return next;
    });
  };

  const handleAddSlab = () => {
    setSlabs((prev) => {
      const maxTenure = prev.reduce((max, s) => Math.max(max, Number(s.tenureMonths) || 0), -1);
      const nextTenure = maxTenure + 1;
      const isAdd = nextTenure > 20;
      const pct = isAdd ? nextTenure - 20 : (20 - nextTenure);
      return [
        ...prev,
        {
          tenureMonths: nextTenure,
          action: isAdd ? 'ADD' : 'DEDUCT',
          percentage: pct,
        },
      ];
    });
  };

  const handleDeleteSlab = (index) => {
    if (slabs.length <= 1) {
      toast.error('At least one tenure adjustment slab is required');
      return;
    }
    setSlabs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset EMI tenure slabs to standard 0-24 Months rule (0M: 20% discount, 1M: 19% discount ... 20M: 0%, 21M: +1% add)?')) {
      setSlabs(generateDefaultScaleSlabs());
      toast.info('Loaded default 0-24 months scale slabs. Click "Save Configuration" to commit.');
    }
  };

  const handleSave = async () => {
    // Validate uniqueness of tenure months
    const seenTenures = new Set();
    for (const slab of slabs) {
      const t = Number(slab.tenureMonths);
      if (seenTenures.has(t)) {
        toast.error(`Duplicate tenure month found: ${t} Months. Each tenure month must be unique.`);
        return;
      }
      seenTenures.add(t);
    }

    setSaving(true);
    try {
      const payload = {
        emiTenureAdjustments: slabs
          .map((s) => ({
            tenureMonths: Number(s.tenureMonths),
            action: s.action === 'ADD' ? 'ADD' : 'DEDUCT',
            percentage: Number(s.percentage) || 0,
          }))
          .sort((a, b) => a.tenureMonths - b.tenureMonths),
      };

      await api.put('/plots/rate-config', payload);
      toast.success('EMI tenure adjustment slabs saved successfully!');
      await fetchConfig();
    } catch (err) {
      console.error('Failed to save EMI slabs:', err);
      toast.error(err.response?.data?.message || 'Failed to save EMI tenure slabs');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader title="Loading EMI Tenure Slabs..." subtitle="Fetching dynamic rate adjustment matrix" />;
  }

  return (
    <div className="space-y-6">
      {/* Banner / Header Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sliders size={18} />
              </span>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                Plot Pricing Policy
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              EMI Tenure Rate Adjustment Slabs
            </h2>
            <p className="text-xs md:text-sm text-teal-100/80 max-w-2xl leading-relaxed">
              Define the percentage discount (<span className="text-amber-300 font-bold">DEDUCT</span>) or markup (<span className="text-emerald-300 font-bold">ADD</span>) applied to the total plot value based on the chosen EMI duration during Plot Booking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-semibold transition flex items-center gap-2 border border-white/10 cursor-pointer"
              title="Reset to 0-24 months standard scale defaults"
            >
              <RotateCcw size={15} />
              Reset 0-24 Scale
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-teal-950 text-xs md:text-sm font-black transition flex items-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Tip */}
      <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200/80 flex items-start gap-3">
        <Info className="text-teal-700 mt-0.5 shrink-0" size={18} />
        <div className="text-xs text-teal-900 leading-relaxed">
          <span className="font-bold">Active Tenure Scale Rule:</span>
          <ul className="list-disc list-inside mt-1 space-y-0.5 font-medium text-teal-800">
            <li><span className="font-bold text-amber-800">0 Month (Full One-Time Payment):</span> <strong>20% Discount (Deduct)</strong></li>
            <li><span className="font-bold text-amber-800">1 to 19 Months EMI:</span> <strong>19% down to 1% Discount (Deduct)</strong></li>
            <li><span className="font-bold text-slate-800">20 Months EMI:</span> <strong>0% (Standard Base Plot Value)</strong></li>
            <li><span className="font-bold text-emerald-800">21+ Months EMI:</span> <strong>+1%, +2%, +3% ... Added Markup</strong></li>
          </ul>
        </div>
      </div>

      {/* Slabs Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-teal-700" />
              Configured Tenure Slabs ({slabs.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure each EMI tenure month, action (Deduct Discount or Add Markup), and percentage.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSlab}
            className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 border border-teal-200 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={15} />
            + Add Slab
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50/90 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">#</th>
                <th className="py-3 px-4">EMI Tenure</th>
                <th className="py-3 px-4">Adjustment Action</th>
                <th className="py-3 px-4">Percentage (%)</th>
                <th className="py-3 px-4">Effect on ₹10 Lakhs Plot</th>
                <th className="py-3 px-4 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slabs.map((slab, idx) => {
                const isAdd = slab.action === 'ADD';
                const isZero = Number(slab.percentage) === 0;
                return (
                  <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                    {/* Index */}
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* EMI Tenure Month */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={slab.tenureMonths}
                          onChange={(e) => handleSlabChange(idx, 'tenureMonths', e.target.value)}
                          className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 text-center"
                        />
                        <span className="text-xs font-semibold text-slate-600">
                          {Number(slab.tenureMonths) === 0 ? (
                            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              0 Month (One-Time Full Payment)
                            </span>
                          ) : (
                            `${slab.tenureMonths} ${slab.tenureMonths === 1 ? 'Month' : 'Months'} EMI`
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Action Select: DEDUCT / ADD */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={slab.action || 'DEDUCT'}
                          onChange={(e) => handleSlabChange(idx, 'action', e.target.value)}
                          className={`px-3 py-1.5 rounded-lg border font-bold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-700 ${
                            isZero
                              ? 'bg-slate-50 text-slate-700 border-slate-300'
                              : isAdd
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="DEDUCT">DEDUCT (- Rebate / Discount)</option>
                          <option value="ADD">ADD (+ Increase Rate / Value)</option>
                        </select>
                      </div>
                    </td>

                    {/* Percentage Field */}
                    <td className="py-3 px-4">
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={slab.percentage}
                          onChange={(e) => handleSlabChange(idx, 'percentage', e.target.value)}
                          className="w-24 pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 text-right font-mono"
                        />
                        <span className="absolute right-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>

                    {/* Preview Formula */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {isZero ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            0% (No change / Standard Rate)
                          </span>
                        ) : isAdd ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <TrendingUp size={13} />
                            +{slab.percentage}% Added to Plot Value
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <TrendingDown size={13} />
                            -{slab.percentage}% Discount Deducted
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 hidden lg:inline font-mono">
                          (₹10L → {isZero ? '₹10.0L' : isAdd ? `₹${(10 + (10 * Number(slab.percentage || 0)) / 100).toFixed(2)}L` : `₹${(10 - (10 * Number(slab.percentage || 0)) / 100).toFixed(2)}L`})
                        </span>
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteSlab(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete this tenure slab"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Total {slabs.length} tenure slabs defined. Applied in Step 3 of Plot Booking.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAddSlab}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 cursor-pointer"
            >
              <Plus size={15} />
              Add More Slabs
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
