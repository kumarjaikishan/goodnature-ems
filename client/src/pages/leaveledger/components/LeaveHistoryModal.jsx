import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { Trash2, Edit2 } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { confirmDialog } from '../../../utils/confirmDialog';
import Modalbox from '@/components/custommodal/Modalbox';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import Select from '@/components/ui/Select';
import Loader from '@/utils/loader';

const LeaveHistoryModal = ({ open, onClose, employee, canEdit = false, canDelete = false, onDeleted, onUpdated }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingTx, setEditingTx] = useState(null);
    const [editForm, setEditForm] = useState({ type: 'credit', days: 1, remarks: '' });
    const [savingEdit, setSavingEdit] = useState(false);

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
            setEditingTx(null);
            fetchHistory();
        }
    }, [open, employee?._id, fetchHistory]);

    const startEdit = (tx) => {
        setEditingTx(tx);
        setEditForm({
            type: tx.type || 'credit',
            days: tx.days ?? tx.amount ?? 1,
            remarks: tx.remarks || '',
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingTx) return;
        const days = Number(editForm.days);
        if (isNaN(days) || days <= 0) {
            return toast.warning('Please enter No. of Leaves (at least 1)');
        }

        setSavingEdit(true);
        try {
            const res = await apiClient({
                url: `leave-transactions/${editingTx._id}`,
                method: 'PUT',
                body: {
                    type: editForm.type,
                    days,
                    remarks: editForm.remarks,
                },
            });
            toast.success(res?.message || 'Leave entry updated and balance recalculated');
            setEditingTx(null);
            await fetchHistory();
            (onUpdated || onDeleted)?.();
        } catch (error) {
            toast.error(error.message || 'Failed to update leave entry');
        } finally {
            setSavingEdit(false);
        }
    };

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
                {editingTx && (
                    <form
                        onSubmit={handleSaveEdit}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                                Edit Entry ({dayjs(editingTx.createdAt).format('DD MMM YYYY, hh:mm A')})
                            </span>
                            <button
                                type="button"
                                onClick={() => setEditingTx(null)}
                                className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <Select
                                label="Type"
                                size="sm"
                                options={[
                                    { label: 'Credit (+)', value: 'credit' },
                                    { label: 'Debit (-)', value: 'debit' },
                                    ...(editingTx.type === 'adjustment' ? [{ label: 'Adjustment', value: 'adjustment' }] : []),
                                ]}
                                value={editForm.type}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                            />
                            <NumberInput
                                label="No. of Leaves"
                                size="sm"
                                min="1"
                                required
                                value={editForm.days}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, days: e.target.value }))}
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label="Remarks"
                                    size="sm"
                                    placeholder="Reason for leave entry..."
                                    value={editForm.remarks}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingTx(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" size="sm" loading={savingEdit}>
                                Update Entry
                            </Button>
                        </div>
                    </form>
                )}

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
                                    {(canEdit || canDelete) && <th className="py-2.5 px-3 text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50/60">
                                        <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                                            <span className="block">{dayjs(t.createdAt).format('DD MMM YYYY')}</span>
                                            <span className="block text-[11px] text-slate-400 font-normal">
                                                {dayjs(t.createdAt).format('hh:mm A')}
                                            </span>
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
                                        {(canEdit || canDelete) && (
                                            <td className="py-2.5 px-3 text-center">
                                                <div className="inline-flex items-center justify-center gap-1">
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            title="Edit Entry"
                                                            disabled={deletingId === t._id || savingEdit}
                                                            onClick={() => startEdit(t)}
                                                            className="p-1.5 rounded-md text-teal-700 hover:text-teal-900 hover:bg-teal-50 transition cursor-pointer disabled:opacity-50"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            title="Delete Entry"
                                                            disabled={deletingId === t._id}
                                                            onClick={() => handleDeleteTransaction(t)}
                                                            className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
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
