import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import { toast } from '../../../utils/toast';
import { Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useCustomStyles } from '../../admin/attandence/attandencehelper';
import { empFirstFetch } from '../../../../store/employee';
import { useApi } from '../../../utils/useApi';
import { apiClient } from '../../../utils/apiClient';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DateInput from '@/components/ui/DateInput';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const EmpLeave = () => {
    const init = {
        policyId: '',
        fromDate: '',
        toDate: '',
        reason: ''
    };
    const dispatch = useDispatch();
    const [inp, setinp] = useState(init);
    const [leaverequest, setleaverequest] = useState([]);
    const [policies, setPolicies] = useState([]);
    const { leave } = useSelector((state) => state.employee);
    const [openmodal, setopenmodal] = useState(false);
    const { request, loading } = useApi();

    const changehandle = (value, field) => {
        setinp(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (leave) {
            setleaverequest(leave);
        }
        fetchPolicies();
    }, [leave]);

    const fetchPolicies = async () => {
        try {
            const data = await apiClient({ url: "leave-policies" });
            setPolicies(data || []);
        } catch (err) {
            console.error("Error fetching policies:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inp.fromDate) return toast.warn('From Date is required');
        try {
            const payload = {
                ...inp,
                fromDate: inp.fromDate,
                toDate: inp.toDate || inp.fromDate,
            };
            const data = await request({
                url: "addleave",
                method: "POST",
                body: payload
            });

            setopenmodal(false);
            dispatch(empFirstFetch());
            setinp(init);
            toast.success(data.message || "Leave application submitted!", { autoClose: 2000 });
        } catch (err) {
            console.error("Error applying leave:", err);
            toast.error(err.message || "Failed to apply for leave");
        }
    };

    const policyOptions = policies.map(p => ({
        label: `${p.name} (${p.allocationType || 'Policy'})`,
        value: p._id
    }));

    return (
        <div className='p-2 md:p-6 space-y-4 max-w-7xl mx-auto'>
            <div className='flex justify-between items-center pb-2 border-b border-slate-100'>
                <div>
                    <h3 className="text-base font-bold text-slate-800">My Leave Applications</h3>
                    <p className="text-xs text-slate-500">Track and apply for annual, sick, or casual leaves</p>
                </div>
                <Button
                    variant='primary'
                    size="sm"
                    startIcon={Plus}
                    onClick={() => setopenmodal(true)}
                >
                    Apply Leave
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <DataTable
                    customStyles={useCustomStyles()}
                    columns={columns}
                    data={leaverequest}
                    pagination
                    highlightOnHover
                />
            </div>

            {/* Apply Leave Modal */}
            <Modal
                open={openmodal}
                onClose={() => {
                    setopenmodal(false);
                    setinp(init);
                }}
                title="Apply for Leave"
                subtitle="Submit your leave application for manager approval"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Leave Policy"
                        required
                        placeholder="Select leave type..."
                        options={policyOptions}
                        value={inp.policyId}
                        onChange={(e) => changehandle(e.target.value, "policyId")}
                    />

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <DateInput
                            label="From Date"
                            required
                            value={inp.fromDate}
                            onChange={(e) => changehandle(e.target.value, 'fromDate')}
                        />

                        <DateInput
                            label="To Date"
                            value={inp.toDate}
                            min={inp.fromDate}
                            onChange={(e) => changehandle(e.target.value, 'toDate')}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700 tracking-wide">
                            Reason for Leave <span className="text-red-500 font-bold">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="State reason for absence..."
                            className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
                            value={inp.reason}
                            onChange={(e) => changehandle(e.target.value, 'reason')}
                        />
                    </div>

                    <div className='flex justify-end gap-2 pt-4 border-t border-slate-100'>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setopenmodal(false); setinp(init); }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            Submit Application
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EmpLeave;

export const columns = [
    {
        name: "From",
        selector: (row) => dayjs(row.fromDate).format('DD MMM YYYY'),
        sortable: true,
        width: '130px'
    },
    {
        name: "To",
        selector: (row) => dayjs(row.toDate).format('DD MMM YYYY'),
        sortable: true,
        width: '130px'
    },
    {
        name: "Policy Type",
        selector: (row) => row.policyId?.name || "General Leave",
        sortable: true,
        width: '150px'
    },
    {
        name: "Reason",
        selector: (row) => row.reason,
        wrap: true
    },
    {
        name: "Status",
        selector: (row) => row.status,
        width: '120px',
        cell: (row) => {
            const variant = row.status === 'approved'
                ? 'success'
                : row.status === 'rejected'
                    ? 'danger'
                    : 'warning';
            return (
                <Badge variant={variant} size="sm">
                    {row.status}
                </Badge>
            );
        }
    },
];
