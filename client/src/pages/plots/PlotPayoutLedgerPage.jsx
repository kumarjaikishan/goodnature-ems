import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import PageLoader from '../../components/common/PageLoader';
import { 
  HiOutlineBanknotes, 
  HiOutlinePrinter, 
  HiOutlineArrowLeft, 
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlinePencilSquare
} from 'react-icons/hi2';

const PlotPayoutLedgerPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ 
    amountPaid: '', 
    paymentMode: 'cash', 
    transactionReference: '', 
    remarks: '' 
  });
  const [payoutFormSaving, setPayoutFormSaving] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState(null);

  const fetchLedgerAndBooking = async () => {
    setLoading(true);
    try {
      // 1. Fetch booking details to show info at top
      const bookingRes = await api.get(`/plots/bookings/${bookingId}`);
      setBooking(bookingRes.data.data);

      // 2. Fetch payout ledger
      const ledgerRes = await api.get(`/plots/bookings/${bookingId}/payout/ledger`);
      setLedgerData(ledgerRes.data.data);
    } catch {
      toast.error('Failed to load payout ledger details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchLedgerAndBooking();
    }
  }, [bookingId]);

  const handleRecordPayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutForm.amountPaid || Number(payoutForm.amountPaid) <= 0) {
      return toast.error('Please enter a valid amount');
    }
    setPayoutFormSaving(true);
    try {
      if (editingVoucherId) {
        await api.put(`/plots/payout-vouchers/${editingVoucherId}`, {
          amountPaid: Number(payoutForm.amountPaid),
          paymentMode: payoutForm.paymentMode,
          transactionReference: payoutForm.paymentMode === 'cash' ? '' : payoutForm.transactionReference,
          remarks: payoutForm.remarks,
        });
        toast.success('Payout payment updated successfully');
      } else {
        const res = await api.post(`/plots/bookings/${bookingId}/payout/pay`, {
          amountPaid: Number(payoutForm.amountPaid),
          paymentMode: payoutForm.paymentMode,
          transactionReference: payoutForm.paymentMode === 'cash' ? '' : payoutForm.transactionReference,
          remarks: payoutForm.remarks,
        });
        toast.success('Payout payment recorded successfully');
        
        // Auto open voucher/print page
        const voucher = res.data.data;
        if (voucher && voucher._id) {
          navigate(`/plot/payout-voucher/print/${voucher._id}`);
        }
      }
      setShowPayoutForm(false);
      setEditingVoucherId(null);
      setPayoutForm({ amountPaid: '', paymentMode: 'cash', transactionReference: '', remarks: '' });
      await fetchLedgerAndBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payout payment');
    } finally {
      setPayoutFormSaving(false);
    }
  };

  const handleEditClick = (tx) => {
    if (!ledgerData || !ledgerData.vouchers) return;
    const voucher = ledgerData.vouchers.find(v => v._id === tx.voucherId);
    if (!voucher) return;

    setEditingVoucherId(tx.voucherId);
    setPayoutForm({
      amountPaid: voucher.amountPaid,
      paymentMode: voucher.paymentMode,
      transactionReference: voucher.transactionReference || '',
      remarks: voucher.remarks || '',
    });
    setShowPayoutForm(true);
  };

  const handleDeletePayout = async (voucherId, voucherNumber) => {
    if (!window.confirm(`Are you sure you want to delete and reverse payout voucher #${voucherNumber}?`)) {
      return;
    }
    try {
      await api.delete(`/plots/payout-vouchers/${voucherId}`);
      toast.success(`Payout voucher #${voucherNumber} deleted and reversed successfully`);
      await fetchLedgerAndBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payout voucher');
    }
  };

  const getLedgerTransactions = () => {
    if (!ledgerData) return [];
    const transactions = [];

    // Add schedules (Credits)
    (ledgerData.schedules || []).forEach(s => {
      // Find ordinal suffix for week number
      const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      transactions.push({
        id: `schedule-${s._id}`,
        date: new Date(s.dueDate),
        particulars: `Payout credit for ${getOrdinal(s.weekNumber)} week`,
        reference: '-',
        credit: s.amount,
        debit: 0,
        type: 'credit'
      });
    });

    // Add vouchers (Debits)
    (ledgerData.vouchers || []).forEach(v => {
      transactions.push({
        id: `voucher-${v._id}`,
        date: new Date(v.payoutDate),
        particulars: v.remarks ? v.remarks : `Payout Debit (Voucher #${v.voucherNumber})`,
        reference: v.voucherNumber,
        credit: 0,
        debit: v.amountPaid,
        type: 'debit',
        voucherId: v._id,
        paymentMode: v.paymentMode
      });
    });

    // Sort chronologically by date
    transactions.sort((a, b) => {
      const diff = a.date - b.date;
      if (diff !== 0) return diff;
      if (a.type === 'credit' && b.type === 'debit') return -1;
      if (a.type === 'debit' && b.type === 'credit') return 1;
      return 0;
    });

    // Calculate running balance
    let balance = 0;
    const computedTx = transactions.map(t => {
      if (t.type === 'credit') {
        balance += t.credit;
      } else {
        balance -= t.debit;
      }
      return {
        ...t,
        balance
      };
    });

    // Return in descending order (newest on top)
    return computedTx.reverse();
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading Customer Payout Ledger..."
        subtitle="Calculating returns, vouchers, and credit ledger"
      />
    );
  }

  if (!ledgerData || !booking) {
    return (
      <div className="p-6 text-center text-slate-500 italic">
        Ledger details not found.
        <div className="mt-4">
          <button 
            onClick={() => navigate('/dashboard/plots/booking')}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const labelCls = "text-[0.68rem] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500";
  const inputCls = "w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500/50 outline-none px-3 py-2 rounded-sm font-semibold text-xs text-slate-800 dark:text-slate-200 transition";

  const editingVoucherAmount = editingVoucherId && ledgerData && ledgerData.vouchers
    ? (ledgerData.vouchers.find(x => x._id === editingVoucherId)?.amountPaid || 0)
    : 0;
  const maxAmount = ledgerData ? (ledgerData.summary.netDue + editingVoucherAmount) : 0;

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_300ms_ease] p-2">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/plot-reports')}
            className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-slate-600 dark:text-slate-300"
            title="Back to Reports"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span className="bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded text-[0.7rem] uppercase tracking-wider font-black">
                Ledger
              </span>
              Weekly Return Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Booking Contract: <span className="font-bold text-slate-700 dark:text-slate-300">{booking.bookingNumber}</span> | Customer: <span className="font-bold text-slate-700 dark:text-slate-300">{booking.customerId?.name || booking.customerName}</span> (Plot {booking.plotId?.plotNumber})
            </p>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm flex flex-col justify-between">
          <span className="text-[0.65rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Accumulated return</span>
          <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
            ₹{ledgerData.summary.totalAccumulated.toLocaleString('en-IN')}
          </h4>
        </div>
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm flex flex-col justify-between">
          <span className="text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid return</span>
          <h4 className="text-xl font-black text-emerald-600 mt-2">
            ₹{ledgerData.summary.totalPaid.toLocaleString('en-IN')}
          </h4>
        </div>
        <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[0.65rem] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Net Due Balance</span>
            <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
              ₹{ledgerData.summary.netDue.toLocaleString('en-IN')}
            </h4>
          </div>
          {ledgerData.summary.netDue > 0 && !showPayoutForm && (
            <button
              onClick={() => {
                setShowPayoutForm(true);
                setPayoutForm({
                  amountPaid: ledgerData.summary.netDue,
                  paymentMode: 'cash',
                  transactionReference: '',
                  remarks: ''
                });
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm font-bold text-xs cursor-pointer transition shadow-md shadow-indigo-500/10"
            >
              Pay Due Amount
            </button>
          )}
        </div>
      </div>


      {/* Record Payout Form */}
      {showPayoutForm && (
        <div className="p-5 border border-indigo-200 dark:border-indigo-900 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-sm animate-[fadeIn_200ms_ease] shadow-sm">
          <h4 className="text-xs font-black uppercase text-indigo-650 dark:text-indigo-400 mb-4 tracking-wider flex items-center gap-1.5">
            <HiOutlineBanknotes className="w-4 h-4 animate-pulse" /> {editingVoucherId ? 'Edit Payout Payment' : 'Record Payout Payment'}
          </h4>
          <form onSubmit={handleRecordPayoutSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Amount (₹)</label>
              <input
                type="number"
                className={inputCls}
                value={payoutForm.amountPaid}
                onChange={e => setPayoutForm({ ...payoutForm, amountPaid: e.target.value })}
                required
                max={maxAmount}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Payment Mode</label>
              <select
                className={inputCls}
                value={payoutForm.paymentMode}
                onChange={e => setPayoutForm({ ...payoutForm, paymentMode: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / Online</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
            {payoutForm.paymentMode !== 'cash' && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Ref / Transaction No.</label>
                <input
                  type="text"
                  className={inputCls}
                  value={payoutForm.transactionReference}
                  onChange={e => setPayoutForm({ ...payoutForm, transactionReference: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Narration</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Weekly payout money back payment"
                value={payoutForm.remarks}
                onChange={e => setPayoutForm({ ...payoutForm, remarks: e.target.value })}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4 justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPayoutForm(false);
                  setEditingVoucherId(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payoutFormSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-sm cursor-pointer disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <HiOutlineCheckCircle /> {payoutFormSaving ? 'Saving...' : editingVoucherId ? 'Save Changes' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified chronological ledger sheet */}
      <div className="flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-[0.68rem] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
          Chronological Account Ledger Statement
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/30 dark:bg-slate-900/20 border-b border-slate-200 dark:border-slate-800 font-bold select-none text-[0.62rem] text-slate-400 uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Particulars / Narration</th>
                <th className="p-3 font-mono">Voucher / Ref</th>
                <th className="p-3 text-right">Credit (+)</th>
                <th className="p-3 text-right">Debit (-)</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {getLedgerTransactions().length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center italic text-slate-400">No transactions accrued or payments recorded.</td>
                </tr>
              ) : (
                getLedgerTransactions().map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/5 transition">
                    <td className="p-3 text-slate-500 font-medium whitespace-nowrap">
                      {tx.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {tx.type === 'credit' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-indigo-650 dark:text-indigo-400 font-bold">{tx.particulars}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-slate-850 dark:text-slate-100 font-bold">{tx.particulars}</span>
                          <span className="text-[0.65rem] text-slate-400 font-normal uppercase mt-0.5">Mode: {tx.paymentMode}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-500">{tx.reference}</td>
                    <td className="p-3 text-right font-bold text-indigo-650 dark:text-indigo-400">
                      {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-450">
                      {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                      ₹{tx.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right">
                      {tx.type === 'debit' && tx.voucherId ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(tx)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-450 hover:text-amber-700 rounded border border-slate-200 dark:border-slate-700/60 cursor-pointer transition inline-flex items-center"
                            title="Edit Voucher"
                          >
                            <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/plot/payout-voucher/print/${tx.voucherId}`)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-605 dark:text-slate-350 hover:text-indigo-650 dark:hover:text-indigo-400 rounded border border-slate-200 dark:border-slate-700/60 cursor-pointer transition inline-flex items-center"
                            title="Print Voucher"
                          >
                            <HiOutlinePrinter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePayout(tx.voucherId, tx.reference)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-450 hover:text-red-700 rounded border border-slate-200 dark:border-slate-700/60 cursor-pointer transition inline-flex items-center"
                            title="Delete Voucher"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlotPayoutLedgerPage;
