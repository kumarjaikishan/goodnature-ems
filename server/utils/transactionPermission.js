const usermodel = require('../models/user');

const BANK_MODES = new Set([
  'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI', 'NEFT', 'RTGS', 'NEFT_RTGS', 'DD', 'NET_BANKING', 'CARD', 'POS'
]);

const isCashTransaction = (item) => {
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

const isBankTransaction = (item) => {
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

const getUserTransactionPermissions = async (user) => {
  if (!user) return { canViewCash: false, canViewBank: false };
  const role = (user.role || '').toLowerCase();
  if (['superadmin', 'grant', 'developer'].includes(role)) {
    return { canViewCash: true, canViewBank: true };
  }

  let scope = user.plotTransactionScope;
  if (!scope) {
    const userId = user.id || user._id;
    const dbUser = await usermodel.findById(userId).select('plotTransactionScope role').lean();
    scope = dbUser?.plotTransactionScope || 'both';
  }

  if (scope === 'cash_only') return { canViewCash: true, canViewBank: false };
  if (scope === 'bank_only') return { canViewCash: false, canViewBank: true };
  if (scope === 'none') return { canViewCash: false, canViewBank: false };
  return { canViewCash: true, canViewBank: true };
};

module.exports = {
  BANK_MODES,
  isCashTransaction,
  isBankTransaction,
  getUserTransactionPermissions
};
