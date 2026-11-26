import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modalbox from '@/components/custommodal/Modalbox';
import Badge from '@/components/ui/Badge';
import Loader from '@/utils/loader';

const LeaveHistoryModal = ({ open, onClose, employee, canDelete = false, onDeleted }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!employee?._id) return;
        setLoading(true);
        try {
            const data = await apiClient({
                url: `leave-transactions/${employee._id}`
            });
            setTransactions(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message || 'Failed to load leave history');
        } finally {
            setLoading(false);
        }
    }, [employee?._id]);

    useEffect(() => {
        if (open && employee?._id) {
            fetchHistory();
        }
    }, [open, employee?._id, fetchHistory]);

    const handleDeleteTransaction = async (tx) => {
        const count = tx.days ?? tx.amount ?? 0;
        const proceed = await confirmDialog({
            title: 'Delete Leave Entry?',
            text: `Remove this ${tx.type} entry (${tx.type === 'credit' ? '+' : '-'}${count} days) and recalculate the employee's leave balance?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            isDanger: true,
        });
        if (!proceed) return;

        setDeletingId(tx._id);
        try {
            const res = await apiClient({
                url: `leave-balances/${tx._id}`,
                method: 'DELETE',
            });
            toast.success(res?.message || 'Transaction deleted and balance recalculated');
            await fetchHistory();
            onDeleted?.();
        } catch (error) {
            toast.error(error.message || 'Failed to delete leave entry');
        } finally {
            setDeletingId(null);
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
        <Modalbox
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
                                    {canDelete && <th className="py-2.5 px-3 text-center">Action</th>}
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
                                            {(() => {
                                                const count = t.days ?? t.amount ?? 0;
                                                return t.type === 'credit' ? `+${count}` : `-${count}`;
                                            })()}
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
                                            {t.actionBy?.name || (t.source === 'manual' ? 'Legacy (Admin)' : 'System Auto')}
                                        </td>
                                        {canDelete && (
                                            <td className="py-2.5 px-3 text-center">
                                                <button
                                                    type="button"
                                                    title="Delete Entry"
                                                    disabled={deletingId === t._id}
                                                    onClick={() => handleDeleteTransaction(t)}
                                                    className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modalbox>
    );
};

export default LeaveHistoryModal;
