import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

export const StepPlot = ({
  prevStep,
  nextStep,
  selectedPlot,
  seriesList,
  plots,
  form,
  handlePlotSelect,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800">2. Select Plot</h3>
          {selectedPlot && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Selected: Plot #{selectedPlot.plotNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prevStep} startIcon={ChevronLeft}>
            Back
          </Button>
          <Button variant="primary" size="sm" onClick={nextStep} endIcon={ChevronRight}>
            Next: Payment Details
          </Button>
        </div>
      </div>

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
        {seriesList.map((s) => {
          const seriesPlots = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id);
          return (
            <div key={s._id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 tracking-tight uppercase">
                  {s.prefix}-Plot Series ({s.name})
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {seriesPlots.filter((p) => p.status === 'AVAILABLE').length} Available
                </span>
              </div>

              {seriesPlots.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {seriesPlots.map((plot) => {
                    const isSelected = form.plotId === plot._id;
                    const isAvail = plot.status === 'AVAILABLE';
                    const isHold = plot.status === 'HOLD';
                    const isBooked = ['BOOKED', 'SOLD', 'REGISTRY_DONE'].includes(plot.status);

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
        })}
      </div>
    </div>
  );
};
