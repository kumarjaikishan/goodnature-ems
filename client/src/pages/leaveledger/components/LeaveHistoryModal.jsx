import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/apiClient';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Loader from '@/utils/loader';

const LeaveHistoryModal = ({ open, onClose, employee }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && employee?._id) {
            fetchHistory();
        }
    }, [open, employee]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await apiClient({ 
                url: `leave-transactions/${employee._id}` 
            });
            setTransactions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching leave history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeVariant = (type) => {
        switch (type) {
            case 'credit': return 'success';
            case 'debit': return 'danger';
            case 'adjustment': return 'warning';
            default: return 'neutral';
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Leave Audit Log"
            subtitle={`Transaction history for ${employee?.userid?.name || 'employee'}`}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-4">
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-medium text-sm">
                        No transactions recorded for this employee.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-slate-50">
                                <tr>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3">Leaves</th>
                                    <th className="py-2.5 px-3">Policy / Reason</th>
                                    <th className="py-2.5 px-3">Source</th>
                                    <th className="py-2.5 px-3">Logged By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50/60">
                                        <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                                            {dayjs(t.createdAt).format('DD MMM YYYY, hh:mm A')}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <Badge size="sm" variant={getBadgeVariant(t.type)}>
                                                {t.type}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-slate-900">
                                            {t.type === 'credit' ? `+${t.amount}` : `-${t.amount}`}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-700">
                                            <span className="font-semibold block">{t.policyId?.name || t.remarks || 'General'}</span>
                                            {t.remarks && t.policyId && (
                                                <span className="text-[11px] text-slate-400 block">{t.remarks}</span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <Badge size="sm" variant="neutral">
                                                {t.source || 'MANUAL'}
                                            </Badge>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600">
                                            {t.actionBy?.name || 'System Auto'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default LeaveHistoryModal;
