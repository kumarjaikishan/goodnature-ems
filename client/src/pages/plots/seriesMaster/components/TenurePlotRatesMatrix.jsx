import { SlidersHorizontal, Sparkles, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';

const TenurePlotRatesMatrix = ({
  rateConfig,
  setRateConfig,
  handleUpdateRates,
  submitLoading,
  inputCls = 'h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
}) => {
  return (
    <form onSubmit={handleUpdateRates} className="space-y-6">
      {/* Top Config Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Settlement Rate */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
              <Sparkles size={18} className="text-amber-600" />
              <span>Refund / Settlement Rate</span>
            </div>
            <div>
              <label className={labelCls}>Settlement Annual Rate (% P.A.)</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="decimal"
                value={rateConfig.interestRatePercent ?? ''}
                onChange={(e) =>
                  setRateConfig({
                    ...rateConfig,
                    interestRatePercent: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'),
                  })
                }
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Used in customer plot refund &amp; settlement calculations.</p>
        </div>

        {/* Card 2: Downpayment Grace Period */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
              <Clock size={18} className="text-emerald-600" />
              <span>DP Grace Period</span>
            </div>
            <div>
              <label className={labelCls}>Downpayment Grace (Days)</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 15"
                value={rateConfig.dpGracePeriodDays ?? ''}
                onChange={(e) =>
                  setRateConfig({
                    ...rateConfig,
                    dpGracePeriodDays: e.target.value.replace(/[^0-9]/g, ''),
                  })
                }
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Days after booking date before late fine starts on Down Payment.</p>
        </div>

        {/* Card 3: EMI Grace Period */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
              <Clock size={18} className="text-blue-600" />
              <span>EMI Grace Period</span>
            </div>
            <div>
              <label className={labelCls}>EMI Grace Period (Days)</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 15"
                value={rateConfig.emiGracePeriodDays ?? rateConfig.lateFineGraceDays ?? ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setRateConfig({
                    ...rateConfig,
                    emiGracePeriodDays: val,
                    lateFineGraceDays: val,
                  });
                }}
                required
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Days after customer EMI due date before late fine starts on EMI.</p>
        </div>

        {/* Card 4: Late Fine Rate & Frequency */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
              <AlertCircle size={18} className="text-rose-600" />
              <span>Late Fine Policy</span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <label className={labelCls}>Basis / Period</label>
                  <select
                    className="h-10 w-full min-w-0 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2 rounded-xl font-semibold text-xs text-slate-800 transition"
                    value={rateConfig.lateFineFrequency || 'YEARLY'}
                    onChange={(e) => {
                      const freq = e.target.value;
                      const rate = Number(rateConfig.lateFineRate) || 24;
                      let daily = rate / 365;
                      if (freq === 'MONTHLY') daily = rate / 30;
                      else if (freq === 'DAILY') daily = rate;
                      setRateConfig({
                        ...rateConfig,
                        lateFineFrequency: freq,
                        lateFineDailyPercent: daily,
                      });
                    }}
                  >
                    <option value="YEARLY">Yearly (% P.A.)</option>
                    <option value="MONTHLY">Monthly (%/Mo)</option>
                    <option value="DAILY">Daily (%/Day)</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={labelCls}>Rate %</label>
                  <input
                    className="h-10 w-full min-w-0 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl font-medium text-sm text-slate-800 transition"
                    type="tel"
                    inputMode="decimal"
                    placeholder="e.g. 24"
                    value={rateConfig.lateFineRate ?? ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                      const numVal = Number(val) || 0;
                      const freq = rateConfig.lateFineFrequency || 'YEARLY';
                      let daily = numVal / 365;
                      if (freq === 'MONTHLY') daily = numVal / 30;
                      else if (freq === 'DAILY') daily = numVal;
                      setRateConfig({
                        ...rateConfig,
                        lateFineRate: val,
                        lateFineDailyPercent: daily,
                      });
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-1 min-w-0">
            <span className="truncate">Daily: ~{((Number(rateConfig.lateFineDailyPercent) || (24 / 365))).toFixed(4)}%/day</span>
            <span className="font-semibold text-rose-600 shrink-0">
              {rateConfig.lateFineFrequency === 'DAILY'
                ? `${rateConfig.lateFineRate || 0}% / Day`
                : rateConfig.lateFineFrequency === 'MONTHLY'
                ? `${rateConfig.lateFineRate || 0}% / Mo`
                : `${rateConfig.lateFineRate || 24}% P.A.`}
            </span>
          </div>
        </div>
      </div>

      {/* Plot Premium / PLC Heads Configuration Matrix */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-teal-700" />
              Plot Premium &amp; PLC Heads (Preferential Location Charges)
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Create and manage multiple premium charge heads (e.g. Corner Plot, Park Facing, Main Road, East Facing). One or more heads can be attached to any plot.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const currentHeads = rateConfig.premiumHeads || [];
              setRateConfig({
                ...rateConfig,
                premiumHeads: [
                  ...currentHeads,
                  { name: '', extraPercent: 10, description: '' }
                ]
              });
            }}
            className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={16} /> Add Premium Head
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                <th className="p-3">Premium Head Name</th>
                <th className="p-3">
                  अतिरिक्त शुल्क (%)<br />
                  <span className="text-slate-400 font-normal">Extra Rate Percentage</span>
                </th>
                <th className="p-3">Description / Placement Note</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(rateConfig.premiumHeads || []).map((head, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <input
                      type="text"
                      className="w-48 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      value={head.name || ''}
                      placeholder="e.g. Corner Plot, Park Facing"
                      onChange={(e) => {
                        const updated = [...(rateConfig.premiumHeads || [])];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setRateConfig({ ...rateConfig, premiumHeads: updated });
                      }}
                      required
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-teal-700 font-bold">+</span>
                      <input
                        type="tel"
                        inputMode="decimal"
                        className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-teal-800 text-right"
                        value={head.extraPercent ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
                          const updated = [...(rateConfig.premiumHeads || [])];
                          updated[idx] = { ...updated[idx], extraPercent: val === '' ? '' : Number(val) };
                          // Sync cornerExtraPercent if this head is Corner Plot
                          const isCorner = /corner/i.test(updated[idx].name);
                          setRateConfig({
                            ...rateConfig,
                            premiumHeads: updated,
                            ...(isCorner ? { cornerExtraPercent: Number(val) || 20 } : {})
                          });
                        }}
                        required
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      className="w-full max-w-md px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600"
                      value={head.description || ''}
                      placeholder="e.g. Two side open corner plot, park view, etc."
                      onChange={(e) => {
                        const updated = [...(rateConfig.premiumHeads || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setRateConfig({ ...rateConfig, premiumHeads: updated });
                      }}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (rateConfig.premiumHeads || []).filter((_, i) => i !== idx);
                        setRateConfig({ ...rateConfig, premiumHeads: updated });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete premium head"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(rateConfig.premiumHeads || []).length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-400 italic">
                    No premium heads configured. Click &quot;Add Premium Head&quot; to define custom charges.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={submitLoading}
          className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm"
        >
          {submitLoading ? 'Saving...' : 'Save Configuration & Policy'}
        </button>
      </div>
    </form>
  );
};

export default TenurePlotRatesMatrix;
