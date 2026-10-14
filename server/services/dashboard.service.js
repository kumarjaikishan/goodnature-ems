const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const mongoose = require('mongoose');

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';

// Models
const PlotReceipt = require('../models/PlotReceipt');
const PlotBooking = require('../models/PlotBooking');
const PlotProductBooking = require('../models/PlotProductBooking');
const PlotCustomer = require('../models/PlotCustomer');
const Voucher = require('../models/voucher');
const Payroll = require('../models/payroll');
const PlotPayoutVoucher = require('../models/PlotPayoutVoucher');
const PlotSponsorCommission = require('../models/PlotSponsorCommission');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const KisanSeller = require('../models/KisanSeller');
const KisanLandAgreement = require('../models/KisanLandAgreement');
const Employee = require('../models/employee');
const User = require('../models/user');
const Branch = require('../models/branch');
const Department = require('../models/department');
const Plot = require('../models/Plot');
const PlotProject = require('../models/PlotProject');

class DashboardService {
  /**
   * Parse filterType ('day' | 'fy' | 'month' | 'custom') into IST Date bounds
   */
  getDateRange(filterType = 'day', params = {}) {
    const { date, financialYear, month, startDate, endDate } = params;
    const now = dayjs().tz(TIMEZONE);

    let start;
    let end;
    let label = '';

    switch (filterType) {
      case 'fy': {
        // Financial Year format: "2026-2027" or default based on current date
        let startYear;
        if (financialYear && typeof financialYear === 'string' && financialYear.includes('-')) {
          startYear = parseInt(financialYear.split('-')[0], 10);
        } else {
          // In India: April 1 to March 31. If month < 4 (Jan-Mar), FY started last year
          startYear = now.month() >= 3 ? now.year() : now.year() - 1;
        }
        const endYear = startYear + 1;
        start = dayjs.tz(`${startYear}-04-01 00:00:00`, TIMEZONE);
        end = dayjs.tz(`${endYear}-03-31 23:59:59.999`, TIMEZONE);
        label = `FY ${startYear}-${endYear}`;
        break;
      }

      case 'month': {
        // Month format: "YYYY-MM" or default current month
        let monthStr = month;
        if (!monthStr || typeof monthStr !== 'string' || !monthStr.includes('-')) {
          monthStr = now.format('YYYY-MM');
        }
        start = dayjs.tz(`${monthStr}-01 00:00:00`, TIMEZONE).startOf('month');
        end = dayjs.tz(`${monthStr}-01 00:00:00`, TIMEZONE).endOf('month');
        label = start.format('MMMM YYYY');
        break;
      }

      case 'custom': {
        if (startDate && endDate) {
          start = dayjs.tz(`${startDate} 00:00:00`, TIMEZONE);
          end = dayjs.tz(`${endDate} 23:59:59.999`, TIMEZONE);
          label = `${start.format('DD MMM YYYY')} - ${end.format('DD MMM YYYY')}`;
        } else {
          // Fallback to current day
          start = now.startOf('day');
          end = now.endOf('day');
          label = start.format('DD MMMM YYYY');
        }
        break;
      }

      case 'day':
      default: {
        const dayStr = date ? String(date).trim() : now.format('YYYY-MM-DD');
        start = dayjs.tz(`${dayStr} 00:00:00`, TIMEZONE);
        end = dayjs.tz(`${dayStr} 23:59:59.999`, TIMEZONE);
        label = start.format('DD MMMM YYYY');
        break;
      }
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
      label,
      filterType
    };
  }

  /**
   * Resolve user permission and role-based data scoping
   */
  async getRoleScope(user, userid) {
    const dbUser = await User.findById(userid).select('role branchIds permissions employeeId sponsorId').lean();
    const effectiveRole = dbUser?.role || user?.role || 'employee';

    const rawBranchIds = (dbUser?.branchIds && dbUser.branchIds.length > 0)
      ? dbUser.branchIds
      : (Array.isArray(user?.branchIds) ? user.branchIds : []);
    const branchIds = rawBranchIds.map(b => (b?._id ? b._id.toString() : b.toString()));

    const isSuperAdmin = ['superadmin', 'developer'].includes(effectiveRole);
    const isAdmin = effectiveRole === 'admin';
    const isManager = effectiveRole === 'manager';
    const isAccountant = effectiveRole === 'accountant';
    const isCashier = effectiveRole === 'cashier';
    const isEmployee = effectiveRole === 'employee';
    const isPromoter = ['sponsor'].includes(effectiveRole);
    const isBroker = ['agent'].includes(effectiveRole);

    return {
      role: effectiveRole,
      userid: userid?.toString(),
      userObjectId: new mongoose.Types.ObjectId(userid),
      employeeId: dbUser?.employeeId?.toString(),
      sponsorId: dbUser?.sponsorId?.toString(),
      branchIds,
      branchObjectIds: branchIds.map(b => new mongoose.Types.ObjectId(b)),
      isSuperAdmin,
      isAdmin,
      isManager,
      isAccountant,
      isCashier,
      isEmployee,
      isPromoter,
      isBroker
    };
  }

  /**
   * Helper to build branch filter based on role scope and optional requested branchId
   */
  buildBranchFilter(scope, requestedBranchId, fieldName = 'branchId') {
    if (requestedBranchId && requestedBranchId !== 'all') {
      const reqIdStr = requestedBranchId.toString();
      // If user is restricted to branches, verify they belong to it
      if (!scope.isSuperAdmin && scope.branchIds.length > 0 && !scope.branchIds.includes(reqIdStr)) {
        return { [fieldName]: { $in: [] } }; // Empty set
      }
      return { [fieldName]: new mongoose.Types.ObjectId(requestedBranchId) };
    }

    if (scope.isSuperAdmin) {
      return {};
    }

    if (scope.branchObjectIds.length > 0) {
      return { [fieldName]: { $in: scope.branchObjectIds } };
    }

    return {};
  }

  /**
   * 1. TOTAL INCOME
   * Sub-breakdowns:
   * - Down Payment: PlotReceipt with receiptType in ['BOOKING', 'DOWNPAYMENT']
   * - EMI Payment: PlotReceipt with receiptType = 'INSTALLMENT'
   * - Voucher Receipt: Entry with source in ['receipt', 'voucher'] and credit > 0
   */
  async getTotalIncome(scope, dateRange, requestedBranchId, subFilter = 'all', page = 1, limit = 10) {
    const { start, end } = dateRange;
    const branchFilter = this.buildBranchFilter(scope, requestedBranchId, 'branchId');

    // Base receipt match
    const receiptMatch = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'REJECTED' },
      ...branchFilter
    };

    if (scope.isCashier) {
      receiptMatch.createdBy = scope.userObjectId;
    } else if (scope.isPromoter || scope.isBroker) {
      // Find bookings belonging to this promoter/broker
      const bookingIds = await PlotBooking.find({ sponsorId: scope.userObjectId }).distinct('_id');
      receiptMatch.bookingId = { $in: bookingIds };
    }

    // 1. Down Payment Aggregate
    const dpAgg = await PlotReceipt.aggregate([
      { $match: { ...receiptMatch, receiptType: { $in: ['BOOKING', 'DOWNPAYMENT', 'FULL_PAYMENT'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const downPaymentTotal = dpAgg[0]?.total || 0;
    const downPaymentCount = dpAgg[0]?.count || 0;

    // 2. EMI Payment Aggregate
    const emiAgg = await PlotReceipt.aggregate([
      { $match: { ...receiptMatch, receiptType: 'INSTALLMENT' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const emiPaymentTotal = emiAgg[0]?.total || 0;
    const emiPaymentCount = emiAgg[0]?.count || 0;

    // 3. Voucher Receipt Aggregate (Manual credit vouchers / credit entries)
    let voucherReceiptTotal = 0;
    let voucherReceiptCount = 0;
    if (!scope.isPromoter && !scope.isBroker) {
      const voucherMatch = {
        date: { $gte: start, $lte: end },
        status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] },
        ...branchFilter
      };
      if (scope.isCashier) {
        voucherMatch.createdBy = scope.userObjectId;
      }

      const vAgg = await Voucher.aggregate([
        { $match: voucherMatch },
        { $unwind: '$entries' },
        { $match: { 'entries.type': 'CREDIT' } },
        { $group: { _id: null, total: { $sum: '$entries.amount' }, count: { $sum: 1 } } }
      ]);
      voucherReceiptTotal = vAgg[0]?.total || 0;
      voucherReceiptCount = vAgg[0]?.count || 0;
    }

    const totalIncome = downPaymentTotal + emiPaymentTotal + voucherReceiptTotal;

    // Fetch detailed items if paginated
    let detailedRecords = [];
    let totalRecords = 0;

    if (subFilter === 'down_payment' || subFilter === 'emi') {
      const rType = subFilter === 'down_payment' ? { $in: ['BOOKING', 'DOWNPAYMENT', 'FULL_PAYMENT'] } : 'INSTALLMENT';
      const q = { ...receiptMatch, receiptType: rType };
      totalRecords = await PlotReceipt.countDocuments(q);
      detailedRecords = await PlotReceipt.find(q)
        .populate('bookingId', 'bookingNumber customerId plotId scheme')
        .populate('branchId', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else if (subFilter === 'voucher_receipt') {
      const vMatch = {
        date: { $gte: start, $lte: end },
        status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] },
        ...branchFilter
      };
      if (scope.isCashier) vMatch.createdBy = scope.userObjectId;
      totalRecords = await Voucher.countDocuments(vMatch);
      detailedRecords = await Voucher.find(vMatch)
        .populate('branchId', 'name')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else {
      // Default: show latest combined receipts
      totalRecords = downPaymentCount + emiPaymentCount;
      detailedRecords = await PlotReceipt.find(receiptMatch)
        .populate('bookingId', 'bookingNumber customerId plotId scheme')
        .populate('branchId', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    }

    return {
      totalIncome,
      breakdown: {
        downPayment: { amount: downPaymentTotal, count: downPaymentCount },
        emiPayment: { amount: emiPaymentTotal, count: emiPaymentCount },
        voucherReceipt: { amount: voucherReceiptTotal, count: voucherReceiptCount }
      },
      records: detailedRecords,
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * 2. TOTAL EXPENSE
   * Sub-breakdowns:
   * - Salary: Processed/paid payroll & salary vouchers
   * - Voucher Expense: Manual debit / expense vouchers
   * - Incentive Payment: Plot sponsor commission payouts
   * - Customer Refund Payment: Cancellations & refunds
   * - Seller Payment: Land purchase / Kisan seller payouts
   */
  async getTotalExpense(scope, dateRange, requestedBranchId, subFilter = 'all', page = 1, limit = 10) {
    const { start, end } = dateRange;
    const branchFilter = this.buildBranchFilter(scope, requestedBranchId, 'branchId');

    // 1. Salary Aggregate
    let salaryTotal = 0;
    let salaryCount = 0;
    if (scope.isSuperAdmin || scope.isAdmin || scope.isManager || scope.isAccountant || scope.isEmployee) {
      const payrollMatch = {
        status: { $in: ['processed', 'paid'] },
        updatedAt: { $gte: start, $lte: end },
        ...branchFilter
      };
      if (scope.isEmployee && scope.employeeId) {
        payrollMatch.employeeId = new mongoose.Types.ObjectId(scope.employeeId);
      }
      const salAgg = await Payroll.aggregate([
        { $match: payrollMatch },
        { $group: { _id: null, total: { $sum: '$netSalary' }, count: { $sum: 1 } } }
      ]);
      salaryTotal = salAgg[0]?.total || 0;
      salaryCount = salAgg[0]?.count || 0;
    }

    // 2. Voucher Expense (Debit vouchers / manual payments)
    let voucherExpenseTotal = 0;
    let voucherExpenseCount = 0;
    if (!scope.isEmployee && !scope.isPromoter && !scope.isBroker) {
      const vMatch = {
        date: { $gte: start, $lte: end },
        status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] },
        ...branchFilter
      };
      if (scope.isCashier) vMatch.createdBy = scope.userObjectId;

      const vAgg = await Voucher.aggregate([
        { $match: vMatch },
        { $unwind: '$entries' },
        { $match: { 'entries.type': 'DEBIT' } },
        { $group: { _id: null, total: { $sum: '$entries.amount' }, count: { $sum: 1 } } }
      ]);
      voucherExpenseTotal = vAgg[0]?.total || 0;
      voucherExpenseCount = vAgg[0]?.count || 0;
    }

    // 3. Incentive Payment (Commissions paid out to promoters)
    let incentiveTotal = 0;
    let incentiveCount = 0;
    const payoutMatch = {
      payoutDate: { $gte: start, $lte: end },
    };
    if (scope.isPromoter || scope.isBroker) {
      payoutMatch.customerId = scope.userObjectId;
    }
    const incAgg = await PlotPayoutVoucher.aggregate([
      { $match: payoutMatch },
      { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
    ]);
    incentiveTotal = incAgg[0]?.total || 0;
    incentiveCount = incAgg[0]?.count || 0;

    // 4. Customer Refund Payment (Cancelled plot refunds)
    let refundTotal = 0;
    let refundCount = 0;
    const cancelAgg = await PlotBooking.aggregate([
      {
        $match: {
          status: 'CANCELLED',
          updatedAt: { $gte: start, $lte: end },
          ...branchFilter
        }
      },
      { $group: { _id: null, total: { $sum: '$bookingAmount' }, count: { $sum: 1 } } }
    ]);
    refundTotal = cancelAgg[0]?.total || 0;
    refundCount = cancelAgg[0]?.count || 0;

    // 5. Seller Payment (Kisan / Land seller disbursements)
    let sellerPaymentTotal = 0;
    let sellerPaymentCount = 0;
    if (scope.isSuperAdmin || scope.isAdmin || scope.isManager || scope.isAccountant) {
      const kisanAgg = await Entry.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end },
            source: { $in: ['kisan_payment', 'kisan'] },
            debit: { $gt: 0 },
            status: 'active'
          }
        },
        { $group: { _id: null, total: { $sum: '$debit' }, count: { $sum: 1 } } }
      ]);
      sellerPaymentTotal = kisanAgg[0]?.total || 0;
      sellerPaymentCount = kisanAgg[0]?.count || 0;
    }

    const totalExpense = salaryTotal + voucherExpenseTotal + incentiveTotal + refundTotal + sellerPaymentTotal;

    // Detailed records if paginated
    let detailedRecords = [];
    let totalRecords = 0;

    if (subFilter === 'salary') {
      const q = { status: { $in: ['processed', 'paid'] }, updatedAt: { $gte: start, $lte: end }, ...branchFilter };
      if (scope.isEmployee && scope.employeeId) q.employeeId = scope.employeeId;
      totalRecords = await Payroll.countDocuments(q);
      detailedRecords = await Payroll.find(q)
        .populate('employeeId', 'name empId department')
        .populate('branchId', 'name')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else if (subFilter === 'voucher_expense') {
      const q = { date: { $gte: start, $lte: end }, status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] }, ...branchFilter };
      if (scope.isCashier) q.createdBy = scope.userObjectId;
      totalRecords = await Voucher.countDocuments(q);
      detailedRecords = await Voucher.find(q)
        .populate('branchId', 'name')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else if (subFilter === 'incentive') {
      totalRecords = await PlotPayoutVoucher.countDocuments(payoutMatch);
      detailedRecords = await PlotPayoutVoucher.find(payoutMatch)
        .populate('customerId', 'name sponsorCode')
        .populate('bookingId', 'bookingNumber')
        .sort({ payoutDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else if (subFilter === 'refund') {
      const q = { status: 'CANCELLED', updatedAt: { $gte: start, $lte: end } };
      totalRecords = await PlotBooking.countDocuments(q);
      detailedRecords = await PlotBooking.find(q)
        .populate('customerId', 'name mobile')
        .populate('plotId', 'plotNumber')
        .populate('projectId', 'projectName')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else if (subFilter === 'seller_payment') {
      const q = { date: { $gte: start, $lte: end }, source: { $in: ['kisan_payment', 'kisan'] }, debit: { $gt: 0 }, status: 'active' };
      totalRecords = await Entry.countDocuments(q);
      detailedRecords = await Entry.find(q)
        .populate('ledgerId', 'name bankName')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else {
      totalRecords = voucherExpenseCount + salaryCount;
      // Return combined summary vouchers
      const q = { date: { $gte: start, $lte: end }, status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] }, ...branchFilter };
      if (scope.isCashier) q.createdBy = scope.userObjectId;
      detailedRecords = await Voucher.find(q)
        .populate('branchId', 'name')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    }

    return {
      totalExpense,
      breakdown: {
        salary: { amount: salaryTotal, count: salaryCount },
        voucherExpense: { amount: voucherExpenseTotal, count: voucherExpenseCount },
        incentivePayment: { amount: incentiveTotal, count: incentiveCount },
        customerRefund: { amount: refundTotal, count: refundCount },
        sellerPayment: { amount: sellerPaymentTotal, count: sellerPaymentCount }
      },
      records: detailedRecords,
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * 3. ALL CUSTOMER
   * Filter by Plan By:
   * - 'all'
   * - 'FULL_PAYMENT'
   * - 'MONTHLY_INSTALLMENT'
   * - 'PLOT_PRODUCT'
   */
  async getAllCustomers(scope, dateRange, requestedBranchId, planFilter = 'all', search = '', page = 1, limit = 10) {
    const bookingMatch = {
      status: { $ne: 'CANCELLED' }
    };

    if (scope.isPromoter || scope.isBroker) {
      bookingMatch.sponsorId = scope.userObjectId;
    } else if (requestedBranchId && requestedBranchId !== 'all') {
      const branchUsers = await User.find({ branchIds: requestedBranchId }).distinct('_id');
      bookingMatch.sponsorId = { $in: branchUsers };
    } else if (!scope.isSuperAdmin && scope.branchObjectIds.length > 0) {
      const branchUsers = await User.find({ branchIds: { $in: scope.branchObjectIds } }).distinct('_id');
      bookingMatch.sponsorId = { $in: branchUsers };
    }

    // Aggregate counts by plan
    const planCountsAgg = await PlotBooking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: '$scheme', count: { $sum: 1 }, totalValue: { $sum: '$plotValue' } } }
    ]);

    const counts = {
      FULL_PAYMENT: 0,
      MONTHLY_INSTALLMENT: 0,
      PLOT_PRODUCT: 0,
      total: 0
    };

    planCountsAgg.forEach(p => {
      if (p._id === 'FULL_PAYMENT') counts.FULL_PAYMENT = p.count;
      if (p._id === 'MONTHLY_INSTALLMENT') counts.MONTHLY_INSTALLMENT = p.count;
      counts.total += p.count;
    });

    // Product booking count
    const productBranchFilter = this.buildBranchFilter(scope, requestedBranchId, 'branchId');
    const productCount = await PlotProductBooking.countDocuments({ status: { $ne: 'CANCELLED' }, ...productBranchFilter });
    counts.PLOT_PRODUCT = productCount;
    counts.total += productCount;

    // Apply plan filter to listing
    let recordsQuery = { ...bookingMatch };
    if (planFilter === 'FULL_PAYMENT' || planFilter === 'MONTHLY_INSTALLMENT') {
      recordsQuery.scheme = planFilter;
    }

    if (search) {
      const matchedCusts = await PlotCustomer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { customerId: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');
      recordsQuery.customerId = { $in: matchedCusts };
    }

    let totalRecords = 0;
    let records = [];

    if (planFilter === 'PLOT_PRODUCT') {
      totalRecords = productCount;
      records = await PlotProductBooking.find({ status: { $ne: 'CANCELLED' }, ...productBranchFilter })
        .populate('customerId', 'name mobile customerId')
        .populate('branchId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else {
      totalRecords = await PlotBooking.countDocuments(recordsQuery);
      records = await PlotBooking.find(recordsQuery)
        .populate('customerId', 'name mobile customerId')
        .populate('sponsorId', 'name sponsorCode')
        .populate('plotId', 'plotNumber plotSize')
        .populate('projectId', 'projectName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    }

    return {
      counts,
      records,
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * 4. ALL PROMOTERS (Sponsors / Business Developers)
   * Search / Filter by Rank:
   * - 'all'
   * - 'partner' (Direct / Level 1)
   * - 'associate' (Under partner / Level 2)
   */
  async getAllPromoters(scope, requestedBranchId, rankFilter = 'all', search = '', page = 1, limit = 10) {
    const branchFilter = this.buildBranchFilter(scope, requestedBranchId, 'branchIds');

    const promoterMatch = {
      role: { $in: ['sponsor', 'agent'] },
      isBlocked: { $ne: true },
      ...branchFilter
    };

    if (scope.isPromoter) {
      // Promoter only sees themselves or their downstream associates
      promoterMatch.$or = [{ _id: scope.userObjectId }, { sponsorId: scope.userObjectId }];
    }

    // Rank Filter
    if (rankFilter === 'partner') {
      promoterMatch.$or = [{ sponsorId: null }, { sponsorId: { $exists: false } }];
    } else if (rankFilter === 'associate') {
      promoterMatch.sponsorId = { $ne: null, $exists: true };
    }

    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { sponsorCode: { $regex: search, $options: 'i' } }
      ];
      if (promoterMatch.$or) {
        promoterMatch.$and = [{ $or: promoterMatch.$or }, { $or: searchOr }];
        delete promoterMatch.$or;
      } else {
        promoterMatch.$or = searchOr;
      }
    }

    // Rank Counts
    const partnerCount = await User.countDocuments({
      role: { $in: ['sponsor', 'agent'] },
      isBlocked: { $ne: true },
      $or: [{ sponsorId: null }, { sponsorId: { $exists: false } }],
      ...branchFilter
    });

    const associateCount = await User.countDocuments({
      role: { $in: ['sponsor', 'agent'] },
      isBlocked: { $ne: true },
      sponsorId: { $ne: null, $exists: true },
      ...branchFilter
    });

    const totalRecords = await User.countDocuments(promoterMatch);
    const records = await User.find(promoterMatch)
      .select('name mobile email sponsorCode sponsorId role commissionRate branchIds createdAt')
      .populate('sponsorId', 'name sponsorCode')
      .populate('branchIds', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      counts: {
        total: partnerCount + associateCount,
        partner: partnerCount,
        associate: associateCount
      },
      records,
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * 5. ACCOUNT LEDGER
   * Filter by Bank Name:
   * - Shows Bank & Cash Ledgers
   * - Filterable by specific bank name or account type
   */
  async getAccountLedgers(scope, dateRange, bankFilter = 'all', search = '', page = 1, limit = 10) {
    const { start, end } = dateRange;

    const ledgerMatch = {
      ledgerType: { $in: ['bank', 'user_cash'] },
      status: 'active'
    };

    if (scope.isCashier) {
      // Cashier only sees their own assigned cash ledger or general bank ledgers if permitted
      ledgerMatch.$or = [
        { assignedUserId: scope.userObjectId },
        { ledgerType: 'bank' }
      ];
    }

    if (bankFilter && bankFilter !== 'all') {
      ledgerMatch.$or = [
        { bankName: { $regex: bankFilter, $options: 'i' } },
        { name: { $regex: bankFilter, $options: 'i' } }
      ];
    }

    if (search) {
      const searchMatch = [
        { name: { $regex: search, $options: 'i' } },
        { bankName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } }
      ];
      if (ledgerMatch.$or) {
        ledgerMatch.$and = [{ $or: ledgerMatch.$or }, { $or: searchMatch }];
        delete ledgerMatch.$or;
      } else {
        ledgerMatch.$or = searchMatch;
      }
    }

    const totalRecords = await Ledger.countDocuments(ledgerMatch);
    const ledgers = await Ledger.find(ledgerMatch)
      .populate('assignedUserId', 'name')
      .sort({ ledgerType: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Compute period debit & credit turnover for these ledgers
    const ledgerIds = ledgers.map(l => l._id);
    const entryStats = await Entry.aggregate([
      {
        $match: {
          ledgerId: { $in: ledgerIds },
          date: { $gte: start, $lte: end },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$ledgerId',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' }
        }
      }
    ]);

    const statsMap = new Map();
    entryStats.forEach(s => {
      statsMap.set(s._id.toString(), s);
    });

    let totalLiquidBalance = 0;
    const enrichedLedgers = ledgers.map(l => {
      const stats = statsMap.get(l._id.toString()) || { totalDebit: 0, totalCredit: 0 };
      const currentBalance = (l.advance || 0) + (stats.totalCredit - stats.totalDebit);
      totalLiquidBalance += currentBalance;
      return {
        ...l,
        periodDebit: stats.totalDebit,
        periodCredit: stats.totalCredit,
        currentBalance
      };
    });

    // Extract list of unique bank names for filter dropdown
    const availableBanks = await Ledger.distinct('bankName', { ledgerType: 'bank', status: 'active' });

    return {
      summary: {
        totalLiquidBalance,
        totalAccounts: totalRecords
      },
      availableBanks: availableBanks.filter(Boolean),
      records: enrichedLedgers,
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * 6. ALL SELLER
   * Filter by Plot No (Khesra Number)
   */
  async getAllSellers(scope, plotNoFilter = '', search = '', page = 1, limit = 10) {
    const agreementMatch = {};

    if (plotNoFilter) {
      agreementMatch['landParcels.khesraNumber'] = { $regex: plotNoFilter, $options: 'i' };
    }

    if (search) {
      agreementMatch.$or = [
        { 'farmerList.name': { $regex: search, $options: 'i' } },
        { mauja: { $regex: search, $options: 'i' } },
        { khataNumber: { $regex: search, $options: 'i' } },
        { khesraNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const totalRecords = await KisanLandAgreement.countDocuments(agreementMatch);
    const agreements = await KisanLandAgreement.find(agreementMatch)
      .populate('projectId', 'projectName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedSellers = agreements.map(agr => {
      const parcels = agr.landParcels || [];
      const khesras = [...new Set(parcels.map(p => p.khesraNumber).filter(Boolean))];
      const primarySeller = (agr.farmerList && agr.farmerList.length > 0) ? agr.farmerList[0] : {};

      const agreementVal = agr.totalAgreementAmount || agr.agreementValue || 0;
      const totalPaid = agr.totalPaid || 0;
      const area = agr.araziDismil || agr.totalAreaDismil || 0;

      return {
        _id: agr._id,
        agreementNumber: agr.agreementNumber,
        sellerName: primarySeller.name || agr.mauja || 'Seller',
        mobile: primarySeller.mobile || '',
        mauja: agr.mauja || '',
        khataNumber: agr.khataNumber || '',
        plotNumbers: khesras.length > 0 ? khesras.join(', ') : (agr.khesraNumber || '—'),
        totalAreaDismil: area,
        agreementValue: agreementVal,
        totalPaid: totalPaid,
        remainingDue: Math.max(0, agreementVal - totalPaid),
        status: agr.status,
        date: agr.agreementDate || agr.createdAt
      };
    });

    const totalSellersCount = await KisanSeller.countDocuments();

    return {
      summary: {
        totalSellers: totalSellersCount > 0 ? totalSellersCount : totalRecords,
        totalAgreements: totalRecords
      },
      records: formattedSellers,
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * 14. ALL EMPLOYEE
   * Filter by Branch
   */
  async getAllEmployees(scope, requestedBranchId, search = '', page = 1, limit = 10) {
    const branchFilter = this.buildBranchFilter(scope, requestedBranchId, 'branchId');

    const empMatch = {
      status: true,
      ...branchFilter
    };

    if (scope.isEmployee && scope.employeeId) {
      empMatch._id = new mongoose.Types.ObjectId(scope.employeeId);
    }

    if (search) {
      empMatch.$or = [
        { empId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const totalRecords = await Employee.countDocuments(empMatch);
    const employees = await Employee.find(empMatch)
      .populate('userid', 'name email profileImage')
      .populate('branchId', 'name location')
      .populate('department', 'department name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Group counts by branch
    const branchBreakdownAgg = await Employee.aggregate([
      { $match: { status: true } },
      { $group: { _id: '$branchId', count: { $sum: 1 } } }
    ]);

    const branches = await Branch.find().select('name location').lean();
    const branchMap = new Map(branches.map(b => [b._id.toString(), b.name]));

    const branchStats = branchBreakdownAgg.map(b => ({
      branchId: b._id,
      branchName: branchMap.get(b._id?.toString()) || 'Unknown Branch',
      count: b.count
    }));

    return {
      summary: {
        totalEmployees: totalRecords,
        branchStats
      },
      records: employees.map(e => ({
        _id: e._id,
        empId: e.empId,
        name: e.employeeName || e.userid?.name || e.empId,
        email: e.userid?.email || '',
        phone: e.phone || '',
        branchName: e.branchId?.name || '—',
        department: e.department?.department || e.department?.name || '—',
        designation: e.designation || '—',
        joiningDate: e.joiningDate,
        profileImage: e.profileimage || e.userid?.profileImage || ''
      })),
      pagination: { page, limit, total: totalRecords }
    };
  }

  /**
   * Central Dashboard Overview Aggregator (fast KPI cards summary)
   */
  async getDashboardOverview(user, userid, query = {}) {
    const {
      filterType = 'day',
      date,
      financialYear,
      month,
      startDate,
      endDate,
      branchId
    } = query;

    const dateRange = this.getDateRange(filterType, { date, financialYear, month, startDate, endDate });
    const scope = await this.getRoleScope(user, userid);

    // Run parallel high-level summaries
    const [incomeData, expenseData, customerData, promoterData, ledgerData, sellerData, employeeData] = await Promise.all([
      this.getTotalIncome(scope, dateRange, branchId, 'all', 1, 5),
      this.getTotalExpense(scope, dateRange, branchId, 'all', 1, 5),
      this.getAllCustomers(scope, dateRange, branchId, 'all', '', 1, 5),
      this.getAllPromoters(scope, branchId, 'all', '', 1, 5),
      this.getAccountLedgers(scope, dateRange, 'all', '', 1, 5),
      this.getAllSellers(scope, '', '', 1, 5),
      this.getAllEmployees(scope, branchId, '', 1, 5)
    ]);

    // Available branches for dropdown
    let availableBranches = [];
    if (scope.isSuperAdmin) {
      availableBranches = await Branch.find().select('name location').lean();
    } else if (scope.branchObjectIds.length > 0) {
      availableBranches = await Branch.find({ _id: { $in: scope.branchObjectIds } }).select('name location').lean();
    }

    return {
      dateRange,
      userScope: {
        role: scope.role,
        isSuperAdmin: scope.isSuperAdmin,
        isManager: scope.isManager,
        isAccountant: scope.isAccountant,
        isCashier: scope.isCashier,
        isEmployee: scope.isEmployee,
        isPromoter: scope.isPromoter,
        isBroker: scope.isBroker,
        branchIds: scope.branchIds
      },
      availableBranches,
      kpiCards: {
        totalIncome: incomeData.totalIncome,
        incomeBreakdown: incomeData.breakdown,
        totalExpense: expenseData.totalExpense,
        expenseBreakdown: expenseData.breakdown,
        customers: customerData.counts,
        promoters: promoterData.counts,
        liquidLedger: ledgerData.summary,
        sellers: sellerData.summary,
        employees: employeeData.summary
      },
      recentPreview: {
        income: incomeData.records,
        expense: expenseData.records,
        customers: customerData.records,
        promoters: promoterData.records,
        ledgers: ledgerData.records,
        sellers: sellerData.records,
        employees: employeeData.records
      }
    };
  }
}

module.exports = new DashboardService();
