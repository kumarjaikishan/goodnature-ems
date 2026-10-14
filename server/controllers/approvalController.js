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

    const dbUser = await User.findById(userId).select('role branchIds').lean();
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

    // Fund transfers query: global admins see all pending, others see pending directed to them or their cash ledger
    let fundTransferQuery = null;
    if (isGlobalAdmin) {
      fundTransferQuery = { status: 'PENDING' };
    } else {
      const userLedger = await Ledger.findOne({ assignedUserId: userId, ledgerType: 'user_cash' }).select('_id').lean();
      fundTransferQuery = {
        status: 'PENDING',
        $or: [
          { toUserId: userId },
          ...(userLedger ? [{ toLedgerId: userLedger._id }] : [])
        ]
      };
    }

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
