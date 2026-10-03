import dayjs from "dayjs";
import { Edit2, Trash2, Lock, FileText, CreditCard } from "lucide-react";

/**
 * Sources that are purely manual / hand-entered from the "+ Add Entry" button.
 * These are the ONLY entries that should be editable or deletable from this ledger detail page.
 */
const MANUAL_SOURCES = new Set(['ledger', 'manual', 'adjustment', 'transfer', 'investment']);

/**
 * Sources that come from the Voucher module (VoucherList page).
 * Show a lock badge + optional "View Voucher" link.
 */
const VOUCHER_SOURCES = new Set(['voucher', 'voucher_payment', 'receipt']);

/**
 * Sources that come from Payroll / Salary module.
 */
const PAYROLL_SOURCES = new Set(['payroll', 'salary']);

export const getLedgerColumns = (handleEdit, handleDelete, employee, navigate, isReadOnly = false) => {
    const cols = [
        {
            name: "S.No",
            selector: (row, index) => index + 1,
            width: "55px",
        },
        {
            name: 'Date',
            selector: row => dayjs(row.date).format('DD MMM, YYYY'),
            sortable: true,
            width: "115px",
        },
        {
            name: 'Particular',
            selector: row => row.particular || '-',
            cell: row => {
                const text = row.particular || '-';
                const src = row.source || 'ledger';

                // ── Parse payment mode from the particular string ──────────────────
                // The voucher controller appends "(CASH)", "(BANK_TRANSFER)", etc. at the end
                const PAYMENT_MODE_PATTERN = /\((CASH|BANK_TRANSFER|BANK|UPI|CHEQUE|NEFT|RTGS|IMPS|ONLINE|DD)\)$/i;
                const match = text.match(PAYMENT_MODE_PATTERN);

                // Also look for "vide chq", "vide bank", "vide upi" style mentions
                const chqMatch = /vide\s+(chq|cheque|dd|bank|upi|neft|rtgs|imps|cash)/i.exec(text);

                let paymentModeLabel = null;
                let paymentModeStyle = '';

                if (match) {
                    const raw = match[1].toUpperCase();
                    if (raw === 'CASH') {
                        paymentModeLabel = '💵 Cash';
                        paymentModeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (['BANK_TRANSFER', 'BANK', 'NEFT', 'RTGS', 'IMPS'].includes(raw)) {
                        paymentModeLabel = '🏦 Bank Transfer';
                        paymentModeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (raw === 'UPI' || raw === 'ONLINE') {
                        paymentModeLabel = '📱 UPI / Online';
                        paymentModeStyle = 'bg-violet-50 text-violet-700 border-violet-200';
                    } else if (['CHEQUE', 'DD'].includes(raw)) {
                        paymentModeLabel = '📄 Cheque / DD';
                        paymentModeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                    }
                } else if (chqMatch) {
                    const raw = chqMatch[1].toLowerCase();
                    if (raw === 'cash') {
                        paymentModeLabel = '💵 Cash';
                        paymentModeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (['bank', 'neft', 'rtgs', 'imps'].includes(raw)) {
                        paymentModeLabel = '🏦 Bank Transfer';
                        paymentModeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (raw === 'upi') {
                        paymentModeLabel = '📱 UPI / Online';
                        paymentModeStyle = 'bg-violet-50 text-violet-700 border-violet-200';
                    } else if (['chq', 'cheque', 'dd'].includes(raw)) {
                        paymentModeLabel = '📄 Cheque / DD';
                        paymentModeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                    }
                }

                // For voucher / pay-ledger entries, also show source chip if no payment mode matched
                const isVoucherEntry = VOUCHER_SOURCES.has(src) || src === 'manual';

                return (
                    <div className="flex flex-col gap-0.5 py-1 w-full">
                        <span className="text-slate-800 font-medium text-xs leading-snug">{text}</span>
                        {paymentModeLabel && (
                            <span className={`inline-flex items-center self-start text-[10px] font-semibold px-1.5 py-0.5 rounded border ${paymentModeStyle} whitespace-nowrap`}>
                                {paymentModeLabel}
                            </span>
                        )}
                    </div>
                );
            },
            wrap: true,
            minWidth: '220px',
        },
        {
            name: 'Credit (₹)',
            selector: row => row.credit || 0,
            cell: row => {
                const val = parseFloat(row.credit) || 0;
                return val > 0 ? (
                    <span className="font-mono font-bold text-emerald-700 whitespace-nowrap">
                        +₹{val.toLocaleString('en-IN')}
                    </span>
                ) : (
                    <span className="text-slate-400 font-bold">-</span>
                );
            },
            sortable: true,
            right: true,
            width: '130px'
        },
        {
            name: 'Debit (₹)',
            selector: row => row.debit || 0,
            cell: row => {
                const val = parseFloat(row.debit) || 0;
                return val > 0 ? (
                    <span className="font-mono font-bold text-rose-700 whitespace-nowrap">
                        -₹{val.toLocaleString('en-IN')}
                    </span>
                ) : (
                    <span className="text-slate-400 font-bold">-</span>
                );
            },
            sortable: true,
            right: true,
            width: '130px'
        },
        {
            name: 'Balance (₹)',
            selector: row => row.balance || 0,
            cell: row => {
                if (row.balance === null || row.balance === undefined || row.balance === '') {
                    return <span className="text-slate-400 font-bold">-</span>;
                }
                const val = parseFloat(row.balance) || 0;
                return (
                    <span className="font-mono font-black text-slate-900 whitespace-nowrap">
                        ₹{val.toLocaleString('en-IN')}
                    </span>
                );
            },
            sortable: true,
            right: true,
            width: '140px'
        }
    ];

    if (!isReadOnly) {
        cols.push({
            name: 'Actions',
            width: '150px',
            cell: (row) => {
                const src = row.source || 'ledger';

                // ─── 1. MANUAL ENTRY → full edit + delete ───────────────────────
                if (MANUAL_SOURCES.has(src)) {
                    return (
                        <div className="flex items-center justify-start gap-1.5 w-full">
                            <button
                                type="button"
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Edit Manual Entry"
                                onClick={() => handleEdit(row)}
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                type="button"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Manual Entry"
                                onClick={() => handleDelete(row._id)}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                }

                // ─── 2. PAYROLL / SALARY → link to payroll page ─────────────────
                if (PAYROLL_SOURCES.has(src)) {
                    return (
                        <div className="flex items-center gap-1 w-full">
                            <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer hover:bg-violet-100 shadow-xs transition"
                                title="Created by Payroll. Edit from Payroll module."
                                onClick={() => {
                                    if (row.referenceId) {
                                        navigate(`/dashboard/payroll/edit/${row.referenceId}`);
                                    }
                                }}
                            >
                                <Lock size={10} className="text-violet-600 shrink-0" />
                                Payroll
                            </span>
                        </div>
                    );
                }

                // ─── 3. ADVANCE ──────────────────────────────────────────────────
                if (src === 'advance') {
                    return (
                        <div className="flex items-center gap-1 w-full">
                            <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer hover:bg-sky-100 shadow-xs transition"
                                title="Created from Advance module. Edit from Advance page."
                                onClick={() => {
                                    const emp = employee?.find((val) => val?.ledgerId === row.ledgerId);
                                    if (emp) {
                                        navigate(`/dashboard/advance?employeeId=${emp._id}`, { replace: true });
                                    }
                                }}
                            >
                                <CreditCard size={10} className="text-sky-600 shrink-0" />
                                Advance
                            </span>
                        </div>
                    );
                }

                // ─── 4. VOUCHER / VOUCHER PAYMENT / RECEIPT ──────────────────────
                if (VOUCHER_SOURCES.has(src)) {
                    return (
                        <div className="flex items-center gap-1 w-full">
                            <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer hover:bg-amber-100 shadow-xs transition"
                                title="Created from Voucher module. Edit or delete from the Vouchers page."
                                onClick={() => navigate('/dashboard/vouchers')}
                            >
                                <FileText size={10} className="text-amber-600 shrink-0" />
                                Voucher
                            </span>
                        </div>
                    );
                }

                // ─── 5. COMMISSION / PLOT PAYOUT / KISAN / OTHER AUTO ────────────
                if (
                    src?.startsWith('commission') ||
                    src === 'plot_payout' ||
                    src?.startsWith('kisan')
                ) {
                    const label = src === 'plot_payout'
                        ? 'Plot Payout'
                        : src?.startsWith('kisan')
                            ? 'Kisan'
                            : 'Auto Commission';
                    return (
                        <div className="flex items-center gap-1 w-full">
                            <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md whitespace-nowrap cursor-default shadow-xs"
                                title="Auto-generated by system. Cannot be edited here."
                            >
                                <Lock size={10} className="text-teal-600 shrink-0" />
                                {label}
                            </span>
                        </div>
                    );
                }

                // ─── 6. Fallback: any unrecognised source → locked ────────────────
                return (
                    <div className="flex items-center gap-1 w-full">
                        <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap cursor-default shadow-xs"
                            title={`System-generated entry (source: ${src}). Cannot be edited here.`}
                        >
                            <Lock size={10} className="text-slate-400 shrink-0" />
                            System
                        </span>
                    </div>
                );
            },
        });
    }

    return cols;
};
