import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Building,
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  RefreshCw,
  Info,
} from 'lucide-react';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import PageLoader from '../../../components/common/PageLoader';
import Modalbox from '../../../components/custommodal/Modalbox';
import TenurePeriodCommissionMatrix from './components/TenurePeriodCommissionMatrix';

const PlotProjectsPage = () => {
  // Main Tab: 'projects' (Project Master list) | 'commission' (Commission Policy per selected project)
  const [activeTab, setActiveTab] = useState('projects');

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Project for Commission Policy
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Project Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
    status: 'ACTIVE',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plots/projects');
      const list = res.data?.data || [];
      setProjects(list);
      // Auto-select first project if none selected yet
      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0]._id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      toast.error('Failed to load projects list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setForm({
      name: '',
      code: '',
      location: '',
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProject(p);
    setForm({
      name: p.name || '',
      code: p.code || '',
      location: p.location || '',
      description: p.description || '',
      status: p.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Project Name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProject) {
        await api.put(`/plots/projects/${editingProject._id}`, form);
        toast.success(`Project "${form.name}" updated successfully`);
      } else {
        const res = await api.post('/plots/projects', form);
        toast.success(`Project "${form.name}" created successfully`);
        if (res.data?.data?._id) {
          setSelectedProjectId(res.data.data._id);
        }
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    const ok = await confirmDialog({
      title: 'Delete Project?',
      text: `Are you sure you want to delete Project "${p.name}"? This action cannot be undone.`,
      isDanger: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    try {
      await api.delete(`/plots/projects/${p._id}`);
      toast.success(`Project "${p.name}" deleted successfully`);
      if (selectedProjectId === p._id) {
        setSelectedProjectId(null);
      }
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete Project');
    }
  };

  const selectedProjectObj = projects.find((p) => p._id === selectedProjectId) || null;

  const filteredProjects = projects.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.code || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });

  if (loading && projects.length === 0) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <PageLoader title="Loading Projects &amp; Commission..." subtitle="Fetching real estate projects &amp; project commission slabs" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              <FolderKanban size={22} />
            </span>
            Projects &amp; Commission Management
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Create real estate project names (e.g., Rajgir Project, Good Nature City) and configure project-specific commission &amp; target incentive policies for Plot Bookings &amp; Sales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Create New Project
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'projects'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building size={17} />
          Project Directory ({projects.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commission')}
          className={`pb-3 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'commission'
              ? 'border-teal-800 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={17} className="text-teal-700" />
          Project Commission Policy
          {selectedProjectObj && (
            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full ml-1">
              {selectedProjectObj.name}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: PROJECT DIRECTORY & MANAGEMENT ── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search projects by name, code, location..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchProjects}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
                title="Refresh projects"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                  <Building size={24} />
                </div>
                <div className="text-slate-800 font-bold text-sm">No Projects Found</div>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Create your first real estate project (e.g. "Rajgir Project", "Good Nature City - Phase 1") to start configuring project-specific commission slabs.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create First Project</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3.5">Project Name &amp; Code</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Commission Policy</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredProjects.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                              <Building size={17} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                              {p.code && (
                                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold inline-block mt-0.5">
                                  {p.code}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {p.location ? (
                            <div className="flex items-center gap-1 text-slate-600 text-xs">
                              <MapPin size={13} className="text-teal-600 shrink-0" />
                              <span>{p.location}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="p-3.5 max-w-xs">
                          {p.description ? (
                            <span className="text-slate-600 text-xs line-clamp-2">{p.description}</span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : p.status === 'COMPLETED'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {p.status || 'ACTIVE'}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(p._id);
                              setActiveTab('commission');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            <Award size={14} />
                            <span>Configure Commission</span>
                          </button>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Project"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: PROJECT COMMISSION POLICY ── */}
      {activeTab === 'commission' && (
        <div className="space-y-6">
          {/* Project Selection Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building size={14} className="text-teal-700" />
                Select Project to Configure Commission
              </label>
              <p className="text-xs text-slate-500">
                Choose which project to configure. Slabs and fixed rates configured here apply specifically to plot sales &amp; bookings under this project.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-600 min-w-[220px]"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1 px-3 py-2 bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                <Plus size={14} /> New Project
              </button>
            </div>
          </div>

          {/* Project Specific Commission Notice */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
            <Info size={18} className="text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">Applicability Notice:</span> This commission system is active exclusively for{' '}
              <span className="font-bold underline">Plot Sales &amp; Bookings</span> under{' '}
              <span className="font-bold">{selectedProjectObj ? selectedProjectObj.name : 'the selected project'}</span>.
              It does not apply to Plot Products (micro-plots/fractional units).
            </div>
          </div>

          {/* Tenure Commission Policy Matrix for Selected Project */}
          {selectedProjectId && selectedProjectObj ? (
            <TenurePeriodCommissionMatrix
              key={`proj-tenure-${selectedProjectId}`}
              project={selectedProjectObj}
              onProjectUpdated={(updatedProj) => {
                if (updatedProj) {
                  setProjects((prev) =>
                    prev.map((p) => (p._id === updatedProj._id ? updatedProj : p))
                  );
                } else {
                  fetchProjects();
                }
              }}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
              <p className="text-slate-600 font-medium text-sm">Please create or select a project to configure its commission system.</p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT PROJECT MODAL ── */}
      <Modalbox
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? `Edit Project: ${editingProject.name}` : 'Create New Project'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajgir Project, Good Nature City"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Code</label>
            <input
              type="text"
              placeholder="e.g. RAJGIR, GNC-1"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium uppercase text-slate-800"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Location / Site Address</label>
            <input
              type="text"
              placeholder="e.g. Near NH-31, Rajgir, Bihar"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Optional project notes or details..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modalbox>
    </div>
  );
};

export default PlotProjectsPage;
