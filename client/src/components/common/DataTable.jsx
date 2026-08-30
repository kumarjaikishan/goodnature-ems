import DataTableRaw from 'react-data-table-component';

// In modern Vite 8 / Rolldown / ESM bundlers, CJS default exports with __esModule
// can be double-wrapped as { default: { default: Component } } or { default: Component }.
// This wrapper ensures the actual valid React component is always resolved and exported.
const DataTable =
  DataTableRaw?.default?.default ||
  DataTableRaw?.default ||
  DataTableRaw;

export { DataTable };
export default DataTable;

