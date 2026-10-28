import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Award,
  SlidersHorizontal,
  Coins,
  TrendingUp,
  Target,
  Sparkles,
  Gift,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import { toast } from '../../../utils/toast';

const CommissionStructurePage = () => {
  const user = useSelector((state) => state.user);
  const profile = user?.profile || user || {};

  // Detect whether viewer is Business Partner or Business Associate
  const isDirectPartner = Boolean(
    profile.isDeveloperSponsor === true ||
    profile.sponsorCode?.startsWith('BP-') ||
    profile.role === 'partner'
  );
  const isDirectAssociate = Boolean(
    profile.isDeveloperSponsor === false ||
    profile.sponsorCode?.startsWith('BA-') ||
    profile.role === 'associate'
  );
  const isAdminOrStaff = ['superadmin', 'admin', 'manager', 'developer'].includes(profile.role);

  // If Admin/Staff, let them toggle perspective; otherwise lock to their role
  const [adminViewRole, setAdminViewRole] = useState(isDirectPartner ? 'partner' : 'associate');
  const activeRoleMode = isAdminOrStaff ? adminViewRole : (isDirectPartner ? 'partner' : 'associate');

  // Main Tabs: 'direct' (Scheme Rules & Returns) vs 'incentives' (Target & Extra Incentive Policy)
  const [activeTab, setActiveTab] = useState('direct');


  // For Business Partner viewing incentive tab: can view BP or BA policies
  const [partnerIncentiveViewRole, setPartnerIncentiveViewRole] = useState('BUSINESS_PARTNER');

  // Data states
  const [loading, setLoading] = useState(true);
  const [schemeConfig, setSchemeConfig] = useState(null);
  const [policyData, setPolicyData] = useState(null);

  // Fetch Scheme Config (Direct Commission) & Commission Policy (Target & Extra Incentives)
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schemeRes, policyRes] = await Promise.all([
          api.get('/investments/config').catch((err) => {
            console.warn('Failed to load scheme config:', err);
            return { data: { data: null } };
          }),
          api.get('/plots/commission-policy').catch((err) => {
            console.warn('Failed to load commission policy:', err);
            return { data: { data: null } };
          }),
        ]);

        if (isMounted) {
          if (schemeRes.data?.data) {
            setSchemeConfig(schemeRes.data.data);
          }
          if (policyRes.data?.data) {
            setPolicyData(policyRes.data.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Failed to load commission policies');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <PageLoader
          title="Loading Commission Policies..."
          subtitle="Fetching official direct commission slabs and incentive structures"
        />
      </div>
    );
  }

  const slabs = schemeConfig?.slabs || [];
  const policyRoles = policyData?.roles || [];

  // Filter incentive roles according to user's identity
  // - BA sees only BUSINESS_ASSOCIATE
  // - BP sees BUSINESS_PARTNER or BUSINESS_ASSOCIATE (via partnerIncentiveViewRole toggle)
  const selectedPolicyRole = policyRoles.find((r) => {
    if (activeRoleMode === 'associate') {
      return r.roleName === 'BUSINESS_ASSOCIATE';
    }
    return r.roleName === partnerIncentiveViewRole;
  }) || policyRoles[0];

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-5 max-w-7xl mx-auto pb-24">
      {/* ── Top Bar: Role badge & Admin perspective toggle if needed ── */}
      {isAdminOrStaff && (
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Viewing As:
          </span>
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
                  ? 'bg-white text-purple-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business Partner
            </button>
          </div>
        </div>
      )}

      {/* ── Primary Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === 'direct'
              ? 'border-teal-700 text-teal-800 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Coins size={16} />
          <span>Direct Commission</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('incentives')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === 'incentives'
              ? 'border-teal-700 text-teal-800 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Target size={16} />
          <span>Incentive Commission</span>
        </button>
      </div>

      {/* ── TAB 1: DIRECT COMMISSION MATRIX ── */}
      {activeTab === 'direct' && (
        <div className="space-y-4">

          {/* Slabs Table Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={17} className="text-teal-700" />
                <h3 className="text-sm font-bold text-slate-800">
                  Customer Plan Tenure &amp; Commission Slabs
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {slabs.length} Active Slabs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4">Tenure (अवधि)</th>
                    <th className="py-3 px-4">Plan Type</th>
                    {/* If Associate View, show only Business Associate columns */}
                    {activeRoleMode === 'associate' ? (
                      <>
                        <th className="py-3 px-4 bg-teal-50/60 text-teal-950">
                          Business Associate Fixed % (EMI)
                        </th>
                        <th className="py-3 px-4 bg-emerald-50/60 text-emerald-950">
                          Business Associate Fixed % (One-Time)
                        </th>
                      </>
                    ) : (
                      /* If Partner View, show BOTH Business Partner and Business Associate columns */
                      <>
                        <th className="py-3 px-4 bg-purple-50/70 text-purple-950">
                          Business Partner Fixed % (EMI)
                        </th>
                        <th className="py-3 px-4 bg-purple-100/60 text-purple-950">
                          Business Partner Fixed % (One-Time)
                        </th>
                        <th className="py-3 px-4 bg-teal-50/60 text-teal-950">
                          Business Associate Fixed % (EMI)
                        </th>
                        <th className="py-3 px-4 bg-emerald-50/60 text-emerald-950">
                          Business Associate Fixed % (One-Time)
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {slabs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-normal">
                        No tenure slabs configured yet.
                      </td>
                    </tr>
                  ) : (
                    slabs.map((slab, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        {/* Plan Name */}
                        <td className="py-3.5 px-4 font-mono font-black text-slate-800">
                          {slab.planName || `PLAN-${slab.tenureMonths}M`}
                        </td>

                        {/* Tenure */}
                        <td className="py-3.5 px-4 text-slate-700 font-semibold font-mono">
                          {slab.tenureMonths} Months ({Math.round((slab.tenureMonths / 12) * 10) / 10}Y)
                        </td>

                        {/* Plan Type */}
                        <td className="py-3.5 px-4">
                          {Boolean(slab.showInAddBooking || slab.planType === 'REGISTRY_SALE' || slab.planName?.toLowerCase().includes('plot')) ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Plot Booking
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Investment Booking
                            </span>
                          )}
                        </td>

                        {/* Column rates depending on role */}
                        {activeRoleMode === 'associate' ? (
                          <>
                            <td className="py-3.5 px-4 bg-teal-50/30 font-mono font-black text-teal-850 text-sm">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-100/80 text-teal-900 border border-teal-200 font-bold">
                                {Number(slab.rdPromoterCommissionPercent ?? 4.0)}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 bg-emerald-50/30 font-mono font-black text-emerald-850 text-sm">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 border border-emerald-200 font-bold">
                                {Number(slab.fdPromoterCommissionPercent ?? 5.0)}%
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3.5 px-4 bg-purple-50/30 font-mono text-sm">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-100/80 text-purple-900 border border-purple-200 font-black">
                                {Number(slab.bpRdCommissionPercent ?? 1.0)}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 bg-purple-50/50 font-mono text-sm">
                              <span className="px-2.5 py-1 rounded-lg bg-purple-200/70 text-purple-900 border border-purple-300 font-black">
                                {Number(slab.bpFdCommissionPercent ?? 1.5)}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 bg-teal-50/30 font-mono text-sm">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                                {Number(slab.rdPromoterCommissionPercent ?? 4.0)}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 bg-emerald-50/30 font-mono text-sm">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                {Number(slab.fdPromoterCommissionPercent ?? 5.0)}%
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. TAB 2: TARGET & EXTRA INCENTIVE POLICY ───────────────────── */}
      {activeTab === 'incentives' && (
        <div className="space-y-4">
          {/* Partner Role Selector */}
          {activeRoleMode === 'partner' && (
            <div className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">View Policy For:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPartnerIncentiveViewRole('BUSINESS_PARTNER')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      partnerIncentiveViewRole === 'BUSINESS_PARTNER'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 Business Partner (Self)
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
                    👥 Business Associate (Team)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Policy Active Details Banner */}
          <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50/50 to-slate-50 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-700 text-white rounded-xl shadow-xs">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>
                    {selectedPolicyRole?.roleName === 'BUSINESS_PARTNER'
                      ? 'Business Partner Incentive Policy'
                      : 'Business Associate Incentive Policy'}
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200">
                    Active Cycle: {policyData?.policyName || 'Quarterly'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Target incentive % and milestone rewards are evaluated on your total collection volume across Plot Bookings &amp; Investment Bookings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-slate-500 font-medium">Policy Period:</span>
              <span className="px-2.5 py-1 bg-white font-mono font-bold text-xs text-slate-800 rounded-lg border border-slate-200">
                {policyData?.validFrom ? new Date(policyData.validFrom).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Current Period'}
              </span>
            </div>
          </div>

          {/* 1. Target Collection Slabs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={17} className="text-teal-700" />
                <h4 className="text-sm font-bold text-slate-800">
                  Target Collection Slabs &amp; Additional Incentive %
                </h4>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Quarterly Target
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Qualifying Collection Range</th>
                    <th className="py-3 px-4 text-center">Target Incentive %</th>
                    <th className="py-3 px-4 text-center">Closing Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(!selectedPolicyRole?.targetSlabs || selectedPolicyRole.targetSlabs.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 font-normal">
                        No target collection slabs configured for this role.
                      </td>
                    </tr>
                  ) : (
                    selectedPolicyRole.targetSlabs.map((slab, sIdx) => {
                      const incPct = Number(slab.targetIncentivePercent || 0);
                      return (
                        <tr key={sIdx} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {slab.label || (
                              slab.maxAmount
                                ? `₹${Number(slab.minAmount).toLocaleString('en-IN')} - ₹${Number(slab.maxAmount).toLocaleString('en-IN')}`
                                : `₹${Number(slab.minAmount).toLocaleString('en-IN')} & Above`
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-3 py-1 rounded-lg bg-teal-100/90 text-teal-900 border border-teal-200 font-mono font-black text-xs">
                              {incPct}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[11px] font-semibold text-slate-600">
                              Credited At Period Closing
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Extra Incentive & Campaign Rewards Slabs */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={17} className="text-amber-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  Extra Incentive Campaign Slabs &amp; Performance Rewards
                </h4>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Milestone Rewards
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Milestone Turnover Slab</th>
                    <th className="py-3 px-4">Extra Incentive %</th>
                    <th className="py-3 px-4">Official Campaign Reward Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(!selectedPolicyRole?.extraSlabs || selectedPolicyRole.extraSlabs.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 font-normal">
                        No extra incentive milestone slabs configured.
                      </td>
                    </tr>
                  ) : (
                    selectedPolicyRole.extraSlabs.map((slab, eIdx) => {
                      const primaryInc = slab.extraIncentives?.[0] || {};
                      const extraPct = primaryInc.percent ?? slab.extraIncentivePercent ?? 0;
                      const reward = slab.rewardTitle || primaryInc.rewardTitle || '-';
                      return (
                        <tr key={eIdx} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {slab.label || (
                              slab.maxAmount
                                ? `₹${Number(slab.minAmount).toLocaleString('en-IN')} - ₹${Number(slab.maxAmount).toLocaleString('en-IN')}`
                                : `₹${Number(slab.minAmount).toLocaleString('en-IN')} & Above`
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {Number(extraPct) > 0 ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-200 font-mono font-black text-xs">
                                +{extraPct}%
                              </span>
                            ) : (
                              <span className="text-slate-400">Award / Gift Only</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500 shrink-0" />
                            <span>{reward}</span>
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
      )}
    </div>
  );
};

export default CommissionStructurePage;
