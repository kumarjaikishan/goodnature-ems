import { Edit2, Trash2, Plus } from 'lucide-react';

const getPlotCardColor = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-200 text-emerald-800';
    case 'HOLD':
      return 'bg-amber-50 hover:bg-amber-100/90 border-amber-200 text-amber-800';
    case 'BOOKED':
      return 'bg-rose-50 border-rose-200 text-rose-700 opacity-80';
    case 'REGISTERED':
      return 'bg-purple-50 border-purple-200 text-purple-700 opacity-80';
    case 'CANCELLED':
      return 'bg-slate-100 border-slate-200 text-slate-500';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-600';
  }
};

const SeriesLayoutGrid = ({
  seriesList = [],
  filteredPlots = [],
  plots = [],
  filterSeries = '',
  rateConfig = {},
  openEditSeries,
  handleDeleteSeries,
  openCreatePlot,
  openConfigPlot,
}) => {
  return (
    <div className="space-y-6">
      {/* Series Master Summary Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Series Configuration Blocks</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Master templates defining prefix, range, and standard sizing.
            </p>
          </div>
          <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
            Total Series: {seriesList.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 select-none text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                {[
                  'Series Name',
                  'Prefix',
                  'Plot Range',
                  'Default Area',
                  'Default Type',
                  'Format',
                  'Remarks',
                  'Actions',
                ].map((h) => (
                  <th key={h} className="p-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seriesList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 italic font-medium">
                    No plot series defined yet. Click &quot;Create Series Block&quot; to get started.
                  </td>
                </tr>
              ) : (
                seriesList.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-800 text-sm">{s.name}</td>
                    <td className="p-3.5 font-bold text-teal-800 tracking-wider">{s.prefix}</td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {s.startNumber} - {s.endNumber}
                    </td>
                    <td className="p-3.5 text-slate-800 font-bold">{s.plotArea} Sq Ft</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {s.defaultPlotType}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{s.numberFormat}</td>
                    <td className="p-3.5 text-slate-500 italic max-w-xs truncate">{s.remarks || '-'}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditSeries(s)}
                          className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl transition cursor-pointer"
                          title="Edit Series"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSeries(s._id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer"
                          title="Delete Series"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual block layouts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-base font-bold text-slate-800">Visual Series Grid & Interactive Plot Maps</h3>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Hold
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Registered
            </span>
          </div>
        </div>

        {seriesList.map((s) => {
          const seriesPlots = filteredPlots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id);
          if (filterSeries && filterSeries !== s._id) return null;

          return (
            <div key={s._id} className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-4">
              {/* Series Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {s.prefix}-Series Block ({s.name})
                  </span>
                  <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-lg font-bold">
                    {s.plotArea} Sq Ft
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-mono font-semibold">
                    Plots: {s.startNumber} – {s.endNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCreatePlot(s._id)}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Add plot to this series"
                  >
                    <Plus size={14} /> Add Plot
                  </button>
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                    Plots: {seriesPlots.length}
                  </span>
                </div>
              </div>

              {/* Grid of plots */}
              {seriesPlots.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No matching plots found in this series block.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                  {seriesPlots.map((p) => {
                    const isAvailable = p.status === 'AVAILABLE';
                    const isCorner = p.plotType === 'CORNER';
                    const colorCls = getPlotCardColor(p.status);
                    const firstSrc = p.activeBooking?.landSourcing?.[0];
                    const srcLabel = firstSrc
                      ? firstSrc.sourceType === 'REGISTRY_DEED'
                        ? `Deed #${firstSrc.deedNumber || ''}`
                        : `Agr #${firstSrc.agreementNumber || ''}`
                      : null;

                    return (
                      <div
                        key={p._id}
                        onClick={() => openConfigPlot(p)}
                        className={`p-2 border rounded-2xl flex flex-col justify-between transition cursor-pointer select-none relative group min-h-[5rem] shadow-2xs hover:scale-103 ${colorCls}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black tracking-wider text-slate-900">{p.plotNumber}</span>
                          {isCorner && (
                            <span className="text-[0.55rem] bg-teal-800 text-white font-extrabold px-1.5 py-0.5 rounded leading-none">
                              CORNER
                            </span>
                          )}
                        </div>

                        <div className="my-0.5">
                          <p className="text-[0.72rem] font-bold leading-none font-mono text-slate-700">
                            {p.plotSize || s.plotArea} <span className="text-[0.6rem] font-medium text-slate-500">Sq Ft</span>
                          </p>
                          {p.activeBooking?.customerName && (
                            <p className="text-[0.62rem] font-semibold text-rose-800 truncate mt-0.5 leading-tight" title={p.activeBooking.customerName}>
                              {p.activeBooking.customerName}
                            </p>
                          )}
                          {srcLabel && (
                            <span className="inline-block text-[0.58rem] font-bold px-1 py-0.2 rounded bg-white/80 border border-teal-300 text-teal-900 truncate max-w-full mt-0.5">
                              {srcLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center border-t border-black/5 pt-1">
                          <span className="text-[0.58rem] font-bold uppercase tracking-wider opacity-90">
                            {isAvailable ? 'Available' : p.status}
                          </span>
                          <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Standalone Plots */}
        {plots.some((p) => !p.seriesId) && (!filterSeries || filterSeries === 'standalone') && (
          <div className="bg-white border border-slate-200 shadow-xs p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Standalone / Custom Plots
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg font-bold">
                  Custom Dimensions
                </span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-bold">
                Plots: {filteredPlots.filter((p) => !p.seriesId).length}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {filteredPlots
                .filter((p) => !p.seriesId)
                .map((p) => {
                  const isAvailable = p.status === 'AVAILABLE';
                  const isCorner = p.plotType === 'CORNER';
                  const colorCls = getPlotCardColor(p.status);
                  const firstSrc = p.activeBooking?.landSourcing?.[0];
                  const srcLabel = firstSrc
                    ? firstSrc.sourceType === 'REGISTRY_DEED'
                      ? `Deed #${firstSrc.deedNumber || ''}`
                      : `Agr #${firstSrc.agreementNumber || ''}`
                    : null;

                  return (
                    <div
                      key={p._id}
                      onClick={() => openConfigPlot(p)}
                      className={`p-2 border rounded-2xl flex flex-col justify-between transition cursor-pointer select-none relative group min-h-[5rem] shadow-2xs hover:scale-103 ${colorCls}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black tracking-wider text-slate-900">{p.plotNumber}</span>
                        {isCorner && (
                          <span className="text-[0.55rem] bg-teal-800 text-white font-extrabold px-1.5 py-0.5 rounded leading-none">
                            CORNER
                          </span>
                        )}
                      </div>

                      <div className="my-0.5">
                        <p className="text-[0.72rem] font-bold leading-none font-mono text-slate-700">
                          {p.plotSize || 0} <span className="text-[0.6rem] font-medium text-slate-500">Sq Ft</span>
                        </p>
                        {p.activeBooking?.customerName && (
                          <p className="text-[0.62rem] font-semibold text-rose-800 truncate mt-0.5 leading-tight" title={p.activeBooking.customerName}>
                            {p.activeBooking.customerName}
                          </p>
                        )}
                        {srcLabel && (
                          <span className="inline-block text-[0.58rem] font-bold px-1 py-0.2 rounded bg-white/80 border border-teal-300 text-teal-900 truncate max-w-full mt-0.5">
                            {srcLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-black/5 pt-1">
                        <span className="text-[0.58rem] font-bold uppercase tracking-wider opacity-90">
                          {isAvailable ? 'Available' : p.status}
                        </span>
                        <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesLayoutGrid;
