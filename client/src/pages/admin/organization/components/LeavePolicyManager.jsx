import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, PlusCircle, CheckCircle, X } from 'lucide-react';
import { apiClient } from '../../../../utils/apiClient';
import { toast } from '../../../../utils/toast';
import { swal } from '../../../../utils/confirmDialog';

// Custom UI Components
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import NumberInput from '../../../../components/ui/NumberInput';
import Select from '../../../../components/ui/Select';

const LeavePolicyManager = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        name: '',
        allocationType: 'monthly',
        totalLeaves: 0,
        carryForward: {
            enabled: false,
            maxLimit: 0
        },
        encashable: false,
        probationRule: {
            allowed: false,
            afterDays: 0
        }
    });

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const data = await apiClient({ url: 'leave-policies' });
            setPolicies(data || []);
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleReset = () => {
        setForm({
            name: '',
            allocationType: 'monthly',
            totalLeaves: 0,
            carryForward: { enabled: false, maxLimit: 0 },
            encashable: false,
            probationRule: { allowed: false, afterDays: 0 }
        });
        setEditingPolicy(null);
        setShowForm(false);
    };

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setForm({
            name: policy.name,
            allocationType: policy.allocationType,
            totalLeaves: policy.totalLeaves,
            carryForward: policy.carryForward || { enabled: false, maxLimit: 0 },
            encashable: policy.encashable || false,
            probationRule: policy.probationRule || { allowed: false, afterDays: 0 }
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this policy!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                try {
                    await apiClient({
                        url: `leave-policies/${id}`,
                        method: 'DELETE'
                    });
                    toast.success('Policy Deleted');
                    fetchPolicies();
                } catch (error) {
                    console.error('Error deleting policy:', error);
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = editingPolicy ? 'PUT' : 'POST';
            const url = editingPolicy ? `leave-policies/${editingPolicy._id}` : 'leave-policies';
            
            await apiClient({
                url,
                method,
                body: form
            });

            toast.success(editingPolicy ? 'Policy Updated' : 'Policy Created');
            handleReset();
            fetchPolicies();
        } catch (error) {
            console.error('Error saving policy:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Leave Policies</h3>
                {!showForm && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        icon={<PlusCircle size={15} />} 
                        onClick={() => setShowForm(!showForm)}
                    >
                        Add Policy
                    </Button>
                )}
            </div>

            {showForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-800">
                        {editingPolicy ? 'Edit Leave Policy' : 'Create New Leave Policy'}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                            <div className="md:col-span-1">
                                <Input 
                                    label="Policy Name" 
                                    required 
                                    size="sm"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Casual Leave, Sick Leave"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Select
                                    size="sm"
                                    label="Allocation Cycle"
                                    value={form.allocationType}
                                    onChange={(e) => setForm({ ...form, allocationType: e.target.value })}
                                    options={[
                                        { value: "monthly", label: "Monthly" },
                                        { value: "quarterly", label: "Quarterly" },
                                        { value: "annually", label: "Annually" },
                                        { value: "biannually", label: "Bi-Annually" }
                                    ]}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <NumberInput 
                                    label="Total Leaves / Allocation" 
                                    required 
                                    size="sm"
                                    min={0}
                                    value={form.totalLeaves}
                                    onChange={(val) => setForm({ ...form, totalLeaves: val })}
                                />
                            </div>

                            {/* Carry forward card */}
                            <div className="md:col-span-1 border border-slate-200 bg-slate-50/70 p-3.5 rounded-xl space-y-2.5">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input 
                                        type="checkbox"
                                        checked={form.carryForward.enabled} 
                                        onChange={(e) => setForm({ 
                                            ...form, 
                                            carryForward: { ...form.carryForward, enabled: e.target.checked } 
                                        })} 
                                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Enable Carry Forward</span>
                                </label>
                                {form.carryForward.enabled && (
                                    <NumberInput
                                        size="sm"
                                        label="Max Carry Forward Limit"
                                        min={0}
                                        value={form.carryForward.maxLimit}
                                        onChange={(val) => setForm({ 
                                            ...form, 
                                            carryForward: { ...form.carryForward, maxLimit: val } 
                                        })}
                                    />
                                )}
                            </div>

                            {/* Probation rule card */}
                            <div className="md:col-span-1 border border-slate-200 bg-slate-50/70 p-3.5 rounded-xl space-y-2.5">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input 
                                        type="checkbox"
                                        checked={form.probationRule.allowed} 
                                        onChange={(e) => setForm({ 
                                            ...form, 
                                            probationRule: { ...form.probationRule, allowed: e.target.checked } 
                                        })} 
                                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Allowed during Probation</span>
                                </label>
                                {form.probationRule.allowed && (
                                    <NumberInput
                                        size="sm"
                                        label="Applicable After (Days)"
                                        min={0}
                                        value={form.probationRule.afterDays}
                                        onChange={(val) => setForm({ 
                                            ...form, 
                                            probationRule: { ...form.probationRule, afterDays: val } 
                                        })}
                                    />
                                )}
                            </div>

                            {/* Encashable */}
                            <div className="md:col-span-1 border border-slate-200 bg-slate-50/70 p-3.5 rounded-xl flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input 
                                        type="checkbox"
                                        checked={form.encashable} 
                                        onChange={(e) => setForm({ ...form, encashable: e.target.checked })} 
                                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Encashable</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                            <Button 
                                variant="outline" 
                                size="sm"
                                icon={<X size={14} />} 
                                onClick={handleReset}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                variant="primary" 
                                size="sm"
                                loading={loading}
                                icon={<CheckCircle size={14} />}
                            >
                                {editingPolicy ? 'Update Policy' : 'Create Policy'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="p-3">Policy Name</th>
                            <th className="p-3">Allocation</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Carry Fwd</th>
                            <th className="p-3">Probation</th>
                            <th className="p-3">Encash</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {policies.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-slate-400">
                                    No leave policies defined.
                                </td>
                            </tr>
                        ) : (
                            policies.map((policy) => (
                                <tr key={policy._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-semibold text-slate-800">{policy.name}</td>
                                    <td className="p-3 capitalize text-slate-600">{policy.allocationType}</td>
                                    <td className="p-3 font-bold text-slate-900">{policy.totalLeaves}</td>
                                    <td className="p-3">
                                        {policy.carryForward?.enabled ? (
                                            <span className="text-emerald-700 font-medium">Yes (Max: {policy.carryForward.maxLimit})</span>
                                        ) : (
                                            <span className="text-slate-400">No</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-slate-600">
                                        {policy.probationRule?.allowed ? `After ${policy.probationRule.afterDays}d` : 'Immediate'}
                                    </td>
                                    <td className="p-3">
                                        {policy.encashable ? (
                                            <span className="text-emerald-700 font-medium">Yes</span>
                                        ) : (
                                            <span className="text-slate-400">No</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            <button 
                                                type="button"
                                                onClick={() => handleEdit(policy)} 
                                                className="p-1 rounded text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleDelete(policy._id)} 
                                                className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeavePolicyManager;
