import React from 'react';
import Modalbox from '@/components/custommodal/Modalbox';
import Button from '@/components/ui/Button';
import { DateInput } from '@/components/ui/DateInput';
import { amountInWords } from '@/utils/numToWord';

const SetupPayoutModal = ({ booking, onClose, onSubmit, form, setForm, saving }) => {
  if (!booking) return null;

  return (
    <Modalbox
      open={Boolean(booking)}
      onClose={onClose}
      size="lg"
      title="Setup Weekly Payouts"
      subtitle="Money-Back Return Scheme"
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" form="setup-payout-form" loading={saving}>
            Initialize Payouts
          </Button>
        </>
      }
    >
      <div className="w-full space-y-4">
        <p className="text-xs text-slate-600 font-medium">
          Configure money-back payouts for fully paid booking{' '}
          <strong className="text-slate-900">{booking?.bookingNumber}</strong> (Plot{' '}
          <strong className="text-teal-800">{booking?.plotId?.plotNumber}</strong>).
        </p>

        <form id="setup-payout-form" onSubmit={onSubmit} className="space-y-4">
          <DateInput
            label="Payout Start Date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />

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
            {form.weeklyAmount && Number(form.weeklyAmount) > 0 && (
              <span className="text-[11px] text-teal-700 font-semibold mt-0.5 pl-1">
                {amountInWords(form.weeklyAmount, { only: true })}
              </span>
            )}
          </div>
        </form>
      </div>
    </Modalbox>
  );
};

export default SetupPayoutModal;
