import React from 'react';
import Input from '../../components/ui/Input';

export const EMPTY_RECEIVER_BANK = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
};

/**
 * Extracts optional receiver bank/UPI details from a voucher or its linked ledger
 * (Employee, Kisan Seller, or Business Developer / Sponsor).
 */
export function extractReceiverBankDetails(voucher, ledgers = []) {
  if (!voucher) return { ...EMPTY_RECEIVER_BANK };

  const saved = voucher.receiverBankDetails;
  if (saved && Object.values(saved).some((v) => typeof v === 'string' && v.trim())) {
    return {
      accountHolderName: saved.accountHolderName || '',
      bankName: saved.bankName || '',
      accountNumber: saved.accountNumber || '',
      ifscCode: saved.ifscCode || '',
      branchName: saved.branchName || '',
      upiId: saved.upiId || '',
    };
  }

  const ledgerObj =
    (voucher.ledgerId && typeof voucher.ledgerId === 'object' ? voucher.ledgerId : null) ||
    ledgers.find((l) => l._id === voucher.ledgerId) ||
    null;

  const emp =
    (voucher.employeeId && typeof voucher.employeeId === 'object' ? voucher.employeeId : null) ||
    (ledgerObj?.employeeId && typeof ledgerObj.employeeId === 'object' ? ledgerObj.employeeId : null);

  if (emp && (emp.acnumber || emp.bankName || emp.ifscCode || emp.upi || emp.acHolderName)) {
    return {
      accountHolderName: emp.acHolderName || emp.employeeName || '',
      bankName: emp.bankName || '',
      accountNumber: emp.acnumber || '',
      ifscCode: emp.ifscCode || '',
      branchName: emp.bankbranch || '',
      upiId: emp.upi || '',
    };
  }

  const seller = ledgerObj?.kisanSellerId && typeof ledgerObj.kisanSellerId === 'object'
    ? ledgerObj.kisanSellerId
    : null;

  if (seller?.bankDetails && (seller.bankDetails.accountNumber || seller.bankDetails.bankName || seller.bankDetails.ifscCode)) {
    return {
      accountHolderName: seller.name || '',
      bankName: seller.bankDetails.bankName || '',
      accountNumber: seller.bankDetails.accountNumber || '',
      ifscCode: seller.bankDetails.ifscCode || '',
      branchName: seller.bankDetails.branch || '',
      upiId: '',
    };
  }

  const sponsor =
    (voucher.sponsorId && typeof voucher.sponsorId === 'object' ? voucher.sponsorId : null) ||
    (ledgerObj?.sponsorId && typeof ledgerObj.sponsorId === 'object' ? ledgerObj.sponsorId : null);

  if (sponsor && (sponsor.accountNumber || sponsor.bankName || sponsor.ifscCode || sponsor.accountHolderName)) {
    return {
      accountHolderName: sponsor.accountHolderName || sponsor.name || '',
      bankName: sponsor.bankName || '',
      accountNumber: sponsor.accountNumber || '',
      ifscCode: sponsor.ifscCode || '',
      branchName: sponsor.bankBranch || '',
      upiId: '',
    };
  }

  return { ...EMPTY_RECEIVER_BANK };
}

export function sanitizeReceiverBankPayload(details) {
  if (!details || typeof details !== 'object') return null;
  const cleaned = {
    accountHolderName: (details.accountHolderName || '').trim(),
    bankName: (details.bankName || '').trim(),
    accountNumber: (details.accountNumber || '').trim(),
    ifscCode: (details.ifscCode || '').trim().toUpperCase(),
    branchName: (details.branchName || '').trim(),
    upiId: (details.upiId || '').trim(),
  };
  return Object.values(cleaned).some(Boolean) ? cleaned : null;
}

const ReceiverBankFields = ({
  value = EMPTY_RECEIVER_BANK,
  onChange,
  paymentMode = 'CASH',
  size = 'sm',
}) => {
  if (!paymentMode || paymentMode === 'CASH') return null;

  const hasAnyValue = Object.values(value || {}).some((v) => typeof v === 'string' && v.trim());

  const handleField = (field, nextVal) => {
    onChange({
      ...EMPTY_RECEIVER_BANK,
      ...value,
      [field]: nextVal,
    });
  };

  return (
    <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">
          Receiver Bank / UPI Details <span className="font-normal text-slate-400">(Optional)</span>
        </span>
        {hasAnyValue && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_RECEIVER_BANK })}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Input
          label="Account Holder Name"
          size={size}
          placeholder="Receiver name"
          value={value?.accountHolderName || ''}
          onChange={(e) => handleField('accountHolderName', e.target.value)}
        />
        <Input
          label="Bank Name"
          size={size}
          placeholder="e.g. State Bank of India"
          value={value?.bankName || ''}
          onChange={(e) => handleField('bankName', e.target.value)}
        />
        <Input
          label="Account Number"
          size={size}
          placeholder="Bank account number"
          value={value?.accountNumber || ''}
          onChange={(e) => handleField('accountNumber', e.target.value)}
        />
        <Input
          label="IFSC Code"
          size={size}
          placeholder="e.g. SBIN0001234"
          value={value?.ifscCode || ''}
          onChange={(e) => handleField('ifscCode', e.target.value.toUpperCase())}
        />
        <Input
          label="UPI ID"
          size={size}
          placeholder="e.g. name@upi"
          value={value?.upiId || ''}
          onChange={(e) => handleField('upiId', e.target.value)}
        />
        <Input
          label="Branch Name"
          size={size}
          placeholder="Bank branch"
          value={value?.branchName || ''}
          onChange={(e) => handleField('branchName', e.target.value)}
        />
      </div>
    </div>
  );
};

export default ReceiverBankFields;
