import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable, responsive pagination bar matching Good Nature EMS DataTable standards.
 */
export const TablePagination = ({
  currentPage = 1,
  totalItems = 0,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 20, 50, 100],
  onPageChange,
  onRowsPerPageChange,
  disabled = false,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const handlePageChange = (newPage) => {
    if (disabled) return;
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    if (clamped !== currentPage && onPageChange) {
      onPageChange(clamped);
    }
  };

  const handleRowsPerPageChange = (e) => {
    if (disabled) return;
    const newRowsPerPage = Number(e.target.value);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    }
    if (onPageChange) {
      onPageChange(1);
    }
  };

  return (
    <div
      className={`px-3 sm:px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-end gap-2 sm:gap-6 text-xs text-slate-500 font-sans select-none min-h-[44px] ${className}`}
    >
      {/* Mobile Order: [|<] [<] on left */}
      <div className="flex sm:hidden items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1 || disabled}
          onClick={() => handlePageChange(1)}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="First Page"
        >
          <ChevronsLeft size={19} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          disabled={currentPage <= 1 || disabled}
          onClick={() => handlePageChange(currentPage - 1)}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="Previous Page"
        >
          <ChevronLeft size={19} strokeWidth={1.8} />
        </button>
      </div>

      {/* Rows per page selector (Center on mobile, Left on desktop) */}
      <div className="flex items-center gap-1 text-slate-500">
        <span className="hidden sm:inline text-xs font-normal">Rows per page:</span>
        <div className="relative inline-flex items-center">
          <select
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            disabled={disabled}
            className="appearance-none bg-transparent hover:bg-slate-50 border-none outline-none py-1 pl-1 pr-4 text-xs font-normal text-slate-600 cursor-pointer focus:ring-0 focus:outline-none"
          >
            {rowsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]">
            ▼
          </span>
        </div>
      </div>

      {/* Range: "1-10 of 45" */}
      <span className="hidden sm:inline text-slate-600 text-xs font-normal whitespace-nowrap">
        {totalItems > 0 ? (
          `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalItems)} of ${totalItems}`
        ) : (
          '0-0 of 0'
        )}
      </span>

      {/* Desktop Navigation Icons (|<  <  >  >|) */}
      <div className="hidden sm:flex items-center gap-1 text-slate-400">
        <button
          type="button"
          disabled={currentPage <= 1 || disabled}
          onClick={() => handlePageChange(1)}
          className="p-1 hover:text-slate-700 hover:bg-slate-50 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="First Page"
        >
          <ChevronsLeft size={19} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          disabled={currentPage <= 1 || disabled}
          onClick={() => handlePageChange(currentPage - 1)}
          className="p-1 hover:text-slate-700 hover:bg-slate-50 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="Previous Page"
        >
          <ChevronLeft size={19} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages || disabled}
          onClick={() => handlePageChange(currentPage + 1)}
          className="p-1 hover:text-slate-700 hover:bg-slate-50 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="Next Page"
        >
          <ChevronRight size={19} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages || disabled}
          onClick={() => handlePageChange(totalPages)}
          className="p-1 hover:text-slate-700 hover:bg-slate-50 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="Last Page"
        >
          <ChevronsRight size={19} strokeWidth={1.8} />
        </button>
      </div>

      {/* Mobile Navigation Icons ([>] [>|] on right) */}
      <div className="flex sm:hidden items-center gap-1">
        <button
          type="button"
          disabled={currentPage >= totalPages || disabled}
          onClick={() => handlePageChange(currentPage + 1)}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="Next Page"
        >
          <ChevronRight size={19} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages || disabled}
          onClick={() => handlePageChange(totalPages)}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center"
          title="Last Page"
        >
          <ChevronsRight size={19} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
