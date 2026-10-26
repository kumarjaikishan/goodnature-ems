const mongoose = require('mongoose');
const User = require('../../models/user');
const Branch = require('../../models/branch');
const Ledger = require('../../models/ledger');
const Voucher = require('../../models/voucher');
const accountingService = require('../accountingService');
const { generateVoucherNo } = require('../../utils/voucherHelper');
const ApiError = require('../../utils/apiError');

/**
 * Resolves the source payment ledger (Cash or Bank account) and enforces security & bankPermissions
 */
async function resolveAndAuthorizePaymentLedger({ paymentLedgerId, paymentMode, userId, session = null }) {
  const normMode = (paymentMode || 'BANK_TRANSFER').toUpperCase();
  let query = User.findById(userId).select('bankPermissions role branchIds');
  if (session) query = query.session(session);
  const caller = await query.lean();

  const userRole = caller?.role || 'staff';
  const isGlobalAdmin = ['superadmin', 'developer', 'admin', 'grant'].includes(userRole);

  let resolvedPaymentLedger = null;

  if (paymentLedgerId) {
    let lQuery = Ledger.findById(paymentLedgerId);
    if (session) lQuery = lQuery.session(session);
    resolvedPaymentLedger = await lQuery;
    if (!resolvedPaymentLedger) {
      throw ApiError.badRequest('Selected payment account / ledger not found');
    }
  } else if (normMode === 'CASH') {
    let lQuery = Ledger.findOne({ assignedUserId: userId, ledgerType: 'user_cash' });
    if (session) lQuery = lQuery.session(session);
    resolvedPaymentLedger = await lQuery;
  } else {
    // Default to first active corporate bank account
    let lQuery = Ledger.findOne({ ledgerType: 'bank', status: { $ne: 'inactive' } });
    if (session) lQuery = lQuery.session(session);
    resolvedPaymentLedger = await lQuery;
  }

  if (resolvedPaymentLedger) {
    // 1. Cash account custody check
    if (resolvedPaymentLedger.ledgerType === 'user_cash' && !isGlobalAdmin) {
      const isOwnCash = resolvedPaymentLedger.assignedUserId?.toString() === userId?.toString();
      if (!isOwnCash) {
        throw ApiError.forbidden('Security Warning: You can only disburse cash from your own assigned cash ledger.');
      }
    }

    // 2. Bank account permissions check
    if (resolvedPaymentLedger.ledgerType === 'bank' && userRole !== 'developer') {
      const bPerm = caller?.bankPermissions;
      if (bPerm) {
        if (bPerm.accessScope === 'none' || bPerm.allowPayments === false) {
          throw ApiError.forbidden('You do not have authorization to select or disburse corporate bank accounts for payment.');
        }
        if (bPerm.accessScope === 'selected' && bPerm.allowedBankIds) {
          const allowedIds = (bPerm.allowedBankIds || []).map((id) => id.toString());
          if (!allowedIds.includes(resolvedPaymentLedger._id.toString())) {
            throw ApiError.forbidden(`You are not authorized to disburse from bank account: ${resolvedPaymentLedger.bankName || resolvedPaymentLedger.name}`);
          }
        }
      }
    }
  }

  return { resolvedPaymentLedger, caller, normMode };
}

/**
 * Creates financial Voucher, debits the treasury ledger (Cash/Bank), and returns payment entry
 */
async function disburseRefundTransaction({
  booking,
  isProduct = false,
  amount,
  paymentMode = 'BANK_TRANSFER',
  paymentLedgerId = null,
  transactionReference = '',
  remarks = '',
  paymentDate = new Date(),
  userId,
  session = null,
}) {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    throw ApiError.badRequest('Valid disbursement amount greater than 0 is required');
  }

  const { resolvedPaymentLedger, caller, normMode } = await resolveAndAuthorizePaymentLedger({
    paymentLedgerId,
    paymentMode,
    userId,
    session,
  });

  // Resolve branch for voucher
  let branchId = booking.branchId || booking.plotId?.branchId;
  if (!branchId) {
    branchId = caller?.branchIds?.[0];
  }
  if (!branchId) {
    let bQuery = Branch.findOne({ status: 'active' });
    if (session) bQuery = bQuery.session(session);
    const defBranch = await bQuery.lean();
    branchId = defBranch?._id;
  }

  const pDate = new Date(paymentDate || Date.now());
  const voucherNo = await generateVoucherNo(pDate, session);

  const bankOrCashName = resolvedPaymentLedger
    ? (resolvedPaymentLedger.bankName || resolvedPaymentLedger.name)
    : (normMode === 'CASH' ? 'Cash Account' : 'Bank Account');

  const fullNarration = `Settlement refund payout for Cancelled ${isProduct ? 'Product' : 'Plot'} Booking #${booking.bookingNumber}${bankOrCashName ? ` via ${bankOrCashName}` : ''}. ${remarks || ''}`.trim();

  // Create financial Voucher
  const voucher = new Voucher({
    branchId,
    voucherNo,
    type: 'MANUAL',
    status: 'PAID',
    totalAmount: numAmount,
    paidAmount: numAmount,
    remainingAmount: 0,
    paymentLedgerId: resolvedPaymentLedger?._id || null,
    date: pDate,
    referenceType: 'MANUAL',
    referenceId: booking._id,
    remarks: fullNarration,
    createdBy: userId,
    approvedBy: userId,
    approvedAt: new Date(),
    paymentTranches: [
      {
        amount: numAmount,
        paymentDate: pDate,
        paymentMode: normMode,
        paymentLedgerId: resolvedPaymentLedger?._id || null,
        referenceNo: transactionReference || '',
        remarks: remarks || '',
        paidBy: userId,
      },
    ],
    entries: [
      { accountName: 'Plot Cancellation Refund', type: 'DEBIT', amount: numAmount },
      { accountName: bankOrCashName, type: 'CREDIT', amount: numAmount },
    ],
  });

  if (session) {
    await voucher.save({ session });
  } else {
    await voucher.save();
  }

  // Atomically debit the treasury Cash or Bank Ledger
  if (resolvedPaymentLedger) {
    await accountingService.recordLedgerEntry(
      {
        ledgerId: resolvedPaymentLedger._id,
        date: pDate,
        type: 'DEBIT',
        amount: numAmount,
        source: 'voucher',
        voucherId: voucher._id,
        referenceId: booking._id,
        remarks: `Refund Disbursement #${booking.bookingNumber} (${normMode}) [${bankOrCashName}] - ${remarks || 'Refund Payout'}`,
      },
      session
    );
  }

  const paymentEntry = {
    date: pDate,
    amount: numAmount,
    paymentMode: normMode,
    paymentLedgerId: resolvedPaymentLedger?._id || null,
    paymentLedgerName: resolvedPaymentLedger?.name || '',
    bankName: resolvedPaymentLedger?.bankName || '',
    accountNumber: resolvedPaymentLedger?.accountNumber || '',
    transactionReference: transactionReference || '',
    remarks: remarks || '',
    voucherId: voucher._id,
    voucherNumber: voucher.voucherNo,
    createdBy: userId,
  };

  return { paymentEntry, voucher, resolvedPaymentLedger };
}

module.exports = {
  resolveAndAuthorizePaymentLedger,
  disburseRefundTransaction,
};
