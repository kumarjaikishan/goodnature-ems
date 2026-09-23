import React, { useEffect, useState, useMemo } from 'react';
import {
  Building2, Briefcase, Plus, Search, Edit2, Trash2,
  LayoutGrid, List, Layers, FileText, Sparkles, Building
} from 'lucide-react';
import { swal } from '../../../../utils/confirmDialog';
import DataTable from '@/components/common/DataTable';
import { adddepartment, delette, update } from './departmenthelper';
import { useCustomStyles } from '../../attandence/attandencehelper';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const getInitialBg = (name) => {
  const colors = [
    'bg-teal-700 text-white',
    'bg-emerald-700 text-white',
    'bg-sky-700 text-white',
    'bg-indigo-700 text-white',
    'bg-violet-700 text-white',
    'bg-amber-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Department = () => {
  const [openmodal, setopenmodal] = useState(false);
  const [isload, setisload] = useState(false);
  const [isupdate, setisupdate] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('deptMgmt_viewMode') || 'grid'); // 'grid' | 'table'

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('deptMgmt_viewMode', mode);
    } catch (e) {
      console.error('Failed to save department view mode:', e);
    }
  };

  const { branch, department } = useSelector((e) => e.user);
  const [filtere, setfiltere] = useState({
    branch: 'all',
    search: '',
  });

  const dispatch = useDispatch();
  const styles = useCustomStyles();

  const init = {
    departmentId: '',
    branchId: '',
    department: '',
    description: '',
  };
  const [inp, setInp] = useState(init);

  // Filtered department list
  const filteredDepartments = useMemo(() => {
    if (!department || !Array.isArray(department)) return [];

    return department.filter((dep) => {
      const depBranchId = dep?.branchId?._id || dep?.branchId;
      const matchBranch = filtere.branch === 'all' || depBranchId === filtere.branch;

      const search = filtere.search.trim().toLowerCase();
      const matchSearch =
        !search ||
        dep?.department?.toLowerCase().includes(search) ||
        dep?.description?.toLowerCase().includes(search) ||
        dep?.branchId?.name?.toLowerCase().includes(search);

      return matchBranch && matchSearch;
    });
  }, [department, filtere]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDeps = department?.length || 0;
    const branchIdsWithDeps = new Set(
      (department || []).map((d) => d.branchId?._id || d.branchId).filter(Boolean)
    );
    const totalBranches = branch?.length || 0;
    return {
      totalDeps,
      branchesCovered: branchIdsWithDeps.size,
      totalBranches,
    };
  }, [department, branch]);

  const adddepartcall = (e) => {
    e.preventDefault();
    adddepartment({ inp, setisload, setInp, setopenmodal, init, dispatch });
  };

  const edite = (dep) => {
    setisupdate(true);
    setInp({
      branchId: dep.branchId?._id || dep.branchId || '',
      departmentId: dep._id,
      department: dep.department,
      description: dep.description || '',
    });
    setopenmodal(true);
  };

  const deletee = (dep) => {
    swal({
      title: `Delete department "${dep.department}"?`,
      text: 'Warning: Deleting this department may affect linked employees.',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        delette({ departmentId: dep._id, setisload, dispatch });
      }
    });
  };

  const updatee = (e) => {
    if (e) e.preventDefault();
    update({ inp, setisload, setInp, setopenmodal, init, dispatch });
  };

  const branchOptions = [
    { label: 'All Branches', value: 'all' },
    ...(branch || []).map((b) => ({ label: b.name, value: b._id })),
  ];

  const modalBranchOptions = (branch || []).map((b) => ({ label: b.name, value: b._id }));

  const columns = [
    {
      name: 'S.No',
      selector: (row, idx) => idx + 1,
      width: '70px',
      cell: (row, idx) => (
        <span className="font-bold text-slate-400 text-xs">{idx + 1}</span>
      ),
    },
    {
      name: 'Department',
      selector: (row) => row.department,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${getInitialBg(row.department)}`}>
            {row.department?.charAt(0)?.toUpperCase() || 'D'}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-xs block">{row.department}</span>
            {row.description && (
              <span className="text-[11px] text-slate-400 truncate max-w-xs block">{row.description}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      name: 'Branch',
      selector: (row) => row.branchId?.name,
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
          <Building2 size={12} className="text-teal-700" />
          {row.branchId?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      name: 'Description',
      selector: (row) => row.description,
      cell: (row) => (
        <span className="text-slate-500 text-xs">{row.description || '-'}</span>
      ),
    },
    {
      name: 'Actions',
      width: '100px',
      cell: (row) => (
        <div className="flex gap-1.5 items-center">
          <button
            type="button"
            className="text-slate-500 hover:text-teal-700 p-1.5 rounded-lg hover:bg-teal-50 border border-slate-200 transition cursor-pointer"
            title="Edit Department"
            onClick={() => edite(row)}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            className="text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 border border-slate-200 transition cursor-pointer"
            title="Delete Department"
            onClick={() => deletee(row)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Departments */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Departments</p>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">{stats.totalDeps}</h4>
            <span className="text-[11px] text-teal-600 font-medium">Configured functional units</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
            <Layers size={22} />
          </div>
        </div>

        {/* Branches Covered */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branches Assigned</p>
            <h4 className="text-2xl font-bold text-emerald-800 mt-1">
              {stats.branchesCovered} <span className="text-xs text-slate-400 font-normal">/ {stats.totalBranches}</span>
            </h4>
            <span className="text-[11px] text-emerald-600 font-medium">Locations with active depts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Building2 size={22} />
          </div>
        </div>

        {/* Avg Depts per Branch */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operational Scope</p>
            <h4 className="text-2xl font-bold text-sky-800 mt-1">
              {stats.branchesCovered > 0 ? (stats.totalDeps / stats.branchesCovered).toFixed(1) : 0}
            </h4>
            <span className="text-[11px] text-sky-600 font-medium">Avg departments per branch</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
            <Briefcase size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by department name or description..."
              value={filtere.search}
              onChange={(e) => setfiltere({ ...filtere, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all text-slate-800"
            />
          </div>

          {/* Actions & View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleViewModeChange("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-teal-800 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-teal-800 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
            </div>

            {/* Add Department Button */}
            <Button
              variant="primary"
              size="sm"
              startIcon={Plus}
              onClick={() => {
                setisupdate(false);
                setInp(init);
                setopenmodal(true);
              }}
            >
              Add Department
            </Button>
          </div>
        </div>

        {/* Branch Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Filter by Branch:</span>
          <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80">
            {branchOptions.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setfiltere({ ...filtere, branch: b.value })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  filtere.branch === b.value
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {(filtere.search || filtere.branch !== 'all') && (
            <button
              type="button"
              onClick={() => setfiltere({ branch: 'all', search: '' })}
              className="text-[11px] text-teal-700 font-bold hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3 border border-teal-100">
            <Layers size={28} />
          </div>
          <h4 className="text-base font-bold text-slate-800">No Departments Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {filtere.search || filtere.branch !== 'all'
              ? 'No departments match your search or branch filter criteria.'
              : 'Click "+ Add Department" above to create your first organizational department.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dep, index) => {
            return (
              <div
                key={dep._id || index}
                className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${getInitialBg(dep.department)}`}>
                        {dep.department?.charAt(0)?.toUpperCase() || 'D'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{dep.department}</h3>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5">
                          <Building2 size={11} className="text-teal-700" />
                          {dep.branchId?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => edite(dep)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-800 hover:bg-teal-50 transition cursor-pointer"
                        title="Edit Department"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletee(dep)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {dep.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      {dep.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      No description provided for this department.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <DataTable
            customStyles={styles}
            columns={columns}
            data={filteredDepartments}
            pagination
            highlightOnHover
          />
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        open={openmodal}
        onClose={() => setopenmodal(false)}
        title={isupdate ? 'Edit Department' : 'Create New Department'}
        subtitle="Configure department name, branch linkage, and operational responsibilities"
        maxWidth="max-w-md"
      >
        <form onSubmit={isupdate ? updatee : adddepartcall} className="space-y-4">
          <Select
            label="Branch Location"
            required
            options={modalBranchOptions}
            placeholder="Select associated branch..."
            value={inp.branchId}
            onChange={(e) => setInp({ ...inp, branchId: e.target.value })}
          />

          <Input
            label="Department Name"
            required
            placeholder="e.g. Sales, Human Resources, Accounts"
            value={inp.department}
            onChange={(e) => setInp({ ...inp, department: e.target.value })}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Description & Responsibilities</label>
            <textarea
              rows={3}
              placeholder="Brief description of department scope or responsibilities..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all text-slate-800"
              value={inp.description}
              onChange={(e) => setInp({ ...inp, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setopenmodal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isload}
            >
              {isupdate ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Department;
