import React from 'react';
import Modalbox from '../../../components/custommodal/Modalbox';
import { Send } from 'lucide-react';
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
        <Modalbox
            open={openmodal}
            onClose={() => {
                setopenmodal(false);
                setInp(init);
            }}
            title="Leave Management"
            subtitle={`Review and process leave request for ${inp.employeename || 'Employee'}`}
            size="md"
            footer={
                <>
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
                        form="admin-leave-form"
                    >
                        Update
                    </Button>
                </>
            }
        >
            <form id="admin-leave-form" onSubmit={adddepartcall} className="space-y-3.5 text-xs">
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
                        label="From Date"
                        value={inp.showfrom || ''}
                        readOnly
                    />
                    <Input
                        size="sm"
                        label="To Date"
                        value={inp.showto || ''}
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave</label>
                    <textarea
                        rows={2}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 placeholder:text-slate-400 resize-none transition-colors"
                        value={inp.reason || ''}
                        onChange={(e) => handleChange(e, 'reason')}
                        placeholder="Leave reason..."
                    />
                </div>

                <Select
                    size="sm"
                    label="Action / Status"
                    required
                    value={inp.status || ''}
                    onChange={(e) => handleChange(e, 'status')}
                    options={[
                        { value: 'approved', label: 'Approve' },
                        { value: 'rejected', label: 'Reject' }
                    ]}
                />
            </form>
        </Modalbox>
    );
};

export default Adminleavemodal;