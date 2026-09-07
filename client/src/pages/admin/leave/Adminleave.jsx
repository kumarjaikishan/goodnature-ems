import { apiClient } from '../../../utils/apiClient';
import dayjs from 'dayjs';
import React, { useEffect, useState, useMemo } from 'react';
import DataTable from '@/components/common/DataTable';
import { Trash2, Edit2, User, AlertCircle, RotateCcw } from 'lucide-react';
import Adminleavemodal from './adminleavemodal';
import { useCustomStyles } from '../attandence/attandencehelper';
import CheckPermission from '../../../utils/CheckPermission';
import { toast } from '../../../utils/toast';
import { useSelector } from 'react-redux';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import { swal } from '../../../utils/confirmDialog';

// Custom UI Components
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import DateInput from '../../../components/ui/DateInput';

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
    };
    const [inp, setInp] = useState(init);

    const canEdit = CheckPermission('leave', 3);
    const canDelete = CheckPermission('leave', 4);

    useEffect(() => {
        firstfetch();
    }, []);

    const firstfetch = async () => {
        try {
            const data = await apiClient({
                url: "fetchleave"
            });
            setRawLeaves(data.leave || []);
        } catch (err) {
            console.error('Error fetching leaves:', err);
        }
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
                    toast.success(data.message, { autoClose: 2000 });
                } catch (err) {
                    console.error('Error deleting leave:', err);
                }
            }
        });
    };

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
        });
        setopenmodal(true);
    };

    const handleChange = (e, field) => {
        setInp({ ...inp, [field]: e.target.value });
    };

    const filteredData = useMemo(() => {
        let sno = 1;
        return rawLeaves
            .filter(leave => {
                const leaveDate = dayjs(leave.fromDate);
                
                const yearMatch = filterYear === 'all' || leaveDate.year() === Number(filterYear);
                const monthMatch = filterMonth === 'all' || (leaveDate.month() + 1) === Number(filterMonth);
                
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
                        <div className="flex items-center gap-3 py-1">
                            {leave?.employeeId?.profileimage ? (
                                <img
                                    src={cloudinaryUrl(leave?.employeeId?.profileimage, {
                                        format: "webp",
                                        width: 100,
                                        height: 100,
                                    })}
                                    alt={leave?.employeeId?.employeeName || leave?.employeeId?.employeename}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-200">
                                    {(leave?.employeeId?.employeeName || leave?.employeeId?.employeename)?.charAt(0)?.toUpperCase() || <User size={14} />}
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-slate-800">
                                    {leave.employeeId?.employeeName || leave.employeeId?.employeename}
                                </p>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    ID: {leave.employeeId?.empId}
                                </span>
                            </div>
                        </div>
                    ),
                    from: dayjs(leave.fromDate).format('DD MMM, YYYY'),
                    to: dayjs(leave.toDate).format('DD MMM, YYYY'),
                    reason: leave.reason,
                    status: (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            (leave.status === 'rejected' ? "bg-rose-100 text-rose-800 border border-rose-200" :
                                "bg-amber-100 text-amber-800 border border-amber-200")}`}>
                            {leave.status}
                        </span>
                    ),
                    action: (
                        <div className="action flex gap-1.5 items-center">
                            {canEdit && (
                                <button
                                    type="button"
                                    className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors"
                                    title="Edit"
                                    onClick={() => edite(leave)}
                                >
                                    <Edit2 size={15} />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    type="button"
                                    className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                                    title="Delete"
                                    onClick={() => deletee(leave._id)}
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
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

    const uniqueYears = useMemo(() => {
        return [...new Set(rawLeaves.map(l => dayjs(l.fromDate).year()))].sort((a, b) => b - a);
    }, [rawLeaves]);

    return (
        <div className='max-w-6xl mx-auto space-y-4'>
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap flex-1">
                    <div className="w-full sm:w-[130px]">
                        <Select
                            size="sm"
                            label="Year"
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            options={[
                                { value: "all", label: "All Years" },
                                ...uniqueYears.map(y => ({ value: y.toString(), label: y.toString() }))
                            ]}
                        />
                    </div>

                    <div className="w-full sm:w-[140px]">
                        <Select
                            size="sm"
                            label="Month"
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                            options={[
                                { value: "all", label: "All Months" },
                                ...Array.from({ length: 12 }, (_, i) => ({
                                    value: (i + 1).toString(),
                                    label: dayjs().month(i).format("MMMM")
                                }))
                            ]}
                        />
                    </div>

                    <div className="w-full sm:w-[150px]">
                        <DateInput
                            size="sm"
                            label="From Date"
                            value={startDate}
                            onChange={val => setStartDate(val)}
                        />
                    </div>

                    <div className="w-full sm:w-[150px]">
                        <DateInput
                            size="sm"
                            label="To Date"
                            value={endDate}
                            onChange={val => setEndDate(val)}
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="border border-slate-200 text-slate-600"
                        icon={<RotateCcw size={14} />}
                        onClick={resetFilters}
                    >
                        Reset
                    </Button>
                </div>
                
                <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    Total Requests: <span className="text-teal-700 font-bold">{filteredData.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <DataTable
                    customStyles={useCustomStyles()}
                    columns={columns}
                    data={filteredData}
                    pagination
                    highlightOnHover
                    noDataComponent={
                        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                            <AlertCircle size={28} className="text-slate-400 mb-2" />
                            <p className="text-sm font-medium">No leave requests found</p>
                            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or date range</p>
                        </div>
                    }
                />
            </div>

            <Adminleavemodal 
                firstfetch={firstfetch} 
                handleChange={handleChange} 
                inp={inp} 
                isload={isload} 
                init={init} 
                setInp={setInp} 
                openmodal={openmodal} 
                setopenmodal={setopenmodal} 
            />
        </div>
    );
};

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
    },
    {
        name: "From",
        selector: (row) => row.from,
        width: '120px'
    },
    {
        name: "To",
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
        width: '130px',
    },
    {
        name: "Action",
        selector: (row) => row.action,
        width: '90px'
    }
];
