import React, { useState, useEffect } from 'react';
import { Layers, Info } from 'lucide-react';
import api from '../../../api/axios';
import PageLoader from '../../../components/common/PageLoader';
import { toast } from '../../../utils/toast';

const COMPOUNDING_LABELS = {
  yearly: 'Yearly',
  half_yearly: 'Half-Yearly',
  quarterly: 'Quarterly',
};

const CustomerPlansPage = () => {
  const [loading, setLoading] = useState(true);
  const [schemeConfig, setSchemeConfig] = useState(null);

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
          subtitle="Fetching official scheme tenures and return slabs"
        />
      </div>
    );
  }

  const slabs = schemeConfig?.slabs || [];
  const compoundingLabel = COMPOUNDING_LABELS[schemeConfig?.compoundingFrequency] || 'Yearly';

  const formatPercent = (val) => {
    if (val === undefined || val === null || val === '' || isNaN(Number(val))) return '0%';
    const num = Number(val);
    if (num === 0) return '0%';
    return `${Number.isInteger(num) ? num : +num.toFixed(3)}%`;
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-4 max-w-5xl mx-auto pb-24">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <Layers size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Customer Plan Tenure &amp; Return Slabs
              </h3>
              <p className="text-[11px] text-slate-500">
                Unified after-booking cancellation return rates ({compoundingLabel} compounding).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
            {slabs.length} Active Slab{slabs.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="px-4 py-2.5 bg-teal-50/50 border-b border-slate-200 flex items-center gap-2 text-[11px] text-teal-900">
          <Info size={14} className="text-teal-700 shrink-0" />
          <span>
            <b>After Booking Cancel Return</b> displays the compound annual interest rate (% p.a.) and total one time down payment refund (%) for each tenure.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider select-none">
                <th
                  rowSpan={2}
                  className="py-3 px-4 bg-slate-100 text-slate-800 border-r border-slate-200 text-left"
                >
                  Plan Name
                </th>
                <th
                  rowSpan={2}
                  className="py-3 px-4 bg-slate-100 text-slate-800 border-r border-slate-200"
                >
                  Tenure
                </th>
                <th
                  colSpan={2}
                  className="py-2.5 px-4 bg-teal-50/80 text-teal-900"
                >
                  After Booking Cancel Return
                </th>
              </tr>
              <tr className="border-b border-slate-200 text-[10px] font-semibold text-slate-600 bg-slate-50 select-none">
                <th className="py-2 px-4 bg-teal-50/40 border-r border-slate-200">Compound Annual Interest %</th>
                <th className="py-2 px-4 bg-teal-50/40">Total One Time Down Payment Refund %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {slabs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 font-normal">
                    No tenure slabs configured yet.
                  </td>
                </tr>
              ) : (
                slabs.map((slab, idx) => {
                  const annualRate = slab.annualInterestRate ?? slab.rdAnnualInterestRate ?? 0;
                  const maturityPercent = slab.rdMaturityPercent ?? slab.fdMaturityPercent ?? 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 border-r border-slate-200">
                        {slab.planName || `PLAN-${slab.tenureMonths}M`}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {slab.tenureMonths} M ({+((Number(slab.tenureMonths) || 0) / 12).toFixed(1)}Y)
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-900 bg-teal-50/20 border-r border-slate-200">
                        {formatPercent(annualRate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-teal-950 bg-teal-50/20">
                        {formatPercent(maturityPercent)}
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
