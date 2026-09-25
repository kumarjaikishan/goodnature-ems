import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import { Plus, LayoutGrid, Award, SlidersHorizontal } from 'lucide-react';
import PageLoader from '../../../components/common/PageLoader';

// Modular Subcomponents
import SeriesFilterBar from './components/SeriesFilterBar';
import SeriesLayoutGrid from './components/SeriesLayoutGrid';
import CommissionPolicyMatrix from './components/CommissionPolicyMatrix';
import TenurePlotRatesMatrix from './components/TenurePlotRatesMatrix';
import CreateSeriesModal from './components/CreateSeriesModal';
import EditSeriesModal from './components/EditSeriesModal';
import ConfigurePlotModal from './components/ConfigurePlotModal';
import CreatePlotModal from './components/CreatePlotModal';

const PlotSeriesMaster = () => {
  // Navigation Tabs: 'layout', 'commissions', 'rates'
  const [activeTab, setActiveTab] = useState('layout');
  const [seriesList, setSeriesList] = useState([]);
  const [plots, setPlots] = useState([]);
  const [rateConfig, setRateConfig] = useState({
    baseSqFtRate: 500,
    cornerExtraPercent: 20,
    premiumHeads: [],
    interestRatePercent: 10.88,
    dpGracePeriodDays: 15,
    emiGracePeriodDays: 15,
    lateFineGraceDays: 15,
    lateFineFrequency: 'YEARLY',
    lateFineRate: 24,
    lateFineDailyPercent: 24 / 365,
    rateSlabs: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters for layout & inventory view
  const [filterSeries, setFilterSeries] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setInventoryPage] = useState(1);

  // Modals visibility & selected records
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreatePlotModal, setShowCreatePlotModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    prefix: '',
    startNumber: '',
    endNumber: '',
    plotArea: '',
    defaultPlotType: 'NORMAL',
    defaultPremiumHeads: [],
    numberFormat: 'A000',
    defaultDimensions: { north: 0, south: 0, east: 0, west: 0 },
    remarks: '',
    gracePeriodDays: 15,
    lateFineDailyPercent: 0.05,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    plotArea: '',
    defaultPlotType: 'NORMAL',
    defaultPremiumHeads: [],
    startNumber: '',
    endNumber: '',
    defaultDimensions: { north: 0, south: 0, east: 0, west: 0 },
    remarks: '',
    gracePeriodDays: 15,
    lateFineDailyPercent: 0.05,
  });

  const [plotForm, setPlotForm] = useState({
    seriesId: '',
    plotNumber: '',
    plotSize: '',
    plotType: 'NORMAL',
    premiumHeads: [],
    dimensions: { north: 0, south: 0, east: 0, west: 0 },
    boundaries: { north: '', south: '', east: '', west: '' },
    remarks: '',
  });

  const [configForm, setConfigForm] = useState({
    plotSize: '',
    plotType: 'NORMAL',
    premiumHeads: [],
    dimensions: { north: 0, south: 0, east: 0, west: 0 },
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

  // Series actions
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
        defaultDimensions: { north: 0, south: 0, east: 0, west: 0 },
        remarks: '',
        gracePeriodDays: rateConfig.lateFineGraceDays ?? 15,
        lateFineDailyPercent: rateConfig.lateFineDailyPercent ?? 0.05,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create series');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditSeries = (series) => {
    setSelectedSeries(series);
    setEditForm({
      name: series.name,
      plotArea: series.plotArea,
      defaultPlotType: series.defaultPlotType || 'NORMAL',
      defaultPremiumHeads: Array.isArray(series.defaultPremiumHeads) ? series.defaultPremiumHeads : [],
      startNumber: series.startNumber,
      endNumber: series.endNumber,
      defaultDimensions: {
        north: series.defaultDimensions?.north ?? 0,
        south: series.defaultDimensions?.south ?? 0,
        east: series.defaultDimensions?.east ?? 0,
        west: series.defaultDimensions?.west ?? 0,
      },
      remarks: series.remarks || '',
      gracePeriodDays: series.gracePeriodDays ?? rateConfig.lateFineGraceDays ?? 15,
      lateFineDailyPercent: series.lateFineDailyPercent ?? rateConfig.lateFineDailyPercent ?? 0.05,
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
    const proceed = await confirmDialog({
      title: 'Delete Series?',
      text: 'Are you sure you want to delete this series? Associated plots will also be removed if not booked.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) {
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

  // Plot actions
  const openCreatePlot = (preselectedSeriesId = '') => {
    const selectedS = seriesList.find((s) => s._id === preselectedSeriesId);

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
      premiumHeads: Array.isArray(selectedS?.defaultPremiumHeads) ? selectedS.defaultPremiumHeads : [],
      dimensions: {
        north: selectedS?.defaultDimensions?.north ?? 0,
        south: selectedS?.defaultDimensions?.south ?? 0,
        east: selectedS?.defaultDimensions?.east ?? 0,
        west: selectedS?.defaultDimensions?.west ?? 0,
      },
      boundaries: { north: '', south: '', east: '', west: '' },
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
      premiumHeads: Array.isArray(selectedS?.defaultPremiumHeads) ? selectedS.defaultPremiumHeads : plotForm.premiumHeads,
      dimensions: {
        north: selectedS?.defaultDimensions?.north ?? plotForm.dimensions.north ?? 0,
        south: selectedS?.defaultDimensions?.south ?? plotForm.dimensions.south ?? 0,
        east: selectedS?.defaultDimensions?.east ?? plotForm.dimensions.east ?? 0,
        west: selectedS?.defaultDimensions?.west ?? plotForm.dimensions.west ?? 0,
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

  const openConfigPlot = (plot) => {
    setSelectedPlot(plot);
    const existingHeads = Array.isArray(plot.premiumHeads) && plot.premiumHeads.length > 0
      ? plot.premiumHeads
      : (plot.plotType === 'CORNER' ? [{ name: 'Corner Plot', extraPercent: Number(rateConfig.cornerExtraPercent) || 20 }] : []);

    setConfigForm({
      plotSize: plot.plotSize,
      plotType: plot.plotType,
      premiumHeads: existingHeads,
      dimensions: {
        north: plot.dimensions?.north ?? 0,
        south: plot.dimensions?.south ?? 0,
        east: plot.dimensions?.east ?? 0,
        west: plot.dimensions?.west ?? 0,
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

  const handleUpdateRates = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        ...rateConfig,
        baseSqFtRate: Number(rateConfig.baseSqFtRate) || 1000,
        cornerExtraPercent: Number(rateConfig.cornerExtraPercent) || 20,
        premiumHeads: (rateConfig.premiumHeads || []).map((h) => ({
          name: (h.name || '').trim(),
          extraPercent: Math.max(0, Number(h.extraPercent) || 0),
          description: h.description || '',
        })).filter((h) => h.name),
        interestRatePercent: Number(rateConfig.interestRatePercent) || 10.88,
        dpGracePeriodDays: Math.max(0, Number(rateConfig.dpGracePeriodDays) || 0),
        emiGracePeriodDays: Math.max(0, Number(rateConfig.emiGracePeriodDays) || Number(rateConfig.lateFineGraceDays) || 0),
        lateFineGraceDays: Math.max(0, Number(rateConfig.emiGracePeriodDays) || Number(rateConfig.lateFineGraceDays) || 0),
        lateFineFrequency: rateConfig.lateFineFrequency || 'YEARLY',
        lateFineRate: Math.max(0, Number(rateConfig.lateFineRate) || 0),
        lateFineDailyPercent: Math.max(0, Number(rateConfig.lateFineDailyPercent) || (24 / 365)),
      };
      await api.put('/plots/rate-config', payload);
      toast.success('Plot policy and configuration updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSubmitLoading(false);
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
    'h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition';

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <LayoutGrid size={22} />
            </span>
            Plot Series &amp; Inventory Master
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Configure series blocks, manage real-time inventory maps, configure target commission policy, and set global plot rates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openCreatePlot()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Create Plot
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Create Series Block
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'layout'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid size={17} />
          Series Blocks &amp; Layout Grid
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rates')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rates'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal size={17} />
          Plot Configuration &amp; Rates
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'commissions'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={17} className="text-teal-700" />
          Target &amp; Extra Incentive Policy
        </button>
      </div>

      {/* ── TAB 1: SERIES BLOCKS & LAYOUT GRID ── */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          <SeriesFilterBar
            filterSeries={filterSeries}
            setFilterSeries={setFilterSeries}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            seriesList={seriesList}
            plots={plots}
            setInventoryPage={setInventoryPage}
            inputCls={inputCls}
          />

          <SeriesLayoutGrid
            seriesList={seriesList}
            filteredPlots={filteredPlots}
            plots={plots}
            filterSeries={filterSeries}
            rateConfig={rateConfig}
            openEditSeries={openEditSeries}
            handleDeleteSeries={handleDeleteSeries}
            openCreatePlot={openCreatePlot}
            openConfigPlot={openConfigPlot}
          />
        </div>
      )}

      {/* ── TAB 2: CONFIGURATION & RATES ── */}
      {activeTab === 'rates' && (
        <TenurePlotRatesMatrix
          rateConfig={rateConfig}
          setRateConfig={setRateConfig}
          handleUpdateRates={handleUpdateRates}
          submitLoading={submitLoading}
          inputCls={inputCls}
          labelCls={labelCls}
        />
      )}

      {/* ── TAB 3: TARGET & EXTRA INCENTIVE POLICY (PLOT SALES) ── */}
      {activeTab === 'commissions' && (
        <CommissionPolicyMatrix
          initialBusinessType="PLOT_SALE"
          showTypeToggle={false}
          title="Plot Sales Target & Extra Incentive Policy"
          subtitle="Configure collection target slabs, fixed base rates, tiered incentive percentages, and closing rewards for Plot sales."
        />
      )}

      {/* ── MODALS ── */}
      <CreateSeriesModal
        open={showModal}
        onClose={() => setShowModal(false)}
        form={form}
        setForm={setForm}
        handleCreateSeries={handleCreateSeries}
        rateConfig={rateConfig}
        submitLoading={submitLoading}
        inputCls={inputCls}
        labelCls={labelCls}
      />

      <EditSeriesModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedSeries={selectedSeries}
        editForm={editForm}
        setEditForm={setEditForm}
        handleUpdateSeries={handleUpdateSeries}
        rateConfig={rateConfig}
        submitLoading={submitLoading}
        inputCls={inputCls}
        labelCls={labelCls}
      />

      <ConfigurePlotModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        selectedPlot={selectedPlot}
        configForm={configForm}
        setConfigForm={setConfigForm}
        handleConfigSubmit={handleConfigSubmit}
        rateConfig={rateConfig}
        submitLoading={submitLoading}
        inputCls={inputCls}
        labelCls={labelCls}
      />

      <CreatePlotModal
        open={showCreatePlotModal}
        onClose={() => setShowCreatePlotModal(false)}
        plotForm={plotForm}
        setPlotForm={setPlotForm}
        handleSeriesChangeInPlotForm={handleSeriesChangeInPlotForm}
        handleCreatePlot={handleCreatePlot}
        seriesList={seriesList}
        rateConfig={rateConfig}
        submitLoading={submitLoading}
        inputCls={inputCls}
        labelCls={labelCls}
      />
    </div>
  );
};

export default PlotSeriesMaster;
