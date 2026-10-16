import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  TrendingUp,
  Coins,
  Percent,
  RotateCcw,
  Info,
} from 'lucide-react';
import api from '../../../../api/axios';
import PageLoader from '../../../../components/common/PageLoader';
import { toast } from '../../../../utils/toast';
import {
  calculateRdReturnPercent,
  calculateFdReturnPercent,
} from '../../../../utils/schemeInterestCalculator';

const ProductSchemeRulesTab = ({ onSchemeUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [config, setConfig] = useState({
    minRdAmount: 2000,
    rdStepAmount: 1000,
    minFdAmount: 50000,
    fdStepAmount: 1000,
    prematureAnnualInterestPercent: 6.0,
    rdPrematureAnnualInterestPercent: 6.0,
    fdPrematureAnnualInterestPercent: 6.0,
    slabs: [],
    rulesAndRegulations: [],
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/investments/config');
      if (res.data?.success && res.data?.data) {
        setConfig({
          minRdAmount: res.data.data.minRdAmount ?? 2000,
          rdStepAmount: res.data.data.rdStepAmount ?? 1000,
          minFdAmount: res.data.data.minFdAmount ?? 50000,
          fdStepAmount: res.data.data.fdStepAmount ?? 1000,
          prematureAnnualInterestPercent: res.data.data.prematureAnnualInterestPercent ?? 6.0,
          rdPrematureAnnualInterestPercent: res.data.data.rdPrematureAnnualInterestPercent ?? 6.0,
          fdPrematureAnnualInterestPercent: res.data.data.fdPrematureAnnualInterestPercent ?? 6.0,
          slabs: (res.data.data.slabs || []).map((s) => {
            const defaultRate = s.rdMaturityPercent === 0 && s.fdMaturityPercent === 0 ? 0 : 10.5;
            const baseRate = s.annualInterestRate !== undefined ? s.annualInterestRate : defaultRate;
            const rdRate = s.rdAnnualInterestRate !== undefined ? s.rdAnnualInterestRate : baseRate;
            const fdRate = s.fdAnnualInterestRate !== undefined ? s.fdAnnualInterestRate : baseRate;
            return {
              planName: s.planName || '',
              planType: s.planType || (s.rdMaturityPercent === 0 && s.fdMaturityPercent === 0 ? 'REGISTRY_SALE' : 'INVESTMENT_BUYBACK'),
              annualInterestRate: baseRate,
              rdAnnualInterestRate: rdRate,
              fdAnnualInterestRate: fdRate,
              tenureMonths: s.tenureMonths,
              rdMaturityPercent: s.rdMaturityPercent,
              fdMaturityPercent: s.fdMaturityPercent,
              rdPromoterCommissionPercent: s.rdPromoterCommissionPercent ?? 4.0,
              fdPromoterCommissionPercent: s.fdPromoterCommissionPercent ?? 5.0,
              bpRdCommissionPercent: s.bpRdCommissionPercent ?? s.developerCommissionPercent ?? 1.0,
              bpFdCommissionPercent: s.bpFdCommissionPercent ?? s.developerCommissionPercent ?? 1.0,
              branchRdCommissionPercent: s.branchRdCommissionPercent ?? 0.5,
              branchFdCommissionPercent: s.branchFdCommissionPercent ?? 0.5,
            };
          }),
          rulesAndRegulations: res.data.data.rulesAndRegulations || [],
        });
      }
    } catch (err) {
      console.error('Failed to load scheme rules', err);
      toast.error('Failed to load scheme rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleAddSlab = () => {
    const lastSlab = config.slabs[config.slabs.length - 1];
    const newTenure = lastSlab ? Number(lastSlab.tenureMonths) + 12 : 24;
    const rdRate = lastSlab && Number(lastSlab.rdAnnualInterestRate ?? lastSlab.annualInterestRate) >= 0
      ? Number(lastSlab.rdAnnualInterestRate ?? lastSlab.annualInterestRate)
      : 10.5;
    const fdRate = lastSlab && Number(lastSlab.fdAnnualInterestRate ?? lastSlab.annualInterestRate) >= 0
      ? Number(lastSlab.fdAnnualInterestRate ?? lastSlab.annualInterestRate)
      : 10.5;
    const rdReturn = calculateRdReturnPercent(rdRate, newTenure);
    const fdReturn = calculateFdReturnPercent(fdRate, newTenure);

    setConfig({
      ...config,
      slabs: [
        ...config.slabs,
        {
          planName: `A-${newTenure}`,
          annualInterestRate: rdRate,
          rdAnnualInterestRate: rdRate,
          fdAnnualInterestRate: fdRate,
          tenureMonths: newTenure,
          rdMaturityPercent: rdReturn,
          fdMaturityPercent: fdReturn,
          rdPromoterCommissionPercent: lastSlab ? Number(lastSlab.rdPromoterCommissionPercent || 4) : 4.0,
          fdPromoterCommissionPercent: lastSlab ? Number(lastSlab.fdPromoterCommissionPercent || 5) : 5.0,
          bpRdCommissionPercent: lastSlab ? Number(lastSlab.bpRdCommissionPercent || 1) : 1.0,
          bpFdCommissionPercent: lastSlab ? Number(lastSlab.bpFdCommissionPercent || 1) : 1.0,
          branchRdCommissionPercent: lastSlab ? Number(lastSlab.branchRdCommissionPercent || 0.5) : 0.5,
          branchFdCommissionPercent: lastSlab ? Number(lastSlab.branchFdCommissionPercent || 0.5) : 0.5,
        },
      ],
    });
  };

  const handleRemoveSlab = (index) => {
    const updated = [...config.slabs];
    updated.splice(index, 1);
    setConfig({ ...config, slabs: updated });
  };

  const handleSlabChange = (index, field, value) => {
    const updated = [...config.slabs];
    const item = { ...updated[index] };

    // Keep raw string in state so user can type "." or "10." without it being eaten by Number()
    item[field] = value;

    // Auto-calculate RD return if rdAnnualInterestRate changes
    if (field === 'rdAnnualInterestRate') {
      const tenure = Number(item.tenureMonths) || 0;
      const rate = Number(value);
      item.annualInterestRate = value; // keep legacy in sync
      if (rate === 0) {
        item.rdMaturityPercent = 0;
      } else if (rate > 0 && tenure > 0) {
        item.rdMaturityPercent = calculateRdReturnPercent(rate, tenure);
      }
    }

    // Auto-calculate FD return if fdAnnualInterestRate changes
    if (field === 'fdAnnualInterestRate') {
      const tenure = Number(item.tenureMonths) || 0;
      const rate = Number(value);
      if (rate === 0) {
        item.fdMaturityPercent = 0;
      } else if (rate > 0 && tenure > 0) {
        item.fdMaturityPercent = calculateFdReturnPercent(rate, tenure);
      }
    }

    // Auto-calculate both RD & FD returns if tenureMonths changes
    if (field === 'tenureMonths') {
      const tenure = Number(value) || 0;
      const rdRate = Number(item.rdAnnualInterestRate ?? item.annualInterestRate ?? 10.5);
      const fdRate = Number(item.fdAnnualInterestRate ?? item.annualInterestRate ?? 10.5);

      if (rdRate === 0) {
        item.rdMaturityPercent = 0;
      } else if (rdRate > 0 && tenure > 0) {
        item.rdMaturityPercent = calculateRdReturnPercent(rdRate, tenure);
      }

      if (fdRate === 0) {
        item.fdMaturityPercent = 0;
      } else if (fdRate > 0 && tenure > 0) {
        item.fdMaturityPercent = calculateFdReturnPercent(fdRate, tenure);
      }
    }

    // Auto-calculate both RD & FD if legacy annualInterestRate is changed
    if (field === 'annualInterestRate') {
      item.rdAnnualInterestRate = value;
      item.fdAnnualInterestRate = value;
      const rate = Number(value) || 0;
      const tenure = Number(item.tenureMonths) || 0;
      if (rate === 0) {
        item.rdMaturityPercent = 0;
        item.fdMaturityPercent = 0;
      } else if (rate > 0 && tenure > 0) {
        item.rdMaturityPercent = calculateRdReturnPercent(rate, tenure);
        item.fdMaturityPercent = calculateFdReturnPercent(rate, tenure);
      }
    }

    updated[index] = item;
    setConfig({ ...config, slabs: updated });
  };

  // Explicit recalculation action for a row
  const handleRecalculateRow = (index) => {
    const updated = [...config.slabs];
    const item = { ...updated[index] };
    const tenure = Number(item.tenureMonths) || 24;
    const rdRate = Number(item.rdAnnualInterestRate ?? item.annualInterestRate);
    const fdRate = Number(item.fdAnnualInterestRate ?? item.annualInterestRate);

    if (rdRate === 0 && fdRate === 0) {
      item.rdMaturityPercent = 0;
      item.fdMaturityPercent = 0;
      toast.info('Both rates are 0%: returns set to 0% (Actual Plot Sale).');
    } else {
      const validRd = rdRate >= 0 ? rdRate : 10.5;
      const validFd = fdRate >= 0 ? fdRate : 10.5;
      item.rdAnnualInterestRate = validRd;
      item.fdAnnualInterestRate = validFd;
      item.annualInterestRate = validRd;
      item.rdMaturityPercent = validRd === 0 ? 0 : calculateRdReturnPercent(validRd, tenure);
      item.fdMaturityPercent = validFd === 0 ? 0 : calculateFdReturnPercent(validFd, tenure);
      toast.success(`Calculated for ${tenure}M: RD @ ${validRd}% (${item.rdMaturityPercent}%), FD @ ${validFd}% (${item.fdMaturityPercent}%)`);
    }

    updated[index] = item;
    setConfig({ ...config, slabs: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    // Sanitize slabs to numeric values for backend persistence
    const sanitizedSlabs = config.slabs.map((s) => {
      const rdRate = s.rdAnnualInterestRate === '' ? 0 : Number(s.rdAnnualInterestRate ?? s.annualInterestRate ?? 0);
      const fdRate = s.fdAnnualInterestRate === '' ? 0 : Number(s.fdAnnualInterestRate ?? s.annualInterestRate ?? 0);
      return {
        ...s,
        tenureMonths: Number(s.tenureMonths) || 0,
        annualInterestRate: rdRate,
        rdAnnualInterestRate: rdRate,
        fdAnnualInterestRate: fdRate,
        rdMaturityPercent: s.rdMaturityPercent === '' ? 0 : Number(s.rdMaturityPercent),
        fdMaturityPercent: s.fdMaturityPercent === '' ? 0 : Number(s.fdMaturityPercent),
        rdPromoterCommissionPercent: s.rdPromoterCommissionPercent === '' ? 0 : Number(s.rdPromoterCommissionPercent),
        fdPromoterCommissionPercent: s.fdPromoterCommissionPercent === '' ? 0 : Number(s.fdPromoterCommissionPercent),
        bpRdCommissionPercent: s.bpRdCommissionPercent === '' ? 0 : Number(s.bpRdCommissionPercent),
        bpFdCommissionPercent: s.bpFdCommissionPercent === '' ? 0 : Number(s.bpFdCommissionPercent),
        branchRdCommissionPercent: s.branchRdCommissionPercent === '' ? 0 : Number(s.branchRdCommissionPercent),
        branchFdCommissionPercent: s.branchFdCommissionPercent === '' ? 0 : Number(s.branchFdCommissionPercent),
      };
    });

    try {
      const res = await api.put('/investments/config', { ...config, slabs: sanitizedSlabs });
      if (res.data?.success) {
        toast.success('Product Scheme Rules updated successfully');
        if (onSchemeUpdated) onSchemeUpdated();
      } else {
        toast.error(res.data?.message || 'Failed to update scheme rules');
      }
    } catch (err) {
      console.error('Failed to update scheme rules', err);
      toast.error(err.response?.data?.message || 'Failed to update scheme rules');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <PageLoader title="Loading Product Scheme Rules..." subtitle="Fetching EMI & One-Time Full Payment maturity slabs" />;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Tenure Maturity Returns & Role Fixed Commission Matrix Table */}
        <div className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Customer Tenure Returns &amp; Hierarchy Fixed Commission Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Set customer returns (calculated via annual interest rate) and instant fixed commissions for Business Associate, Business Partner, and Branch Partner.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSlab}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Plus size={16} /> Add Tenure Slab
            </button>
          </div>

          {/* Formula Explanation Banner */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-teal-950">
            <Info size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-teal-900">Compound Calculation &amp; Actual Plot Sale:</span>
              <p className="text-teal-800 text-[11px]">
                • <b>EMI (R.D.) Scheme:</b> Enter <b>Rate (% p.a.)</b> on the left to automatically calculate the <b>Maturity Return %</b> on the right using Yearly Compounding.
                <br />
                • <b>One-Time (F.D.) Scheme:</b> Enter <b>Rate (% p.a.)</b> on the left to automatically calculate the <b>Maturity Return %</b> on the right using Standard Compounding.
                <br />
                • <b>Independent Rates:</b> RD and FD each have their own rate input directly inside their respective scheme column for the same tenure.
                <br />
                • <b>Actual Plot Sale:</b> Enter <b>0%</b> for Rates/Returns. Customer return will be 0% while <b>Hierarchy Commissions (BA, BP, Branch Partner)</b> remain active.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[1080px]">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3">Plan Name</th>
                  <th className="p-3">Tenure (अवधि)</th>
                  {/* EMI (R.D.) Scheme: Rate % p.a. | Return % */}
                  <th className="p-3 bg-teal-50/70 border-l border-teal-200">
                    <div className="text-teal-950">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <Coins size={14} className="text-teal-700" />
                        <span>EMI (R.D.) Scheme</span>
                      </div>
                      <span className="text-[9px] font-semibold text-teal-700 block mt-0.5">
                        Rate (% p.a.) | Return (%)
                      </span>
                    </div>
                  </th>
                  {/* One-Time (F.D.) Scheme: Rate % p.a. | Return % */}
                  <th className="p-3 bg-emerald-50/70 border-l border-emerald-200">
                    <div className="text-emerald-950">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <TrendingUp size={14} className="text-emerald-700" />
                        <span>One-Time (F.D.) Scheme</span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-700 block mt-0.5">
                        Rate (% p.a.) | Return (%)
                      </span>
                    </div>
                  </th>
                  {/* Business Associate Fixed */}
                  <th className="p-3 bg-blue-50/70 border-l border-blue-200">
                    <div className="text-blue-900">
                      <span className="font-extrabold block">BA (Associate) Fixed %</span>
                      <span className="text-[9px] font-semibold text-blue-700 block mt-0.5">EMI | One-Time</span>
                    </div>
                  </th>
                  {/* Business Partner Fixed */}
                  <th className="p-3 bg-amber-50/70 border-l border-amber-200">
                    <div className="text-amber-900">
                      <span className="font-extrabold block">BP (Partner) Fixed %</span>
                      <span className="text-[9px] font-semibold text-amber-700 block mt-0.5">EMI | One-Time</span>
                    </div>
                  </th>
                  {/* Branch Partner Fixed */}
                  <th className="p-3 bg-purple-50/70 border-l border-purple-200">
                    <div className="text-purple-900">
                      <span className="font-extrabold block">Branch Partner Fixed %</span>
                      <span className="text-[9px] font-semibold text-purple-700 block mt-0.5">EMI | One-Time</span>
                    </div>
                  </th>
                  <th className="p-3 text-center border-l border-slate-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.slabs.map((s, idx) => {
                  const isZeroReturn = Number(s.rdMaturityPercent) === 0 && Number(s.fdMaturityPercent) === 0;
                  return (
                    <tr key={idx} className={`transition ${isZeroReturn ? 'bg-emerald-50/25 hover:bg-emerald-50/40' : 'hover:bg-slate-50/70'}`}>
                      {/* Plan Name */}
                      <td className="p-3 font-bold text-slate-800">
                        <input
                          type="text"
                          className="w-20 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-teal-600 outline-none"
                          value={s.planName || ''}
                          placeholder="A-24"
                          onChange={(e) => handleSlabChange(idx, 'planName', e.target.value)}
                        />
                      </td>

                      {/* Tenure (Months) - Allows digits and decimal */}
                      <td className="p-3 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="tel"
                            inputMode="decimal"
                            className="w-16 h-8 bg-white border border-slate-300 rounded-lg px-2 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-teal-600 outline-none"
                            value={s.tenureMonths ?? ''}
                            onKeyDown={(e) => {
                              if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                              if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                            }}
                            onChange={(e) => {
                              const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                              handleSlabChange(idx, 'tenureMonths', cleanVal);
                            }}
                            required
                          />
                          <span className="text-slate-500 font-semibold text-xs whitespace-nowrap">
                            M ({+((Number(s.tenureMonths) || 0) / 12).toFixed(1)}Y)
                          </span>
                        </div>
                      </td>

                      {/* EMI (R.D.) Scheme: Rate % p.a. | Return % */}
                      <td className="p-3 bg-teal-50/20 border-l border-teal-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" title="RD Annual Rate % p.a. (Used to calculate EMI RD Return %)">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-teal-300 rounded-lg px-2 text-xs font-bold font-mono text-teal-950 focus:ring-2 focus:ring-teal-600 outline-none"
                              value={s.rdAnnualInterestRate ?? s.annualInterestRate ?? 10.5}
                              placeholder="Rate %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'rdAnnualInterestRate', cleanVal);
                              }}
                              title="RD Annual Interest Rate % p.a."
                            />
                            <span className="font-bold text-teal-800 text-[11px]">%</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1" title="EMI (R.D.) Maturity Return % (Yearly Compounded)">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className={`w-16 h-8 bg-white border rounded-lg px-2 text-xs font-bold font-mono outline-none ${
                                Number(s.rdMaturityPercent) === 0
                                  ? 'border-emerald-300 text-emerald-800 font-extrabold focus:ring-2 focus:ring-emerald-500'
                                  : 'border-teal-300 text-teal-900 focus:ring-2 focus:ring-teal-600'
                              }`}
                              value={s.rdMaturityPercent ?? ''}
                              placeholder="Return %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'rdMaturityPercent', cleanVal);
                              }}
                              title="Auto-calculated using Yearly Compounding on monthly installments (enter 0 for actual plot sale)"
                            />
                            <span className="font-bold text-teal-700 text-xs">%</span>
                          </div>
                        </div>
                      </td>

                      {/* One-Time (F.D.) Scheme: Rate % p.a. | Return % */}
                      <td className="p-3 bg-emerald-50/20 border-l border-emerald-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" title="FD Annual Rate % p.a. (Used to calculate One-Time FD Return %)">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-emerald-300 rounded-lg px-2 text-xs font-bold font-mono text-emerald-950 focus:ring-2 focus:ring-emerald-600 outline-none"
                              value={s.fdAnnualInterestRate ?? s.annualInterestRate ?? 10.5}
                              placeholder="Rate %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'fdAnnualInterestRate', cleanVal);
                              }}
                              title="FD Annual Interest Rate % p.a."
                            />
                            <span className="font-bold text-emerald-800 text-[11px]">%</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1" title="One-Time (F.D.) Return % (Holding Period)">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className={`w-16 h-8 bg-white border rounded-lg px-2 text-xs font-bold font-mono outline-none ${
                                Number(s.fdMaturityPercent) === 0
                                  ? 'border-emerald-300 text-emerald-800 font-extrabold focus:ring-2 focus:ring-emerald-500'
                                  : 'border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-600'
                              }`}
                              value={s.fdMaturityPercent ?? ''}
                              placeholder="Return %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'fdMaturityPercent', cleanVal);
                              }}
                              title="Auto-calculated using standard compounding for tenure (enter 0 for actual plot sale)"
                            />
                            <span className="font-bold text-emerald-700 text-xs">%</span>
                          </div>
                        </div>
                      </td>

                      {/* Business Associate Fixed (EMI & One-Time) */}
                      <td className="p-3 bg-blue-50/30 border-l border-blue-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" title="BA Monthly EMI Fixed %">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-blue-300 rounded-lg px-2 text-xs font-bold font-mono text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={s.rdPromoterCommissionPercent ?? ''}
                              placeholder="EMI %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'rdPromoterCommissionPercent', cleanVal);
                              }}
                            />
                            <span className="font-bold text-blue-700 text-xs">%</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1" title="BA One-Time FD Fixed %">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-blue-300 rounded-lg px-2 text-xs font-bold font-mono text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={s.fdPromoterCommissionPercent ?? ''}
                              placeholder="FD %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'fdPromoterCommissionPercent', cleanVal);
                              }}
                            />
                            <span className="font-bold text-blue-700 text-xs">%</span>
                          </div>
                        </div>
                      </td>

                      {/* Business Partner Fixed (EMI & One-Time) */}
                      <td className="p-3 bg-amber-50/30 border-l border-amber-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" title="BP Monthly EMI Fixed %">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-amber-300 rounded-lg px-2 text-xs font-bold font-mono text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                              value={s.bpRdCommissionPercent ?? ''}
                              placeholder="EMI %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'bpRdCommissionPercent', cleanVal);
                              }}
                            />
                            <span className="font-bold text-amber-800 text-xs">%</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1" title="BP One-Time FD Fixed %">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-amber-300 rounded-lg px-2 text-xs font-bold font-mono text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                              value={s.bpFdCommissionPercent ?? ''}
                              placeholder="FD %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'bpFdCommissionPercent', cleanVal);
                              }}
                            />
                            <span className="font-bold text-amber-800 text-xs">%</span>
                          </div>
                        </div>
                      </td>

                      {/* Branch Partner Fixed (EMI & One-Time) */}
                      <td className="p-3 bg-purple-50/30 border-l border-purple-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1" title="Branch Partner Monthly EMI Fixed %">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-purple-300 rounded-lg px-2 text-xs font-bold font-mono text-purple-900 focus:ring-2 focus:ring-purple-500 outline-none"
                              value={s.branchRdCommissionPercent ?? ''}
                              placeholder="EMI %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'branchRdCommissionPercent', cleanVal);
                              }}
                            />
                            <span className="font-bold text-purple-800 text-xs">%</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1" title="Branch Partner One-Time FD Fixed %">
                            <input
                              type="tel"
                              inputMode="decimal"
                              className="w-16 h-8 bg-white border border-purple-300 rounded-lg px-2 text-xs font-bold font-mono text-purple-900 focus:ring-2 focus:ring-purple-500 outline-none"
                              value={s.branchFdCommissionPercent ?? ''}
                              placeholder="FD %"
                              onKeyDown={(e) => {
                                if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.key === '.' || e.key === 'Decimal') return;
                                if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                                handleSlabChange(idx, 'branchFdCommissionPercent', cleanVal);
                              }}
                            />
                            <span className="font-bold text-purple-800 text-xs">%</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions: Recalculate & Remove */}
                      <td className="p-3 text-center border-l border-slate-100">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRecalculateRow(idx)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Re-calculate RD & FD returns from Annual Rate"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlab(idx)}
                            disabled={config.slabs.length <= 1}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                            title="Remove Slab"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Save size={16} />
              {submitLoading ? 'Saving Configuration...' : 'Save Scheme Matrix'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductSchemeRulesTab;

