import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';

const SponsorLedgerModal = ({ sponsor, onClose, loading, ledgerData }) => {
  if (!sponsor) return null;

  return (
    <Modalbox open={Boolean(sponsor)} onClose={onClose}>
      <div className="p-6 bg-white rounded-2xl w-[800px] max-w-[90vw] space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Plot Sponsor Commission Ledger — {sponsor?.name} ({sponsor?.customerId})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Individual plot commission credit statement for sponsor {sponsor?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer transition p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Loading ledger entries...</div>
          ) : ledgerData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-xs font-medium">
              No commission entries found for this sponsor.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
                  <th className="p-3 uppercase">Date</th>
                  <th className="p-3 uppercase">From Customer</th>
                  <th className="p-3 uppercase">Plot #</th>
                  <th className="p-3 uppercase text-right">Collection Amount</th>
                  <th className="p-3 uppercase text-right">Commission %</th>
                  <th className="p-3 uppercase text-right font-bold">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerData.map((entry) => {
                  const collectionAmount =
                    entry.commissionPercent > 0
                      ? Math.round((entry.amount / (entry.commissionPercent / 100)) * 100) / 100
                      : entry.installmentId?.dueAmount || entry.bookingId?.plotValue || 0;

                  return (
                    <tr key={entry._id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 whitespace-nowrap font-bold text-slate-800">
                        {entry.customerId?.name || 'Unknown'}{' '}
                        <span className="text-[0.65rem] text-slate-400">({entry.customerId?.customerId || '-'})</span>
                      </td>
                      <td className="p-3 font-semibold text-teal-700 whitespace-nowrap">
                        Plot #{entry.bookingId?.plotId?.plotNumber || '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700 whitespace-nowrap">
                        ₹{Number(collectionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-500 whitespace-nowrap">
                        {entry.commissionPercent}%
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        +₹{Number(entry.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modalbox>
  );
};

export default SponsorLedgerModal;
