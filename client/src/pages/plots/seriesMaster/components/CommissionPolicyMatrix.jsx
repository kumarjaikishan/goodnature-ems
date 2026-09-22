import React, { useState, useEffect } from 'react';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';
import {
  Award,
  Plus,
  Trash2,
  Save,
  Building,
  TrendingUp,
  RotateCcw,
  Gift,
  Columns,
} from 'lucide-react';

const CommissionPolicyMatrix = ({
  initialBusinessType = 'PLOT_SALE',
  showTypeToggle = true,
  title = 'Target Incentive & Fixed Commission Policy',
  subtitle = 'Configure collection business target slabs, fixed base rates, and tiered incentive percentages.',
}) => {
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    setBusinessType(initialBusinessType);
  }, [initialBusinessType]);

  const normalizePolicyData = (rawPolicy) => {
    if (!rawPolicy) return rawPolicy;
    const p = JSON.parse(JSON.stringify(rawPolicy));

    (p.roles || []).forEach((role) => {
      if (!Array.isArray(role.extraColumns) || role.extraColumns.length === 0) {
        role.extraColumns = [{ id: 'reward_col_1', label: 'Reward / Extra Incentive' }];
      }

      (role.targetSlabs || []).forEach((slab) => {
        if (!Array.isArray(slab.extraIncentives)) {
          slab.extraIncentives = [];
        }

        role.extraColumns.forEach((col) => {
          let item = slab.extraIncentives.find((x) => x.columnId === col.id);
          if (!item) {
            const isFirst = col.id === 'reward_col_1' || col.id === role.extraColumns[0]?.id;
            item = {
              columnId: col.id,
              label: col.label,
              percent: isFirst ? (slab.rewardPercent ?? '') : '',
              rewardTitle: isFirst ? (slab.rewardTitle || '') : '',
            };
            slab.extraIncentives.push(item);
          }
        });
      });
    });

    return p;
  };

  const fetchPolicy = async (type = businessType) => {
    setLoading(true);
    try {
      const res = await api.get(`/plots/commission-policy?type=${type}`);
      if (res.data?.data) {
        setPolicy(normalizePolicyData(res.data.data));
      }
    } catch {
      toast.error('Failed to load commission policy configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy(businessType);
  }, [businessType]);

  const handleSavePolicy = async (e) => {
    if (e) e.preventDefault();
    if (!policy) return;

    setSaving(true);
    try {
      const sanitizedRoles = (policy.roles || []).map((role) => {
        const extraCols = (role.extraColumns || []).map((c) => ({
          id: String(c.id || ''),
          label: String(c.label || ''),
        }));

        return {
          roleName: role.roleName,
          fixedCommissionPercent: Number(role.fixedCommissionPercent) || 0,
          extraColumns: extraCols,
          targetSlabs: (role.targetSlabs || []).map((slab) => {
            const extraIncs = (slab.extraIncentives || []).map((item) => ({
              columnId: String(item.columnId || ''),
              label: String(item.label || ''),
              percent: Number(item.percent) || 0,
              rewardTitle: String(item.rewardTitle || '').trim(),
            }));

            const primaryExtra = extraIncs[0];

            return {
              minAmount: Number(slab.minAmount) || 0,
              maxAmount:
                slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined
                  ? null
                  : Number(slab.maxAmount),
              fixedCommissionPercent:
                slab.fixedCommissionPercent === null ||
                slab.fixedCommissionPercent === '' ||
                slab.fixedCommissionPercent === undefined
                  ? Number(role.fixedCommissionPercent) || 0
                  : Number(slab.fixedCommissionPercent),
              targetIncentivePercent: Number(slab.targetIncentivePercent) || 0,
              rewardPercent: primaryExtra ? primaryExtra.percent : Number(slab.rewardPercent) || 0,
              rewardTitle: primaryExtra ? primaryExtra.rewardTitle : slab.rewardTitle || '',
              extraIncentives: extraIncs,
              label: slab.label || '',
            };
          }),
        };
      });

      const payload = {
        policyName: policy.policyName,
        businessType: policy.businessType,
        validFrom: policy.validFrom,
        validTo: policy.validTo,
        roles: sanitizedRoles,
      };

      await api.put(`/plots/commission-policy?type=${policy.businessType}`, payload);
      toast.success(
        `${policy.businessType === 'PLOT_SALE' ? 'Plot Sales' : 'RD/FD'} Commission Policy saved successfully!`
      );
      fetchPolicy(policy.businessType);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission policy');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleFixedChange = (roleIndex, value) => {
    const updated = { ...policy };
    const cleaned = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    updated.roles[roleIndex].fixedCommissionPercent = cleaned;

    (updated.roles[roleIndex].targetSlabs || []).forEach((slab) => {
      slab.fixedCommissionPercent = cleaned;
    });

    setPolicy(updated);
  };

  const handleSlabFieldChange = (roleIndex, slabIndex, field, value) => {
    const updated = { ...policy };
    const slab = updated.roles[roleIndex].targetSlabs[slabIndex];
    const strVal = String(value ?? '');

    if (field === 'targetIncentivePercent' || field === 'fixedCommissionPercent') {
      slab[field] = strVal.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    } else if (field === 'minAmount') {
      slab[field] = strVal.replace(/[^0-9]/g, '');
    } else if (field === 'maxAmount') {
      if (value === 'unlimited' || value === '' || value === null || value === undefined) {
        slab.maxAmount = null;
      } else {
        slab.maxAmount = strVal.replace(/[^0-9]/g, '');
      }
    } else {
      slab[field] = value;
    }

    setPolicy(updated);
  };

  const handleAddExtraColumn = (roleIndex) => {
    const updated = { ...policy };
    const role = updated.roles[roleIndex];
    if (!Array.isArray(role.extraColumns)) {
      role.extraColumns = [];
    }

    const newColId = `col_${Date.now()}`;
    const newColLabel = `Incentive Col ${role.extraColumns.length + 1}`;
    role.extraColumns.push({ id: newColId, label: newColLabel });

    (role.targetSlabs || []).forEach((slab) => {
      if (!Array.isArray(slab.extraIncentives)) {
        slab.extraIncentives = [];
      }
      slab.extraIncentives.push({
        columnId: newColId,
        label: newColLabel,
        percent: '',
        rewardTitle: '',
      });
    });

    setPolicy(updated);
  };

  const handleRemoveExtraColumn = (roleIndex, colIndex) => {
    const updated = { ...policy };
    const role = updated.roles[roleIndex];
    const removedCol = role.extraColumns[colIndex];
    if (!removedCol) return;

    role.extraColumns.splice(colIndex, 1);
    (role.targetSlabs || []).forEach((slab) => {
      if (Array.isArray(slab.extraIncentives)) {
        slab.extraIncentives = slab.extraIncentives.filter((item) => item.columnId !== removedCol.id);
      }
    });

    setPolicy(updated);
  };

  const handleRenameExtraColumn = (roleIndex, colIndex, newLabel) => {
    const updated = { ...policy };
    const role = updated.roles[roleIndex];
    if (role.extraColumns && role.extraColumns[colIndex]) {
      role.extraColumns[colIndex].label = newLabel;
      const colId = role.extraColumns[colIndex].id;
      (role.targetSlabs || []).forEach((slab) => {
        if (Array.isArray(slab.extraIncentives)) {
          const item = slab.extraIncentives.find((x) => x.columnId === colId);
          if (item) item.label = newLabel;
        }
      });
      setPolicy(updated);
    }
  };

  const handleSlabExtraIncentiveChange = (roleIndex, slabIndex, columnId, field, value) => {
    const updated = { ...policy };
    const slab = updated.roles[roleIndex].targetSlabs[slabIndex];
    if (!Array.isArray(slab.extraIncentives)) {
      slab.extraIncentives = [];
    }

    let item = slab.extraIncentives.find((x) => x.columnId === columnId);
    if (!item) {
      item = { columnId, percent: '', rewardTitle: '', label: '' };
      slab.extraIncentives.push(item);
    }

    if (field === 'percent') {
      const strVal = String(value ?? '');
      item.percent = strVal.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    } else {
      item[field] = value;
    }

    const role = updated.roles[roleIndex];
    if (role.extraColumns && role.extraColumns[0]?.id === columnId) {
      if (field === 'percent') slab.rewardPercent = item.percent;
      if (field === 'rewardTitle') slab.rewardTitle = item.rewardTitle;
    }

    setPolicy(updated);
  };

  const handleAddSlab = (roleIndex) => {
    const updated = { ...policy };
    const currentSlabs = updated.roles[roleIndex].targetSlabs || [];
    const lastSlab = currentSlabs[currentSlabs.length - 1];
    const extraCols = updated.roles[roleIndex].extraColumns || [];

    let newMin = 1;
    let newMax = null;
    let newIncentive = policy.roles[roleIndex].roleName === 'BRANCH_PARTNER' ? 0.0 : 2.0;

    const roleFixed =
      Number(policy.roles[roleIndex].fixedCommissionPercent) ||
      (policy.roles[roleIndex].roleName === 'BRANCH_PARTNER'
        ? 0.0
        : policy.roles[roleIndex].roleName === 'BUSINESS_PARTNER'
        ? 2.0
        : 5.0);

    if (lastSlab) {
      const prevMax = lastSlab.maxAmount
        ? Number(lastSlab.maxAmount)
        : Number(lastSlab.minAmount) + 500000;
      newMin = prevMax + 1;
      newMax = newMin + 999999;
      newIncentive = +(
        Number(lastSlab.targetIncentivePercent) +
        (policy.roles[roleIndex].roleName === 'BRANCH_PARTNER'
          ? 0.0
          : policy.roles[roleIndex].roleName === 'BUSINESS_PARTNER'
          ? 0.15
          : 1.0)
      ).toFixed(3);
    }

    const newSlab = {
      minAmount: newMin,
      maxAmount: newMax,
      fixedCommissionPercent: roleFixed,
      targetIncentivePercent: newIncentive,
      rewardPercent: 0,
      rewardTitle: '',
      extraIncentives: extraCols.map((c) => ({
        columnId: c.id,
        label: c.label,
        percent: '',
        rewardTitle: '',
      })),
      label: `₹${newMin.toLocaleString('en-IN')} - ${newMax ? `₹${newMax.toLocaleString('en-IN')}` : 'Above'}`,
    };

    updated.roles[roleIndex].targetSlabs = [...currentSlabs, newSlab];
    setPolicy(updated);
  };

  const handleRemoveSlab = (roleIndex, slabIndex) => {
    const updated = { ...policy };
    updated.roles[roleIndex].targetSlabs = updated.roles[roleIndex].targetSlabs.filter(
      (_, i) => i !== slabIndex
    );
    setPolicy(updated);
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 font-semibold text-sm">Loading Commission Slabs &amp; Policy...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs space-y-3">
        <p className="text-slate-600 font-medium text-sm">No policy active for {businessType}.</p>
        <button
          type="button"
          onClick={() => fetchPolicy(businessType)}
          className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold"
        >
          Initialize / Reload Default Policy
        </button>
      </div>
    );
  }

  const associateRoleIdx = policy.roles?.findIndex((r) => r.roleName === 'BUSINESS_ASSOCIATE');
  const partnerRoleIdx = policy.roles?.findIndex((r) => r.roleName === 'BUSINESS_PARTNER');
  const branchPartnerRoleIdx = policy.roles?.findIndex((r) => r.roleName === 'BRANCH_PARTNER');

  const associateRole = associateRoleIdx !== -1 ? policy.roles[associateRoleIdx] : null;
  const partnerRole = partnerRoleIdx !== -1 ? policy.roles[partnerRoleIdx] : null;
  const branchPartnerRole = branchPartnerRoleIdx !== -1 ? policy.roles[branchPartnerRoleIdx] : null;

  const associateFixed =
    Number(associateRole?.fixedCommissionPercent) || (businessType === 'PLOT_SALE' ? 5.0 : 2.5);
  const partnerFixed =
    Number(partnerRole?.fixedCommissionPercent) || (businessType === 'PLOT_SALE' ? 2.0 : 1.0);
  const branchPartnerFixed =
    Number(branchPartnerRole?.fixedCommissionPercent) || 0.0;

  return (
    <div className="space-y-6">
      {/* Policy Selector & Top Actions Header */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <Award size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {title}
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Business Type Toggle */}
          {showTypeToggle && (
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setBusinessType('PLOT_SALE')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  businessType === 'PLOT_SALE'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building size={14} /> Plot Sales Policy
              </button>
              <button
                type="button"
                onClick={() => setBusinessType('INVESTMENT_RD_FD')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  businessType === 'INVESTMENT_RD_FD'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp size={14} /> RD / FD Investments
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchPolicy(businessType)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Reset changes"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={handleSavePolicy}
            disabled={saving}
            className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? 'Saving Policy...' : 'Save Commission Policy'}</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: BUSINESS ASSOCIATE SLABS TABLE ── */}
      {associateRole && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <h3 className="text-base font-bold text-slate-800">
                  Business Associate (BA) Target &amp; Incentive Slabs
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Applied to direct sponsors &amp; subordinates. Fixed base % + period closing target incentive % + additional rewards distributed at closing.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-teal-900">Base Fixed %:</span>
                <input
                  type="tel"
                  inputMode="decimal"
                  className="w-16 px-2 py-0.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-900 text-center"
                  value={associateRole.fixedCommissionPercent ?? ''}
                  onChange={(e) => handleRoleFixedChange(associateRoleIdx, e.target.value)}
                  placeholder="5.0"
                />
                <span className="text-xs font-bold text-teal-800">%</span>
              </div>

              <button
                type="button"
                onClick={() => handleAddExtraColumn(associateRoleIdx)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
                title="Add extra reward/incentive column"
              >
                <Columns size={14} className="text-amber-700" />
                <span>+ Add Incentive Column</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddSlab(associateRoleIdx)}
                className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <Plus size={15} /> Add BA Slab
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                  <th className="p-3">Slab Label</th>
                  <th className="p-3">Min Collection (₹)</th>
                  <th className="p-3">Max Collection (₹)</th>
                  <th className="p-3 bg-teal-50/70 text-teal-900">
                    Fixed Base %<br />
                    <span className="text-teal-600 font-normal">Base Fixed Commission</span>
                  </th>
                  <th className="p-3 bg-blue-50/50 text-blue-900">
                    Target Incentive %<br />
                    <span className="text-blue-500 font-normal">At Period Closing</span>
                  </th>

                  {/* Dynamic Additional Incentive Columns */}
                  {(associateRole.extraColumns || []).map((col, cIdx) => (
                    <th key={col.id} className="p-3 bg-amber-50/60 text-amber-900 min-w-[180px]">
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={col.label || ''}
                          onChange={(e) => handleRenameExtraColumn(associateRoleIdx, cIdx, e.target.value)}
                          className="bg-transparent font-bold text-[0.68rem] text-amber-950 uppercase outline-none focus:bg-white focus:ring-1 focus:ring-amber-400 px-1 py-0.5 rounded"
                          placeholder="Reward / Incentive"
                        />
                        {(associateRole.extraColumns || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraColumn(associateRoleIdx, cIdx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Remove Column"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span className="text-amber-700 font-normal text-[10px] flex items-center gap-1 mt-0.5">
                        <Gift size={11} /> % &amp; Reward Name (At Closing)
                      </span>
                    </th>
                  ))}

                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(associateRole.targetSlabs || []).map((slab, sIdx) => {
                  const isUnlimited =
                    slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  return (
                    <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          className="w-32 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          value={slab.label || ''}
                          placeholder="e.g. 1 - 4,99,999"
                          onChange={(e) => handleSlabFieldChange(associateRoleIdx, sIdx, 'label', e.target.value)}
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800"
                            value={slab.minAmount ?? ''}
                            onChange={(e) => handleSlabFieldChange(associateRoleIdx, sIdx, 'minAmount', e.target.value)}
                            required
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Unlimited"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                            value={isUnlimited ? '' : slab.maxAmount}
                            disabled={isUnlimited}
                            onChange={(e) => handleSlabFieldChange(associateRoleIdx, sIdx, 'maxAmount', e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 ml-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSlabFieldChange(associateRoleIdx, sIdx, 'maxAmount', 'unlimited');
                                } else {
                                  const fallbackMax = slab.minAmount ? Number(slab.minAmount) + 499999 : 5000000;
                                  handleSlabFieldChange(associateRoleIdx, sIdx, 'maxAmount', String(fallbackMax));
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-0 cursor-pointer"
                            />
                            No Limit
                          </label>
                        </div>
                      </td>

                      <td className="p-3 bg-teal-50/30">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-20 px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-extrabold text-teal-900 text-center"
                            value={slab.fixedCommissionPercent ?? associateFixed}
                            onChange={(e) => handleSlabFieldChange(associateRoleIdx, sIdx, 'fixedCommissionPercent', e.target.value)}
                            required
                          />
                          <span className="font-bold text-teal-700">%</span>
                        </div>
                      </td>

                      <td className="p-3 bg-blue-50/30">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-20 px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-extrabold text-blue-800 text-center"
                            value={slab.targetIncentivePercent ?? ''}
                            onChange={(e) => handleSlabFieldChange(associateRoleIdx, sIdx, 'targetIncentivePercent', e.target.value)}
                            required
                          />
                          <span className="font-bold text-blue-700">%</span>
                        </div>
                      </td>

                      {/* Dynamic Extra Columns Inputs: % and Name in the same cell without extra text labels */}
                      {(associateRole.extraColumns || []).map((col) => {
                        const item =
                          (slab.extraIncentives || []).find((x) => x.columnId === col.id) || {
                            percent: '',
                            rewardTitle: '',
                          };

                        return (
                          <td key={col.id} className="p-3 bg-amber-50/20">
                            <div className="flex flex-col gap-1.5 min-w-[170px]">
                              <div className="flex items-center gap-1">
                                <input
                                  type="tel"
                                  inputMode="decimal"
                                  placeholder="0"
                                  className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-extrabold text-amber-900 text-center focus:ring-1 focus:ring-amber-500 outline-none"
                                  value={item.percent ?? ''}
                                  onChange={(e) =>
                                    handleSlabExtraIncentiveChange(
                                      associateRoleIdx,
                                      sIdx,
                                      col.id,
                                      'percent',
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="font-bold text-amber-800 text-xs">%</span>
                              </div>

                              <input
                                type="text"
                                placeholder="e.g. Motorcycle, Car"
                                className="w-full px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                                value={item.rewardTitle || ''}
                                onChange={(e) =>
                                  handleSlabExtraIncentiveChange(
                                    associateRoleIdx,
                                    sIdx,
                                    col.id,
                                    'rewardTitle',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSlab(associateRoleIdx, sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete slab"
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
        </div>
      )}

      {/* ── SECTION 2: BUSINESS PARTNER SLABS TABLE ── */}
      {partnerRole && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <h3 className="text-base font-bold text-slate-800">
                  Business Partner (BP) Target &amp; Team Commission Slabs
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Applied to top developer IDs direct to company. Fixed base team % + team target incentive % + additional rewards distributed at closing.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-amber-900">Base Fixed %:</span>
                <input
                  type="tel"
                  inputMode="decimal"
                  className="w-16 px-2 py-0.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 text-center"
                  value={partnerRole.fixedCommissionPercent ?? ''}
                  onChange={(e) => handleRoleFixedChange(partnerRoleIdx, e.target.value)}
                  placeholder="2.0"
                />
                <span className="text-xs font-bold text-amber-800">%</span>
              </div>

              <button
                type="button"
                onClick={() => handleAddExtraColumn(partnerRoleIdx)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
                title="Add extra reward/incentive column"
              >
                <Columns size={14} className="text-amber-700" />
                <span>+ Add Incentive Column</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddSlab(partnerRoleIdx)}
                className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <Plus size={15} /> Add BP Slab
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                  <th className="p-3">Slab Label</th>
                  <th className="p-3">Min Collection (₹)</th>
                  <th className="p-3">Max Collection (₹)</th>
                  <th className="p-3 bg-teal-50/70 text-teal-900">
                    Fixed Base %<br />
                    <span className="text-teal-600 font-normal">Base Fixed Team</span>
                  </th>
                  <th className="p-3 bg-amber-50/50 text-amber-900">
                    Partner Incentive %<br />
                    <span className="text-amber-600 font-normal">Team Target (At Closing)</span>
                  </th>

                  {/* Dynamic Additional Incentive Columns for BP */}
                  {(partnerRole.extraColumns || []).map((col, cIdx) => (
                    <th key={col.id} className="p-3 bg-amber-50/60 text-amber-900 min-w-[180px]">
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={col.label || ''}
                          onChange={(e) => handleRenameExtraColumn(partnerRoleIdx, cIdx, e.target.value)}
                          className="bg-transparent font-bold text-[0.68rem] text-amber-950 uppercase outline-none focus:bg-white focus:ring-1 focus:ring-amber-400 px-1 py-0.5 rounded"
                          placeholder="Reward / Incentive"
                        />
                        {(partnerRole.extraColumns || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraColumn(partnerRoleIdx, cIdx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Remove Column"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span className="text-amber-700 font-normal text-[10px] flex items-center gap-1 mt-0.5">
                        <Gift size={11} /> % &amp; Reward Name (At Closing)
                      </span>
                    </th>
                  ))}

                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(partnerRole.targetSlabs || []).map((slab, sIdx) => {
                  const isUnlimited =
                    slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  return (
                    <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          className="w-32 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          value={slab.label || ''}
                          placeholder="e.g. 1 - 9,99,999"
                          onChange={(e) => handleSlabFieldChange(partnerRoleIdx, sIdx, 'label', e.target.value)}
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800"
                            value={slab.minAmount ?? ''}
                            onChange={(e) => handleSlabFieldChange(partnerRoleIdx, sIdx, 'minAmount', e.target.value)}
                            required
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Unlimited"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                            value={isUnlimited ? '' : slab.maxAmount}
                            disabled={isUnlimited}
                            onChange={(e) => handleSlabFieldChange(partnerRoleIdx, sIdx, 'maxAmount', e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 ml-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSlabFieldChange(partnerRoleIdx, sIdx, 'maxAmount', 'unlimited');
                                } else {
                                  const fallbackMax = slab.minAmount ? Number(slab.minAmount) + 999999 : 10000000;
                                  handleSlabFieldChange(partnerRoleIdx, sIdx, 'maxAmount', String(fallbackMax));
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-0 cursor-pointer"
                            />
                            No Limit
                          </label>
                        </div>
                      </td>

                      <td className="p-3 bg-teal-50/30">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-20 px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-extrabold text-teal-900 text-center"
                            value={slab.fixedCommissionPercent ?? partnerFixed}
                            onChange={(e) => handleSlabFieldChange(partnerRoleIdx, sIdx, 'fixedCommissionPercent', e.target.value)}
                            required
                          />
                          <span className="font-bold text-teal-700">%</span>
                        </div>
                      </td>

                      <td className="p-3 bg-amber-50/30">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-extrabold text-amber-800 text-center"
                            value={slab.targetIncentivePercent ?? ''}
                            onChange={(e) => handleSlabFieldChange(partnerRoleIdx, sIdx, 'targetIncentivePercent', e.target.value)}
                            required
                          />
                          <span className="font-bold text-amber-700">%</span>
                        </div>
                      </td>

                      {/* Dynamic Extra Columns Inputs for BP: % and Name in the same cell without extra text labels */}
                      {(partnerRole.extraColumns || []).map((col) => {
                        const item =
                          (slab.extraIncentives || []).find((x) => x.columnId === col.id) || {
                            percent: '',
                            rewardTitle: '',
                          };

                        return (
                          <td key={col.id} className="p-3 bg-amber-50/20">
                            <div className="flex flex-col gap-1.5 min-w-[170px]">
                              <div className="flex items-center gap-1">
                                <input
                                  type="tel"
                                  inputMode="decimal"
                                  placeholder="0"
                                  className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-extrabold text-amber-900 text-center focus:ring-1 focus:ring-amber-500 outline-none"
                                  value={item.percent ?? ''}
                                  onChange={(e) =>
                                    handleSlabExtraIncentiveChange(
                                      partnerRoleIdx,
                                      sIdx,
                                      col.id,
                                      'percent',
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="font-bold text-amber-800 text-xs">%</span>
                              </div>

                              <input
                                type="text"
                                placeholder="e.g. Foreign Tour, SUV"
                                className="w-full px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                                value={item.rewardTitle || ''}
                                onChange={(e) =>
                                  handleSlabExtraIncentiveChange(
                                    partnerRoleIdx,
                                    sIdx,
                                    col.id,
                                    'rewardTitle',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSlab(partnerRoleIdx, sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete slab"
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
        </div>
      )}

      {/* ── SECTION 3: BRANCH PARTNER SLABS TABLE ── */}
      {branchPartnerRole && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <h3 className="text-base font-bold text-slate-800">
                  Branch Partner (Branch / Regional Head) Target &amp; Incentive Slabs
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Applied to branch franchise &amp; regional management partners. Configurable fixed base % + branch collection target slabs &amp; closing rewards.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-indigo-900">Base Fixed %:</span>
                <input
                  type="tel"
                  inputMode="decimal"
                  className="w-16 px-2 py-0.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-900 text-center"
                  value={branchPartnerRole.fixedCommissionPercent ?? ''}
                  onChange={(e) => handleRoleFixedChange(branchPartnerRoleIdx, e.target.value)}
                  placeholder="0.0"
                />
                <span className="text-xs font-bold text-indigo-800">%</span>
              </div>

              <button
                type="button"
                onClick={() => handleAddExtraColumn(branchPartnerRoleIdx)}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
                title="Add extra reward/incentive column"
              >
                <Columns size={14} className="text-amber-700" />
                <span>+ Add Incentive Column</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddSlab(branchPartnerRoleIdx)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <Plus size={15} /> Add Branch Partner Slab
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                  <th className="p-3">Slab Label</th>
                  <th className="p-3">Min Collection (₹)</th>
                  <th className="p-3">Max Collection (₹)</th>
                  <th className="p-3 bg-indigo-50/70 text-indigo-900">
                    <div>Fixed Base %</div>
                    <span className="text-indigo-700 font-normal text-[10px]">Branch Base Rate</span>
                  </th>
                  <th className="p-3 bg-blue-50/70 text-blue-900">
                    <div>Target Incentive %</div>
                    <span className="text-blue-700 font-normal text-[10px]">Target Incentive (At Closing)</span>
                  </th>

                  {/* Dynamic Additional Incentive Columns */}
                  {(branchPartnerRole.extraColumns || []).map((col, cIdx) => (
                    <th key={col.id} className="p-3 bg-amber-50/60 text-amber-900 min-w-[180px]">
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={col.label || ''}
                          onChange={(e) => handleRenameExtraColumn(branchPartnerRoleIdx, cIdx, e.target.value)}
                          className="bg-transparent font-bold text-[0.68rem] text-amber-950 uppercase outline-none focus:bg-white focus:ring-1 focus:ring-amber-400 px-1 py-0.5 rounded"
                          placeholder="Reward / Incentive"
                        />
                        {(branchPartnerRole.extraColumns || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraColumn(branchPartnerRoleIdx, cIdx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Remove Column"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span className="text-amber-700 font-normal text-[10px] flex items-center gap-1 mt-0.5">
                        <Gift size={11} /> % &amp; Reward Name (At Closing)
                      </span>
                    </th>
                  ))}

                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(branchPartnerRole.targetSlabs || []).map((slab, sIdx) => {
                  const isUnlimited =
                    slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  return (
                    <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          className="w-32 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                          value={slab.label || ''}
                          placeholder="e.g. 1 - 9,99,999"
                          onChange={(e) => handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'label', e.target.value)}
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800"
                            value={slab.minAmount ?? ''}
                            onChange={(e) => handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'minAmount', e.target.value)}
                            required
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Unlimited"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                            value={isUnlimited ? '' : slab.maxAmount}
                            disabled={isUnlimited}
                            onChange={(e) => handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'maxAmount', e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 ml-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'maxAmount', 'unlimited');
                                } else {
                                  const fallbackMax = slab.minAmount ? Number(slab.minAmount) + 999999 : 5000000;
                                  handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'maxAmount', String(fallbackMax));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            No Limit
                          </label>
                        </div>
                      </td>

                      <td className="p-3 bg-indigo-50/30">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-14 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 text-center"
                            value={slab.fixedCommissionPercent ?? branchPartnerFixed ?? 0}
                            onChange={(e) => handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'fixedCommissionPercent', e.target.value)}
                            placeholder="0"
                          />
                          <span className="font-bold text-indigo-700 text-xs">%</span>
                        </div>
                      </td>

                      <td className="p-3 bg-blue-50/30">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-14 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-900 text-center"
                            value={slab.targetIncentivePercent ?? 0}
                            onChange={(e) => handleSlabFieldChange(branchPartnerRoleIdx, sIdx, 'targetIncentivePercent', e.target.value)}
                            placeholder="0"
                          />
                          <span className="font-bold text-blue-700 text-xs">%</span>
                        </div>
                      </td>

                      {/* Extra Incentive columns values */}
                      {(branchPartnerRole.extraColumns || []).map((col) => {
                        const item = (slab.extraIncentives || []).find((x) => x.columnId === col.id) || {
                          percent: '',
                          rewardTitle: '',
                        };

                        return (
                          <td key={col.id} className="p-3 bg-amber-50/20">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <input
                                  type="tel"
                                  inputMode="decimal"
                                  placeholder="0"
                                  className="w-12 px-1.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900 text-center placeholder:text-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                                  value={item.percent ?? ''}
                                  onChange={(e) =>
                                    handleSlabExtraIncentiveChange(
                                      branchPartnerRoleIdx,
                                      sIdx,
                                      col.id,
                                      'percent',
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="font-bold text-amber-800 text-xs">%</span>
                              </div>

                              <input
                                type="text"
                                placeholder="e.g. Branch Reward"
                                className="w-full px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                                value={item.rewardTitle || ''}
                                onChange={(e) =>
                                  handleSlabExtraIncentiveChange(
                                    branchPartnerRoleIdx,
                                    sIdx,
                                    col.id,
                                    'rewardTitle',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSlab(branchPartnerRoleIdx, sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete slab"
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
        </div>
      )}

      {/* Bottom Save Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500 font-medium">
          Changes take effect immediately across all newly synced receipt collections, closing distributions, and target performance reports.
        </p>
        <button
          type="button"
          onClick={handleSavePolicy}
          disabled={saving}
          className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs cursor-pointer transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Saving Policy...' : 'Save All Commission Slabs'}</span>
        </button>
      </div>
    </div>
  );
};

export default CommissionPolicyMatrix;

