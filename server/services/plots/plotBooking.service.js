const mongoose = require('mongoose');
const PlotBooking = require('../../models/PlotBooking');
const Plot = require('../../models/Plot');
const PlotCustomer = require('../../models/PlotCustomer');
const User = require('../../models/user');
const Counter = require('../../models/Counter');
const PlotRateConfiguration = require('../../models/PlotRateConfiguration');
const PlotInstallment = require('../../models/PlotInstallment');
const PlotPayment = require('../../models/PlotPayment');
const PlotPayoutSchedule = require('../../models/PlotPayoutSchedule');
const PlotReceipt = require('../../models/PlotReceipt');
const PlotSponsorCommission = require('../../models/PlotSponsorCommission');
const PlotBookingRevision = require('../../models/PlotBookingRevision');
const KisanLandAgreement = require('../../models/KisanLandAgreement');
const LandStockLedger = require('../../models/LandStockLedger');
const Voucher = require('../../models/voucher');
const PlotAuditLog = require('../../models/PlotAuditLog');
const ApiError = require('../../utils/apiError');
const plotConfigService = require('./plotConfig.service');
const plotDeveloperService = require('./plotDeveloper.service');

class PlotBookingService {
  // ── BOOKING & HOLD ENGINE ───────────────────────────────────────
  async createBookingOrHold(data, processedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const {
        plotId,
        customerId,
        customerName,
        customerMobile,
        customerEmail,
        sponsorId,
        scheme,
        bookingAmount,
        paymentMode = 'cash',
        transactionReference = '',
        notes,
        bookingType = 'BOOKING',
        holdExpiryDays = 7,
        discount = 0,
        installmentCount,
        installmentAmount,
        bookingDate,
        oneTimeMonths = 1,
        tenureMonths,
        downpaymentMonths = 3,
        downpaymentDays = 90,
        landSourcing = [],
      } = data;

      const plot = await Plot.findById(plotId).session(session);
      if (!plot) throw ApiError.notFound('Plot not found');
      if (plot.status !== 'AVAILABLE') {
        throw ApiError.badRequest(`Plot ${plot.plotNumber} is not available (Status: ${plot.status})`);
      }

      const requiredPlotArea = plot.plotSize || plot.area || 0;

      // 1b. Process & Validate Mandatory Land Stock Sourcing
      if (!Array.isArray(landSourcing) || landSourcing.filter((item) => Number(item.allocatedSqFt) > 0).length === 0) {
        throw ApiError.badRequest(
          `Land Acquisition Sourcing is mandatory. Please link and allocate ${requiredPlotArea} Sq.Ft. from an active Kisan Land Agreement or Registry Deed.`
        );
      }

      const processedSourcing = [];
      let totalSourcedSqFt = 0;
      for (const item of landSourcing) {
        const numSqFt = Number(item.allocatedSqFt) || 0;
        if (numSqFt <= 0) continue;
        totalSourcedSqFt += numSqFt;

        const agr = await KisanLandAgreement.findById(item.agreementId).session(session);
        if (!agr) throw ApiError.badRequest(`Land Agreement ${item.agreementId} not found`);

        const availSqFt =
          agr.totalAvailableSqFt !== undefined && agr.totalAvailableSqFt !== null
            ? agr.totalAvailableSqFt
            : Math.max(0, (agr.totalSqFt || 0) - (agr.totalAllocatedSqFt || 0));

        if (availSqFt < numSqFt) {
          throw ApiError.badRequest(
            `Insufficient stock in Agreement ${agr.agreementNumber}. Available: ${availSqFt} SqFt, Requested: ${numSqFt} SqFt`
          );
        }

        agr.totalAllocatedSqFt = (agr.totalAllocatedSqFt || 0) + numSqFt;
        agr.totalAvailableSqFt = Math.max(0, (agr.totalSqFt || 0) - agr.totalAllocatedSqFt);
        if (agr.unregisteredAgreedSqFt) {
          agr.unregisteredAllocatedSqFt = Math.min(
            agr.unregisteredAgreedSqFt,
            (agr.unregisteredAllocatedSqFt || 0) + numSqFt
          );
          agr.unregisteredAvailableSqFt = Math.max(0, agr.unregisteredAgreedSqFt - agr.unregisteredAllocatedSqFt);
        }
        await agr.save({ session });

        processedSourcing.push({
          sourceType: 'AGREEMENT',
          agreementId: agr._id,
          agreementNumber: agr.agreementNumber,
          deedId: null,
          deedNumber: '',
          mauja: agr.mauja || agr.landParcels?.[0]?.mauja || '',
          khataNumber: agr.khataNumber || agr.landParcels?.[0]?.khataNumber || '',
          khesraNumber: agr.khesraNumber || agr.landParcels?.[0]?.khesraNumber || '',
          allocatedSqFt: numSqFt,
          allocatedDismil: Math.round((numSqFt / 435.6) * 1000) / 1000,
        });
      }

      if (Math.abs(totalSourcedSqFt - requiredPlotArea) > 0.5) {
        throw ApiError.badRequest(
          `Total allocated land source (${totalSourcedSqFt} Sq.Ft.) does not match plot area (${requiredPlotArea} Sq.Ft.). Please adjust the allocated area.`
        );
      }

      // 2. Resolve/Register Customer in PlotCustomer
      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        if (!customerName || !customerMobile) {
          throw ApiError.badRequest('Either Customer ID or Name & Mobile is required');
        }
        let customerDoc = await PlotCustomer.findOne({ mobile: customerMobile }).session(session);
        if (!customerDoc) {
          const fyStr = `${new Date().getFullYear().toString().slice(-2)}${(new Date().getFullYear() + 1).toString().slice(-2)}`;
          const custSeq = await Counter.getNextSequence(`RO-CUST-${fyStr}`, session, 5);
          customerDoc = new PlotCustomer({
            customerId: custSeq,
            name: customerName,
            mobile: customerMobile,
            email: customerEmail || '',
          });
          await customerDoc.save({ session });
        }
        finalCustomerId = customerDoc._id;
      }

      const customer = await PlotCustomer.findById(finalCustomerId).session(session);
      if (!customer) throw ApiError.badRequest('Customer not found');

      const finalSponsorId = sponsorId !== undefined
        ? (sponsorId || null)
        : (customer.sponsorId ? customer.sponsorId : null);

      // 3. Rate Slab Lookup & Dynamic Plot Pricing
      const emiFreq = data.emiFrequency || 'MONTHLY';
      const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;
      const numInstallments = Number(data.installmentCount) || 0;
      const resolvedTenure = tenureMonths !== undefined
        ? Number(tenureMonths)
        : (scheme === 'FULL_PAYMENT' ? 0 : (numInstallments > 0 ? numInstallments * freqMultiplier : 6));

      const rateConfig = await plotConfigService.getRateConfig();
      const slabs = rateConfig.rateSlabs || PlotRateConfiguration.getDefaultRateSlabs();
      const slab = slabs.find(s => Number(s.tenureMonths) === resolvedTenure) || slabs[0];

      const basePlotRate = data.customSqFtRate !== undefined && Number(data.customSqFtRate) > 0
        ? Number(data.customSqFtRate)
        : (data.basePlotRate !== undefined && Number(data.basePlotRate) > 0
          ? Number(data.basePlotRate)
          : (slab.plotRate || rateConfig.baseSqFtRate || 1000));

      let appliedPremiumHeads = [];
      let totalPremiumPercent = 0;

      if (data.appliedPremiumHeads !== undefined && Array.isArray(data.appliedPremiumHeads)) {
        appliedPremiumHeads = data.appliedPremiumHeads.filter(h => h && h.name && Number(h.extraPercent) > 0);
        totalPremiumPercent = appliedPremiumHeads.reduce((sum, h) => sum + (Number(h.extraPercent) || 0), 0);
      } else {
        totalPremiumPercent = plotConfigService.calculatePlotTotalPremiumPercent(plot, rateConfig);
        if (plot?.premiumHeads && Array.isArray(plot.premiumHeads) && plot.premiumHeads.length > 0) {
          appliedPremiumHeads = plot.premiumHeads;
        } else if (plot?.plotType === 'CORNER') {
          appliedPremiumHeads = [{ name: 'Corner Plot', extraPercent: rateConfig?.cornerExtraPercent || 20 }];
        }
      }

      const effectiveSqFtRate = basePlotRate * (1 + totalPremiumPercent / 100);
      const plotValue = Math.round(plot.plotSize * effectiveSqFtRate);

      // 4. Generate Booking number
      const bookingDateObj = bookingDate ? new Date(bookingDate) : new Date();
      const date = bookingDateObj;
      const month = date.getMonth();
      const fullYear = date.getFullYear();
      let startYearVal, endYearVal;
      if (month >= 3) {
        startYearVal = fullYear;
        endYearVal = fullYear + 1;
      } else {
        startYearVal = fullYear - 1;
        endYearVal = fullYear;
      }
      const fyStr = `${String(startYearVal).slice(-2)}${String(endYearVal).slice(-2)}`;
      const prefix = `BOOKING_FY_${fyStr}`;
      const counter = await Counter.findByIdAndUpdate(
        prefix,
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );
      const bookingNumber = `${fyStr}${String(counter.sequence).padStart(3, '0')}`;

      // Calculate Downpayment & EMI Breakdown
      const discountVal = Number(discount) || 0;
      const resolvedScheme = resolvedTenure === 0 ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT';
      const resolvedDpDays = Number(downpaymentDays) || (Number(downpaymentMonths) ? Number(downpaymentMonths) * 30 : 90);
      const resolvedDpMonths = Math.max(1, Math.round(resolvedDpDays / 30));

      let resolvedDpRate = 0;
      let downpaymentAmt = 0;
      let emiPrincipalAmt = 0;
      let emiMonthlyAmt = 0;
      let emiRatePerSqFt = 0;
      let remainingAmount = 0;

      if (resolvedTenure === 0) {
        resolvedDpRate = basePlotRate;
        downpaymentAmt = Math.max(0, plotValue - discountVal);
        emiPrincipalAmt = 0;
        emiMonthlyAmt = 0;
        emiRatePerSqFt = 0;
        remainingAmount = downpaymentAmt;
      } else {
        resolvedDpRate = data.customDownpaymentRate !== undefined && Number(data.customDownpaymentRate) >= 0
          ? Number(data.customDownpaymentRate)
          : (data.downpaymentRate !== undefined && Number(data.downpaymentRate) >= 0
            ? Number(data.downpaymentRate)
            : (Number(slab.downpaymentRate) || 500));

        downpaymentAmt = data.downpaymentAmount !== undefined && Number(data.downpaymentAmount) >= 0
          ? Number(data.downpaymentAmount)
          : Math.round(plot.plotSize * resolvedDpRate);

        const grossEmiBalance = Math.max(0, plotValue - downpaymentAmt);
        emiPrincipalAmt = Math.max(0, grossEmiBalance - discountVal);
        remainingAmount = downpaymentAmt + emiPrincipalAmt;
        const totalInstallmentCount = numInstallments > 0 ? numInstallments : resolvedTenure;
        emiMonthlyAmt = totalInstallmentCount > 0 ? Math.round(emiPrincipalAmt / totalInstallmentCount) : 0;
        emiRatePerSqFt = plot.plotSize > 0 ? Math.round((emiPrincipalAmt / plot.plotSize) * 100) / 100 : 0;
      }

      const booking = new PlotBooking({
        bookingNumber,
        bookingDate: bookingDateObj,
        customerId: finalCustomerId,
        sponsorId: finalSponsorId,
        plotId,
        plotValue,
        scheme: resolvedScheme,
        bookingAmount: 0,
        remainingAmount,
        status: bookingType === 'HOLD' ? 'HOLD' : 'ACTIVE',
        holdExpiryDate: bookingType === 'HOLD' ? new Date(bookingDateObj.getTime() + holdExpiryDays * 24 * 60 * 60 * 1000) : undefined,
        notes,
        discount: discountVal,
        oneTimeMonths: resolvedTenure === 0 ? Number(oneTimeMonths) || 1 : undefined,
        tenureMonths: resolvedTenure,
        emiFrequency: emiFreq,
        installmentCount: numInstallments > 0 ? numInstallments : resolvedTenure,
        basePlotRate,
        downpaymentRate: resolvedDpRate,
        appliedPremiumHeads,
        effectivePlotRate: effectiveSqFtRate,
        emiRate: emiRatePerSqFt,
        promoterCommissionPercent: 5.0,
        developerCommissionPercent: 2.0,
        downpaymentMonths: resolvedDpMonths,
        downpaymentDays: resolvedDpDays,
        downpaymentAmount: downpaymentAmt,
        emiPrincipalAmount: emiPrincipalAmt,
        emiMonthlyAmount: emiMonthlyAmt,
        downpaymentCalculationBase: 'AFTER_DISCOUNT_EMI',
        landSourcing: processedSourcing,
      });
      await booking.save({ session });

      // Log Land Stock Ledger for each allocated source
      for (const src of processedSourcing) {
        const stockLog = new LandStockLedger({
          agreementId: src.agreementId,
          sourceType: src.sourceType,
          deedId: src.deedId || null,
          deedNumber: src.deedNumber || '',
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
          customerName: customer.name,
          plotNumber: plot.plotNumber,
          transactionType: 'BOOKING_ALLOCATION',
          entryType: 'DEBIT',
          dismil: src.allocatedDismil,
          sqFt: src.allocatedSqFt,
          runningAvailableSqFt: 0,
          date: booking.bookingDate,
          remarks: `Allocated ${src.allocatedSqFt} SqFt (${src.allocatedDismil} Dismil) to Booking #${booking.bookingNumber} (${customer.name}, Plot ${plot.plotNumber})`,
          performedBy: processedBy,
        });
        await stockLog.save({ session });
      }

      plot.status = bookingType === 'HOLD' ? 'HOLD' : 'BOOKED';
      await plot.save({ session });

      // Scheme Engine & Installment Schedule
      if (bookingType === 'BOOKING') {
        if (resolvedTenure === 0) {
          const dueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);
          const installments = [{
            installmentNumber: 1,
            bookingId: booking._id,
            dueDate,
            dueAmount: remainingAmount,
            paidAmount: 0,
            status: 'PENDING',
          }];
          await PlotInstallment.insertMany(installments, { session });
        } else {
          const installments = [];
          const dpDueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);
          if (downpaymentAmt > 0) {
            installments.push({
              installmentNumber: 0,
              bookingId: booking._id,
              dueDate: dpDueDate,
              dueAmount: downpaymentAmt,
              paidAmount: 0,
              status: 'PENDING',
            });
          }

          let principalToDistribute = emiPrincipalAmt;
          const count = numInstallments > 0 ? numInstallments : resolvedTenure;

          for (let i = 1; i <= count; i++) {
            let dueForThisInst = 0;
            if (i === count) {
              dueForThisInst = Math.round(principalToDistribute * 100) / 100;
            } else {
              dueForThisInst = Math.floor(emiPrincipalAmt / count);
              dueForThisInst = Math.min(dueForThisInst, principalToDistribute);
            }
            dueForThisInst = Math.round(dueForThisInst * 100) / 100;
            principalToDistribute -= dueForThisInst;

            if (dueForThisInst > 0) {
              installments.push({
                installmentNumber: i,
                bookingId: booking._id,
                dueDate: null,
                dueAmount: dueForThisInst,
                paidAmount: 0,
                status: 'PENDING',
              });
            }
          }
          await PlotInstallment.insertMany(installments, { session });
        }

        await plotDeveloperService.syncBookingSponsorCommissions(booking._id, session);
      }

      await new PlotAuditLog({
        action: bookingType === 'HOLD' ? 'CREATE_HOLD' : 'CREATE_BOOKING',
        modelName: 'PlotBooking',
        documentId: booking._id,
        userId: processedBy,
        details: { plotNumber: plot.plotNumber, scheme, bookingAmount: 0, customerId: finalCustomerId },
      }).save({ session });

      await session.commitTransaction();
      return { booking, receipt: null };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ── DYNAMIC BOOKING RESTRUCTURING ENGINE ──────────────────────────
  async restructureBooking(bookingId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');
      if (['CANCELLED'].includes(booking.status)) {
        throw ApiError.badRequest(`Cannot restructure a booking with status: ${booking.status}`);
      }

      const plot = await Plot.findById(booking.plotId).session(session);
      if (!plot) throw ApiError.notFound('Plot not found');

      const receipts = await PlotReceipt.find({ bookingId: booking._id, status: 'APPROVED' }).session(session);
      const totalPaidSoFar = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

      const existingInstallments = await PlotInstallment.find({ bookingId: booking._id }).sort({ installmentNumber: 1 }).session(session);
      const paidInstCount = existingInstallments.filter((i) => i.status === 'PAID').length;

      const customerBefore = await PlotCustomer.findById(booking.customerId).session(session);
      const sponsorBefore = booking.sponsorId ? await User.findById(booking.sponsorId).session(session) : null;
      const rateConfigObj = await PlotRateConfiguration.findOne({ status: 'active' }).session(session);
      const prevCornerExtra = plot?.plotType === 'CORNER' ? (rateConfigObj?.cornerExtraPercent || 20) : 0;
      const prevBaseRate = booking.basePlotRate || 1000;
      const prevEffectiveRate = Math.round(prevBaseRate * (1 + prevCornerExtra / 100));

      const previousSnapshot = {
        customerId: booking.customerId,
        customerName: customerBefore?.name || booking.customerName || 'N/A',
        customerMobile: customerBefore?.mobile || booking.customerMobile || '',
        sponsorId: booking.sponsorId || null,
        sponsorName: sponsorBefore?.name || 'Direct / Company',
        plotId: booking.plotId,
        plotNumber: plot?.plotNumber || '',
        plotSize: plot.plotSize,
        scheme: booking.scheme,
        tenureMonths: booking.tenureMonths,
        basePlotRate: prevBaseRate,
        effectiveRate: prevEffectiveRate,
        govtRate: booking.govtRate || 100,
        plotValue: booking.plotValue,
        discount: booking.discount || 0,
        remainingAmount: booking.remainingAmount,
        downpaymentAmount: booking.downpaymentAmount || 0,
        downpaymentMonths: booking.downpaymentMonths || 1,
        oneTimeMonths: booking.oneTimeMonths || 1,
        emiMonthlyAmount: booking.emiMonthlyAmount || 0,
        promoterCommissionPercent: booking.promoterCommissionPercent,
        developerCommissionPercent: booking.developerCommissionPercent,
        agreementNumber: booking.agreementNumber || '',
        bookingDate: booking.bookingDate,
        bookingType: booking.bookingType || (booking.status === 'HOLD' ? 'HOLD' : 'BOOKING'),
        status: booking.status,
        paymentMode: booking.paymentMode || 'cash',
        transactionReference: booking.transactionReference || '',
        landSourcing: JSON.parse(JSON.stringify(booking.landSourcing || [])),
        paidInstallmentsCount: paidInstCount,
        totalPaidAmount: totalPaidSoFar,
      };

      const newPlotSize = updateData.plotSize !== undefined ? Number(updateData.plotSize) : plot.plotSize;
      const newTenureMonths = updateData.tenureMonths !== undefined ? Number(updateData.tenureMonths) : booking.tenureMonths;
      const newDiscount = updateData.discount !== undefined ? Number(updateData.discount) : (booking.discount || 0);
      const newOneTimeMonths = updateData.oneTimeMonths !== undefined ? Number(updateData.oneTimeMonths) : (booking.oneTimeMonths || 1);
      const newDpBase = updateData.downpaymentCalculationBase || booking.downpaymentCalculationBase || 'BEFORE_DISCOUNT';

      const deltaSqFt = newPlotSize - (plot.plotSize || 0);

      const rateConfig = await plotConfigService.getRateConfig();
      const slabs = rateConfig.rateSlabs || PlotRateConfiguration.getDefaultRateSlabs();
      const slab = slabs.find((s) => Number(s.tenureMonths) === newTenureMonths) || slabs[0];

      const basePlotRate = slab.plotRate || rateConfig.baseSqFtRate || 1000;
      const totalPremiumPercent = plotConfigService.calculatePlotTotalPremiumPercent(plot, rateConfig);
      const effectiveSqFtRate = basePlotRate * (1 + totalPremiumPercent / 100);
      const newPlotValue = Math.round(newPlotSize * effectiveSqFtRate);
      const newNetContractValue = Math.max(0, newPlotValue - newDiscount);

      let newLandSourcing = Array.isArray(updateData.landSourcing) && updateData.landSourcing.length > 0
        ? updateData.landSourcing
        : (booking.landSourcing || []);

      const isSourcingProvided = Array.isArray(updateData.landSourcing) && updateData.landSourcing.length > 0;
      if (deltaSqFt !== 0 || isSourcingProvided) {
        if (deltaSqFt !== 0) {
          plot.plotSize = newPlotSize;
          plot.effectiveRate = effectiveSqFtRate;
          plot.totalPlotValue = newPlotValue;
          await plot.save({ session });
        }

        const oldSourcing = Array.isArray(booking.landSourcing) ? booking.landSourcing : [];
        for (const oldSrc of oldSourcing) {
          const oldSqFt = Number(oldSrc.allocatedSqFt) || 0;
          if (oldSqFt <= 0) continue;

          const oldAgr = await KisanLandAgreement.findById(oldSrc.agreementId).session(session);
          if (oldAgr) {
            if (oldSrc.sourceType === 'REGISTRY_DEED') {
              const deed = oldAgr.registryDeeds.find((d) => String(d._id) === String(oldSrc.deedId) || d.deedNumber === oldSrc.deedNumber);
              if (deed) {
                deed.allocatedSqFt = Math.max(0, (deed.allocatedSqFt || 0) - oldSqFt);
                deed.availableSqFt = Math.max(0, deed.registeredSqFt - deed.allocatedSqFt);
                deed.status = 'ACTIVE';
              }
            } else {
              oldAgr.unregisteredAllocatedSqFt = Math.max(0, (oldAgr.unregisteredAllocatedSqFt || 0) - oldSqFt);
              oldAgr.unregisteredAvailableSqFt = Math.max(0, oldAgr.unregisteredAgreedSqFt - oldAgr.unregisteredAllocatedSqFt);
            }
            oldAgr.totalAllocatedSqFt = Math.max(0, (oldAgr.totalAllocatedSqFt || 0) - oldSqFt);
            oldAgr.totalAvailableSqFt = Math.max(0, oldAgr.totalSqFt - oldAgr.totalAllocatedSqFt);
            await oldAgr.save({ session });

            await new LandStockLedger({
              agreementId: oldAgr._id,
              sourceType: oldSrc.sourceType,
              deedId: oldSrc.deedId || null,
              deedNumber: oldSrc.deedNumber || '',
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              customerName: booking.customerName || '',
              plotNumber: plot.plotNumber || '',
              transactionType: 'BOOKING_RESTRUCTURING_DELTA',
              entryType: 'CREDIT',
              dismil: oldSrc.allocatedDismil || Math.round((oldSqFt / 435.6) * 1000) / 1000,
              sqFt: oldSqFt,
              runningAvailableSqFt: oldAgr.totalAvailableSqFt,
              date: new Date(),
              remarks: `Released ${oldSqFt} SqFt allocation in Restructuring for Booking #${booking.bookingNumber}`,
              performedBy: userId,
            }).save({ session });
          }
        }

        const processedNewSourcing = [];
        for (const newSrc of newLandSourcing) {
          const newSqFt = Number(newSrc.allocatedSqFt) || 0;
          if (newSqFt <= 0) continue;

          const newAgr = await KisanLandAgreement.findById(newSrc.agreementId).session(session);
          if (!newAgr) throw ApiError.badRequest(`Land Agreement ${newSrc.agreementId} not found`);

          if (newSrc.sourceType === 'REGISTRY_DEED') {
            const deed = newAgr.registryDeeds.find((d) => String(d._id) === String(newSrc.deedId) || d.deedNumber === newSrc.deedNumber);
            if (!deed) throw ApiError.badRequest(`Registry Deed ${newSrc.deedNumber} not found in Agreement ${newAgr.agreementNumber}`);
            if ((deed.availableSqFt || 0) < newSqFt) {
              throw ApiError.badRequest(`Insufficient stock in Registry Deed ${deed.deedNumber}. Available: ${deed.availableSqFt} SqFt, Requested: ${newSqFt} SqFt`);
            }
            deed.allocatedSqFt = (deed.allocatedSqFt || 0) + newSqFt;
            deed.availableSqFt = Math.max(0, deed.registeredSqFt - deed.allocatedSqFt);
            if (deed.availableSqFt <= 0) deed.status = 'FULLY_ALLOCATED';

            newAgr.totalAllocatedSqFt = (newAgr.totalAllocatedSqFt || 0) + newSqFt;
            newAgr.totalAvailableSqFt = Math.max(0, newAgr.totalSqFt - newAgr.totalAllocatedSqFt);
            await newAgr.save({ session });

            processedNewSourcing.push({
              sourceType: 'REGISTRY_DEED',
              agreementId: newAgr._id,
              agreementNumber: newAgr.agreementNumber,
              deedId: deed._id,
              deedNumber: deed.deedNumber,
              mauja: newAgr.mauja,
              khataNumber: newAgr.khataNumber,
              khesraNumber: newAgr.khesraNumber,
              allocatedSqFt: newSqFt,
              allocatedDismil: Math.round((newSqFt / 435.6) * 1000) / 1000,
            });
          } else {
            if ((newAgr.unregisteredAvailableSqFt || 0) < newSqFt) {
              throw ApiError.badRequest(`Insufficient stock in Agreement ${newAgr.agreementNumber}. Available: ${newAgr.unregisteredAvailableSqFt} SqFt, Requested: ${newSqFt} SqFt`);
            }
            newAgr.unregisteredAllocatedSqFt = (newAgr.unregisteredAllocatedSqFt || 0) + newSqFt;
            newAgr.unregisteredAvailableSqFt = Math.max(0, newAgr.unregisteredAgreedSqFt - newAgr.unregisteredAllocatedSqFt);
            newAgr.totalAllocatedSqFt = (newAgr.totalAllocatedSqFt || 0) + newSqFt;
            newAgr.totalAvailableSqFt = Math.max(0, newAgr.totalSqFt - newAgr.totalAllocatedSqFt);
            await newAgr.save({ session });

            processedNewSourcing.push({
              sourceType: 'AGREEMENT',
              agreementId: newAgr._id,
              agreementNumber: newAgr.agreementNumber,
              deedId: null,
              deedNumber: '',
              mauja: newAgr.mauja,
              khataNumber: newAgr.khataNumber,
              khesraNumber: newAgr.khesraNumber,
              allocatedSqFt: newSqFt,
              allocatedDismil: Math.round((newSqFt / 435.6) * 1000) / 1000,
            });
          }

          await new LandStockLedger({
            agreementId: newAgr._id,
            sourceType: newSrc.sourceType,
            deedId: newSrc.deedId || null,
            deedNumber: newSrc.deedNumber || '',
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            customerName: booking.customerName || '',
            plotNumber: plot.plotNumber || '',
            transactionType: 'BOOKING_RESTRUCTURING_DELTA',
            entryType: 'DEBIT',
            dismil: Math.round((newSqFt / 435.6) * 1000) / 1000,
            sqFt: newSqFt,
            runningAvailableSqFt: newAgr.totalAvailableSqFt,
            date: new Date(),
            remarks: `Allocated ${newSqFt} SqFt in Restructuring for Booking #${booking.bookingNumber}`,
            performedBy: userId,
          }).save({ session });
        }

        newLandSourcing = processedNewSourcing;
      }

      let newDpAmt = 0;
      let newEmiPrincipal = 0;
      let newEmiMonthly = 0;

      if (newTenureMonths === 0) {
        newDpAmt = newNetContractValue;
        newEmiPrincipal = 0;
        newEmiMonthly = 0;
      } else {
        const dpPercent = slab.downpaymentPercent ? slab.downpaymentPercent / 100 : 0.40;
        if (newDpBase === 'BEFORE_DISCOUNT') {
          newDpAmt = Math.round(newPlotValue * dpPercent);
          newEmiPrincipal = Math.max(0, newNetContractValue - newDpAmt);
        } else {
          newDpAmt = Math.round(newNetContractValue * dpPercent);
          newEmiPrincipal = newNetContractValue - newDpAmt;
        }
        newEmiMonthly = newTenureMonths > 0 ? Math.round(newEmiPrincipal / newTenureMonths) : 0;
      }

      const resolvedScheme = newTenureMonths === 0 ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT';
      booking.plotValue = newPlotValue;
      booking.discount = newDiscount;
      booking.tenureMonths = newTenureMonths;
      booking.scheme = resolvedScheme;
      booking.basePlotRate = basePlotRate;
      booking.promoterCommissionPercent = slab.promoterCommissionPercent;
      booking.developerCommissionPercent = slab.developerCommissionPercent;
      booking.downpaymentAmount = newDpAmt;
      booking.emiPrincipalAmount = newEmiPrincipal;
      booking.emiMonthlyAmount = newEmiMonthly;
      booking.downpaymentCalculationBase = newDpBase;
      booking.landSourcing = newLandSourcing;
      if (newTenureMonths === 0) booking.oneTimeMonths = newOneTimeMonths;
      booking.revisionCount = (booking.revisionCount || 0) + 1;
      booking.remainingAmount = Math.max(0, newNetContractValue - totalPaidSoFar);

      await booking.save({ session });

      const paidInstallments = existingInstallments.filter((i) => i.status === 'PAID');
      const unpaidInstallments = existingInstallments.filter((i) => i.status !== 'PAID');

      for (const unp of unpaidInstallments) {
        await unp.deleteOne({ session });
      }

      const remainingBalanceToSchedule = Math.max(0, newNetContractValue - totalPaidSoFar);

      if (remainingBalanceToSchedule > 0) {
        const remainingMonths = Math.max(1, newTenureMonths - paidInstCount);
        const newInstallmentsToInsert = [];
        let principalDist = remainingBalanceToSchedule;

        const startIdx = paidInstCount + 1;
        for (let i = 1; i <= remainingMonths; i++) {
          const instNum = paidInstCount === 0 && newTenureMonths > 0 && i === 1 && newDpAmt > totalPaidSoFar ? 0 : startIdx + i - 1;
          const dueDate = new Date(booking.bookingDate);
          const dpMonths = Number(booking.downpaymentMonths) || 1;
          if (instNum === 0) {
            dueDate.setMonth(dueDate.getMonth() + dpMonths);
          } else {
            dueDate.setMonth(dueDate.getMonth() + dpMonths + (instNum - 1) + 1);
            dueDate.setDate(1);
            dueDate.setHours(0, 0, 0, 0);
          }

          let dueAmt = 0;
          if (i === remainingMonths) {
            dueAmt = Math.round(principalDist * 100) / 100;
          } else {
            dueAmt = Math.floor(remainingBalanceToSchedule / remainingMonths);
            dueAmt = Math.min(dueAmt, principalDist);
          }
          dueAmt = Math.round(dueAmt * 100) / 100;
          principalDist -= dueAmt;

          if (dueAmt > 0) {
            newInstallmentsToInsert.push({
              installmentNumber: instNum,
              bookingId: booking._id,
              dueDate,
              dueAmount: dueAmt,
              paidAmount: 0,
              status: 'PENDING',
            });
          }
        }
        if (newInstallmentsToInsert.length > 0) {
          await PlotInstallment.insertMany(newInstallmentsToInsert, { session });
        }
      }

      await plotDeveloperService.syncBookingSponsorCommissions(booking._id, session);

      const customerAfter = await PlotCustomer.findById(booking.customerId).session(session);
      const sponsorAfter = booking.sponsorId ? await User.findById(booking.sponsorId).session(session) : null;

      const newSnapshot = {
        customerId: booking.customerId,
        customerName: customerAfter?.name || booking.customerName || 'N/A',
        customerMobile: customerAfter?.mobile || booking.customerMobile || '',
        sponsorId: booking.sponsorId || null,
        sponsorName: sponsorAfter?.name || 'Direct / Company',
        plotId: booking.plotId,
        plotNumber: plot?.plotNumber || '',
        plotSize: newPlotSize,
        scheme: resolvedScheme,
        tenureMonths: newTenureMonths,
        basePlotRate,
        effectiveRate: Math.round(effectiveSqFtRate),
        govtRate: booking.govtRate || 100,
        plotValue: newPlotValue,
        discount: newDiscount,
        remainingAmount: booking.remainingAmount,
        downpaymentAmount: newDpAmt,
        downpaymentMonths: booking.downpaymentMonths || 1,
        oneTimeMonths: booking.oneTimeMonths || 1,
        emiMonthlyAmount: newEmiMonthly,
        promoterCommissionPercent: slab.promoterCommissionPercent,
        developerCommissionPercent: slab.developerCommissionPercent,
        agreementNumber: booking.agreementNumber || '',
        bookingDate: booking.bookingDate,
        bookingType: booking.bookingType || (booking.status === 'HOLD' ? 'HOLD' : 'BOOKING'),
        status: booking.status,
        paymentMode: booking.paymentMode || 'cash',
        transactionReference: booking.transactionReference || '',
        landSourcing: newLandSourcing,
        paidInstallmentsCount: paidInstCount,
        totalPaidAmount: totalPaidSoFar,
      };

      const changedFields = [];
      const fieldLabels = {
        customerName: 'Customer Name',
        plotNumber: 'Plot Number',
        plotSize: 'Plot Area (Sq.Ft.)',
        tenureMonths: 'Tenure / Scheme (Months)',
        basePlotRate: 'Base Rate (₹/SqFt)',
        effectiveRate: 'Effective Rate (₹/SqFt)',
        plotValue: 'Gross Plot Value',
        discount: 'Discount Applied',
        remainingAmount: 'Remaining / Outstanding Amount',
        downpaymentAmount: 'Downpayment Amount',
        downpaymentMonths: 'Downpayment Grace Period',
        oneTimeMonths: 'Payment Time Limit',
        emiMonthlyAmount: 'Monthly EMI Amount',
        promoterCommissionPercent: 'Promoter Commission %',
        developerCommissionPercent: 'Developer Commission %',
        agreementNumber: 'Agreement Number',
        bookingDate: 'Booking Date',
        bookingType: 'Booking Type',
        status: 'Status',
        paymentMode: 'Payment Mode',
        transactionReference: 'Transaction Reference',
        sponsorName: 'Sponsor / Promoter',
      };

      for (const [key, label] of Object.entries(fieldLabels)) {
        let oldVal = previousSnapshot[key];
        let newVal = newSnapshot[key];

        if (key === 'bookingDate') {
          oldVal = oldVal ? new Date(oldVal).toISOString().split('T')[0] : '';
          newVal = newVal ? new Date(newVal).toISOString().split('T')[0] : '';
        }

        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          changedFields.push({
            field: key,
            label,
            oldValue: previousSnapshot[key],
            newValue: newSnapshot[key],
          });
        }
      }

      let systemLog = '';
      if (changedFields.length > 0) {
        systemLog = changedFields.map(f => `• ${f.label}: "${f.oldValue ?? 'None'}" → "${f.newValue ?? 'None'}"`).join('\n');
      } else {
        systemLog = '• Contract terms restructured with no detected field discrepancies.';
      }

      const userNarration = (updateData.adminNarration || updateData.reason || '').trim();
      const primaryReason = userNarration || (changedFields.length > 0 ? `Updated: ${changedFields.map(f => f.label).join(', ')}` : 'Terms restructured');

      const revision = new PlotBookingRevision({
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        revisionNumber: booking.revisionCount,
        revisionDate: new Date(),
        reason: primaryReason,
        adminNarration: userNarration,
        systemLog,
        previousSnapshot,
        newSnapshot,
        changedFields,
        deltas: {
          deltaPlotSize: deltaSqFt,
          deltaPlotValue: newPlotValue - previousSnapshot.plotValue,
          deltaDiscount: newDiscount - previousSnapshot.discount,
          deltaRemainingAmount: booking.remainingAmount - previousSnapshot.remainingAmount,
          deltaEmiMonthlyAmount: newEmiMonthly - previousSnapshot.emiMonthlyAmount,
          deltaDownpaymentAmount: newDpAmt - previousSnapshot.downpaymentAmount,
          deltaPromoterCommissionPercent: (slab.promoterCommissionPercent || 0) - (previousSnapshot.promoterCommissionPercent || 0),
        },
        editedBy: userId,
      });
      await revision.save({ session });

      await new PlotAuditLog({
        action: 'RESTRUCTURE_BOOKING',
        modelName: 'PlotBooking',
        documentId: booking._id,
        userId,
        details: { revisionNumber: booking.revisionCount, reason: primaryReason, deltas: revision.deltas },
      }).save({ session });

      await session.commitTransaction();
      return { booking, revision };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // ── CUSTOMER PLOT REFUND & CANCELLATION REIMBURSEMENT ──────────────
  async processCustomerRefund(bookingId, refundData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');
      if (booking.status === 'CANCELLED') {
        throw ApiError.badRequest('Booking is already cancelled');
      }

      const { deductionAmount = 0, paymentMode = 'BANK_TRANSFER', transactionReference = '', remarks = '', refundDate = new Date() } = refundData;

      const receipts = await PlotReceipt.find({ bookingId: booking._id, status: 'APPROVED' }).session(session);
      const totalCollected = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

      const numDeduction = Number(deductionAmount) || 0;
      const netRefund = Math.max(0, totalCollected - numDeduction);

      if (Array.isArray(booking.landSourcing) && booking.landSourcing.length > 0) {
        for (const src of booking.landSourcing) {
          const numSqFt = Number(src.allocatedSqFt) || 0;
          if (numSqFt <= 0) continue;

          const agr = await KisanLandAgreement.findById(src.agreementId).session(session);
          if (agr) {
            if (src.sourceType === 'REGISTRY_DEED') {
              const deed = agr.registryDeeds.find((d) => String(d._id) === String(src.deedId) || d.deedNumber === src.deedNumber);
              if (deed) {
                deed.allocatedSqFt = Math.max(0, (deed.allocatedSqFt || 0) - numSqFt);
                deed.availableSqFt = Math.max(0, deed.registeredSqFt - deed.allocatedSqFt);
                deed.status = 'ACTIVE';
              }
            } else {
              agr.unregisteredAllocatedSqFt = Math.max(0, (agr.unregisteredAllocatedSqFt || 0) - numSqFt);
              agr.unregisteredAvailableSqFt = Math.max(0, agr.unregisteredAgreedSqFt - agr.unregisteredAllocatedSqFt);
            }
            agr.totalAllocatedSqFt = Math.max(0, (agr.totalAllocatedSqFt || 0) - numSqFt);
            agr.totalAvailableSqFt = Math.max(0, agr.totalSqFt - agr.totalAllocatedSqFt);
            await agr.save({ session });

            await new LandStockLedger({
              agreementId: agr._id,
              sourceType: src.sourceType,
              deedId: src.deedId || null,
              deedNumber: src.deedNumber || '',
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              transactionType: 'BOOKING_CANCELLATION_RESTORE',
              entryType: 'CREDIT',
              dismil: src.allocatedDismil || Math.round((numSqFt / 435.6) * 1000) / 1000,
              sqFt: numSqFt,
              runningAvailableSqFt: agr.totalAvailableSqFt,
              date: new Date(refundDate),
              remarks: `Restored ${numSqFt} SqFt due to Customer Refund & Cancellation of Booking #${booking.bookingNumber}`,
              performedBy: userId,
            }).save({ session });
          }
        }
      }

      await Plot.findByIdAndUpdate(booking.plotId, { status: 'AVAILABLE' }).session(session);

      await PlotSponsorCommission.updateMany(
        { bookingId: booking._id },
        { $set: { status: 'reversed' } }
      ).session(session);

      booking.status = 'CANCELLED';
      booking.refundStatus = 'PROCESSED';
      booking.refundAmount = netRefund;
      booking.refundDeduction = numDeduction;
      booking.refundDate = new Date(refundDate);
      await booking.save({ session });

      let createdVoucher = null;
      try {
        const fyStr = `${new Date().getFullYear().toString().slice(-2)}${(new Date().getFullYear() + 1).toString().slice(-2)}`;
        const vCounter = await Counter.findByIdAndUpdate(
          `VOUCHER_FY_${fyStr}`,
          { $inc: { sequence: 1 } },
          { new: true, upsert: true, session }
        );
        const voucherNumber = `VCH-${fyStr}-${String(vCounter.sequence).padStart(4, '0')}`;

        createdVoucher = new Voucher({
          voucherNumber,
          voucherType: 'EXPENSE',
          category: 'Plot Cancellation Refund',
          amount: netRefund,
          paymentMode,
          transactionReference,
          remarks: `Refund for Cancelled Plot Booking #${booking.bookingNumber}. Total Paid: ₹${totalCollected}, Deductions: ₹${numDeduction}, Net Refund: ₹${netRefund}. ${remarks}`,
          date: new Date(refundDate),
          status: 'APPROVED',
          createdBy: userId,
        });
        await createdVoucher.save({ session });
        booking.refundVoucherId = createdVoucher._id;
        await booking.save({ session });
      } catch (vErr) {
        console.warn('[CustomerRefund] Optional voucher generation skipped:', vErr.message);
      }

      await new PlotAuditLog({
        action: 'PROCESS_CUSTOMER_REFUND',
        modelName: 'PlotBooking',
        documentId: booking._id,
        userId,
        details: { totalCollected, deductionAmount: numDeduction, netRefund, paymentMode },
      }).save({ session });

      await session.commitTransaction();
      return { booking, totalCollected, netRefund, voucher: createdVoucher };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // ── GET BOOKING REVISIONS ──────────────────────────────────────────
  async getBookingRevisions(bookingId) {
    return PlotBookingRevision.find({ bookingId })
      .populate('editedBy', 'name email')
      .sort({ revisionNumber: -1 })
      .lean();
  }

  // ── UPDATE REVISION NARRATION ──────────────────────────────────────────
  async updateBookingRevisionNarration(revisionId, adminNarration, userId) {
    const revision = await PlotBookingRevision.findById(revisionId);
    if (!revision) throw ApiError.notFound('Revision record not found');

    revision.adminNarration = (adminNarration || '').trim();
    if (!revision.reason || revision.reason.trim() === '') {
      revision.reason = revision.adminNarration || 'Admin updated narration';
    }
    await revision.save();
    return revision;
  }

  // ── AUTO-EXPIRY FOR HOLDS ───────────────────────────────────────
  async expireHoldBookings() {
    const expiredHolds = await PlotBooking.find({
      status: 'HOLD',
      holdExpiryDate: { $lte: new Date() },
    });

    console.log(`[PlotHoldCron] Found ${expiredHolds.length} expired hold bookings.`);

    for (const hold of expiredHolds) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        hold.status = 'CANCELLED';
        await hold.save({ session });

        await Plot.findByIdAndUpdate(hold.plotId, { status: 'AVAILABLE' }).session(session);

        await new PlotAuditLog({
          action: 'HOLD_EXPIRED',
          modelName: 'PlotBooking',
          documentId: hold._id,
          userId: hold.customerId,
          details: { plotId: hold.plotId, expiredDate: hold.holdExpiryDate },
        }).save({ session });

        await session.commitTransaction();
        console.log(`[PlotHoldCron] Expired hold booking ${hold.bookingNumber} successfully.`);
      } catch (error) {
        await session.abortTransaction();
        console.error(`[PlotHoldCron] Failed to expire hold booking ${hold.bookingNumber}:`, error);
      } finally {
        session.endSession();
      }
    }
  }

  // ── BOOKING QUERY, UPDATE & DELETE ─────────────────────────────
  async getBookings(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.scheme) query.scheme = filters.scheme;
    if (filters.customerId) query.customerId = filters.customerId;

    if (filters.sponsorId) {
      const subSponsors = await User.find({ sponsorId: filters.sponsorId }).select('_id').lean();
      const subSponsorIds = subSponsors.map(s => s._id);
      query.$or = [
        { sponsorId: filters.sponsorId },
        ...(subSponsorIds.length > 0 ? [{ sponsorId: { $in: subSponsorIds } }] : [])
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      PlotBooking.find(query)
        .populate('customerId', 'name mobile customerId')
        .populate({
          path: 'sponsorId',
          select: 'name sponsorCode customerId mobile sponsorId',
          populate: { path: 'sponsorId', select: 'name sponsorCode customerId mobile' }
        })
        .populate({
          path: 'plotId',
          populate: { path: 'seriesId' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PlotBooking.countDocuments(query),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getBookingById(id) {
    const plotCollectionService = require('./plotCollection.service');
    await plotCollectionService.rebuildBookingInstallmentsState(id);
    const booking = await PlotBooking.findById(id)
      .populate('customerId', 'name mobile email customerId address fatherOrHusbandName relationType gender age nominee')
      .populate('sponsorId', 'name customerId mobile address')
      .populate({
        path: 'plotId',
        populate: { path: 'seriesId' }
      });
    if (!booking) throw ApiError.notFound('Booking not found');
    return booking;
  }

  async updateBooking(id, data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(id).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      const plotBefore = await Plot.findById(booking.plotId).session(session);
      const customerBefore = await PlotCustomer.findById(booking.customerId).session(session);
      const sponsorBefore = booking.sponsorId ? await User.findById(booking.sponsorId).session(session) : null;
      const existingInstallments = await PlotInstallment.find({ bookingId: id }).session(session);
      const paidInstCount = existingInstallments.filter((i) => i.status === 'PAID').length;
      const receiptsBefore = await PlotReceipt.find({ bookingId: id, status: 'APPROVED' }).session(session);
      const totalPaidSoFar = receiptsBefore.reduce((sum, r) => sum + (r.amount || 0), 0);

      const prevRateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session);
      const prevCornerExtra = plotBefore?.plotType === 'CORNER' ? (prevRateConfig?.cornerExtraPercent || 20) : 0;
      const prevBaseRate = booking.basePlotRate || 1000;
      const prevEffectiveRate = Math.round(prevBaseRate * (1 + prevCornerExtra / 100));

      const previousSnapshot = {
        customerId: booking.customerId,
        customerName: customerBefore?.name || booking.customerName || 'N/A',
        customerMobile: customerBefore?.mobile || booking.customerMobile || '',
        sponsorId: booking.sponsorId || null,
        sponsorName: sponsorBefore?.name || 'Direct / Company',
        plotId: booking.plotId,
        plotNumber: plotBefore?.plotNumber || '',
        plotSize: plotBefore ? (plotBefore.plotSize || plotBefore.area || plotBefore.areaSqFt || 0) : 0,
        scheme: booking.scheme,
        tenureMonths: booking.tenureMonths,
        basePlotRate: prevBaseRate,
        effectiveRate: prevEffectiveRate,
        govtRate: booking.govtRate || 100,
        plotValue: booking.plotValue,
        discount: booking.discount || 0,
        remainingAmount: booking.remainingAmount,
        downpaymentAmount: booking.bookingAmount || booking.downpaymentAmount || 0,
        downpaymentMonths: booking.downpaymentMonths || 3,
        downpaymentDays: booking.downpaymentDays || 90,
        oneTimeMonths: booking.oneTimeMonths || 1,
        emiMonthlyAmount: booking.emiMonthlyAmount || 0,
        promoterCommissionPercent: booking.promoterCommissionPercent || 0,
        developerCommissionPercent: booking.developerCommissionPercent || 0,
        agreementNumber: booking.agreementNumber || '',
        bookingDate: booking.bookingDate,
        bookingType: booking.bookingType || (booking.status === 'HOLD' ? 'HOLD' : 'BOOKING'),
        status: booking.status,
        paymentMode: booking.paymentMode || 'cash',
        transactionReference: booking.transactionReference || '',
        landSourcing: JSON.parse(JSON.stringify(booking.landSourcing || [])),
        paidInstallmentsCount: paidInstCount,
        totalPaidAmount: totalPaidSoFar,
      };

      const {
        notes, discount, bookingAmount, bookingDate, sponsorId, status, scheme,
        tenureMonths, govtRate,
        installmentCount, installmentAmount, oneTimeMonths, downpaymentMonths, downpaymentDays, agreementNumber,
        bookingType, holdExpiryDays, customerId, plotId, paymentMode, transactionReference,
        landSourcing,
        customSqFtRate, basePlotRate, customDownpaymentRate, downpaymentRate, emiRate,
        emiFrequency, discountType, discountValue, downpaymentAmount, emiMonthlyAmount
      } = data;

      if (notes !== undefined) booking.notes = notes;
      if (agreementNumber !== undefined) booking.agreementNumber = agreementNumber;
      if (paymentMode !== undefined) booking.paymentMode = paymentMode;
      if (transactionReference !== undefined) booking.transactionReference = transactionReference;
      if (govtRate !== undefined) booking.govtRate = Number(govtRate) || 100;
      if (emiFrequency !== undefined) booking.emiFrequency = emiFrequency;
      if (installmentCount !== undefined) booking.installmentCount = Number(installmentCount) || 0;
      if (discountType !== undefined) booking.discountType = discountType;
      if (discountValue !== undefined) booking.discountValue = Number(discountValue) || 0;
      if (downpaymentDays !== undefined) {
        booking.downpaymentDays = Number(downpaymentDays) || 90;
        booking.downpaymentMonths = Math.max(1, Math.round(booking.downpaymentDays / 30));
      } else if (downpaymentMonths !== undefined) {
        booking.downpaymentMonths = Number(downpaymentMonths) || 3;
        booking.downpaymentDays = booking.downpaymentMonths * 30;
      }

      if (Array.isArray(landSourcing) && landSourcing.length > 0) {
        const oldSourcing = Array.isArray(booking.landSourcing) ? booking.landSourcing : [];

        for (const oldSrc of oldSourcing) {
          const oldSqFt = Number(oldSrc.allocatedSqFt) || 0;
          if (oldSqFt <= 0) continue;

          const oldAgr = await KisanLandAgreement.findById(oldSrc.agreementId).session(session);
          if (oldAgr) {
            if (oldSrc.sourceType === 'REGISTRY_DEED') {
              const deed = oldAgr.registryDeeds.find((d) => String(d._id) === String(oldSrc.deedId) || d.deedNumber === oldSrc.deedNumber);
              if (deed) {
                deed.allocatedSqFt = Math.max(0, (deed.allocatedSqFt || 0) - oldSqFt);
                deed.availableSqFt = Math.max(0, deed.registeredSqFt - deed.allocatedSqFt);
                deed.status = 'ACTIVE';
              }
            } else {
              oldAgr.unregisteredAllocatedSqFt = Math.max(0, (oldAgr.unregisteredAllocatedSqFt || 0) - oldSqFt);
              oldAgr.unregisteredAvailableSqFt = Math.max(0, oldAgr.unregisteredAgreedSqFt - oldAgr.unregisteredAllocatedSqFt);
            }
            oldAgr.totalAllocatedSqFt = Math.max(0, (oldAgr.totalAllocatedSqFt || 0) - oldSqFt);
            oldAgr.totalAvailableSqFt = Math.max(0, oldAgr.totalSqFt - oldAgr.totalAllocatedSqFt);
            await oldAgr.save({ session });

            await new LandStockLedger({
              agreementId: oldAgr._id,
              sourceType: oldSrc.sourceType,
              deedId: oldSrc.deedId || null,
              deedNumber: oldSrc.deedNumber || '',
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              customerName: booking.customerName || '',
              plotNumber: booking.plotId?.plotNumber || '',
              transactionType: 'MANUAL_ADJUSTMENT',
              entryType: 'CREDIT',
              dismil: oldSrc.allocatedDismil || Math.round((oldSqFt / 435.6) * 1000) / 1000,
              sqFt: oldSqFt,
              runningAvailableSqFt: oldAgr.totalAvailableSqFt,
              date: new Date(),
              remarks: `Released ${oldSqFt} SqFt previous allocation during contract edit for Booking #${booking.bookingNumber}`,
              performedBy: userId,
            }).save({ session });
          }
        }

        const processedNewSourcing = [];
        for (const newSrc of landSourcing) {
          const newSqFt = Number(newSrc.allocatedSqFt) || 0;
          if (newSqFt <= 0) continue;

          const newAgr = await KisanLandAgreement.findById(newSrc.agreementId).session(session);
          if (!newAgr) throw ApiError.badRequest(`Land Agreement ${newSrc.agreementId} not found`);

          if (newSrc.sourceType === 'REGISTRY_DEED') {
            const deed = newAgr.registryDeeds.find((d) => String(d._id) === String(newSrc.deedId) || d.deedNumber === newSrc.deedNumber);
            if (!deed) throw ApiError.badRequest(`Registry Deed ${newSrc.deedNumber} not found in Agreement ${newAgr.agreementNumber}`);
            if ((deed.availableSqFt || 0) < newSqFt) {
              throw ApiError.badRequest(`Insufficient stock in Registry Deed ${deed.deedNumber}. Available: ${deed.availableSqFt} SqFt, Requested: ${newSqFt} SqFt`);
            }
            deed.allocatedSqFt = (deed.allocatedSqFt || 0) + newSqFt;
            deed.availableSqFt = Math.max(0, deed.registeredSqFt - deed.allocatedSqFt);
            if (deed.availableSqFt <= 0) deed.status = 'FULLY_ALLOCATED';

            newAgr.totalAllocatedSqFt = (newAgr.totalAllocatedSqFt || 0) + newSqFt;
            newAgr.totalAvailableSqFt = Math.max(0, newAgr.totalSqFt - newAgr.totalAllocatedSqFt);
            await newAgr.save({ session });

            processedNewSourcing.push({
              sourceType: 'REGISTRY_DEED',
              agreementId: newAgr._id,
              agreementNumber: newAgr.agreementNumber,
              deedId: deed._id,
              deedNumber: deed.deedNumber,
              mauja: newAgr.mauja,
              khataNumber: newAgr.khataNumber,
              khesraNumber: newAgr.khesraNumber,
              allocatedSqFt: newSqFt,
              allocatedDismil: Math.round((newSqFt / 435.6) * 1000) / 1000,
            });
          } else {
            if ((newAgr.unregisteredAvailableSqFt || 0) < newSqFt) {
              throw ApiError.badRequest(`Insufficient stock in Agreement ${newAgr.agreementNumber}. Available: ${newAgr.unregisteredAvailableSqFt} SqFt, Requested: ${newSqFt} SqFt`);
            }
            newAgr.unregisteredAllocatedSqFt = (newAgr.unregisteredAllocatedSqFt || 0) + newSqFt;
            newAgr.unregisteredAvailableSqFt = Math.max(0, newAgr.unregisteredAgreedSqFt - newAgr.unregisteredAllocatedSqFt);
            newAgr.totalAllocatedSqFt = (newAgr.totalAllocatedSqFt || 0) + newSqFt;
            newAgr.totalAvailableSqFt = Math.max(0, newAgr.totalSqFt - newAgr.totalAllocatedSqFt);
            await newAgr.save({ session });

            processedNewSourcing.push({
              sourceType: 'AGREEMENT',
              agreementId: newAgr._id,
              agreementNumber: newAgr.agreementNumber,
              deedId: null,
              deedNumber: '',
              mauja: newAgr.mauja,
              khataNumber: newAgr.khataNumber,
              khesraNumber: newAgr.khesraNumber,
              allocatedSqFt: newSqFt,
              allocatedDismil: Math.round((newSqFt / 435.6) * 1000) / 1000,
            });
          }

          await new LandStockLedger({
            agreementId: newAgr._id,
            sourceType: newSrc.sourceType,
            deedId: newSrc.deedId || null,
            deedNumber: newSrc.deedNumber || '',
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            customerName: booking.customerName || '',
            plotNumber: booking.plotId?.plotNumber || '',
            transactionType: 'MANUAL_ADJUSTMENT',
            entryType: 'DEBIT',
            dismil: Math.round((newSqFt / 435.6) * 1000) / 1000,
            sqFt: newSqFt,
            runningAvailableSqFt: newAgr.totalAvailableSqFt,
            date: new Date(),
            remarks: `Applied ${newSqFt} SqFt allocation during contract edit for Booking #${booking.bookingNumber}`,
            performedBy: userId,
          }).save({ session });
        }

        booking.landSourcing = processedNewSourcing;
      }

      if (bookingType !== undefined) {
        booking.bookingType = bookingType;
        if (bookingType === 'HOLD') {
          const expDays = Number(holdExpiryDays) || 7;
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + expDays);
          booking.holdExpiryDate = expiryDate;
          booking.status = 'HOLD';
        }
      }

      if (customerId !== undefined && customerId && String(customerId) !== String(booking.customerId)) {
        booking.customerId = customerId;
      }

      if (plotId !== undefined && plotId && String(plotId) !== String(booking.plotId)) {
        const oldPlot = await Plot.findById(booking.plotId).session(session);
        if (oldPlot) {
          oldPlot.status = 'AVAILABLE';
          await oldPlot.save({ session });
        }
        booking.plotId = plotId;
        const newPlot = await Plot.findById(plotId).session(session);
        if (newPlot) {
          newPlot.status = (booking.status === 'HOLD' || booking.bookingType === 'HOLD') ? 'HOLD' : 'BOOKED';
          booking.plotValue = newPlot.totalPlotValue || (newPlot.plotSize * newPlot.effectiveRate);
          await newPlot.save({ session });
        }
      }

      let installmentParamsChanged = false;
      const newBaseRate = customSqFtRate !== undefined ? Number(customSqFtRate) : basePlotRate !== undefined ? Number(basePlotRate) : undefined;
      const newDpRate = customDownpaymentRate !== undefined ? Number(customDownpaymentRate) : downpaymentRate !== undefined ? Number(downpaymentRate) : undefined;

      if (tenureMonths !== undefined || newBaseRate !== undefined) {
        const resolvedTenure = tenureMonths !== undefined ? Number(tenureMonths) : booking.tenureMonths;
        const tenureChanged = Number(resolvedTenure) !== Number(booking.tenureMonths);
        booking.tenureMonths = resolvedTenure;
        booking.scheme = resolvedTenure === 0 ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT';
        
        const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session);
        const slabs = rateConfig?.rateSlabs?.length > 0 ? rateConfig.rateSlabs : PlotRateConfiguration.getDefaultRateSlabs();
        const slab = slabs.find(s => Number(s.tenureMonths) === resolvedTenure) || slabs[0];

        const plot = await Plot.findById(booking.plotId).session(session);
        const plotArea = plot ? (plot.plotSize || plot.area || plot.areaSqFt || 0) : 0;
        const totalPremium = plotConfigService.calculatePlotTotalPremiumPercent(plot, rateConfig);
        
        const finalBaseRate = newBaseRate !== undefined ? newBaseRate : (tenureChanged ? (slab.plotRate || rateConfig?.baseSqFtRate || 1000) : (booking.basePlotRate || 1000));
        const effectiveRate = finalBaseRate * (1 + totalPremium / 100);

        booking.basePlotRate = finalBaseRate;
        if (newDpRate !== undefined) {
          booking.downpaymentRate = newDpRate;
        } else if (tenureChanged) {
          booking.downpaymentRate = slab.downpaymentRate || (resolvedTenure === 0 ? finalBaseRate : 500);
        }

        if (emiRate !== undefined) {
          booking.emiRate = Number(emiRate) || 0;
        }

        booking.promoterCommissionPercent = 5.0;
        booking.developerCommissionPercent = 2.0;
        if (plotArea > 0) {
          booking.plotValue = Math.round(plotArea * effectiveRate);
        }

        installmentParamsChanged = true;
      } else if (scheme !== undefined && scheme !== booking.scheme) {
        booking.scheme = scheme;
        installmentParamsChanged = true;
      }

      if (newDpRate !== undefined && newDpRate !== booking.downpaymentRate) {
        booking.downpaymentRate = newDpRate;
        installmentParamsChanged = true;
      }

      if (oneTimeMonths !== undefined && Number(oneTimeMonths) !== booking.oneTimeMonths) {
        booking.oneTimeMonths = Number(oneTimeMonths) || 1;
        installmentParamsChanged = true;
      }

      if (bookingDate !== undefined) {
        const newDateObj = new Date(bookingDate);
        if (newDateObj.getTime() !== new Date(booking.bookingDate).getTime()) {
          booking.bookingDate = newDateObj;
          installmentParamsChanged = true;
        }
      }

      if (sponsorId !== undefined) {
        booking.sponsorId = sponsorId || null;
        await PlotSponsorCommission.updateMany(
          { bookingId: id },
          { $set: { sponsorId: booking.sponsorId } }
        ).session(session);
      }

      if (status !== undefined && status !== booking.status) {
        booking.status = status;
        const plot = await Plot.findById(booking.plotId).session(session);
        if (plot) {
          if (status === 'CANCELLED') {
            plot.status = 'AVAILABLE';
          } else if (status === 'HOLD') {
            plot.status = 'HOLD';
          } else if (status === 'ACTIVE' || status === 'COMPLETED') {
            plot.status = 'BOOKED';
          }
          await plot.save({ session });
        }
      }

      let amountChanged = false;
      if (discount !== undefined && Number(discount) !== booking.discount) {
        booking.discount = Number(discount) || 0;
        amountChanged = true;
        installmentParamsChanged = true;
      }
      if (bookingAmount !== undefined && Number(bookingAmount) !== booking.bookingAmount) {
        booking.bookingAmount = Number(bookingAmount) || 0;
        amountChanged = true;
        installmentParamsChanged = true;
      }

      const currentPlot = await Plot.findById(booking.plotId).session(session);
      const currentArea = currentPlot ? (currentPlot.plotSize || currentPlot.area || currentPlot.areaSqFt || 0) : 0;
      const discountVal = Number(booking.discount) || 0;

      if (booking.tenureMonths === 0 || booking.scheme === 'FULL_PAYMENT') {
        booking.downpaymentAmount = Math.max(0, (booking.plotValue || 0) - discountVal);
        booking.bookingAmount = booking.downpaymentAmount;
        booking.emiPrincipalAmount = 0;
        booking.emiMonthlyAmount = 0;
        booking.remainingAmount = booking.downpaymentAmount;
      } else {
        if (downpaymentAmount !== undefined && Number(downpaymentAmount) > 0) {
          booking.downpaymentAmount = Number(downpaymentAmount);
        } else {
          const dpPerSqFt = booking.downpaymentRate || 500;
          booking.downpaymentAmount = currentArea > 0 ? Math.round(currentArea * dpPerSqFt) : (booking.downpaymentAmount || 0);
        }
        booking.bookingAmount = booking.downpaymentAmount;
        const grossEmi = Math.max(0, (booking.plotValue || 0) - booking.downpaymentAmount);
        booking.emiPrincipalAmount = Math.max(0, grossEmi - discountVal);

        const emiFreq = booking.emiFrequency || 'MONTHLY';
        const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;
        const count = installmentCount ? Number(installmentCount) : (booking.installmentCount || (booking.tenureMonths ? Math.round(booking.tenureMonths / freqMultiplier) : 6));
        
        booking.emiMonthlyAmount = emiMonthlyAmount ? Number(emiMonthlyAmount) : (count > 0 ? Math.round(booking.emiPrincipalAmount / count) : 0);
        booking.remainingAmount = booking.downpaymentAmount + booking.emiPrincipalAmount;
        if (!booking.emiRate && currentArea > 0) {
          booking.emiRate = Math.round((booking.emiPrincipalAmount / currentArea) * 100) / 100;
        }
      }

      if (amountChanged) {
        const initialPayment = await PlotPayment.findOne({ bookingId: id, status: 'active' }).sort({ createdAt: 1 }).session(session);
        if (initialPayment) {
          initialPayment.amount = booking.bookingAmount;
          await initialPayment.save({ session });
        }

        const initialReceipt = await PlotReceipt.findOne({ bookingId: id, receiptType: 'BOOKING' }).session(session);
        if (initialReceipt) {
          initialReceipt.amount = booking.bookingAmount;
          await initialReceipt.save({ session });
        }
      }

      const emiFreq = booking.emiFrequency || 'MONTHLY';
      const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;
      const targetCount = installmentCount !== undefined ? Number(installmentCount) : (booking.installmentCount || (Number(booking.tenureMonths) ? Math.round(Number(booking.tenureMonths) / freqMultiplier) : undefined));
      const targetAmount = installmentAmount !== undefined ? Number(installmentAmount) : undefined;

      if (installmentParamsChanged || targetCount !== undefined || targetAmount !== undefined) {
        await PlotInstallment.deleteMany({ bookingId: id }).session(session);

        const bookingDateObj = booking.bookingDate || new Date();
        const resolvedDpDays = Number(booking.downpaymentDays) || (Number(booking.downpaymentMonths) ? Number(booking.downpaymentMonths) * 30 : 90);

        if (booking.scheme === 'FULL_PAYMENT') {
          const dueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);
          const installments = [{
            installmentNumber: 1,
            bookingId: booking._id,
            dueDate,
            dueAmount: booking.remainingAmount,
            paidAmount: 0,
            status: 'PENDING',
          }];
          await PlotInstallment.insertMany(installments, { session });
        } else if (booking.scheme === 'MONTHLY_INSTALLMENT') {
          const installments = [];
          const dpDueDate = new Date(bookingDateObj.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);

          if (booking.downpaymentAmount > 0) {
            installments.push({
              installmentNumber: 0,
              bookingId: booking._id,
              dueDate: dpDueDate,
              dueAmount: booking.downpaymentAmount,
              paidAmount: 0,
              status: 'PENDING',
            });
          }

          const count = targetCount !== undefined && targetCount > 0 ? targetCount : (booking.installmentCount || (Number(booking.tenureMonths) ? Math.round(Number(booking.tenureMonths) / freqMultiplier) : 6));
          let principalToDistribute = booking.emiPrincipalAmount;

          for (let i = 1; i <= count; i++) {
            const dueDate = new Date(dpDueDate);
            dueDate.setMonth(dueDate.getMonth() + (i * freqMultiplier));
            dueDate.setDate(1);
            dueDate.setHours(0, 0, 0, 0);

            let dueForThisInst = 0;
            if (i === count) {
              dueForThisInst = Math.round(principalToDistribute * 100) / 100;
            } else {
              dueForThisInst = targetAmount ? targetAmount : (booking.emiMonthlyAmount ? booking.emiMonthlyAmount : Math.floor(booking.emiPrincipalAmount / count));
              dueForThisInst = Math.min(dueForThisInst, principalToDistribute);
            }
            dueForThisInst = Math.round(dueForThisInst * 100) / 100;
            principalToDistribute -= dueForThisInst;

            if (dueForThisInst > 0) {
              installments.push({
                installmentNumber: i,
                bookingId: booking._id,
                dueDate: booking.downpaymentAmount > 0 ? null : dueDate,
                dueAmount: dueForThisInst,
                paidAmount: 0,
                status: 'PENDING',
              });
            }
          }
          if (installments.length > 0) {
            await PlotInstallment.insertMany(installments, { session });
          }
        }
      }

      await booking.save({ session });

      const plotCollectionService = require('./plotCollection.service');
      if (installmentParamsChanged || targetCount !== undefined || targetAmount !== undefined) {
        await plotCollectionService.rebuildBookingInstallmentsState(id, session);
      }

      await plotDeveloperService.syncBookingSponsorCommissions(booking._id, session);

      const plotAfter = await Plot.findById(booking.plotId).session(session);
      const customerAfter = await PlotCustomer.findById(booking.customerId).session(session);
      const sponsorAfter = booking.sponsorId ? await User.findById(booking.sponsorId).session(session) : null;
      const updatedInstallments = await PlotInstallment.find({ bookingId: id }).session(session);
      const updatedPaidCount = updatedInstallments.filter((i) => i.status === 'PAID').length;
      const updatedReceipts = await PlotReceipt.find({ bookingId: id, status: 'APPROVED' }).session(session);
      const updatedTotalPaid = updatedReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

      const postRateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session);
      const postCornerExtra = plotAfter?.plotType === 'CORNER' ? (postRateConfig?.cornerExtraPercent || 20) : 0;
      const postBaseRate = booking.basePlotRate || 1000;
      const postEffectiveRate = Math.round(postBaseRate * (1 + postCornerExtra / 100));

      const newSnapshot = {
        customerId: booking.customerId,
        customerName: customerAfter?.name || booking.customerName || 'N/A',
        customerMobile: customerAfter?.mobile || booking.customerMobile || '',
        sponsorId: booking.sponsorId || null,
        sponsorName: sponsorAfter?.name || 'Direct / Company',
        plotId: booking.plotId,
        plotNumber: plotAfter?.plotNumber || '',
        plotSize: plotAfter ? (plotAfter.plotSize || plotAfter.area || plotAfter.areaSqFt || 0) : 0,
        scheme: booking.scheme,
        tenureMonths: booking.tenureMonths,
        basePlotRate: postBaseRate,
        effectiveRate: postEffectiveRate,
        govtRate: booking.govtRate || 100,
        plotValue: booking.plotValue,
        discount: booking.discount || 0,
        remainingAmount: booking.remainingAmount,
        downpaymentAmount: booking.bookingAmount || booking.downpaymentAmount || 0,
        downpaymentMonths: booking.downpaymentMonths || 3,
        downpaymentDays: booking.downpaymentDays || 90,
        oneTimeMonths: booking.oneTimeMonths || 1,
        emiMonthlyAmount: booking.emiMonthlyAmount || 0,
        promoterCommissionPercent: booking.promoterCommissionPercent || 0,
        developerCommissionPercent: booking.developerCommissionPercent || 0,
        agreementNumber: booking.agreementNumber || '',
        bookingDate: booking.bookingDate,
        bookingType: booking.bookingType || (booking.status === 'HOLD' ? 'HOLD' : 'BOOKING'),
        status: booking.status,
        paymentMode: booking.paymentMode || 'cash',
        transactionReference: booking.transactionReference || '',
        landSourcing: JSON.parse(JSON.stringify(booking.landSourcing || [])),
        paidInstallmentsCount: updatedPaidCount,
        totalPaidAmount: updatedTotalPaid,
      };

      const changedFields = [];
      const fieldLabels = {
        customerName: 'Customer Name',
        plotNumber: 'Plot Number',
        plotSize: 'Plot Area (Sq.Ft.)',
        tenureMonths: 'Tenure / Scheme (Months)',
        basePlotRate: 'Base Rate (₹/SqFt)',
        effectiveRate: 'Effective Rate (₹/SqFt)',
        plotValue: 'Gross Plot Value',
        discount: 'Discount Applied',
        remainingAmount: 'Remaining / Outstanding Amount',
        downpaymentAmount: 'Downpayment Amount',
        downpaymentMonths: 'Downpayment Grace Period',
        oneTimeMonths: 'Payment Time Limit',
        emiMonthlyAmount: 'Monthly EMI Amount',
        promoterCommissionPercent: 'Promoter Commission %',
        developerCommissionPercent: 'Developer Commission %',
        agreementNumber: 'Agreement Number',
        bookingDate: 'Booking Date',
        bookingType: 'Booking Type',
        status: 'Status',
        paymentMode: 'Payment Mode',
        transactionReference: 'Transaction Reference',
        sponsorName: 'Sponsor / Promoter',
      };

      for (const [key, label] of Object.entries(fieldLabels)) {
        let oldVal = previousSnapshot[key];
        let newVal = newSnapshot[key];

        if (key === 'bookingDate') {
          oldVal = oldVal ? new Date(oldVal).toISOString().split('T')[0] : '';
          newVal = newVal ? new Date(newVal).toISOString().split('T')[0] : '';
        }

        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          changedFields.push({
            field: key,
            label,
            oldValue: previousSnapshot[key],
            newValue: newSnapshot[key],
          });
        }
      }

      let systemLog = '';
      if (changedFields.length > 0) {
        systemLog = changedFields.map(f => `• ${f.label}: "${f.oldValue ?? 'None'}" → "${f.newValue ?? 'None'}"`).join('\n');
      } else {
        systemLog = '• Contract saved with no detected field discrepancies.';
      }

      const userNarration = (data.adminNarration || data.reason || '').trim();
      const primaryReason = userNarration || (changedFields.length > 0 ? `Updated: ${changedFields.map(f => f.label).join(', ')}` : 'Contract edited via Edit Booking Contract');

      booking.revisionCount = (booking.revisionCount || 0) + 1;
      await booking.save({ session });

      const revision = new PlotBookingRevision({
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        revisionNumber: booking.revisionCount,
        revisionDate: new Date(),
        reason: primaryReason,
        adminNarration: userNarration,
        systemLog,
        previousSnapshot,
        newSnapshot,
        changedFields,
        deltas: {
          deltaPlotSize: (newSnapshot.plotSize || 0) - (previousSnapshot.plotSize || 0),
          deltaPlotValue: (newSnapshot.plotValue || 0) - (previousSnapshot.plotValue || 0),
          deltaDiscount: (newSnapshot.discount || 0) - (previousSnapshot.discount || 0),
          deltaRemainingAmount: (newSnapshot.remainingAmount || 0) - (previousSnapshot.remainingAmount || 0),
          deltaEmiMonthlyAmount: (newSnapshot.emiMonthlyAmount || 0) - (previousSnapshot.emiMonthlyAmount || 0),
          deltaDownpaymentAmount: (newSnapshot.downpaymentAmount || 0) - (previousSnapshot.downpaymentAmount || 0),
          deltaPromoterCommissionPercent: (newSnapshot.promoterCommissionPercent || 0) - (previousSnapshot.promoterCommissionPercent || 0),
        },
        editedBy: userId,
      });
      await revision.save({ session });

      await new PlotAuditLog({
        action: 'UPDATE_BOOKING',
        modelName: 'PlotBooking',
        documentId: booking._id,
        userId,
        details: { bookingNumber: booking.bookingNumber, revisionNumber: booking.revisionCount, updatedFields: data },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();
      return booking;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async deleteBooking(id, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(id).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      const receiptsCount = await PlotReceipt.countDocuments({ bookingId: id }).session(session);
      const paymentsCount = await PlotPayment.countDocuments({ bookingId: id }).session(session);

      if (receiptsCount > 0 || paymentsCount > 0) {
        throw ApiError.badRequest(
          `Cannot delete booking #${booking.bookingNumber}. There are ${receiptsCount || paymentsCount} collection receipt(s) recorded against this booking. Please delete or reverse all collections first before deleting the booking.`
        );
      }

      if (Array.isArray(booking.landSourcing) && booking.landSourcing.length > 0) {
        for (const src of booking.landSourcing) {
          const numSqFt = Number(src.allocatedSqFt) || 0;
          if (numSqFt <= 0) continue;

          const agr = await KisanLandAgreement.findById(src.agreementId).session(session);
          if (agr) {
            if (src.sourceType === 'REGISTRY_DEED') {
              const deed = agr.registryDeeds.find((d) => String(d._id) === String(src.deedId) || d.deedNumber === src.deedNumber);
              if (deed) {
                deed.allocatedSqFt = Math.max(0, (deed.allocatedSqFt || 0) - numSqFt);
                deed.availableSqFt = Math.max(0, deed.registeredSqFt - deed.allocatedSqFt);
                deed.status = 'ACTIVE';
              }
            } else {
              agr.unregisteredAllocatedSqFt = Math.max(0, (agr.unregisteredAllocatedSqFt || 0) - numSqFt);
              agr.unregisteredAvailableSqFt = Math.max(0, agr.unregisteredAgreedSqFt - agr.unregisteredAllocatedSqFt);
            }
            agr.totalAllocatedSqFt = Math.max(0, (agr.totalAllocatedSqFt || 0) - numSqFt);
            agr.totalAvailableSqFt = Math.max(0, agr.totalSqFt - agr.totalAllocatedSqFt);
            await agr.save({ session });

            await new LandStockLedger({
              agreementId: agr._id,
              sourceType: src.sourceType,
              deedId: src.deedId || null,
              deedNumber: src.deedNumber || '',
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              customerName: booking.customerName || '',
              plotNumber: booking.plotId?.plotNumber || '',
              transactionType: 'BOOKING_CANCELLATION_RESTORE',
              entryType: 'CREDIT',
              dismil: src.allocatedDismil || Math.round((numSqFt / 435.6) * 1000) / 1000,
              sqFt: numSqFt,
              runningAvailableSqFt: agr.totalAvailableSqFt,
              date: new Date(),
              remarks: `Restored ${numSqFt} SqFt due to Deletion of Booking #${booking.bookingNumber}`,
              performedBy: userId,
            }).save({ session });
          }
        }
      }

      await PlotInstallment.deleteMany({ bookingId: id }).session(session);
      await PlotPayoutSchedule.deleteMany({ bookingId: id }).session(session);
      await PlotSponsorCommission.deleteMany({ bookingId: id }).session(session);
      await PlotBookingRevision.deleteMany({ bookingId: id }).session(session);

      if (booking.plotId) {
        await Plot.findByIdAndUpdate(booking.plotId, { status: 'AVAILABLE' }).session(session);
      }

      await PlotBooking.findByIdAndDelete(id).session(session);

      await new PlotAuditLog({
        action: 'DELETE_BOOKING',
        modelName: 'PlotBooking',
        documentId: id,
        userId,
        details: { bookingNumber: booking.bookingNumber, plotId: booking.plotId },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new PlotBookingService();
