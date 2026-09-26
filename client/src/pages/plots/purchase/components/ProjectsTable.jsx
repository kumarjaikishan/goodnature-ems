import React, { useState } from 'react';
import {
  Building,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  RefreshCw,
  FolderPlus,
  Layers,
  Calendar,
} from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { confirmDialog } from '../../../../utils/confirmDialog';
import api from '../../../../api/axios';
import { toast } from '../../../../utils/toast';

const ProjectsTable = ({
  projects = [],
  loading = false,
  fetchProjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    code: '',
    location: '',
    description: '',
    status: 'ACTIVE',
  };

  const [form, setForm] = useState(initialForm);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setForm(initialForm);
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
        toast.success('Project updated successfully');
      } else {
        await api.post('/plots/projects', form);
        toast.success('Project created successfully');
      }
      setModalOpen(false);
      if (fetchProjects) fetchProjects();
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
    });
    if (!ok) return;

    try {
      await api.delete(`/plots/projects/${p._id}`);
      toast.success(`Project "${p.name}" deleted successfully`);
      if (fetchProjects) fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete Project');
    }
  };

  const filtered = projects.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.code || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search Projects by Name, Code, Location..."
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
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Projects List / Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            Loading Project Directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
              <Building size={24} />
            </div>
            <div className="text-slate-800 font-bold text-sm">No Projects Found</div>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Create projects (e.g. "Good Nature City - Phase 1", "Green Valley Farms") to organize Land Purchases, Plot Bookings, and Plot Product Sales.
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
                  <th className="p-3.5">Project Name & Code</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                          <Building size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                          {p.code && (
                            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 font-semibold inline-block mt-0.5">
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
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

      {/* Create / Edit Project Modal */}
      <Modalbox
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Building className="text-teal-700" size={18} />
            <span>{editingProject ? 'Edit Project' : 'Create New Project'}</span>
          </div>
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Good Nature City, Green Valley Phase 1"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-slate-800"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Code <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. GNC-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 uppercase font-bold text-teal-900"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 font-semibold text-slate-800"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Mauja <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Danapur, Patna / Bihta Road"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief details or remarks about this project..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 text-slate-800 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Save Project'}
            </button>
          </div>
        </form>
      </Modalbox>
    </div>
  );
};

export default ProjectsTable;
