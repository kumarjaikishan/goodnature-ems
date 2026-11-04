import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Layers } from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import { toast } from '../../../utils/toast';

const CustomerPlansPage = () => {
  const { user } = useSelector((state) => state.auth || state.user || {});
  const userRole = String(user?.role || '').toLowerCase();
  const isAdminOrStaff = ['superadmin', 'admin', 'developer', 'manager', 'cashier', 'accountant'].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [schemeConfig, setSchemeConfig] = useState(null);
  const [adminViewRole, setAdminViewRole] = useState('associate');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const schemeRes = await api.get('/investments/config');
        if (isMounted) {
          setSchemeConfig(schemeRes.data?.data || schemeRes.data || null);
        }
      } catch (err) {
        console.error('Failed to load scheme configuration:', err);
        if (isMounted) {
          toast.error('Failed to load scheme configuration');
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
          title="Loading Customer Plans..."
          subtitle="Fetching official scheme tenures and maturity return slabs"
        />
      </div>
    );
  }

  const slabs = schemeConfig?.slabs || [];

  const formatRate = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '0%';
    const num = Number(val);
    if (num === 0) return '0%';
    return `${num.toFixed(2)}%`;
  };

  const formatMaturity = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return '0%';
    const num = Number(val);
    if (num === 0) return '0%';
    return `${Number.isInteger(num) ? num : num.toFixed(2)}%`;
  };

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

      {/* Slabs Table Card */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Customer Plan Tenure &amp; Return Slabs
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Customer Return displays total maturity return percentage for EMI &amp; One-Time investment plans.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            {slabs.length} Active Slabs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              {/* Top Group Header Row */}
              <tr className="border-b border-slate-300 text-xs font-bold text-slate-800 select-none">
                <th
                  rowSpan={2}
                  className="py-4 px-4 bg-[#e2ede0] text-slate-900 font-extrabold text-sm border-r border-slate-300 w-44"
                >
                  Plan Name
                </th>
                <th
                  colSpan={2}
                  className="py-3 px-4 bg-[#eaf4eb] text-slate-900 font-extrabold border-r border-slate-300"
                >
                  After Cancellation Refund % For (EMI Plan)
                </th>
                <th
                  colSpan={2}
                  className="py-3 px-4 bg-[#fef5e7] text-slate-900 font-extrabold"
                >
                  After Cancellation Refund % For (100% Down payment Plan)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-medium">
              {slabs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">
                    No tenure slabs configured yet.
                  </td>
                </tr>
              ) : (
                slabs.map((slab, idx) => {
                  const isStriped = idx % 2 === 1;
                  const rowBg = isStriped ? 'bg-[#e5e7eb]' : 'bg-[#f9fafb]';
                  const emiBg = isStriped ? 'bg-[#d8e8dc]' : 'bg-[#f0f7f2]';
                  const oneTimeBg = isStriped ? 'bg-[#faebd7]' : 'bg-[#fef9f1]';

                  const emiRate = slab.rdAnnualInterestRate ?? slab.annualInterestRate ?? 0;
                  const emiMaturity = slab.rdMaturityPercent ?? 0;

                  const oneTimeRate = slab.fdAnnualInterestRate ?? slab.annualInterestRate ?? 0;
                  const oneTimeMaturity = slab.fdMaturityPercent ?? 0;

                  return (
                    <tr key={idx} className={`border-b border-slate-300 transition-colors`}>
                      {/* Plan Name */}
                      <td className={`py-3.5 px-4 font-mono font-black text-slate-900 text-sm border-r border-slate-300 ${rowBg}`}>
                        {slab.planName || `PLAN-${slab.tenureMonths}M`}
                      </td>

                      {/* EMI Plan: Interest Rate p.a. (2 decimals) */}
                      <td className={`py-3.5 px-4 font-mono font-bold text-slate-900 border-r border-slate-300 w-36 ${emiBg}`}>
                        {formatRate(emiRate)}
                      </td>

                      {/* EMI Plan: Maturity % */}
                      <td className={`py-3.5 px-4 font-mono font-extrabold text-teal-950 border-r border-slate-300 w-36 ${emiBg}`}>
                        {formatMaturity(emiMaturity)}
                      </td>

                      {/* One Time / 100% DP Plan: Interest Rate p.a. (2 decimals) */}
                      <td className={`py-3.5 px-4 font-mono font-bold text-slate-900 border-r border-slate-300 w-36 ${oneTimeBg}`}>
                        {formatRate(oneTimeRate)}
                      </td>

                      {/* One Time / 100% DP Plan: Maturity % */}
                      <td className={`py-3.5 px-4 font-mono font-extrabold text-amber-950 w-36 ${oneTimeBg}`}>
                        {formatMaturity(oneTimeMaturity)}
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
  );
};

export default CustomerPlansPage;
