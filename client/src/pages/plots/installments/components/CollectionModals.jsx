import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import numberToWords from '@/utils/numToWord';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none';

export const EditReceiptModal = ({
  editingReceipt,
  onClose,
  onSubmit,
  editForm,
  setEditForm,
  editLoading,
}) => {
  if (!editingReceipt) return null;

  return (
    <Modalbox
      open={Boolean(editingReceipt)}
      onClose={onClose}
      title={`Edit Collection: ${editingReceipt?.receiptNumber || ''}`}
      subtitle="Update payment details and remarks"
      maxWidth="max-w-xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Collection Amount (₹)</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              className={inputCls}
              value={editForm.amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setEditForm({ ...editForm, amount: val });
              }}
              placeholder="Enter collected cash"
              required
            />
            {editForm.amount && Number(editForm.amount) > 0 ? (
              <p className="text-[0.7rem] font-bold text-teal-800 mt-1 capitalize bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1">
                {numberToWords(Math.floor(Number(editForm.amount)))} Rupees Only
              </p>
            ) : null}
          </div>

          {editingReceipt?.bookingId?.scheme === 'MONTHLY_INSTALLMENT' && (
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Late Fine Rebate (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                className={inputCls}
                value={editForm.lateFineRebate}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setEditForm({ ...editForm, lateFineRebate: val });
                }}
                placeholder="Enter rebate amount"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Payment Mode</label>
            <select
              className={inputCls}
              value={editForm.paymentMode}
              onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI / Online</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="neft_rtgs">NEFT / RTGS</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>Payment Date</label>
            <input
              type="date"
              className={inputCls}
              value={editForm.createdAt}
              onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
            />
          </div>

          {editForm.paymentMode !== 'cash' && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={labelCls}>
                {editForm.paymentMode === 'cheque' ? 'Cheque Number (6 Digits)' : 'Reference / UTR / Transaction No.'}
              </label>
              <input
                className={inputCls}
                type={editForm.paymentMode === 'cheque' ? 'tel' : 'text'}
                inputMode={editForm.paymentMode === 'cheque' ? 'numeric' : 'text'}
                maxLength={editForm.paymentMode === 'cheque' ? 6 : 50}
                pattern={editForm.paymentMode === 'cheque' ? '[0-9]{6}' : undefined}
                placeholder={editForm.paymentMode === 'cheque' ? 'e.g. 045123' : 'Enter UTR / Transaction Reference'}
                value={editForm.transactionReference}
                onChange={(e) => {
                  let val = e.target.value;
                  if (editForm.paymentMode === 'cheque') {
                    val = val.replace(/[^0-9]/g, '').slice(0, 6);
                  }
                  setEditForm({ ...editForm, transactionReference: val });
                }}
                required
              />
              {editForm.paymentMode === 'cheque' && editForm.transactionReference && editForm.transactionReference.length !== 6 && (
                <span className="text-[10px] text-amber-600 font-semibold mt-0.5">
                  {editForm.transactionReference.length}/6 digits entered
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelCls}>Narration / Remarks</label>
            <textarea
              className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-teal-600 outline-none p-3 rounded-xl font-medium text-sm text-slate-800 transition min-h-[70px] resize-none"
              value={editForm.remarks}
              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              placeholder="Enter notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100 shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={editLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modalbox>
  );
};

export const ApproveReceiptModal = ({
  approvingReceipt,
  onClose,
  onSubmit,
  actionLoading,
}) => {
  if (!approvingReceipt) return null;

  return (
    <Modalbox
      open={Boolean(approvingReceipt)}
      onClose={onClose}
      title={`Approve Collection: ${approvingReceipt?.receiptNumber || ''}`}
      maxWidth="max-w-md"
    >
      <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-3">
        <p>
          Are you approving the receipt of payment for{' '}
          <strong className="text-slate-900 font-bold">
            {approvingReceipt?.bookingId?.customerId?.name || 'Customer'}
          </strong>{' '}
          ({approvingReceipt?.bookingId?.bookingNumber})?
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs text-emerald-900 font-medium">
          <div className="flex justify-between">
            <span>Amount to Realize:</span>
            <strong className="text-emerald-800 font-bold font-mono">
              ₹{(approvingReceipt?.amount || 0).toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>Payment Mode:</span>
            <strong className="uppercase">{approvingReceipt?.paymentMode}</strong>
          </div>
          {approvingReceipt?.transactionReference && (
            <div className="flex justify-between">
              <span>Reference / UTR:</span>
              <strong className="font-mono">{approvingReceipt.transactionReference}</strong>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          Upon approval, this payment will immediately update the customer's outstanding balance, mark the installment as
          paid, and sync sponsor commission schedules.
        </p>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 shrink-0">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="success" size="sm" loading={actionLoading} onClick={onSubmit}>
          Yes, Approve & Realize
        </Button>
      </div>
    </Modalbox>
  );
};

export const RejectReceiptModal = ({
  rejectingReceipt,
  onClose,
  onSubmit,
  rejectionReason,
  setRejectionReason,
  actionLoading,
}) => {
  if (!rejectingReceipt) return null;

  return (
    <Modalbox
      open={Boolean(rejectingReceipt)}
      onClose={onClose}
      title={`Reject Collection: ${rejectingReceipt?.receiptNumber || ''}`}
      maxWidth="max-w-md"
    >
      <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-3">
        <p>
          Rejecting payment of{' '}
          <strong className="text-rose-700 font-bold">
            ₹{(rejectingReceipt?.amount || 0).toLocaleString('en-IN')}
          </strong>{' '}
          ({rejectingReceipt?.paymentMode?.toUpperCase()}). This payment will not be credited to the customer's account.
        </p>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>Reason for Rejection</label>
          <textarea
            className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none p-2.5 rounded-xl font-medium text-xs text-slate-800 transition min-h-[70px] resize-none"
            placeholder="e.g. Cheque bounced / Transaction UTR not credited in company account..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 shrink-0">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" loading={actionLoading} onClick={onSubmit}>
          Confirm Rejection
        </Button>
      </div>
    </Modalbox>
  );
};

export const DeleteReceiptModal = ({
  deletingReceipt,
  onClose,
  onSubmit,
  deleteLoading,
}) => {
  if (!deletingReceipt) return null;

  return (
    <Modalbox
      open={Boolean(deletingReceipt)}
      onClose={onClose}
      title={`Reverse Collection: ${deletingReceipt?.receiptNumber || ''}`}
      maxWidth="max-w-md"
    >
      <div className="text-xs text-slate-600 font-medium leading-relaxed space-y-2">
        <p>
          Are you sure you want to reverse and delete this installment payment of{' '}
          <strong className="text-rose-600 font-bold">
            ₹{(deletingReceipt?.amount || 0).toLocaleString('en-IN')}
          </strong>
          ?
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-500">
          <li>Restore the customer's outstanding balance.</li>
          <li>Reset the paid installments to PENDING status.</li>
          <li>Permanently delete sponsor commission schedules generated by this transaction.</li>
        </ul>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100 shrink-0">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" loading={deleteLoading} onClick={onSubmit}>
          Yes, Delete & Reverse
        </Button>
      </div>
    </Modalbox>
  );
};
