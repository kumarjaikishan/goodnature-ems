import Modalbox from '../../../components/custommodal/Modalbox';

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
  return (
    <Modalbox open={open} onClose={onClose}>
      <div className="p-6 bg-white rounded-2xl w-[520px] max-w-[90vw] space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Add Individual Plot</h3>
            <p className="text-xs text-slate-400">Add a plot directly to a series block or standalone.</p>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleCreatePlot} className="flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Plot Type</label>
              <select
                className={inputCls}
                value={plotForm.plotType}
                onChange={(e) => setPlotForm({ ...plotForm, plotType: e.target.value })}
              >
                <option value="NORMAL">Normal (Plain)</option>
                <option value="CORNER">Corner Plot (+{rateConfig.cornerExtraPercent || 20}%)</option>
              </select>
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
                  placeholder="e.g. 30"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.north || ''}
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
                  placeholder="e.g. 30"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.south || ''}
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
                  placeholder="e.g. 40"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.east || ''}
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
                  placeholder="e.g. 40"
                  className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2 rounded-lg text-xs font-bold"
                  value={plotForm.dimensions?.west || ''}
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

          <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[110px] flex items-center justify-center cursor-pointer"
            >
              {submitLoading ? 'Creating...' : 'Create Plot'}
            </button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default CreatePlotModal;
