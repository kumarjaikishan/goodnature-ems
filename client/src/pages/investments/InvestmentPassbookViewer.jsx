import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/axios';
import PageLoader from '../../components/common/PageLoader';
import { toast } from '../../utils/toast';

const InvestmentPassbookViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/investments/accounts/${id}`);
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load passbook ledger');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <PageLoader title="Loading Passbook..." subtitle="Fetching payment schedule and deposit records" />;
  }

  const account = data?.account;
  const installments = data?.installments || [];
  const receipts = data?.receipts || [];

  if (!account) {
    return <div className="p-8 text-center text-slate-500">Account not found.</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      {/* Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Ledger
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
        >
          <Printer size={16} /> Print Passbook Statement
        </button>
      </div>

      {/* Passbook Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-10 shadow-xl rounded-3xl space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">Deposit Statement & Passbook</span>
            <h2 className="text-xl font-bold text-slate-900">
              Account No: <span className="font-mono text-teal-800">{account.accountNumber}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Member: {account.customerId?.name} ({account.customerId?.mobile})
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 block">Total Realized Deposit</span>
            <span className="text-xl font-black font-mono text-emerald-700">
              ₹{(account.totalPaidAmount || 0).toLocaleString('en-IN')}{' '}
              <span className="text-xs text-slate-400 font-normal">/ ₹{(account.totalDepositExpected || 0).toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>

        {/* Schedule / Receipts Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BookOpen size={15} className="text-teal-700" />
            {account.accountType === 'RD' ? 'Monthly Installment Schedule' : 'Deposit Receipt Ledger'}
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                  <th className="p-3">{account.accountType === 'RD' ? 'Inst. #' : 'Entry'}</th>
                  <th className="p-3">Due / Scheduled Date</th>
                  <th className="p-3">Expected Amount</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Paid Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {account.accountType === 'RD' ? (
                  installments.map((inst) => (
                    <tr key={inst._id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-700">#{inst.installmentNumber}</td>
                      <td className="p-3 text-slate-600">
                        {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">₹{inst.amount?.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        ₹{(inst.paidAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-slate-500">
                        {inst.paidDate
                          ? new Date(inst.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="p-3">
                        {inst.status === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  receipts.map((rcp) => (
                    <tr key={rcp._id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-teal-800">{rcp.receiptNumber}</td>
                      <td className="p-3 text-slate-600">
                        {new Date(rcp.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">₹{rcp.amount?.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">₹{rcp.amount?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-slate-500">{rcp.paymentMode?.toUpperCase()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rcp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentPassbookViewer;
