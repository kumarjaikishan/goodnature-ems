import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import Modalbox from '../../../components/custommodal/Modalbox';
import Button from '../../../components/ui/Button';
import DateInput from '../../../components/ui/DateInput';
import { amountInWords } from '../../../utils/numToWord';
import {
    CreditCard,
    Calendar,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Sparkles,
    Building2,
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

    const isBranchPartner = ledger.ledgerType === 'branch_partner' || Boolean(ledger.empId && (ledger.empId.startsWith('BRP-') || ledger.empId.startsWith('BR-')));
    const isEmp = !isBranchPartner && (ledger.ledgerType === 'employee' || Boolean(ledger.empId && ledger.empId.startsWith('EMP')));
    const isKisan = !isBranchPartner && ledger.ledgerType === 'kisan';
    const isAssociate = !isBranchPartner && (ledger.ledgerType === 'associate' || Boolean(ledger.empId && (ledger.empId.startsWith('BA-') || ledger.empId.startsWith('A/'))));
    const isPartner = !isBranchPartner && !isAssociate && (ledger.ledgerType === 'partner' || Boolean(ledger.empId && (ledger.empId.startsWith('BP-') || ledger.empId.startsWith('P/'))));

    const tagLabel = isBranchPartner
        ? 'Branch Partner'
        : isPartner
        ? 'Business Partner'
        : isAssociate
        ? 'Business Associate'
        : isEmp
        ? 'Employee'
        : isKisan
        ? 'Seller'
        : (ledger.ledgerType || 'Custom');

    const tagBadgeClasses = isBranchPartner
        ? 'bg-teal-50 text-teal-800 border-teal-200/90'
        : isPartner
        ? 'bg-sky-50 text-sky-800 border-sky-200/90'
        : isAssociate
        ? 'bg-purple-50 text-purple-800 border-purple-200/90'
        : isEmp
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200/90'
        : isKisan
        ? 'bg-amber-50 text-amber-800 border-amber-200/90'
        : 'bg-slate-100 text-slate-700 border-slate-200';

    const handleAmountChange = (e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9.]/g, '');

        const parts = val.split('.');
        if (parts.length > 2) {
            val = `${parts[0]}.${parts.slice(1).join('')}`;
        }

        if (val.includes('.')) {
            const [intPart, decPart] = val.split('.');
            val = `${intPart}.${decPart.slice(0, 2)}`;
        }

        setAmount(val);
    };

    const handleAmountKeyDown = (e) => {
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            return;
        }
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
            return;
        }
        if (e.key === '.' && !amount.includes('.')) {
            return;
        }
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

    const parsedAmt = Number(amount);
    const hasValidAmount = !isNaN(parsedAmt) && parsedAmt > 0;
    const formattedAmountBtn = hasValidAmount
        ? parsedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : null;

    return (
        <Modalbox
            open={open}
            onClose={onClose}
            title="Make Payment / Issue Voucher"
            subtitle="Create an official disbursement voucher against this ledger"
            icon={<CreditCard className="w-5 h-5 text-teal-700" />}
            maxWidth="max-w-xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] text-slate-500 hidden sm:inline-flex items-center gap-1 font-medium">
                        <CheckCircle2 size={13} className="text-teal-600" />
                        Requires standard approval before disbursement
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="pay-ledger-form"
                            variant="primary"
                            size="md"
                            startIcon={CreditCard}
                            loading={submitting}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
                        >
                            Issue Voucher
                        </Button>
                    </div>
                </div>
            }
        >
            <form id="pay-ledger-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Clean Professional Entity Banner */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                        {ledger.profileImage ? (
                            <img
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                                alt={ledger.name}
                                src={cloudinaryUrl(ledger.profileImage, {
                                    format: 'webp',
                                    width: 120,
                                    height: 120,
                                })}
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-800 to-teal-950 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0 tracking-tight">
                                {ledger.name?.charAt(0)?.toUpperCase() || 'L'}
                            </div>
                        )}

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                                    {ledger.name}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${tagBadgeClasses}`}>
                                    {tagLabel}
                                </span>
                            </div>
                            {ledger.empId && (
                                <p className="text-[11px] text-slate-500 font-mono font-medium mt-0.5 flex items-center gap-1">
                                    <span>ID:</span>
                                    <span className="font-semibold text-slate-700">{ledger.empId}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Balance Stat Card */}
                    <div className="bg-white px-3 py-2 rounded-lg border border-slate-200/90 shadow-2xs sm:text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Ledger Balance
                        </span>
                        <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                isPayable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            }`}>
                                {isPayable ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                {isPayable ? 'Payable' : 'Receivable'}
                            </span>
                            <span className={`font-mono text-sm font-extrabold tracking-tight ${
                                isPayable ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                                ₹ {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Voucher Date & Amount Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                            <Calendar size={13} className="text-teal-700" />
                            <span>Voucher Date</span>
                            <span className="text-rose-500">*</span>
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
                                <span>Amount (₹)</span>
                                <span className="text-rose-500">*</span>
                            </label>
                            {isPayable && (
                                <button
                                    type="button"
                                    onClick={() => setAmount(roundAmount(Math.abs(netBalance)))}
                                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer transition-colors"
                                >
                                    Pay Full (₹{Math.abs(netBalance).toLocaleString('en-IN')})
                                </button>
                            )}
                        </div>

                        {/* Amount Input with Currency Symbol inside */}
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-sm font-semibold text-slate-400 select-none">
                                ₹
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amount}
                                onChange={handleAmountChange}
                                onKeyDown={handleAmountKeyDown}
                                required
                                className="w-full h-9 pl-7 pr-3 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition shadow-2xs placeholder:text-slate-400"
                            />
                        </div>

                        {/* Word representation */}
                        {hasValidAmount && (
                            <div className="mt-1.5 px-2.5 py-1 bg-teal-50/60 border border-teal-100 rounded-md">
                                <p className="text-[11px] text-teal-900 font-medium leading-tight">
                                    <span className="font-bold text-teal-950">In Words:</span> {amountInWords(amount, { only: true })}
                                </p>
                            </div>
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
                        placeholder="Enter payment narration or description for voucher records..."
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-all resize-none bg-white text-slate-800 placeholder:text-slate-400 shadow-2xs"
                    />
                </div>
            </form>
        </Modalbox>
    );
};

export default PayLedgerModal;
