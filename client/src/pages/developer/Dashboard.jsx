import { apiClient } from '../../utils/apiClient';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import dayjs from 'dayjs';
import {
    Plus,
    Flag,
    Edit2,
    Trash2,
    Info,
    MessageSquareWarning,
    ShieldAlert,
    Gauge,
    KeyRound,
    Building2,
    RefreshCw
} from 'lucide-react';
import { toast } from '../../utils/toast';
import { swal } from '../../utils/confirmDialog';
import DeveloperEsslMonitor from './DeveloperEsslMonitor';
import Modalbox from '../../components/custommodal/Modalbox';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const DeveloperDashboard = () => {
    const init = {
        userid: '',
        name: '',
        email: '',
        password: ''
    };

    const [users, setusers] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passmodal, setpassmodal] = useState(false);
    const [inp, setinp] = useState(init);
    const [isedit, setisedit] = useState(false);

    const [demoModal, setDemoModal] = useState(false);
    const [demoInp, setDemoInp] = useState({
        companyId: '',
        name: '',
        email: '',
        password: '',
    });
    const [demoListModal, setDemoListModal] = useState(false);
    const [demoList, setDemoList] = useState([]);

    const [systemStats, setSystemStats] = useState({
        errorCount: 0,
        avgLatencyMs: null,
        totalRequests: 0,
    });

    const customStyles = useCustomStyles();

    const fetche = useCallback(async () => {
        setTableLoading(true);
        try {
            const [usersRes, errorsRes, apiStatsRes] = await Promise.allSettled([
                apiClient({ url: 'developerfetch' }),
                apiClient({ url: 'developer/errors' }),
                apiClient({ url: 'api-monitor/stats' }),
            ]);

            if (usersRes.status === 'fulfilled') {
                setusers(usersRes.value.users || []);
            } else {
                toast.error(usersRes.reason?.message || 'Failed to load superadmin accounts');
            }

            setSystemStats({
                errorCount: errorsRes.status === 'fulfilled' ? (errorsRes.value.count ?? errorsRes.value.errors?.length ?? 0) : 0,
                avgLatencyMs: apiStatsRes.status === 'fulfilled' ? (apiStatsRes.value.summary?.avgDurationMs ?? null) : null,
                totalRequests: apiStatsRes.status === 'fulfilled' ? (apiStatsRes.value.summary?.totalRequests ?? 0) : 0,
            });
        } catch (error) {
            toast.error(error.message || 'Failed to load developer dashboard');
        } finally {
            setTableLoading(false);
        }
    }, []);

    useEffect(() => {
        fetche();
    }, [fetche]);

    const adduser = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await apiClient({
                url: 'User',
                method: 'POST',
                body: inp
            });
            setpassmodal(false);
            setinp(init);
            fetche();
            toast.success(data.message, { autoClose: 1800 });
        } catch (error) {
            toast.error(error.message || 'Failed to create superadmin user');
        } finally {
            setSaving(false);
        }
    };

    const edite = useCallback((user) => {
        setinp({
            userid: user?._id,
            name: user?.registeredName || user?.name || '',
            email: user?.email || '',
            password: ''
        });
        setisedit(true);
        setpassmodal(true);
    }, []);

    const saveedit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = { name: inp.name, email: inp.email };
            if (inp.password?.trim()) {
                body.password = inp.password.trim();
            }
            const data = await apiClient({
                url: `User/${inp.userid}`,
                method: 'PUT',
                body
            });
            setpassmodal(false);
            setinp(init);
            setisedit(false);
            fetche();
            toast.success(data.message, { autoClose: 1800 });
        } catch (error) {
            toast.error(error.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setpassmodal(false);
        setinp(init);
        setisedit(false);
    };

    const handleCreateDemo = useCallback((user) => {
        setDemoInp({ companyId: user?.companyId, name: '', email: '', password: '' });
        setDemoModal(true);
    }, []);

    const handleSaveDemo = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await apiClient({
                url: 'demo',
                method: 'POST',
                body: demoInp
            });
            toast.success(data.message || 'Demo user created');
            setDemoModal(false);
            setDemoInp({ companyId: '', name: '', email: '', password: '' });
        } catch (error) {
            toast.error(error.message || 'Failed to create demo user');
        } finally {
            setSaving(false);
        }
    };

    const handleShowDemos = useCallback(async (user) => {
        try {
            const data = await apiClient({
                url: `demo/${user.companyId}`
            });
            setDemoList(data.demousers || []);
            setDemoListModal(true);
        } catch (error) {
            toast.error(error.message || 'Failed to load demo users');
        }
    }, []);

    const demodelete = (userid) => {
        swal({
            title: 'Delete this demo user?',
            text: 'This will permanently remove the demo login.',
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                try {
                    const data = await apiClient({
                        url: `demo/${userid}`,
                        method: 'DELETE'
                    });
                    toast.success(data.message);
                    setDemoList((prev) => prev.filter((d) => d._id !== userid));
                } catch (error) {
                    toast.error(error.message || 'Failed to delete demo user');
                }
            }
        });
    };

    const columns = useMemo(() => [
        {
            name: 'S.No',
            selector: (_row, index) => index + 1,
            width: '60px',
        },
        {
            name: 'Name',
            selector: (row) => row?.registeredName || row?.name || '',
            sortable: true,
            width: '180px',
        },
        {
            name: 'Email',
            selector: (row) => row.email,
            sortable: true,
        },
        {
            name: 'Date',
            selector: (row) => dayjs(row.createdAt).format('DD MMM, YY'),
            sortable: true,
            width: '110px',
        },
        {
            name: 'Status',
            selector: (row) => row.stat || '-',
            width: '110px',
        },
        {
            name: 'Action',
            width: '120px',
            cell: (row) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="text-teal-600 hover:text-teal-800 p-1 cursor-pointer transition"
                        title="View Demo Users"
                        onClick={() => handleShowDemos(row)}
                    >
                        <Info size={16} />
                    </button>
                    <button
                        type="button"
                        className="text-amber-600 hover:text-amber-800 p-1 cursor-pointer transition"
                        title="Create Demo User"
                        onClick={() => handleCreateDemo(row)}
                    >
                        <Flag size={16} />
                    </button>
                    <button
                        type="button"
                        className="text-teal-700 hover:text-teal-900 p-1 cursor-pointer transition"
                        title="Edit Superadmin"
                        onClick={() => edite(row)}
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
            ),
        },
    ], [edite, handleCreateDemo, handleShowDemos]);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
            {/* System Overview Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Superadmins</p>
                        <p className="text-xl font-bold text-slate-800 mt-0.5">{users.length}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                        <Building2 size={18} />
                    </div>
                </div>

                <Link
                    to="/dashboard/error-logs"
                    className="bg-white border border-slate-200 hover:border-rose-300 rounded-xl p-4 flex items-center justify-between transition"
                >
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Runtime Errors</p>
                        <p className={`text-xl font-bold mt-0.5 ${systemStats.errorCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {systemStats.errorCount}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                        <ShieldAlert size={18} />
                    </div>
                </Link>

                <Link
                    to="/dashboard/api-monitor"
                    className="bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-4 flex items-center justify-between transition"
                >
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">API Latency</p>
                        <p className="text-xl font-bold text-slate-800 mt-0.5">
                            {systemStats.avgLatencyMs != null ? `${Math.round(systemStats.avgLatencyMs)}ms` : '—'}
                        </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                        <Gauge size={18} />
                    </div>
                </Link>

                <Link
                    to="/dashboard/permission"
                    className="bg-white border border-slate-200 hover:border-teal-300 rounded-xl p-4 flex items-center justify-between transition"
                >
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Access Control</p>
                        <p className="text-sm font-semibold text-teal-700 mt-1">Manage Permissions →</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                        <KeyRound size={18} />
                    </div>
                </Link>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm font-bold text-slate-800">Company Superadmin Accounts</h2>
                    <p className="text-xs text-slate-500">Manage superadmin logins and associated demo accounts</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw size={14} />}
                        onClick={fetche}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={15} />}
                        onClick={() => {
                            setisedit(false);
                            setinp(init);
                            setpassmodal(true);
                        }}
                    >
                        Add User
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <DataTable
                    columns={columns}
                    data={users}
                    progressPending={tableLoading}
                    pagination
                    customStyles={customStyles}
                    highlightOnHover
                    noDataComponent={
                        <div className="flex items-center gap-2 py-8 text-center text-slate-500 text-sm font-medium">
                            <MessageSquareWarning size={18} /> No superadmin accounts found.
                        </div>
                    }
                />
            </div>

            {/* Modal - User create/edit */}
            <Modalbox
                open={passmodal}
                onClose={cancel}
                title={isedit ? 'Edit Superadmin User' : 'Add Superadmin User'}
                subtitle={isedit ? 'Update account details or leave password blank to keep current' : 'Creates a new superadmin and company workspace'}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={cancel}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="dev-user-form"
                            variant="primary"
                            size="sm"
                            loading={saving}
                        >
                            {isedit ? 'Save Changes' : 'Add User'}
                        </Button>
                    </>
                }
            >
                <form id="dev-user-form" onSubmit={isedit ? saveedit : adduser} className="space-y-4">
                    <Input
                        required
                        label="Name"
                        value={inp.name}
                        onChange={(e) => setinp({ ...inp, name: e.target.value })}
                        placeholder="Full name"
                    />
                    <Input
                        required
                        type="email"
                        label="Email"
                        value={inp.email}
                        onChange={(e) => setinp({ ...inp, email: e.target.value })}
                        placeholder="user@example.com"
                    />
                    <Input
                        required={!isedit}
                        type="password"
                        label={isedit ? 'New Password (Optional)' : 'Password'}
                        value={inp.password}
                        onChange={(e) => setinp({ ...inp, password: e.target.value })}
                        placeholder={isedit ? 'Leave blank to keep unchanged' : 'Enter password'}
                    />
                </form>
            </Modalbox>

            {/* Modal - Create Demo User */}
            <Modalbox
                open={demoModal}
                onClose={() => setDemoModal(false)}
                title="Create Demo User"
                subtitle="Create a read-only demo account linked to this company"
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDemoModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="dev-demo-form"
                            variant="primary"
                            size="sm"
                            loading={saving}
                        >
                            Create Demo
                        </Button>
                    </>
                }
            >
                <form id="dev-demo-form" onSubmit={handleSaveDemo} className="space-y-4">
                    <Input
                        required
                        label="Name"
                        value={demoInp.name}
                        onChange={(e) => setDemoInp({ ...demoInp, name: e.target.value })}
                        placeholder="Demo User Name"
                    />
                    <Input
                        required
                        type="email"
                        label="Email"
                        value={demoInp.email}
                        onChange={(e) => setDemoInp({ ...demoInp, email: e.target.value })}
                        placeholder="demo@example.com"
                    />
                    <Input
                        required
                        type="password"
                        label="Password"
                        value={demoInp.password}
                        onChange={(e) => setDemoInp({ ...demoInp, password: e.target.value })}
                        placeholder="Enter password"
                    />
                </form>
            </Modalbox>

            {/* Modal - Demo Users List */}
            <Modalbox
                open={demoListModal}
                onClose={() => setDemoListModal(false)}
                title="Demo Users"
                subtitle={`${demoList.length} demo account${demoList.length !== 1 ? 's' : ''} linked to this company`}
                maxWidth="max-w-lg"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setDemoListModal(false)}>
                        Close
                    </Button>
                }
            >
                {demoList.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-6">No demo users found for this company.</p>
                ) : (
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {demoList.map((d) => (
                            <div key={d._id} className="flex items-center justify-between py-2.5 px-1 hover:bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-xs font-semibold text-slate-800">{d.name}</p>
                                    <p className="text-[11px] text-slate-500">{d.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => demodelete(d._id)}
                                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition"
                                    title="Delete Demo User"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Modalbox>

            {/* Live Biometric ESSL Device Monitor */}
            <DeveloperEsslMonitor />
        </div>
    );
};

export default DeveloperDashboard;
