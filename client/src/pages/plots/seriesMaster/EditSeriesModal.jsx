import Modalbox from '../../../components/custommodal/Modalbox';

const EditSeriesModal = ({
  open,
  onClose,
  selectedSeries,
  editForm,
  setEditForm,
  handleUpdateSeries,
  submitLoading,
  inputCls = 'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
}) => {
  return (
    <Modalbox open={open} onClose={onClose}>
      <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] max-h-[85vh] overflow-y-auto space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold text-slate-800">Edit Plot Series: {selectedSeries?.name}</h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleUpdateSeries} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Series Name</label>
            <input
              className={inputCls}
              placeholder="e.g. Block A Elite"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Start Number</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.startNumber}
                onChange={(e) => setEditForm({ ...editForm, startNumber: e.target.value.replace(/[^0-9]/g, '') })}
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
                value={editForm.endNumber}
                onChange={(e) => setEditForm({ ...editForm, endNumber: e.target.value.replace(/[^0-9]/g, '') })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Plot Size (Sq Ft)</label>
              <input
                className={inputCls}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editForm.plotArea}
                onChange={(e) => setEditForm({ ...editForm, plotArea: e.target.value.replace(/[^0-9]/g, '') })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Default Plot Type</label>
              <select
                className={inputCls}
                value={editForm.defaultPlotType}
                onChange={(e) => setEditForm({ ...editForm, defaultPlotType: e.target.value })}
              >
                <option value="NORMAL">Normal (Plain)</option>
                <option value="CORNER">Corner Plot</option>
              </select>
            </div>
          </div>

          {/* Default Dimensions for Series */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                Default Dimensions / पैमाइश (in Feet - N / S / E / W)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">Auto-updates plot area</span>
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
                  value={editForm.defaultDimensions?.north || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(editForm.defaultDimensions || {}), north: val };
                    const n = parseFloat(val) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(nextDims.east) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setEditForm({
                      ...editForm,
                      defaultDimensions: nextDims,
                      plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea,
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
                  value={editForm.defaultDimensions?.south || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(editForm.defaultDimensions || {}), south: val };
                    const n = parseFloat(nextDims.north) || parseFloat(val) || 0;
                    const s = parseFloat(val) || 0;
                    const east = parseFloat(nextDims.east) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setEditForm({
                      ...editForm,
                      defaultDimensions: nextDims,
                      plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea,
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
                  value={editForm.defaultDimensions?.east || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(editForm.defaultDimensions || {}), east: val };
                    const n = parseFloat(nextDims.north) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(val) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setEditForm({
                      ...editForm,
                      defaultDimensions: nextDims,
                      plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea,
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
                  value={editForm.defaultDimensions?.west || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(editForm.defaultDimensions || {}), west: val };
                    const n = parseFloat(nextDims.north) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(nextDims.east) || parseFloat(val) || 0;
                    const w = parseFloat(val) || 0;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setEditForm({
                      ...editForm,
                      defaultDimensions: nextDims,
                      plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Remarks</label>
            <textarea
              className="w-full min-h-[50px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
              value={editForm.remarks}
              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[120px] flex items-center justify-center cursor-pointer"
            >
              {submitLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default EditSeriesModal;
