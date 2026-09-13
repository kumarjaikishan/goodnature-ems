import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import {
  Award,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Building,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const CommissionPolicyMatrix = ({
  initialBusinessType = 'PLOT_SALE',
  showTypeToggle = true,
  title = 'Quarterly Target Incentive & Fixed Commission Policy',
  subtitle = 'Configure monthly collection business target slabs, fixed base rates, and tiered incentive percentages.',
}) => {
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    setBusinessType(initialBusinessType);
  }, [initialBusinessType]);

  const fetchPolicy = async (type = businessType) => {
    setLoading(true);
    try {
      const res = await api.get(`/plots/commission-policy?type=${type}`);
      if (res.data?.data) {
        setPolicy(res.data.data);
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
      // Validate roles and sanitize numeric inputs
      const sanitizedRoles = (policy.roles || []).map((role) => ({
        roleName: role.roleName,
        fixedCommissionPercent: Number(role.fixedCommissionPercent) || 0,
        targetSlabs: (role.targetSlabs || []).map((slab) => ({
          minAmount: Number(slab.minAmount) || 0,
          maxAmount: slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined
            ? null
            : Number(slab.maxAmount),
          fixedCommissionPercent: slab.fixedCommissionPercent === null || slab.fixedCommissionPercent === '' || slab.fixedCommissionPercent === undefined
            ? (Number(role.fixedCommissionPercent) || 0)
            : Number(slab.fixedCommissionPercent),
          targetIncentivePercent: Number(slab.targetIncentivePercent) || 0,
          label: slab.label || '',
        })),
      }));

      const payload = {
        policyName: policy.policyName,
        businessType: policy.businessType,
        validFrom: policy.validFrom,
        validTo: policy.validTo,
        roles: sanitizedRoles,
      };

      await api.put(`/plots/commission-policy?type=${policy.businessType}`, payload);
      toast.success(`${policy.businessType === 'PLOT_SALE' ? 'Plot Sales' : 'RD/FD'} Commission Policy saved successfully!`);
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

    // Sync across all slabs for this role
    (updated.roles[roleIndex].targetSlabs || []).forEach((slab) => {
      slab.fixedCommissionPercent = cleaned;
    });

    setPolicy(updated);
  };

  const handleSlabFieldChange = (roleIndex, slabIndex, field, value) => {
    const updated = { ...policy };
    const slab = updated.roles[roleIndex].targetSlabs[slabIndex];

    if (field === 'targetIncentivePercent' || field === 'fixedCommissionPercent') {
      slab[field] = value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    } else if (field === 'minAmount') {
      slab[field] = value.replace(/[^0-9]/g, '');
    } else if (field === 'maxAmount') {
      if (value === 'unlimited' || value === '' || value === null) {
        slab.maxAmount = null;
      } else {
        slab.maxAmount = value.replace(/[^0-9]/g, '');
      }
    } else {
      slab[field] = value;
    }

    setPolicy(updated);
  };

  const handleAddSlab = (roleIndex) => {
    const updated = { ...policy };
    const currentSlabs = updated.roles[roleIndex].targetSlabs || [];
    const lastSlab = currentSlabs[currentSlabs.length - 1];

    let newMin = 1;
    let newMax = null;
    let newIncentive = 2.0;

    const roleFixed = Number(policy.roles[roleIndex].fixedCommissionPercent) || (policy.roles[roleIndex].roleName === 'BUSINESS_PARTNER' ? 2.0 : 5.0);

    if (lastSlab) {
      const prevMax = lastSlab.maxAmount ? Number(lastSlab.maxAmount) : Number(lastSlab.minAmount) + 500000;
      newMin = prevMax + 1;
      newMax = newMin + 999999;
      newIncentive = +(Number(lastSlab.targetIncentivePercent) + (policy.roles[roleIndex].roleName === 'BUSINESS_PARTNER' ? 0.15 : 1.0)).toFixed(3);
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

  const handleRemoveSlab = (roleIndex, slabIndex) => {
    const updated = { ...policy };
    updated.roles[roleIndex].targetSlabs = updated.roles[roleIndex].targetSlabs.filter((_, i) => i !== slabIndex);
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

  const associateRole = associateRoleIdx !== -1 ? policy.roles[associateRoleIdx] : null;
  const partnerRole = partnerRoleIdx !== -1 ? policy.roles[partnerRoleIdx] : null;

  const associateFixed = Number(associateRole?.fixedCommissionPercent) || (businessType === 'PLOT_SALE' ? 5.0 : 2.5);
  const partnerFixed = Number(partnerRole?.fixedCommissionPercent) || (businessType === 'PLOT_SALE' ? 2.0 : 1.0);

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
              <p className="text-xs text-slate-500 font-medium">
                {subtitle}
              </p>
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

      {/* Policy Effective Duration & Overview Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-700/50 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-teal-300" />
            <span className="font-bold text-sm tracking-wide">
              Official Target Circular: {businessType === 'PLOT_SALE' ? 'Plot Sales Circular (Right Side)' : 'RD/FD Investment Circular (Left Side)'}
            </span>
          </div>
          <span className="text-xs font-mono font-medium text-teal-200">
            Quarter Validity: {new Date(policy.validFrom).toLocaleDateString('en-GB')} — {new Date(policy.validTo).toLocaleDateString('en-GB')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-teal-100 pt-1">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" /> 1. Business Associate (BA)
            </p>
            <p className="text-[11px] text-teal-100 leading-relaxed">
              Subordinate sponsor ID under a Business Developer. Receives <strong>Fixed {associateFixed}%</strong> + Target Incentive % based on their individual monthly collections.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-blue-400" /> 2. Business Partner (BP)
            </p>
            <p className="text-[11px] text-teal-100 leading-relaxed">
              Top developer ID direct with company. On subordinate Associate business, receives <strong>Fixed {partnerFixed}%</strong> + Partner Team Incentive %.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-amber-300" /> 3. Direct Partner Sale
            </p>
            <p className="text-[11px] text-teal-100 leading-relaxed">
              When a Business Partner personally brings a direct customer, they receive <strong>both</strong> BA Rate ({associateFixed}% + Slab) AND BP Rate ({partnerFixed}% + Slab)!
            </p>
          </div>
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
                Applied to direct sponsors &amp; subordinates. Fixed base % + monthly target achievement incentive %.
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                    <span className="text-blue-500 font-normal">Monthly Bonus</span>
                  </th>
                  <th className="p-3 bg-emerald-50/50 text-emerald-900">
                    Total BA Commission %<br />
                    <span className="text-emerald-600 font-normal">Fixed + Incentive</span>
                  </th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(associateRole.targetSlabs || []).map((slab, sIdx) => {
                  const slabFixed = slab.fixedCommissionPercent !== undefined && slab.fixedCommissionPercent !== null && slab.fixedCommissionPercent !== ''
                    ? Number(slab.fixedCommissionPercent)
                    : associateFixed;
                  const incentive = Number(slab.targetIncentivePercent) || 0;
                  const total = +(slabFixed + incentive).toFixed(2);
                  const isUnlimited = slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  return (
                    <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          className="w-36 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
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
                              onChange={(e) => handleSlabFieldChange(associateRoleIdx, sIdx, 'maxAmount', e.target.checked ? 'unlimited' : 5000000)}
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

                      <td className="p-3 bg-emerald-50/30">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {total}%
                        </span>
                      </td>

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
                Applied to top developer IDs direct to company. Fixed base team % + team target incentive %.
              </p>
            </div>

            <div className="flex items-center gap-3">
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
                    <span className="text-amber-600 font-normal">Team Business Incentive</span>
                  </th>
                  <th className="p-3 bg-teal-50/50 text-teal-900">
                    Subordinate Team Comm. %<br />
                    <span className="text-teal-600 font-normal">Fixed + Inc</span>
                  </th>
                  <th className="p-3 bg-indigo-50/50 text-indigo-900">
                    Direct Partner Total %<br />
                    <span className="text-indigo-600 font-normal">Dual: BA Rate + BP Rate</span>
                  </th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(partnerRole.targetSlabs || []).map((slab, sIdx) => {
                  const slabPartnerFixed = slab.fixedCommissionPercent !== undefined && slab.fixedCommissionPercent !== null && slab.fixedCommissionPercent !== ''
                    ? Number(slab.fixedCommissionPercent)
                    : partnerFixed;
                  const incentive = Number(slab.targetIncentivePercent) || 0;
                  const partnerTotal = +(slabPartnerFixed + incentive).toFixed(3);
                  const isUnlimited = slab.maxAmount === null || slab.maxAmount === '' || slab.maxAmount === undefined;

                  // Find corresponding BA slab for direct partner simulation
                  const matchingBaSlab = (associateRole?.targetSlabs || []).find(
                    (ba) => slab.minAmount >= ba.minAmount && (ba.maxAmount === null || slab.minAmount <= ba.maxAmount)
                  ) || associateRole?.targetSlabs?.[sIdx] || associateRole?.targetSlabs?.[0];

                  const matchingBaFixed = matchingBaSlab?.fixedCommissionPercent !== undefined && matchingBaSlab?.fixedCommissionPercent !== null && matchingBaSlab?.fixedCommissionPercent !== ''
                    ? Number(matchingBaSlab.fixedCommissionPercent)
                    : associateFixed;
                  const baIncentive = Number(matchingBaSlab?.targetIncentivePercent) || 2.0;
                  const directCombined = +(matchingBaFixed + baIncentive + partnerTotal).toFixed(3);

                  return (
                    <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          className="w-36 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
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
                              onChange={(e) => handleSlabFieldChange(partnerRoleIdx, sIdx, 'maxAmount', e.target.checked ? 'unlimited' : 10000000)}
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

                      <td className="p-3 bg-teal-50/30">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-teal-100 text-teal-800 border border-teal-300">
                          {partnerTotal}%
                        </span>
                      </td>

                      <td className="p-3 bg-indigo-50/30">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                          {directCombined}%
                        </span>
                      </td>

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

      {/* Bottom Save Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500 font-medium">
          Changes take effect immediately across all newly synced receipt collections and target performance reports.
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
