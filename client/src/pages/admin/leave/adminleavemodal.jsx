import React from 'react';
import Modalbox from '../../../components/custommodal/Modalbox';
import { Send, X } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';

// Custom UI Components
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const Adminleavemodal = ({ firstfetch, inp, openmodal, isload, handleChange, setopenmodal, setInp, init }) => {

    const adddepartcall = async (e) => {
        e.preventDefault();

        // Validation: Ensure status is either 'approved' or 'rejected'
        if (!inp.status || inp.status === 'pending') {
            return toast.warn("Please select a status (Approve or Reject) before updating.");
        }

        try {
            let url = "leavehandle";
            let method = "POST";
            
            // If approving, use specialized endpoint for policy balance deduction
            if (inp.status === 'approved') {
                url = `approve-leave/${inp.leaveid}`;
                method = "POST";
            }

            const data = await apiClient({
                url,
                method,
                body: inp
            });
            firstfetch();
            setopenmodal(false);
            setInp(init);
            toast.success(data.message || "Updated successfully", { autoClose: 2000 });
        } catch (err) {
            console.error('Error handling leave:', err);
            toast.error(err.message || "Failed to update leave");
        }
    };

    if (!openmodal) return null;

    return (
        <Modalbox open={openmodal} onClose={() => {
            setopenmodal(false); setInp(init);
        }}>
            <div className="w-full max-w-lg p-6 space-y-4">
                <form onSubmit={adddepartcall} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">Leave Management</h3>
                        <button
                            type="button"
                            onClick={() => { setopenmodal(false); setInp(init); }}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                                size="sm"
                                label="Branch"
                                value={inp.branch || ''}
                                readOnly
                            />
                            <Input
                                size="sm"
                                label="Employee Name"
                                value={inp.employeename || ''}
                                readOnly
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                                size="sm"
                                label="From"
                                value={inp.showfrom || ''}
                                readOnly
                            />
                            <Input
                                size="sm"
                                label="To"
                                value={inp.showto || ''}
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
                            <textarea
                                rows={2}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 resize-none transition-colors"
                                value={inp.reason || ''}
                                onChange={(e) => handleChange(e, 'reason')}
                            />
                        </div>

                        <Select
                            size="sm"
                            label="Status"
                            required
                            value={inp.status || ''}
                            onChange={(e) => handleChange(e, 'status')}
                            options={[
                                { value: 'approved', label: 'Approve' },
                                { value: 'rejected', label: 'Reject' }
                            ]}
                        />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setopenmodal(false);
                                setInp(init);
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            size="sm"
                            loading={isload}
                            icon={<Send size={14} />}
                            variant="primary"
                            type="submit"
                        >
                            Update
                        </Button>
                    </div>
                </form>
            </div>
        </Modalbox>
    );
};

export default Adminleavemodal;