import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { Search, Edit2 } from 'lucide-react';
import Modalbox from '../../components/custommodal/Modalbox';
import { CircularProgress } from '@mui/material';

const PlotInventory = () => {
  const [plots, setPlots] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    seriesId: '',
    status: '',
    search: '',
  });

  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);

  // Adjust details modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    plotSize: '',
    plotType: 'NORMAL',
    baseRate: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page,
        limit: 48,
      }).toString();

      const [plotsRes, seriesRes] = await Promise.all([
        api.get(`/plots?${queryParams}`),
        api.get('/plots/series')
      ]);

      setPlots(plotsRes.data.data || []);
      setPagination(plotsRes.data.pagination || { page: 1, pages: 1 });
      setSeriesList(seriesRes.data.data || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const openAdjust = (plot) => {
    if (plot.status !== 'AVAILABLE' && plot.status !== 'HOLD') {
      toast.error('Only Available or Hold plots can be adjusted.');
      return;
    }
    setSelectedPlot(plot);
    setAdjustForm({
      plotSize: plot.plotSize,
      plotType: plot.plotType,
      baseRate: plot.baseRate,
      remarks: plot.remarks || '',
    });
    setShowModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.put(`/plots/${selectedPlot._id}`, {
        plotSize: Number(adjustForm.plotSize),
        plotType: adjustForm.plotType,
        baseRate: Number(adjustForm.baseRate),
        remarks: adjustForm.remarks,
      });
      toast.success('Plot properties updated successfully');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plot properties');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800';
      case 'HOLD': return 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800';
      case 'BOOKED': return 'bg-rose-50 border-rose-200 text-rose-700 cursor-not-allowed opacity-70';
      case 'REGISTERED': return 'bg-purple-50 border-purple-200 text-purple-700 cursor-not-allowed opacity-70';
      case 'CANCELLED': return 'bg-slate-100 border-slate-200 text-slate-500';
      default: return 'bg-slate-50 border-slate-200 text-slate-600';
    }
  };

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition";

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Plots Inventory Grid</h1>
        <p className="text-slate-500 text-sm">Real-time interactive status maps of all generated blocks and plots.</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Series */}
          <select
            value={filters.seriesId}
            onChange={e => { setFilters({ ...filters, seriesId: e.target.value }); setPage(1); }}
            className={`${inputCls} w-full md:w-48`}
          >
            <option value="">All Series Blocks</option>
            {seriesList.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.prefix})</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            className={`${inputCls} w-full md:w-40`}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="HOLD">Hold</option>
            <option value="BOOKED">Booked</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REGISTERED">Registered</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search plot number..."
            value={filters.search}
            onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
            className={`${inputCls} w-full pl-9`}
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      {/* Inventory Map */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 flex justify-center items-center">
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        </div>
      ) : plots.length === 0 ? (
        <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 font-medium">
          No plot matches found. Make sure series exists.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {plots.map(p => (
            <div
              key={p._id}
              onClick={() => openAdjust(p)}
              className={`p-3.5 border rounded-2xl flex flex-col justify-between transition cursor-pointer select-none relative group h-28 ${getStatusColor(p.status)}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider">{p.plotNumber}</span>
                <span className="text-[0.6rem] font-bold uppercase tracking-wider">{p.status}</span>
              </div>
              <div className="mt-2 text-left">
                <p className="text-[0.65rem] font-medium opacity-80 uppercase leading-none">{p.plotType}</p>
                <p className="text-[0.7rem] font-bold mt-1 leading-none">{p.plotSize} Sq Ft</p>
                <p className="text-xs font-bold mt-1.5 leading-none">₹{p.totalPlotValue.toLocaleString('en-IN')}</p>
              </div>

              {/* Adjust hover indicator */}
              {(p.status === 'AVAILABLE' || p.status === 'HOLD') && (
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <Edit2 size={12} className="text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-slate-500 font-bold">Page {page} of {pagination.pages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal - Adjust Details */}
      <Modalbox open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6 bg-white rounded-2xl w-[500px] max-w-[90vw] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Adjust Plot: {selectedPlot?.plotNumber}</h3>
            <button className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition" onClick={() => setShowModal(false)}>✕</button>
          </div>
          <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Plot Size (Sq Ft)</label>
              <input className={inputCls} type="number" value={adjustForm.plotSize} onChange={e => setAdjustForm({ ...adjustForm, plotSize: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Plot Type / Corners</label>
              <select className={inputCls} value={adjustForm.plotType} onChange={e => setAdjustForm({ ...adjustForm, plotType: e.target.value })}>
                <option value="NORMAL">Normal / Plain</option>
                <option value="CORNER">Corner Plot (+20%)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Base Sq Ft Rate (₹)</label>
              <input className={inputCls} type="number" value={adjustForm.baseRate} onChange={e => setAdjustForm({ ...adjustForm, baseRate: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Remarks</label>
              <textarea className="w-full min-h-[60px] bg-white border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition resize-none" value={adjustForm.remarks} onChange={e => setAdjustForm({ ...adjustForm, remarks: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
              <button type="button" className="px-4 py-2.5 bg-slate-100 rounded-xl font-medium text-xs text-slate-600 hover:bg-slate-200 transition" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" disabled={submitLoading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-medium text-xs text-white rounded-xl shadow-sm transition min-w-[100px] flex items-center justify-center">
                {submitLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default PlotInventory;
