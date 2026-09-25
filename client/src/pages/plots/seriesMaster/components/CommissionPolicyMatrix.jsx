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
  Target,
  Sparkles,
} from 'lucide-react';

const CommissionPolicyMatrix = ({
  initialBusinessType = 'PLOT_SALE',
  showTypeToggle = true,
  hideFixedCommission = false,
  title = 'Target Incentive & Extra Incentive Policy',
  subtitle = 'Configure regular target collection slabs, fixed base rates, and separate extra incentive campaign / reward slabs.',
}) => {
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState(null);

  const shouldHideFixed = hideFixedCommission || businessType === 'PLOT_PRODUCT';

  useEffect(() => {
    setBusinessType(initialBusinessType);
  }, [initialBusinessType]);

  const getDefaultExtraSlabsForRole = (roleName, bType) => {
    if (roleName === 'BUSINESS_ASSOCIATE') {
      return [
        { minAmount: 500000, maxAmount: 999999, extraIncentivePercent: 0, rewardTitle: 'Smartphone / Tablet', label: '5,00,000 - 9,99,999' },
        { minAmount: 1000000, maxAmount: 1999999, extraIncentivePercent: 0, rewardTitle: 'Motorcycle / Laptop', label: '10,00,000 - 19,99,999' },
        { minAmount: 2000000, maxAmount: 4999999, extraIncentivePercent: bType === 'INVESTMENT_RD_FD' ? 0.5 : 1.0, rewardTitle: 'Goa / Thailand Tour', label: '20,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, extraIncentivePercent: bType === 'INVESTMENT_RD_FD' ? 1.0 : 2.0, rewardTitle: 'Luxury Car / Gold Fund', label: '50,00,000+' },
      ];
    }
    if (roleName === 'BUSINESS_PARTNER') {
      return [
        { minAmount: 1000000, maxAmount: 2499999, extraIncentivePercent: 0, rewardTitle: 'Foreign Tour', label: '10,00,000 - 24,99,999' },
        { minAmount: 2500000, maxAmount: 4999999, extraIncentivePercent: bType === 'INVESTMENT_RD_FD' ? 0.15 : 0.25, rewardTitle: 'SUV / Luxury Car', label: '25,00,000 - 49,99,999' },
        { minAmount: 5000000, maxAmount: null, extraIncentivePercent: bType === 'INVESTMENT_RD_FD' ? 0.30 : 0.50, rewardTitle: 'Flat / Villa Bonus', label: '50,00,000+' },
      ];
    }
    return [
      { minAmount: 1000000, maxAmount: 2999999, extraIncentivePercent: 0, rewardTitle: 'Branch Excellence Award', label: '10,00,000 - 29,99,999' },
      { minAmount: 3000000, maxAmount: 4999999, extraIncentivePercent: bType === 'INVESTMENT_RD_FD' ? 0.15 : 0.25, rewardTitle: 'Branch Star Trophy & Bonus', label: '30,00,000 - 49,99,999' },
      { minAmount: 5000000, maxAmount: null, extraIncentivePercent: bType === 'INVESTMENT_RD_FD' ? 0.30 : 0.50, rewardTitle: 'Regional Best Branch Award', label: '50,00,000+' },
    ];
  };

  const normalizePolicyData = (rawPolicy) => {
    if (!rawPolicy) return rawPolicy;
    const p = JSON.parse(JSON.stringify(rawPolicy));

    (p.roles || []).forEach((role) => {
      if (!Array.isArray(role.extraColumns) || role.extraColumns.length === 0) {
        role.extraColumns = [{ id: 'reward_col_1', label: 'Reward / Extra Incentive' }];
      }

      if (!Array.isArray(role.targetSlabs)) {
        role.targetSlabs = [];
      }

      // If extraSlabs doesn't exist, populate with defaults
      if (!Array.isArray(role.extraSlabs) || role.extraSlabs.length === 0) {
        role.extraSlabs = getDefaultExtraSlabsForRole(role.roleName, p.businessType);
      }

      // Ensure extraSlabs have proper extraIncentives array mapped to extraColumns
      role.extraSlabs.forEach((slab) => {
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
              percent: isFirst ? (slab.extraIncentivePercent ?? slab.rewardPercent ?? '') : '',
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

        const targetSlabs = (role.targetSlabs || []).map((slab) => ({
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
          label: slab.label || (slab.minAmount ? `₹${Number(slab.minAmount).toLocaleString('en-IN')} - ${slab.maxAmount ? `₹${Number(slab.maxAmount).toLocaleString('en-IN')}` : 'Above'}` : ''),
        }));

        const extraSlabs = (role.extraSlabs || []).map((slab) => {
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
            extraIncentivePercent: primaryExtra ? primaryExtra.percent : Number(slab.extraIncentivePercent || slab.rewardPercent) || 0,
            rewardTitle: primaryExtra ? primaryExtra.rewardTitle : slab.rewardTitle || '',
            extraIncentives: extraIncs,
            label: slab.label || (slab.minAmount ? `₹${Number(slab.minAmount).toLocaleString('en-IN')} - ${slab.maxAmount ? `₹${Number(slab.maxAmount).toLocaleString('en-IN')}` : 'Above'}` : ''),
          };
        });

        return {
          roleName: role.roleName,
          fixedCommissionPercent: Number(role.fixedCommissionPercent) || 0,
          extraColumns: extraCols,
          targetSlabs,
          extraSlabs,
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
        `${policy.businessType === 'PLOT_SALE' ? 'Plot Sales' : policy.businessType === 'PLOT_PRODUCT' ? 'Plot Products' : 'RD/FD'} Policy saved successfully!`
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

  /* ────────── TARGET SLABS HANDLERS ────────── */
  const handleTargetSlabFieldChange = (roleIndex, slabIndex, field, value) => {
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

  const handleAddTargetSlab = (roleIndex) => {
    const updated = { ...policy };
    const currentSlabs = updated.roles[roleIndex].targetSlabs || [];
    const lastSlab = currentSlabs[currentSlabs.length - 1];

    let newMin = 1;
    let newMax = null;
    let newIncentive = updated.roles[roleIndex].roleName === 'BRANCH_PARTNER' ? 0.0 : 2.0;

    const roleFixed =
      Number(updated.roles[roleIndex].fixedCommissionPercent) ||
      (updated.roles[roleIndex].roleName === 'BRANCH_PARTNER'
        ? 0.0
        : updated.roles[roleIndex].roleName === 'BUSINESS_PARTNER'
        ? 2.0
        : 5.0);

    if (lastSlab) {
      const prevMax = lastSlab.maxAmount
        ? Number(lastSlab.maxAmount)
        : Number(lastSlab.minAmount) + 500000;
      newMin = prevMax + 1;
      newMax = newMin + 499999;
      newIncentive = +(
        Number(lastSlab.targetIncentivePercent) +
        (updated.roles[roleIndex].roleName === 'BRANCH_PARTNER'
          ? 0.0
          : updated.roles[roleIndex].roleName === 'BUSINESS_PARTNER'
          ? 0.15
          : 1.0)
      ).toFixed(3);
    }

    const newSlab = {
      minAmount: newMin,
      maxAmount: newMax,
      fixedCommissionPercent: roleFixed,
      targetIncentivePercent: newIncentive,
      label: `₹${newMin.toLocaleString('en-IN')} - ${newMax ? `₹${newMax.toLocaleString('en-IN')}` : 'Above'}`,
    };

    updated.roles[roleIndex].targetSlabs = [...currentSlabs, newSlab];
    setPolicy(updated);
  };

  const handleRemoveTargetSlab = (roleIndex, slabIndex) => {
    const updated = { ...policy };
    updated.roles[roleIndex].targetSlabs = updated.roles[roleIndex].targetSlabs.filter(
      (_, i) => i !== slabIndex
    );
    setPolicy(updated);
  };

  /* ────────── EXTRA SLABS HANDLERS ────────── */
  const handleExtraSlabFieldChange = (roleIndex, slabIndex, field, value) => {
    const updated = { ...policy };
    const slab = updated.roles[roleIndex].extraSlabs[slabIndex];
    const strVal = String(value ?? '');

    if (field === 'extraIncentivePercent') {
      slab[field] = strVal.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
      if (slab.extraIncentives && slab.extraIncentives[0]) {
        slab.extraIncentives[0].percent = slab[field];
      }
    } else if (field === 'rewardTitle') {
      slab[field] = value;
      if (slab.extraIncentives && slab.extraIncentives[0]) {
        slab.extraIncentives[0].rewardTitle = value;
      }
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

  const handleAddExtraSlab = (roleIndex) => {
    const updated = { ...policy };
    const currentSlabs = updated.roles[roleIndex].extraSlabs || [];
    const lastSlab = currentSlabs[currentSlabs.length - 1];
    const extraCols = updated.roles[roleIndex].extraColumns || [];

    let newMin = 500000;
    let newMax = null;
    let newExtraPct = 0;

    if (lastSlab) {
      const prevMax = lastSlab.maxAmount
        ? Number(lastSlab.maxAmount)
        : Number(lastSlab.minAmount) + 1000000;
      newMin = prevMax + 1;
      newMax = newMin + 999999;
      newExtraPct = Number(lastSlab.extraIncentivePercent || 0);
    }

    const newSlab = {
      minAmount: newMin,
      maxAmount: newMax,
      extraIncentivePercent: newExtraPct,
      rewardTitle: '',
      extraIncentives: extraCols.map((c) => ({
        columnId: c.id,
        label: c.label,
        percent: '',
        rewardTitle: '',
      })),
      label: `₹${newMin.toLocaleString('en-IN')} - ${newMax ? `₹${newMax.toLocaleString('en-IN')}` : 'Above'}`,
    };

    updated.roles[roleIndex].extraSlabs = [...currentSlabs, newSlab];
    setPolicy(updated);
  };

  const handleRemoveExtraSlab = (roleIndex, slabIndex) => {
    const updated = { ...policy };
    updated.roles[roleIndex].extraSlabs = updated.roles[roleIndex].extraSlabs.filter(
      (_, i) => i !== slabIndex
    );
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

    (role.extraSlabs || []).forEach((slab) => {
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
    (role.extraSlabs || []).forEach((slab) => {
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
      (role.extraSlabs || []).forEach((slab) => {
        if (Array.isArray(slab.extraIncentives)) {
          const item = slab.extraIncentives.find((x) => x.columnId === colId);
          if (item) item.label = newLabel;
        }
      });
      setPolicy(updated);
    }
  };

  const handleExtraSlabItemChange = (roleIndex, slabIndex, columnId, field, value) => {
    const updated = { ...policy };
    const slab = updated.roles[roleIndex].extraSlabs[slabIndex];
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
      if (field === 'percent') slab.extraIncentivePercent = item.percent;
      if (field === 'rewardTitle') slab.rewardTitle = item.rewardTitle;
    }

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

  const renderRoleCommissionSection = (roleIndex, roleTitle, roleBadgeColor, roleDesc) => {
    const role = policy.roles[roleIndex];
    if (!role) return null;

    const roleFixed =
      Number(role.fixedCommissionPercent) ||
      (role.roleName === 'BRANCH_PARTNER'
        ? 0.0
        : role.roleName === 'BUSINESS_PARTNER'
        ? (businessType === 'PLOT_SALE' ? 2.0 : 1.0)
        : (businessType === 'PLOT_SALE' ? 5.0 : 2.5));

    return (
      <div key={role.roleName} className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-6">
        {/* Role Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${roleBadgeColor} inline-block`} />
              <h3 className="text-base font-bold text-slate-800">{roleTitle}</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{roleDesc}</p>
          </div>

          {!shouldHideFixed && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Base Fixed Commission:</span>
              <div className="flex items-center gap-1">
                <input
                  type="tel"
                  inputMode="decimal"
                  className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center"
                  value={role.fixedCommissionPercent ?? ''}
                  onChange={(e) => handleRoleFixedChange(roleIndex, e.target.value)}
                  placeholder="5.0"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── SUBSECTION 1: TARGET INCENTIVE SLABS ── */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-100 text-blue-800">
                <Target size={15} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Target Incentive Collection Slabs (Normal Business % Slabs)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Evaluated against regular period collection volume to determine target closing %.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAddTargetSlab(roleIndex)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <Plus size={14} /> Add Target Slab
            </button>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                  <th className="p-3">Min Collection (₹)</th>
                  <th className="p-3">Max Collection (₹)</th>
                  {!shouldHideFixed && (
                    <th className="p-3 bg-teal-50/70 text-teal-900">
                      Fixed Base %<br />
                      <span className="text-teal-600 font-normal">Fixed Commission</span>
                    </th>
                  )}
                  <th className="p-3 bg-blue-50/80 text-blue-900">
                    Target Incentive %<br />
                    <span className="text-blue-600 font-normal">At Period Closing</span>
                  </th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(role.targetSlabs || []).map((slab, sIdx) => {
                  const isUnlimited =
                    slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  return (
                    <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800"
                            value={slab.minAmount ?? ''}
                            onChange={(e) => handleTargetSlabFieldChange(roleIndex, sIdx, 'minAmount', e.target.value)}
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
                            onChange={(e) => handleTargetSlabFieldChange(roleIndex, sIdx, 'maxAmount', e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 ml-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleTargetSlabFieldChange(roleIndex, sIdx, 'maxAmount', 'unlimited');
                                } else {
                                  const fallbackMax = slab.minAmount ? Number(slab.minAmount) + 499999 : 5000000;
                                  handleTargetSlabFieldChange(roleIndex, sIdx, 'maxAmount', String(fallbackMax));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            No Limit
                          </label>
                        </div>
                      </td>

                      {!shouldHideFixed && (
                        <td className="p-3 bg-teal-50/30">
                          <div className="flex items-center gap-1">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-20 px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-extrabold text-teal-900 text-center"
                              value={slab.fixedCommissionPercent ?? roleFixed}
                              onChange={(e) => handleTargetSlabFieldChange(roleIndex, sIdx, 'fixedCommissionPercent', e.target.value)}
                              required
                            />
                            <span className="font-bold text-teal-700">%</span>
                          </div>
                        </td>
                      )}

                      <td className="p-3 bg-blue-50/40">
                        <div className="flex items-center gap-1">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-20 px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-extrabold text-blue-800 text-center"
                            value={slab.targetIncentivePercent ?? ''}
                            onChange={(e) => handleTargetSlabFieldChange(roleIndex, sIdx, 'targetIncentivePercent', e.target.value)}
                            required
                          />
                          <span className="font-bold text-blue-700">%</span>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTargetSlab(roleIndex, sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete slab"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SUBSECTION 2: EXTRA INCENTIVE & REWARD SLABS ── */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
                <Gift size={15} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  2. 🎁 Extra Incentive &amp; Campaign Rewards Slabs (Separate Collection Slabs)
                  <Sparkles size={13} className="text-amber-600" />
                </h4>
                <p className="text-[11px] text-amber-900/80 font-medium">
                  Configured with independent Min / Max Collection thresholds for festive campaigns, physical gifts (Bikes, Cars, Tours), and closing bonus %.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddExtraColumn(roleIndex)}
                className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                title="Add extra reward/incentive column"
              >
                <Columns size={13} className="text-amber-700" />
                <span>+ Add Column</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddExtraSlab(roleIndex)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Add Extra Slab
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-amber-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-amber-100/60 border-b border-amber-200 text-amber-950 uppercase tracking-wider text-[0.68rem] font-bold">
                  <th className="p-3">Min Collection (₹)</th>
                  <th className="p-3">Max Collection (₹)</th>

                  {/* Dynamic Additional Incentive Columns */}
                  {(role.extraColumns || []).map((col, cIdx) => (
                    <th key={col.id} className="p-3 bg-amber-200/50 text-amber-950 min-w-[200px]">
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="text"
                          value={col.label || ''}
                          onChange={(e) => handleRenameExtraColumn(roleIndex, cIdx, e.target.value)}
                          className="bg-transparent font-bold text-[0.68rem] text-amber-950 uppercase outline-none focus:bg-white focus:ring-1 focus:ring-amber-400 px-1 py-0.5 rounded"
                          placeholder="Reward / Incentive"
                        />
                        {(role.extraColumns || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraColumn(roleIndex, cIdx)}
                            className="text-amber-600 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            title="Remove Column"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <span className="text-amber-800 font-normal text-[10px] flex items-center gap-1 mt-0.5">
                        <Gift size={11} /> Extra % &amp; Gift / Reward Name
                      </span>
                    </th>
                  ))}

                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium">
                {(role.extraSlabs || []).map((slab, sIdx) => {
                  const isUnlimited =
                    slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  return (
                    <tr key={sIdx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-28 px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold font-mono text-slate-800"
                            value={slab.minAmount ?? ''}
                            onChange={(e) => handleExtraSlabFieldChange(roleIndex, sIdx, 'minAmount', e.target.value)}
                            required
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600 font-bold">₹</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Unlimited"
                            className="w-28 px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                            value={isUnlimited ? '' : slab.maxAmount}
                            disabled={isUnlimited}
                            onChange={(e) => handleExtraSlabFieldChange(roleIndex, sIdx, 'maxAmount', e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 ml-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isUnlimited}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleExtraSlabFieldChange(roleIndex, sIdx, 'maxAmount', 'unlimited');
                                } else {
                                  const fallbackMax = slab.minAmount ? Number(slab.minAmount) + 999999 : 5000000;
                                  handleExtraSlabFieldChange(roleIndex, sIdx, 'maxAmount', String(fallbackMax));
                                }
                              }}
                              className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            No Limit
                          </label>
                        </div>
                      </td>

                      {/* Dynamic Extra Columns Inputs: % and Name */}
                      {(role.extraColumns || []).map((col) => {
                        const item =
                          (slab.extraIncentives || []).find((x) => x.columnId === col.id) || {
                            percent: '',
                            rewardTitle: '',
                          };

                        return (
                          <td key={col.id} className="p-3 bg-amber-50/30">
                            <div className="flex flex-col gap-1.5 min-w-[190px]">
                              <div className="flex items-center gap-1">
                                <input
                                  type="tel"
                                  inputMode="decimal"
                                  placeholder="0"
                                  className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-extrabold text-amber-900 text-center focus:ring-1 focus:ring-amber-500 outline-none"
                                  value={item.percent ?? ''}
                                  onChange={(e) =>
                                    handleExtraSlabItemChange(
                                      roleIndex,
                                      sIdx,
                                      col.id,
                                      'percent',
                                      e.target.value
                                    )
                                  }
                                />
                                <span className="font-bold text-amber-800 text-xs">% Extra</span>
                              </div>

                              <input
                                type="text"
                                placeholder="e.g. Motorcycle, Car, Laptop, Goa Tour"
                                className="w-full px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                                value={item.rewardTitle || ''}
                                onChange={(e) =>
                                  handleExtraSlabItemChange(
                                    roleIndex,
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
                          onClick={() => handleRemoveExtraSlab(roleIndex, sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete extra slab"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const associateRoleIdx = policy.roles?.findIndex((r) => r.roleName === 'BUSINESS_ASSOCIATE');
  const partnerRoleIdx = policy.roles?.findIndex((r) => r.roleName === 'BUSINESS_PARTNER');
  const branchPartnerRoleIdx = policy.roles?.findIndex((r) => r.roleName === 'BRANCH_PARTNER');

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
      {associateRoleIdx !== -1 &&
        renderRoleCommissionSection(
          associateRoleIdx,
          'Business Associate (BA) Target & Extra Incentive Slabs',
          'bg-blue-600',
          shouldHideFixed
            ? 'Applied to direct sponsors & subordinates. Configurable regular target slabs and separate extra incentive / campaign reward slabs.'
            : 'Applied to direct sponsors & subordinates. Base fixed % + configurable regular target slabs and separate extra incentive / campaign reward slabs.'
        )}

      {/* ── SECTION 2: BUSINESS PARTNER SLABS TABLE ── */}
      {partnerRoleIdx !== -1 &&
        renderRoleCommissionSection(
          partnerRoleIdx,
          'Business Partner (BP) Target & Extra Incentive Slabs',
          'bg-amber-500',
          shouldHideFixed
            ? 'Applied to top developer IDs direct to company. Team regular target slabs and separate extra incentive / campaign reward slabs.'
            : 'Applied to top developer IDs direct to company. Base fixed team % + team regular target slabs and separate extra incentive / campaign reward slabs.'
        )}

      {/* ── SECTION 3: BRANCH PARTNER SLABS TABLE ── */}
      {branchPartnerRoleIdx !== -1 &&
        renderRoleCommissionSection(
          branchPartnerRoleIdx,
          'Branch Partner (Branch / Regional Head) Target & Extra Incentive Slabs',
          'bg-indigo-600',
          shouldHideFixed
            ? 'Applied to branch franchise & regional management partners. Branch regular target slabs and separate extra incentive / campaign reward slabs.'
            : 'Applied to branch franchise & regional management partners. Configurable fixed base % + branch regular target slabs and separate extra incentive / campaign reward slabs.'
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
