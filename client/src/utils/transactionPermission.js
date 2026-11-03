export const BANK_MODES = new Set([
  'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI', 'NEFT', 'RTGS', 'NEFT_RTGS', 'DD', 'NET_BANKING', 'CARD', 'POS'
]);

export const isCashTransaction = (item) => {
  if (!item) return false;
  const mode = String(item.paymentMode || item.mode || '').trim().toUpperCase();
  if (mode === 'CASH') return true;
  if (BANK_MODES.has(mode)) return false;

  const ledgerType = String(item.ledgerType || item.paymentLedgerId?.ledgerType || '').toLowerCase();
  if (ledgerType === 'user_cash' || ledgerType === 'cash') return true;
  if (ledgerType === 'bank') return false;

  if (item.bankName || item.accountNumber || item.paymentLedgerId?.bankName) return false;

  const text = `${item.particulars || ''} ${item.particular || ''} ${item.remarks || ''} ${item.notes || ''}`.toLowerCase();
  if (text.includes('via cash') || text.includes('by cash') || text.includes('in cash') || text.includes('cash payment') || text.includes('cash receipt') || text.includes('cash account') || text.includes('cash drawer')) return true;
  if (text.includes('bank') || text.includes('cheque') || text.includes('neft') || text.includes('rtgs') || text.includes('online') || text.includes('upi')) return false;

  return false;
};

export const isBankTransaction = (item) => {
  if (!item) return false;
  const mode = String(item.paymentMode || item.mode || '').trim().toUpperCase();
  if (BANK_MODES.has(mode)) return true;
  if (mode === 'CASH') return false;

  const ledgerType = String(item.ledgerType || item.paymentLedgerId?.ledgerType || '').toLowerCase();
  if (ledgerType === 'bank') return true;
  if (ledgerType === 'user_cash' || ledgerType === 'cash') return false;

  if (item.bankName || item.accountNumber || item.paymentLedgerId?.bankName) return true;

  const text = `${item.particulars || ''} ${item.particular || ''} ${item.remarks || ''} ${item.notes || ''}`.toLowerCase();
  if (text.includes('bank') || text.includes('cheque') || text.includes('neft') || text.includes('rtgs') || text.includes('online') || text.includes('upi') || text.includes('corporate bank')) return true;
  if (text.includes('via cash') || text.includes('by cash') || text.includes('in cash') || text.includes('cash payment') || text.includes('cash receipt')) return false;

  return false;
};

export const getTransactionPermissions = (userProfile) => {
  if (!userProfile) return { canViewCash: false, canViewBank: false };
  const role = (userProfile.role || '').toLowerCase();
  if (['superadmin', 'grant', 'developer'].includes(role)) {
    return { canViewCash: true, canViewBank: true };
  }

  const scope = userProfile.plotTransactionScope || 'both';
  if (scope === 'cash_only') return { canViewCash: true, canViewBank: false };
  if (scope === 'bank_only') return { canViewCash: false, canViewBank: true };
  if (scope === 'none') return { canViewCash: false, canViewBank: false };
  return { canViewCash: true, canViewBank: true };
};
