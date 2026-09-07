import React, { useState } from 'react';
import { parseExcelFile } from '../../../utils/excelHelper';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { CloudUpload, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import dayjs from 'dayjs';

const AttendanceExcelImport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const formatExcelDate = (excelDate) => {
    if (!excelDate) return null;
    if (excelDate instanceof Date) return excelDate;
    if (typeof excelDate === 'number') {
      return new Date((excelDate - 25569) * 86400 * 1000);
    }
    const d = dayjs(excelDate);
    return d.isValid() ? d.toDate() : null;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const rawData = await parseExcelFile(file, { cellDates: true });
      const formattedData = rawData.map(row => {
        const empId = row['Employee ID'] || row['empid'] || row['Emp ID'] || row['EmployeeID'] || row['ID'];
        const date = formatExcelDate(row['Date'] || row['date'] || row['Attendance Date']);
        const punchIn = formatExcelDate(row['Punch In'] || row['timein'] || row['PunchIn'] || row['In Time']);
        const punchOut = formatExcelDate(row['Punch Out'] || row['timeout'] || row['PunchOut'] || row['Out Time']);
        const status = row['Status'] || row['status'] || row['Attendance Status'];

        return { empId, date, punchIn, punchOut, status };
      }).filter(item => item.empId && item.date);

      if (formattedData.length === 0) {
        toast.warn("No valid records found in Excel. Please check columns: Employee ID, Date");
      }

      setData(formattedData);
    } catch (error) {
      console.error("Excel Parsing Error:", error);
      toast.error("Failed to parse Excel file");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (data.length === 0) return;

    setUploading(true);
    try {
      const response = await apiClient({
        url: 'bulkMarkAttendanceExcel',
        method: 'POST',
        body: { attendanceRecords: data }
      });
      toast.success(response.message);
      setData([]);
    } catch (error) {
      toast.error(error.message || 'Failed to import attendance');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-teal-900">Attendance Excel Import</h1>
          <p className="text-xs text-slate-500 mt-0.5">Upload .xlsx or .xls biometric export files directly</p>
        </div>
      </div>

      <div className="p-8 border-2 border-dashed border-teal-600/40 rounded-2xl text-center bg-teal-50/30 flex flex-col items-center justify-center">
        <input
          accept=".xlsx, .xls"
          className="hidden"
          id="excel-upload"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="excel-upload" className="cursor-pointer">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition">
            <CloudUpload size={16} /> Choose Excel File
          </span>
        </label>
        <p className="text-xs text-slate-600 mt-3 font-medium">
          Select an attendance sheet to upload and process.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Supported Columns: Employee ID, Date, Punch In, Punch Out, Status
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Processing file...</p>
        </div>
      )}

      {data.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">
              Preview <span className="text-xs font-normal text-slate-500">({data.length} records found)</span>
            </h2>
            <button
              type="button"
              onClick={() => setData([])}
              className="px-3 py-1 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold text-slate-700">Employee ID</th>
                  <th className="p-3 font-bold text-slate-700">Date</th>
                  <th className="p-3 font-bold text-slate-700">Punch In</th>
                  <th className="p-3 font-bold text-slate-700">Punch Out</th>
                  <th className="p-3 font-bold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.slice(0, 100).map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{row.empId}</td>
                    <td className="p-3">{row.date ? dayjs(row.date).format('DD MMM YYYY') : '-'}</td>
                    <td className="p-3">{row.punchIn ? dayjs(row.punchIn).format('hh:mm A') : '-'}</td>
                    <td className="p-3">{row.punchOut ? dayjs(row.punchOut).format('hh:mm A') : '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        row.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        row.status === 'absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {row.status || 'Auto'}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.length > 100 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-slate-400 italic text-xs">
                      Showing first 100 records...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleImport}
            loading={uploading}
            className="w-full"
          >
            {uploading ? 'Processing Data...' : 'Confirm and Import Attendance'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AttendanceExcelImport;
