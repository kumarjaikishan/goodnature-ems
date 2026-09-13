import { Link } from 'react-router-dom';
import { SlidersHorizontal, Building2, FileText, ExternalLink } from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';

const ConfigurePlotModal = ({
  open,
  onClose,
  selectedPlot,
  configForm,
  setConfigForm,
  handleConfigSubmit,
  rateConfig = {},
  submitLoading,
  inputCls = 'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
}) => {
  const isLocked = selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED';

  return (
    <Modalbox open={open} onClose={onClose}>
      <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <SlidersHorizontal className="text-teal-800" size={20} />
            <h3 className="text-base font-bold">Configure Plot {selectedPlot?.plotNumber}</h3>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4">
          {selectedPlot && isLocked && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                <strong>Notice:</strong> Plot is currently <strong>{selectedPlot.status}</strong>. Dimensions, corner type, and base rates are locked to preserve customer agreements and payment schedules.
              </div>

              {/* Land Sourcing & Customer Information Card */}
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-teal-900">
                    <Building2 size={16} className="text-teal-700" />
                    <span>Land Acquisition &amp; Agreement Details</span>
                  </div>
                  {selectedPlot.activeBooking?._id && (
                    <Link
                      to={`/dashboard/plots/booking/${selectedPlot.activeBooking._id}`}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Full Booking <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                {selectedPlot.activeBooking && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-teal-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Customer</span>
                      <span className="font-bold text-slate-900">{selectedPlot.activeBooking.customerName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Booking #</span>
                      <span className="font-mono font-bold text-teal-800">{selectedPlot.activeBooking.bookingNumber || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {/* Linked Kisan Agreements or Registry Deeds */}
                {selectedPlot.activeBooking?.landSourcing && selectedPlot.activeBooking.landSourcing.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">
                      Linked Land Documents ({selectedPlot.activeBooking.landSourcing.length})
                    </span>
                    {selectedPlot.activeBooking.landSourcing.map((src, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-teal-200/80 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="flex items-center gap-1">
                            <FileText size={13} className="text-teal-700" />
                            {src.sourceType === 'REGISTRY_DEED' ? (
                              <>Registry Deed #{src.deedNumber || 'N/A'}</>
                            ) : (
                              <>Agreement #{src.agreementNumber || 'N/A'}</>
                            )}
                          </span>
                          <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded font-bold">
                            {src.allocatedSqFt || 0} SqFt ({src.allocatedDismil || 0} Dismil)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span>Mauja: <strong className="text-slate-700">{src.mauja || '-'}</strong></span>
                          <span>Khata/Khesra: <strong className="text-slate-700">{src.khataNumber || '-'}/{src.khesraNumber || '-'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    No specific land acquisition deed or agreement linked yet.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Corner Type Configuration</label>
            <select
              className={`${inputCls} ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
              value={configForm.plotType}
              disabled={isLocked}
              onChange={(e) => setConfigForm({ ...configForm, plotType: e.target.value })}
            >
              <option value="NORMAL">Normal / Plain (No Extra Charge)</option>
              <option value="CORNER">Corner Plot (+{rateConfig.cornerExtraPercent || 20}% Extra Rate)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Plot Size (Sq Ft)</label>
            <input
              className={`${inputCls} ${isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={isLocked}
              value={configForm.plotSize}
              onChange={(e) => setConfigForm({ ...configForm, plotSize: e.target.value.replace(/[^0-9]/g, '') })}
              required
            />
          </div>

          {/* Plot Dimensions (N/S/E/W) */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                Plot Dimensions / पैमाइश (in Feet - N / S / E / W)
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
                  value={configForm.dimensions?.north || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(configForm.dimensions || {}), north: val };
                    const n = parseFloat(val) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(nextDims.east) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setConfigForm({
                      ...configForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize,
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
                  value={configForm.dimensions?.south || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(configForm.dimensions || {}), south: val };
                    const n = parseFloat(nextDims.north) || parseFloat(val) || 0;
                    const s = parseFloat(val) || 0;
                    const east = parseFloat(nextDims.east) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setConfigForm({
                      ...configForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize,
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
                  value={configForm.dimensions?.east || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(configForm.dimensions || {}), east: val };
                    const n = parseFloat(nextDims.north) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(val) || 0;
                    const w = parseFloat(nextDims.west) || east;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setConfigForm({
                      ...configForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize,
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
                  value={configForm.dimensions?.west || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextDims = { ...(configForm.dimensions || {}), west: val };
                    const n = parseFloat(nextDims.north) || 0;
                    const s = parseFloat(nextDims.south) || n;
                    const east = parseFloat(nextDims.east) || parseFloat(val) || 0;
                    const w = parseFloat(val) || 0;
                    const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                    setConfigForm({
                      ...configForm,
                      dimensions: nextDims,
                      plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Plot Boundaries / Chaudhi */}
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
                  value={configForm.boundaries?.north || ''}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      boundaries: { ...(configForm.boundaries || {}), north: e.target.value },
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
                  value={configForm.boundaries?.south || ''}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      boundaries: { ...(configForm.boundaries || {}), south: e.target.value },
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
                  value={configForm.boundaries?.east || ''}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      boundaries: { ...(configForm.boundaries || {}), east: e.target.value },
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
                  value={configForm.boundaries?.west || ''}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      boundaries: { ...(configForm.boundaries || {}), west: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Internal Audit Notes / Remarks</label>
            <textarea
              className="w-full min-h-[50px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
              placeholder="Optional notes for this plot..."
              value={configForm.remarks}
              onChange={(e) => setConfigForm({ ...configForm, remarks: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[100px] flex items-center justify-center cursor-pointer"
            >
              {submitLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Plot Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default ConfigurePlotModal;
