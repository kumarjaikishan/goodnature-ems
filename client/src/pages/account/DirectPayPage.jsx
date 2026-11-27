import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { CreditCard, Eye, Search, UserCheck, Users, X } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import DateInput from '@/components/ui/DateInput';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Loader from '../../utils/loader';
import { apiClient } from '../../utils/apiClient';
import { toast } from '../../utils/toast';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
import { useCustomStyles } from '../admin/attandence/attandencehelper';
import { usePermission } from '../../utils/CheckPermission';
import ReceiverBankFields, {
  EMPTY_RECEIVER_BANK,
  extractReceiverBankDetails,
  sanitizeReceiverBankPayload,
} from '../vouchers/ReceiverBankFields';

const DirectPayPage = ({ mode = 'employee' }) => {
  const navigate = useNavigate();
  const themes = useCustomStyles();
  const isEmployeeMode = mode === 'employee';
  const permResource = isEmployeeMode ? 'employee_pay' : 'seller_pay';

  const canPay = usePermission(permResource, 2);
  const canViewLedger = usePermission(isEmployeeMode ? 'employee_ledger' : 'kisan_ledger', 1);

  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all'); // 'all' | 'payable' | 'receivable' | 'settled'
  const [sortBy, setSortBy] = useState('name_asc');

  // Treasury accounts for direct disbursement
  const [treasuryLedgers, setTreasuryLedgers] = useState({ bankLedgers: [], cashLedgers: [] });
  const [myCashLedger, setMyCashLedger] = useState(null);

  // Direct Pay Modal State
  const [openPayModal, setOpenPayModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentLedgerId, setPaymentLedgerId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [receiverBank, setReceiverBank] = useState({ ...EMPTY_RECEIVER_BANK });
  const [submitting, setSubmitting] = useState(false);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const data = await apiClient({ url: 'ledger?view=ledger' });
      setLedgers(data.ledgers || []);
    } catch (err) {
      console.error('Failed to fetch ledgers:', err);
      toast.error(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTreasury = async () => {
    try {
      const [treasuryData, myCashData] = await Promise.all([
        apiClient({ url: 'ledger/treasury', params: { intent: 'payment' } }),
        apiClient({ url: 'ledger/my-cash-account' }).catch(() => null),
      ]);
      if (treasuryData) {
        setTreasuryLedgers({
          bankLedgers: treasuryData.bankLedgers || treasuryData.bankAccounts || [],
          cashLedgers: treasuryData.cashLedgers || treasuryData.cashAccounts || [],
        });
      }
      if (myCashData) {
        setMyCashLedger(myCashData?.data || myCashData || null);
      }
    } catch (err) {
      console.error('Error fetching treasury ledgers:', err);
    }
  };

  useEffect(() => {
    fetchLedgers();
    fetchTreasury();
  }, [mode]);

  const roleLedgers = useMemo(() => {
    return (ledgers || []).filter((l) => {
      const isUserCash = l.ledgerType === 'user_cash' || l.ledgerType === 'bank' || l.ledgerType === 'cash';
      const isBranch = l.ledgerType === 'branch';
      const isSponsor = l.ledgerType === 'sponsor' || Boolean(l.sponsorId);
      const isKisan = l.ledgerType === 'kisan' || Boolean(l.kisanSellerId);
      const isEmp = (l.ledgerType === 'employee' || Boolean(l.employeeId)) && !isUserCash && !isBranch;

      if (isEmployeeMode) {
        return isEmp && !isSponsor && !isKisan;
      }
      return isKisan && !isBranch;
    });
  }, [ledgers, isEmployeeMode]);

  const filteredLedgers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = roleLedgers.filter((l) => {
      const net = Number(l.netBalance) || 0;
      if (balanceFilter === 'payable' && net <= 0) return false;
      if (balanceFilter === 'receivable' && net >= 0) return false;
      if (balanceFilter === 'settled' && Math.abs(net) > 0.009) return false;

      if (q) {
        const nameMatch = (l.name || '').toLowerCase().includes(q);
        const idMatch = String(l.empId || '').toLowerCase().includes(q);
        const mobileMatch = String(l.kisanSellerId?.mobile || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !mobileMatch) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'payable_desc') return (Number(b.netBalance) || 0) - (Number(a.netBalance) || 0);
      if (sortBy === 'receivable_desc') return (Number(a.netBalance) || 0) - (Number(b.netBalance) || 0);
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [roleLedgers, searchQuery, balanceFilter, sortBy]);

  const stats = useMemo(() => {
    let payable = 0;
    let receivable = 0;
    roleLedgers.forEach((l) => {
      const net = Number(l.netBalance) || 0;
      if (net > 0) payable += net;
      else if (net < 0) receivable += Math.abs(net);
    });
    return {
      count: roleLedgers.length,
      payable,
      receivable,
      net: payable - receivable,
    };
  }, [roleLedgers]);

  const getTreasuryOptions = (currentMode) => {
    if (currentMode === 'CASH') {
      if (!myCashLedger) {
        return [{ label: 'No Personal Cash Account Assigned', value: '' }];
      }
      const bal = Number(myCashLedger.availableBalance ?? myCashLedger.netBalance ?? 0);
      return [{ label: `${myCashLedger.name} - ₹ ${bal.toLocaleString('en-IN')}`, value: myCashLedger._id }];
    }
    const banks = treasuryLedgers.bankLedgers || [];
    if (banks.length === 0) {
      return [{ label: 'No Bank Account Available', value: '' }];
    }
    return banks.map((b) => {
      const bankTitle = b.bankName || b.name || 'Bank Account';
      const accSuffix = b.accountNumber ? ` (A/C: ${b.accountNumber})` : '';
      const bal = Number(b.availableBalance ?? b.netBalance ?? 0);
      return {
        label: `${bankTitle}${accSuffix} - ₹ ${bal.toLocaleString('en-IN')}`,
        value: b._id,
      };
    });
  };

  const handleOpenPay = (ledger) => {
    fetchTreasury();
    setSelectedLedger(ledger);
    const net = Number(ledger.netBalance) || 0;
    setPayAmount(net > 0 ? String(Math.round(net * 100) / 100) : '');
    setPayDate(dayjs().format('YYYY-MM-DD'));
    setPaymentMode('CASH');
    setPaymentLedgerId(myCashLedger?._id || '');
    setReferenceNo('');
    setNarration('');
    setReceiverBank(extractReceiverBankDetails({ ledgerId: ledger }));
    setOpenPayModal(true);
  };

  const handleConfirmDirectPay = async (e) => {
    e.preventDefault();
    if (!selectedLedger) return;

    const amt = Math.round((parseFloat(payAmount) || 0) * 100) / 100;
    if (!amt || amt <= 0) {
      return toast.warn('Please enter a valid payment amount greater than 0');
    }
    if (paymentMode === 'CASH' && !paymentLedgerId) {
      return toast.warn('No personal cash ledger assigned to your account');
    }
    if (paymentMode !== 'CASH' && !paymentLedgerId) {
      return toast.warn('Please select a source bank account');
    }

    try {
      setSubmitting(true);
      const res = await apiClient({
        url: 'vouchers',
        method: 'POST',
        body: {
          ledgerId: selectedLedger._id,
          date: payDate,
          amount: amt,
          narration: narration.trim() || `Payment to ${selectedLedger.name}`,
          autoApprove: true,
          initialPayment: amt,
          paymentMode,
          paymentLedgerId: paymentLedgerId || null,
          referenceNo: paymentMode !== 'CASH' ? referenceNo : '',
          receiverBankDetails: paymentMode !== 'CASH' ? sanitizeReceiverBankPayload(receiverBank) : null,
        },
      });

      toast.success(
        `Payment of ₹ ${amt.toLocaleString('en-IN')} completed! Voucher #${res.voucher?.voucherNo || ''} generated successfully.`
      );
      setOpenPayModal(false);
      fetchLedgers();
      fetchTreasury();
    } catch (err) {
      console.error('Direct pay failed:', err);
      toast.error(err.message || 'Failed to complete direct payment');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      name: 'S.No',
      cell: (_row, idx) => <span className="text-slate-500 font-medium text-xs">{idx + 1}</span>,
      width: '65px',
    },
    {
      name: isEmployeeMode ? 'Employee' : 'Seller / Kisan',
      selector: (row) => row.name,
      cell: (row) => {
        const avatar = row.profileImage || row.employeeId?.profileimage;
        return (
          <div className="flex items-center gap-2.5 py-2">
            {avatar ? (
              <img
                src={cloudinaryUrl(avatar)}
                alt={row.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                {(row.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-sm truncate">{row.name}</div>
              <div className="text-[11px] text-slate-500">
                {row.empId ? `ID: ${row.empId}` : (row.kisanSellerId?.mobile ? `Mob: ${row.kisanSellerId.mobile}` : '—')}
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
      minWidth: '220px',
    },
    {
      name: 'Balance Status',
      selector: (row) => Number(row.netBalance) || 0,
      cell: (row) => {
        const net = Number(row.netBalance) || 0;
        if (net > 0) return <Badge variant="success" size="sm">PAYABLE</Badge>;
        if (net < 0) return <Badge variant="danger" size="sm">RECEIVABLE</Badge>;
        return <Badge variant="neutral" size="sm">SETTLED</Badge>;
      },
      sortable: true,
      width: '150px',
    },
    {
      name: 'Net Balance',
      selector: (row) => Number(row.netBalance) || 0,
      cell: (row) => {
        const net = Number(row.netBalance) || 0;
        return (
          <span
            className={`font-bold text-sm ${
              net > 0 ? 'text-emerald-700' : net < 0 ? 'text-rose-700' : 'text-slate-600'
            }`}
          >
            ₹ {Math.abs(net).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        );
      },
      sortable: true,
      width: '170px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {canPay && (
            <Button
              size="sm"
              variant="primary"
              startIcon={CreditCard}
              onClick={() => handleOpenPay(row)}
            >
              Pay
            </Button>
          )}
          {canViewLedger && (
            <button
              type="button"
              onClick={() => {
                const nameParam = encodeURIComponent(row.name || '');
                const empIdParam = encodeURIComponent(row.empId || '');
                navigate(`/dashboard/ledger/${row._id}?name=${nameParam}&empid=${empIdParam}&ledgertype=${isEmployeeMode ? 'employee' : 'kisan'}`);
              }}
              className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded-lg transition cursor-pointer"
              title="View Ledger Statement"
            >
              <Eye size={15} />
            </button>
          )}
        </div>
      ),
      width: '160px',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            {isEmployeeMode ? <UserCheck size={22} className="text-teal-700" /> : <Users size={22} className="text-teal-700" />}
            {isEmployeeMode ? 'Employee Pay' : 'Seller Pay'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEmployeeMode
              ? 'Direct payment to employees — immediately pays and generates an approved Paid voucher.'
              : 'Direct payment to sellers / kisans — immediately pays and generates an approved Paid voucher.'}
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payable</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹ {stats.payable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Receivable</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            ₹ {stats.receivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Net Payable ({stats.count} {isEmployeeMode ? 'Employees' : 'Sellers'})
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            ₹ {stats.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-6">
            <Input
              size="sm"
              label="Search"
              startIcon={Search}
              placeholder={isEmployeeMode ? 'Search employee name or ID...' : 'Search seller name or mobile...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              size="sm"
              label="Balance"
              options={[
                { label: 'All Balances', value: 'all' },
                { label: 'Payable Only', value: 'payable' },
                { label: 'Receivable Only', value: 'receivable' },
                { label: 'Settled (₹0)', value: 'settled' },
              ]}
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3 flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Select
                size="sm"
                label="Sort"
                options={[
                  { label: 'Name (A - Z)', value: 'name_asc' },
                  { label: 'Highest Payable', value: 'payable_desc' },
                  { label: 'Highest Receivable', value: 'receivable_desc' },
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              />
            </div>
            {(searchQuery || balanceFilter !== 'all') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setBalanceFilter('all');
                }}
                title="Clear Filters"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredLedgers}
          pagination
          customStyles={themes}
          highlightOnHover
          progressPending={loading}
          progressComponent={<Loader />}
          noDataComponent={
            <div className="py-12 text-center text-slate-500 text-sm">
              No {isEmployeeMode ? 'employee' : 'seller'} accounts found.
            </div>
          }
        />
      </div>

      {/* Direct Pay Modal */}
      <Modalbox
        open={openPayModal}
        onClose={() => !submitting && setOpenPayModal(false)}
        title={selectedLedger ? `Direct Pay: ${selectedLedger.name}` : 'Direct Payment'}
        subtitle="Immediate disbursement — generates an auto-approved Paid voucher"
        size="xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPayModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="direct-pay-form"
              variant="primary"
              startIcon={CreditCard}
              loading={submitting}
            >
              Confirm & Pay Now
            </Button>
          </>
        }
      >
        <form id="direct-pay-form" onSubmit={handleConfirmDirectPay} className="space-y-4">
          {selectedLedger && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-800 text-sm">{selectedLedger.name}</div>
                <div className="text-slate-500">{selectedLedger.empId || (isEmployeeMode ? 'Employee' : 'Seller')}</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500">Current Net Balance</div>
                <div className={`font-bold text-sm ${(Number(selectedLedger.netBalance) || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹ {Math.abs(Number(selectedLedger.netBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  {(Number(selectedLedger.netBalance) || 0) > 0 ? ' (Payable)' : (Number(selectedLedger.netBalance) || 0) < 0 ? ' (Receivable)' : ''}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput
              label="Payment Amount (₹)"
              currency
              required
              min="1"
              step="any"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <DateInput
              label="Payment Date"
              required
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Mode"
              required
              options={[
                { label: 'Cash', value: 'CASH' },
                { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                { label: 'UPI', value: 'UPI' },
                { label: 'Cheque', value: 'CHEQUE' },
              ]}
              value={paymentMode}
              onChange={(e) => {
                const newMode = e?.target?.value !== undefined ? e.target.value : e;
                setPaymentMode(newMode);
                if (newMode === 'CASH') {
                  setPaymentLedgerId(myCashLedger?._id || '');
                } else {
                  const banks = treasuryLedgers.bankLedgers || [];
                  setPaymentLedgerId(banks[0]?._id || '');
                }
              }}
            />
            <Select
              label={paymentMode === 'CASH' ? 'Source: My Cash Account' : 'Source Bank Account'}
              required
              disabled={paymentMode === 'CASH'}
              options={getTreasuryOptions(paymentMode)}
              value={paymentLedgerId}
              onChange={(e) => {
                const val = e?.target?.value !== undefined ? e.target.value : e;
                setPaymentLedgerId(val);
              }}
            />
          </div>

          {paymentMode !== 'CASH' && (
            <Input
              label="Reference / Transaction No"
              placeholder="e.g. UTR / Cheque #"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          )}

          <ReceiverBankFields
            paymentMode={paymentMode}
            value={receiverBank}
            onChange={setReceiverBank}
            size="sm"
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">
              Narration / Remarks
            </label>
            <textarea
              rows={3}
              placeholder="Enter payment remarks..."
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition resize-y"
            />
          </div>
        </form>
      </Modalbox>
    </div>
  );
};

export default DirectPayPage;
