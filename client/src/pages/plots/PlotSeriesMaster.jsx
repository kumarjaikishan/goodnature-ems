import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import {
  Plus,
  Wrench,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Search,
  LayoutGrid,
  Table,
  Sparkles,
} from 'lucide-react';
import Modalbox from '../../components/custommodal/Modalbox';
import PageLoader from '../../components/common/PageLoader';

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
    dimensions: { north: '', south: '', east: '', west: '' },
    boundaries: { north: '', south: '', east: '', west: '' },
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
    defaultDimensions: { north: '', south: '', east: '', west: '' },
    defaultBoundaries: { north: '', south: '', east: '', west: '' },
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
    defaultDimensions: { north: '', south: '', east: '', west: '' },
    defaultBoundaries: { north: '', south: '', east: '', west: '' },
    remarks: '',
  });

  // Plot configuration / adjust modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [configForm, setConfigForm] = useState({
    plotSize: '',
    plotType: 'NORMAL',
    dimensions: { north: '', south: '', east: '', west: '' },
    boundaries: { north: '', south: '', east: '', west: '' },
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
        defaultDimensions: { north: '', south: '', east: '', west: '' },
        defaultBoundaries: { north: '', south: '', east: '', west: '' },
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
      dimensions: {
        north: selectedS?.defaultDimensions?.north || '',
        south: selectedS?.defaultDimensions?.south || '',
        east: selectedS?.defaultDimensions?.east || '',
        west: selectedS?.defaultDimensions?.west || '',
      },
      boundaries: {
        north: selectedS?.defaultBoundaries?.north || '',
        south: selectedS?.defaultBoundaries?.south || '',
        east: selectedS?.defaultBoundaries?.east || '',
        west: selectedS?.defaultBoundaries?.west || '',
      },
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
      dimensions: {
        north: selectedS?.defaultDimensions?.north || plotForm.dimensions.north,
        south: selectedS?.defaultDimensions?.south || plotForm.dimensions.south,
        east: selectedS?.defaultDimensions?.east || plotForm.dimensions.east,
        west: selectedS?.defaultDimensions?.west || plotForm.dimensions.west,
      },
      boundaries: {
        north: selectedS?.defaultBoundaries?.north || plotForm.boundaries.north,
        south: selectedS?.defaultBoundaries?.south || plotForm.boundaries.south,
        east: selectedS?.defaultBoundaries?.east || plotForm.boundaries.east,
        west: selectedS?.defaultBoundaries?.west || plotForm.boundaries.west,
      },
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
        dimensions: {
          north: Number(plotForm.dimensions.north) || 0,
          south: Number(plotForm.dimensions.south) || 0,
          east: Number(plotForm.dimensions.east) || 0,
          west: Number(plotForm.dimensions.west) || 0,
        },
        boundaries: {
          north: plotForm.boundaries.north || '',
          south: plotForm.boundaries.south || '',
          east: plotForm.boundaries.east || '',
          west: plotForm.boundaries.west || '',
        },
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
      defaultDimensions: {
        north: series.defaultDimensions?.north || '',
        south: series.defaultDimensions?.south || '',
        east: series.defaultDimensions?.east || '',
        west: series.defaultDimensions?.west || '',
      },
      defaultBoundaries: {
        north: series.defaultBoundaries?.north || '',
        south: series.defaultBoundaries?.south || '',
        east: series.defaultBoundaries?.east || '',
        west: series.defaultBoundaries?.west || '',
      },
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

  const handleSlabChange = (index, field, value) => {
    const updatedSlabs = [...(rateConfig.rateSlabs || [])];
    updatedSlabs[index] = {
      ...updatedSlabs[index],
      [field]: field === 'effectiveLabel' ? value : value,
    };
    if (field === 'tenureMonths') {
      const tenure = Number(value) || 0;
      if (tenure === 0) {
        updatedSlabs[index].downpaymentPercent = 100;
        updatedSlabs[index].emiPercent = 0;
      } else if (updatedSlabs[index].downpaymentPercent === 100) {
        updatedSlabs[index].downpaymentPercent = 40;
        updatedSlabs[index].emiPercent = 60;
      }
    }
    setRateConfig({ ...rateConfig, rateSlabs: updatedSlabs });
  };

  const handleAddSlab = () => {
    const currentSlabs = rateConfig.rateSlabs || [];
    const lastSlab = currentSlabs[currentSlabs.length - 1];
    const newTenure = lastSlab ? (Number(lastSlab.tenureMonths) || 0) + 3 : 3;
    const newRate = lastSlab ? (Number(lastSlab.plotRate) || 1000) + 50 : 1050;
    const newPromoter = lastSlab ? +((Number(lastSlab.promoterCommissionPercent) || 10) + 0.5).toFixed(2) : 10.5;

    const newSlab = {
      tenureMonths: newTenure,
      plotRate: newRate,
      promoterCommissionPercent: newPromoter,
      developerCommissionPercent: 2.0,
      downpaymentPercent: 40,
      emiPercent: 60,
      effectiveLabel: lastSlab?.effectiveLabel || 'Jul 26 - Sept 26',
    };

    setRateConfig({ ...rateConfig, rateSlabs: [...currentSlabs, newSlab] });
  };

  const handleRemoveSlab = (index) => {
    const updatedSlabs = (rateConfig.rateSlabs || []).filter((_, i) => i !== index);
    setRateConfig({ ...rateConfig, rateSlabs: updatedSlabs });
  };

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        ...rateConfig,
        baseSqFtRate: Number(rateConfig.baseSqFtRate) || 1000,
        cornerExtraPercent: Number(rateConfig.cornerExtraPercent) || 20,
        interestRatePercent: Number(rateConfig.interestRatePercent) || 10.88,
        rateSlabs: (rateConfig.rateSlabs || []).map((s) => ({
          ...s,
          tenureMonths: Number(s.tenureMonths) || 0,
          plotRate: Number(s.plotRate) || 0,
          promoterCommissionPercent: Number(s.promoterCommissionPercent) || 0,
          developerCommissionPercent: Number(s.developerCommissionPercent) || 0,
          downpaymentPercent: Number(s.downpaymentPercent) || (Number(s.tenureMonths) === 0 ? 100 : 40),
          emiPercent: Number(s.emiPercent) ?? (Number(s.tenureMonths) === 0 ? 0 : 60),
        })),
      };
      await api.put('/plots/rate-config', payload);
      toast.success('Global rates & commission matrix updated successfully');
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
      dimensions: {
        north: plot.dimensions?.north || '',
        south: plot.dimensions?.south || '',
        east: plot.dimensions?.east || '',
        west: plot.dimensions?.west || '',
      },
      boundaries: {
        north: plot.boundaries?.north || '',
        south: plot.boundaries?.south || '',
        east: plot.boundaries?.east || '',
        west: plot.boundaries?.west || '',
      },
      remarks: plot.remarks || '',
    });
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;
    setSubmitLoading(true);
    try {
      await api.put(`/plots/${selectedPlot._id}`, {
        ...configForm,
        dimensions: {
          north: Number(configForm.dimensions.north) || 0,
          south: Number(configForm.dimensions.south) || 0,
          east: Number(configForm.dimensions.east) || 0,
          west: Number(configForm.dimensions.west) || 0,
        },
        boundaries: {
          north: configForm.boundaries.north || '',
          south: configForm.boundaries.south || '',
          east: configForm.boundaries.east || '',
          west: configForm.boundaries.west || '',
        },
      });
      toast.success('Plot properties updated successfully');
      setShowConfigModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plot');
    } finally {
      setSubmitLoading(false);
    }
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
      <PageLoader
        title="Loading Plot Series & Inventory..."
        subtitle="Synchronizing series blocks, layout grid and rate matrix"
      />
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
              <LayoutGrid size={22} />
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
            <Plus size={16} /> Create Plot
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Create Series Block
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
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
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
                              <Edit2 size={16} />
                            </button>
                            <button
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
                              <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
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
                            <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
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

      {/* ── TAB 2: GLOBAL PRICING & SPONSOR COMMISSION MATRIX ── */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <form onSubmit={handleUpdateRates} className="space-y-6">
            {/* Top Config Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <SlidersHorizontal size={18} className="text-teal-700" />
                  <span>Corner Plot Premium</span>
                </div>
                <div>
                  <label className={labelCls}>Corner Plot Extra Increment (%)</label>
                  <input
                    className={inputCls}
                    type="tel"
                    inputMode="decimal"
                    value={rateConfig.cornerExtraPercent ?? ''}
                    onChange={(e) =>
                      setRateConfig({
                        ...rateConfig,
                        cornerExtraPercent: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'),
                      })
                    }
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Extra percentage added on corner plots.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Sparkles size={18} className="text-amber-600" />
                  <span>Refund / Settlement Rate</span>
                </div>
                <div>
                  <label className={labelCls}>Settlement Annual Rate (% P.A.)</label>
                  <input
                    className={inputCls}
                    type="tel"
                    inputMode="decimal"
                    value={rateConfig.interestRatePercent ?? ''}
                    onChange={(e) =>
                      setRateConfig({
                        ...rateConfig,
                        interestRatePercent: e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'),
                      })
                    }
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Used in plot refund & settlement calculations.</p>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Table size={18} className="text-teal-700" />
                    Tenure, Plot Rate & Sponsor Commission Matrix
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Schedule for plot selling rates, promoter commission, business developer override, and 40% downpayment / 60% EMI breakdown.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddSlab}
                    className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Add Tenure Slab
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                  >
                    {submitLoading ? 'Saving...' : 'Save All Matrix Rates'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[0.68rem] font-bold">
                      <th className="p-3">Period / Label</th>
                      <th className="p-3">ईएमआई महीना में<br/><span className="text-slate-400 font-normal">EMI Months</span></th>
                      <th className="p-3">बिक्री दर (₹/sqft)<br/><span className="text-slate-400 font-normal">Plot Rate</span></th>
                      <th className="p-3 bg-blue-50/50 text-blue-900">प्रमोटर कमीशन (%)<br/><span className="text-blue-500 font-normal">Promoter Commission</span></th>
                      <th className="p-3 bg-amber-50/50 text-amber-900">बिजनेस डेवलपर्स कमीशन (%)<br/><span className="text-amber-600 font-normal">Developer Override</span></th>
                      <th className="p-3">Downpayment %</th>
                      <th className="p-3">EMI Balance %</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(rateConfig.rateSlabs || []).map((slab, idx) => {
                      const isOneTime = Number(slab.tenureMonths) === 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <input
                              type="text"
                              className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                              value={slab.effectiveLabel || ''}
                              placeholder="e.g. Jul 26"
                              onChange={(e) => handleSlabChange(idx, 'effectiveLabel', e.target.value)}
                            />
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                                value={slab.tenureMonths ?? ''}
                                onChange={(e) => handleSlabChange(idx, 'tenureMonths', e.target.value.replace(/[^0-9]/g, ''))}
                                required
                              />
                              <span className="text-[11px] text-slate-400">{isOneTime ? '(1-Time)' : 'Mo'}</span>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-bold">₹</span>
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-900"
                                value={slab.plotRate ?? ''}
                                onChange={(e) => handleSlabChange(idx, 'plotRate', e.target.value.replace(/[^0-9]/g, ''))}
                                required
                              />
                            </div>
                          </td>

                          <td className="p-3 bg-blue-50/30">
                            <div className="flex items-center gap-1">
                              <input
                                type="tel"
                                inputMode="decimal"
                                className="w-20 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-800"
                                value={slab.promoterCommissionPercent ?? ''}
                                onChange={(e) => handleSlabChange(idx, 'promoterCommissionPercent', e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'))}
                                required
                              />
                              <span className="font-bold text-blue-700">%</span>
                            </div>
                          </td>

                          <td className="p-3 bg-amber-50/30">
                            <div className="flex items-center gap-1">
                              <input
                                type="tel"
                                inputMode="decimal"
                                className="w-20 px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-800"
                                value={slab.developerCommissionPercent ?? ''}
                                onChange={(e) => handleSlabChange(idx, 'developerCommissionPercent', e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1'))}
                                required
                              />
                              <span className="font-bold text-amber-700">%</span>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isOneTime ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                              {slab.downpaymentPercent || (isOneTime ? 100 : 40)}%
                            </span>
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                              {slab.emiPercent ?? (isOneTime ? 0 : 60)}%
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSlab(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete slab row"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span><strong>Developer Sponsor Direct:</strong> gets Promoter % + Developer Override (e.g. 10% + 2% = 12%).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                  <span><strong>Sub-Sponsor:</strong> gets Promoter % (e.g. 10.5%), and parent Developer Sponsor gets 2%.</span>
                </div>
              </div>
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
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                  value={form.endNumber}
                  onChange={(e) => setForm({ ...form, endNumber: e.target.value.replace(/[^0-9]/g, '') })}
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
                  placeholder="Auto-calculated or enter manually"
                  value={form.plotArea}
                  onChange={(e) => setForm({ ...form, plotArea: e.target.value.replace(/[^0-9]/g, '') })}
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
                    value={form.defaultDimensions.north}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextDims = { ...form.defaultDimensions, north: val };
                      const n = parseFloat(val) || 0;
                      const s = parseFloat(nextDims.south) || n;
                      const east = parseFloat(nextDims.east) || 0;
                      const w = parseFloat(nextDims.west) || east;
                      const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                      setForm({
                        ...form,
                        defaultDimensions: nextDims,
                        plotArea: autoArea > 0 ? String(autoArea) : form.plotArea
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
                    value={form.defaultDimensions.south}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextDims = { ...form.defaultDimensions, south: val };
                      const n = parseFloat(nextDims.north) || parseFloat(val) || 0;
                      const s = parseFloat(val) || 0;
                      const east = parseFloat(nextDims.east) || 0;
                      const w = parseFloat(nextDims.west) || east;
                      const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                      setForm({
                        ...form,
                        defaultDimensions: nextDims,
                        plotArea: autoArea > 0 ? String(autoArea) : form.plotArea
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
                    value={form.defaultDimensions.east}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextDims = { ...form.defaultDimensions, east: val };
                      const n = parseFloat(nextDims.north) || 0;
                      const s = parseFloat(nextDims.south) || n;
                      const east = parseFloat(val) || 0;
                      const w = parseFloat(nextDims.west) || east;
                      const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                      setForm({
                        ...form,
                        defaultDimensions: nextDims,
                        plotArea: autoArea > 0 ? String(autoArea) : form.plotArea
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
                    value={form.defaultDimensions.west}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextDims = { ...form.defaultDimensions, west: val };
                      const n = parseFloat(nextDims.north) || 0;
                      const s = parseFloat(nextDims.south) || n;
                      const east = parseFloat(nextDims.east) || parseFloat(val) || 0;
                      const w = parseFloat(val) || 0;
                      const autoArea = Math.round(((n + s) / 2) * ((east + w) / 2));
                      setForm({
                        ...form,
                        defaultDimensions: nextDims,
                        plotArea: autoArea > 0 ? String(autoArea) : form.plotArea
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
                    value={form.defaultBoundaries.north}
                    onChange={(e) => setForm({ ...form, defaultBoundaries: { ...form.defaultBoundaries, north: e.target.value } })}
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
                    value={form.defaultBoundaries.south}
                    onChange={(e) => setForm({ ...form, defaultBoundaries: { ...form.defaultBoundaries, south: e.target.value } })}
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
                    value={form.defaultBoundaries.east}
                    onChange={(e) => setForm({ ...form, defaultBoundaries: { ...form.defaultBoundaries, east: e.target.value } })}
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
                    value={form.defaultBoundaries.west}
                    onChange={(e) => setForm({ ...form, defaultBoundaries: { ...form.defaultBoundaries, west: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks</label>
              <textarea
                className="w-full min-h-[50px] bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
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
                        plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea
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
                        plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea
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
                        plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea
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
                        plotArea: autoArea > 0 ? String(autoArea) : editForm.plotArea
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Default Boundaries / Chaudhi for Series */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                Default Boundaries / चौहद्दी (Surroundings)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                    North (उत्तर चौहद्दी)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Road / Plot Boundary"
                    className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                    value={editForm.defaultBoundaries?.north || ''}
                    onChange={(e) => setEditForm({ ...editForm, defaultBoundaries: { ...(editForm.defaultBoundaries || {}), north: e.target.value } })}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                    South (दक्षिण चौहद्दी)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Road / Adjacent Plot"
                    className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                    value={editForm.defaultBoundaries?.south || ''}
                    onChange={(e) => setEditForm({ ...editForm, defaultBoundaries: { ...(editForm.defaultBoundaries || {}), south: e.target.value } })}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                    East (पूरब चौहद्दी)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Pathway / Boundary Wall"
                    className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                    value={editForm.defaultBoundaries?.east || ''}
                    onChange={(e) => setEditForm({ ...editForm, defaultBoundaries: { ...(editForm.defaultBoundaries || {}), east: e.target.value } })}
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5 leading-tight">
                    West (पश्चिम चौहद्दी)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Main Sector Road"
                    className="w-full h-8 bg-white border border-slate-300 focus:ring-1 focus:ring-teal-600 outline-none px-2.5 rounded-lg text-xs font-medium"
                    value={editForm.defaultBoundaries?.west || ''}
                    onChange={(e) => setEditForm({ ...editForm, defaultBoundaries: { ...(editForm.defaultBoundaries || {}), west: e.target.value } })}
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
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <SlidersHorizontal className="text-teal-800" size={20} />
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

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Plot Size (Sq Ft)</label>
              <input
                className={`${inputCls} ${selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED' ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={selectedPlot?.status === 'BOOKED' || selectedPlot?.status === 'REGISTERED'}
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
                        plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize
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
                        plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize
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
                        plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize
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
                        plotSize: autoArea > 0 ? String(autoArea) : configForm.plotSize
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
                    onChange={(e) => setConfigForm({ ...configForm, boundaries: { ...(configForm.boundaries || {}), north: e.target.value } })}
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
                    onChange={(e) => setConfigForm({ ...configForm, boundaries: { ...(configForm.boundaries || {}), south: e.target.value } })}
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
                    onChange={(e) => setConfigForm({ ...configForm, boundaries: { ...(configForm.boundaries || {}), east: e.target.value } })}
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
                    onChange={(e) => setConfigForm({ ...configForm, boundaries: { ...(configForm.boundaries || {}), west: e.target.value } })}
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
                onClick={() => setShowConfigModal(false)}
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

      {/* ── MODAL: CREATE INDIVIDUAL STANDALONE / EXTRA PLOT ── */}
      <Modalbox open={showCreatePlotModal} onClose={() => setShowCreatePlotModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[520px] max-w-[90vw] space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Add Individual Plot</h3>
              <p className="text-xs text-slate-400">Add a plot directly to a series block or standalone.</p>
            </div>
            <button
              className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition"
              onClick={() => setShowCreatePlotModal(false)}
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
                        plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize
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
                        plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize
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
                        plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize
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
                        plotSize: autoArea > 0 ? String(autoArea) : plotForm.plotSize
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
                    onChange={(e) => setPlotForm({ ...plotForm, boundaries: { ...(plotForm.boundaries || {}), north: e.target.value } })}
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
                    onChange={(e) => setPlotForm({ ...plotForm, boundaries: { ...(plotForm.boundaries || {}), south: e.target.value } })}
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
                    onChange={(e) => setPlotForm({ ...plotForm, boundaries: { ...(plotForm.boundaries || {}), east: e.target.value } })}
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
                    onChange={(e) => setPlotForm({ ...plotForm, boundaries: { ...(plotForm.boundaries || {}), west: e.target.value } })}
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
