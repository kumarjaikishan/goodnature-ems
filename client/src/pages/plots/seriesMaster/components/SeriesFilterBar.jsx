import { Search } from 'lucide-react';
import Select from '../../../../components/ui/Select';

const SeriesFilterBar = ({
  filterProject = '',
  setFilterProject,
  projects = [],
  filterSeries,
  setFilterSeries,
  filterStatus,
  setFilterStatus,
  searchTerm,
  setSearchTerm,
  seriesList = [],
  plots = [],
  setInventoryPage,
  inputCls = 'h-10 bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-sm text-slate-800 transition',
}) => {
  const hasActiveFilters = Boolean(filterProject || filterSeries || filterStatus || searchTerm);

  const handleClear = () => {
    if (setFilterProject) setFilterProject('');
    setFilterSeries('');
    setFilterStatus('');
    setSearchTerm('');
    if (setInventoryPage) setInventoryPage(1);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Project Filter */}
        {projects.length > 0 && (
          <div className="w-full sm:w-48">
            <Select
              size="sm"
              value={filterProject}
              onChange={(e) => {
                if (setFilterProject) setFilterProject(e.target.value);
                if (setInventoryPage) setInventoryPage(1);
              }}
              options={[
                { value: '', label: 'All Projects' },
                ...projects.map((p) => ({
                  value: p._id,
                  label: `${p.name} ${p.code ? `(${p.code})` : ''}`.trim(),
                })),
              ]}
            />
          </div>
        )}

        {/* Series Filter */}
        <div className="w-full sm:w-56">
          <Select
            size="sm"
            value={filterSeries}
            onChange={(e) => {
              setFilterSeries(e.target.value);
              if (setInventoryPage) setInventoryPage(1);
            }}
            options={[
              { value: '', label: `All Series Blocks (${plots.length} plots)` },
              ...seriesList.map((s) => {
                const count = plots.filter((p) => (p.seriesId?._id || p.seriesId) === s._id).length;
                return {
                  value: s._id,
                  label: `${s.name} (${s.prefix}) — ${count} plots`,
                };
              }),
              ...(plots.some((p) => !p.seriesId)
                ? [{ value: 'standalone', label: `Standalone Plots (${plots.filter((p) => !p.seriesId).length})` }]
                : []),
            ]}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-44">
          <Select
            size="sm"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              if (setInventoryPage) setInventoryPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'AVAILABLE', label: 'Available' },
              { value: 'HOLD', label: 'Hold' },
              { value: 'BOOKED', label: 'Booked' },
              { value: 'REGISTERED', label: 'Registered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
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
              if (setInventoryPage) setInventoryPage(1);
            }}
            className={`${inputCls} w-full pl-9`}
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

export default SeriesFilterBar;
