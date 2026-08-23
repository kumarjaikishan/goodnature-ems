import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import {
  HiPlus,
  HiOutlineWrenchScrewdriver,
  HiOutlineAdjustmentsHorizontal,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineTableCells,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import Modalbox from '../../components/custommodal/Modalbox';
import { CircularProgress } from '@mui/material';

const PlotSeriesMaster = () => {
  const [activeTab, setActiveTab] = useState('layout'); // 'layout' (Blocks & Grid), 'inventory' (Searchable Inventory View), 'rates' (Pricing)
  const [seriesList, setSeriesList] = useState([]);
  const [plots, setPlots] = useState([]);
  const [rateConfig, setRateConfig] = useState({
    baseSqFtRate: 500,
    cornerExtraPercent: 20,
    interestRatePercent: 10.88,
  });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters for the inventory view & layout search
  const [filterSeries, setFilterSeries] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryViewMode, setInventoryViewMode] = useState('cards'); // 'cards' or 'table'
  const itemsPerPage = 48;

  // Modals visibility
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreatePlotModal, setShowCreatePlotModal] = useState(false);

  // New individual plot form
  const [plotForm, setPlotForm] = useState({
    seriesId: '',
    plotNumber: '',
    plotSize: '',
    plotType: 'NORMAL',
    baseRate: '',
    remarks: '',
  });

  // New series form
  const [form, setForm] = useState({
    name: '',
    prefix: '',
    startNumber: '',
    endNumber: '',
    plotArea: '',
    defaultPlotType: 'NORMAL',
    numberFormat: 'A000',
    remarks: '',
  });

  // Edit series form
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    plotArea: '',
    defaultPlotType: 'NORMAL',
    startNumber: '',
    endNumber: '',
    remarks: '',
  });

  // Plot configuration / adjust modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [configForm, setConfigForm] = useState({
    plotSize: '',
    plotType: 'NORMAL',
    baseRate: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seriesRes, rateRes, plotsRes] = await Promise.all([
        api.get('/plots/series'),
        api.get('/plots/rate-config'),
        api.get('/plots?limit=5000'),
      ]);

      setSeriesList(seriesRes.data.data || []);
      if (rateRes.data.data) {
        setRateConfig(rateRes.data.data);
      }
      setPlots(plotsRes.data.data || []);
    } catch {
      toast.error('Failed to load plot series and inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter plots based on active search & dropdowns
  const filteredPlots = plots.filter((p) => {
    if (filterSeries) {
      const sId = p.seriesId?._id || p.seriesId;
      if (filterSeries === 'standalone') {
        if (sId) return false;
      } else if (sId !== filterSeries) {
        return false;
      }
    }
    if (filterStatus && p.status !== filterStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const plotNum = (p.plotNumber || '').toLowerCase();
      const seriesName = (p.seriesId?.name || '').toLowerCase();
      const remarks = (p.remarks || '').toLowerCase();
      if (!plotNum.includes(q) && !seriesName.includes(q) && !remarks.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Pagination for inventory view
  const totalInventoryPages = Math.ceil(filteredPlots.length / itemsPerPage) || 1;
  const paginatedPlots = filteredPlots.slice((inventoryPage - 1) * itemsPerPage, inventoryPage * itemsPerPage);

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/plots/series', form);
      toast.success('Plot series registered & plots generated successfully');
      setShowModal(false);
      setForm({
        name: '',
        prefix: '',
        startNumber: '',
        endNumber: '',
        plotArea: '',
        defaultPlotType: 'NORMAL',
        numberFormat: 'A000',
        remarks: '',
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create series');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openCreatePlot = (preselectedSeriesId = '') => {
    const selectedS = seriesList.find((s) => s._id === preselectedSeriesId);

    // Auto-compute next suggested plot number if a series was selected
    let suggestedPlotNo = '';
    if (selectedS) {
      const existingInSeries = plots.filter((p) => (p.seriesId?._id || p.seriesId) === selectedS._id);
      const nextSeq =
        existingInSeries.length > 0
          ? Math.max(...existingInSeries.map((p) => p.sequenceNumber || 0)) + 1
          : selectedS.endNumber + 1;

      const match = selectedS.numberFormat?.match(/0+/);
      if (match) {
        const paddedNum = String(nextSeq).padStart(match[0].length, '0');
        suggestedPlotNo = `${selectedS.prefix}${paddedNum}`;
      } else {
        suggestedPlotNo = `${selectedS.prefix}${nextSeq}`;
      }
    }

    setPlotForm({
      seriesId: preselectedSeriesId || '',
      plotNumber: suggestedPlotNo,
      plotSize: selectedS?.plotArea || 1200,
      plotType: selectedS?.defaultPlotType || 'NORMAL',
      baseRate: rateConfig?.baseSqFtRate || 500,
      remarks: '',
    });
    setShowCreatePlotModal(true);
  };

  const handleSeriesChangeInPlotForm = (seriesId) => {
    const selectedS = seriesList.find((s) => s._id === seriesId);
    let suggestedPlotNo = '';
    if (selectedS) {
      const existingInSeries = plots.filter((p) => (p.seriesId?._id || p.seriesId) === selectedS._id);
      const nextSeq =
        existingInSeries.length > 0
          ? Math.max(...existingInSeries.map((p) => p.sequenceNumber || 0)) + 1
          : selectedS.endNumber + 1;

      const match = selectedS.numberFormat?.match(/0+/);
      if (match) {
        const paddedNum = String(nextSeq).padStart(match[0].length, '0');
        suggestedPlotNo = `${selectedS.prefix}${paddedNum}`;
      } else {
        suggestedPlotNo = `${selectedS.prefix}${nextSeq}`;
      }
    }

    setPlotForm({
      ...plotForm,
      seriesId,
      plotNumber: suggestedPlotNo || plotForm.plotNumber,
      plotSize: selectedS?.plotArea || plotForm.plotSize,
      plotType: selectedS?.defaultPlotType || plotForm.plotType,
    });
  };

  const handleCreatePlot = async (e) => {
    e.preventDefault();
    if (!plotForm.plotNumber || !plotForm.plotSize) {
      toast.warn('Please enter Plot Number and Plot Size');
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post('/plots', {
        ...plotForm,
        seriesId: plotForm.seriesId || undefined,
      });
      toast.success(`Plot "${plotForm.plotNumber.toUpperCase()}" created successfully!`);
      setShowCreatePlotModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create plot');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditSeries = (series) => {
    setSelectedSeries(series);
    setEditForm({
      name: series.name,
      plotArea: series.plotArea,
      defaultPlotType: series.defaultPlotType,
      startNumber: series.startNumber,
      endNumber: series.endNumber,
      remarks: series.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSeries = async (e) => {
    e.preventDefault();
    if (!selectedSeries) return;
    setSubmitLoading(true);
    try {
      await api.put(`/plots/series/${selectedSeries._id}`, editForm);
      toast.success('Series updated & plots synced');
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update series');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSeries = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this series? Associated plots will also be removed if not booked.'
      )
    ) {
      return;
    }
    try {
      await api.delete(`/plots/series/${id}`);
      toast.success('Series deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete series');
    }
  };

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.put('/plots/rate-config', rateConfig);
      toast.success('Global rates updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update rates');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openConfigPlot = (plot) => {
    setSelectedPlot(plot);
    setConfigForm({
      plotSize: plot.plotSize,
      plotType: plot.plotType,
      baseRate: plot.baseRate,
      remarks: plot.remarks || '',
    });
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;
    setSubmitLoading(true);
    try {
      await api.put(`/plots/${selectedPlot._id}`, configForm);
      toast.success('Plot properties updated successfully');
      setShowConfigModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plot');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getLiveEffectiveRate = () => {
    const base = Number(configForm.baseRate || rateConfig.baseSqFtRate || 500);
    const cornerExtra = configForm.plotType === 'CORNER' ? rateConfig.cornerExtraPercent || 20 : 0;
    return Math.round(base * (1 + cornerExtra / 100));
  };

  const getLiveTotalValue = () => {
    const size = Number(configForm.plotSize || selectedPlot?.plotSize || 1200);
    return size * getLiveEffectiveRate();
  };

  const getPlotCardColor = (status, isCorner = false) => {
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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-3">
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        <p className="text-xs font-bold text-slate-500 animate-pulse">Loading Plot Series & Inventory...</p>
      </div>
    );
  }

  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
  const inputCls =
    'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition';

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <HiOutlineSquares2X2 className="w-6 h-6" />
            </span>
            Plot Series & Inventory Master
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Configure series blocks, manage real-time inventory maps, adjust plot properties, and set global rates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openCreatePlot()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <HiPlus className="w-4 h-4" /> Create Plot
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <HiPlus className="w-4 h-4" /> Create Series Block
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('layout')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'layout'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Series Blocks & Layout Grid
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'rates'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Global Pricing & Corner Rates
        </button>
      </div>

      {/* Global Filter Bar for Layout & Inventory Tabs */}
      {activeTab !== 'rates' && (
        <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Series Filter */}
            <select
              value={filterSeries}
              onChange={(e) => {
                setFilterSeries(e.target.value);
                setInventoryPage(1);
              }}
              className={`${inputCls} w-full sm:w-52`}
            >
              <option value="">All Series Blocks ({plots.length} plots)</option>
              {seriesList.map((s) => {
                const count = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id).length;
                return (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.prefix}) — {count} plots
                  </option>
                );
              })}
              {plots.some((p) => !p.seriesId) && (
                <option value="standalone">Standalone Plots ({plots.filter((p) => !p.seriesId).length})</option>
              )}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setInventoryPage(1);
              }}
              className={`${inputCls} w-full sm:w-44`}
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="HOLD">Hold</option>
              <option value="BOOKED">Booked</option>
              <option value="REGISTERED">Registered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {(filterSeries || filterStatus || searchTerm) && (
              <button
                onClick={() => {
                  setFilterSeries('');
                  setFilterStatus('');
                  setSearchTerm('');
                  setInventoryPage(1);
                }}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer px-1"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search plot # or series..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setInventoryPage(1);
                }}
                className={`${inputCls} w-full pl-9`}
              />
              <HiOutlineMagnifyingGlass className="absolute left-3 top-3 text-slate-400 text-base" />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: SERIES BLOCKS & LAYOUT GRID ── */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          {/* Series Master Summary Table */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Series Configuration Blocks</h3>
                <p className="text-xs text-slate-500 mt-0.5">Master templates defining prefix, range, and standard sizing.</p>
              </div>
              <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
                Total Series: {seriesList.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 select-none text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    {['Series Name', 'Prefix', 'Plot Range', 'Default Area', 'Default Type', 'Format', 'Remarks', 'Actions'].map((h) => (
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
                        No plot series defined yet. Click "Create Series Block" to get started.
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
                              onClick={() => openEditSeries(s)}
                              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl transition cursor-pointer"
                              title="Edit Series"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSeries(s._id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer"
                              title="Delete Series"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
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
                        onClick={() => openCreatePlot(s._id)}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Add plot to this series"
                      >
                        <HiPlus className="w-3.5 h-3.5" /> Add Plot
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
                        const isNonStandardSize = p.plotSize && p.plotSize !== s.plotArea;
                        const colorCls = getPlotCardColor(p.status, isCorner);

                        return (
                          <div
                            key={p._id}
                            onClick={() => openConfigPlot(p)}
                            className={`p-3 border rounded-2xl flex flex-col justify-between transition cursor-pointer select-none relative group h-20 shadow-2xs hover:scale-103 ${colorCls}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black tracking-wider text-slate-900">{p.plotNumber}</span>
                              {isCorner && (
                                <span className="text-[0.55rem] bg-teal-800 text-white font-extrabold px-1.5 py-0.5 rounded leading-none">
                                  CORNER
                                </span>
                              )}
                              {!isCorner && isNonStandardSize && (
                                <span className="text-[0.55rem] bg-slate-200 text-slate-700 font-bold px-1 rounded leading-none">
                                  {p.plotSize}sf
                                </span>
                              )}
                            </div>

                            <div className="my-auto">
                              <p className="text-[0.72rem] font-black leading-none font-mono text-slate-800">
                                ₹{Number(p.totalPlotValue || 0).toLocaleString('en-IN')}
                              </p>
                            </div>

                            <div className="flex justify-between items-center border-t border-black/5 pt-1">
                              <span className="text-[0.6rem] font-bold uppercase tracking-wider opacity-90">
                                {isAvailable ? 'Available' : p.status}
                              </span>
                              <HiOutlinePencilSquare className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
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
                      const colorCls = getPlotCardColor(p.status, isCorner);

                      return (
                        <div
                          key={p._id}
                          onClick={() => openConfigPlot(p)}
                          className={`p-3 border rounded-2xl flex flex-col justify-between transition cursor-pointer select-none relative group h-20 shadow-2xs hover:scale-103 ${colorCls}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black tracking-wider text-slate-900">{p.plotNumber}</span>
                            {isCorner ? (
                              <span className="text-[0.55rem] bg-teal-800 text-white font-extrabold px-1.5 py-0.5 rounded leading-none">
                                CORNER
                              </span>
                            ) : (
                              <span className="text-[0.55rem] bg-slate-200 text-slate-700 font-bold px-1 rounded leading-none">
                                {p.plotSize}sf
                              </span>
                            )}
                          </div>

                          <div className="my-auto">
                            <p className="text-[0.72rem] font-black leading-none font-mono text-slate-800">
                              ₹{Number(p.totalPlotValue || 0).toLocaleString('en-IN')}
                            </p>
                          </div>

                          <div className="flex justify-between items-center border-t border-black/5 pt-1">
                            <span className="text-[0.6rem] font-bold uppercase tracking-wider opacity-90">
                              {isAvailable ? 'Available' : p.status}
                            </span>
                            <HiOutlinePencilSquare className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: GLOBAL PRICING & CORNER RATES ── */}
      {activeTab === 'rates' && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 max-w-xl">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineWrenchScrewdriver className="w-5 h-5 text-teal-800" /> Global Pricing & Corner Rates
          </h3>
          <form onSubmit={handleUpdateRates} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Base Sq Ft Rate (₹)</label>
              <input
                className={inputCls}
                type="number"
                value={rateConfig.baseSqFtRate}
                onChange={(e) => setRateConfig({ ...rateConfig, baseSqFtRate: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Corner Plot Extra Rate Increment (%)</label>
              <input
                className={inputCls}
                type="number"
                value={rateConfig.cornerExtraPercent}
                onChange={(e) => setRateConfig({ ...rateConfig, cornerExtraPercent: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Refund / Settlement Rate (% P.A.)</label>
              <input
                className={inputCls}
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={rateConfig.interestRatePercent ?? 10.88}
                onChange={(e) => setRateConfig({ ...rateConfig, interestRatePercent: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-400">Used for Plot Refund & Settlement Calculator calculations.</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs cursor-pointer transition min-w-[120px] flex items-center justify-center shadow-xs"
              >
                {submitLoading ? 'Saving...' : 'Save Rates'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: CREATE PLOT SERIES BLOCK ── */}
      <Modalbox open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[550px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Create Plot Series</h3>
            <button
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateSeries} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
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
                  type="number"
                  min="1"
                  value={form.startNumber}
                  onChange={(e) => setForm({ ...form, startNumber: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>End Number</label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={form.endNumber}
                  onChange={(e) => setForm({ ...form, endNumber: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Size (Sq Ft)</label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={form.plotArea}
                  onChange={(e) => setForm({ ...form, plotArea: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Default Plot Type</label>
                <select
                  className={inputCls}
                  value={form.defaultPlotType}
                  onChange={(e) => setForm({ ...form, defaultPlotType: e.target.value })}
                >
                  <option value="NORMAL">Normal (Plain)</option>
                  <option value="CORNER">Corner Plot</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks</label>
              <textarea
                className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[100px] flex items-center justify-center cursor-pointer"
              >
                {submitLoading ? 'Generating...' : 'Generate Plots'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* ── MODAL: EDIT PLOT SERIES ── */}
      <Modalbox open={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Edit Plot Series: {selectedSeries?.name}</h3>
            <button
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setShowEditModal(false)}
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
                  type="number"
                  min="1"
                  value={editForm.startNumber}
                  onChange={(e) => setEditForm({ ...editForm, startNumber: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>End Number</label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={editForm.endNumber}
                  onChange={(e) => setEditForm({ ...editForm, endNumber: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Size (Sq Ft)</label>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  value={editForm.plotArea}
                  onChange={(e) => setEditForm({ ...editForm, plotArea: e.target.value })}
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
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks</label>
              <textarea
                className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
                onClick={() => setShowEditModal(false)}
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

      {/* ── MODAL: CONFIGURE & ADJUST INDIVIDUAL PLOT ── */}
      <Modalbox open={showConfigModal} onClose={() => setShowConfigModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <HiOutlineAdjustmentsHorizontal className="text-teal-800 text-xl" />
              <h3 className="text-base font-bold">Configure Plot {selectedPlot?.plotNumber}</h3>
            </div>
            <button
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setShowConfigModal(false)}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4">
            {selectedPlot && (selectedPlot.status === 'BOOKED' || selectedPlot.status === 'REGISTERED') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                <strong>Notice:</strong> Plot is currently <strong>{selectedPlot.status}</strong>. Dimensions, corner type, and base rates are locked to preserve customer agreements and payment schedules. You can still update internal audit notes.
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Corner Type Configuration</label>
              <select
                className={`${inputCls} ${selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED' ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                value={configForm.plotType}
                disabled={selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED'}
                onChange={e => setConfigForm({ ...configForm, plotType: e.target.value })}
              >
                <option value="NORMAL">Normal / Plain (No Extra Charge)</option>
                <option value="CORNER">Corner Plot (+{rateConfig.cornerExtraPercent || 20}% Extra Rate)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Size (Sq Ft)</label>
                <input
                  className={`${inputCls} ${selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED' ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                  type="number"
                  disabled={selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED'}
                  value={configForm.plotSize}
                  onChange={e => setConfigForm({ ...configForm, plotSize: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Base Rate (₹ / Sq Ft)</label>
                <input
                  className={`${inputCls} ${selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED' ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                  type="number"
                  disabled={selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED'}
                  value={configForm.baseRate}
                  onChange={e => setConfigForm({ ...configForm, baseRate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Calculated dynamic value preview card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-slate-500 uppercase font-semibold">Effective Sq Ft Rate:</span>
                <span className="font-bold text-slate-800">₹{getLiveEffectiveRate()} / Sq Ft</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                <span className="text-slate-500 uppercase font-semibold">Computed Plot Value:</span>
                <span className="text-teal-800 text-base font-bold">
                  ₹{getLiveTotalValue().toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Internal Audit Notes / Remarks</label>
              <textarea
                className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
                placeholder="Reason for corner/rate customization..."
                value={configForm.remarks}
                onChange={(e) => setConfigForm({ ...configForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
                onClick={() => setShowConfigModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 font-bold text-xs text-white rounded-xl shadow-xs transition min-w-[120px] flex items-center justify-center cursor-pointer"
              >
                {submitLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* ── MODAL: CREATE INDIVIDUAL PLOT ── */}
      <Modalbox open={showCreatePlotModal} onClose={() => setShowCreatePlotModal(false)}>
        <div className="bg-white rounded-2xl w-[92vw] max-w-lg p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                +
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-800">Create Plot</h3>
                <p className="text-xs text-slate-500">Add an individual plot to any existing series block</p>
              </div>
            </div>
            <button
              className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer transition p-1"
              onClick={() => setShowCreatePlotModal(false)}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreatePlot} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Series Block (Optional)</label>
              <select
                className={inputCls}
                value={plotForm.seriesId}
                onChange={(e) => handleSeriesChangeInPlotForm(e.target.value)}
              >
                <option value="">None / Standalone Plot</option>
                {seriesList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (Prefix: {s.prefix})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Number *</label>
                <input
                  className={inputCls}
                  type="text"
                  placeholder="e.g. A025 or B101"
                  value={plotForm.plotNumber}
                  onChange={(e) => setPlotForm({ ...plotForm, plotNumber: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Corner Type</label>
                <select
                  className={inputCls}
                  value={plotForm.plotType}
                  onChange={(e) => setPlotForm({ ...plotForm, plotType: e.target.value })}
                >
                  <option value="NORMAL">Normal Plot</option>
                  <option value="CORNER">Corner Plot (+{rateConfig.cornerExtraPercent || 20}%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Size (Sq Ft) *</label>
                <input
                  className={inputCls}
                  type="number"
                  placeholder="1200"
                  value={plotForm.plotSize}
                  onChange={(e) => setPlotForm({ ...plotForm, plotSize: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Base Rate (₹ / Sq Ft)</label>
                <input
                  className={inputCls}
                  type="number"
                  value={plotForm.baseRate}
                  onChange={(e) => setPlotForm({ ...plotForm, baseRate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Calculated dynamic value preview card */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Effective Rate:</span>
                <span className="font-bold text-slate-800">
                  ₹
                  {Math.round(
                    Number(plotForm.baseRate || 500) *
                      (plotForm.plotType === 'CORNER' ? 1 + (rateConfig.cornerExtraPercent || 20) / 100 : 1)
                  )}{' '}
                  / Sq Ft
                </span>
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 pt-1.5 font-bold text-sm">
                <span className="text-slate-700">Estimated Value:</span>
                <span className="text-emerald-700 text-base font-bold">
                  ₹
                  {Math.round(
                    Number(plotForm.plotSize || 0) *
                      (Number(plotForm.baseRate || 500) *
                        (plotForm.plotType === 'CORNER' ? 1 + (rateConfig.cornerExtraPercent || 20) / 100 : 1))
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks / Notes (Optional)</label>
              <textarea
                className="w-full min-h-[55px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
                placeholder="Optional notes for this plot..."
                value={plotForm.remarks}
                onChange={(e) => setPlotForm({ ...plotForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-600 transition cursor-pointer"
                onClick={() => setShowCreatePlotModal(false)}
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
    </div>
  );
};

export default PlotSeriesMaster;
