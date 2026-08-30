import { Avatar, Box, Typography, FormControl, InputLabel, Select, MenuItem, TextField, OutlinedInput, InputAdornment, Button as MUIButton } from '@mui/material';
import { apiClient } from '../../../utils/apiClient';
import dayjs from 'dayjs';
import React, { useEffect, useState, useMemo } from 'react';
import DataTable from '@/components/common/DataTable';
import { Trash2, Edit2, User, AlertCircle, Filter, RotateCcw } from 'lucide-react';
import Adminleavemodal from './adminleavemodal';
import { useCustomStyles } from '../attandence/attandencehelper';
import CheckPermission from '../../../utils/CheckPermission';
import { toast } from '../../../utils/toast';
import { useSelector } from 'react-redux';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

const Adminleave = () => {
    const [rawLeaves, setRawLeaves] = useState([]);
    const [filterYear, setFilterYear] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [openmodal, setopenmodal] = useState(false);
    const [isload, setisload] = useState(false);
    const { department, branch } = useSelector((state) => state.user);
    const init = {
        leaveid: '',
        branch: '',
        employeename: '',
        from: '',
        showfrom: '',
        to: '',
        showto: '',
        reason: '',
        status: ''
    }
    const [inp, setInp] = useState(init);

    const canEdit = CheckPermission('leave', 3);
    const canDelete = CheckPermission('leave', 4);

    useEffect(() => {
        firstfetch();
    }, [])

    const firstfetch = async () => {
        try {
            const data = await apiClient({
                url: "fetchleave"
            });
            setRawLeaves(data.leave || []);
        } catch (err) {
            console.error('Error fetching leaves:', err);
        }
    }

    const filteredData = useMemo(() => {
        let sno = 1;
        return rawLeaves
            .filter(leave => {
                const leaveDate = dayjs(leave.fromDate);
                
                // Year Filter
                const yearMatch = filterYear === 'all' || leaveDate.year() === Number(filterYear);
                
                // Month Filter
                const monthMatch = filterMonth === 'all' || (leaveDate.month() + 1) === Number(filterMonth);
                
                // Date Range Filter
                let rangeMatch = true;
                if (startDate) {
                    rangeMatch = rangeMatch && (leaveDate.isSame(startDate, 'day') || leaveDate.isAfter(startDate, 'day'));
                }
                if (endDate) {
                    rangeMatch = rangeMatch && (leaveDate.isSame(endDate, 'day') || leaveDate.isBefore(endDate, 'day'));
                }

                return yearMatch && monthMatch && rangeMatch;
            })
            .map((leave) => {
                return {
                    id: leave._id,
                    sno: sno++,
                    name: (
                        <div className="flex items-center gap-3">
                            <Avatar
                                src={cloudinaryUrl(leave?.employeeId?.profileimage, {
                                    format: "webp",
                                    width: 100,
                                    height: 100,
                                })}
                                alt={leave?.employeeId?.employeeName || leave?.employeeId?.employeename}
                            >
                                {!leave.employeeId?.profileimage && <User size={16} />}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" className="font-bold">
                                    {leave.employeeId?.employeeName || leave.employeeId?.employeename}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                    ID: {leave.employeeId?.empId}
                                </Typography>
                            </Box>
                        </div>
                    ),
                    from: dayjs(leave.fromDate).format('DD MMM, YYYY'),
                    to: dayjs(leave.toDate).format('DD MMM, YYYY'),
                    reason: leave.reason,
                    status: (
                        <span className={`${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                            (leave.status === 'rejected' ? "bg-red-100 text-red-800" :
                                "bg-amber-100 text-amber-800")} px-3 py-1 rounded capitalize font-medium text-[12px]`}>
                            {leave.status}
                        </span>
                    ),
                    action: (
                        <div className="action flex gap-2.5 items-center">
                            {canEdit && <span className="edit text-teal-600 hover:text-teal-700 cursor-pointer p-1" title="Edit" onClick={() => edite(leave)}><Edit2 size={16} /></span>}
                            {canDelete && <span className="delete text-red-500 hover:text-red-600 cursor-pointer p-1" title="Delete" onClick={() => deletee(leave._id)}><Trash2 size={16} /></span>}
                        </div>
                    )
                };
            });
    }, [rawLeaves, filterYear, filterMonth, startDate, endDate, canEdit, canDelete]);

    const resetFilters = () => {
        setFilterYear('all');
        setFilterMonth('all');
        setStartDate('');
        setEndDate('');
    };

    const deletee = async (leaveid) => {
        swal({
            title: "Are you sure you want to Delete this record?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                try {
                    const data = await apiClient({
                        url: `leavehandle/${leaveid}`,
                        method: "DELETE"
                    });
                    firstfetch();
                    toast.success(data.message, { autoClose: 2000 })
                } catch (err) {
                    console.error('Error deleting leave:', err);
                }
            }
        });
    }

    const edite = (data) => {
        setInp({
            leaveid: data._id,
            branch: branch?.filter(e => e._id === data?.branchId)[0]?.name || 'N/A',
            employeename: data?.employeeId?.employeeName || data?.employeeId?.employeename,
            from: data.fromDate,
            to: data.toDate,
            showfrom: dayjs(data.fromDate).format('DD MMM, YYYY'),
            showto: dayjs(data.toDate).format('DD MMM, YYYY'),
            reason: data?.reason,
            status: data?.status,
        })
        setopenmodal(true);
    }

    const handleChange = (e, field) => {
        setInp({ ...inp, [field]: e.target.value })
    }

    return (
        <div className='max-w-6xl mx-auto p-2'>
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                    <FormControl size="small" className="w-[120px]">
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={filterYear}
                            input={<OutlinedInput startAdornment={<InputAdornment position="start"><Filter size={16} className="text-gray-400" /></InputAdornment>} label="Year" />}
                            onChange={e => setFilterYear(e.target.value)}
                        >
                            <MenuItem value="all">All Years</MenuItem>
                            {[...new Set(rawLeaves.map(l => dayjs(l.fromDate).year()))].sort().map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" className="w-[140px]">
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={filterMonth}
                            input={<OutlinedInput startAdornment={<InputAdornment position="start"><Filter size={16} className="text-gray-400" /></InputAdornment>} label="Month" />}
                            onChange={e => setFilterMonth(e.target.value)}
                        >
                            <MenuItem value="all">All Months</MenuItem>
                            {Array.from({ length: 12 }, (_, i) => (
                                <MenuItem key={i + 1} value={i + 1}>{dayjs().month(i).format("MMMM")}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        type="date"
                        label="From Date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        className="w-[150px]"
                    />

                    <TextField
                        size="small"
                        type="date"
                        label="To Date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        className="w-[150px]"
                    />

                    <MUIButton
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<RotateCcw size={16} />}
                        onClick={resetFilters}
                        className="h-[40px]"
                    >
                        Reset
                    </MUIButton>
                </div>
                
                <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                    Total Requests: <span className="text-teal-700 font-bold">{filteredData.length}</span>
                </div>
            </div>

            <DataTable
                customStyles={useCustomStyles()}
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                noDataComponent={
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                        <AlertCircle size={36} className="mb-2 opacity-30 text-amber-500" />
                        <p className="text-lg font-medium">No Leave Requests found</p>
                        <p className="text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                }
            />
            <Adminleavemodal firstfetch={firstfetch} handleChange={handleChange} inp={inp} isload={isload} init={init} setInp={setInp} openmodal={openmodal} setopenmodal={setopenmodal} />
        </div>
    )
}

export default Adminleave;

export const columns = [
    {
        name: "S.no",
        selector: (row) => row.sno,
        width: '60px'
    },
    {
        name: "Employee",
        selector: (row) => row.name,
        // width:'180px'
    },
    {
        name: "from",
        selector: (row) => row.from,
        width: '120px'
    },
    {
        name: "to",
        selector: (row) => row.to,
        width: '120px'
    },
    {
        name: "Reason",
        selector: (row) => row.reason
    },
    {
        name: "Status",
        selector: (row) => row.status,
        width: '120px',
    },
    {
        name: "Action",
        selector: (row) => row.action,
        width: '90px'
    }
]
