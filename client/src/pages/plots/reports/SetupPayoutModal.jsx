import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';

const SetupPayoutModal = ({ booking, onClose, onSubmit, form, setForm, saving }) => {
  if (!booking) return null;

  return (
    <Modalbox open={Boolean(booking)} onClose={onClose}>
      <div className="p-6 bg-white rounded-2xl w-[480px] max-w-[90vw] space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Setup Weekly Payouts</h3>
            <p className="text-xs text-slate-500 font-medium">Money-Back Return Scheme</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer transition p-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium">
          Configure money-back payouts for fully paid booking{' '}
          <strong className="text-slate-900">{booking?.bookingNumber}</strong> (Plot{' '}
          <strong className="text-teal-800">{booking?.plotId?.plotNumber}</strong>).
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Payout Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">
              Weekly Return Amount (₹) <span className="text-slate-500 font-normal">(Calculated: Plot Value / 500)</span>
            </label>
            <input
              type="number"
              value={form.weeklyAmount}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              Initialize Payouts
            </Button>
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default SetupPayoutModal;
