const mongoose = require('mongoose');
const ApiError = require('../../utils/apiError');
const Plot = require('../../models/Plot');
const PlotSeriesMaster = require('../../models/PlotSeriesMaster');
const PlotBooking = require('../../models/PlotBooking');
const PlotInstallment = require('../../models/PlotInstallment');
const PlotPayment = require('../../models/PlotPayment');
const PlotReceipt = require('../../models/PlotReceipt');
const PlotSponsorCommission = require('../../models/PlotSponsorCommission');
const PlotAuditLog = require('../../models/PlotAuditLog');
const PlotRateConfiguration = require('../../models/PlotRateConfiguration');
const PlotPayoutSchedule = require('../../models/PlotPayoutSchedule');
const Counter = require('../../models/Counter');
const Entry = require('../../models/entry');
const accountingService = require('../accountingService');
const plotDeveloperService = require('./plotDeveloper.service');

class PlotCollectionService {
  async rebuildBookingInstallmentsState(bookingId, session = null) {
    if (!bookingId) return;
    const query = PlotBooking.findById(bookingId);
    if (session) query.session(session);
    const booking = await query;
    if (!booking) return;

    // 1. Fetch installments for this booking; if none exist, initialize/generate the schedule first
    let instQuery = PlotInstallment.find({ bookingId }).sort({ installmentNumber: 1 });
    if (session) instQuery.session(session);
    let installments = await instQuery;

    if (installments.length === 0 && booking.status !== 'HOLD') {
      const bookingDateObj = booking.bookingDate || new Date();
      const remainingAmount = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
      const resolvedDpDays = Number(booking.downpaymentDays) || (Number(booking.downpaymentMonths) ? Number(booking.downpaymentMonths) * 30 : 90);

      if (booking.scheme === 'FULL_PAYMENT') {
        const dueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);

        installments = [{
          installmentNumber: 1,
          bookingId: booking._id,
          dueDate,
          dueAmount: remainingAmount,
          paidAmount: 0,
          status: 'PENDING',
        }];
        if (session) {
          await PlotInstallment.insertMany(installments, { session });
        } else {
          await PlotInstallment.insertMany(installments);
        }
      } else {
        const newInsts = [];
        const downpaymentAmount = booking.bookingAmount || booking.downpaymentAmount || 0;
        const dpDueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);

        if (downpaymentAmount > 0) {
          newInsts.push({
            installmentNumber: 0,
            bookingId: booking._id,
            dueDate: dpDueDate,
            dueAmount: downpaymentAmount,
            paidAmount: 0,
            status: 'PENDING',
          });
        }

        const emiFreq = booking.emiFrequency || 'MONTHLY';
        const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;
        const count = Number(booking.installmentCount) || (Number(booking.tenureMonths) ? Math.round(Number(booking.tenureMonths) / freqMultiplier) : 6);
        let principalToDistribute = booking.emiPrincipalAmount !== undefined ? booking.emiPrincipalAmount : Math.max(0, remainingAmount - downpaymentAmount);

        for (let i = 1; i <= count; i++) {
          let dueForThisInst = 0;
          if (i === count) {
            dueForThisInst = Math.round(principalToDistribute * 100) / 100;
          } else {
            dueForThisInst = booking.emiMonthlyAmount ? booking.emiMonthlyAmount : Math.floor(principalToDistribute / count);
            dueForThisInst = Math.min(dueForThisInst, principalToDistribute);
          }
          dueForThisInst = Math.round(dueForThisInst * 100) / 100;
          principalToDistribute -= dueForThisInst;

          if (dueForThisInst > 0) {
            newInsts.push({
              installmentNumber: i,
              bookingId: booking._id,
              dueDate: downpaymentAmount > 0 ? null : new Date(new Date(dpDueDate).setMonth(new Date(dpDueDate).getMonth() + (i * freqMultiplier))),
              dueAmount: dueForThisInst,
              paidAmount: 0,
              status: 'PENDING',
            });
          }
        }

        if (newInsts.length > 0) {
          if (session) {
            await PlotInstallment.insertMany(newInsts, { session });
          } else {
            await PlotInstallment.insertMany(newInsts);
          }
        }
      }

      // Re-query generated installments
      instQuery = PlotInstallment.find({ bookingId }).sort({ installmentNumber: 1 });
      if (session) instQuery.session(session);
      installments = await instQuery;
    }

    const resolvedDpDays = Number(booking.downpaymentDays) || (Number(booking.downpaymentMonths) ? Number(booking.downpaymentMonths) * 30 : 90);
    const bookingDateObj = booking.bookingDate || new Date();
    const dpDueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);
    const hasDpInst = installments.some(i => i.installmentNumber === 0);

    for (const inst of installments) {
      if (inst.installmentNumber === 0) {
        inst.dueDate = dpDueDate;
      } else if (booking.scheme === 'MONTHLY_INSTALLMENT' && hasDpInst) {
        inst.dueDate = null; // Deferred until DP is completed
      }
      inst.paidAmount = 0;
      inst.lateFine = 0;
      inst.lateFinePaid = 0;
      inst.lateFineRebate = 0;
      inst.paidDate = null;
      inst.paymentMode = null;
      inst.receiptNumber = null;
      inst.status = 'PENDING';
      if (session) await inst.save({ session });
      else await inst.save();
    }

    // 2. Fetch all realized / approved receipts for this booking sorted by createdAt ascending
    const receiptQuery = PlotReceipt.find({
      bookingId,
      status: { $in: ['APPROVED', undefined, null] }
    }).sort({ createdAt: 1, _id: 1 });
    if (session) receiptQuery.session(session);
    const receipts = await receiptQuery;

    let dpGracePeriod = 15;
    let emiGracePeriod = 15;
    let lateFineDailyPercent = 24 / 365;

    const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' });
    if (rateConfig) {
      if (rateConfig.dpGracePeriodDays !== undefined && rateConfig.dpGracePeriodDays !== null) {
        dpGracePeriod = rateConfig.dpGracePeriodDays;
      } else if (rateConfig.lateFineGraceDays !== undefined && rateConfig.lateFineGraceDays !== null) {
        dpGracePeriod = rateConfig.lateFineGraceDays;
      }
      if (rateConfig.emiGracePeriodDays !== undefined && rateConfig.emiGracePeriodDays !== null) {
        emiGracePeriod = rateConfig.emiGracePeriodDays;
      } else if (rateConfig.lateFineGraceDays !== undefined && rateConfig.lateFineGraceDays !== null) {
        emiGracePeriod = rateConfig.lateFineGraceDays;
      }
      if (rateConfig.lateFineRate !== undefined && rateConfig.lateFineRate !== null) {
        const freq = rateConfig.lateFineFrequency || 'YEARLY';
        if (freq === 'YEARLY') lateFineDailyPercent = rateConfig.lateFineRate / 365;
        else if (freq === 'MONTHLY') lateFineDailyPercent = rateConfig.lateFineRate / 30;
        else lateFineDailyPercent = rateConfig.lateFineRate;
      } else if (rateConfig.lateFineDailyPercent !== undefined && rateConfig.lateFineDailyPercent !== null) {
        lateFineDailyPercent = rateConfig.lateFineDailyPercent;
      }
    }

    if (booking.plotId) {
      const plotDoc = await Plot.findById(booking.plotId);
      if (plotDoc && plotDoc.seriesId) {
        const seriesDoc = await PlotSeriesMaster.findById(plotDoc.seriesId);
        if (seriesDoc) {
          if (seriesDoc.dpGracePeriodDays !== undefined && seriesDoc.dpGracePeriodDays !== null && seriesDoc.dpGracePeriodDays !== '') {
            dpGracePeriod = seriesDoc.dpGracePeriodDays;
          }
          if (seriesDoc.emiGracePeriodDays !== undefined && seriesDoc.emiGracePeriodDays !== null && seriesDoc.emiGracePeriodDays !== '') {
            emiGracePeriod = seriesDoc.emiGracePeriodDays;
          }
          if (seriesDoc.lateFineRate !== undefined && seriesDoc.lateFineRate !== null && seriesDoc.lateFineRate !== '') {
            const freq = seriesDoc.lateFineFrequency || rateConfig?.lateFineFrequency || 'YEARLY';
            if (freq === 'YEARLY') lateFineDailyPercent = seriesDoc.lateFineRate / 365;
            else if (freq === 'MONTHLY') lateFineDailyPercent = seriesDoc.lateFineRate / 30;
            else lateFineDailyPercent = seriesDoc.lateFineRate;
          }
        }
      }
    }

    const dailyRateMultiplier = (Number(lateFineDailyPercent) || (24 / 365)) / 100;
    const emiFreq = booking.emiFrequency || 'MONTHLY';
    const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;

    let dpPaidDate = null;

    // If there is no downpayment installment, EMIs are active from booking date
    if (!hasDpInst && booking.scheme === 'MONTHLY_INSTALLMENT') {
      dpPaidDate = bookingDateObj;
      for (const emiInst of installments) {
        if (emiInst.installmentNumber > 0) {
          const emiDueDate = new Date(dpPaidDate);
          emiDueDate.setMonth(emiDueDate.getMonth() + (emiInst.installmentNumber * freqMultiplier));
          emiDueDate.setHours(0, 0, 0, 0);
          emiInst.dueDate = emiDueDate;
        }
      }
    }

    // 4. Re-apply each receipt in chronological order
    for (const receipt of receipts) {
      let remainingPaid = Number(receipt.amount) || 0;
      let remainingRebate = Number(receipt.lateFineRebate) || 0;
      const paymentDate = new Date(receipt.createdAt);

      let totalLateFinePaidForReceipt = 0;

      for (const inst of installments) {
        if (remainingPaid <= 0 && remainingRebate <= 0) break;
        if (inst.status === 'PAID') continue;

        // DOWNPAYMENT receipts must only apply to downpayment installment (inst #0) and never to regular EMIs
        if (receipt.receiptType === 'DOWNPAYMENT' && inst.installmentNumber > 0) {
          continue;
        }

        // Calculate late fine accrued for this period
        let newlyAccruedFine = 0;
        if (inst.dueDate) {
          const effectiveGrace = (inst.installmentNumber === 0 || booking.scheme === 'FULL_PAYMENT') ? dpGracePeriod : emiGracePeriod;
          const unpaidPrincipal = Math.max(0, inst.dueAmount - (inst.paidAmount || 0));

          if (!inst.paidDate) {
            // First payment on this installment: calculate fine from dueDate (subject to grace period)
            const due = new Date(inst.dueDate);
            const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            const d2 = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
            const diffTime = d2 - d1;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays > effectiveGrace) {
              newlyAccruedFine = Math.round(unpaidPrincipal * dailyRateMultiplier * diffDays);
            }
          } else {
            // Subsequent partial payment on this installment: calculate incremental fine since last payment date
            const lastPaid = new Date(inst.paidDate);
            const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
            const d2 = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
            const diffTime = d2 - d1;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
              newlyAccruedFine = Math.round(unpaidPrincipal * dailyRateMultiplier * diffDays);
            }
          }
        }

        inst.lateFine = (inst.lateFine || 0) + newlyAccruedFine;
        const effectiveFine = inst.lateFine;

        // 1. Rebate
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        inst.lateFineRebate = (inst.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;

        // 2. Late Fine First (from Amount Paid)
        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        inst.lateFinePaid += finePaidThisTime;
        totalLateFinePaidForReceipt += finePaidThisTime;
        remainingPaid -= finePaidThisTime;

        // 3. Principal Second (from Remaining Amount Paid)
        const unpaidPrincipal = Math.max(0, inst.dueAmount - inst.paidAmount);
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        inst.paidAmount += principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;

        inst.paidDate = paymentDate;
        inst.paymentMode = receipt.paymentMode;
        inst.receiptNumber = receipt.receiptNumber;
        inst.status = (inst.paidAmount >= inst.dueAmount && (inst.lateFinePaid + (inst.lateFineRebate || 0)) >= inst.lateFine) ? 'PAID' : 'PARTIAL';

        // When Downpayment (Inst #0) becomes fully PAID, activate all EMI due dates!
        if (inst.installmentNumber === 0 && inst.status === 'PAID' && !dpPaidDate) {
          dpPaidDate = paymentDate;
          for (const emiInst of installments) {
            if (emiInst.installmentNumber > 0) {
              const emiDueDate = new Date(dpPaidDate);
              emiDueDate.setMonth(emiDueDate.getMonth() + (emiInst.installmentNumber * freqMultiplier));
              emiDueDate.setHours(0, 0, 0, 0);
              emiInst.dueDate = emiDueDate;
            }
          }
        }

        if (session) await inst.save({ session });
        else await inst.save();
      }

      // Sync lateFinePaid back to receipt
      receipt.lateFinePaid = totalLateFinePaidForReceipt;
      if (session) await receipt.save({ session });
      else await receipt.save();
    }

    // Persist all installments in final state (including updated dueDates)
    for (const inst of installments) {
      if (session) await inst.save({ session });
      else await inst.save();
    }

    // 5. Recalculate remainingAmount on Booking
    await this.recalculateBookingBalance(bookingId, session);

    // 6. Re-sync sponsor commissions accurately with locked rate matrix & hierarchy
    await plotDeveloperService.syncBookingSponsorCommissions(bookingId, session);
  }

  async recalculateBookingBalance(bookingId, session = null) {
    if (!bookingId) return null;
    const query = PlotBooking.findById(bookingId);
    if (session) query.session(session);
    const booking = await query;
    if (!booking) return null;

    const instQuery = PlotInstallment.find({ bookingId });
    if (session) instQuery.session(session);
    const installments = await instQuery;

    const totalPrincipalPaid = installments.reduce((sum, inst) => sum + (Number(inst.paidAmount) || 0), 0);
    const netPlotValue = Math.max(0, (Number(booking.plotValue) || 0) - (Number(booking.discount) || 0));

    booking.remainingAmount = Math.max(0, netPlotValue - totalPrincipalPaid);

    if (booking.remainingAmount === 0 && netPlotValue > 0) {
      booking.status = 'COMPLETED';
    } else if (booking.status === 'COMPLETED' && booking.remainingAmount > 0) {
      booking.status = 'ACTIVE';
    }

    if (session) {
      await booking.save({ session });
    } else {
      await booking.save();
    }
    return booking;
  }

  // ── INSTALLMENT / COLLECTIONS PAYMENTS ──────────────────────────
  async collectInstallment(bookingId, installmentIds, amountPaid, paymentMode, transactionReference, processedBy, lateFineRebate = 0, remarks = '', customDate = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');
      if (booking.status !== 'ACTIVE') {
        throw ApiError.badRequest(`Booking status is ${booking.status}. Can only collect on active bookings.`);
      }

      const paymentDate = customDate ? new Date(customDate) : new Date();

      // Record PlotPayment transaction
      const payment = new PlotPayment({
        bookingId: booking._id,
        amount: Number(amountPaid),
        paymentDate,
        paymentMode,
        transactionReference,
        processedBy,
        status: 'active',
        remarks,
      });
      if (customDate) {
        payment.createdAt = paymentDate;
      }
      await payment.save({ session });

      // Generate Receipt Number
      const fyStr = `${paymentDate.getFullYear().toString().slice(-2)}${(paymentDate.getFullYear() + 1).toString().slice(-2)}`;
      const receiptPrefix = `RO-REC-PLT-${fyStr}`;
      const receiptNumber = await Counter.getNextSequence(receiptPrefix, session, 5);

      let remainingPaid = Number(amountPaid);
      let remainingRebate = Number(lateFineRebate);

      let targetInstIds = installmentIds;
      if (!Array.isArray(targetInstIds) || targetInstIds.length === 0) {
        const unpaid = await PlotInstallment.find({
          bookingId: booking._id,
          status: { $ne: 'PAID' }
        }).sort({ installmentNumber: 1 }).session(session);
        targetInstIds = unpaid.map(i => i._id);
      }

      // Resolve series and rate configuration for grace period and daily fine rate
      let dpGracePeriod = 15;
      let emiGracePeriod = 15;
      let lateFineDailyPercent = 24 / 365;

      const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session);
      if (rateConfig) {
        if (rateConfig.dpGracePeriodDays !== undefined && rateConfig.dpGracePeriodDays !== null) {
          dpGracePeriod = rateConfig.dpGracePeriodDays;
        } else if (rateConfig.lateFineGraceDays !== undefined && rateConfig.lateFineGraceDays !== null) {
          dpGracePeriod = rateConfig.lateFineGraceDays;
        }
        if (rateConfig.emiGracePeriodDays !== undefined && rateConfig.emiGracePeriodDays !== null) {
          emiGracePeriod = rateConfig.emiGracePeriodDays;
        } else if (rateConfig.lateFineGraceDays !== undefined && rateConfig.lateFineGraceDays !== null) {
          emiGracePeriod = rateConfig.lateFineGraceDays;
        }
        if (rateConfig.lateFineRate !== undefined && rateConfig.lateFineRate !== null) {
          const freq = rateConfig.lateFineFrequency || 'YEARLY';
          if (freq === 'YEARLY') lateFineDailyPercent = rateConfig.lateFineRate / 365;
          else if (freq === 'MONTHLY') lateFineDailyPercent = rateConfig.lateFineRate / 30;
          else lateFineDailyPercent = rateConfig.lateFineRate;
        } else if (rateConfig.lateFineDailyPercent !== undefined && rateConfig.lateFineDailyPercent !== null) {
          lateFineDailyPercent = rateConfig.lateFineDailyPercent;
        }
      }

      if (booking.plotId) {
        const plotDoc = await Plot.findById(booking.plotId).session(session);
        if (plotDoc && plotDoc.seriesId) {
          const seriesDoc = await PlotSeriesMaster.findById(plotDoc.seriesId).session(session);
          if (seriesDoc) {
            if (seriesDoc.dpGracePeriodDays !== undefined && seriesDoc.dpGracePeriodDays !== null && seriesDoc.dpGracePeriodDays !== '') {
              dpGracePeriod = seriesDoc.dpGracePeriodDays;
            }
            if (seriesDoc.emiGracePeriodDays !== undefined && seriesDoc.emiGracePeriodDays !== null && seriesDoc.emiGracePeriodDays !== '') {
              emiGracePeriod = seriesDoc.emiGracePeriodDays;
            }
            if (seriesDoc.lateFineRate !== undefined && seriesDoc.lateFineRate !== null && seriesDoc.lateFineRate !== '') {
              const freq = seriesDoc.lateFineFrequency || rateConfig?.lateFineFrequency || 'YEARLY';
              if (freq === 'YEARLY') lateFineDailyPercent = seriesDoc.lateFineRate / 365;
              else if (freq === 'MONTHLY') lateFineDailyPercent = seriesDoc.lateFineRate / 30;
              else lateFineDailyPercent = seriesDoc.lateFineRate;
            }
          }
        }
      }

      const dailyRateMultiplier = (Number(lateFineDailyPercent) || (24 / 365)) / 100;

      const updatedInstallments = [];
      let totalPrincipalPaid = 0;
      let totalLateFinePaid = 0;

      for (const instId of targetInstIds) {
        if (remainingPaid <= 0 && remainingRebate <= 0) break;
        const installment = await PlotInstallment.findById(instId).session(session);
        if (!installment) continue;

        // Calculate late fine (applicable to both downpayment and EMIs when past due + grace period)
        let calculatedFine = 0;
        if (installment.dueDate) {
          const due = new Date(installment.dueDate);
          const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          const d2 = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
          const diffTime = d2 - d1;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          const effectiveGrace = (installment.installmentNumber === 0 || booking.scheme === 'FULL_PAYMENT') ? dpGracePeriod : emiGracePeriod;

          if (diffDays > effectiveGrace) {
            const unpaidPrincipal = Math.max(0, installment.dueAmount - (installment.paidAmount || 0));
            calculatedFine = Math.round(unpaidPrincipal * dailyRateMultiplier * diffDays);
          }
        }
        const effectiveFine = Math.max(installment.lateFine || 0, calculatedFine);
        installment.lateFine = effectiveFine;

        // 1. Distribute rebate first to the unpaid fine
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (installment.lateFinePaid || 0) - (installment.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        installment.lateFineRebate = (installment.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;

        // 2. Distribute payment: FIRST to remaining late fine
        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (installment.lateFinePaid || 0) - (installment.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        installment.lateFinePaid += finePaidThisTime;
        totalLateFinePaid += finePaidThisTime;
        remainingPaid -= finePaidThisTime;

        // 3. Distribute payment: SECOND to remaining principal
        const unpaidPrincipal = Math.max(0, installment.dueAmount - installment.paidAmount);
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        installment.paidAmount += principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;
        totalPrincipalPaid += principalPaidThisTime;

        updatedInstallments.push(installment);
      }

      // Scheme 1: For FULL_PAYMENT, if we pay the principal and there is a reversed commission, set it to 'active'
      if (booking.scheme === 'FULL_PAYMENT' && totalPrincipalPaid > 0) {
        await PlotSponsorCommission.updateMany(
          { bookingId: booking._id, status: 'reversed' },
          { $set: { status: 'active' } }
        ).session(session);
      }

      // Determine receipt type: DOWNPAYMENT, FULL_PAYMENT, or INSTALLMENT
      let resolvedReceiptType = 'INSTALLMENT';
      if (booking.scheme === 'FULL_PAYMENT') {
        resolvedReceiptType = 'FULL_PAYMENT';
      } else if (targetInstIds && targetInstIds.length > 0) {
        const targetInstDocs = await PlotInstallment.find({ _id: { $in: targetInstIds } }).session(session);
        if (targetInstDocs.length > 0 && targetInstDocs.every(i => i.installmentNumber === 0)) {
          resolvedReceiptType = 'DOWNPAYMENT';
        }
      } else if (updatedInstallments.length > 0 && updatedInstallments.every(i => i.installmentNumber === 0)) {
        resolvedReceiptType = 'DOWNPAYMENT';
      }

      // Non-cash collections require admin approval before realizing into ledger
      const isCash = String(paymentMode).toLowerCase() === 'cash';
      const initialStatus = isCash ? 'APPROVED' : 'PENDING';

      // Create Receipt
      const receipt = new PlotReceipt({
        receiptNumber,
        receiptType: resolvedReceiptType,
        bookingId: booking._id,
        amount: Number(amountPaid),
        lateFinePaid: isCash ? totalLateFinePaid : 0,
        lateFineRebate: Number(lateFineRebate),
        paymentMode,
        transactionReference,
        remarks,
        status: initialStatus,
        approvedBy: isCash ? processedBy : undefined,
        approvedAt: isCash ? (customDate ? paymentDate : new Date()) : undefined,
      });
      if (customDate) {
        receipt.createdAt = paymentDate;
      }
      await receipt.save({ session });

      // Rebuild entire ledger state for 100% accuracy (only processes APPROVED receipts)
      await this.rebuildBookingInstallmentsState(booking._id, session);

      // Log event
      await new PlotAuditLog({
        action: isCash ? 'COLLECT_INSTALLMENTS' : 'SUBMIT_PENDING_COLLECTION',
        modelName: 'PlotReceipt',
        documentId: receipt._id,
        userId: processedBy,
        details: { amountPaid, receiptNumber, paymentMode, status: initialStatus },
      }).save({ session });

      await session.commitTransaction();
      return { booking, receipt };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Edit Receipt details
  async updateReceipt(receiptId, updateData, processedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await PlotReceipt.findById(receiptId).session(session);
      if (!receipt) throw ApiError.notFound('Receipt not found');

      const booking = await PlotBooking.findById(receipt.bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      const oldMode = receipt.paymentMode;
      const oldRef = receipt.transactionReference;
      const oldAmount = receipt.amount;
      const newAmount = updateData.amount !== undefined ? Number(updateData.amount) : oldAmount;
      const newRebate = updateData.lateFineRebate !== undefined ? Number(updateData.lateFineRebate) : (receipt.lateFineRebate || 0);

      // 1. Update receipt and payment fields
      receipt.paymentMode = updateData.paymentMode || receipt.paymentMode;
      receipt.transactionReference = updateData.transactionReference !== undefined ? updateData.transactionReference : receipt.transactionReference;
      receipt.remarks = updateData.remarks !== undefined ? updateData.remarks : receipt.remarks;
      receipt.amount = newAmount;
      receipt.lateFineRebate = newRebate;
      if (updateData.createdAt) receipt.createdAt = new Date(updateData.createdAt);
      await receipt.save({ session });

      const payment = await PlotPayment.findOne({
        bookingId: receipt.bookingId,
        amount: oldAmount,
        paymentMode: oldMode,
        transactionReference: oldRef,
      }).session(session);
      if (payment) {
        payment.paymentMode = receipt.paymentMode;
        payment.transactionReference = receipt.transactionReference;
        payment.remarks = receipt.remarks;
        payment.amount = newAmount;
        if (updateData.createdAt) {
          payment.paymentDate = new Date(updateData.createdAt);
          payment.createdAt = new Date(updateData.createdAt);
        }
        await payment.save({ session });
      }

      // 2. Re-allocate payment amount to the installments
      const installments = await PlotInstallment.find({ receiptNumber: receipt.receiptNumber })
        .sort({ installmentNumber: 1 })
        .session(session);

      // Revert contributions to booking outstanding balance first
      let totalPrincipalReverted = 0;
      for (const inst of installments) {
        totalPrincipalReverted += inst.paidAmount;
      }
      booking.remainingAmount += totalPrincipalReverted;

      // Clean existing sponsor commission and reset installments state first
      for (const inst of installments) {
        await PlotSponsorCommission.deleteMany({ bookingId: booking._id, installmentId: inst._id }).session(session);
        inst.paidAmount = 0;
        inst.lateFine = 0;
        inst.lateFinePaid = 0;
        inst.lateFineRebate = 0;
        inst.status = 'PENDING';
        inst.paymentMode = null;
        inst.paidDate = null;
      }

      const paymentDate = updateData.createdAt ? new Date(updateData.createdAt) : new Date(receipt.createdAt);

      let remainingPaid = newAmount;
      let remainingRebate = newRebate;
      let totalPrincipalPaid = 0;
      let totalLateFinePaid = 0;

      for (const inst of installments) {
        if (remainingPaid <= 0 && remainingRebate <= 0) {
          await inst.save({ session });
          continue;
        }

        const effectiveFine = inst.lateFine || 0;

        // 1. Distribute rebate first to the unpaid fine
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        inst.lateFineRebate = (inst.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;

        // 2. Distribute payment: FIRST to principal, then to remaining late fine
        const unpaidPrincipal = Math.max(0, inst.dueAmount - inst.paidAmount);
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        inst.paidAmount += principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;
        totalPrincipalPaid += principalPaidThisTime;

        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        inst.lateFinePaid += finePaidThisTime;
        totalLateFinePaid += finePaidThisTime;
        remainingPaid -= finePaidThisTime;

        inst.paidDate = paymentDate;
        inst.paymentMode = receipt.paymentMode;
        inst.receiptNumber = receipt.receiptNumber;
        inst.status = (inst.paidAmount >= inst.dueAmount && (inst.lateFinePaid + (inst.lateFineRebate || 0)) >= inst.lateFine) ? 'PAID' : 'PARTIAL';
        await inst.save({ session });
      }

      // Recalculate remaining balance on booking dynamically
      await this.recalculateBookingBalance(booking._id, session);

      // Re-sync sponsor commissions accurately with locked rate matrix & hierarchy
      await plotDeveloperService.syncBookingSponsorCommissions(booking._id, session);

      // Save lateFinePaid to receipt
      receipt.lateFinePaid = totalLateFinePaid;
      await receipt.save({ session });

      // Rebuild entire ledger state for 100% accuracy
      await this.rebuildBookingInstallmentsState(receipt.bookingId, session);

      // Log event
      await new PlotAuditLog({
        action: 'UPDATE_RECEIPT',
        modelName: 'PlotReceipt',
        documentId: receipt._id,
        userId: processedBy,
        details: { oldMode, newMode: receipt.paymentMode, oldAmount, newAmount },
      }).save({ session });

      await session.commitTransaction();
      return receipt;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Delete/Reverse Receipt
  async deleteReceipt(receiptId, processedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await PlotReceipt.findById(receiptId).session(session);
      if (!receipt) throw ApiError.notFound('Receipt not found');

      const booking = await PlotBooking.findById(receipt.bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      // 1. Delete corresponding PlotPayment record
      await PlotPayment.deleteMany({
        bookingId: receipt.bookingId,
        amount: receipt.amount,
        paymentMode: receipt.paymentMode,
        transactionReference: receipt.transactionReference,
      }).session(session);

      // 2. Clean up any ledger entries for this deleted receipt
      const existingEntries = await Entry.find({
        source: 'commission_fixed',
        referenceId: receipt._id,
      }).session(session);
      for (const e of existingEntries) {
        await accountingService.deleteLedgerEntry(e._id, session);
      }
      await PlotSponsorCommission.deleteMany({ receiptId: receipt._id }).session(session);

      // 3. Delete the receipt document itself
      await receipt.deleteOne({ session });

      // 4. Rebuild the entire installment ledger, balance, and commission state from remaining active receipts
      await this.rebuildBookingInstallmentsState(booking._id, session);

      // For FULL_PAYMENT, reverse any PlotSponsorCommission for this booking if no receipts left
      if (booking.scheme === 'FULL_PAYMENT') {
        const remainingCount = await PlotReceipt.countDocuments({ bookingId: booking._id }).session(session);
        if (remainingCount === 0) {
          await PlotSponsorCommission.updateMany(
            { bookingId: booking._id },
            { $set: { status: 'reversed' } }
          ).session(session);
        }
      }

      // Log event
      await new PlotAuditLog({
        action: 'DELETE_RECEIPT',
        modelName: 'PlotReceipt',
        documentId: receiptId,
        userId: processedBy,
        details: { receiptNumber: receipt.receiptNumber, amount: receipt.amount },
      }).save({ session });

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Approve Pending Collection Receipt (Admin Action)
  async approveReceipt(receiptId, adminUserId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await PlotReceipt.findById(receiptId).session(session);
      if (!receipt) throw ApiError.notFound('Receipt not found');
      if (receipt.status === 'APPROVED') {
        throw ApiError.badRequest('Receipt is already approved');
      }

      receipt.status = 'APPROVED';
      receipt.approvedBy = adminUserId;
      receipt.approvedAt = new Date();
      receipt.rejectionReason = '';
      await receipt.save({ session });

      // Rebuild ledger and sync commissions with approved receipt included
      await this.rebuildBookingInstallmentsState(receipt.bookingId, session);

      // Audit log
      await new PlotAuditLog({
        action: 'APPROVE_RECEIPT',
        modelName: 'PlotReceipt',
        documentId: receipt._id,
        userId: adminUserId,
        details: { receiptNumber: receipt.receiptNumber, amount: receipt.amount, paymentMode: receipt.paymentMode },
      }).save({ session });

      await session.commitTransaction();
      return receipt;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Reject Pending Collection Receipt (Admin Action)
  async rejectReceipt(receiptId, rejectionReason, adminUserId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const receipt = await PlotReceipt.findById(receiptId).session(session);
      if (!receipt) throw ApiError.notFound('Receipt not found');
      if (receipt.status === 'REJECTED') {
        throw ApiError.badRequest('Receipt is already rejected');
      }

      receipt.status = 'REJECTED';
      receipt.rejectionReason = rejectionReason || 'Rejected by Admin';
      receipt.approvedBy = adminUserId;
      receipt.approvedAt = new Date();
      await receipt.save({ session });

      // If it was previously approved, rebuild ledger to revert effects
      await this.rebuildBookingInstallmentsState(receipt.bookingId, session);

      // Audit log
      await new PlotAuditLog({
        action: 'REJECT_RECEIPT',
        modelName: 'PlotReceipt',
        documentId: receipt._id,
        userId: adminUserId,
        details: { receiptNumber: receipt.receiptNumber, amount: receipt.amount, rejectionReason },
      }).save({ session });

      await session.commitTransaction();
      return receipt;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getInstallments(bookingId) {
    await this.rebuildBookingInstallmentsState(bookingId);
    return PlotInstallment.find({ bookingId }).sort({ installmentNumber: 1 });
  }

  async getPayoutSchedules(bookingId) {
    return PlotPayoutSchedule.find({ bookingId }).sort({ weekNumber: 1 });
  }

  async getReceipts(filters = {}) {
    const query = {};
    if (filters.bookingId) query.bookingId = filters.bookingId;
    if (filters.receiptType) query.receiptType = filters.receiptType;

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [receipts, total] = await Promise.all([
      PlotReceipt.find(query)
        .populate({
          path: 'bookingId',
          populate: [
            { path: 'customerId', select: 'name customerId mobile address' },
            { path: 'plotId', populate: { path: 'seriesId' } }
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PlotReceipt.countDocuments(query),
    ]);

    return {
      receipts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getReceiptById(id) {
    const receipt = await PlotReceipt.findById(id)
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customerId', select: 'name customerId mobile address email' },
          { path: 'sponsorId', select: 'name customerId' },
          { path: 'plotId', populate: { path: 'seriesId' } }
        ],
      });
    if (!receipt) throw ApiError.notFound('Receipt not found');

    const receiptObj = receipt.toObject();

    if (receipt.bookingId) {
      const allReceipts = await PlotReceipt.find({ bookingId: receipt.bookingId._id })
        .sort({ createdAt: 1, _id: 1 });

      const netPlotCost = (receipt.bookingId.plotValue || 0) - (receipt.bookingId.discount || 0);
      let cumulativePrincipalPaid = 0;

      for (const r of allReceipts) {
        const principalPaid = (r.amount || 0) - (r.lateFinePaid || 0);
        cumulativePrincipalPaid += principalPaid;
        if (r._id.toString() === receipt._id.toString()) {
          break;
        }
      }

      receiptObj.asOfRemainingAmount = Math.max(0, netPlotCost - cumulativePrincipalPaid);
    }

    return receiptObj;
  }
}

module.exports = new PlotCollectionService();
