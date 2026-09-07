import React, { useEffect, useState, useMemo, startTransition, useRef } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useSelector } from 'react-redux';
import DataTable from '@/components/common/DataTable';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  PlusCircle,
  Calendar as CalendarIcon,
  Edit2,
  RefreshCw,
  ChevronDown,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from '../../utils/toast';
import { swal } from '../../utils/confirmDialog';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import HolidayCalander from './holidayCalander';
import Modalbox from '../../components/custommodal/Modalbox';
import HolidayPrintable from './HolidayPrintable';
import { exportJsonToExcel, parseExcelFile } from '../../utils/excelHelper';
import { apiClient } from '../../utils/apiClient';

// Custom UI Components
import Input from '../../components/ui/Input';
import DateInput from '../../components/ui/DateInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

// Accepts JS Date objects, date strings in any common format
const DATE_FORMATS = ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'D/M/YYYY', 'D-M-YYYY', 'YYYY/MM/DD'];
const parseFlexibleDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return dayjs(val); // xlsx cellDates:true returns JS Date
  const str = String(val).trim();
  for (const fmt of DATE_FORMATS) {
    const d = dayjs(str, fmt, true);
    if (d.isValid()) return d;
  }
  const fallback = dayjs(str); // last resort
  return fallback.isValid() ? fallback : null;
};

const HolidayForm = () => {
  const [form, setForm] = useState({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
  const [holidayId, setHolidayId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [holidaylist, setHolidayList] = useState([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const { company } = useSelector((state) => state.user);
  const [weeklyOffs, setWeeklyOffs] = useState([1]);
  const [filterYear, setFilterYear] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const nameInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);
  const [holidaymodal, setholidaymodal] = useState(false);
  const [open, setopen] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  // Dropdown menus
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const exportRef = useRef(null);
  const importRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
      if (importRef.current && !importRef.current.contains(e.target)) {
        setImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Holiday_List_${dayjs().year()}`,
  });

  useEffect(() => {
    setWeeklyOffs(company?.weeklyOffs || [1]);
  }, [company]);

  const handleFromDateChange = (val) => {
    const rawVal = val?.target?.value !== undefined ? val.target.value : val;
    setForm(prev => {
      const next = { ...prev, fromDate: rawVal };
      if (rawVal && !prev.toDate) {
        next.toDate = rawVal;
      }
      return next;
    });
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const result = await apiClient({
        url: "getholidays"
      });

      const holidaysData = result.holidays || [];
      const dateObjects = [];

      holidaysData.forEach((holiday) => {
        let current = dayjs(holiday.fromDate);
        const end = holiday.toDate ? dayjs(holiday.toDate) : current;
        while (current.isSameOrBefore(end, 'day')) {
          dateObjects.push({
            date: current.format('YYYY-MM-DD'),
            name: holiday.name,
          });
          current = current.add(1, 'day');
        }
      });

      const data = holidaysData.map((holi) => ({
        _id: holi._id,
        name: holi.name,
        From: holi.fromDate,
        till: holi.toDate,
        type: holi.type,
        description: holi?.description,
        action: (
          <div className="action flex gap-2.5 items-center">
            <button
              type="button"
              className="edit text-teal-600 hover:text-teal-700 cursor-pointer p-1 rounded hover:bg-teal-50 transition-colors"
              title="Edit"
              onClick={() => handleEdit(holi)}
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              className="delete text-red-500 hover:text-red-600 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors"
              title="Delete"
              onClick={() => handleDelete(holi._id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )
      }));

      startTransition(() => {
        setHolidayList(dateObjects);
        setHolidays(data);
      });
    } catch (err) {
      console.error("Error fetching holidays:", err);
    }
  };

  const handleEdit = (holi) => {
    setIsUpdate(true);
    setopen(true);
    setHolidayId(holi._id);
    const rawFrom = holi.fromDate || holi.From;
    const rawTo = holi.toDate || holi.till || rawFrom;
    setForm({
      name: holi.name || '',
      type: holi.type || 'Public',
      fromDate: rawFrom ? (dayjs(rawFrom).isValid() ? dayjs(rawFrom).format('YYYY-MM-DD') : rawFrom) : '',
      toDate: rawTo ? (dayjs(rawTo).isValid() ? dayjs(rawTo).format('YYYY-MM-DD') : rawTo) : '',
      description: holi.description || ''
    });
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleDelete = async (id) => {
    swal({
      title: "Are you sure you want to Delete?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (deletee) => {
      if (deletee) {
        try {
          const data = await apiClient({
            url: "deleteholiday",
            method: "POST",
            body: { id }
          });
          toast.success(data.message);
          fetchHolidays();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // ── Export: download current filtered list as Excel ──────────────────────
  const handleExport = async () => {
    if (filteredHolidays.length === 0) {
      toast.info('No holidays to export.');
      return;
    }
    const rows = filteredHolidays.map((h, i) => ({
      'S.No': i + 1,
      'Name': h.name,
      'From Date': dayjs(h.From).format('DD/MM/YYYY'),
      'To Date': dayjs(h.till).format('DD/MM/YYYY'),
      'Type': h.type || '',
      'Description': h.description || '',
    }));
    try {
      await exportJsonToExcel(rows, 'Holidays', `holidays_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    } catch {
      toast.error('Failed to export Excel file');
    }
  };

  // ── Import: parse Excel, preview, then submit ──────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file, { cellDates: true });
      const parsed = rows.map(r => {
        const rawFrom = r['From Date'] ?? r['fromDate'] ?? r['from_date'] ?? '';
        const rawTo = r['To Date'] ?? r['toDate'] ?? r['to_date'] ?? rawFrom;
        const fromParsed = parseFlexibleDate(rawFrom);
        const toParsed = parseFlexibleDate(rawTo) || fromParsed;
        return {
          name: r['Name'] || r['name'] || '',
          fromDate: fromParsed ? fromParsed.format('YYYY-MM-DD') : '',
          toDate: toParsed ? toParsed.format('YYYY-MM-DD') : '',
          type: r['Type'] || r['type'] || 'Other',
          description: r['Description'] || r['description'] || '',
        };
      }).filter(r => r.name && r.fromDate);

      if (parsed.length === 0) {
        toast.error('No valid rows found. Make sure the file has Name, From Date, To Date, Type columns.');
        return;
      }
      setImportPreview(parsed);
      setImportModal(true);
    } catch {
      toast.error('Failed to read the file. Please use a valid xlsx/csv format.');
    }
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      const data = await apiClient({
        url: 'bulkImportHolidays',
        method: 'POST',
        body: { holidays: importPreview },
      });
      toast.success(data.message);
      setImportModal(false);
      setImportPreview([]);
      fetchHolidays();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // ── Download sample template ────────────────────────────────
  const handleDownloadSample = async () => {
    const sample = [
      { Name: 'Saraswati Puja', 'From Date': '02-02-2026', 'To Date': '02-02-2026', Type: 'Religious', Description: 'Basant Panchami - Goddess of knowledge' },
      { Name: 'Holi', 'From Date': '14-03-2026', 'To Date': '14-03-2026', Type: 'Religious', Description: 'Festival of colours' },
      { Name: 'Diwali', 'From Date': '20-10-2026', 'To Date': '20-10-2026', Type: 'Religious', Description: 'Festival of lights' },
      { Name: 'Chhath Puja', 'From Date': '28-10-2026', 'To Date': '28-10-2026', Type: 'Religious', Description: 'Chhath Puja - worship of the Sun God' },
    ];
    await exportJsonToExcel(sample, 'Holidays', 'holidays_sample.xlsx');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const formattedFromDate = form.fromDate ? dayjs(form.fromDate).format("YYYY-MM-DD") : null;
      const formattedToDate = form.toDate ? dayjs(form.toDate).format("YYYY-MM-DD") : null;

      const endpoint = isUpdate ? 'updateholiday' : 'addholiday';
      const payload = {
        ...form,
        fromDate: formattedFromDate,
        toDate: formattedToDate,
        ...(isUpdate ? { holidayId } : {})
      };

      const data = await apiClient({
        url: endpoint,
        method: "POST",
        body: payload
      });
      toast.success(data.message);
      setForm({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
      setIsUpdate(false);
      setopen(false);
      fetchHolidays();
    } catch (err) {
      console.error('Error saving holiday:', err);
    }
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const fromDate = dayjs(h.From);
      const yearMatch = filterYear === "All" || fromDate.year().toString() === filterYear.toString();
      const monthMatch = filterMonth === "All" || fromDate.month() === parseInt(filterMonth);
      const typeMatch = filterType === "All" || h.type === filterType;

      return yearMatch && monthMatch && typeMatch;
    });
  }, [holidays, filterYear, filterMonth, filterType]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = useMemo(() => {
    if (!holidays || holidays.length === 0) return [];
    const yearSet = new Set();
    holidays.forEach(h => {
      const y = dayjs(h.From).year();
      if (y) yearSet.add(y);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [holidays]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(holidays.map((h) => h.type).filter(Boolean))];
  }, [holidays]);

  return (
    <div className='max-w-7xl mx-auto space-y-4'>
      {/* Top Filter and Action Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Filters */}
        <div className='flex gap-2 flex-wrap items-center w-full md:w-auto'>
          <div className="w-full sm:w-[130px]">
            <Select
              label="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              options={[
                { value: "All", label: "All Years" },
                ...years.map(y => ({ value: y, label: y.toString() }))
              ]}
              size="sm"
            />
          </div>

          <div className="w-full sm:w-[130px]">
            <Select
              label="Month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              options={[
                { value: "All", label: "All Months" },
                ...months.map((m, idx) => ({ value: idx.toString(), label: m }))
              ]}
              size="sm"
            />
          </div>

          <div className="w-full sm:w-[150px]">
            <Select
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: "All", label: "All Types" },
                ...uniqueTypes.map(t => ({ value: t, label: t }))
              ]}
              size="sm"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 border border-slate-200"
            icon={<RefreshCw size={14} />}
            onClick={() => {
              setFilterYear("All");
              setFilterMonth("All");
              setFilterType("All");
            }}
          >
            Reset
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            icon={<CalendarIcon size={15} />}
            variant="outline"
            size="sm"
            onClick={() => setholidaymodal(true)}
          >
            Calendar
          </Button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              icon={<FileSpreadsheet size={15} className="text-emerald-600" />}
              variant="outline"
              size="sm"
              onClick={() => setExportMenuOpen(prev => !prev)}
            >
              Export
              <ChevronDown size={14} className="ml-1 text-slate-400" />
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => { handleExport(); setExportMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Excel File
                </button>
                <button
                  type="button"
                  onClick={() => { handlePrint(); setExportMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
                >
                  <FileText size={15} className="text-red-600" /> PDF List (Official)
                </button>
              </div>
            )}
          </div>

          {/* Import Dropdown */}
          <div className="relative" ref={importRef}>
            <Button
              icon={<Upload size={15} />}
              variant="outline"
              size="sm"
              onClick={() => setImportMenuOpen(prev => !prev)}
            >
              Import
              <ChevronDown size={14} className="ml-1 text-slate-400" />
            </Button>
            {importMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); setImportMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Upload size={15} className="text-teal-600" /> Upload Excel/CSV
                </button>
                <button
                  type="button"
                  onClick={() => { handleDownloadSample(); setImportMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-sky-600" /> Download Sample
                </button>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <Button
            icon={<PlusCircle size={15} />}
            variant="primary"
            size="sm"
            onClick={() => {
              setIsUpdate(false);
              setHolidayId(null);
              setForm({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
              setopen(true);
            }}
          >
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Holiday Table */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <DataTable
          columns={columns}
          data={filteredHolidays}
          pagination
          customStyles={useCustomStyles()}
          noDataComponent={
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
              <AlertCircle size={28} className="text-slate-400 mb-2" />
              <p className="text-sm font-medium">No holiday records found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or add a new holiday.</p>
            </div>
          }
          highlightOnHover
        />
      </div>

      {/* Calendar View Modal */}
      <Modalbox open={holidaymodal} onClose={() => setholidaymodal(false)}>
        <div className="p-4 w-full max-w-[420px]">
          <HolidayCalander highlightedDates={holidaylist.map(dateObj => ({ date: dayjs(dateObj.date), name: dateObj.name }))} weeklyOffs={weeklyOffs} />
        </div>
      </Modalbox>

      {/* Import Preview Modal */}
      <Modalbox open={importModal} onClose={() => setImportModal(false)}>
        <div className="w-full max-w-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Import Preview</h3>
              <p className="text-xs text-slate-500">{importPreview.length} holiday records parsed from spreadsheet</p>
            </div>
            <button
              onClick={() => { setImportModal(false); setImportPreview([]); }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-auto max-h-[380px] rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-medium sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">From</th>
                  <th className="p-2.5">To</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importPreview.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 text-slate-400">{i + 1}</td>
                    <td className="p-2.5 font-medium text-slate-800">{h.name}</td>
                    <td className="p-2.5 text-slate-600">{h.fromDate ? dayjs(h.fromDate, 'YYYY-MM-DD').format('DD MMM YYYY') : '-'}</td>
                    <td className="p-2.5 text-slate-600">{h.toDate ? dayjs(h.toDate, 'YYYY-MM-DD').format('DD MMM YYYY') : '-'}</td>
                    <td className="p-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-100">
                        {h.type}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 max-w-[200px] truncate">{h.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setImportModal(false); setImportPreview([]); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={importing}
              onClick={handleImportSubmit}
            >
              Import {importPreview.length} Holiday{importPreview.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modalbox>

      {/* Add / Edit Holiday Modal */}
      <Modalbox open={open} onClose={() => setopen(false)}>
        <div className="w-[92vw] sm:w-[480px] md:w-[520px] p-6 bg-white rounded-2xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                {isUpdate ? 'Edit Holiday' : 'Add New Holiday'}
              </h3>
              <button
                type="button"
                onClick={() => setopen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <Input
                label="Holiday Name"
                required
                ref={nameInputRef}
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Independence Day, Diwali"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateInput
                  label="From Date"
                  required
                  value={form.fromDate}
                  onChange={handleFromDateChange}
                />
                <DateInput
                  label="To Date"
                  required
                  align="right"
                  value={form.toDate}
                  onChange={(val) => {
                    const rawVal = val?.target?.value !== undefined ? val.target.value : val;
                    setForm(prev => ({ ...prev, toDate: rawVal }));
                  }}
                />
              </div>

              <Select
                label="Holiday Type"
                required
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                options={[
                  { value: "National", label: "National Holiday" },
                  { value: "Religious", label: "Religious Holiday" },
                  { value: "Public", label: "Public / Gazetted" },
                  { value: "Other", label: "Other" }
                ]}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 transition-colors"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional notes about this holiday..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsUpdate(false);
                  setopen(false);
                  setForm({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                {isUpdate ? 'Update Holiday' : 'Create Holiday'}
              </Button>
            </div>
          </form>
        </div>
      </Modalbox>

      {/* Hidden printable component */}
      <HolidayPrintable ref={printRef} holidays={filteredHolidays} company={company} />
    </div>
  );
};

export default HolidayForm;

const columns = [
  { name: "S.no", selector: (row, ind) => ++ind, width: '60px' },
  { name: "Name", selector: (row) => row.name },
  { name: "From", selector: (row) => dayjs(row.From).format('DD MMM, YYYY'), width: '130px' },
  { name: "Till", selector: (row) => dayjs(row.till).format('DD MMM, YYYY'), width: '130px' },
  {
    name: "Type",
    selector: (row) => (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        {row.type || 'Public'}
      </span>
    ),
    width: '120px'
  },
  { name: "Action", selector: (row) => row.action, width: '90px' }
];
