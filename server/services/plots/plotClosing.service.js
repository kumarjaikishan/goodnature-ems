const mongoose = require('mongoose');
const ApiError = require('../../utils/apiError');
const PlotSponsorCommission = require('../../models/PlotSponsorCommission');
const InvestmentCommission = require('../../models/InvestmentCommission');
const PlotClosing = require('../../models/PlotClosing');
const PlotAuditLog = require('../../models/PlotAuditLog');
const CommissionPolicyConfig = require('../../models/CommissionPolicyConfig');
const Entry = require('../../models/entry');
const accountingService = require('../accountingService');
const plotConfigService = require('./plotConfig.service');

class PlotClosingService {
  /**
   * Helper to format/parse start and end date boundary for closing.
   * Start date at 00:00:00.000, End date at 23:59:59.999.
   */
  _normalizeClosingDateRange(startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Preview unclosed (or currently associated) commissions for a given date window.
   */
  async previewPlotClosing({ startDate, endDate, excludeClosingId = null, session = null }) {
    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate are required');
    }
    const { start, end } = this._normalizeClosingDateRange(startDate, endDate);

    const query = {
      status: 'active',
      createdAt: { $gte: start, $lte: end },
    };

    if (excludeClosingId) {
      query.$or = [{ closingId: null }, { closingId: excludeClosingId }];
    } else {
      query.closingId = null;
    }

    const commQuery = PlotSponsorCommission.find(query)
      .select('sponsorId customerId receiptId bookingId collectionAmount amount commissionPercent commissionRole fixedPercent incentivePercent fixedAmount incentiveAmount status createdAt')
      .populate('sponsorId', 'name email sponsorCode customerId mobile sponsorId')
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId sponsorId',
        populate: [
          { path: 'plotId', select: 'plotNumber seriesId' },
          { path: 'sponsorId', select: 'name sponsorCode customerId' }
        ]
      })
      .sort({ createdAt: 1 })
      .lean();
    if (session) commQuery.session(session);
    const plotCommissions = await commQuery;

    // Fetch Investment (RD/FD) Commissions
    const invQuery = {
      status: 'EARNED',
      $and: [
        {
          $or: [
            { earnedDate: { $gte: start, $lte: end } },
            { createdAt: { $gte: start, $lte: end } }
          ]
        }
      ]
    };

    if (excludeClosingId) {
      invQuery.$and.push({ $or: [{ closingId: null }, { closingId: excludeClosingId }] });
    } else {
      invQuery.$and.push({ closingId: null });
    }

    const invCommQuery = InvestmentCommission.find(invQuery)
      .select('sponsorId receiptId accountId sponsorRole collectedAmount commissionPercent commissionAmount fixedPercent incentivePercent fixedAmount incentiveAmount status createdAt')
      .populate('sponsorId', 'name email sponsorCode customerId mobile sponsorId')
      .populate('receiptId', 'receiptNumber amount paymentDate paymentMode transactionReference createdAt')
      .populate({
        path: 'accountId',
        select: 'accountNumber accountType tenureMonths depositAmount totalDepositExpected customerId sponsorId',
        populate: [
          { path: 'customerId', select: 'name customerId customerCode mobile' },
          { path: 'sponsorId', select: 'name sponsorCode customerId' }
        ]
      })
      .sort({ createdAt: 1 })
      .lean();
    if (session) invCommQuery.session(session);
    const invCommissionsRaw = await invCommQuery;

    // Normalize Investment commissions into standard commission structure
    const investmentCommissions = invCommissionsRaw.map(ic => {
      const acc = ic.accountId;
      const rcp = ic.receiptId;
      const cust = acc?.customerId;
      const accSponsor = acc?.sponsorId;

      return {
        _id: ic._id,
        isInvestment: true,
        businessType: 'INVESTMENT_RD_FD',
        sponsorId: ic.sponsorId,
        customerId: cust,
        receiptId: rcp,
        accountId: acc,
        bookingId: {
          bookingNumber: `${acc?.accountType || 'RD/FD'} Plan (${acc?.accountNumber || 'N/A'})`,
          tenureMonths: acc?.tenureMonths || 0,
          plotId: {
            plotNumber: `${acc?.accountType || 'RD/FD'} Plan`,
            seriesId: null,
          },
          sponsorId: accSponsor,
        },
        collectionAmount: ic.collectedAmount || 0,
        amount: ic.commissionAmount || 0,
        commissionPercent: ic.commissionPercent || 0,
        commissionRole: ic.sponsorRole === 'DEVELOPER' ? 'DEVELOPER_OVERRIDE' : (ic.sponsorRole || 'PROMOTER'),
        fixedPercent: ic.fixedPercent || 0,
        incentivePercent: ic.incentivePercent || 0,
        fixedAmount: ic.fixedAmount || 0,
        incentiveAmount: ic.incentiveAmount || 0,
        status: ic.status,
        createdAt: ic.createdAt,
      };
    });

    const commissions = [...plotCommissions, ...investmentCommissions];

    const plotPolicyConfig = await plotConfigService.getCommissionPolicy('PLOT_SALE');
    const investmentPolicyConfig = await plotConfigService.getCommissionPolicy('INVESTMENT_RD_FD');

    // Group collections per sponsor
    const sponsorMap = {};

    commissions.forEach(c => {
      const sp = c.sponsorId;
      if (!sp || !sp._id) return;
      const spId = sp._id.toString();

      const colAmt = Number(c.collectionAmount || 0);
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const isIndirect = c.commissionRole === 'DEVELOPER_OVERRIDE';

      if (!sponsorMap[spId]) {
        sponsorMap[spId] = {
          sponsorId: sp._id,
          sponsorName: sp.name || '',
          sponsorCode: sp.sponsorCode || '',
          customerId: sp.customerId || sp.sponsorCode || '',
          mobile: sp.mobile || '',
          isDeveloper: !sp.sponsorId || sp.sponsorId === 'direct',
          directBusiness: 0,
          indirectBusiness: 0,
          totalBusiness: 0,
          entries: [],
        };
      }

      if (isDirect) {
        sponsorMap[spId].directBusiness += colAmt;
      } else if (isIndirect) {
        sponsorMap[spId].indirectBusiness += colAmt;
      }
      sponsorMap[spId].totalBusiness += colAmt;
      sponsorMap[spId].entries.push(c);
    });

    let totalCollection = 0;
    let totalCommission = 0;
    let totalFixedCommission = 0;
    let totalIncentiveCommission = 0;

    const sponsors = Object.values(sponsorMap).map(sp => {
      const roleName = !sp.isDeveloper ? 'BUSINESS_ASSOCIATE' : 'BUSINESS_PARTNER';

      // Slabs resolution for Plot and Investment policies based on sponsor's total period volume
      const plotSlab = CommissionPolicyConfig.resolveSlab(plotPolicyConfig, roleName, sp.totalBusiness);
      const invSlab = CommissionPolicyConfig.resolveSlab(investmentPolicyConfig, roleName, sp.totalBusiness);

      const defaultFixedPct = !sp.isDeveloper ? 5.0 : 2.0;
      const defaultIncPct = plotSlab.incentivePercent;
      const slabLabel = plotSlab.slabLabel;

      let spFixedComm = 0;
      let spIncentiveComm = 0;

      // Calculate each entry's incentive based on its business type (PLOT_SALE vs INVESTMENT_RD_FD)
      sp.entries.forEach(e => {
        const isInv = e.isInvestment || e.businessType === 'INVESTMENT_RD_FD';
        const applicableSlab = isInv ? invSlab : plotSlab;

        let entryFixedPct = 0;
        if (isInv) {
          entryFixedPct = !sp.isDeveloper ? 2.50 : 1.00;
        } else {
          entryFixedPct = !sp.isDeveloper ? 5.0 : 2.0;
        }

        const entryIncPct = applicableSlab.incentivePercent;
        const col = Number(e.collectionAmount || 0);
        const fAmt = Math.round(col * (entryFixedPct / 100) * 100) / 100;
        const iAmt = Math.round(col * (entryIncPct / 100) * 100) / 100;

        e.fixedPercent = entryFixedPct;
        e.incentivePercent = entryIncPct;
        e.commissionPercent = entryIncPct;
        e.fixedAmount = fAmt;
        e.incentiveAmount = iAmt;
        e.amount = iAmt;
        e.slabLabel = applicableSlab.slabLabel;

        spFixedComm += fAmt;
        spIncentiveComm += iAmt;
      });

      const totalBusiness = sp.totalBusiness;
      const fixedCommission = Math.round(spFixedComm * 100) / 100;
      const incentiveCommission = Math.round(spIncentiveComm * 100) / 100;

      const rateStr = `+${defaultIncPct}% Inc.`;

      totalCollection += totalBusiness;
      totalCommission += incentiveCommission;
      totalFixedCommission += fixedCommission;
      totalIncentiveCommission += incentiveCommission;

      return {
        ...sp,
        fixedCommission,
        incentiveCommission,
        totalCommission: incentiveCommission,
        effectiveIncPct: defaultIncPct,
        rateStr,
        slabLabel,
        transactionCount: sp.entries.length,
      };
    }).sort((a, b) => b.incentiveCommission - a.incentiveCommission);

    return {
      startDate: start,
      endDate: end,
      totalCollection: Math.round(totalCollection * 100) / 100,
      totalCommission: Math.round(totalIncentiveCommission * 100) / 100,
      totalFixedCommission: Math.round(totalFixedCommission * 100) / 100,
      totalIncentiveCommission: Math.round(totalIncentiveCommission * 100) / 100,
      sponsorCount: sponsors.length,
      transactionCount: commissions.length,
      sponsors,
      commissions,
    };
  }

  /**
   * Create a new Plot Commission Closing batch
   */
  async createPlotClosing(data, userId) {
    const { closingName, startDate, endDate, remarks } = data;
    if (!closingName || !closingName.trim()) {
      throw ApiError.badRequest('Closing Name is required');
    }
    if (!startDate || !endDate) {
      throw ApiError.badRequest('Start Date and End Date are required');
    }

    const { start, end } = this._normalizeClosingDateRange(startDate, endDate);
    if (start > end) {
      throw ApiError.badRequest('Start Date cannot be after End Date');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const preview = await this.previewPlotClosing({ startDate: start, endDate: end, session });

      if (preview.commissions.length === 0) {
        throw ApiError.badRequest('No unclosed commission or collection records found in the selected date range.');
      }

      const datePrefix = `CLS-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}`;
      const count = await PlotClosing.countDocuments({ closingNumber: new RegExp(`^${datePrefix}`) }).session(session);
      const closingNumber = `${datePrefix}-${String(count + 1).padStart(3, '0')}`;

      const closingDoc = new PlotClosing({
        closingName: closingName.trim(),
        closingNumber,
        startDate: start,
        endDate: end,
        totalCollection: preview.totalCollection,
        totalCommission: preview.totalCommission,
        totalFixedCommission: preview.totalFixedCommission,
        totalIncentiveCommission: preview.totalIncentiveCommission,
        directBusinessTotal: preview.directBusinessTotal,
        directCommissionTotal: preview.directCommissionTotal,
        indirectBusinessTotal: preview.indirectBusinessTotal,
        indirectCommissionTotal: preview.indirectCommissionTotal,
        sponsorCount: preview.sponsorCount,
        transactionCount: preview.transactionCount,
        sponsors: preview.sponsors.map(s => ({
          sponsorId: s.sponsorId,
          sponsorName: s.sponsorName,
          sponsorCode: s.sponsorCode,
          customerId: s.customerId,
          mobile: s.mobile,
          isDeveloper: s.isDeveloper,
          directBusiness: s.directBusiness,
          directCommission: s.directCommission,
          indirectBusiness: s.indirectBusiness,
          indirectCommission: s.indirectCommission,
          fixedCommission: s.fixedCommission,
          incentiveCommission: s.incentiveCommission,
          totalBusiness: s.totalBusiness,
          totalCommission: s.totalCommission,
          directRatesStr: s.directRatesStr || '',
          directEffectivePct: s.directEffectivePct || 0,
          indirectRatesStr: s.indirectRatesStr || '',
          indirectEffectivePct: s.indirectEffectivePct || 0,
          totalEffectivePct: s.totalEffectivePct || 0,
          slabLabel: s.slabLabel || '',
          transactionCount: s.transactionCount,
        })),
        status: 'CLOSED',
        createdById: userId,
        remarks: remarks || '',
      });

      await closingDoc.save({ session });

      // Update individual commission records with closingId, achieved incentive percent, and updated total amount
      for (const sp of preview.sponsors) {
        for (const entry of sp.entries) {
          if (entry.isInvestment || entry.businessType === 'INVESTMENT_RD_FD') {
            await InvestmentCommission.findByIdAndUpdate(
              entry._id,
              {
                $set: {
                  closingId: closingDoc._id,
                  fixedPercent: entry.fixedPercent,
                  incentivePercent: entry.incentivePercent,
                  commissionPercent: entry.commissionPercent,
                  fixedAmount: entry.fixedAmount,
                  incentiveAmount: entry.incentiveAmount,
                  commissionAmount: entry.fixedAmount + entry.incentiveAmount,
                  slabLabel: entry.slabLabel,
                }
              },
              { session }
            );
          } else {
            await PlotSponsorCommission.findByIdAndUpdate(
              entry._id,
              {
                $set: {
                  closingId: closingDoc._id,
                  fixedPercent: entry.fixedPercent,
                  incentivePercent: entry.incentivePercent,
                  commissionPercent: entry.commissionPercent,
                  fixedAmount: entry.fixedAmount,
                  incentiveAmount: entry.incentiveAmount,
                  amount: entry.amount,
                  slabLabel: entry.slabLabel,
                }
              },
              { session }
            );
          }
        }
      }

      // Credit ONLY the Target Incentive to the sponsor's universal ledger
      for (const sp of closingDoc.sponsors) {
        if (sp.incentiveCommission > 0) {
          const particular = `Target Incentive credited for Closing ${closingDoc.closingNumber} (${closingDoc.closingName}) [Achieved Slab: ${sp.slabLabel}] — Business: ₹${Number(sp.totalBusiness || 0).toLocaleString('en-IN')}`;

          await accountingService.recordLedgerEntry({
            sponsorId: sp.sponsorId,
            date: closingDoc.endDate || new Date(),
            type: 'CREDIT',
            amount: sp.incentiveCommission,
            source: 'commission_closing',
            referenceId: closingDoc._id,
            remarks: particular
          }, session);
        }
      }

      const log = new PlotAuditLog({
        action: 'CREATE_CLOSING',
        modelName: 'PlotClosing',
        documentId: closingDoc._id,
        userId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : undefined,
        details: {
          closingName: closingDoc.closingName,
          closingNumber: closingDoc.closingNumber,
          startDate: start,
          endDate: end,
          totalCollection: closingDoc.totalCollection,
          totalCommission: closingDoc.totalCommission,
          sponsorCount: closingDoc.sponsorCount,
          transactionCount: closingDoc.transactionCount,
        },
      });
      await log.save({ session });

      await session.commitTransaction();
      return closingDoc;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPlotClosings(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      const q = query.search.trim();
      filter.$or = [
        { closingName: { $regex: q, $options: 'i' } },
        { closingNumber: { $regex: q, $options: 'i' } },
      ];
    }

    return PlotClosing.find(filter)
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getPlotClosingById(id) {
    const closing = await PlotClosing.findById(id).populate('createdById', 'name email').lean();
    if (!closing) {
      throw ApiError.notFound('Closing batch not found');
    }

    const plotCommissions = await PlotSponsorCommission.find({ closingId: closing._id })
      .populate('sponsorId', 'name email sponsorCode customerId mobile sponsorId')
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId sponsorId',
        populate: [
          { path: 'plotId', select: 'plotNumber seriesId' },
          { path: 'sponsorId', select: 'name sponsorCode customerId' }
        ]
      })
      .sort({ createdAt: 1 })
      .lean();

    const invCommissionsRaw = await InvestmentCommission.find({ closingId: closing._id })
      .populate('sponsorId', 'name email sponsorCode customerId mobile sponsorId')
      .populate('receiptId', 'receiptNumber amount paymentDate paymentMode transactionReference createdAt')
      .populate({
        path: 'accountId',
        select: 'accountNumber accountType tenureMonths depositAmount totalDepositExpected customerId sponsorId',
        populate: [
          { path: 'customerId', select: 'name customerId customerCode mobile' },
          { path: 'sponsorId', select: 'name sponsorCode customerId' }
        ]
      })
      .sort({ createdAt: 1 })
      .lean();

    const investmentCommissions = invCommissionsRaw.map(ic => {
      const acc = ic.accountId;
      const rcp = ic.receiptId;
      const cust = acc?.customerId;
      const accSponsor = acc?.sponsorId;

      return {
        _id: ic._id,
        isInvestment: true,
        businessType: 'INVESTMENT_RD_FD',
        sponsorId: ic.sponsorId,
        customerId: cust,
        receiptId: rcp,
        accountId: acc,
        bookingId: {
          bookingNumber: `${acc?.accountType || 'RD/FD'} Plan (${acc?.accountNumber || 'N/A'})`,
          tenureMonths: acc?.tenureMonths || 0,
          plotId: {
            plotNumber: `${acc?.accountType || 'RD/FD'} Plan`,
            seriesId: null,
          },
          sponsorId: accSponsor,
        },
        collectionAmount: ic.collectedAmount || 0,
        amount: ic.incentiveAmount || 0,
        commissionPercent: ic.incentivePercent || 0,
        commissionRole: ic.sponsorRole === 'DEVELOPER' ? 'DEVELOPER_OVERRIDE' : (ic.sponsorRole || 'PROMOTER'),
        fixedPercent: ic.fixedPercent || 0,
        incentivePercent: ic.incentivePercent || 0,
        fixedAmount: ic.fixedAmount || 0,
        incentiveAmount: ic.incentiveAmount || 0,
        slabLabel: ic.slabLabel || '',
        status: ic.status,
        createdAt: ic.createdAt,
      };
    });

    const commissions = [...plotCommissions, ...investmentCommissions];

    const sponsorsWithEntries = (closing.sponsors || []).map(sp => {
      const spId = (sp.sponsorId?._id || sp.sponsorId || '').toString();
      const entries = commissions.filter(c => {
        const cSpId = (c.sponsorId?._id || c.sponsorId || '').toString();
        return cSpId === spId;
      });
      return {
        ...sp,
        entries,
      };
    });

    return {
      ...closing,
      sponsors: sponsorsWithEntries,
      transactions: commissions,
    };
  }

  async updatePlotClosing(id, data, userId) {
    const closing = await PlotClosing.findById(id);
    if (!closing) {
      throw ApiError.notFound('Closing batch not found');
    }

    if (closing.status === 'REVERSED') {
      throw ApiError.badRequest('Cannot update a reversed closing batch');
    }

    const { closingName, startDate, endDate, remarks } = data;

    const newStart = startDate ? new Date(startDate) : new Date(closing.startDate);
    newStart.setHours(0, 0, 0, 0);

    const newEnd = endDate ? new Date(endDate) : new Date(closing.endDate);
    newEnd.setHours(23, 59, 59, 999);

    if (newStart > newEnd) {
      throw ApiError.badRequest('Start Date cannot be after End Date');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const preview = await this.previewPlotClosing({
        startDate: newStart,
        endDate: newEnd,
        excludeClosingId: closing._id,
        session,
      });

      const oldEntries = await Entry.find({ referenceId: closing._id, source: 'commission_closing' }).session(session);
      for (const oldEntry of oldEntries) {
        await accountingService.deleteLedgerEntry(oldEntry._id, session);
      }

      // Reset old plot commissions
      const oldComms = await PlotSponsorCommission.find({ closingId: closing._id }).session(session);
      for (const oc of oldComms) {
        oc.closingId = null;
        oc.incentivePercent = 0;
        oc.incentiveAmount = 0;
        oc.amount = oc.fixedAmount || Math.round(oc.collectionAmount * ((oc.fixedPercent || 5) / 100) * 100) / 100;
        await oc.save({ session });
      }

      // Reset old investment commissions
      const oldInvComms = await InvestmentCommission.find({ closingId: closing._id }).session(session);
      for (const oic of oldInvComms) {
        oic.closingId = null;
        oic.incentivePercent = 0;
        oic.incentiveAmount = 0;
        oic.commissionAmount = oic.fixedAmount || Math.round(oic.collectedAmount * ((oic.fixedPercent || 2.5) / 100) * 100) / 100;
        await oic.save({ session });
      }

      // Update new commissions
      for (const sp of preview.sponsors) {
        for (const entry of sp.entries) {
          if (entry.isInvestment || entry.businessType === 'INVESTMENT_RD_FD') {
            await InvestmentCommission.findByIdAndUpdate(
              entry._id,
              {
                $set: {
                  closingId: closing._id,
                  fixedPercent: entry.fixedPercent,
                  incentivePercent: entry.incentivePercent,
                  commissionPercent: entry.commissionPercent,
                  fixedAmount: entry.fixedAmount,
                  incentiveAmount: entry.incentiveAmount,
                  commissionAmount: entry.fixedAmount + entry.incentiveAmount,
                  slabLabel: entry.slabLabel,
                }
              },
              { session }
            );
          } else {
            await PlotSponsorCommission.findByIdAndUpdate(
              entry._id,
              {
                $set: {
                  closingId: closing._id,
                  fixedPercent: entry.fixedPercent,
                  incentivePercent: entry.incentivePercent,
                  commissionPercent: entry.commissionPercent,
                  fixedAmount: entry.fixedAmount,
                  incentiveAmount: entry.incentiveAmount,
                  amount: entry.amount,
                  slabLabel: entry.slabLabel,
                }
              },
              { session }
            );
          }
        }
      }

      if (closingName) closing.closingName = closingName.trim();
      closing.startDate = newStart;
      closing.endDate = newEnd;
      closing.totalCollection = preview.totalCollection;
      closing.totalCommission = preview.totalCommission;
      closing.totalFixedCommission = preview.totalFixedCommission;
      closing.totalIncentiveCommission = preview.totalIncentiveCommission;
      closing.directBusinessTotal = preview.directBusinessTotal;
      closing.directCommissionTotal = preview.directCommissionTotal;
      closing.indirectBusinessTotal = preview.indirectBusinessTotal;
      closing.indirectCommissionTotal = preview.indirectCommissionTotal;
      closing.sponsorCount = preview.sponsorCount;
      closing.transactionCount = preview.transactionCount;
      closing.sponsors = preview.sponsors.map(s => ({
        sponsorId: s.sponsorId,
        sponsorName: s.sponsorName,
        sponsorCode: s.sponsorCode,
        customerId: s.customerId,
        mobile: s.mobile,
        isDeveloper: s.isDeveloper,
        directBusiness: s.directBusiness,
        directCommission: s.directCommission,
        indirectBusiness: s.indirectBusiness,
        indirectCommission: s.indirectCommission,
        fixedCommission: s.fixedCommission,
        incentiveCommission: s.incentiveCommission,
        totalBusiness: s.totalBusiness,
        totalCommission: s.totalCommission,
        directRatesStr: s.directRatesStr || '',
        directEffectivePct: s.directEffectivePct || 0,
        indirectRatesStr: s.indirectRatesStr || '',
        indirectEffectivePct: s.indirectEffectivePct || 0,
        totalEffectivePct: s.totalEffectivePct || 0,
        slabLabel: s.slabLabel || '',
        transactionCount: s.transactionCount,
      }));
      if (remarks !== undefined) closing.remarks = remarks;

      await closing.save({ session });

      for (const sp of closing.sponsors) {
        if (sp.incentiveCommission > 0) {
          const directText = sp.directBusiness > 0 ? `Direct: ₹${sp.directBusiness.toLocaleString('en-IN')}` : '';
          const indirectText = sp.indirectBusiness > 0 ? `Team: ₹${sp.indirectBusiness.toLocaleString('en-IN')}` : '';
          const parts = [directText, indirectText].filter(Boolean).join(' | ');
          const particular = `Target Incentive credited for Closing ${closing.closingNumber} (${closing.closingName}) [Achieved Slab: ${sp.slabLabel}] — ${parts}`;

          await accountingService.recordLedgerEntry({
            sponsorId: sp.sponsorId,
            date: closing.endDate || new Date(),
            type: 'CREDIT',
            amount: sp.incentiveCommission,
            source: 'commission_closing',
            referenceId: closing._id,
            remarks: particular
          }, session);
        }
      }

      const log = new PlotAuditLog({
        action: 'UPDATE_CLOSING',
        modelName: 'PlotClosing',
        documentId: closing._id,
        userId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : undefined,
        details: {
          closingName: closing.closingName,
          startDate: newStart,
          endDate: newEnd,
          totalCollection: closing.totalCollection,
          totalCommission: closing.totalCommission,
        },
      });
      await log.save({ session });

      await session.commitTransaction();
      return closing;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async deletePlotClosing(id, userId) {
    const closing = await PlotClosing.findById(id);
    if (!closing) {
      throw ApiError.notFound('Closing batch not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const oldEntries = await Entry.find({ referenceId: closing._id, source: 'commission_closing' }).session(session);
      for (const oldEntry of oldEntries) {
        await accountingService.deleteLedgerEntry(oldEntry._id, session);
      }

      const closedComms = await PlotSponsorCommission.find({ closingId: closing._id }).session(session);
      for (const c of closedComms) {
        c.closingId = null;
        c.incentivePercent = 0;
        c.incentiveAmount = 0;
        c.amount = c.fixedAmount || Math.round(c.collectionAmount * ((c.fixedPercent || 5) / 100) * 100) / 100;
        await c.save({ session });
      }

      const closedInvComms = await InvestmentCommission.find({ closingId: closing._id }).session(session);
      for (const ic of closedInvComms) {
        ic.closingId = null;
        ic.incentivePercent = 0;
        ic.incentiveAmount = 0;
        ic.commissionAmount = ic.fixedAmount || Math.round(ic.collectedAmount * ((ic.fixedPercent || 2.5) / 100) * 100) / 100;
        await ic.save({ session });
      }

      const log = new PlotAuditLog({
        action: 'DELETE_CLOSING',
        modelName: 'PlotClosing',
        documentId: closing._id,
        userId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : undefined,
        details: {
          closingName: closing.closingName,
          closingNumber: closing.closingNumber,
          startDate: closing.startDate,
          endDate: closing.endDate,
          totalCommission: closing.totalCommission,
        },
      });
      await log.save({ session });

      await PlotClosing.findByIdAndDelete(id).session(session);

      await session.commitTransaction();
      return { message: `Closing ${closing.closingNumber} (${closing.closingName}) successfully reversed and deleted. All associated commissions and ledger credits are restored to unclosed state.` };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new PlotClosingService();
