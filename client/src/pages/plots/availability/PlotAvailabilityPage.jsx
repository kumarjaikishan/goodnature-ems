import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Layers,
  Search,
  MapPin,
  Compass,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import api from '@/api/axios';
import PageLoader from '@/components/common/PageLoader';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    dotCls: 'bg-emerald-500',
    badgeCls: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    tagText: 'text-emerald-700 font-semibold',
  },
  HOLD: {
    label: 'Hold',
    dotCls: 'bg-amber-500',
    badgeCls: 'text-amber-700 bg-amber-50 border border-amber-200',
    tagText: 'text-amber-700 font-semibold',
  },
  BOOKED: {
    label: 'Booked',
    dotCls: 'bg-slate-400',
    badgeCls: 'text-slate-600 bg-slate-100 border border-slate-200',
    tagText: 'text-slate-500 font-medium',
  },
  REGISTERED: {
    label: 'Registered',
    dotCls: 'bg-slate-600',
    badgeCls: 'text-slate-700 bg-slate-100 border border-slate-200',
    tagText: 'text-slate-600 font-medium',
  },
};

const PlotAvailabilityPage = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [plots, setPlots] = useState([]);
  const [rateConfig, setRateConfig] = useState(null);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Plot Details Modal
  const [inspectPlot, setInspectPlot] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, seriesRes, plotsRes, rateRes] = await Promise.all([
        api.get('/plots/projects?unhiddenOnly=true').catch(() => ({ data: { data: [] } })),
        api.get('/plots/series?unhiddenOnly=true').catch(() => ({ data: { data: [] } })),
        api.get('/plots?limit=5000&unhiddenOnly=true').catch(() => ({ data: { data: [] } })),
        api.get('/plots/rate-config').catch(() => ({ data: { data: null } })),
      ]);

      const unhiddenProjects = projRes.data?.data || [];
      const loadedSeries = seriesRes.data?.data || [];
      const unhiddenPlots = (plotsRes.data?.data || []).filter((p) => {
        if (p.isHidden) return false;
        const pId = p.projectId?._id || p.projectId;
        if (pId) {
          const matchProj = unhiddenProjects.find((prj) => String(prj._id) === String(pId));
          if (matchProj && matchProj.isHidden) return false;
        }
        return true;
      });

      setProjects(unhiddenProjects);
      setSeriesList(loadedSeries);
      setPlots(unhiddenPlots);
      if (rateRes.data?.data) {
        setRateConfig(rateRes.data.data);
      }

      if (!selectedProjectId && unhiddenProjects.length > 0) {
        setSelectedProjectId(String(unhiddenProjects[0]._id));
      }
    } catch (err) {
      console.error('Error loading plot availability:', err);
      toast.error('Failed to load plot inventory and availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter plots by project, series, status, and search query
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      // 1. Project Filter
      if (selectedProjectId && selectedProjectId !== 'ALL') {
        const pProjId = String(plot.projectId?._id || plot.projectId || '');
        if (pProjId && pProjId !== String(selectedProjectId)) {
          return false;
        }
        if (!pProjId && plot.seriesId) {
          const s = seriesList.find((item) => String(item._id) === String(plot.seriesId?._id || plot.seriesId));
          const sProjId = String(s?.projectId?._id || s?.projectId || '');
          if (sProjId && sProjId !== String(selectedProjectId)) {
            return false;
          }
        }
      }

      // 2. Series Filter
      if (selectedSeriesId && selectedSeriesId !== 'ALL') {
        if (selectedSeriesId === 'STANDALONE') {
          if (plot.seriesId) return false;
        } else {
          const sId = String(plot.seriesId?._id || plot.seriesId || '');
          if (sId !== String(selectedSeriesId)) return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        if (plot.status !== statusFilter) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pNum = (plot.plotNumber || '').toLowerCase();
        const size = String(plot.plotSize || '');
        if (!pNum.includes(q) && !size.includes(q)) return false;
      }

      return true;
    });
  }, [plots, selectedProjectId, selectedSeriesId, statusFilter, searchQuery, seriesList]);

  // Project-level summary metrics
  const metrics = useMemo(() => {
    const projectPlots = selectedProjectId && selectedProjectId !== 'ALL'
      ? plots.filter((p) => {
          const pProjId = String(p.projectId?._id || p.projectId || '');
          if (pProjId) return pProjId === String(selectedProjectId);
          const s = seriesList.find((item) => String(item._id) === String(p.seriesId?._id || p.seriesId));
          return String(s?.projectId?._id || s?.projectId || '') === String(selectedProjectId);
        })
      : plots;

    const available = projectPlots.filter((p) => p.status === 'AVAILABLE').length;
    const hold = projectPlots.filter((p) => p.status === 'HOLD').length;
    const booked = projectPlots.filter((p) => p.status === 'BOOKED').length;
    const registered = projectPlots.filter((p) => p.status === 'REGISTERED').length;

    return {
      total: projectPlots.length,
      available,
      hold,
      booked,
      registered,
    };
  }, [plots, selectedProjectId, seriesList]);

  // Series available in current project
  const currentProjectSeries = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === 'ALL') {
      return seriesList;
    }
    return seriesList.filter((s) => {
      const pId = String(s.projectId?._id || s.projectId || '');
      return pId === String(selectedProjectId);
    });
  }, [seriesList, selectedProjectId]);

  // Group filtered plots by Series
  const groupedSeriesPlots = useMemo(() => {
    const map = new Map();

    currentProjectSeries.forEach((s) => {
      map.set(String(s._id), { series: s, plots: [] });
    });

    const standalone = [];

    filteredPlots.forEach((p) => {
      const sId = String(p.seriesId?._id || p.seriesId || '');
      if (sId && map.has(sId)) {
        map.get(sId).plots.push(p);
      } else if (!sId) {
        standalone.push(p);
      } else {
        if (!map.has(sId)) {
          const found = seriesList.find((s) => String(s._id) === sId);
          map.set(sId, { series: found || { name: 'Series', prefix: '' }, plots: [p] });
        } else {
          map.get(sId).plots.push(p);
        }
      }
    });

    return {
      seriesGroups: Array.from(map.values()).filter((g) => g.plots.length > 0 || (selectedSeriesId === 'ALL' && !searchQuery)),
      standalonePlots: standalone,
    };
  }, [filteredPlots, currentProjectSeries, seriesList, selectedSeriesId, searchQuery]);

  // Current active project details
  const activeProject = useMemo(() => {
    return projects.find((p) => String(p._id) === String(selectedProjectId)) || null;
  }, [projects, selectedProjectId]);

  if (loading) {
    return (
      <PageLoader
        title="Loading Plot Availability..."
        subtitle="Fetching real-time inventory layout maps and availability"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Plot Availability &amp; Layout Map</h1>
            <p className="text-xs text-slate-500">
              Live inventory layout and availability status.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer self-start sm:self-auto border border-slate-200"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Project Selector */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-500" />
              Project (परियोजना)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedSeriesId('ALL');
              }}
              className="w-full h-9 bg-white border border-slate-300 focus:ring-1 focus:ring-slate-400 outline-none px-3 rounded-lg text-xs font-medium text-slate-800 transition cursor-pointer"
            >
              <option value="ALL">All Projects (समस्त परियोजनाएँ)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.location ? `— ${p.location}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Series Block Selector */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Layers size={13} className="text-slate-500" />
              Series Block
            </label>
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full h-9 bg-white border border-slate-300 focus:ring-1 focus:ring-slate-400 outline-none px-3 rounded-lg text-xs font-medium text-slate-800 transition cursor-pointer"
            >
              <option value="ALL">All Series Blocks</option>
              {currentProjectSeries.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.prefix}{s.startNumber} - {s.prefix}{s.endNumber})
                </option>
              ))}
              <option value="STANDALONE">Standalone Plots</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Search size={13} className="text-slate-500" />
              Search Plot #
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search plot number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-7 bg-white border border-slate-300 focus:ring-1 focus:ring-slate-400 outline-none rounded-lg text-xs text-slate-800 transition"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter Chips (Subtle White / Slate with colored indicator dot) */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          {/* Total */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>All Plots</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {metrics.total}
            </span>
          </button>

          {/* Available */}
          <button
            type="button"
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              statusFilter === 'AVAILABLE'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Available</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${statusFilter === 'AVAILABLE' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {metrics.available}
            </span>
          </button>

          {/* Booked */}
          <button
            type="button"
            onClick={() => setStatusFilter('BOOKED')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              statusFilter === 'BOOKED'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Booked</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${statusFilter === 'BOOKED' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {metrics.booked}
            </span>
          </button>

          {/* Hold */}
          <button
            type="button"
            onClick={() => setStatusFilter('HOLD')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              statusFilter === 'HOLD'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Hold</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${statusFilter === 'HOLD' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {metrics.hold}
            </span>
          </button>

          {/* Registered */}
          <button
            type="button"
            onClick={() => setStatusFilter('REGISTERED')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              statusFilter === 'REGISTERED'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>Registered</span>
            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${statusFilter === 'REGISTERED' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {metrics.registered}
            </span>
          </button>
        </div>
      </div>

      {/* ── Visual Series Grid ──────────────────────────────────────── */}
      <div className="space-y-4">
        {groupedSeriesPlots.seriesGroups.length === 0 && groupedSeriesPlots.standalonePlots.length === 0 && (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-xl space-y-2">
            <Building2 size={28} className="text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Plots Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No plots match your selected filters.
            </p>
          </div>
        )}

        {/* Series Blocks */}
        {groupedSeriesPlots.seriesGroups.map(({ series: s, plots: sPlots }) => {
          if (sPlots.length === 0) return null;

          const blockAvailable = sPlots.filter((p) => p.status === 'AVAILABLE').length;
          const blockBooked = sPlots.filter((p) => p.status === 'BOOKED').length;

          return (
            <div
              key={s._id || s.name}
              className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {s.prefix}-Series Block ({s.name})
                  </span>
                  {s.projectName && (
                    <span className="text-[11px] text-slate-600 bg-slate-100 font-medium px-2 py-0.5 rounded border border-slate-200">
                      {s.projectName}
                    </span>
                  )}
                  {s.plotArea && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      • {s.plotArea} Sq Ft
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{blockAvailable} Available</span>
                  <span>•</span>
                  <span>{blockBooked} Booked</span>
                  <span>•</span>
                  <span>{sPlots.length} Total</span>
                </div>
              </div>

              {/* Grid of Plots - Clean, uniform white card design */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {sPlots.map((plot) => {
                  const cfg = STATUS_CONFIG[plot.status] || STATUS_CONFIG.AVAILABLE;
                  const isAvailable = plot.status === 'AVAILABLE';
                  const isBooked = plot.status === 'BOOKED' || plot.status === 'REGISTERED';
                  const hasCorner = plot.plotType === 'CORNER';

                  return (
                    <div
                      key={plot._id}
                      onClick={() => setInspectPlot(plot)}
                      className={`p-2.5 bg-white border rounded-xl flex flex-col justify-between transition cursor-pointer select-none relative group min-h-[4.25rem] shadow-2xs hover:border-slate-400 ${
                        isBooked ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'border-slate-200 hover:shadow-xs'
                      }`}
                    >
                      {/* Top: Plot Number & Corner badge */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 tracking-tight">
                          {plot.plotNumber}
                        </span>
                        {hasCorner && (
                          <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                            Corner
                          </span>
                        )}
                      </div>

                      {/* Middle: Size */}
                      <div className="my-1">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {plot.plotSize || s.plotArea} sqft
                        </span>
                      </div>

                      {/* Bottom: Minimal Status Pill */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] ${cfg.tagText}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                          <span>{cfg.label}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Standalone Plots */}
        {groupedSeriesPlots.standalonePlots.length > 0 && (
          <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Standalone Plots
              </span>
              <span className="text-xs text-slate-500">
                {groupedSeriesPlots.standalonePlots.length} Plots
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {groupedSeriesPlots.standalonePlots.map((plot) => {
                const cfg = STATUS_CONFIG[plot.status] || STATUS_CONFIG.AVAILABLE;
                const isBooked = plot.status === 'BOOKED' || plot.status === 'REGISTERED';
                const hasCorner = plot.plotType === 'CORNER';

                return (
                  <div
                    key={plot._id}
                    onClick={() => setInspectPlot(plot)}
                    className={`p-2.5 bg-white border rounded-xl flex flex-col justify-between transition cursor-pointer select-none relative group min-h-[4.25rem] shadow-2xs hover:border-slate-400 ${
                      isBooked ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 tracking-tight">
                        {plot.plotNumber}
                      </span>
                      {hasCorner && (
                        <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                          Corner
                        </span>
                      )}
                    </div>

                    <div className="my-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {plot.plotSize} sqft
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] ${cfg.tagText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls}`} />
                        <span>{cfg.label}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Read-Only Plot Specification Modal ──────────────────────── */}
      {inspectPlot && (
        <Modalbox
          open={Boolean(inspectPlot)}
          onClose={() => setInspectPlot(null)}
          size="md"
          title={`Plot ${inspectPlot.plotNumber} Details`}
          subtitle="Plot specifications, boundaries & dimensions"
          footer={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInspectPlot(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            {/* Top Status & Project Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Plot Number
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {inspectPlot.plotNumber}
                </span>
                {inspectPlot.projectName && (
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {inspectPlot.projectName}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    STATUS_CONFIG[inspectPlot.status]?.badgeCls || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[inspectPlot.status]?.dotCls || 'bg-slate-400'}`} />
                  <span>{STATUS_CONFIG[inspectPlot.status]?.label || inspectPlot.status}</span>
                </span>
              </div>
            </div>

            {/* Specifications & Dimensions Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Plot Area
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {inspectPlot.plotSize} Sq Ft
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Plot Type
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {inspectPlot.plotType || 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Dimensions (N/S/E/W) */}
            {inspectPlot.dimensions && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Compass size={13} className="text-slate-500" />
                  Dimensions / पैमाइश (in Feet)
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">North (उ)</span>
                    <span className="font-mono font-bold text-slate-800">{inspectPlot.dimensions.north || 0} ft</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">South (द)</span>
                    <span className="font-mono font-bold text-slate-800">{inspectPlot.dimensions.south || 0} ft</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">East (पू)</span>
                    <span className="font-mono font-bold text-slate-800">{inspectPlot.dimensions.east || 0} ft</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">West (प)</span>
                    <span className="font-mono font-bold text-slate-800">{inspectPlot.dimensions.west || 0} ft</span>
                  </div>
                </div>
              </div>
            )}

            {/* Boundaries (Chaudhi) */}
            {inspectPlot.boundaries && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Boundaries / चौहद्दी
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">North (उत्तर):</span>
                    <span className="text-slate-700 font-medium">{inspectPlot.boundaries.north || 'None'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">South (दक्षिण):</span>
                    <span className="text-slate-700 font-medium">{inspectPlot.boundaries.south || 'None'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">East (पूरब):</span>
                    <span className="text-slate-700 font-medium">{inspectPlot.boundaries.east || 'None'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">West (पश्चिम):</span>
                    <span className="text-slate-700 font-medium">{inspectPlot.boundaries.west || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Heads (PLC) */}
            {Array.isArray(inspectPlot.premiumHeads) && inspectPlot.premiumHeads.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Location Advantages (PLC Heads):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectPlot.premiumHeads.map((head, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                    >
                      <Sparkles size={11} className="text-slate-400" />
                      {head.name} (+{head.extraPercent}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modalbox>
      )}
    </div>
  );
};

export default PlotAvailabilityPage;
