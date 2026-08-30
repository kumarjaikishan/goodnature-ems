/**
 * Dynamic XLSX Loader & Helpers
 * Dynamically loads the `xlsx` package only when the user explicitly triggers an import or export.
 * This saves over 400KB from initial bundle evaluation.
 */

let xlsxModulePromise = null;

export const getXlsx = async () => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx');
  }
  return xlsxModulePromise;
};

/**
 * Export JSON records directly as an Excel file
 * @param {Array<Object>} rows - Array of key-value row objects
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - Destination filename (including .xlsx extension)
 */
export const exportJsonToExcel = async (rows, sheetName = 'Sheet1', fileName = 'export.xlsx') => {
  const XLSX = await getXlsx();
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

/**
 * Parse an uploaded File / Blob into JSON records
 * @param {File|Blob} file - Uploaded Excel/CSV file object
 * @param {Object} options - XLSX read options (defaults to { cellDates: true })
 * @returns {Promise<Array<Object>>} Parsed row objects
 */
export const parseExcelFile = async (file, options = { cellDates: true }) => {
  const XLSX = await getXlsx();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', ...options });
  const wsname = wb.SheetNames[0];
  const ws = wb.Sheets[wsname];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};
