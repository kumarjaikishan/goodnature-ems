import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import { History, Edit3 } from 'lucide-react';

const RevisionsAuditModal = ({
  booking,
  onClose,
  loading,
  revisionsData,
  editingNarrationId,
  setEditingNarrationId,
  editingNarrationText,
  setEditingNarrationText,
  handleSaveNarration,
  savingNarration,
}) => {
  if (!booking) return null;

  return (
    <Modalbox open={Boolean(booking)} onClose={onClose} outside={true} size="3xl">
      <div className="p-6 w-full space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Contract Revision & Audit Trail #{booking?.bookingNumber}
              </h3>
              <p className="text-[11px] text-slate-500">
                Track every edit, tenure change, land sourcing shift, and financial recalculation.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading revision audits...</div>
          ) : revisionsData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <History size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No revisions recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-1">This booking is in its original contracted state (Revision #0).</p>
            </div>
          ) : (
            revisionsData.map((rev) => (
              <div key={rev._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                      Revision #{rev.revisionNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {new Date(rev.revisionDate || rev.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Edited By: {rev.editedBy?.name || 'Authorized Admin'}
                  </span>
                </div>

                {/* 1. Admin / User Custom Narration */}
                <div className="bg-white p-3.5 rounded-xl border border-teal-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>📝 Admin / Editor Narration:</span>
                    </span>
                    {editingNarrationId !== rev._id ? (
                      <button
                        onClick={() => {
                          setEditingNarrationId(rev._id);
                          setEditingNarrationText(rev.adminNarration || rev.reason || '');
                        }}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 size={12} /> Edit Narration
                      </button>
                    ) : null}
                  </div>

                  {editingNarrationId === rev._id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editingNarrationText}
                        onChange={(e) => setEditingNarrationText(e.target.value)}
                        rows="2"
                        className="w-full bg-teal-50/30 border border-teal-300 focus:ring-2 focus:ring-teal-600 outline-none p-2.5 rounded-xl font-medium text-xs text-slate-800 transition resize-none"
                        placeholder="Enter reason / narration for this contract revision..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingNarrationId(null)}
                          disabled={savingNarration}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveNarration(rev._id)}
                          loading={savingNarration}
                        >
                          Save Narration
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 font-medium">
                      {rev.adminNarration || rev.reason || 'No custom narration provided.'}
                    </p>
                  )}
                </div>

                {/* 2. Automatic System Log */}
                {rev.systemLog && (
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-xl space-y-1 font-mono text-[11px] shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider block">
                      ⚙️ System Audit Trace (Auto-Generated Log):
                    </span>
                    <pre className="whitespace-pre-wrap font-sans text-slate-200 text-xs leading-relaxed">
                      {rev.systemLog}
                    </pre>
                  </div>
                )}

                {/* 3. Specific Changes Highlights */}
                {Array.isArray(rev.changedFields) && rev.changedFields.length > 0 && (
                  <div className="bg-teal-50/40 border border-teal-200 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-black uppercase text-teal-950 tracking-wider block">
                      🎯 Specific Attributes Modified in this Revision ({rev.changedFields.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {rev.changedFields.map((cf, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded-lg border border-teal-100 flex flex-col justify-between shadow-2xs"
                        >
                          <span className="font-bold text-slate-700">{cf.label || cf.field}</span>
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px]">
                            <span className="text-rose-600 line-through truncate max-w-[120px]">
                              {String(cf.oldValue ?? 'None')}
                            </span>
                            <span className="text-slate-400 font-bold">→</span>
                            <span className="text-emerald-700 font-bold truncate max-w-[120px]">
                              {String(cf.newValue ?? 'None')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparison Grid: Previous vs New */}
                <div className="grid grid-cols-2 gap-3 text-slate-700 text-[11px]">
                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5">
                    <h5 className="font-black text-rose-900 text-[10px] uppercase tracking-wider">Previous State</h5>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-slate-800">{rev.previousSnapshot?.customerName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot #:</span>
                      <span className="font-bold text-slate-800">
                        {rev.previousSnapshot?.plotNumber ? `Plot #${rev.previousSnapshot.plotNumber}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot Size:</span>
                      <span className="font-mono font-bold">{rev.previousSnapshot?.plotSize || '-'} Sq.Ft.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenure / Scheme:</span>
                      <span className="font-bold">
                        {rev.previousSnapshot?.tenureMonths
                          ? `${rev.previousSnapshot.tenureMonths} Mos (EMI)`
                          : 'One Time'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot Value:</span>
                      <span className="font-mono font-bold">
                        ₹{(rev.previousSnapshot?.plotValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{(rev.previousSnapshot?.discount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Effective Rate:</span>
                      <span className="font-mono font-bold">
                        ₹{rev.previousSnapshot?.effectiveRate || rev.previousSnapshot?.basePlotRate || 0}/sqft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Downpayment (40%):</span>
                      <span className="font-mono font-bold text-teal-800">
                        ₹{(rev.previousSnapshot?.downpaymentAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly EMI:</span>
                      <span className="font-mono font-bold">
                        ₹{(rev.previousSnapshot?.emiMonthlyAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Promoter Comm %:</span>
                      <span className="font-bold text-indigo-700">
                        {rev.previousSnapshot?.promoterCommissionPercent || 10}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sponsor:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[130px]">
                        {rev.previousSnapshot?.sponsorName || 'Direct'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                    <h5 className="font-black text-emerald-900 text-[10px] uppercase tracking-wider">
                      New Restructured State
                    </h5>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold text-emerald-900">{rev.newSnapshot?.customerName || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot #:</span>
                      <span className="font-bold text-emerald-900">
                        {rev.newSnapshot?.plotNumber ? `Plot #${rev.newSnapshot.plotNumber}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot Size:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        {rev.newSnapshot?.plotSize || '-'} Sq.Ft.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenure / Scheme:</span>
                      <span className="font-bold text-emerald-900">
                        {rev.newSnapshot?.tenureMonths ? `${rev.newSnapshot.tenureMonths} Mos (EMI)` : 'One Time'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plot Value:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        ₹{(rev.newSnapshot?.plotValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{(rev.newSnapshot?.discount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Effective Rate:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        ₹{rev.newSnapshot?.effectiveRate || rev.newSnapshot?.basePlotRate || 0}/sqft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Downpayment (40%):</span>
                      <span className="font-mono font-bold text-emerald-900">
                        ₹{(rev.newSnapshot?.downpaymentAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly EMI:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        ₹{(rev.newSnapshot?.emiMonthlyAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Promoter Comm %:</span>
                      <span className="font-bold text-emerald-800">
                        {rev.newSnapshot?.promoterCommissionPercent || 10}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sponsor:</span>
                      <span className="font-bold text-emerald-900 truncate max-w-[130px]">
                        {rev.newSnapshot?.sponsorName || 'Direct'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modalbox>
  );
};

export default RevisionsAuditModal;
