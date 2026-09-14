import React from 'react';
import { CreditCard } from 'lucide-react';
import Modalbox from '../../../../components/custommodal/Modalbox';

const RecordPaymentModal = ({
  open,
  onClose,
  targetAgreementForPayment,
  paymentForm,
  setPaymentForm,
  paymentLoading,
  handleSavePayment,
}) => {
  return (
    <Modalbox open={open} onClose={onClose} outside={false} maxWidth="max-w-md" showClose={false}>
      <div className="p-6 w-full space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-700" />
              Record Payment to Land Seller
            </h3>
            {targetAgreementForPayment && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Agreement: <strong className="text-teal-800">{targetAgreementForPayment.agreementNumber}</strong>{' '}
                ({targetAgreementForPayment.farmers?.[0]?.name || 'Seller'})
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer text-base">
            ✕
          </button>
        </div>

        <form onSubmit={handleSavePayment} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              placeholder="0"
              className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none px-3.5 rounded-xl text-xs font-bold font-mono text-slate-900"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none px-3.5 rounded-xl text-xs font-medium"
                value={paymentForm.paymentMode}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none px-3.5 rounded-xl text-xs font-medium"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Cheque Number</label>
            <input
              type="text"
              placeholder="UTR / Cheque No."
              className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none px-3.5 rounded-xl text-xs font-medium"
              value={paymentForm.transactionReference}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              placeholder="Advance, token money, registry disbursement note..."
              className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 outline-none p-3 rounded-xl text-xs font-medium resize-none"
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paymentLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              {paymentLoading ? 'Recording Payment...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default RecordPaymentModal;
