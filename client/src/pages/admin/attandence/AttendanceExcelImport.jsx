import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { apiClient } from '../../../utils/apiClient';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt } from 'react-icons/fa';
import dayjs from 'dayjs';

const AttendanceExcelImport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const formatExcelDate = (excelDate) => {
    if (!excelDate) return null;
    
    // If it's already a JS Date
    if (excelDate instanceof Date) return excelDate;
    
    // Handle Excel numeric date format
    if (typeof excelDate === 'number') {
      return new Date((excelDate - 25569) * 86400 * 1000);
    }
    
    // Handle string date
    const d = dayjs(excelDate);
    return d.isValid() ? d.toDate() : null;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        console.log("Raw Excel Data:", rawData);

        // Map data to expected format with smart column matching
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
    reader.readAsBinaryString(file);
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Attendance Excel Import
        </Typography>
      </Box>

      <Paper sx={{ p: 5, mb: 4, border: '2px dashed #115e59', borderRadius: 4, textAlign: 'center', bgcolor: 'rgba(17, 94, 89, 0.05)' }}>
        <input
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          id="excel-upload"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="excel-upload">
          <Button
            variant="contained"
            component="span"
            size="large"
            startIcon={<FaCloudUploadAlt />}
            sx={{ mb: 2, px: 4, py: 1.5, borderRadius: 2, bgcolor: '#115e59', '&:hover': { bgcolor: '#0d4a46' } }}
          >
            Choose Excel File
          </Button>
        </label>
        <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
          Select an attendance sheet to upload and process.
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.disabled' }}>
          Supported Columns: Employee ID, Date, Punch In, Punch Out, Status
        </Typography>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 8 }}>
          <CircularProgress sx={{ color: '#115e59' }} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>Processing file...</Typography>
        </Box>
      )}

      {data.length > 0 && !loading && (
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Preview <Box component="span" sx={{ color: 'text.secondary', fontWeight: 'normal', ml: 1 }}>({data.length} records found)</Box>
            </Typography>
            <Button variant="outlined" color="error" onClick={() => setData([])} size="small">Clear</Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ maxHeight: 450, mb: 4, borderRadius: 3, boxShadow: 3 }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f4f7f6', fontWeight: 'bold' }}>Employee ID</TableCell>
                  <TableCell sx={{ bgcolor: '#f4f7f6', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ bgcolor: '#f4f7f6', fontWeight: 'bold' }}>Punch In</TableCell>
                  <TableCell sx={{ bgcolor: '#f4f7f6', fontWeight: 'bold' }}>Punch Out</TableCell>
                  <TableCell sx={{ bgcolor: '#f4f7f6', fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.slice(0, 100).map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{row.empId}</TableCell>
                    <TableCell>{row.date ? dayjs(row.date).format('DD MMM YYYY') : '-'}</TableCell>
                    <TableCell>{row.punchIn ? dayjs(row.punchIn).format('hh:mm A') : '-'}</TableCell>
                    <TableCell>{row.punchOut ? dayjs(row.punchOut).format('hh:mm A') : '-'}</TableCell>
                    <TableCell>
                      <Box component="span" sx={{ 
                        px: 1.5, py: 0.5, borderRadius: 10, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                        bgcolor: row.status === 'present' ? '#e6fffa' : row.status === 'absent' ? '#fff5f5' : '#f0f4f8',
                        color: row.status === 'present' ? '#2c7a7b' : row.status === 'absent' ? '#c53030' : '#4a5568'
                      }}>
                        {row.status || 'Auto'}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {data.length > 100 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      Showing first 100 records...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleImport}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={24} color="inherit" /> : null}
            sx={{ 
                py: 2, borderRadius: 3, fontSize: '1.1rem', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                boxShadow: '0 4px 14px 0 rgba(17, 94, 89, 0.39)', bgcolor: '#115e59', '&:hover': { bgcolor: '#0d4a46' }
            }}
            fullWidth
          >
            {uploading ? 'Processing Data...' : 'Confirm and Import Attendance'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AttendanceExcelImport;
