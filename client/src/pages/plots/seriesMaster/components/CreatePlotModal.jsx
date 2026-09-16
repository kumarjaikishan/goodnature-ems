import { SlidersHorizontal, Sparkles, Check } from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';

const CreatePlotModal = ({
  open,
  onClose,
  plotForm,
  setPlotForm,
  handleSeriesChangeInPlotForm,
  handleCreatePlot,
  seriesList = [],
  rateConfig = {},
  submitLoading,
  inputCls = 'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
}) => {
  const availableHeads = (rateConfig.premiumHeads && rateConfig.premiumHeads.length > 0)
    ? rateConfig.premiumHeads
    : [
        { name: 'Corner Plot', extraPercent: Number(rateConfig.cornerExtraPercent) || 20, description: 'Two-side open corner plot' },
        { name: 'Park Facing', extraPercent: 10, description: 'Directly facing park or green belt' },
        { name: 'Main Road Facing', extraPercent: 15, description: 'Situated on wide sector road' },
        { name: 'East Facing', extraPercent: 5, description: 'Vastu compliant east facing orientation' },
      ];

  const selectedHeads = Array.isArray(plotForm.premiumHeads) ? plotForm.premiumHeads : [];

  const isHeadSelected = (headName) => {
    return selectedHeads.some((h) => h.name?.toLowerCase() === headName?.toLowerCase());
  };

  const toggleHead = (head) => {
    let nextHeads;
    if (isHeadSelected(head.name)) {
      nextHeads = selectedHeads.filter((h) => h.name?.toLowerCase() !== head.name?.toLowerCase());
    } else {
      nextHeads = [...selectedHeads, { name: head.name, extraPercent: Number(head.extraPercent) || 0 }];
    }
    const hasCorner = nextHeads.some((h) => /corner/i.test(h.name));
    setPlotForm({
      ...plotForm,
      premiumHeads: nextHeads,
      plotType: hasCorner ? 'CORNER' : 'NORMAL',
    });
  };

  const totalExtraPercent = selectedHeads.reduce((sum, h) => sum + (Number(h.extraPercent) || 0), 0);
  const baseRate = Number(rateConfig.baseSqFtRate) || 1000;
  const effectiveRate = Math.round(baseRate * (1 + totalExtraPercent / 100) * 100) / 100;
  const plotAreaNum = parseFloat(plotForm.plotSize) || 0;
  const totalPlotValue = Math.round(plotAreaNum * effectiveRate);

  return (
    <Modalbox open={open} onClose={onClose} size="xl" outside={false}>
      <div className="w-full flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">Add Individual Plot</h3>
            <p className="text-xs text-slate-500 font-medium">Add a plot directly to a series block or standalone.</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer transition"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleCreatePlot} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Assign to Series (Optional)</label>
            <select
              className={inputCls}
              value={plotForm.seriesId}
              onChange={(e) => handleSeriesChangeInPlotForm(e.target.value)}
            >
              <option value="">-- Standalone (No Series) --</option>
              {seriesList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.prefix})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Plot Number</label>
            <input
              className={inputCls}
              placeholder="e.g. A051"
              value={plotForm.plotNumber}
              onChange={(e) => setPlotForm({ ...plotForm, plotNumber: e.target.value.toUpperCase() })}
              required
            />
          </div>

          {/* Plot Premium / PLC Heads Multi-Select Group */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-teal-700" />
                  Plot Premium &amp; PLC Heads
                </label>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Attach one or more location premium heads to this plot.
                </p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                totalExtraPercent > 0 ? 'bg-teal-100 text-teal-900 border-teal-300' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                +{totalExtraPercent}% Extra
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {availableHeads.map((head, idx) => {
                const selected = isHeadSelected(head.name);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleHead(head)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                      selected
                        ? 'bg-teal-50/90 border-teal-500 text-teal-950 shadow-xs ring-1 ring-teal-500/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span className="truncate">{head.name}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono ${
                          selected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-teal-800'
                        }`}>
                          +{head.extraPercent}%
                        </span>
                      </div>
                      {head.description && (
                        <p className="text-[10px] text-slate-500 truncate">{head.description}</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                      selected ? 'bg-teal-700 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {selected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Pricing Breakdown Strip */}
            <div className="mt-2 p-3 bg-white border border-teal-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Base Rate</span>
                <span className="font-mono font-bold text-slate-800">₹{baseRate}/sqft</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Effective Rate</span>
                <span className="font-mono font-bold text-slate-900">₹{effectiveRate}/sqft</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Plot Total Value</span>
                <span className="font-mono font-extrabold text-teal-800">₹{totalPlotValue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Plot Size (Sq Ft)</label>
            <input
              className={inputCls}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={plotForm.plotSize}
              onChange={(e) => setPlotForm({ ...plotForm, plotSize: e.target.value.replace(/[^0-9]/g, '') })}
              required
            />
          </div>

          {/* Dimensions (N/S/E/W) with Auto Area Calculation */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                Dimensions / पैमाइश (in Feet - N / S / E / W)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">Auto-calculates area if entered</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  North (उत्तर)
                  <span className="block text-[9px] text-teal-700 font-medium">पूरब-पश्चिम जानिब उत्तर</span>
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.north !== undefined ? plotForm.dimensions.north : 0}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(plotForm.dimensions || {}), north: val };
                    const n = parseFloat(val) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(nextDims.east) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setPlotForm({
                      ...plotForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize,
                    });
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  South (दक्षिण)
                  <span className="block text-[9px] text-teal-700 font-medium">पूरब-पश्चिम जानिब दक्षिण</span>
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.south !== undefined ? plotForm.dimensions.south : 0}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(plotForm.dimensions || {}), south: val };
                    const n = parseFloat(nextDims.north) || parseFloat(val) || 0;
                    const s = parseFloat(val) || 0;
                    const east = parseFloat(nextDims.east) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setPlotForm({
                      ...plotForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize,
                    });
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  East (पूरब)
                  <span className="block text-[9px] text-teal-700 font-medium">उत्तर-दक्षिण जानिब पूरब</span>
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.east !== undefined ? plotForm.dimensions.east : 0}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(plotForm.dimensions || {}), east: val };
                    const n = parseFloat(nextDims.north) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(val) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setPlotForm({
                      ...plotForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize,
                    });
                  }}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  West (पश्चिम)
                  <span className="block text-[9px] text-teal-700 font-medium">उत्तर-दक्षिण जानिब पश्चिम</span>
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.west !== undefined ? plotForm.dimensions.west : 0}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(plotForm.dimensions || {}), west: val };
                    const n = parseFloat(nextDims.north) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(nextDims.east) || parseFloat(val) || 0;
                    const w = parseFloat(val) || 0;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setPlotForm({
                      ...plotForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Boundaries / Chaudhi (N/S/E/W) */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
              Boundaries / चौहद्दी (Surroundings)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  North (उत्तर चौहद्दी)
                </span>
                <input
                  type="text"
                  placeholder="e.g. 20ft Wide Road / Plot #A02"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                  value={plotForm.boundaries?.north || ''}
                  onChange={(e) =>
                    setPlotForm({
                      ...plotForm,
                      boundaries: { ...(plotForm.boundaries || {}), north: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  South (दक्षिण चौहद्दी)
                </span>
                <input
                  type="text"
                  placeholder="e.g. Plot #A04 / Green Belt"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                  value={plotForm.boundaries?.south || ''}
                  onChange={(e) =>
                    setPlotForm({
                      ...plotForm,
                      boundaries: { ...(plotForm.boundaries || {}), south: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  East (पूरब चौहद्दी)
                </span>
                <input
                  type="text"
                  placeholder="e.g. Plot #A05 / Boundary Wall"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                  value={plotForm.boundaries?.east || ''}
                  onChange={(e) =>
                    setPlotForm({
                      ...plotForm,
                      boundaries: { ...(plotForm.boundaries || {}), east: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                  West (पश्चिम चौहद्दी)
                </span>
                <input
                  type="text"
                  placeholder="e.g. 30ft Main Sector Road"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                  value={plotForm.boundaries?.west || ''}
                  onChange={(e) =>
                    setPlotForm({
                      ...plotForm,
                      boundaries: { ...(plotForm.boundaries || {}), west: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Remarks / Notes (Optional)</label>
            <textarea
              className="w-full min-h-[50px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
              placeholder="Optional notes for this plot..."
              value={plotForm.remarks}
              onChange={(e) => setPlotForm({ ...plotForm, remarks: e.target.value })}
            />
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            type="button"
            className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 rounded-xl font-bold text-xs text-slate-700 transition cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreatePlot}
            disabled={submitLoading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[110px] flex items-center justify-center cursor-pointer"
          >
            {submitLoading ? 'Creating...' : 'Create Plot'}
          </button>
        </div>
      </div>
    </Modalbox>
  );
};

export default CreatePlotModal;
