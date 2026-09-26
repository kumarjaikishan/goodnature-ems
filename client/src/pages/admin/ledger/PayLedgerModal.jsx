import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../../../utils/apiClient';
import { toast } from '../../../utils/toast';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DateInput from '../../../components/ui/DateInput';
import Select from '../../../components/ui/Select';
import {
    CreditCard,
    CheckCircle2,
    Wallet,
    Calendar,
    FileText,
    ArrowUpRight,
    Zap,
    ShieldCheck
} from 'lucide-react';

const PAYMENT_MODES = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Bank Transfer (NEFT/RTGS/IMPS)', value: 'BANK_TRANSFER' },
    { label: 'UPI / Online', value: 'UPI' },
    { label: 'Cheque / DD', value: 'CHEQUE' },
    { label: 'Online Gateway', value: 'ONLINE' },
];

export const PayLedgerModal = ({ open, onClose, ledger, onSuccess }) => {
    const [voucherDate, setVoucherDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [amount, setAmount] = useState('');
    const [narration, setNarration] = useState('');
    const [autoDisburse, setAutoDisburse] = useState(true);
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [referenceNo, setReferenceNo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Populate default values when ledger changes or modal opens
    useEffect(() => {
        if (open && ledger) {
            setVoucherDate(dayjs().format('YYYY-MM-DD'));
            setPaymentMode('CASH');
            setReferenceNo('');
            setAutoDisburse(true);

            // Pre-fill positive balance if payable
            const currentNet = Number(ledger.netBalance) || 0;
            if (currentNet > 0) {
                setAmount(currentNet.toString());
                setNarration(`Payment towards ledger payable balance for ${ledger.name}`);
            } else {
                setAmount('');
                setNarration(`Payment disbursement to ${ledger.name}`);
            }
        }
    }, [open, ledger]);

    if (!ledger) return null;

    const netBalance = Number(ledger.netBalance) || 0;
    const isPayable = netBalance >= 0;

    // Determine type tag
    const isEmp = ledger.ledgerType === 'employee' || Boolean(ledger.employeeId);
    const isKisan = ledger.ledgerType === 'kisan' || Boolean(ledger.kisanSellerId);
    const isSpon = ledger.ledgerType === 'sponsor' || Boolean(ledger.sponsorId);
    const hasBranch = Boolean(ledger.sponsorId?.branchIds && ledger.sponsorId.branchIds.length > 0);
    const isAssociate = isSpon && Boolean(ledger.sponsorId?.sponsorId);
    const isBranchPartner = isSpon && hasBranch;
    const isPartner = isSpon && !ledger.sponsorId?.sponsorId && !isBranchPartner;

    const tagLabel = isEmp
        ? 'Employee'
        : isKisan
        ? 'Seller / Kisan'
        : isBranchPartner
        ? 'Branch Partner'
        : isPartner
        ? 'Partner'
        : isAssociate
        ? 'Associate'
        : (ledger.ledgerType || 'Custom');

    const tagClass = isEmp
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : isKisan
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : isBranchPartner
        ? 'bg-teal-50 text-teal-800 border-teal-200'
        : isPartner
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : isAssociate
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-slate-50 text-slate-700 border-slate-200';

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
            const payload = {
                ledgerId: ledger._id,
                date: voucherDate,
                amount: numAmount,
                narration: narration.trim() || `Voucher payment to ${ledger.name}`,
                autoApprove: autoDisburse,
                initialPayment: autoDisburse ? numAmount : 0,
                paymentMode: autoDisburse ? paymentMode : 'CASH',
                referenceNo: autoDisburse ? referenceNo.trim() : ''
            };

            const res = await apiClient({
                url: 'vouchers',
                method: 'POST',
                body: payload
            });

            toast.success(
                autoDisburse
                    ? `Payment voucher #${res.voucher?.voucherNo || ''} created & disbursed successfully`
                    : `Voucher #${res.voucher?.voucherNo || ''} submitted for approval`
            );

            if (onSuccess) {
                onSuccess(res.voucher);
            }
            onClose();
        } catch (error) {
            console.error('Error creating payment voucher:', error);
            toast.error(error.message || 'Failed to create payment voucher');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Make Payment / Issue Voucher"
            subtitle="Create an official payment voucher and disburse funds to this ledger"
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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
                                    ID / Code: <span className="font-semibold text-slate-700">{ledger.empId}</span>
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

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Voucher Date */}
                    <div>
                        <DateInput
                            label="Voucher Date *"
                            value={voucherDate}
                            onChange={(val) => setVoucherDate(val)}
                            required
                        />
                    </div>

                    {/* Voucher Amount */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700">
                                Amount (₹) *
                            </label>
                            {netBalance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setAmount(netBalance.toString())}
                                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                                >
                                    Pay Full (₹{netBalance.toLocaleString('en-IN')})
                                </button>
                            )}
                        </div>
                        <Input
                            type="number"
                            step="any"
                            min="1"
                            placeholder="e.g. 5000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Immediate Disbursement Toggle */}
                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={autoDisburse}
                            onChange={(e) => setAutoDisburse(e.target.checked)}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                            <span className="text-xs font-bold text-slate-800">
                                Disburse & Settle Payment Immediately
                            </span>
                        </div>
                    </label>

                    {autoDisburse ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                                    Payment Mode *
                                </label>
                                <Select
                                    value={paymentMode}
                                    onChange={(val) => setPaymentMode(val)}
                                    options={PAYMENT_MODES}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                                    Ref / Cheque / UTR No.
                                </label>
                                <Input
                                    placeholder="e.g. UTR / Cheque / Txn ID"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>This voucher will be submitted as <strong>Pending Approval</strong> and can be approved/disbursed later from the Vouchers dashboard.</span>
                        </div>
                    )}
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

                {/* Footer Buttons */}
                <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100">
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
                        variant="primary"
                        size="sm"
                        icon={<CreditCard size={15} />}
                        loading={submitting}
                    >
                        {autoDisburse
                            ? `Pay ₹${amount ? Number(amount).toLocaleString('en-IN') : '0.00'}`
                            : 'Create Voucher'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default PayLedgerModal;
