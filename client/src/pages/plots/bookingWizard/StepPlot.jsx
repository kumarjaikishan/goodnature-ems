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
                <span className="text-xs bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 rounded-md font-bold">
                  Plots: {seriesPlots.length}
                </span>
              </div>

              {seriesPlots.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No plots generated for this series.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {seriesPlots.map((p) => {
                    const isAvailable = p.status === 'AVAILABLE';
                    const isCorner = p.plotType === 'CORNER';
                    const isHold = p.status === 'HOLD';
                    const isBooked = p.status === 'BOOKED' || p.status === 'REGISTERED';
                    const isSelected = form.plotId === p._id;

                    let colorCls = '';
                    if (isSelected) {
                      colorCls = 'bg-teal-700 border-teal-800 text-white shadow-xs ring-2 ring-teal-600/20';
                    } else if (isHold) {
                      colorCls = 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100';
                    } else if (isBooked) {
                      colorCls = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';
                    } else {
                      colorCls = 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100';
                    }

                    return (
                      <button
                        type="button"
                        key={p._id}
                        disabled={isBooked}
                        onClick={() => {
                          if (isAvailable) {
                            handlePlotSelect(p._id);
                          } else {
                            toast.error(`Plot ${p.plotNumber} is already ${p.status.toLowerCase()}`);
                          }
                        }}
                        className={`p-2 border rounded-xl flex flex-col justify-between transition cursor-pointer select-none h-12 ${colorCls}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold tracking-wider">{p.plotNumber}</span>
                          {isCorner && (
                            <span
                              className={`text-[0.6rem] font-bold px-1 rounded ${
                                isSelected ? 'bg-white text-teal-800' : 'bg-teal-700 text-white'
                              }`}
                            >
                              CORNER
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-end w-full">
                          <span
                            className={`text-[0.6rem] uppercase font-semibold ${
                              isSelected ? 'text-teal-100' : 'opacity-80'
                            }`}
                          >
                            {isSelected ? 'Selected' : isAvailable ? 'Available' : p.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <Button variant="secondary" size="md" onClick={prevStep} startIcon={ChevronLeft}>
          Back
        </Button>
        <Button variant="primary" size="md" onClick={nextStep} endIcon={ChevronRight}>
          Next: Payment Details
        </Button>
      </div>
    </div>
  );
};
