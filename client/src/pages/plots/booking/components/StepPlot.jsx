import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Layers, Building2, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

export const StepPlot = ({
  prevStep,
  nextStep,
  selectedPlot,
  seriesList = [],
  plots = [],
  projects = [],
  selectedProjectId = '',
  setSelectedProjectId,
  form,
  handlePlotSelect,
}) => {
  // Current active project
  const currentProject = projects.find((p) => String(p._id) === String(selectedProjectId));

  // Filter series based on selected project (only when a project is selected)
  const filteredSeries = useMemo(() => {
    if (!selectedProjectId) return [];
    return seriesList.filter((s) => {
      const pId = s.projectId?._id || s.projectId;
      return pId && String(pId) === String(selectedProjectId);
    });
  }, [seriesList, selectedProjectId]);

  // Standalone plots (plots without series) filtered by selected project
  const standalonePlots = useMemo(() => {
    if (!selectedProjectId) return [];
    return plots.filter((p) => {
      const sId = p.seriesId?._id || p.seriesId;
      if (sId) return false;
      const pId = p.projectId?._id || p.projectId;
      return pId && String(pId) === String(selectedProjectId);
    });
  }, [plots, selectedProjectId]);

  // Total available plots in current filtered view
  const availableCount = useMemo(() => {
    if (!selectedProjectId) return 0;
    let count = 0;
    filteredSeries.forEach((s) => {
      const sPlots = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id);
      count += sPlots.filter((p) => p.status === 'AVAILABLE').length;
    });
    count += standalonePlots.filter((p) => p.status === 'AVAILABLE').length;
    return count;
  }, [filteredSeries, standalonePlots, plots, selectedProjectId]);

  const handleNextClick = () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    if (!selectedPlot) {
      toast.error('Please choose an available plot first');
      return;
    }
    nextStep();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800">2. Select Plot</h3>
          {selectedPlot && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-700" />
              Selected: Plot #{selectedPlot.plotNumber} {selectedPlot.projectName ? `(${selectedPlot.projectName})` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevStep} startIcon={ChevronLeft}>
            Back
          </Button>
          <Button variant="primary" size="sm" onClick={handleNextClick} endIcon={ChevronRight}>
            Next: Payment Details
          </Button>
        </div>
      </div>

      {/* ── PROJECT SELECTION SECTION ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Project / प्रोजेक्ट
              </h4>
              {selectedProjectId && currentProject && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-full">
                  {currentProject.code || 'Active'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {selectedProjectId && currentProject
                ? `Showing plots for ${currentProject.name} (${availableCount} available)`
                : 'Select a project to load and view its plot inventory'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:w-80">
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId?.(e.target.value)}
            className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-600 transition cursor-pointer"
          >
            <option value="">-- Select Project / प्रोजेक्ट चुनें --</option>
            {projects.map((proj) => (
              <option key={proj._id} value={proj._id}>
                {proj.name} {proj.code ? `(${proj.code})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CONDITIONAL DISPLAY: NO PROJECT SELECTED ── */}
      {!selectedProjectId ? (
        <div className="bg-white border border-dashed border-slate-300 p-12 rounded-2xl text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 mb-3">
            <Building2 size={28} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Please Select a Project</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Select a project from the dropdown above to view its available plots and series.
          </p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 border border-slate-200 p-3.5 rounded-xl bg-slate-50">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded-sm" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-amber-100 border border-amber-300 rounded-sm" /> Hold
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm opacity-60" /> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 bg-teal-700 rounded-sm" /> Selected
            </span>
          </div>

          {/* Plot Series Maps */}
          <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-1">
            {filteredSeries.length > 0 ? (
              filteredSeries.map((s) => {
                const seriesPlots = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id);
                return (
                  <div key={s._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                          {s.prefix}-Plot Series ({s.name})
                        </span>
                        {s.projectName && (
                          <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            {s.projectName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {seriesPlots.filter((p) => p.status === 'AVAILABLE').length} Available
                      </span>
                    </div>

                    {seriesPlots.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {seriesPlots.map((plot) => {
                          const isSelected = selectedPlot?._id === plot._id || form?.plotId === plot._id;
                          const isAvail = plot.status === 'AVAILABLE';
                          const isHold = plot.status === 'HOLD';

                          let bgClass = 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed';
                          if (isAvail) {
                            bgClass = 'bg-white border-emerald-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer shadow-2xs';
                          } else if (isHold) {
                            bgClass = 'bg-amber-50 border-amber-300 text-amber-900 cursor-not-allowed';
                          }

                          if (isSelected) {
                            bgClass = 'bg-teal-700 border-teal-800 text-white font-bold ring-2 ring-teal-500/50 shadow-sm';
                          }

                          return (
                            <button
                              key={plot._id}
                              type="button"
                              onClick={() => {
                                if (isAvail) {
                                  handlePlotSelect(plot._id);
                                } else {
                                  toast.error(`Plot #${plot.plotNumber} is currently ${plot.status}`);
                                }
                              }}
                              disabled={!isAvail}
                              className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition ${bgClass}`}
                            >
                              <span className="text-xs font-bold leading-none">#{plot.plotNumber}</span>
                              <span className="text-[9px] mt-1 opacity-80">{plot.plotSize} sqft</span>
                              {plot.plotType === 'CORNER' && (
                                <span
                                  className={`text-[8px] px-1 rounded-sm mt-0.5 font-bold uppercase ${
                                    isSelected ? 'bg-teal-800 text-teal-100' : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  Corner
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No plots added in this series yet.</p>
                    )}
                  </div>
                );
              })
            ) : null}

            {/* Standalone Plots (if any) */}
            {standalonePlots.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                    Standalone Plots (No Series)
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {standalonePlots.filter((p) => p.status === 'AVAILABLE').length} Available
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {standalonePlots.map((plot) => {
                    const isSelected = selectedPlot?._id === plot._id || form?.plotId === plot._id;
                    const isAvail = plot.status === 'AVAILABLE';

                    let bgClass = 'bg-slate-100 border-slate-300 text-slate-400 opacity-60 cursor-not-allowed';
                    if (isAvail) {
                      bgClass = 'bg-white border-emerald-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer shadow-2xs';
                    }
                    if (isSelected) {
                      bgClass = 'bg-teal-700 border-teal-800 text-white font-bold ring-2 ring-teal-500/50 shadow-sm';
                    }

                    return (
                      <button
                        key={plot._id}
                        type="button"
                        onClick={() => {
                          if (isAvail) {
                            handlePlotSelect(plot._id);
                          } else {
                            toast.error(`Plot #${plot.plotNumber} is currently ${plot.status}`);
                          }
                        }}
                        disabled={!isAvail}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition ${bgClass}`}
                      >
                        <span className="text-xs font-bold leading-none">#{plot.plotNumber}</span>
                        <span className="text-[9px] mt-1 opacity-80">{plot.plotSize} sqft</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State when selected project has no plots/series */}
            {filteredSeries.length === 0 && standalonePlots.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 p-10 rounded-2xl text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                  <Building2 size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No plots found in {currentProject?.name || 'this project'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  No series or plots are assigned to this project yet. Please configure plots under this project in Plot Series Master.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-1">
        <Button variant="secondary" size="sm" onClick={prevStep} startIcon={ChevronLeft}>
          Back
        </Button>
        <Button variant="primary" size="sm" onClick={handleNextClick} endIcon={ChevronRight}>
          Next: Payment Details
        </Button>
      </div>
    </div>
  );
};
