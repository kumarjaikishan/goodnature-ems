import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Phone,
  User,
  CreditCard,
  Clock,
  Coins,
  ArrowRight,
} from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

const InvestmentDuesReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState([]);

  useEffect(() => {
    const fetchDues = async () => {
      try {
        const res = await api.get('/investments/dues');
        setDues(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load dues report');
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
  }, []);

  if (loading) {
    return <PageLoader title="Loading Dues Report..." subtitle="Scanning active RD accounts for overdue installments" />;
  }

  const totalOverdueAmount = dues.reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle size={22} />
            </span>
            Installment Dues & Defaulters
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Real-time monitoring of overdue and pending monthly Recurring Deposit (R.D.) installments.
          </p>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-rose-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Installments</span>
          <p className="text-2xl font-black text-rose-900 font-mono mt-1">{dues.length}</p>
        </div>
        <div className="p-5 bg-white border border-amber-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Overdue Principal</span>
          <p className="text-2xl font-black text-amber-900 font-mono mt-1">₹{totalOverdueAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-5 bg-white border border-teal-200 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Affected Members</span>
          <p className="text-2xl font-black text-teal-900 font-mono mt-1">
            {new Set(dues.map((d) => d.accountId?._id)).size}
          </p>
        </div>
      </div>

      {/* Dues List Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Pending & Overdue Installment List</h3>
        </div>

        {dues.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium italic">
            🎉 Excellent! There are no overdue installments across all active RD accounts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3.5">Account No.</th>
                  <th className="p-3.5">Member Name</th>
                  <th className="p-3.5">Contact No.</th>
                  <th className="p-3.5">Inst. #</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Due Amount</th>
                  <th className="p-3.5">Sponsor</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dues.map((d) => {
                  const acc = d.accountId;
                  const cust = acc?.customerId;
                  const dueAmt = d.amount - (d.paidAmount || 0);

                  return (
                    <tr key={d._id} className="hover:bg-rose-50/40 transition">
                      <td className="p-3.5 font-mono font-bold text-teal-800">{acc?.accountNumber}</td>
                      <td className="p-3.5 font-bold text-slate-800">{cust?.name || 'N/A'}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{cust?.mobile || '-'}</td>
                      <td className="p-3.5 font-bold text-slate-700">Installment #{d.installmentNumber}</td>
                      <td className="p-3.5 text-rose-700 font-bold">
                        {new Date(d.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 font-mono font-black text-rose-800">
                        ₹{dueAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {acc?.sponsorId?.name || 'Direct'}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => navigate('/dashboard/investments/collections')}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <CreditCard size={13} /> Collect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentDuesReport;
