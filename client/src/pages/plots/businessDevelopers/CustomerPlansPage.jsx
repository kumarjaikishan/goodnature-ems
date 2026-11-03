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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
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
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {slabs.length} Active Slabs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-36">Plan Type</th>
                <th className="py-3 px-4 w-28">Plan Name</th>
                <th className="py-3 px-4 w-36">Tenure (अवधि)</th>
                <th className="py-3 px-5 bg-teal-50/80 text-teal-950 font-bold whitespace-nowrap border-l border-teal-100">
                  After cancellation refund % (EMI Plan)
                </th>
                <th className="py-3 px-5 bg-amber-50/80 text-amber-950 font-bold whitespace-nowrap border-l border-amber-100">
                  After cancellation refund % (One Time Plan)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {slabs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">
                    No tenure slabs configured yet.
                  </td>
                </tr>
              ) : (
                slabs.map((slab, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    {/* Plan Type at first column */}
                    <td className="py-3.5 px-4 whitespace-nowrap w-36">
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

                    {/* Plan Name */}
                    <td className="py-3.5 px-4 font-mono font-black text-slate-800 w-28">
                      {slab.planName || `PLAN-${slab.tenureMonths}M`}
                    </td>

                    {/* Tenure */}
                    <td className="py-3.5 px-4 text-slate-700 font-semibold font-mono whitespace-nowrap w-36">
                      {slab.tenureMonths} Months ({Math.round((slab.tenureMonths / 12) * 10) / 10}Y)
                    </td>

                    {/* EMI Plan: Distinct teal background with strict fixed-width column alignment */}
                    <td className="py-3.5 px-5 bg-teal-50/30 border-l border-teal-100/70 whitespace-nowrap">
                      <div className="grid grid-cols-[100px_16px_72px] items-center">
                        <span className="w-[100px] h-7 flex items-center justify-center rounded-md bg-white text-teal-900 border border-teal-200 font-mono text-xs font-semibold shadow-2xs tabular-nums text-center">
                          {Number(slab.rdAnnualInterestRate ?? slab.annualInterestRate ?? 0)}% p.a.
                        </span>
                        <span className="text-slate-300 text-center select-none font-bold">|</span>
                        {Number(slab.rdMaturityPercent) > 0 ? (
                          <span className="w-[72px] h-7 flex items-center justify-center rounded-md bg-teal-600 text-white font-mono text-xs font-bold shadow-2xs tabular-nums text-center">
                            {Number(slab.rdMaturityPercent)}%
                          </span>
                        ) : (
                          <span className="w-[72px] h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 font-mono text-xs font-medium tabular-nums text-center border border-slate-200">
                            0%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* One-Time Plan: Distinct warm amber/orange background with strict fixed-width column alignment */}
                    <td className="py-3.5 px-5 bg-amber-50/30 border-l border-amber-100/70 whitespace-nowrap">
                      <div className="grid grid-cols-[100px_16px_72px] items-center">
                        <span className="w-[100px] h-7 flex items-center justify-center rounded-md bg-white text-amber-900 border border-amber-200 font-mono text-xs font-semibold shadow-2xs tabular-nums text-center">
                          {Number(slab.fdAnnualInterestRate ?? slab.annualInterestRate ?? 0)}% p.a.
                        </span>
                        <span className="text-slate-300 text-center select-none font-bold">|</span>
                        {Number(slab.fdMaturityPercent) > 0 ? (
                          <span className="w-[72px] h-7 flex items-center justify-center rounded-md bg-amber-600 text-white font-mono text-xs font-bold shadow-2xs tabular-nums text-center">
                            {Number(slab.fdMaturityPercent)}%
                          </span>
                        ) : (
                          <span className="w-[72px] h-7 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 font-mono text-xs font-medium tabular-nums text-center border border-slate-200">
                            0%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerPlansPage;

