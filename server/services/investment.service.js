const mongoose = require('mongoose');
const InvestmentSchemeConfig = require('../models/InvestmentSchemeConfig');
const InvestmentAccount = require('../models/InvestmentAccount');
const InvestmentInstallment = require('../models/InvestmentInstallment');
const InvestmentReceipt = require('../models/InvestmentReceipt');
const InvestmentCommission = require('../models/InvestmentCommission');
const PlotCustomer = require('../models/PlotCustomer');
const User = require('../models/user');
const Entry = require('../models/entry');
const Counter = require('../models/Counter');
const CommissionPolicyConfig = require('../models/CommissionPolicyConfig');
const accountingService = require('./accountingService');

class InvestmentService {
  /**
   * Get active scheme configurations and slabs
   */
  async getSchemeConfig() {
    let config = await InvestmentSchemeConfig.findOne({ status: 'active' });
    if (!config) {
      config = await InvestmentSchemeConfig.create({
        status: 'active',
      });
    }
    return config;
  }

  /**
   * Update scheme matrix and rules
   */
  async updateSchemeConfig(data, userId) {
    let config = await InvestmentSchemeConfig.findOne({ status: 'active' });
    if (!config) {
      config = new InvestmentSchemeConfig({ status: 'active' });
    }

    if (data.minRdAmount !== undefined) config.minRdAmount = Number(data.minRdAmount);
    if (data.rdStepAmount !== undefined) config.rdStepAmount = Number(data.rdStepAmount);
    if (data.minFdAmount !== undefined) config.minFdAmount = Number(data.minFdAmount);
    if (data.fdStepAmount !== undefined) config.fdStepAmount = Number(data.fdStepAmount);
    if (data.prematureAnnualInterestPercent !== undefined) {
      config.prematureAnnualInterestPercent = Number(data.prematureAnnualInterestPercent);
    }
    if (data.rdPrematureAnnualInterestPercent !== undefined) {
      config.rdPrematureAnnualInterestPercent = Number(data.rdPrematureAnnualInterestPercent);
    }
    if (data.fdPrematureAnnualInterestPercent !== undefined) {
      config.fdPrematureAnnualInterestPercent = Number(data.fdPrematureAnnualInterestPercent);
    }
    if (data.slabs && Array.isArray(data.slabs)) {
      config.slabs = data.slabs.map((s) => ({
        tenureMonths: Number(s.tenureMonths),
        rdMaturityPercent: Number(s.rdMaturityPercent),
        fdMaturityPercent: Number(s.fdMaturityPercent),
        rdPromoterCommissionPercent: Number(s.rdPromoterCommissionPercent),
        fdPromoterCommissionPercent: Number(s.fdPromoterCommissionPercent),
        developerCommissionPercent: Number(s.developerCommissionPercent || 1.0),
      }));
    }
    if (data.rulesAndRegulations && Array.isArray(data.rulesAndRegulations)) {
      config.rulesAndRegulations = data.rulesAndRegulations;
    }
    config.updatedBy = userId;
    await config.save();
    return config;
  }

  /**
   * Create a new RD or FD account
   */
  async createAccount(data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const {
        accountType,
        customerId,
        sponsorId,
        depositAmount,
        tenureMonths,
        startDate,
        nominee,
        notes,
      } = data;

      if (!accountType || !['RD', 'FD'].includes(accountType)) {
        throw new Error('Valid accountType (RD or FD) is required');
      }
      if (!customerId) throw new Error('Customer is required');
      if (!depositAmount || Number(depositAmount) <= 0) {
        throw new Error('Valid deposit amount is required');
      }
      if (!tenureMonths || Number(tenureMonths) <= 0) {
        throw new Error('Valid tenure in months is required');
      }

      // Check scheme slab
      const config = await this.getSchemeConfig();
      const numTenure = Number(tenureMonths);
      const numDeposit = Number(depositAmount);

      const slab = config.slabs.find((s) => s.tenureMonths === numTenure);
      if (!slab) {
        throw new Error(`Tenure of ${numTenure} months is not currently supported in scheme slabs.`);
      }

      // Validate amounts
      if (accountType === 'RD') {
        if (numDeposit < config.minRdAmount || numDeposit % config.rdStepAmount !== 0) {
          throw new Error(`RD amount must be at least ₹${config.minRdAmount} and in multiples of ₹${config.rdStepAmount}.`);
        }
      } else {
        if (numDeposit < config.minFdAmount || numDeposit % config.fdStepAmount !== 0) {
          throw new Error(`FD amount must be at least ₹${config.minFdAmount} and in multiples of ₹${config.fdStepAmount}.`);
        }
      }

      const returnPercent = accountType === 'RD' ? slab.rdMaturityPercent : slab.fdMaturityPercent;
      const promoterPct = accountType === 'RD' ? slab.rdPromoterCommissionPercent : slab.fdPromoterCommissionPercent;
      const devPct = slab.developerCommissionPercent || 1.0;

      const totalDepositExpected = accountType === 'RD' ? numDeposit * numTenure : numDeposit;
      const maturityAmount = Math.round((totalDepositExpected * returnPercent) / 100);

      // Financial Year Prefix
      const sDate = startDate ? new Date(startDate) : new Date();
      const month = sDate.getMonth();
      const fullYear = sDate.getFullYear();
      let startYearVal, endYearVal;
      if (month >= 3) {
        startYearVal = fullYear;
        endYearVal = fullYear + 1;
      } else {
        startYearVal = fullYear - 1;
        endYearVal = fullYear;
      }
      const fyStr = `${String(startYearVal).slice(-2)}${String(endYearVal).slice(-2)}`;
      const prefix = `${accountType}_FY_${fyStr}`;

      const counter = await Counter.findByIdAndUpdate(
        prefix,
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );
      const accountNumber = `${accountType}${fyStr}${String(counter.sequence).padStart(4, '0')}`;

      // Calculate Maturity Date
      const maturityDate = new Date(sDate);
      maturityDate.setMonth(maturityDate.getMonth() + numTenure);

      // Resolve customer, sponsor, and nominee
      const customer = await PlotCustomer.findById(customerId).session(session);
      let finalSponsorId = sponsorId;
      if (!finalSponsorId && customer?.sponsorId) {
        finalSponsorId = customer.sponsorId;
      }

      const finalNominee = {
        name: nominee?.name || customer?.nomineeName || '',
        relation: nominee?.relation || customer?.nomineeRelation || '',
        age: nominee?.age || customer?.nomineeAge || '',
        mobile: nominee?.mobile || '',
        address: nominee?.address || '',
      };

      const newAccount = new InvestmentAccount({
        accountNumber,
        accountType,
        customerId,
        sponsorId: finalSponsorId,
        depositAmount: numDeposit,
        tenureMonths: numTenure,
        totalDepositExpected,
        maturityRatePercent: returnPercent,
        maturityAmount,
        totalPaidAmount: 0,
        paidInstallmentsCount: 0,
        totalInstallmentsCount: accountType === 'RD' ? numTenure : 1,
        promoterCommissionPercent: promoterPct,
        developerCommissionPercent: devPct,
        startDate: sDate,
        maturityDate,
        nominee: finalNominee,
        notes: notes || '',
        createdBy: userId,
        status: 'ACTIVE',
      });

      await newAccount.save({ session });

      // If RD, create installment schedule
      if (accountType === 'RD') {
        const installments = [];
        for (let i = 1; i <= numTenure; i++) {
          const dueDate = new Date(sDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          installments.push({
            accountId: newAccount._id,
            installmentNumber: i,
            dueDate,
            amount: numDeposit,
            paidAmount: 0,
            status: 'PENDING',
          });
        }
        await InvestmentInstallment.insertMany(installments, { session });
      }

      await session.commitTransaction();
      session.endSession();
      return newAccount;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Get all accounts with filters & pagination
   */
  async getAccounts(query = {}) {
    const filter = {};
    if (query.accountType) filter.accountType = query.accountType;
    if (query.status) filter.status = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.sponsorId) filter.sponsorId = query.sponsorId;

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const matchingCustomers = await PlotCustomer.find({
        $or: [{ name: searchRegex }, { mobile: searchRegex }, { customerId: searchRegex }],
      }).select('_id');

      filter.$or = [
        { accountNumber: searchRegex },
        { customerId: { $in: matchingCustomers.map((c) => c._id) } },
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 100);
    const skip = (page - 1) * limit;

    const [rawAccounts, total] = await Promise.all([
      InvestmentAccount.find(filter)
        .populate('customerId', 'name mobile email customerId address city state pincode')
        .populate('sponsorId', 'name mobile code sponsorId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InvestmentAccount.countDocuments(filter),
    ]);

    const now = new Date();
    const accounts = rawAccounts.map((acc) => {
      const sDate = new Date(acc.startDate || acc.createdAt);
      let monthsElapsed = 0;
      if (acc.accountType === 'RD') {
        const yearDiff = now.getFullYear() - sDate.getFullYear();
        const monthDiff = now.getMonth() - sDate.getMonth();
        monthsElapsed = Math.max(0, Math.min(acc.tenureMonths, yearDiff * 12 + monthDiff + (now.getDate() >= sDate.getDate() ? 1 : 0)));
      } else {
        const yearDiff = now.getFullYear() - sDate.getFullYear();
        const monthDiff = now.getMonth() - sDate.getMonth();
        monthsElapsed = Math.max(0, Math.min(acc.tenureMonths, yearDiff * 12 + monthDiff));
      }

      // Expected deposit up to current date
      let expectedDepositSoFar = 0;
      let pendingDues = 0;
      if (acc.accountType === 'RD') {
        expectedDepositSoFar = monthsElapsed * (acc.depositAmount || 0);
        pendingDues = Math.max(0, expectedDepositSoFar - (acc.totalPaidAmount || 0));
      } else {
        expectedDepositSoFar = acc.totalDepositExpected || acc.depositAmount || 0;
        pendingDues = Math.max(0, expectedDepositSoFar - (acc.totalPaidAmount || 0));
      }

      const overdueInstallmentsCount = acc.accountType === 'RD' && acc.depositAmount > 0
        ? Math.ceil(pendingDues / acc.depositAmount)
        : 0;

      return {
        ...acc,
        monthsElapsed,
        expectedDepositSoFar,
        pendingDues,
        overdueInstallmentsCount,
      };
    });

    return { accounts, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * Get specific account details with installments & receipts
   */
  async getAccountById(id) {
    const account = await InvestmentAccount.findById(id)
      .populate('customerId')
      .populate({
        path: 'sponsorId',
        populate: { path: 'sponsorId', select: 'name mobile code' },
      })
      .lean();

    if (!account) throw new Error('Investment account not found');

    const [installments, receipts] = await Promise.all([
      InvestmentInstallment.find({ accountId: id }).sort({ installmentNumber: 1 }).lean(),
      InvestmentReceipt.find({ accountId: id }).sort({ paymentDate: -1, createdAt: -1 }).lean(),
    ]);

    return { account, installments, receipts };
  }

  /**
   * Collect payment (installment or FD deposit)
   */
  async collectPayment(accountId, data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const account = await InvestmentAccount.findById(accountId).session(session);
      if (!account) throw new Error('Account not found');
      if (account.status !== 'ACTIVE') {
        throw new Error(`Cannot collect payment for an account in status "${account.status}"`);
      }

      const {
        amount,
        paymentDate,
        paymentMode,
        transactionReference,
        bankName,
        chequeNumber,
        chequeDate,
        remarks,
      } = data;

      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) throw new Error('Valid payment amount is required');
      if (!paymentMode) throw new Error('Payment mode is required');

      // Generate Receipt Number
      const pDate = paymentDate ? new Date(paymentDate) : new Date();
      const month = pDate.getMonth();
      const fullYear = pDate.getFullYear();
      let startYearVal, endYearVal;
      if (month >= 3) {
        startYearVal = fullYear;
        endYearVal = fullYear + 1;
      } else {
        startYearVal = fullYear - 1;
        endYearVal = fullYear;
      }
      const fyStr = `${String(startYearVal).slice(-2)}${String(endYearVal).slice(-2)}`;
      const prefix = `INV_RCP_FY_${fyStr}`;

      const counter = await Counter.findByIdAndUpdate(
        prefix,
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );
      const receiptNumber = `RCP-INV-${fyStr}${String(counter.sequence).padStart(4, '0')}`;

      // Non-cash requires admin approval
      const isApproved = paymentMode === 'cash';
      const receiptStatus = isApproved ? 'APPROVED' : 'PENDING';

      const newReceipt = new InvestmentReceipt({
        receiptNumber,
        accountId: account._id,
        customerId: account.customerId,
        sponsorId: account.sponsorId,
        amount: numAmount,
        paymentDate: pDate,
        paymentMode,
        transactionReference: transactionReference || '',
        bankName: bankName || '',
        chequeNumber: chequeNumber || '',
        chequeDate: chequeDate ? new Date(chequeDate) : null,
        status: receiptStatus,
        approvedBy: isApproved ? userId : null,
        approvedAt: isApproved ? new Date() : null,
        collectedBy: userId,
        remarks: remarks || '',
      });

      await newReceipt.save({ session });

      if (isApproved) {
        await this._applyReceiptToAccount(account, newReceipt, session);
      }

      await session.commitTransaction();
      session.endSession();
      return newReceipt;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Internal helper to apply approved receipt to account schedule and commissions
   */
  async _applyReceiptToAccount(account, receipt, session) {
    const numAmount = receipt.amount;

    if (account.accountType === 'RD') {
      // Find pending installments
      const pendingInsts = await InvestmentInstallment.find({
        accountId: account._id,
        status: { $in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
      })
        .sort({ installmentNumber: 1 })
        .session(session);

      let unallocated = numAmount;
      const covered = [];

      for (const inst of pendingInsts) {
        if (unallocated <= 0) break;
        const needed = inst.amount - (inst.paidAmount || 0);

        if (unallocated >= needed) {
          inst.paidAmount = inst.amount;
          inst.status = 'PAID';
          inst.paidDate = receipt.paymentDate;
          inst.receiptId = receipt._id;
          unallocated -= needed;
          covered.push(inst.installmentNumber);
        } else {
          inst.paidAmount = (inst.paidAmount || 0) + unallocated;
          inst.status = 'PARTIAL';
          inst.paidDate = receipt.paymentDate;
          inst.receiptId = receipt._id;
          unallocated = 0;
          covered.push(inst.installmentNumber);
        }
        await inst.save({ session });
      }

      receipt.installmentsCovered = covered;
      await receipt.save({ session });

      // Count paid
      const totalPaidInst = await InvestmentInstallment.countDocuments({
        accountId: account._id,
        status: 'PAID',
      }).session(session);

      account.paidInstallmentsCount = totalPaidInst;
      account.totalPaidAmount += numAmount;

      if (account.totalPaidAmount >= account.totalDepositExpected) {
        // All installments collected
        account.paidInstallmentsCount = account.totalInstallmentsCount;
      }
      await account.save({ session });
    } else {
      // FD
      account.totalPaidAmount += numAmount;
      account.paidInstallmentsCount = 1;
      await account.save({ session });
    }

    // Commission allocation
    await this._generateCommissions(account, receipt, session);
  }

  /**
   * Internal helper to calculate period RD/FD investment collection volume for a sponsor
   */
  async getSponsorPeriodInvestmentVolume(sponsorId, date = new Date(), isTeam = false, session = null) {
    if (!sponsorId) return 0;
    const d = new Date(date);
    const startOfMonth = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));

    let sponsorIds = [new mongoose.Types.ObjectId(sponsorId.toString())];
    if (isTeam) {
      const subQuery = User.find({ role: 'sponsor', sponsorId });
      if (session) subQuery.session(session);
      const subSponsors = await subQuery.select('_id').lean();
      sponsorIds = [...sponsorIds, ...subSponsors.map(s => s._id)];
    }

    const accQuery = InvestmentAccount.find({
      sponsorId: { $in: sponsorIds },
      status: { $ne: 'CANCELLED' }
    }).select('_id');
    if (session) accQuery.session(session);
    const accounts = await accQuery.lean();

    if (!accounts.length) return 0;
    const accountIds = accounts.map(a => a._id);

    const receiptQuery = InvestmentReceipt.find({
      accountId: { $in: accountIds },
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['APPROVED', 'COMPLETED', 'CLEARED'] }
    }).select('amount');
    if (session) receiptQuery.session(session);
    const receipts = await receiptQuery.lean();

    const total = receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    return Math.round(total * 100) / 100;
  }

  /**
   * Internal helper to calculate sponsor commissions
   */
  async _generateCommissions(account, receipt, session) {
    if (!account.sponsorId) return;

    const sponsor = await User.findById(account.sponsorId).session(session);
    if (!sponsor) return;

    const isDeveloper = !sponsor.sponsorId || sponsor.sponsorId === 'direct';
    const receiptDate = receipt.paymentDate || receipt.createdAt || new Date();

    if (isDeveloper) {
      // ── BUSINESS PARTNER DIRECT RD/FD SALE ─────────────────────────
      // Fixed: BA 2.50% + BP 1.00% = 3.50% Instant
      const combinedFixed = 3.50;
      const fAmt = Math.round(receipt.amount * (combinedFixed / 100) * 100) / 100;

      let ledgerEntryId = null;
      if (fAmt > 0 && receipt.status !== 'PENDING') {
        const entry = await accountingService.recordLedgerEntry({
          sponsorId: sponsor._id,
          date: receiptDate,
          type: 'CREDIT',
          amount: fAmt,
          source: 'commission_fixed',
          referenceId: receipt._id,
          remarks: `Instant Fixed Commission (${combinedFixed}%) on Direct RD/FD Deposit [Receipt #${receipt.receiptNumber || ''}] (${account.accountNumber || account.schemeType})`
        }, session);
        ledgerEntryId = entry._id;
      }

      await new InvestmentCommission({
        receiptId: receipt._id,
        accountId: account._id,
        sponsorId: sponsor._id,
        sponsorRole: 'DIRECT_DEVELOPER',
        collectedAmount: receipt.amount,
        commissionPercent: combinedFixed,
        commissionAmount: fAmt,
        fixedPercent: combinedFixed,
        incentivePercent: 0,
        fixedAmount: fAmt,
        incentiveAmount: 0,
        slabLabel: 'RD/FD Fixed 3.50% (Direct Partner)',
        status: 'EARNED',
        ledgerEntryId,
        earnedDate: receipt.paymentDate,
        createdAt: receiptDate,
      }).save({ session });
    } else {
      // ── BUSINESS ASSOCIATE (2.50% Fixed) + PARENT PARTNER (1.00% Fixed) ──
      // 1. Business Associate gets 2.50% Fix Instant
      const subFixed = 2.50;
      const subFAmt = Math.round(receipt.amount * (subFixed / 100) * 100) / 100;

      let subLedgerEntryId = null;
      if (subFAmt > 0 && receipt.status !== 'PENDING') {
        const entry = await accountingService.recordLedgerEntry({
          sponsorId: sponsor._id,
          date: receiptDate,
          type: 'CREDIT',
          amount: subFAmt,
          source: 'commission_fixed',
          referenceId: receipt._id,
          remarks: `Instant Fixed Commission (${subFixed}%) on RD/FD Deposit [Receipt #${receipt.receiptNumber || ''}] (${account.accountNumber || account.schemeType})`
        }, session);
        subLedgerEntryId = entry._id;
      }

      await new InvestmentCommission({
        receiptId: receipt._id,
        accountId: account._id,
        sponsorId: sponsor._id,
        sponsorRole: 'PROMOTER',
        collectedAmount: receipt.amount,
        commissionPercent: subFixed,
        commissionAmount: subFAmt,
        fixedPercent: subFixed,
        incentivePercent: 0,
        fixedAmount: subFAmt,
        incentiveAmount: 0,
        slabLabel: 'RD/FD Fixed 2.50% (Business Associate)',
        status: 'EARNED',
        ledgerEntryId: subLedgerEntryId,
        earnedDate: receipt.paymentDate,
        createdAt: receiptDate,
      }).save({ session });

      // 2. Parent Developer Sponsor gets 1.00% Fix Instant
      if (sponsor.sponsorId && sponsor.sponsorId !== 'direct') {
        const parentDev = await User.findById(sponsor.sponsorId).session(session);
        if (parentDev) {
          const bpFixed = 1.00;
          const bpFAmt = Math.round(receipt.amount * (bpFixed / 100) * 100) / 100;

          let bpLedgerEntryId = null;
          if (bpFAmt > 0 && receipt.status !== 'PENDING') {
            const entry = await accountingService.recordLedgerEntry({
              sponsorId: parentDev._id,
              date: receiptDate,
              type: 'CREDIT',
              amount: bpFAmt,
              source: 'commission_fixed',
              referenceId: receipt._id,
              remarks: `Instant Fixed Commission (${bpFixed}%) on RD/FD Deposit [Receipt #${receipt.receiptNumber || ''}] (${account.accountNumber || account.schemeType}) — BA: ${sponsor.name}`
            }, session);
            bpLedgerEntryId = entry._id;
          }

          await new InvestmentCommission({
            receiptId: receipt._id,
            accountId: account._id,
            sponsorId: parentDev._id,
            sponsorRole: 'DEVELOPER',
            collectedAmount: receipt.amount,
            commissionPercent: bpFixed,
            commissionAmount: bpFAmt,
            fixedPercent: bpFixed,
            incentivePercent: 0,
            fixedAmount: bpFAmt,
            incentiveAmount: 0,
            slabLabel: 'RD/FD Fixed 1.00% (Business Partner)',
            status: 'EARNED',
            ledgerEntryId: bpLedgerEntryId,
            earnedDate: receipt.paymentDate,
            createdAt: receiptDate,
          }).save({ session });
        }
      }
    }
  }

  /**
   * Approve a pending non-cash receipt
   */
  async approveReceipt(receiptId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await InvestmentReceipt.findById(receiptId).session(session);
      if (!receipt) throw new Error('Receipt not found');
      if (receipt.status === 'APPROVED') throw new Error('Receipt is already approved');

      const account = await InvestmentAccount.findById(receipt.accountId).session(session);
      if (!account) throw new Error('Associated investment account not found');

      receipt.status = 'APPROVED';
      receipt.approvedBy = userId;
      receipt.approvedAt = new Date();
      await receipt.save({ session });

      await this._applyReceiptToAccount(account, receipt, session);

      await session.commitTransaction();
      session.endSession();
      return receipt;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Reject a pending receipt
   */
  async rejectReceipt(receiptId, reason, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await InvestmentReceipt.findById(receiptId).session(session);
      if (!receipt) throw new Error('Receipt not found');

      const account = await InvestmentAccount.findById(receipt.accountId).session(session);

      if (receipt.status === 'APPROVED' && account) {
        // Rollback financial effect
        account.totalPaidAmount = Math.max(0, (account.totalPaidAmount || 0) - receipt.amount);
        if (account.accountType === 'RD') {
          await InvestmentInstallment.updateMany(
            { receiptId: receipt._id },
            { $set: { status: 'PENDING', paidAmount: 0, paidDate: null, receiptId: null } },
            { session }
          );
          const paidCount = await InvestmentInstallment.countDocuments({
            accountId: account._id,
            status: 'PAID',
          }).session(session);
          account.paidInstallmentsCount = paidCount;
        } else {
          account.paidInstallmentsCount = account.totalPaidAmount >= account.depositAmount ? 1 : 0;
        }
        await account.save({ session });

        // Clean up ledger entries
        const existingEntries = await Entry.find({
          source: 'commission_fixed',
          referenceId: receipt._id,
        }).session(session);
        for (const e of existingEntries) {
          await accountingService.deleteLedgerEntry(e._id, session);
        }
        await InvestmentCommission.deleteMany({ receiptId: receipt._id }).session(session);
      }

      receipt.status = 'REJECTED';
      receipt.rejectionReason = reason || 'Verification failed';
      receipt.approvedBy = userId;
      await receipt.save({ session });

      await session.commitTransaction();
      session.endSession();
      return receipt;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Edit/Update collection receipt details
   */
  async updateReceipt(receiptId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await InvestmentReceipt.findById(receiptId).session(session);
      if (!receipt) throw new Error('Receipt not found');

      const {
        amount,
        paymentDate,
        paymentMode,
        transactionReference,
        bankName,
        chequeNumber,
        chequeDate,
        remarks,
      } = updateData;

      const oldAmount = receipt.amount;
      const newAmount =
        amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0
          ? Number(amount)
          : oldAmount;
      const amountChanged = oldAmount !== newAmount;
      const dateChanged = paymentDate && new Date(paymentDate).getTime() !== new Date(receipt.paymentDate).getTime();

      const account = await InvestmentAccount.findById(receipt.accountId).session(session);

      if (paymentDate) receipt.paymentDate = new Date(paymentDate);
      if (paymentMode) receipt.paymentMode = paymentMode;
      if (transactionReference !== undefined) receipt.transactionReference = transactionReference;
      if (bankName !== undefined) receipt.bankName = bankName;
      if (chequeNumber !== undefined) receipt.chequeNumber = chequeNumber;
      if (chequeDate !== undefined) receipt.chequeDate = chequeDate ? new Date(chequeDate) : null;
      if (remarks !== undefined) receipt.remarks = remarks;

      if ((amountChanged || dateChanged) && receipt.status === 'APPROVED' && account) {
        // 1. Rollback previous ledger effect on account
        account.totalPaidAmount = Math.max(0, (account.totalPaidAmount || 0) - oldAmount);
        if (account.accountType === 'RD') {
          await InvestmentInstallment.updateMany(
            { receiptId: receipt._id },
            { $set: { status: 'PENDING', paidAmount: 0, paidDate: null, receiptId: null } },
            { session }
          );
        }

        // 2. Clean up old ledger entries from sponsor ledger!
        const existingEntries = await Entry.find({
          source: 'commission_fixed',
          referenceId: receipt._id,
        }).session(session);

        for (const e of existingEntries) {
          await accountingService.deleteLedgerEntry(e._id, session);
        }

        // 3. Delete previous commissions
        await InvestmentCommission.deleteMany({ receiptId: receipt._id }).session(session);

        receipt.amount = newAmount;
        await receipt.save({ session });

        // 4. Re-apply to account with new amount and create updated commissions + ledger entries
        await this._applyReceiptToAccount(account, receipt, session);
      } else {
        receipt.amount = newAmount;
        await receipt.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
      return receipt;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Delete / Revert a collection receipt safely
   */
  async deleteReceipt(receiptId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await InvestmentReceipt.findById(receiptId).session(session);
      if (!receipt) throw new Error('Receipt not found');

      const account = await InvestmentAccount.findById(receipt.accountId).session(session);

      if (receipt.status === 'APPROVED' && account) {
        // 1. Revert financial application on account
        account.totalPaidAmount = Math.max(0, (account.totalPaidAmount || 0) - receipt.amount);

        if (account.accountType === 'RD') {
          // Reset installments covered by this receipt
          await InvestmentInstallment.updateMany(
            { receiptId: receipt._id },
            { $set: { status: 'PENDING', paidAmount: 0, paidDate: null, receiptId: null } },
            { session }
          );

          const paidCount = await InvestmentInstallment.countDocuments({
            accountId: account._id,
            status: 'PAID',
          }).session(session);
          account.paidInstallmentsCount = paidCount;
        } else {
          account.paidInstallmentsCount = account.totalPaidAmount >= account.depositAmount ? 1 : 0;
        }

        await account.save({ session });

        // 2. Clean up / delete ledger entries from accounting system!
        const existingEntries = await Entry.find({
          source: 'commission_fixed',
          referenceId: receipt._id,
        }).session(session);

        for (const e of existingEntries) {
          await accountingService.deleteLedgerEntry(e._id, session);
        }

        // 3. Delete generated commissions
        await InvestmentCommission.deleteMany({ receiptId: receipt._id }).session(session);
      }

      await InvestmentReceipt.findByIdAndDelete(receipt._id).session(session);

      await session.commitTransaction();
      session.endSession();
      return { success: true, message: 'Receipt deleted and ledger balances reverted successfully' };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Premature Closure / Settlement Calculation
   */
  async calculatePrematureSettlement(accountId) {
    const account = await InvestmentAccount.findById(accountId)
      .populate('customerId')
      .lean();
    if (!account) throw new Error('Account not found');

    const config = await this.getSchemeConfig();
    const annualRate =
      account.accountType === 'RD'
        ? config.rdPrematureAnnualInterestPercent || config.prematureAnnualInterestPercent || 6.0
        : config.fdPrematureAnnualInterestPercent || config.prematureAnnualInterestPercent || 6.0;

    // Calculate days/months active
    const now = new Date();
    const start = new Date(account.startDate);
    const monthsElapsed = Math.max(
      1,
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    );

    const principalPaid = account.totalPaidAmount || 0;
    // Simple Interest = Principal * Rate * (months / 12) / 100
    const accruedInterest = Math.round((principalPaid * annualRate * (monthsElapsed / 12)) / 100);
    const totalSettlementAmount = principalPaid + accruedInterest;

    return {
      account,
      monthsElapsed,
      principalPaid,
      prematureAnnualRate: annualRate,
      accruedInterest,
      totalSettlementAmount,
      fullMaturityAmount: account.maturityAmount || 0,
      maturityRatePercent: account.maturityRatePercent || 0,
      tenureMonths: account.tenureMonths || 24,
      totalDepositExpected: account.totalDepositExpected || account.depositAmount || 0,
    };
  }

  /**
   * Prematurely Close or Settle Account
   */
  async processSettlement(accountId, data, userId) {
    const account = await InvestmentAccount.findById(accountId);
    if (!account) throw new Error('Account not found');
    if (account.status !== 'ACTIVE') {
      throw new Error(`Account is already in status "${account.status}"`);
    }

    const { settlementType, settledAmount, paymentMode, referenceNumber, remarks } = data;

    account.status = settlementType === 'MATURITY' ? 'MATURED' : 'PREMATURE_CLOSED';
    account.settlementDetails = {
      settledAt: new Date(),
      settledAmount: Number(settledAmount) || 0,
      settlementType: settlementType || 'PREMATURE',
      paymentMode: paymentMode || 'cash',
      referenceNumber: referenceNumber || '',
      remarks: remarks || '',
      processedBy: userId,
    };

    await account.save();
    return account;
  }

  /**
   * Dues & Defaulters Report
   */
  async getDuesReport() {
    const today = new Date();
    // Overdue installments
    const overdueInsts = await InvestmentInstallment.find({
      dueDate: { $lte: today },
      status: { $in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
    })
      .populate({
        path: 'accountId',
        populate: [
          { path: 'customerId', select: 'name mobile customerId' },
          { path: 'sponsorId', select: 'name mobile code' },
        ],
      })
      .sort({ dueDate: 1 })
      .lean();

    // Filter only active accounts
    const activeOverdues = overdueInsts.filter(
      (inst) => inst.accountId && inst.accountId.status === 'ACTIVE'
    );

    return activeOverdues;
  }

  /**
   * Investment Dashboard Stats with separated RD and FD breakdowns
   */
  async getDashboardStats() {
    const today = new Date();

    const [
      activeCount,
      rdAccountsCount,
      fdAccountsCount,
      maturedCount,
      prematureClosedCount,
      rdFinancials,
      fdFinancials,
      rdCollections,
      fdCollections,
      totalCommissions,
      pendingReceipts,
      overdueDues,
    ] = await Promise.all([
      InvestmentAccount.countDocuments({ status: 'ACTIVE' }),
      InvestmentAccount.countDocuments({ accountType: 'RD', status: 'ACTIVE' }),
      InvestmentAccount.countDocuments({ accountType: 'FD', status: 'ACTIVE' }),
      InvestmentAccount.countDocuments({ status: 'MATURED' }),
      InvestmentAccount.countDocuments({ status: 'PREMATURE_CLOSED' }),
      InvestmentAccount.aggregate([
        { $match: { accountType: 'RD', status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            totalDeposited: { $sum: '$totalPaidAmount' },
            totalExpectedMaturity: { $sum: '$maturityAmount' },
            totalExpectedDeposit: { $sum: '$totalDepositExpected' },
          },
        },
      ]),
      InvestmentAccount.aggregate([
        { $match: { accountType: 'FD', status: 'ACTIVE' } },
        {
          $group: {
            _id: null,
            totalPrincipalInvested: { $sum: '$depositAmount' },
            totalDepositReceived: { $sum: '$totalPaidAmount' },
            totalExpectedMaturity: { $sum: '$maturityAmount' },
          },
        },
      ]),
      InvestmentReceipt.aggregate([
        {
          $lookup: {
            from: 'investmentaccounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account',
          },
        },
        { $unwind: '$account' },
        { $match: { status: 'APPROVED', 'account.accountType': 'RD' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      InvestmentReceipt.aggregate([
        {
          $lookup: {
            from: 'investmentaccounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account',
          },
        },
        { $unwind: '$account' },
        { $match: { status: 'APPROVED', 'account.accountType': 'FD' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      InvestmentCommission.aggregate([
        { $match: { status: 'EARNED' } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      InvestmentReceipt.countDocuments({ status: 'PENDING' }),
      InvestmentInstallment.aggregate([
        {
          $match: {
            dueDate: { $lte: today },
            status: { $in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
          },
        },
        {
          $group: {
            _id: null,
            totalDuesAmount: { $sum: { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] } },
            overdueInstallmentsCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const rdFin = rdFinancials[0] || { totalDeposited: 0, totalExpectedMaturity: 0, totalExpectedDeposit: 0 };
    const fdFin = fdFinancials[0] || { totalPrincipalInvested: 0, totalDepositReceived: 0, totalExpectedMaturity: 0 };

    const totalCollection = (rdCollections[0]?.total || 0) + (fdCollections[0]?.total || 0);

    return {
      activeAccounts: activeCount,
      rdAccounts: rdAccountsCount,
      fdAccounts: fdAccountsCount,
      maturedAccounts: maturedCount,
      prematureClosedAccounts: prematureClosedCount,

      totalCollection,
      totalCommissionEarned: totalCommissions[0]?.total || 0,
      pendingApprovals: pendingReceipts,

      rd: {
        activeCount: rdAccountsCount,
        totalDeposited: rdFin.totalDeposited,
        totalExpectedMaturity: rdFin.totalExpectedMaturity,
        totalExpectedDeposit: rdFin.totalExpectedDeposit,
        pendingDues: overdueDues[0]?.totalDuesAmount || 0,
        overdueCount: overdueDues[0]?.overdueInstallmentsCount || 0,
        collectionsReceived: rdCollections[0]?.total || 0,
        receiptsCount: rdCollections[0]?.count || 0,
      },

      fd: {
        activeCount: fdAccountsCount,
        totalPrincipal: fdFin.totalPrincipalInvested,
        totalReceived: fdFin.totalDepositReceived,
        totalExpectedMaturity: fdFin.totalExpectedMaturity,
        pendingDeposit: Math.max(0, fdFin.totalPrincipalInvested - fdFin.totalDepositReceived),
        collectionsReceived: fdCollections[0]?.total || 0,
        receiptsCount: fdCollections[0]?.count || 0,
      },
    };
  }

  /**
   * Get all receipts (transactions) with filters & pagination
   */
  async getReceipts(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.paymentMode) filter.paymentMode = query.paymentMode;
    if (query.accountId) filter.accountId = query.accountId;

    if (query.accountType) {
      const matchingAccounts = await InvestmentAccount.find({ accountType: query.accountType }).select('_id');
      filter.accountId = { $in: matchingAccounts.map((a) => a._id) };
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const [matchingCustomers, matchingAccs] = await Promise.all([
        PlotCustomer.find({
          $or: [{ name: searchRegex }, { mobile: searchRegex }, { customerId: searchRegex }],
        }).select('_id'),
        InvestmentAccount.find({ accountNumber: searchRegex }).select('_id'),
      ]);

      const foundAccs = await InvestmentAccount.find({
        customerId: { $in: matchingCustomers.map((c) => c._id) },
      }).select('_id');

      const allAccIds = [...matchingAccs.map((a) => a._id), ...foundAccs.map((a) => a._id)];

      filter.$or = [
        { receiptNumber: searchRegex },
        { transactionReference: searchRegex },
        { chequeNumber: searchRegex },
        { accountId: { $in: allAccIds } },
      ];
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 100);
    const skip = (page - 1) * limit;

    const [receipts, total] = await Promise.all([
      InvestmentReceipt.find(filter)
        .populate({
          path: 'accountId',
          populate: { path: 'customerId', select: 'name mobile customerId' },
        })
        .populate('collectedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InvestmentReceipt.countDocuments(filter),
    ]);

    return { receipts, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  /**
   * Get specific receipt by ID with full customer and account details
   */
  async getReceiptById(id) {
    const receipt = await InvestmentReceipt.findById(id)
      .populate({
        path: 'accountId',
        populate: [
          { path: 'customerId' },
          { path: 'sponsorId', select: 'name mobile code sponsorCode' },
        ],
      })
      .populate('collectedBy', 'name')
      .populate('approvedBy', 'name')
      .lean();

    if (!receipt) throw new Error('Investment receipt not found');
    return receipt;
  }
}

module.exports = new InvestmentService();
