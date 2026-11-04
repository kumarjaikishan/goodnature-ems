import { Eye, EyeOff } from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';

const CreateSeriesModal = ({
  open,
  onClose,
  form,
  setForm,
  projects = [],
  handleCreateSeries,
  submitLoading,
  inputCls = 'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
}) => {
  const updateDimensionsAndArea = (key, val) => {
    const nextDims = { ...(form.defaultDimensions || {}), [key]: val };
    const n = parseFloat(key === 'north' ? val : nextDims.north) || 0;
    const s = parseFloat(key === 'south' ? val : (nextDims.south || n)) || 0;
    const e = parseFloat(key === 'east' ? val : nextDims.east) || 0;
    const w = parseFloat(key === 'west' ? val : (nextDims.west || e)) || 0;

    let autoArea = '';
    if (n > 0 && e > 0) {
      const avgLength = (n + (s || n)) / 2;
      const avgWidth = (e + (w || e)) / 2;
      const area = Math.round(avgLength * avgWidth);
      if (area > 0) autoArea = String(area);
    }

    setForm({
      ...form,
      defaultDimensions: nextDims,
      plotArea: autoArea,
    });
  };

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      size="xl"
      title="Create Plot Series"
      subtitle="Bulk generate sequentially numbered plots with dimension specifications."
      footer={
        <>
          <button
            type="button"
            className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 rounded-xl font-bold text-xs text-slate-700 transition cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateSeries}
            disabled={submitLoading || !form.plotArea}
            className="px-5 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-300 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[120px] flex items-center justify-center cursor-pointer"
          >
            {submitLoading ? 'Generating...' : 'Generate Plots'}
          </button>
        </>
      }
    >
      <form onSubmit={handleCreateSeries} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-2">
              <label className={labelCls}>Project (प्रोजेक्ट)</label>
              <select
                className={inputCls}
                value={form.projectId || ''}
                onChange={(e) => {
                  const sel = projects.find((p) => p._id === e.target.value);
                  setForm({
                    ...form,
                    projectId: e.target.value,
                    projectName: sel ? sel.name : '',
                  });
                }}
              >
                <option value="">-- No Project / General --</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className={labelCls}>Series Name</label>
              <input
                className={inputCls}
                placeholder="e.g. Block A Elite"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Prefix Code</label>
              <input
                className={inputCls}
                placeholder="e.g. A"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Number Format</label>
              <select
                className={inputCls}
                value={form.numberFormat}
                onChange={(e) => setForm({ ...form, numberFormat: e.target.value })}
              >
                <option value="A0">A1, A2...</option>
                <option value="A00">A01, A02...</option>
                <option value="A000">A001, A002...</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Start Number</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 1"
                value={form.startNumber}
                onChange={(e) => setForm({ ...form, startNumber: e.target.value.replace(/[^0-9]/g, '') })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>End Number</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 50"
                value={form.endNumber}
                onChange={(e) => setForm({ ...form, endNumber: e.target.value.replace(/[^0-9]/g, '') })}
                required
              />
            </div>
          </div>

          {/* Dimensions (N/S/E/W) - Auto Calculates Area */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                Plot Dimensions / पैमाइश (in Feet - N / S / E / W)
              </label>
              <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">
                Auto-calculates Plot Size
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-1">
                  North (उत्तर)
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-9 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl text-xs font-bold text-slate-800"
                  value={form.defaultDimensions?.north !== undefined ? form.defaultDimensions.north : 0}
                  onChange={(e) => updateDimensionsAndArea('north', e.target.value)}
                  required
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-1">
                  South (दक्षिण)
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-9 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl text-xs font-bold text-slate-800"
                  value={form.defaultDimensions?.south !== undefined ? form.defaultDimensions.south : 0}
                  onChange={(e) => updateDimensionsAndArea('south', e.target.value)}
                  required
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-1">
                  East (पूरब)
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-9 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl text-xs font-bold text-slate-800"
                  value={form.defaultDimensions?.east !== undefined ? form.defaultDimensions.east : 0}
                  onChange={(e) => updateDimensionsAndArea('east', e.target.value)}
                  required
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-600 block mb-1">
                  West (पश्चिम)
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-full h-9 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-2.5 rounded-xl text-xs font-bold text-slate-800"
                  value={form.defaultDimensions?.west !== undefined ? form.defaultDimensions.west : 0}
                  onChange={(e) => updateDimensionsAndArea('west', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Auto-Calculated Plot Size (Sq Ft) Display */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Calculated Plot Size (Sq Ft)</label>
              <span className="text-[10px] text-slate-400 font-medium">Calculated as (North+South)/2 × (East+West)/2</span>
            </div>
            <input
              className={`${inputCls} w-full bg-slate-100/90 text-slate-900 font-bold cursor-not-allowed border-slate-200 select-none`}
              placeholder="Enter dimensions above to calculate plot size"
              value={form.plotArea ? `${form.plotArea} Sq Ft` : ''}
              readOnly
            />
          </div>

                    {/* Series Block Visibility Toggle Card */}
          <div
            onClick={() => setForm((prev) => ({ ...prev, isHidden: !prev.isHidden }))}
            className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
              form.isHidden
                ? 'bg-amber-50/90 border-amber-300 shadow-xs ring-1 ring-amber-300/60'
                : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  form.isHidden
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {form.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Plot Block Visibility</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      form.isHidden
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {form.isHidden ? 'Hidden (छुपा हुआ)' : 'Visible (दृश्यमान)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {form.isHidden
                    ? 'All plots in this block will be hidden from bookings & BA/BP availability'
                    : 'All plots in this block are visible across bookings & availability maps'}
                </p>
              </div>
            </div>

            {/* Styled Toggle Pill */}
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                form.isHidden ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                  form.isHidden ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Remarks (Optional)</label>
            <textarea
              className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
              placeholder="e.g. Standard residential series block"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
      </form>
    </Modalbox>
  );
};

export default CreateSeriesModal;
