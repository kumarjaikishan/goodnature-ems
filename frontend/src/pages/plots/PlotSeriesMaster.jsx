import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { HiPlus, HiOutlineWrenchScrewdriver, HiOutlineAdjustmentsHorizontal, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import Modalbox from '../../components/custommodal/Modalbox';
import { CircularProgress } from '@mui/material';

const PlotSeriesMaster = () => {
  const [activeTab, setActiveTab] = useState('series'); // 'series' or 'rates'
  const [seriesList, setSeriesList] = useState([]);
  const [plots, setPlots] = useState([]);
  const [rateConfig, setRateConfig] = useState({
    baseSqFtRate: 500,
    cornerExtraPercent: 20,
  });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modals visibility
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  // Plot configuration state
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
      toast.error('Failed to load series master');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    if (!window.confirm('Are you sure you want to delete this series? Associated plots will also be removed if not booked.')) {
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
      toast.success('Plot updated successfully');
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
    const cornerExtra = configForm.plotType === 'CORNER' ? (rateConfig.cornerExtraPercent || 20) : 0;
    return Math.round(base * (1 + cornerExtra / 100));
  };

  const getLiveTotalValue = () => {
    const size = Number(configForm.plotSize || selectedPlot?.plotSize || 1200);
    return size * getLiveEffectiveRate();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium bg-slate-50 min-h-screen">
        Loading plot series master...
      </div>
    );
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plot Series & Layout Master</h1>
          <p className="text-slate-500 text-sm">Configure series blocks, auto-generate plot maps, and manage base rates.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'series' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium text-sm transition cursor-pointer shadow-sm bg-primary"
            >
              <HiPlus className="w-4 h-4" /> Create Series Block
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('series')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'series' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Series Blocks & Grid Map
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'rates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Global Pricing & Corner Rates
        </button>
      </div>

      {activeTab === 'series' ? (
        <div className="space-y-6">
          {/* Series Summary Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 select-none">
                    {['Series Name', 'Prefix', 'Plot Range', 'Default Area', 'Default Type', 'Format', 'Remarks', 'Actions'].map(h => (
                      <th key={h} className="p-3.5 text-xs font-semibold uppercase text-slate-600 tracking-wider">{h}</th>
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
                    seriesList.map(s => (
                      <tr key={s._id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-800 text-sm">{s.name}</td>
                        <td className="p-3.5 font-bold text-indigo-600 tracking-wider">{s.prefix}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{s.startNumber} - {s.endNumber}</td>
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
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition cursor-pointer"
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
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">Series Plot Grid & Configurator</h3>

            {seriesList.map(s => {
              const seriesPlots = plots.filter(p => p.seriesId?._id === s._id || p.seriesId === s._id);
              return (
                <div key={s._id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl space-y-4">
                  {/* Series Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-800 uppercase">{s.prefix}-Plot Series ({s.name})</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full font-bold">Plots: {seriesPlots.length}</span>
                  </div>

                  {/* Grid of plots */}
                  {seriesPlots.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No plots generated for this series.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                      {seriesPlots.map(p => {
                        const isAvailable = p.status === 'AVAILABLE';
                        const isCorner = p.plotType === 'CORNER';
                        const isHold = p.status === 'HOLD';
                        const isBooked = p.status === 'BOOKED' || p.status === 'REGISTERED';

                        let colorCls = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
                        if (isHold) {
                          colorCls = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100";
                        } else if (isBooked) {
                          colorCls = "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60";
                        }

                        return (
                          <div
                            key={p._id}
                            onClick={() => openPlotConfig(p)}
                            className={`p-2 border rounded-xl flex flex-col justify-between transition cursor-pointer select-none relative group h-14 ${colorCls}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold tracking-wider">{p.plotNumber}</span>
                              {isCorner && (
                                <span className="text-[0.6rem] bg-indigo-600 text-white font-bold px-1 rounded">
                                  CORNER
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[0.6rem] opacity-80 font-semibold uppercase">{isAvailable ? 'Available' : p.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 max-w-xl">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HiOutlineWrenchScrewdriver className="w-5 h-5 text-indigo-600" /> Global Pricing Rates
          </h3>
          <form onSubmit={handleUpdateRates} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Base Sq Ft Rate (₹)</label>
              <input
                className={inputCls}
                type="number"
                value={rateConfig.baseSqFtRate}
                onChange={e => setRateConfig({ ...rateConfig, baseSqFtRate: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Corner Plot Extra Rate Increment (%)</label>
              <input
                className={inputCls}
                type="number"
                value={rateConfig.cornerExtraPercent}
                onChange={e => setRateConfig({ ...rateConfig, cornerExtraPercent: Number(e.target.value) })}
                required
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs cursor-pointer transition min-w-[120px] flex items-center justify-center shadow-sm"
              >
                {submitLoading ? 'Saving...' : 'Save Rates'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal - Create Plot Series */}
      <Modalbox open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[550px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Create Plot Series</h3>
            <button className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition" onClick={() => setShowModal(false)}>✕</button>
          </div>
          <form onSubmit={handleCreateSeries} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 col-span-2">
                <label className={labelCls}>Series Name</label>
                <input className={inputCls} placeholder="e.g. Block A Elite" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Prefix Code</label>
                <input className={inputCls} placeholder="e.g. A" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value.toUpperCase() })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Number Format</label>
                <select className={inputCls} value={form.numberFormat} onChange={e => setForm({ ...form, numberFormat: e.target.value })}>
                  <option value="A0">A1, A2...</option>
                  <option value="A00">A01, A02...</option>
                  <option value="A000">A001, A002...</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Start Number</label>
                <input className={inputCls} type="number" min="1" value={form.startNumber} onChange={e => setForm({ ...form, startNumber: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>End Number</label>
                <input className={inputCls} type="number" min="1" value={form.endNumber} onChange={e => setForm({ ...form, endNumber: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Size (Sq Ft)</label>
                <input className={inputCls} type="number" min="1" value={form.plotArea} onChange={e => setForm({ ...form, plotArea: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Default Plot Type</label>
                <select className={inputCls} value={form.defaultPlotType} onChange={e => setForm({ ...form, defaultPlotType: e.target.value })}>
                  <option value="NORMAL">Normal (Plain)</option>
                  <option value="CORNER">Corner Plot</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks</label>
              <textarea className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button type="button" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-xs text-slate-600 transition" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" disabled={submitLoading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-sm transition min-w-[100px] flex items-center justify-center">
                {submitLoading ? 'Generating...' : 'Generate Plots'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* Modal - Edit Plot Series */}
      <Modalbox open={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Edit Plot Series: {selectedSeries?.name}</h3>
            <button className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition" onClick={() => setShowEditModal(false)}>✕</button>
          </div>
          <form onSubmit={handleUpdateSeries} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Series Name</label>
              <input className={inputCls} placeholder="e.g. Block A Elite" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Start Number</label>
                <input className={inputCls} type="number" min="1" value={editForm.startNumber} onChange={e => setEditForm({ ...editForm, startNumber: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>End Number</label>
                <input className={inputCls} type="number" min="1" value={editForm.endNumber} onChange={e => setEditForm({ ...editForm, endNumber: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Plot Size (Sq Ft)</label>
                <input className={inputCls} type="number" min="1" value={editForm.plotArea} onChange={e => setEditForm({ ...editForm, plotArea: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Default Plot Type</label>
                <select className={inputCls} value={editForm.defaultPlotType} onChange={e => setEditForm({ ...editForm, defaultPlotType: e.target.value })}>
                  <option value="NORMAL">Normal (Plain)</option>
                  <option value="CORNER">Corner Plot</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks</label>
              <textarea className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none" value={editForm.remarks} onChange={e => setEditForm({ ...editForm, remarks: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button type="button" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-xs text-slate-600 transition" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button type="submit" disabled={submitLoading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-sm transition min-w-[120px] flex items-center justify-center">
                {submitLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* Modal - Configure Single Plot Card */}
      <Modalbox open={showConfigModal} onClose={() => setShowConfigModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <HiOutlineAdjustmentsHorizontal className="text-indigo-600 text-xl" />
              <h3 className="text-base font-bold">Configure Plot {selectedPlot?.plotNumber}</h3>
            </div>
            <button className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition" onClick={() => setShowConfigModal(false)}>✕</button>
          </div>

          <form onSubmit={handleConfigSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Corner Type Configuration</label>
              <select
                className={inputCls}
                value={configForm.plotType}
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
                  className={inputCls}
                  type="number"
                  value={configForm.plotSize}
                  onChange={e => setConfigForm({ ...configForm, plotSize: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Base Rate (₹ / Sq Ft)</label>
                <input
                  className={inputCls}
                  type="number"
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
                <span className="text-indigo-600 text-base font-bold">₹{getLiveTotalValue().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelCls}>Internal Audit Notes / Remarks</label>
              <textarea
                className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none"
                placeholder="Reason for corner/rate customization..."
                value={configForm.remarks}
                onChange={e => setConfigForm({ ...configForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button type="button" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-xs text-slate-600 transition" onClick={() => setShowConfigModal(false)}>Cancel</button>
              <button type="submit" disabled={submitLoading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-sm transition min-w-[120px] flex items-center justify-center">
                {submitLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default PlotSeriesMaster;
