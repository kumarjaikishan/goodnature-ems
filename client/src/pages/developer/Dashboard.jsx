import { apiClient } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import dayjs from 'dayjs';
import { Plus, Flag, Edit2, Trash2, Info, MessageSquareWarning } from "lucide-react";
import { toast } from '../../utils/toast';
import { swal } from '../../utils/confirmDialog';
import DeveloperEsslMonitor from './DeveloperEsslMonitor';
import Modalbox from '../../components/custommodal/Modalbox';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const DeveloperDashboard = () => {
    useEffect(() => {
        fetche();
    }, []);

    const init = {
        userid: '',
        name: '',
        email: '',
        password: ''
    };
    const [users, setusers] = useState([]);
    const [passmodal, setpassmodal] = useState(false);
    const [inp, setinp] = useState(init);
    const [isedit, setisedit] = useState(false);
    const [isloading, setisloading] = useState(false);

    const [demoModal, setDemoModal] = useState(false);
    const [demoInp, setDemoInp] = useState({
        companyId: "",
        name: "",
        email: "",
        password: "",
    });
    const [demoListModal, setDemoListModal] = useState(false);
    const [demoList, setDemoList] = useState([]);

    const fetche = async () => {
        try {
            const data = await apiClient({
                url: "developerfetch"
            });
            setusers(data.users);
        } catch (error) {
            console.error('Error fetching developer data:', error);
        }
    };

    const adduser = async (e) => {
        e.preventDefault();
        try {
            const data = await apiClient({
                url: "User",
                method: "POST",
                body: inp
            });
            setpassmodal(false);
            fetche();
            toast.success(data.message, { autoClose: 1800 });
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    const edite = (user) => {
        setinp({
            userid: user?._id,
            name: user?.registeredName,
            email: user?.email,
        });
        setisedit(true);
        setpassmodal(true);
    };

    const deletee = (userid) => {
        swal({
            title: 'Are you sure?',
            text: 'Once deleted, you will not be able to recover this',
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                try {
                    const data = await apiClient({
                        url: `User/${userid}`,
                        method: "DELETE"
                    });

                    fetche();
                    toast.success(data.message, { autoClose: 1800 });
                } catch (error) {
                    console.error('Error deleting user:', error);
                }
            }
        });
    };

    const saveedit = async () => {
        try {
            const data = await apiClient({
                url: `User/${inp.userid}`,
                method: "PUT",
                body: { name: inp.name, email: inp.email }
            });
            setpassmodal(false);
            fetche();
            toast.success(data.message, { autoClose: 1800 });
        } catch (error) {
            console.error('Error saving user edit:', error);
        }
    };

    const deploy = async (project) => {
        swal({
            title: `Are you sure you want to Deploy ${project}?`,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (proceed) => {
            if (proceed) {
                setisloading(true);
                const toastId = toast.loading(`Deploying ${project}...`);

                try {
                    const data = await apiClient({
                        url: `deploy/${project}`,
                        method: "GET"
                    });

                    toast.update(toastId, {
                        render: data.message,
                        type: "success",
                        isLoading: false,
                        autoClose: 1800,
                    });
                } catch (error) {
                    toast.update(toastId, {
                        render: error.message || "Error during deployment",
                        type: "error",
                        isLoading: false,
                        autoClose: 3000,
                    });
                    console.error('Deployment error:', error);
                } finally {
                    setisloading(false);
                }
            }
        });
    };

    const cancel = () => {
        setpassmodal(false);
        setinp(init);
        setisedit(false);
    };

    const handleCreateDemo = (user) => {
        setDemoInp({ companyId: user?.companyId, name: "", email: "", password: "" });
        setDemoModal(true);
    };

    const handleShowDemos = async (user) => {
        try {
            const data = await apiClient({
                url: `demo/${user.companyId}`
            });

            setDemoList(data.demousers || []);
            setDemoListModal(true);
        } catch (error) {
            console.error('Error fetching demos:', error);
        }
    };

    const demodelete = async (userid) => {
        try {
            const data = await apiClient({
                url: `demo/${userid}`,
                method: "DELETE"
            });
            toast.success(data.message);
            setDemoList(prev => prev.filter(d => d._id !== userid));
        } catch (error) {
            console.error('Error deleting demo:', error);
        }
    };

    const columns = [
        {
            name: "S.No",
            selector: (row, index) => index + 1,
            width: "60px",
        },
        {
            name: "Name",
            selector: (row) => row?.registeredName ?? '',
            width: "160px",
        },
        {
            name: "Email",
            selector: (row) => row.email,
        },
        {
            name: "Date",
            selector: (row) => dayjs(row.createdAt).format("DD MMM, YY"),
            width: "100px",
        },
        {
            name: "Status",
            selector: (row) => row.stat || "-",
            width: "110px",
        },
        {
            name: "Action",
            width: "140px",
            cell: (row) => (
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="text-teal-600 hover:text-teal-800 p-1 cursor-pointer transition"
                        title="Info"
                        onClick={() => handleShowDemos(row)}
                    >
                        <Info size={16} />
                    </button>
                    <button
                        type="button"
                        className="text-amber-600 hover:text-amber-800 p-1 cursor-pointer transition"
                        title="Create Demo"
                        onClick={() => handleCreateDemo(row)}
                    >
                        <Flag size={16} />
                    </button>
                    <button
                        type="button"
                        className="text-teal-700 hover:text-teal-900 p-1 cursor-pointer transition"
                        title="Edit"
                        onClick={() => edite(row)}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        type="button"
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition"
                        title="Delete"
                        onClick={() => deletee(row._id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className='flex flex-wrap justify-end gap-2'>
                <Button
                    variant="secondary"
                    loading={isloading}
                    onClick={() => deploy('accusoft')}
                >
                    Deploy Accusoft
                </Button>
                <Button
                    variant="secondary"
                    loading={isloading}
                    onClick={() => deploy('battlefiesta')}
                >
                    Deploy Battlefiesta
                </Button>
                <Button
                    variant="secondary"
                    loading={isloading}
                    onClick={() => deploy('office')}
                >
                    Deploy EMS
                </Button>
                <Button
                    variant="secondary"
                    loading={isloading}
                    onClick={() => deploy('portfolio')}
                >
                    Deploy Portfolio
                </Button>
                <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => setpassmodal(true)}
                >
                    Add User
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                <DataTable
                    columns={columns}
                    data={users}
                    pagination
                    customStyles={useCustomStyles()}
                    highlightOnHover
                    noDataComponent={
                        <div className="flex items-center gap-2 py-6 text-center text-slate-500 text-sm font-medium">
                            <MessageSquareWarning size={18} /> No records found matching your criteria.
                        </div>
                    }
                />
            </div>

            {/* Modal - User create/edit */}
            <Modalbox open={passmodal} onClose={cancel}>
                <div className="w-[450px] max-w-[92vw] p-6 bg-white rounded-2xl">
                    <form onSubmit={isedit ? (e) => { e.preventDefault(); saveedit(); } : adduser} className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">{isedit ? "Edit User" : "Add New User"}</h2>
                            <button type="button" onClick={cancel} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>
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
                        {!isedit && (
                            <Input
                                required
                                type="password"
                                label="Password"
                                value={inp.password}
                                onChange={(e) => setinp({ ...inp, password: e.target.value })}
                                placeholder="Enter password"
                            />
                        )}
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <Button variant="secondary" onClick={cancel}>Cancel</Button>
                            <Button variant="primary" type="submit">
                                {isedit ? "Save Changes" : "Add User"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modalbox>

            {/* Modal - Create Demo */}
            <Modalbox open={demoModal} onClose={() => setDemoModal(false)}>
                <div className="w-[400px] max-w-[92vw] p-6 bg-white rounded-2xl">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const data = await apiClient({
                                    url: "demo",
                                    method: "POST",
                                    body: demoInp
                                });
                                toast.success(data.message, { autoClose: 2000 });
                                setDemoModal(false);
                            } catch (err) {
                                console.error('Error creating demo:', err);
                            }
                        }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">Create Demo Account</h2>
                            <button type="button" onClick={() => setDemoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>
                        <Input
                            label="Company ID"
                            value={demoInp.companyId}
                            disabled
                        />
                        <Input
                            required
                            label="Demo Name"
                            value={demoInp.name}
                            onChange={(e) => setDemoInp({ ...demoInp, name: e.target.value })}
                            placeholder="e.g. Demo Admin"
                        />
                        <Input
                            required
                            type="email"
                            label="Demo Email"
                            value={demoInp.email}
                            onChange={(e) => setDemoInp({ ...demoInp, email: e.target.value })}
                            placeholder="demo@goodnature.com"
                        />
                        <Input
                            required
                            type="password"
                            label="Password"
                            value={demoInp.password}
                            onChange={(e) => setDemoInp({ ...demoInp, password: e.target.value })}
                            placeholder="Enter password"
                        />
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                            <Button variant="secondary" onClick={() => setDemoModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Create Demo</Button>
                        </div>
                    </form>
                </div>
            </Modalbox>

            {/* Modal - View Demos List */}
            <Modalbox open={demoListModal} onClose={() => setDemoListModal(false)}>
                <div className="w-[500px] max-w-[92vw] p-6 bg-white rounded-2xl space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-800">Active Demo Accounts</h2>
                        <button type="button" onClick={() => setDemoListModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                    </div>
                    {demoList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">No demo accounts found for this company.</p>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {demoList.map(demo => (
                                <div key={demo._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{demo.name || demo.email}</p>
                                        <p className="text-[11px] text-slate-500 font-mono">{demo.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => demodelete(demo._id)}
                                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modalbox>

            {/* Developer ESSL Biometric Monitoring Component */}
            <DeveloperEsslMonitor />
        </div>
    );
};

export default DeveloperDashboard;
