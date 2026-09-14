import { SlidersHorizontal, Sparkles, Clock, AlertCircle, Table, Plus, Trash2 } from 'lucide-react';

const TenurePlotRatesMatrix = ({
  rateConfig,
  setRateConfig,
  handleSlabChange,
  handleAddSlab,
  handleRemoveSlab,
  handleUpdateRates,
  submitLoading,
  inputCls = 'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
}) => {
  return (
    <form onSubmit={handleUpdateRates} className="space-y-6">
      {/* Top Config Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
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
            <p className="text-[11px] text-slate-400 mt-1">Used in customer plot refund &amp; settlement calculations.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Clock size={18} className="text-blue-600" />
            <span>EMI Grace Period</span>
          </div>
          <div>
            <label className={labelCls}>Grace Period (Days)</label>
            <input
              className={inputCls}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 15"
              value={rateConfig.lateFineGraceDays ?? ''}
              onChange={(e) =>
                setRateConfig({
                  ...rateConfig,
                  lateFineGraceDays: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Days after customer EMI due date before late fine starts.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <AlertCircle size={18} className="text-rose-600" />
            <span>Daily Late Fine</span>
          </div>
          <div>
            <label className={labelCls}>Daily Fine Rate (% / Day)</label>
            <input
              className={inputCls}
              type="tel"
              inputMode="decimal"
              placeholder="e.g. 0.05"
              value={rateConfig.lateFineDailyPercent ?? ''}
              onChange={(e) =>
                setRateConfig({
                  ...rateConfig,
                  lateFineDailyPercent: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'),
                })
              }
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Daily penalty % on overdue customer EMI installments.</p>
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

      {/* Customer Plot Rates & EMI Tenure Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Table size={18} className="text-teal-700" />
              Customer Plot Rate &amp; EMI Tenure Plans
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Defines tenure duration, customer selling rate (₹/sqft), downpayment % (40%), and installment balance % (60%).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSlab}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Tenure Plan
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            >
              {submitLoading ? 'Saving...' : 'Save Plot Rates'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                <th className="p-3">Period / Label</th>
                <th className="p-3">
                  बिक्री दर प्रति वर्ग फिट<br />
                  <span className="text-slate-400 font-normal">Plot Rate (₹/sqft)</span>
                </th>
                <th className="p-3">
                  डाउन पेमेंट प्रति वर्ग फिट<br />
                  <span className="text-slate-400 font-normal">Downpayment Rate</span>
                </th>
                <th className="p-3">
                  डाउन पेमेंट समय<br />
                  <span className="text-slate-400 font-normal">DP Due Window</span>
                </th>
                <th className="p-3">
                  किश्त प्रति वर्ग फिट<br />
                  <span className="text-slate-400 font-normal">EMI Rate (₹/sqft)</span>
                </th>
                <th className="p-3">
                  किश्त भुगतान समय सीमा<br />
                  <span className="text-slate-400 font-normal">Tenure Duration</span>
                </th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(rateConfig.rateSlabs || []).map((slab, idx) => {
                const isOneTime = Number(slab.tenureMonths) === 0;
                const dpPerSqFt = slab.downpaymentRate || (isOneTime ? (slab.plotRate || 1000) : 500);
                const emiPerSqFt = slab.emiRate || (isOneTime ? 0 : Math.max(0, (slab.plotRate || 0) - dpPerSqFt));
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <input
                        type="text"
                        className="w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                        value={slab.effectiveLabel || ''}
                        placeholder="e.g. 12M Plan"
                        onChange={(e) => handleSlabChange(idx, 'effectiveLabel', e.target.value)}
                      />
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">₹</span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-900"
                          value={slab.plotRate ?? ''}
                          onChange={(e) => handleSlabChange(idx, 'plotRate', e.target.value.replace(/[^0-9]/g, ''))}
                          required
                        />
                        <span className="text-[11px] text-slate-400">/sqft</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold font-mono">
                        ₹{dpPerSqFt} / sqft
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        90 days
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold font-mono">
                        ₹{emiPerSqFt} / sqft
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          value={slab.tenureMonths ?? ''}
                          onChange={(e) => handleSlabChange(idx, 'tenureMonths', e.target.value.replace(/[^0-9]/g, ''))}
                          required
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          {isOneTime ? '(Full Payment)' : 'Months'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete tenure plan"
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-600"></span>
            <span>
              Customer plot rates and payment schedules configured here define booking prices and customer installments. All sponsor commissions are exclusively calculated by the <strong>Target Incentive Policy &amp; Slabs</strong> tab.
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TenurePlotRatesMatrix;
