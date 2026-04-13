import React, { useEffect, useState, useMemo, startTransition, useRef } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useSelector } from 'react-redux';
import DataTable from 'react-data-table-component';
import { RiFileExcel2Line, RiUpload2Line, RiFilePdf2Line } from 'react-icons/ri';
import { MdAddCircleOutline, MdCalendarToday, MdOutlineModeEdit, MdRefresh, MdArrowDropDown } from 'react-icons/md';
import { AiOutlineDelete } from 'react-icons/ai';
import { Select, MenuItem, FormControl, InputLabel, Menu } from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';
import swal from 'sweetalert';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import HolidayCalander from './holidayCalander';
import { BiMessageRoundedError } from 'react-icons/bi';
import Modalbox from '../../components/custommodal/Modalbox';
import HolidayPrintable from './HolidayPrintable';
import * as XLSX from 'xlsx';

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

import { apiClient } from '../../utils/apiClient';

const HolidayForm = () => {
  const [form, setForm] = useState({ name: '', type: '', fromDate: null, toDate: null, description: '' });
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [importAnchorEl, setImportAnchorEl] = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Holiday_List_${dayjs().year()}`,
  });

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const handleImportClick = (event) => {
    setImportAnchorEl(event.currentTarget);
  };

  const handleImportClose = () => {
    setImportAnchorEl(null);
  };

  useEffect(() => {
    setWeeklyOffs(company?.weeklyOffs || [1]);
  }, [company]);

  useEffect(() => {
    if (form.fromDate && !form.toDate) {
      const from = dayjs(form.fromDate);
      if (from.isValid()) {
        setForm(prev => ({ ...prev, toDate: from }));
      }
    }
  }, [form.fromDate]);


  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const result = await apiClient({
        url: "getholidays"
      });

      const holidaysData = result.holidays;
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
        name: holi.name,
        From: holi.fromDate,
        till: holi.toDate,
        type: holi.type,
        description: holi?.description,
        action: (
          <div className="action flex gap-2.5">
            <span className="edit text-[18px] text-blue-500 cursor-pointer" title="Edit" onClick={() => handleEdit(holi)}><MdOutlineModeEdit /></span>
            <span className="delete text-[18px] text-red-500 cursor-pointer" onClick={() => handleDelete(holi._id)}><AiOutlineDelete /></span>
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
    setopen(true)
    setHolidayId(holi._id);
    setForm({
      name: holi.name,
      type: holi.type,
      fromDate: dayjs(holi.fromDate),
      toDate: dayjs(holi.toDate),
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
  const handleExport = () => {
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
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Holidays');
    XLSX.writeFile(wb, `holidays_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  };

  // ── Import: parse Excel, preview, then submit ──────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
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
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-selected
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
  const handleDownloadSample = () => {
    const sample = [
      { Name: 'Saraswati Puja', 'From Date': '02-02-2026', 'To Date': '02-02-2026', Type: 'Religious', Description: 'Basant Panchami - Goddess of knowledge' },
      { Name: 'Holi', 'From Date': '14-03-2026', 'To Date': '14-03-2026', Type: 'Religious', Description: 'Festival of colours' },
      { Name: 'Diwali', 'From Date': '20-10-2026', 'To Date': '20-10-2026', Type: 'Religious', Description: 'Festival of lights' },
      { Name: 'Chhath Puja', 'From Date': '28-10-2026', 'To Date': '28-10-2026', Type: 'Religious', Description: 'Chhath Puja - worship of the Sun God' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    // Set column widths for readability
    ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Holidays');
    XLSX.writeFile(wb, 'holidays_sample.xlsx');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isUpdate ? 'updateholiday' : 'addholiday';
      const payload = isUpdate ? { ...form, holidayId } : form;
      const data = await apiClient({
        url: endpoint,
        method: "POST",
        body: payload
      });
      toast.success(data.message);
      setForm({ name: '', type: 'Public', fromDate: null, toDate: null, description: '' });
      setIsUpdate(false);
      setopen(false)
      fetchHolidays();
    } catch (err) {
      console.error('Error saving holiday:', err);
    }
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const fromDate = dayjs(h.From);
      const yearMatch = filterYear === "All" || fromDate.year().toString() === filterYear.toString();
      const monthMatch = filterMonth === "All" || fromDate.month() === parseInt(filterMonth); // if using month index (0-11)
      const typeMatch = filterType === "All" || h.type === filterType;

      return yearMatch && monthMatch && typeMatch;
    });
  }, [holidays, filterYear, filterMonth, filterType]);


  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const years = useMemo(() => {
    if (!holidays || holidays.length === 0) return [];
    const yearSet = new Set();
    holidays.forEach(h => {
      const y = dayjs(h.From).year();
      if (y) yearSet.add(y);
    });
    return Array.from(yearSet).sort((a, b) => b - a); // Sort descending
  }, [holidays]);


  return (
    <div className='max-w-7xl mx-auto'>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* <Box className="flex flex-col md:flex-row gap-4 p-1">
        <HolidayCalander highlightedDates={holidaylist.map(dateObj => ({ date: dayjs(dateObj.date).toDate(), name: dateObj.name }))} weeklyOffs={weeklyOffs} />
        <form onSubmit={handleSave} className='rounded w-full max-w-md'>
          <Box className="flex flex-col gap-4 p-4 bg-white shadow rounded w-full max-w-md">
            <TextField required inputRef={nameInputRef} label="Holiday Name" size="small" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} fullWidth />
            <DatePicker required label="From Date" format='dd/MM/yyyy' value={form.fromDate} onChange={(newValue) => setForm(prev => ({ ...prev, fromDate: newValue }))} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
            <DatePicker required label="To Date" format='dd/MM/yyyy' value={form.toDate} onChange={(newValue) => setForm(prev => ({ ...prev, toDate: newValue }))} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
         
            <FormControl size="small" required fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem disabled value="">Select Type</MenuItem>
                <MenuItem value="National">National</MenuItem>
                <MenuItem value="Religious">Religious</MenuItem>
                <MenuItem value="Public">Public</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Description (optional)" multiline rows={2} size="small" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} fullWidth />
            <div className='flex justify-end gap-2'>
              {isUpdate && <Button variant="outlined" onClick={() => { setIsUpdate(false); setForm({ name: '', type: 'Public', fromDate: null, toDate: null, description: '' }); }}>Cancel</Button>}
              <Button variant="contained" type='submit'>{isUpdate ? 'Update' : 'Add'} Holiday</Button>
            </div>
          </Box>
        </form>
      </Box> */}

        <div className="flex flex-wrap  justify-between items-center gap-3 w-full my-4">
          {/* Year Filter */}
          <div className='flex gap-2 flex-wrap justify-between w-full md:w-fit'>
            <FormControl size="small" className="w-[47%] md:w-[120px]">
              <InputLabel>Year</InputLabel>
              <Select
                label="Year"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Month Filter */}
            <FormControl size="small" className="w-[47%] md:w-[120px]">
              <InputLabel>Month</InputLabel>
              <Select
                label="Month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {months.map((month, ind) => (
                  <MenuItem key={month} value={ind}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Type Filter */}
            <FormControl size="small" className="w-[47%] md:w-[150px]">
              <InputLabel>Type</InputLabel>
              <Select
                label="Filter by Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="All">All</MenuItem>
                {[...new Set(holidays.map((h) => h.type))].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Reset Button */}
            <Button
              variant="outlined"
              color="secondary"
              className='w-[47%] md:w-fit'
              startIcon={<MdRefresh />}
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
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-fit">
            <Button
              startIcon={<MdCalendarToday />}
              variant="outlined"
              onClick={() => setholidaymodal(true)}
            >
              Calendar
            </Button>
            <Button
              startIcon={<RiFileExcel2Line />}
              endIcon={<MdArrowDropDown />}
              variant="outlined"
              color="primary"
              onClick={handleExportClick}
            >
              Export
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleExportClose}
            >
              <MenuItem onClick={() => { handleExport(); handleExportClose(); }}>
                <RiFileExcel2Line style={{ marginRight: '8px', color: '#16a34a' }} /> Excel File
              </MenuItem>
              <MenuItem onClick={() => { handlePrint(); handleExportClose(); }}>
                <RiFilePdf2Line style={{ marginRight: '8px', color: '#dc2626' }} /> PDF List (Official)
              </MenuItem>
            </Menu>
            <Button
              startIcon={<RiUpload2Line />}
              endIcon={<MdArrowDropDown />}
              variant="outlined"
              color="inherit"
              onClick={handleImportClick}
            >
              Import
            </Button>
            <Menu
              anchorEl={importAnchorEl}
              open={Boolean(importAnchorEl)}
              onClose={handleImportClose}
            >
              <MenuItem onClick={() => { fileInputRef.current?.click(); handleImportClose(); }}>
                <RiUpload2Line style={{ marginRight: '8px' }} /> Upload Excel/CSV
              </MenuItem>
              <MenuItem onClick={() => { handleDownloadSample(); handleImportClose(); }}>
                <RiFileExcel2Line style={{ marginRight: '8px', color: '#0ea5e9' }} /> Download Sample
              </MenuItem>
            </Menu>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <Button
              startIcon={<MdAddCircleOutline />}
              variant="contained"
              onClick={() => setopen(true)}
            >
              Add Holiday
            </Button>
          </div>
        </div>


        <div className='capitalize'>
          <DataTable
            columns={columns}
            data={filteredHolidays}
            pagination
            // selectableRows
            customStyles={useCustomStyles()}
            noDataComponent={
              <div className="flex items-center gap-2 py-6 text-center text-gray-600 text-sm">
                <BiMessageRoundedError className="text-xl" /> No records found.
              </div>
            }
            highlightOnHover
          />
        </div>

        <Modalbox open={holidaymodal} onClose={() => setholidaymodal(false)}>
          <div className="membermodal w-[400px]">
            <HolidayCalander highlightedDates={holidaylist.map(dateObj => ({ date: dayjs(dateObj.date), name: dateObj.name }))} weeklyOffs={weeklyOffs} />
          </div>
        </Modalbox>

        {/* ── Import Preview Modal ─────────────────────────────────────── */}
        <Modalbox open={importModal} onClose={() => setImportModal(false)}>
          <div className="membermodal w-[700px]">
            <div className="whole">
              <div className="modalhead">Import Preview ({importPreview.length} records)</div>
              <div className="modalcontent overflow-auto max-h-[400px]">
                <p className="text-sm text-gray-500 mb-2">Review the parsed holidays below before importing.</p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">Name</th>
                      <th className="p-2 border">From</th>
                      <th className="p-2 border">To</th>
                      <th className="p-2 border">Type</th>
                      <th className="p-2 border">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((h, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2 border text-gray-500">{i + 1}</td>
                        <td className="p-2 border font-medium">{h.name}</td>
                        <td className="p-2 border">{h.fromDate ? dayjs(h.fromDate, 'YYYY-MM-DD').format('DD MMM YYYY') : '-'}</td>
                        <td className="p-2 border">{h.toDate ? dayjs(h.toDate, 'YYYY-MM-DD').format('DD MMM YYYY') : '-'}</td>
                        <td className="p-2 border">{h.type}</td>
                        <td className="p-2 border text-gray-500">{h.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modalfooter">
                <Button variant="outlined" onClick={() => { setImportModal(false); setImportPreview([]); }}>Cancel</Button>
                <Button variant="contained" loading={importing} onClick={handleImportSubmit}>
                  Import {importPreview.length} Holiday{importPreview.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </Modalbox>

        <Modalbox open={open} onClose={() => {
          setopen(false)
        }}>
          <div className="membermodal w-[600px]">
            <form onSubmit={handleSave}>
              <div className='modalhead'> {isUpdate ? 'Edit Holiday' : 'Add holiday'}</div>
              <span className="modalcontent ">
                <div className='flex flex-col gap-3 w-full'>
                  <TextField required inputRef={nameInputRef} label="Holiday Name" size="small" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} fullWidth />
                  <div className='flex w-full justify-between gap-2'>
                    <DatePicker required label="From Date" format='DD/MM/YYYY' value={form.fromDate} onChange={(newValue) => setForm(prev => ({ ...prev, fromDate: newValue }))} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                    <DatePicker required label="To Date" format='DD/MM/YYYY' value={form.toDate} onChange={(newValue) => setForm(prev => ({ ...prev, toDate: newValue }))} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                  </div>
                  {/* Type Selector */}
                  <FormControl size="small" required fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={form.type}
                      label="Type"
                      onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <MenuItem disabled value="">Select Type</MenuItem>
                      <MenuItem value="National">National</MenuItem>
                      <MenuItem value="Religious">Religious</MenuItem>
                      <MenuItem value="Public">Public</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField label="Description (optional)" multiline rows={2} size="small" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} fullWidth />

                </div>
              </span>
              <div className='modalfooter'>
                <Button variant="outlined" onClick={() => { setIsUpdate(false); setopen(false); setForm({ name: '', type: 'Public', fromDate: null, toDate: null, description: '' }); }}>Cancel</Button>
                {/* <Button variant="contained" type='submit'>{isUpdate ? 'Update' : 'Add'} Holiday</Button> */}
                <Button variant="contained" type='submit'>{isUpdate ? 'Update' : 'Add'} Holiday</Button>
              </div>
            </form>
          </div>
        </Modalbox>

        {/* Hidden printable component */}
        <HolidayPrintable ref={printRef} holidays={filteredHolidays} company={company} />

      </LocalizationProvider>
    </div>
  );
};

export default HolidayForm;

const columns = [
  { name: "S.no", selector: (row, ind) => ++ind, width: '50px' },
  { name: "Name", selector: (row) => row.name },
  { name: "From", selector: (row) => dayjs(row.From).format('DD MMM, YYYY'), width: '110px' },
  { name: "Till", selector: (row) => dayjs(row.till).format('DD MMM, YYYY'), width: '110px' },
  { name: "Type", selector: (row) => row.type, width: '90px' },
  // { name: "Description", selector: (row) => row.description, width: '180px' },
  { name: "Action", selector: (row) => row.action, width: '80px' }
];