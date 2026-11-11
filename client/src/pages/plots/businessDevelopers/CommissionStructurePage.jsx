import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Percent,
  Coins,
  Building2,
  Users,
} from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import { useSelector } from 'react-redux';
import { getJwtPayload } from '../../../utils/auth';

/**
 * CommissionStructurePage
 * Displays:
 *  1. Commission Slab % (Plan | Down Payment Fix Commission % | EMI Payment Fix Commission %)
 *  2. Incentive Slab % (Performance Business Target | Performance Incentive %)
 *  3. Reward Slab % (Yearly Performance Business Target | Yearly Performance Reward %)
 *
 * Refined with professional colors, subtle elegant 1px borders, and responsive 3-column layout.
 */
const CommissionStructurePage = () => {
  const userProfile = useSelector((state) => state.user?.profile);
  const tokenPayload = getJwtPayload(localStorage.getItem('emstoken')) || {};
  const activeUser = userProfile || tokenPayload || {};

  const [loading, setLoading] = useState(true);
  const [schemeConfig, setSchemeConfig] = useState(null);
  const [policyData, setPolicyData] = useState(null);

  const userRole = String(activeUser.role?.name || activeUser.role || '').toLowerCase();
  const isAdminOrStaff = ['admin', 'superadmin', 'accountant', 'manager', 'developer', 'grant'].includes(userRole);

  const isBranchPartnerUser = Boolean(
    activeUser.isBranchPartner === true ||
    String(activeUser.sponsorCode || '').startsWith('BRP-') ||
    String(activeUser.sponsorCode || '').startsWith('BR-')
  );

  const isDirectPartnerUser = !isBranchPartnerUser && Boolean(
    activeUser.isDeveloperSponsor === true ||
    activeUser.role === 'BUSINESS_PARTNER' ||
    activeUser.designation === 'Business Partner' ||
    String(activeUser.sponsorCode || '').startsWith('BP-') ||
    String(activeUser.sponsorCode || '').startsWith('P/') ||
    (!activeUser.sponsorId && !activeUser.parentSponsor && !String(activeUser.sponsorCode || '').startsWith('BA-') && !String(activeUser.sponsorCode || '').startsWith('A/'))
  );

  const initialRole = isBranchPartnerUser
    ? 'branch_partner'
    : isDirectPartnerUser
    ? 'partner'
    : 'associate';

  const [adminViewRole, setAdminViewRole] = useState(initialRole);
  const [partnerIncentiveViewRole, setPartnerIncentiveViewRole] = useState(
    isBranchPartnerUser ? 'BRANCH_PARTNER' : isDirectPartnerUser ? 'BUSINESS_PARTNER' : 'BUSINESS_ASSOCIATE'
  );

  // Synchronize role view when userProfile is loaded / updated
  useEffect(() => {
    if (isBranchPartnerUser) {
      setAdminViewRole('branch_partner');
      setPartnerIncentiveViewRole('BRANCH_PARTNER');
    } else if (isDirectPartnerUser) {
      setAdminViewRole('partner');
      setPartnerIncentiveViewRole('BUSINESS_PARTNER');
    } else if (!isAdminOrStaff) {
      setAdminViewRole('associate');
      setPartnerIncentiveViewRole('BUSINESS_ASSOCIATE');
    }
  }, [userProfile?.role, userProfile?.isDeveloperSponsor, userProfile?.sponsorCode, isBranchPartnerUser, isDirectPartnerUser, isAdminOrStaff]);

  const effectiveRole = isAdminOrStaff
    ? adminViewRole
    : (isDirectPartnerUser || isBranchPartnerUser
        ? (partnerIncentiveViewRole === 'BUSINESS_ASSOCIATE'
            ? 'associate'
            : isBranchPartnerUser
            ? 'branch_partner'
            : 'partner')
        : 'associate');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const [schemeRes, policyRes] = await Promise.allSettled([
        api.get('/investments/config'),
        api.get('/plots/commission-policy'),
      ]);

      if (schemeRes.status === 'fulfilled' && schemeRes.value?.data?.success) {
        setSchemeConfig(schemeRes.value.data.data);
      }
      if (policyRes.status === 'fulfilled' && policyRes.value?.data?.success) {
        setPolicyData(policyRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching commission configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PageLoader message="Loading commission & incentive slabs..." />
      </div>
    );
  }

  const slabs = schemeConfig?.slabs || [];
  const policyRoles = policyData?.roles || [];

  const effectivePolicyRoleName = effectiveRole === 'branch_partner'
    ? 'BRANCH_PARTNER'
    : effectiveRole === 'partner'
    ? 'BUSINESS_PARTNER'
    : 'BUSINESS_ASSOCIATE';

  const selectedPolicyRole = policyRoles.find((r) => r.roleName === effectivePolicyRoleName) || policyRoles[0];

  const targetSlabs = selectedPolicyRole?.targetSlabs || [];
  const extraSlabs = selectedPolicyRole?.extraSlabs || [];

  const formatPct = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '0%';
    const num = Number(val);
    if (num === 0) return '0%';
    return Number.isInteger(num) ? `${num}%` : `${num.toFixed(2)}%`;
  };

  const formatTargetRange = (slab) => {
    if (slab.label) return slab.label;
    if (slab.maxAmount) {
      return `₹${Number(slab.minAmount).toLocaleString('en-IN')} - ₹${Number(slab.maxAmount).toLocaleString('en-IN')}`;
    }
    return `₹${Number(slab.minAmount).toLocaleString('en-IN')} & Above`;
  };

  const roleBadgeLabel = effectiveRole === 'associate'
    ? 'Business Associate'
    : effectiveRole === 'branch_partner'
    ? 'Branch Partner'
    : 'Business Partner';

  const roleBadgeClass = effectiveRole === 'associate'
    ? 'bg-teal-50 text-teal-800 border-teal-200'
    : effectiveRole === 'branch_partner'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : 'bg-teal-50 text-teal-900 border-teal-300';

  return (
    <div className="p-4 md:p-6 bg-slate-50/70 min-h-screen space-y-5 max-w-[1600px] mx-auto pb-24 font-sans text-slate-800">
      {/* ── Top Bar: Role badge & Admin perspective toggle if needed ── */}
      {isAdminOrStaff && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Viewing Policy As:
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleBadgeClass}`}>
              {roleBadgeLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setAdminViewRole('associate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                adminViewRole === 'associate'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business Associate
            </button>
            <button
              type="button"
              onClick={() => setAdminViewRole('partner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                adminViewRole === 'partner'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business Partner
            </button>
            <button
              type="button"
              onClick={() => setAdminViewRole('branch_partner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                adminViewRole === 'branch_partner'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Branch Partner
            </button>
          </div>
        </div>
      )}

      {/* Partner Perspective Selector */}
      {!isAdminOrStaff && (isDirectPartnerUser || isBranchPartnerUser) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">View Policy For:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPartnerIncentiveViewRole(isBranchPartnerUser ? 'BRANCH_PARTNER' : 'BUSINESS_PARTNER')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  partnerIncentiveViewRole !== 'BUSINESS_ASSOCIATE'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} /> {isBranchPartnerUser ? 'Branch Partner (Self)' : 'Business Partner (Self)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPartnerIncentiveViewRole('BUSINESS_ASSOCIATE')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  partnerIncentiveViewRole === 'BUSINESS_ASSOCIATE'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Users size={13} /> Business Associate (Downline Team)
                </span>
              </button>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleBadgeClass}`}>
            Active: {roleBadgeLabel}
          </span>
        </div>
      )}

      {/* ── 3 INCENTIVE SLAB TABLES IN ONE HORIZONTAL ROW (RESPONSIVE IN MOBILE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* ═══════════ TABLE 1: COMMISSION SLAB % ═══════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
          {/* Main Table Banner */}
          <div className="h-14 px-4 bg-emerald-50/90 flex items-center justify-between border-b border-slate-200">
            <div className="inline-flex items-center gap-2">
              <Coins size={16} className="text-emerald-700" />
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-emerald-950">
                Commission Slab %
              </h2>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${roleBadgeClass}`}>
              {roleBadgeLabel}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="h-12 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider text-slate-700 bg-slate-50/80">
                  <th className="py-2 px-3 border-r border-slate-200 w-24">
                    Plan
                  </th>
                  <th className="py-2 px-3 border-r border-slate-200 leading-tight">
                    Down Payment Fix Commission %
                  </th>
                  <th className="py-2 px-3 leading-tight">
                    EMI Payment Fix Commission %
                  </th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-800">
                {slabs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 font-normal">
                      No plans configured yet.
                    </td>
                  </tr>
                ) : (
                  slabs.map((slab, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70 hover:bg-slate-100/60';

                    const dpComm = effectiveRole === 'associate'
                      ? slab.fdPromoterCommissionPercent
                      : effectiveRole === 'branch_partner'
                      ? (slab.branchFdCommissionPercent !== undefined && slab.branchFdCommissionPercent !== null ? slab.branchFdCommissionPercent : slab.bpFdCommissionPercent)
                      : slab.bpFdCommissionPercent;

                    const emiComm = effectiveRole === 'associate'
                      ? slab.rdPromoterCommissionPercent
                      : effectiveRole === 'branch_partner'
                      ? (slab.branchRdCommissionPercent !== undefined && slab.branchRdCommissionPercent !== null ? slab.branchRdCommissionPercent : slab.bpRdCommissionPercent)
                      : slab.bpRdCommissionPercent;

                    return (
                      <tr key={idx} className={`h-11 border-b border-slate-200 transition-colors ${rowBg}`}>
                        <td className="py-2 px-3 font-mono font-bold border-r border-slate-200 text-xs text-slate-900">
                          {slab.planName || `PLAN-${slab.tenureMonths}M`}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold border-r border-slate-200 text-xs text-emerald-800">
                          {formatPct(dpComm)}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-xs text-teal-800">
                          {formatPct(emiComm)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════ TABLE 2: INCENTIVE SLAB % ═══════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
          {/* Main Table Banner */}
          <div className="h-14 px-4 bg-sky-50/90 flex items-center justify-between border-b border-slate-200">
            <div className="inline-flex items-center gap-2">
              <TrendingUp size={16} className="text-sky-700" />
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-sky-950">
                Incentive Slab %
              </h2>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${roleBadgeClass}`}>
              {roleBadgeLabel}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="h-12 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider text-slate-700 bg-slate-50/80">
                  <th className="py-2.5 px-2.5 border-r border-slate-200 leading-tight w-[56%]">
                    Performance Business Target
                  </th>
                  <th className="py-2.5 px-2.5 leading-tight w-[44%]">
                    Performance<br className="hidden sm:inline" /> Incentive %
                  </th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-800">
                {targetSlabs.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-slate-400 font-normal">
                      No incentive target slabs configured.
                    </td>
                  </tr>
                ) : (
                  targetSlabs.map((slab, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70 hover:bg-slate-100/60';
                    const incPct = slab.targetIncentivePercent ?? 0;

                    return (
                      <tr key={idx} className={`h-11 border-b border-slate-200 transition-colors ${rowBg}`}>
                        <td className="py-2 px-3 font-semibold border-r border-slate-200 text-xs text-slate-900">
                          {formatTargetRange(slab)}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-xs text-sky-800">
                          {formatPct(incPct)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════ TABLE 3: REWARD SLAB % ═══════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
          {/* Main Table Banner */}
          <div className="h-14 px-4 bg-teal-50/90 flex items-center justify-between border-b border-slate-200">
            <div className="inline-flex items-center gap-2">
              <Percent size={16} className="text-teal-700" />
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-teal-950">
                Reward Slab %
              </h2>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${roleBadgeClass}`}>
              {roleBadgeLabel}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="h-12 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider text-slate-700 bg-slate-50/80">
                  <th className="py-2.5 px-2.5 border-r border-slate-200 leading-tight w-[55%]">
                    Yearly Performance Business Target
                  </th>
                  <th className="py-2.5 px-2.5 leading-tight w-[45%]">
                    Yearly Performance<br className="hidden sm:inline" /> Reward %
                  </th>
                </tr>
              </thead>
              <tbody className="font-medium text-slate-800">
                {extraSlabs.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-slate-400 font-normal">
                      No yearly reward slabs configured.
                    </td>
                  </tr>
                ) : (
                  extraSlabs.map((slab, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70 hover:bg-slate-100/60';
                    const rewardPct = slab.extraIncentivePercent ?? 0;

                    return (
                      <tr key={idx} className={`h-11 border-b border-slate-200 transition-colors ${rowBg}`}>
                        <td className="py-2 px-3 font-semibold border-r border-slate-200 text-xs text-slate-900">
                          {formatTargetRange(slab)}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-xs text-teal-800">
                          {formatPct(rewardPct)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionStructurePage;
