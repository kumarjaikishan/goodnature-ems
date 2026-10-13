import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Percent,
  HelpCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';
import { confirmDialog } from '../../../../utils/confirmDialog';

const STANDARD_TENURE_PRESETS = [
  { tenureMonths: 0, label: 'Whole Downpayment (Full Payment)', baCommissionPercent: 7.0, bpCommissionPercent: 3.0, branchCommissionPercent: 1.0 },
  { tenureMonths: 6, label: '6 Months EMI', baCommissionPercent: 6.0, bpCommissionPercent: 2.5, branchCommissionPercent: 0.8 },
  { tenureMonths: 12, label: '12 Months EMI', baCommissionPercent: 5.5, bpCommissionPercent: 2.2, branchCommissionPercent: 0.6 },
  { tenureMonths: 24, label: '24 Months EMI', baCommissionPercent: 5.0, bpCommissionPercent: 2.0, branchCommissionPercent: 0.5 },
  { tenureMonths: 36, label: '36 Months EMI', baCommissionPercent: 4.5, bpCommissionPercent: 1.8, branchCommissionPercent: 0.5 },
  { tenureMonths: 48, label: '48 Months EMI', baCommissionPercent: 4.0, bpCommissionPercent: 1.5, branchCommissionPercent: 0.4 },
  { tenureMonths: 60, label: '60 Months EMI', baCommissionPercent: 3.5, bpCommissionPercent: 1.2, branchCommissionPercent: 0.3 },
];

const TenurePeriodCommissionMatrix = ({ project, onProjectUpdated }) => {
  const [tenureSlabs, setTenureSlabs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize slabs from project prop
  useEffect(() => {
    if (project && Array.isArray(project.tenureSlabs) && project.tenureSlabs.length > 0) {
      setTenureSlabs(
        project.tenureSlabs.map((s) => ({
          tenureMonths: Number(s.tenureMonths) || 0,
          label: s.label || (Number(s.tenureMonths) === 0 ? 'Whole Downpayment (Full Payment)' : `${s.tenureMonths} Months EMI`),
          baCommissionPercent: s.baCommissionPercent != null ? Number(s.baCommissionPercent) : 5.0,
          bpCommissionPercent: s.bpCommissionPercent != null ? Number(s.bpCommissionPercent) : 2.0,
          branchCommissionPercent: s.branchCommissionPercent != null ? Number(s.branchCommissionPercent) : 0.5,
        }))
      );
    } else {
      setTenureSlabs(STANDARD_TENURE_PRESETS);
    }
    setHasChanges(false);
  }, [project]);

  const handleSlabChange = (index, field, value) => {
    const updated = [...tenureSlabs];
    if (field === 'tenureMonths') {
      const val = parseInt(value, 10);
      const numVal = isNaN(val) ? 0 : Math.max(0, val);
      updated[index].tenureMonths = numVal;
      if (!updated[index].label || updated[index].label.includes('Months') || updated[index].label.includes('Downpayment')) {
        updated[index].label = numVal === 0 ? 'Whole Downpayment (Full Payment)' : `${numVal} Months EMI`;
      }
    } else if (field === 'label') {
      updated[index].label = value;
    } else {
      const floatVal = parseFloat(value);
      updated[index][field] = isNaN(floatVal) ? 0 : Math.max(0, floatVal);
    }
    setTenureSlabs(updated);
    setHasChanges(true);
  };

  const handleAddSlab = () => {
    // Pick next suggested tenure
    const existingTenures = tenureSlabs.map((s) => s.tenureMonths);
    let nextTenure = 12;
    if (existingTenures.includes(12)) nextTenure = 24;
    if (existingTenures.includes(24)) nextTenure = 36;
    if (existingTenures.includes(36)) nextTenure = 48;
    if (existingTenures.includes(48)) nextTenure = 60;
    if (existingTenures.includes(60)) nextTenure = Math.max(...existingTenures, 0) + 12;

    const newSlab = {
      tenureMonths: nextTenure,
      label: `${nextTenure} Months EMI`,
      baCommissionPercent: 5.0,
      bpCommissionPercent: 2.0,
      branchCommissionPercent: 0.5,
    };
    setTenureSlabs([...tenureSlabs, newSlab]);
    setHasChanges(true);
  };

  const handleRemoveSlab = (index) => {
    if (tenureSlabs.length <= 1) {
      toast.error('You must keep at least one booking period slab');
      return;
    }
    const updated = tenureSlabs.filter((_, i) => i !== index);
    setTenureSlabs(updated);
    setHasChanges(true);
  };

  const handleResetToPresets = async () => {
    const ok = await confirmDialog({
      title: 'Reset to Standard Tenure Periods?',
      text: 'This will reset the slabs to standard schemes: Whole Downpayment, 6M, 12M, 24M, 36M, 48M, and 60M with default percentages.',
      confirmText: 'Reset Slabs',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    setTenureSlabs(STANDARD_TENURE_PRESETS);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!project?._id) {
      toast.error('No project selected');
      return;
    }

    // Validate unique tenures
    const seen = new Set();
    for (const s of tenureSlabs) {
      if (seen.has(s.tenureMonths)) {
        toast.error(`Duplicate tenure period detected: ${s.tenureMonths === 0 ? 'Whole Downpayment' : `${s.tenureMonths} Months`}. Each period must be unique.`);
        return;
      }
      seen.add(s.tenureMonths);
    }

    try {
      setSaving(true);
      const res = await api.put(`/plots/projects/${project._id}`, {
        tenureSlabs,
      });
      toast.success(`Commission policy updated for ${project.name}`);
      setHasChanges(false);
      if (onProjectUpdated) {
        onProjectUpdated(res.data?.data || null);
      }
    } catch (err) {
      console.error('Failed to save project commission slabs:', err);
      toast.error(err.response?.data?.message || 'Failed to save commission policy');
    } finally {
      setSaving(false);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Policy Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/50 via-white to-emerald-50/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-800 text-white text-xs">
              <Calendar size={16} />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              {project.name} — Booking Period &amp; Tenure Commission Policy
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
              Tenure Based
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            In this system, commission is not calculated on turnover business volume, but directly upon the <span className="font-semibold text-slate-700">booking period selected</span> (e.g. Whole Downpayment / Full Payment, 24 Months, 36 Months). When a plot booking or payment is registered for this project, the corresponding commission % is automatically rewarded.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToPresets}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
            title="Preload standard tenure slabs"
          >
            <Sparkles size={13} className="text-teal-700" />
            <span>Standard Presets</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                : 'bg-teal-800 hover:bg-teal-900 text-white'
            }`}
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : hasChanges ? 'Save Changes *' : 'Save Commission Policy'}</span>
          </button>
        </div>
      </div>

      {/* Slabs Table Container */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-teal-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Configured Booking Periods ({tenureSlabs.length})
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddSlab}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Booking Period</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 w-16 text-center">#</th>
                <th className="p-3.5 min-w-[140px]">Tenure (Months)</th>
                <th className="p-3.5 min-w-[220px]">Period Label / Scheme Name</th>
                <th className="p-3.5 min-w-[170px] bg-teal-50/60 text-teal-950">
                  <div className="flex items-center gap-1">
                    <span>Business Associate (BA) %</span>
                    <Percent size={12} className="text-teal-700" />
                  </div>
                </th>
                <th className="p-3.5 min-w-[170px] bg-sky-50/60 text-sky-950">
                  <div className="flex items-center gap-1">
                    <span>Business Partner (BP) %</span>
                    <Percent size={12} className="text-sky-700" />
                  </div>
                </th>
                <th className="p-3.5 min-w-[160px] bg-slate-100/60 text-slate-900">
                  <div className="flex items-center gap-1">
                    <span>Branch Partner %</span>
                    <Percent size={12} className="text-slate-600" />
                  </div>
                </th>
                <th className="p-3.5 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {tenureSlabs.map((slab, index) => {
                const isDownpayment = slab.tenureMonths === 0;
                return (
                  <tr
                    key={index}
                    className={`hover:bg-slate-50/80 transition ${
                      isDownpayment ? 'bg-amber-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 text-center text-slate-400 font-bold text-[11px]">
                      {index + 1}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={slab.tenureMonths}
                          onChange={(e) => handleSlabChange(index, 'tenureMonths', e.target.value)}
                          className={`w-20 h-9 px-2.5 text-center font-bold text-xs rounded-lg border outline-none focus:ring-2 focus:ring-teal-600 ${
                            isDownpayment
                              ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 font-bold">
                          {isDownpayment ? '(Full)' : 'Mos'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3">
                      <input
                        type="text"
                        value={slab.label}
                        onChange={(e) => handleSlabChange(index, 'label', e.target.value)}
                        placeholder="e.g. 24 Months EMI or Whole Downpayment"
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </td>

                    <td className="p-3 bg-teal-50/30">
                      <div className="relative max-w-[130px]">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={slab.baCommissionPercent}
                          onChange={(e) => handleSlabChange(index, 'baCommissionPercent', e.target.value)}
                          className="w-full h-9 pl-3 pr-7 bg-white border border-teal-200 rounded-lg text-xs font-bold text-teal-900 outline-none focus:ring-2 focus:ring-teal-600"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          %
                        </span>
                      </div>
                    </td>

                    <td className="p-3 bg-sky-50/30">
                      <div className="relative max-w-[130px]">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={slab.bpCommissionPercent}
                          onChange={(e) => handleSlabChange(index, 'bpCommissionPercent', e.target.value)}
                          className="w-full h-9 pl-3 pr-7 bg-white border border-sky-200 rounded-lg text-xs font-bold text-sky-900 outline-none focus:ring-2 focus:ring-sky-600"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          %
                        </span>
                      </div>
                    </td>

                    <td className="p-3 bg-slate-50/50">
                      <div className="relative max-w-[130px]">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={slab.branchCommissionPercent}
                          onChange={(e) => handleSlabChange(index, 'branchCommissionPercent', e.target.value)}
                          className="w-full h-9 pl-3 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-600"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          %
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove period slab"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Informative Footer Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
          <HelpCircle size={17} className="text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">How Tenure Commission Works:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
              <li>
                <span className="font-semibold text-slate-700">Tenure 0 Months</span> = Full / Whole Downpayment. Sponsoring associates receive this fixed percentage on all receipts credited under full payment bookings.
              </li>
              <li>
                <span className="font-semibold text-slate-700">Tenure &gt; 0 Months (e.g. 24, 36 Months)</span> = EMI Installment Scheme. When a customer pays booking downpayment and subsequent monthly installments, commissions are calculated at this specific rate.
              </li>
              <li>
                This policy is exclusively linked with <span className="font-bold text-teal-800">{project.name}</span> for Plot Bookings and Plot Sales. Plot Products (micro-plots/fractional units) continue using their designated investment schemes.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenurePeriodCommissionMatrix;
