import React, { useState } from 'react';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';
import { confirmDialog } from '../../../../utils/confirmDialog';
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Layers,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PlotProjectsSection = ({
  projects = [],
  seriesList = [],
  plots = [],
  onProjectsChange,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  inputCls = 'h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
  labelCls = 'block text-xs font-semibold text-slate-600 mb-1',
  showForm,
  setShowForm,
}) => {
  const [internalShowForm, setInternalShowForm] = useState(false);
  const isFormOpen = showForm !== undefined ? showForm : internalShowForm;
  const setIsFormOpen = setShowForm || setInternalShowForm;

  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
    status: 'ACTIVE',
    showInAddBooking: false,
  });

  const resetForm = () => {
    setForm({ name: '', code: '', location: '', description: '', status: 'ACTIVE', showInAddBooking: false });
    setEditingProject(null);
    setIsFormOpen(false);
  };

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', code: '', location: '', description: '', status: 'ACTIVE', showInAddBooking: false });
    setIsFormOpen(true);
    setIsCollapsed(false);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name || '',
      code: project.code || '',
      location: project.location || '',
      description: project.description || '',
      status: project.status || 'ACTIVE',
      showInAddBooking: Boolean(project.showInAddBooking),
    });
    setIsFormOpen(true);
    setIsCollapsed(false);
  };

  const handleToggleAddBooking = async (project, checked) => {
    try {
      await api.put(`/plots/projects/${project._id}`, {
        showInAddBooking: checked,
      });
      toast.success(
        checked
          ? `"${project.name}" will show in Add Booking`
          : `"${project.name}" will show in Product Book/Sale`
      );
      if (onProjectsChange) onProjectsChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project setting');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warn('Project Name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingProject) {
        await api.put(`/plots/projects/${editingProject._id}`, form);
        toast.success(`Project "${form.name.trim()}" updated successfully`);
      } else {
        await api.post('/plots/projects', form);
        toast.success(`Project "${form.name.trim()}" created successfully`);
      }
      resetForm();
      if (onProjectsChange) onProjectsChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project) => {
    const proceed = await confirmDialog({
      title: 'Delete Project?',
      text: `Are you sure you want to delete "${project.name}"? If any series, plots, or land agreements are associated, deletion will be blocked safely.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (!proceed) return;
    try {
      await api.delete(`/plots/projects/${project._id}`);
      toast.success('Project deleted');
      if (onProjectsChange) onProjectsChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-100/80 text-teal-800 border border-teal-200">
            <FolderOpen size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Plot Projects &amp; Phases (प्रोजेक्ट मास्टर)
              </h3>
              <span className="text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Create and manage different project names (e.g. Rajgir Phase 1, Rajgir Phase 2). Each series block and plot can belong to a project.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Project
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title={isCollapsed ? 'Expand projects section' : 'Collapse projects section'}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Inline Create / Edit Form */}
      {isFormOpen && (
        <div className="p-5 border-b border-slate-100 bg-teal-50/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800">
              {editingProject ? `Edit Project: ${editingProject.name}` : 'Create New Project (नया प्रोजेक्ट जोड़ें)'}
            </h4>
            <span className="text-xs text-slate-500">
              * Series and plots can be assigned to this project
            </span>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Project Name (प्रोजेक्ट नाम) *</label>
              <input
                className={inputCls}
                placeholder="e.g. Rajgir Phase 1, Patna Township"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Project Code (कोड)</label>
              <input
                className={inputCls}
                placeholder="e.g. RGR-PH1"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className={labelCls}>Location (स्थान)</label>
              <input
                className={inputCls}
                placeholder="e.g. Rajgir, Nalanda, Bihar"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Description (विवरण)</label>
              <input
                className={inputCls}
                placeholder="Short description or township highlights"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Status (स्थिति)</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active (सक्रिय)</option>
                <option value="INACTIVE">Inactive (निष्क्रिय)</option>
                <option value="COMPLETED">Completed (पूर्ण)</option>
              </select>
            </div>
            <div className="flex items-center h-10 mt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.showInAddBooking}
                  onChange={(e) => setForm({ ...form, showInAddBooking: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                />
                <span>For Plot Booking (Add Booking)</span>
              </label>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Table / Summary */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="p-3.5 text-center w-28 bg-teal-50/50">Plot Booking</th>
                <th className="p-3.5 text-left">Project Name</th>
                <th className="p-3.5 text-left">Code</th>
                <th className="p-3.5 text-left">Location</th>
                <th className="p-3.5 text-left">Description</th>
                <th className="p-3.5 text-left">Series &amp; Plots</th>
                <th className="p-3.5 text-left">Status</th>
                {(canUpdate || canDelete) && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 italic font-medium">
                    No projects created yet. Click &quot;Add Project&quot; to create your first project (e.g., Rajgir Phase 1).
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const linkedSeries = seriesList.filter(
                    (s) => String(s.projectId?._id || s.projectId) === String(project._id)
                  );
                  const linkedPlots = plots.filter(
                    (p) => String(p.projectId?._id || p.projectId) === String(project._id)
                  );

                  return (
                    <tr key={project._id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 text-center bg-teal-50/30">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(project.showInAddBooking)}
                            disabled={!canUpdate}
                            onChange={(e) => handleToggleAddBooking(project, e.target.checked)}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer disabled:cursor-not-allowed"
                            title={
                              project.showInAddBooking
                                ? "Checked: Shown in Add Booking (/dashboard/plots/addbooking)"
                                : "Unchecked: Shown in Plot Product Booking (/dashboard/plots/products/book)"
                            }
                          />
                        </label>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{project.name}</span>
                          {project.showInAddBooking ? (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                              Add Booking
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                              Product Sale
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-teal-800 font-bold">
                        {project.code || '-'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {project.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400" />
                            {project.location}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        {project.description || '-'}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
                          <Layers size={12} className="text-teal-700" />
                          <span>{linkedSeries.length} Series</span>
                          <span className="text-slate-300">•</span>
                          <span>{linkedPlots.length} Plots</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            project.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : project.status === 'COMPLETED'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {project.status === 'ACTIVE' ? (
                            <CheckCircle size={10} />
                          ) : (
                            <XCircle size={10} />
                          )}
                          {project.status}
                        </span>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEdit(project)}
                                className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition cursor-pointer"
                                title="Edit Project"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(project)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
                                title="Delete Project"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlotProjectsSection;
