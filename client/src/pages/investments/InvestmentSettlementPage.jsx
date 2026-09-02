import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  Calculator,
  AlertTriangle,
  Check,
  Search,
  User,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

const InvestmentSettlementPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [preview, setPreview] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [settlementForm, setSettlementForm] = useState({
    settlementType: 'PREMATURE',
    settledAmount: '',
    paymentMode: 'bank_transfer',
    referenceNumber: '',
    remarks: '',
  });

  useEffect(() => {
    const fetchActiveAccounts = async () => {
      try {
        const res = await api.get('/investments/accounts?status=ACTIVE&limit=500');
        setAccounts(res.data.accounts || []);
      } catch (err) {
        toast.error('Failed to load accounts for settlement');
      } finally {
        setLoading(false);
      }
    };
    fetchActiveAccounts();
  }, []);

  const handleAccountSelect = async (accId) => {
    setSelectedAccountId(accId);
    if (!accId) {
      setPreview(null);
      return;
    }

    setCalcLoading(true);
    try {
      const res = await api.get(`/investments/accounts/${accId}/settlement-preview`);
      setPreview(res.data.data);
      setSettlementForm((prev) => ({
        ...prev,
        settledAmount: res.data.data.totalSettlementAmount || '',
      }));
    } catch (err) {
      toast.error('Failed to calculate settlement preview');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleProcessSettlement = async (e) => {
    e.preventDefault();
    if (!selectedAccountId) return toast.warn('Please select an account');
    if (!window.confirm('Are you sure you want to process this settlement and close the account?')) return;

    setSubmitLoading(true);
    try {
      await api.post(`/investments/accounts/${selectedAccountId}/settle`, settlementForm);
      toast.success('Account settled and closed successfully');
      navigate('/dashboard/investments/accounts');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process settlement');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSettlementTypeChange = (type) => {
    setSettlementForm((prev) => {
      let nextAmount = '';
      if (preview) {
        if (type === 'MATURITY') {
          nextAmount = preview.fullMaturityAmount || preview.account?.maturityAmount || '';
        } else if (type === 'PREMATURE') {
          nextAmount = preview.totalSettlementAmount || '';
        } else if (type === 'REFUND') {
          nextAmount = preview.principalPaid || '';
        }
      }
      return {
        ...prev,
        settlementType: type,
        settledAmount: nextAmount,
      };
    });
  };

  if (loading) {
    return <PageLoader title="Loading Settlement Calculator..." subtitle="Preparing premature settlement rules" />;
  }

  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
  const inputCls =
    'h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none px-3.5 rounded-xl font-medium text-xs md:text-sm text-slate-800 transition';

  const isMaturity = settlementForm.settlementType === 'MATURITY';
  const isPremature = settlementForm.settlementType === 'PREMATURE';
  const isRefund = settlementForm.settlementType === 'REFUND';

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Calculator size={22} />
            </span>
            Premature Settlement & Maturity Payout
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Calculate premature interest payout or full maturity release with audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form & Preview */}
        <div className="md:col-span-2 space-y-5">
          {/* Account Picker & Settlement Type Selector */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Select Active Account to Settle *</label>
                <select
                  className={inputCls}
                  value={selectedAccountId}
                  onChange={(e) => handleAccountSelect(e.target.value)}
                >
                  <option value="">-- Choose Account --</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountNumber} — {acc.customerId?.name} ({acc.accountType}, ₹{acc.totalPaidAmount?.toLocaleString('en-IN')} Paid)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Settlement Type *</label>
                <select
                  className={inputCls}
                  value={settlementForm.settlementType}
                  onChange={(e) => handleSettlementTypeChange(e.target.value)}
                >
                  <option value="PREMATURE">Premature Closure (6% Annual SI)</option>
                  <option value="MATURITY">Full Maturity Payout (Plan Rate)</option>
                  <option value="REFUND">Principal Refund / Cancel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calculator Breakdown Card */}
          {calcLoading ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400">
              Calculating settlement breakdown...
            </div>
          ) : preview ? (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Coins size={16} className="text-teal-700" />
                {isMaturity
                  ? 'Full Maturity Payout Calculation'
                  : isPremature
                  ? 'Premature Closure Calculation'
                  : 'Principal Refund Calculation'}
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Principal Paid:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ₹{(preview.principalPaid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Active Period Elapsed:</span>
                  <span className="font-bold text-slate-900 text-sm">{preview.monthsElapsed} Months / {preview.tenureMonths} Months</span>
                </div>

                {isMaturity ? (
                  <>
                    <div>
                      <span className="text-slate-400 block">Guaranteed Maturity Multiplier:</span>
                      <span className="font-bold text-teal-800 text-sm">
                        {preview.maturityRatePercent}% Total Return
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Full Maturity Release Amount:</span>
                      <span className="font-mono font-black text-emerald-800 text-base">
                        ₹{(preview.fullMaturityAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                ) : isPremature ? (
                  <>
                    <div>
                      <span className="text-slate-400 block">Premature Simple Interest ({preview.prematureAnnualRate}% P.A.):</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        + ₹{(preview.accruedInterest || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Premature Payout Amount:</span>
                      <span className="font-mono font-black text-amber-800 text-base">
                        ₹{(preview.totalSettlementAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-slate-400 block">Total Refund Amount:</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      ₹{(preview.principalPaid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Settlement Form */}
              <form onSubmit={handleProcessSettlement} className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <label className={labelCls}>Settled Amount (₹) *</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={settlementForm.settledAmount}
                    onChange={(e) => setSettlementForm({ ...settlementForm, settledAmount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Disbursement Mode</label>
                    <select
                      className={inputCls}
                      value={settlementForm.paymentMode}
                      onChange={(e) => setSettlementForm({ ...settlementForm, paymentMode: e.target.value })}
                    >
                      <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="cheque">Cheque</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Cheque / Reference Number</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={settlementForm.referenceNumber}
                      onChange={(e) => setSettlementForm({ ...settlementForm, referenceNumber: e.target.value })}
                      placeholder="e.g. UTR / Cheque Ref"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Remarks / Settlement Reason</label>
                  <textarea
                    className="w-full h-18 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                    value={settlementForm.remarks}
                    onChange={(e) => setSettlementForm({ ...settlementForm, remarks: e.target.value })}
                    placeholder="Reason for premature closure or maturity remarks..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  {submitLoading ? 'Processing...' : 'Process Settlement & Close Account'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
              Select an active deposit account to calculate settlement figures.
            </div>
          )}
        </div>

        {/* Right Col: Settlement Policy Notice */}
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3 text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldAlert size={16} className="text-amber-700" />
              Settlement Terms
            </h4>
            <p className="leading-relaxed">
              Premature closure cancels future maturity promises and applies the company's agreed simple interest rate on total collected principal.
            </p>
            <p className="leading-relaxed">
              Once an account is settled, its status becomes permanent and no further installments can be collected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSettlementPage;
