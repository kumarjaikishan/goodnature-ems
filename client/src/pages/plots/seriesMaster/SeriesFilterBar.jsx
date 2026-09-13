import { Search } from 'lucide-react';

const SeriesFilterBar = ({
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
  const hasActiveFilters = Boolean(filterSeries || filterStatus || searchTerm);

  const handleClear = () => {
    setFilterSeries('');
    setFilterStatus('');
    setSearchTerm('');
    if (setInventoryPage) setInventoryPage(1);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-xs p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Series Filter */}
        <select
          value={filterSeries}
          onChange={(e) => {
            setFilterSeries(e.target.value);
            if (setInventoryPage) setInventoryPage(1);
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
            <option value="standalone">
              Standalone Plots ({plots.filter((p) => !p.seriesId).length})
            </option>
          )}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            if (setInventoryPage) setInventoryPage(1);
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
