const User = require('../models/user');
const Voucher = require('../models/voucher');
const PlotReceipt = require('../models/PlotReceipt');
const FundTransfer = require('../models/FundTransfer');
const Ledger = require('../models/ledger');

/**
 * GET /approvals/pending-stats
 * Returns live pending approval counts scoped by user authority (superadmin, admin, manager, etc.)
 */
exports.getPendingApprovalStats = async (req, res, next) => {
  try {
    const userId = req.userid;
    if (!userId) {
      return res.status(200).json({
        voucher: 0,
        downpayment: 0,
        emi: 0,
        fundTransfer: 0,
        accountTotal: 0,
        total: 0
      });
    }

    const dbUser = await User.findById(userId).select('role branchIds permissions bankPermissions').lean();
    if (!dbUser) {
      return res.status(200).json({
        voucher: 0,
        downpayment: 0,
        emi: 0,
        fundTransfer: 0,
        accountTotal: 0,
        total: 0
      });
    }

    const userRole = dbUser.role;
    const isGlobalAdmin = ['superadmin', 'admin', 'developer', 'grant'].includes(userRole);
    const isBranchManager = userRole === 'manager';

    let voucherQuery = null;
    let dpQuery = null;
    let emiQuery = null;

    if (isGlobalAdmin) {
      voucherQuery = { status: 'PENDING' };
      dpQuery = { status: 'PENDING', receiptType: { $in: ['BOOKING', 'DOWNPAYMENT', 'FULL_PAYMENT'] } };
      emiQuery = { status: 'PENDING', receiptType: 'INSTALLMENT' };
    } else if (isBranchManager) {
      const managerBranchIds = Array.isArray(dbUser.branchIds) ? dbUser.branchIds : [];
      if (managerBranchIds.length > 0) {
        const branchUserIds = await User.find({ branchIds: { $in: managerBranchIds } }).distinct('_id');
        voucherQuery = {
          status: 'PENDING',
          $or: [
            { branchId: { $in: managerBranchIds } },
            { createdBy: { $in: branchUserIds } }
          ]
        };
        dpQuery = {
          status: 'PENDING',
          branchId: { $in: managerBranchIds },
          receiptType: { $in: ['BOOKING', 'DOWNPAYMENT', 'FULL_PAYMENT'] }
        };
        emiQuery = {
          status: 'PENDING',
          branchId: { $in: managerBranchIds },
          receiptType: 'INSTALLMENT'
        };
      }
    }

    // Fund transfers query: live pending transfers that THIS user has authority to approve:
    // 1. Transfers to user's own cash drawer / personal account
    // 2. Transfers into bank accounts if user has bank deposit authority (superadmin, dev, or admin with bank permission)
    const userRoleStr = String(dbUser.role || '').toLowerCase();
    const isSuperOrDev = ['superadmin', 'developer', 'grant'].includes(userRoleStr);
    const hasFTApprovePerm = Array.isArray(dbUser?.permissions?.fund_transfer) && dbUser.permissions.fund_transfer.includes(3);
    const bPerm = dbUser?.bankPermissions;

    const userLedger = await Ledger.findOne({ assignedUserId: userId, ledgerType: 'user_cash' }).select('_id').lean();
    const actionableConditions = [
      { toUserId: userId },
      ...(userLedger ? [{ toLedgerId: userLedger._id }] : [])
    ];

    const bankLedgers = await Ledger.find({ ledgerType: 'bank' }).select('_id').lean();
    const allBankIds = bankLedgers.map(l => l._id);

    let allowedBankDestIds = [];
    if (isSuperOrDev) {
      allowedBankDestIds = allBankIds;
    } else if (userRoleStr === 'admin' || hasFTApprovePerm) {
      if (!bPerm || bPerm.accessScope === 'all') {
        if (bPerm?.allowReceipts !== false) {
          allowedBankDestIds = allBankIds;
        }
      } else if (bPerm.accessScope === 'selected') {
        if (bPerm.allowReceipts !== false) {
          const selectedSet = new Set((bPerm.allowedBankIds || []).map(id => id.toString()));
          allowedBankDestIds = allBankIds.filter(id => selectedSet.has(id.toString()));
        }
      }
    }

    if (allowedBankDestIds.length > 0) {
      actionableConditions.push({ toLedgerId: { $in: allowedBankDestIds } });
    }

    const fundTransferQuery = {
      status: 'PENDING',
      $or: actionableConditions
    };

    const [voucherCount, dpCount, emiCount, fundCount] = await Promise.all([
      voucherQuery ? Voucher.countDocuments(voucherQuery) : 0,
      dpQuery ? PlotReceipt.countDocuments(dpQuery) : 0,
      emiQuery ? PlotReceipt.countDocuments(emiQuery) : 0,
      fundTransferQuery ? FundTransfer.countDocuments(fundTransferQuery) : 0
    ]);

    const accountTotal = voucherCount + dpCount + emiCount;
    const total = accountTotal + fundCount;

    return res.status(200).json({
      voucher: voucherCount,
      downpayment: dpCount,
      emi: emiCount,
      fundTransfer: fundCount,
      accountTotal,
      total
    });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};
