import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import Modalbox from '../../../components/custommodal/Modalbox';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DateInput from '../../../components/ui/DateInput';
import { amountInWords } from '../../../utils/numToWord';
import {
    CreditCard,
    Calendar,
    FileText,
    ShieldCheck
} from 'lucide-react';

export const PayLedgerModal = ({ open, onClose, ledger, onSuccess }) => {
    const [voucherDate, setVoucherDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [amount, setAmount] = useState('');
    const [narration, setNarration] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const roundAmount = (val) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val);
        if (isNaN(num)) return '';
        const rounded = Math.round(num * 100) / 100;
        return (rounded % 1 === 0) ? rounded.toString() : rounded.toFixed(2);
    };

    // Populate default values when ledger changes or modal opens
    useEffect(() => {
        if (open && ledger) {
            setVoucherDate(dayjs().format('YYYY-MM-DD'));

            // Pre-fill positive balance if payable
            const currentNet = Number(ledger.netBalance) || 0;
            if (currentNet > 0) {
                setAmount(roundAmount(currentNet));
                setNarration(`Payment towards ledger payable balance for ${ledger.name}`);
            } else {
                setAmount('');
                setNarration(`Payment disbursement to ${ledger.name}`);
            }
        }
    }, [open, ledger]);

    if (!ledger) return null;

    const netBalance = Number(ledger.netBalance) || 0;
    const isPayable = netBalance > 0;

    const isEmp = ledger.ledgerType === 'employee' || Boolean(ledger.empId && ledger.empId.startsWith('EMP'));
    const isKisan = ledger.ledgerType === 'kisan';
    const isAssociate = ledger.ledgerType === 'associate' || Boolean(ledger.empId && ledger.empId.startsWith('BA-'));
    const isPartner = ledger.ledgerType === 'partner' || Boolean(ledger.empId && ledger.empId.startsWith('BP-'));

    const tagLabel = isEmp
        ? 'Employee'
        : isKisan
        ? 'Seller'
        : isAssociate
        ? 'Associate'
        : isPartner
        ? 'Partner'
        : (ledger.ledgerType || 'Custom');

    const tagClass = isEmp
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : isKisan
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : isAssociate
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : isPartner
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';

    const handleAmountChange = (e) => {
        let val = e.target.value;
        // Keep only digits and decimal point
        val = val.replace(/[^0-9.]/g, '');

        // Allow at most one decimal point
        const parts = val.split('.');
        if (parts.length > 2) {
            val = `${parts[0]}.${parts.slice(1).join('')}`;
        }

        // Allow at most 2 decimal places after the dot
        if (val.includes('.')) {
            const [intPart, decPart] = val.split('.');
            val = `${intPart}.${decPart.slice(0, 2)}`;
        }

        setAmount(val);
    };

    const handleAmountKeyDown = (e) => {
        // Allow control keys
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            return;
        }
        // Allow Ctrl / Cmd combinations
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
        // Allow single decimal point
        if (e.key === '.' && !amount.includes('.')) {
            return;
        }
        // Allow digits 0-9
        if (/^[0-9]$/.test(e.key)) {
            if (amount.includes('.')) {
                const decPart = amount.split('.')[1];
                const input = e.target;
                const dotIndex = amount.indexOf('.');
                if (decPart && decPart.length >= 2 && input.selectionStart > dotIndex && input.selectionStart === input.selectionEnd) {
                    e.preventDefault();
                    return;
                }
            }
            return;
        }
        // Disallow everything else
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            return toast.warn('Please enter a valid amount greater than 0');
        }

        if (!voucherDate) {
            return toast.warn('Please select a valid date');
        }

        try {
            setSubmitting(true);
            const cleanAmount = Math.round(numAmount * 100) / 100;
            const payload = {
                ledgerId: ledger._id,
                date: voucherDate,
                amount: cleanAmount,
                narration: narration.trim() || `Voucher payment to ${ledger.name}`,
                autoApprove: false,
                initialPayment: 0,
                paymentMode: 'CASH',
                paymentLedgerId: null,
                referenceNo: ''
            };

            const res = await apiClient({
                url: 'vouchers',
                method: 'POST',
                body: payload
            });

            toast.success(
                res.message || `Payment voucher #${res.voucher?.voucherNo || ''} submitted successfully!`
            );

            if (onSuccess) onSuccess(res.voucher);
            onClose();
        } catch (err) {
            console.error('Error issuing voucher:', err);
            const errMsg = err.message || err.payload?.message || 'Failed to issue payment voucher';
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modalbox
            open={open}
            onClose={onClose}
            title="Make Payment / Issue Voucher"
            subtitle="Create an official payment voucher for this ledger"
            maxWidth="max-w-xl"
            footer={
                <>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="pay-ledger-form"
                        variant="primary"
                        size="sm"
                        icon={<CreditCard size={15} />}
                        loading={submitting}
                    >
                        {amount && !isNaN(Number(amount)) && Number(amount) > 0
                            ? `Issue Voucher (₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                            : 'Issue Voucher'}
                    </Button>
                </>
            }
        >
            <form id="pay-ledger-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Highlighted Ledger Card */}
                <div className="bg-gradient-to-br from-teal-50/70 via-slate-50 to-emerald-50/50 border border-teal-100/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        {ledger.profileImage ? (
                            <img
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                                alt={ledger.name}
                                src={cloudinaryUrl(ledger.profileImage, {
                                    format: 'webp',
                                    width: 120,
                                    height: 120,
                                })}
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-700 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                                {ledger.name?.charAt(0)?.toUpperCase() || 'L'}
                            </div>
                        )}

                        <div>
                            <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                                {ledger.name}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${tagClass}`}>
                                    {tagLabel}
                                </span>
                            </div>
                            {ledger.empId && (
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    ID: <span className="font-semibold text-slate-700">{ledger.empId}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Balance Pill */}
                    <div className="bg-white px-3 py-2 rounded-lg border border-slate-200/80 shadow-2xs sm:text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Current Balance
                        </span>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                            <span className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                                isPayable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                                {isPayable ? 'Payable' : 'Receivable'}
                            </span>
                            <span className={`text-sm font-black ${
                                isPayable ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                                ₹ {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Voucher Date & Amount Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                            <Calendar size={13} className="text-teal-700" />
                            Voucher Date <span className="text-rose-500">*</span>
                        </label>
                        <DateInput
                            value={voucherDate}
                            onChange={(e) => {
                                const val = e?.target?.value !== undefined ? e.target.value : e;
                                setVoucherDate(val);
                            }}
                            max={dayjs().format('YYYY-MM-DD')}
                            required
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <FileText size={13} className="text-teal-700" />
                                Amount (₹) <span className="text-rose-500">*</span>
                            </label>
                            {isPayable && (
                                <button
                                    type="button"
                                    onClick={() => setAmount(roundAmount(Math.abs(netBalance)))}
                                    className="text-[11px] text-teal-700 hover:text-teal-800 font-bold hover:underline cursor-pointer"
                                >
                                    Pay Full (₹{Math.abs(netBalance).toLocaleString('en-IN')})
                                </button>
                            )}
                        </div>
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={handleAmountChange}
                            onKeyDown={handleAmountKeyDown}
                            required
                        />
                        {amount && Number(amount) > 0 && (
                            <p className="text-[11px] text-teal-700 font-semibold mt-1 pl-1">
                                {amountInWords(amount, { only: true })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Narration */}
                <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                        Narration / Remarks
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Enter payment narration / remarks..."
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all resize-none bg-white text-slate-800"
                    />
                </div>
            </form>
        </Modalbox>
    );
};

export default PayLedgerModal;
