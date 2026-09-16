const Plot = require('../../models/Plot');
const PlotBooking = require('../../models/PlotBooking');
const PlotPayment = require('../../models/PlotPayment');
const PlotReceipt = require('../../models/PlotReceipt');
const PlotSponsorCommission = require('../../models/PlotSponsorCommission');
const PlotPayoutVoucher = require('../../models/PlotPayoutVoucher');
const PlotPayoutSchedule = require('../../models/PlotPayoutSchedule');
const PlotInstallment = require('../../models/PlotInstallment');
const PlotAuditLog = require('../../models/PlotAuditLog');
const ApiError = require('../../utils/apiError');
const plotDeveloperService = require('./plotDeveloper.service');

class PlotReportService {
  async getDashboardStats() {
    const [plotStats, bookingStats, collectionStats] = await Promise.all([
      Plot.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      PlotBooking.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$plotValue' },
            totalDiscount: { $sum: { $ifNull: ['$discount', 0] } },
            bookingAmount: { $sum: '$bookingAmount' },
            remainingAmount: { $sum: '$remainingAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      PlotPayment.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            totalCollection: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const plots = { AVAILABLE: 0, HOLD: 0, BOOKED: 0, CANCELLED: 0, REGISTERED: 0 };
    plotStats.forEach(stat => {
      if (plots[stat._id] !== undefined) plots[stat._id] = stat.count;
    });

    const bookings = bookingStats[0] || { totalValue: 0, totalDiscount: 0, bookingAmount: 0, remainingAmount: 0, count: 0 };
    const collections = collectionStats[0] || { totalCollection: 0 };

    return {
      plots,
      bookings,
      collections,
    };
  }

  async getReportsData(type, filters = {}) {
    if (type === 'inventory') {
      return Plot.find().populate('seriesId').sort({ plotNumber: 1 });
    } else if (type === 'bookings') {
      const bookings = await PlotBooking.find({ status: { $ne: 'HOLD' } })
        .populate('customerId', 'name customerId mobile')
        .populate('sponsorId', 'name customerId')
        .populate('plotId', 'plotNumber plotSize plotType')
        .sort({ createdAt: -1 })
        .lean();

      const bookingIds = bookings.map(b => b._id);
      const receipts = await PlotReceipt.find({
        bookingId: { $in: bookingIds },
        receiptType: 'BOOKING'
      }).select('_id bookingId').lean();

      const receiptMap = {};
      receipts.forEach(r => {
        receiptMap[r.bookingId.toString()] = r._id;
      });

      bookings.forEach(b => {
        b.receiptId = receiptMap[b._id.toString()] || null;
      });

      return bookings;
    } else if (type === 'holds') {
      const holds = await PlotBooking.find({ status: 'HOLD' })
        .populate('customerId', 'name customerId mobile')
        .populate('sponsorId', 'name customerId')
        .populate('plotId', 'plotNumber plotSize plotType')
        .sort({ createdAt: -1 })
        .lean();

      const holdIds = holds.map(h => h._id);
      const receipts = await PlotReceipt.find({
        bookingId: { $in: holdIds },
        receiptType: 'BOOKING'
      }).select('_id bookingId').lean();

      const receiptMap = {};
      receipts.forEach(r => {
        receiptMap[r.bookingId.toString()] = r._id;
      });

      holds.forEach(h => {
        h.receiptId = receiptMap[h._id.toString()] || null;
      });

      return holds;
    } else if (type === 'receipts') {
      return PlotReceipt.find()
        .populate({
          path: 'bookingId',
          populate: [
            { path: 'customerId', select: 'name customerId mobile' },
            { path: 'plotId', populate: { path: 'seriesId' } }
          ],
        })
        .sort({ createdAt: -1 });
    } else if (type === 'commissions') {
      const activeBookings = await PlotBooking.find({
        status: { $in: ['ACTIVE', 'COMPLETED'] },
        sponsorId: { $ne: null }
      }).select('_id').lean();

      for (const b of activeBookings) {
        await plotDeveloperService.syncBookingSponsorCommissions(b._id);
      }

      const commissions = await PlotSponsorCommission.find({ status: 'active', closingId: { $ne: null } })
        .populate('sponsorId', 'name email sponsorCode customerId mobile')
        .populate('customerId', 'name customerId')
        .populate('closingId', 'closingName closingNumber startDate endDate')
        .populate('installmentId', 'dueAmount amount paidAmount')
        .populate({
          path: 'bookingId',
          populate: { path: 'plotId', select: 'plotNumber' }
        })
        .sort({ createdAt: -1 })
        .lean();

      const vouchers = await PlotPayoutVoucher.find().lean().catch(() => []);

      const sponsorMap = {};
      commissions.forEach(c => {
        const sp = c.sponsorId;
        if (!sp || !sp._id) return;
        const spId = sp._id.toString();
        if (!sponsorMap[spId]) {
          sponsorMap[spId] = {
            _id: sp._id,
            name: sp.name,
            email: sp.email,
            sponsorCode: sp.sponsorCode,
            customerId: sp.customerId || sp.sponsorCode,
            mobile: sp.mobile,
            totalEarned: 0,
            totalPaid: 0,
            entries: []
          };
        }
        sponsorMap[spId].totalEarned += Number(c.amount || 0);
        sponsorMap[spId].entries.push(c);
      });

      vouchers.forEach(v => {
        const spId = v.sponsorId?.toString();
        if (spId && sponsorMap[spId]) {
          sponsorMap[spId].totalPaid += Number(v.amountPaid || 0);
        }
      });

      return Object.values(sponsorMap).map(s => ({
        ...s,
        totalEarned: Math.round(s.totalEarned * 100) / 100,
        totalPaid: Math.round(s.totalPaid * 100) / 100,
        balance: Math.max(0, Math.round((s.totalEarned - s.totalPaid) * 100) / 100)
      }));
    } else if (type === 'weekly-payouts') {
      return PlotPayoutSchedule.find()
        .populate({
          path: 'bookingId',
          populate: { path: 'customerId', select: 'name customerId' }
        })
        .sort({ dueDate: 1 });
    } else if (type === 'dues') {
      const bookings = await PlotBooking.find({ status: { $ne: 'HOLD' } })
        .populate('customerId', 'name customerId mobile')
        .populate('sponsorId', 'name customerId')
        .populate('plotId', 'plotNumber plotSize plotType')
        .sort({ createdAt: -1 })
        .lean();

      const bookingIds = bookings.map(b => b._id);
      const allInstallments = await PlotInstallment.find({ bookingId: { $in: bookingIds } }).lean();

      const installmentsMap = {};
      allInstallments.forEach(inst => {
        const bId = inst.bookingId.toString();
        if (!installmentsMap[bId]) installmentsMap[bId] = [];
        installmentsMap[bId].push(inst);
      });

      bookings.forEach(b => {
        const bId = b._id.toString();
        const insts = installmentsMap[bId] || [];
        const dpInst = insts.find(i => i.installmentNumber === 0);
        const emiInsts = insts.filter(i => i.installmentNumber > 0);
        const paidEmiInsts = emiInsts.filter(i => i.status === 'PAID');
        const unpaidEmiInsts = emiInsts.filter(i => i.status !== 'PAID');

        const totalPlotValue = Number(b.plotValue || 0);
        const discountAmt = Number(b.discount || 0);
        const netPlotValue = Math.max(0, totalPlotValue - discountAmt);

        let totalPaid = 0;
        if (insts.length > 0) {
          totalPaid = insts.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);
        } else {
          totalPaid = Number(b.bookingAmount || 0);
        }

        const totalDue = Math.max(0, netPlotValue - totalPaid);
        const isCompleted = totalDue <= 0 || b.status === 'COMPLETED';

        b.netPlotValue = netPlotValue;
        b.totalPaid = totalPaid;
        b.totalDue = totalDue;
        b.dueStatus = isCompleted ? 'COMPLETED' : 'DUE';

        b.hasDownpayment = !!dpInst;
        b.downpaymentPaid = dpInst ? dpInst.status === 'PAID' : (Number(b.bookingAmount || 0) > 0);
        b.downpaymentAmount = dpInst ? (dpInst.dueAmount || dpInst.paidAmount || 0) : Number(b.bookingAmount || 0);

        b.totalEmisCount = emiInsts.length;
        b.paidEmisCount = paidEmiInsts.length;
        b.unpaidEmisCount = unpaidEmiInsts.length;

        b.totalInstallmentsCount = insts.length;
        b.paidInstallmentsCount = paidEmiInsts.length;
        b.unpaidInstallmentsCount = unpaidEmiInsts.length;
      });

      return bookings;
    } else if (type === 'summary') {
      const [totalBookedValueAggregate, totalCollections] = await Promise.all([
        PlotBooking.aggregate([
          { $match: { status: { $ne: 'CANCELLED' } } },
          {
            $group: {
              _id: null,
              totalValue: { $sum: '$plotValue' },
              bookingAmount: { $sum: '$bookingAmount' },
              remainingAmount: { $sum: '$remainingAmount' },
              count: { $sum: 1 },
            },
          },
        ]),
        PlotPayment.aggregate([
          { $match: { status: 'active' } },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]),
      ]);

      const activeBookingsCount = await PlotBooking.countDocuments({ status: 'ACTIVE' });
      const activeHoldsCount = await PlotBooking.countDocuments({ status: 'HOLD' });
      const receiptsCount = await PlotReceipt.countDocuments();

      const b = totalBookedValueAggregate[0] || { totalValue: 0, bookingAmount: 0, remainingAmount: 0, count: 0 };
      const c = totalCollections[0] || { total: 0 };

      return {
        totalContractedValue: b.totalValue,
        totalCollectedDownpayment: b.bookingAmount,
        totalCollectedInstallments: Math.max(0, c.total - b.bookingAmount),
        outstandingAmount: b.remainingAmount,
        activeBookingsCount,
        activeHoldsCount,
        receiptsCount,
      };
    }
    throw ApiError.badRequest('Invalid report type');
  }

  async getAuditLogs(filters = {}) {
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.modelName) query.modelName = filters.modelName;
    if (filters.documentId) query.documentId = filters.documentId;
    if (filters.userId) query.userId = filters.userId;

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      PlotAuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlotAuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new PlotReportService();
