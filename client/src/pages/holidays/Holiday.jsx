import React, { useEffect, useState, useMemo, useCallback, startTransition, useRef } from 'react';
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
  Search,
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
import { usePermission } from '../../utils/CheckPermission';

// Custom UI Components
import Input from '../../components/ui/Input';
import DateInput from '../../components/ui/DateInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

const DATE_FORMATS = ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'D/M/YYYY', 'D-M-YYYY', 'YYYY/MM/DD'];
const MAX_EXPANSION_DAYS = 366;

const parseFlexibleDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return dayjs(val);
  const str = String(val).trim();
  for (const fmt of DATE_FORMATS) {
    const d = dayjs(str, fmt, true);
    if (d.isValid()) return d;
  }
  const fallback = dayjs(str);
  return fallback.isValid() ? fallback : null;
};

const TYPE_BADGE_STYLES = {
  National: 'bg-teal-50 text-teal-700 border-teal-200',
  Religious: 'bg-amber-50 text-amber-700 border-amber-200',
  Public: 'bg-sky-50 text-sky-700 border-sky-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const HolidayForm = () => {
  const [form, setForm] = useState({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
  const [holidayId, setHolidayId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [holidaylist, setHolidayList] = useState([]);
  const [isUpdate, setIsUpdate] = useState(false);
  const { company } = useSelector((state) => state.user);
  const [weeklyOffs, setWeeklyOffs] = useState([1]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const nameInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const printRef = useRef(null);
  const [holidaymodal, setholidaymodal] = useState(false);
  const [open, setopen] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const canCreate = usePermission('holiday', 2);
  const canEdit = usePermission('holiday', 3);
  const canDelete = usePermission('holiday', 4);

  // Dropdown menus
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const exportRef = useRef(null);
  const importRef = useRef(null);

  const customTableStyles = useCustomStyles();

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

  const focusNameInput = useCallback(() => {
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  }, []);

  const handleFromDateChange = (val) => {
    const rawVal = val?.target?.value !== undefined ? val.target.value : val;
    setForm((prev) => {
      const next = { ...prev, fromDate: rawVal };
      if (rawVal) {
        const fromD = dayjs(rawVal);
        const toD = prev.toDate ? dayjs(prev.toDate) : null;
        if (!prev.toDate || (fromD.isValid() && toD?.isValid() && toD.isBefore(fromD, 'day'))) {
          next.toDate = rawVal;
        }
      }
      return next;
    });
  };

  const fetchHolidays = useCallback(async () => {
    setTableLoading(true);
    try {
      const result = await apiClient({ url: 'getholidays' });
      const holidaysData = result.holidays || [];
      const dateObjects = [];

      holidaysData.forEach((holiday) => {
        let current = dayjs(holiday.fromDate);
        const end = holiday.toDate ? dayjs(holiday.toDate) : current;
        if (!current.isValid() || !end.isValid() || end.isBefore(current, 'day')) return;

        let count = 0;
        while (current.isSameOrBefore(end, 'day') && count < MAX_EXPANSION_DAYS) {
          dateObjects.push({
            date: current.format('YYYY-MM-DD'),
            name: holiday.name,
            type: holiday.type,
            raw: holiday,
          });
          current = current.add(1, 'day');
          count++;
        }
      });

      const data = holidaysData.map((holi) => ({
        _id: holi._id,
        name: holi.name,
        From: holi.fromDate,
        till: holi.toDate,
        type: holi.type,
        description: holi?.description,
        raw: holi,
      }));

      startTransition(() => {
        setHolidayList(dateObjects);
        setHolidays(data);
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load holidays');
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleEdit = useCallback((holi) => {
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
    focusNameInput();
  }, [focusNameInput]);

  const handleDelete = useCallback((id) => {
    swal({
      title: 'Are you sure you want to Delete?',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then(async (deletee) => {
      if (deletee) {
        try {
          const data = await apiClient({
            url: 'deleteholiday',
            method: 'POST',
            body: { id }
          });
          toast.success(data.message);
          fetchHolidays();
        } catch (err) {
          toast.error(err.message || 'Failed to delete holiday');
        }
      }
    });
  }, [fetchHolidays]);

  const filteredHolidays = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return holidays.filter((h) => {
      const fromDate = dayjs(h.From);
      const toDate = h.till ? dayjs(h.till) : fromDate;

      const yearMatch =
        filterYear === 'All' ||
        fromDate.year().toString() === filterYear.toString() ||
        toDate.year().toString() === filterYear.toString();

      let monthMatch = filterMonth === 'All';
      if (!monthMatch) {
        const targetMonth = parseInt(filterMonth, 10);
        if (filterYear !== 'All') {
          const targetYear = parseInt(filterYear, 10);
          const monthStart = dayjs().year(targetYear).month(targetMonth).startOf('month');
          const monthEnd = monthStart.endOf('month');
          monthMatch = !toDate.isBefore(monthStart, 'day') && !fromDate.isAfter(monthEnd, 'day');
        } else {
          monthMatch = fromDate.month() === targetMonth || toDate.month() === targetMonth;
        }
      }

      const typeMatch = filterType === 'All' || h.type === filterType;
      const searchMatch =
        !q ||
        (h.name || '').toLowerCase().includes(q) ||
        (h.description || '').toLowerCase().includes(q);

      return yearMatch && monthMatch && typeMatch && searchMatch;
    });
  }, [holidays, filterYear, filterMonth, filterType, searchTerm]);

  // Export: download current filtered list as Excel
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

  // Import: parse Excel, preview, then submit
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file, { cellDates: true });
      const parsed = rows
        .map((r) => {
          const rawFrom = r['From Date'] ?? r['fromDate'] ?? r['from_date'] ?? '';
          const rawTo = r['To Date'] ?? r['toDate'] ?? r['to_date'] ?? rawFrom;
          const fromParsed = parseFlexibleDate(rawFrom);
          const toParsed = parseFlexibleDate(rawTo) || fromParsed;
          return {
            name: String(r['Name'] || r['name'] || '').trim(),
            fromDate: fromParsed ? fromParsed.format('YYYY-MM-DD') : '',
            toDate: toParsed ? toParsed.format('YYYY-MM-DD') : '',
            type: r['Type'] || r['type'] || 'Other',
            description: String(r['Description'] || r['description'] || '').trim(),
          };
        })
        .filter((r) => r.name && r.fromDate && !dayjs(r.toDate).isBefore(dayjs(r.fromDate), 'day'));

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

  // Download sample template
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
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error('Holiday name is required');
      nameInputRef.current?.focus();
      return;
    }

    const fromD = dayjs(form.fromDate);
    const toD = dayjs(form.toDate || form.fromDate);
    if (!fromD.isValid() || !toD.isValid()) {
      toast.error('Please select valid From and To dates');
      return;
    }
    if (toD.isBefore(fromD, 'day')) {
      toast.error('To Date cannot be earlier than From Date');
      return;
    }

    try {
      setSaving(true);
      const endpoint = isUpdate ? 'updateholiday' : 'addholiday';
      const payload = {
        ...form,
        name: trimmedName,
        description: form.description?.trim() || '',
        fromDate: fromD.format('YYYY-MM-DD'),
        toDate: toD.format('YYYY-MM-DD'),
        ...(isUpdate ? { holidayId } : {})
      };

      const data = await apiClient({
        url: endpoint,
        method: 'POST',
        body: payload
      });
      toast.success(data.message);
      setForm({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
      setIsUpdate(false);
      setopen(false);
      fetchHolidays();
    } catch (err) {
      toast.error(err.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  // Live duration & weekly off feedback inside Add/Edit modal
  const formDateSummary = useMemo(() => {
    if (!form.fromDate) return null;
    const fromD = dayjs(form.fromDate);
    const toD = dayjs(form.toDate || form.fromDate);
    if (!fromD.isValid() || !toD.isValid()) return null;

    if (toD.isBefore(fromD, 'day')) {
      return { invalid: true, message: 'To Date cannot be earlier than From Date' };
    }

    const days = toD.diff(fromD, 'day') + 1;
    let weeklyOffMatches = 0;
    let cursor = fromD;
    for (let i = 0; i < Math.min(days, MAX_EXPANSION_DAYS); i++) {
      if (weeklyOffs?.includes(cursor.day())) weeklyOffMatches++;
      cursor = cursor.add(1, 'day');
    }

    return {
      invalid: false,
      days,
      weeklyOffMatches,
    };
  }, [form.fromDate, form.toDate, weeklyOffs]);

  const columns = useMemo(() => {
    const base = [
      { name: 'S.no', selector: (_row, ind) => ind + 1, width: '65px' },
      {
        name: 'Name',
        selector: (row) => row.name,
        sortable: true,
        cell: (row) => (
          <div className="py-1.5 min-w-0">
            <p className="font-semibold text-slate-800 text-xs truncate">{row.name}</p>
            {row.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]" title={row.description}>
                {row.description}
              </p>
            )}
          </div>
        ),
        minWidth: '180px',
      },
      {
        name: 'From',
        selector: (row) => row.From,
        sortable: true,
        cell: (row) => (
          <span className="text-xs text-slate-700 font-medium">
            {dayjs(row.From).format('DD MMM, YYYY')}
          </span>
        ),
        width: '130px',
      },
      {
        name: 'Till',
        selector: (row) => row.till,
        sortable: true,
        cell: (row) => (
          <span className="text-xs text-slate-600">
            {dayjs(row.till || row.From).format('DD MMM, YYYY')}
          </span>
        ),
        width: '130px',
      },
      {
        name: 'Days',
        selector: (row) => dayjs(row.till || row.From).diff(dayjs(row.From), 'day') + 1,
        sortable: true,
        cell: (row) => {
          const days = dayjs(row.till || row.From).diff(dayjs(row.From), 'day') + 1;
          return (
            <span className="text-xs font-medium text-slate-600">
              {days} {days === 1 ? 'day' : 'days'}
            </span>
          );
        },
        width: '85px',
      },
      {
        name: 'Type',
        selector: (row) => row.type || 'Public',
        sortable: true,
        cell: (row) => {
          const type = row.type || 'Public';
          const badgeClass = TYPE_BADGE_STYLES[type] || TYPE_BADGE_STYLES.Other;
          return (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}>
              {type}
            </span>
          );
        },
        width: '115px',
      },
    ];

    if (canEdit || canDelete) {
      base.push({
        name: 'Action',
        cell: (row) => (
          <div className="action flex gap-2 items-center">
            {canEdit && (
              <button
                type="button"
                className="edit text-teal-600 hover:text-teal-700 cursor-pointer p-1 rounded hover:bg-teal-50 transition-colors"
                title="Edit"
                onClick={() => handleEdit(row.raw)}
              >
                <Edit2 size={16} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="delete text-red-500 hover:text-red-600 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete"
                onClick={() => handleDelete(row._id)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ),
        width: '90px',
      });
    }

    return base;
  }, [canEdit, canDelete, handleEdit, handleDelete]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = useMemo(() => {
    if (!holidays || holidays.length === 0) return [];
    const yearSet = new Set();
    holidays.forEach((h) => {
      const yFrom = dayjs(h.From).year();
      const yTo = h.till ? dayjs(h.till).year() : yFrom;
      if (yFrom) yearSet.add(yFrom);
      if (yTo) yearSet.add(yTo);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [holidays]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(holidays.map((h) => h.type).filter(Boolean))];
  }, [holidays]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-wrap justify-between items-end gap-3 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Filters */}
        <div className="flex gap-2.5 flex-wrap items-end w-full md:w-auto">
          <div className="w-full sm:w-[210px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search holiday..."
                className="w-full h-9 pl-8 pr-7 text-xs text-slate-600 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="w-full sm:w-[120px]">
            <Select
              label="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              options={[
                { value: 'All', label: 'All Years' },
                ...years.map((y) => ({ value: y, label: y.toString() }))
              ]}
              size="sm"
            />
          </div>

          <div className="w-full sm:w-[125px]">
            <Select
              label="Month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              options={[
                { value: 'All', label: 'All Months' },
                ...months.map((m, idx) => ({ value: idx.toString(), label: m }))
              ]}
              size="sm"
            />
          </div>

          <div className="w-full sm:w-[140px]">
            <Select
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'All', label: 'All Types' },
                ...uniqueTypes.map((t) => ({ value: t, label: t }))
              ]}
              size="sm"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-slate-600 hover:text-slate-900 border-slate-200 h-9"
            icon={<RefreshCw size={13} />}
            onClick={() => {
              setSearchTerm('');
              setFilterYear('All');
              setFilterMonth('All');
              setFilterType('All');
            }}
          >
            Reset
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
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
              onClick={() => setExportMenuOpen((prev) => !prev)}
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
          {canCreate && (
            <div className="relative" ref={importRef}>
              <Button
                icon={<Upload size={15} />}
                variant="outline"
                size="sm"
                onClick={() => setImportMenuOpen((prev) => !prev)}
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
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {canCreate && (
            <Button
              icon={<PlusCircle size={15} />}
              variant="primary"
              size="sm"
              onClick={() => {
                setIsUpdate(false);
                setHolidayId(null);
                setForm({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
                setopen(true);
                focusNameInput();
              }}
            >
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Holiday Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredHolidays}
          progressPending={tableLoading}
          pagination
          customStyles={customTableStyles}
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
      <Modalbox
        open={holidaymodal}
        onClose={() => setholidaymodal(false)}
        title="Holiday Calendar View"
        subtitle="Monthly calendar overview with company holidays and weekly offs"
        maxWidth="max-w-2xl"
      >
        <div className="w-full">
          <HolidayCalander
            title={false}
            highlightedDates={holidaylist}
            weeklyOffs={weeklyOffs}
            showMonthlyList
            onDateClick={
              canCreate
                ? (dateStr) => {
                    setholidaymodal(false);
                    setIsUpdate(false);
                    setHolidayId(null);
                    setForm({ name: '', type: 'Public', fromDate: dateStr, toDate: dateStr, description: '' });
                    setopen(true);
                    focusNameInput();
                  }
                : undefined
            }
            onHolidayClick={
              canEdit
                ? (item) => {
                    if (!item?.raw) return;
                    setholidaymodal(false);
                    handleEdit(item.raw);
                  }
                : undefined
            }
          />
        </div>
      </Modalbox>

      {/* Import Modal */}
      <Modalbox
        open={importModal}
        onClose={() => { setImportModal(false); setImportPreview([]); }}
        title="Import Preview"
        subtitle={`${importPreview.length} holiday records parsed from spreadsheet`}
        maxWidth="max-w-2xl"
        footer={
          <>
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
          </>
        }
      >
        <div className="space-y-4">
          <div className="overflow-auto max-h-[380px] rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
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
        </div>
      </Modalbox>

      {/* Add / Edit Holiday Modal */}
      <Modalbox
        open={open}
        onClose={() => {
          setIsUpdate(false);
          setopen(false);
          setForm({ name: '', type: 'Public', fromDate: '', toDate: '', description: '' });
        }}
        title={isUpdate ? 'Edit Holiday' : 'Add New Holiday'}
        subtitle="Set official company holidays, festival leaves and public observances"
        maxWidth="max-w-lg"
        footer={
          <>
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
              form="holiday-form"
              variant="primary"
              size="sm"
              loading={saving}
              disabled={Boolean(formDateSummary?.invalid)}
            >
              {isUpdate ? 'Update Holiday' : 'Save Holiday'}
            </Button>
          </>
        }
      >
        <form id="holiday-form" onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3.5">
            <Input
              label="Holiday Name"
              required
              ref={nameInputRef}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
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
                  setForm((prev) => ({ ...prev, toDate: rawVal }));
                }}
              />
            </div>

            {formDateSummary && (
              formDateSummary.invalid ? (
                <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                  {formDateSummary.message}
                </p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
                  <span>
                    Duration: <strong className="text-slate-800">{formDateSummary.days} day{formDateSummary.days !== 1 ? 's' : ''}</strong>
                  </span>
                  {formDateSummary.weeklyOffMatches > 0 && (
                    <span className="text-amber-700 font-medium">
                      Includes {formDateSummary.weeklyOffMatches} weekly off day{formDateSummary.weeklyOffMatches !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )
            )}

            <Select
              label="Holiday Type"
              required
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              options={[
                { value: 'National', label: 'National Holiday' },
                { value: 'Religious', label: 'Religious Holiday' },
                { value: 'Public', label: 'Public / Gazetted' },
                { value: 'Other', label: 'Other' }
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-teal-700 focus:ring-1 focus:ring-teal-700 px-3 py-2 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Additional notes about this holiday..."
              />
            </div>
          </div>
        </form>
      </Modalbox>

      {/* Hidden printable component */}
      <HolidayPrintable ref={printRef} holidays={filteredHolidays} company={company} />
    </div>
  );
};

export default HolidayForm;
