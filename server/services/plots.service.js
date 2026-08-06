const mongoose = require('mongoose');
const PlotRateConfiguration = require('../models/PlotRateConfiguration');
const PlotSeriesMaster = require('../models/PlotSeriesMaster');
const Plot = require('../models/Plot');
const PlotBooking = require('../models/PlotBooking');
const PlotInstallment = require('../models/PlotInstallment');
const PlotPayment = require('../models/PlotPayment');
const PlotPayoutSchedule = require('../models/PlotPayoutSchedule');
const PlotReceipt = require('../models/PlotReceipt');
const PlotSponsorCommission = require('../models/PlotSponsorCommission');
const PlotPayoutVoucher = require('../models/PlotPayoutVoucher');
const PlotAuditLog = require('../models/PlotAuditLog');
const Counter = require('../models/Counter');
const User = require('../models/user');
const PlotCustomer = require('../models/PlotCustomer');
const ApiError = require('../utils/apiError');

class PlotsService {
  // ── RATE CONFIGURATION ──────────────────────────────────────────
  async getRateConfig() {
    let config = await PlotRateConfiguration.findOne({ status: 'active' });
    if (!config) {
      config = new PlotRateConfiguration({
        baseSqFtRate: 500,
        cornerExtraPercent: 20,
      });
      await config.save();
    }
    return config;
  }

  async updateRateConfig(data) {
    let config = await PlotRateConfiguration.findOne({ status: 'active' });
    if (!config) {
      config = new PlotRateConfiguration(data);
    } else {
      config.baseSqFtRate = data.baseSqFtRate ?? config.baseSqFtRate;
      config.cornerExtraPercent = data.cornerExtraPercent ?? config.cornerExtraPercent;
    }
    await config.save();
    return config;
  }

  // ── SERIES MASTER & BULK PLOT GENERATION ────────────────────────
  async createSeries(data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name, prefix, startNumber, endNumber, plotArea, defaultPlotType, numberFormat, remarks } = data;

      // Create series master
      const series = new PlotSeriesMaster({
        name,
        prefix,
        startNumber,
        endNumber,
        plotArea,
        defaultPlotType,
        numberFormat,
        remarks,
      });
      await series.save({ session });

      // Get current rate configuration
      const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session) || {
        baseSqFtRate: 500,
        cornerExtraPercent: 20,
      };

      const baseRate = rateConfig.baseSqFtRate;
      const plotsToCreate = [];

      for (let i = startNumber; i <= endNumber; i++) {
        // Format plot number
        let plotNumber = `${prefix}${i}`;
        const match = numberFormat.match(/0+/);
        if (match) {
          const paddedNum = String(i).padStart(match[0].length, '0');
          plotNumber = `${prefix}${paddedNum}`;
        }

        // Calculate rate based on type
        let multiplier = 1;
        if (defaultPlotType === 'CORNER') {
          multiplier = 1 + ((rateConfig.cornerExtraPercent ?? 20) / 100);
        }

        const effectiveRate = baseRate * multiplier;
        const totalPlotValue = plotArea * effectiveRate;

        plotsToCreate.push({
          plotNumber,
          seriesId: series._id,
          sequenceNumber: i,
          plotSize: plotArea,
          plotType: defaultPlotType,
          baseRate,
          effectiveRate,
          totalPlotValue,
          status: 'AVAILABLE',
        });
      }

      await Plot.insertMany(plotsToCreate, { session });

      // Log action
      const log = new PlotAuditLog({
        action: 'CREATE_SERIES',
        modelName: 'PlotSeriesMaster',
        documentId: series._id,
        userId,
        details: { prefix, startNumber, endNumber, plotArea, defaultPlotType },
      });
      await log.save({ session });

      await session.commitTransaction();
      return series;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getSeriesList() {
    return PlotSeriesMaster.find().sort({ createdAt: -1 });
  }

  async getSeriesById(id) {
    const series = await PlotSeriesMaster.findById(id);
    if (!series) throw ApiError.notFound('Series Master not found');
    return series;
  }

  async updateSeries(id, data, userId) {
    const series = await PlotSeriesMaster.findById(id);
    if (!series) throw ApiError.notFound('Series Master not found');

    const oldStart = series.startNumber;
    const oldEnd = series.endNumber;
    const newStart = data.startNumber !== undefined ? Number(data.startNumber) : oldStart;
    const newEnd = data.endNumber !== undefined ? Number(data.endNumber) : oldEnd;

    // If start/end range changed, validate that any plots outside the new range are not booked/held
    if (newStart !== oldStart || newEnd !== oldEnd) {
      const activePlotsOutsideRange = await Plot.find({
        seriesId: id,
        $or: [
          { sequenceNumber: { $lt: newStart } },
          { sequenceNumber: { $gt: newEnd } }
        ],
        status: { $in: ['BOOKED', 'HOLD', 'REGISTERED'] }
      });

      if (activePlotsOutsideRange.length > 0) {
        throw ApiError.badRequest(`Cannot adjust range. Plot(s) ${activePlotsOutsideRange.map(p => p.plotNumber).join(', ')} are booked or on hold.`);
      }

      // Safe to delete plots outside the new range
      await Plot.deleteMany({
        seriesId: id,
        $or: [
          { sequenceNumber: { $lt: newStart } },
          { sequenceNumber: { $gt: newEnd } }
        ]
      });

      series.startNumber = newStart;
      series.endNumber = newEnd;
    }

    series.name = data.name ?? series.name;
    series.remarks = data.remarks ?? series.remarks;
    series.defaultPlotType = data.defaultPlotType ?? series.defaultPlotType;

    const areaChanged = data.plotArea && Number(data.plotArea) !== series.plotArea;
    if (areaChanged) {
      series.plotArea = Number(data.plotArea);
    }

    await series.save();

    // Ensure all plots in the new range exist. If not, generate them.
    const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }) || {
      baseSqFtRate: 500,
      cornerExtraPercent: 20,
    };
    const baseRate = rateConfig.baseSqFtRate;

    for (let i = newStart; i <= newEnd; i++) {
      let plot = await Plot.findOne({ seriesId: id, sequenceNumber: i });
      if (!plot) {
        // Generate new plot
        let plotNumber = `${series.prefix}${i}`;
        const match = series.numberFormat.match(/0+/);
        if (match) {
          const paddedNum = String(i).padStart(match[0].length, '0');
          plotNumber = `${series.prefix}${paddedNum}`;
        }

        let multiplier = 1;
        if (series.defaultPlotType === 'CORNER') {
          multiplier = 1 + ((rateConfig.cornerExtraPercent ?? 20) / 100);
        }

        const effectiveRate = baseRate * multiplier;
        const totalPlotValue = series.plotArea * effectiveRate;

        await new Plot({
          plotNumber,
          seriesId: series._id,
          sequenceNumber: i,
          plotSize: series.plotArea,
          plotType: series.defaultPlotType,
          baseRate,
          effectiveRate,
          totalPlotValue,
          status: 'AVAILABLE',
        }).save();
      } else if (areaChanged && plot.status === 'AVAILABLE') {
        // If plot area changed, update all existing AVAILABLE plots
        plot.plotSize = series.plotArea;
        let multiplier = 1;
        if (plot.plotType === 'CORNER') {
          multiplier = 1 + ((rateConfig.cornerExtraPercent ?? 20) / 100);
        }
        plot.effectiveRate = plot.baseRate * multiplier;
        plot.totalPlotValue = plot.plotSize * plot.effectiveRate;
        await plot.save();
      }
    }

    return series;
  }

  async deleteSeries(id, userId) {
    const activePlots = await Plot.find({
      seriesId: id,
      status: { $in: ['BOOKED', 'HOLD', 'REGISTERED'] },
    });
    if (activePlots.length > 0) {
      throw ApiError.badRequest('Cannot delete series. It has active holds or bookings.');
    }

    await PlotSeriesMaster.findByIdAndDelete(id);
    await Plot.deleteMany({ seriesId: id });

    // Log action
    await new PlotAuditLog({
      action: 'DELETE_SERIES',
      modelName: 'PlotSeriesMaster',
      documentId: id,
      userId,
      details: { id },
    }).save();

    return { success: true };
  }

  // ── PLOTS INVENTORY ─────────────────────────────────────────────
  async getPlots(filters = {}) {
    const query = {};
    if (filters.seriesId) query.seriesId = filters.seriesId;
    if (filters.status) query.status = filters.status;
    if (filters.plotType) query.plotType = filters.plotType;
    if (filters.search) {
      query.plotNumber = { $regex: filters.search, $options: 'i' };
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 40;
    const skip = (page - 1) * limit;

    const [plots, total] = await Promise.all([
      Plot.find(query)
        .populate('seriesId')
        .sort({ plotNumber: 1 })
        .skip(skip)
        .limit(limit),
      Plot.countDocuments(query),
    ]);

    return {
      plots,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getPlotById(id) {
    const plot = await Plot.findById(id).populate('seriesId');
    if (!plot) throw ApiError.notFound('Plot not found');
    return plot;
  }

  async updatePlot(id, data, userId) {
    const plot = await Plot.findById(id);
    if (!plot) throw ApiError.notFound('Plot not found');
    if (plot.status !== 'AVAILABLE' && plot.status !== 'HOLD') {
      throw ApiError.badRequest('Can only edit properties of Available or Hold plots');
    }

    plot.plotType = data.plotType ?? plot.plotType;
    plot.plotSize = data.plotSize ?? plot.plotSize;
    plot.baseRate = data.baseRate ?? plot.baseRate;

    // Recalculate values
    const rateConfig = await this.getRateConfig();
    let multiplier = 1;
    if (plot.plotType === 'CORNER') {
      multiplier = 1 + ((rateConfig.cornerExtraPercent ?? 20) / 100);
    }

    plot.effectiveRate = plot.baseRate * multiplier;
    plot.totalPlotValue = plot.plotSize * plot.effectiveRate;
    plot.remarks = data.remarks ?? plot.remarks;

    await plot.save();

    // Log action
    await new PlotAuditLog({
      action: 'UPDATE_PLOT',
      modelName: 'Plot',
      documentId: plot._id,
      userId,
      details: { plotType: plot.plotType, plotSize: plot.plotSize, totalPlotValue: plot.totalPlotValue },
    }).save();

    return plot;
  }

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
        bookingDate, // Added custom bookingDate support
        oneTimeMonths,
      } = data;

      const plot = await Plot.findById(plotId).session(session);
      if (!plot) throw ApiError.notFound('Plot not found');
      if (plot.status !== 'AVAILABLE') {
        throw ApiError.badRequest(`Plot ${plot.plotNumber} is not available (Status: ${plot.status})`);
      }

      // 2. Resolve/Register Customer in PlotCustomer
      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        if (!customerName || !customerMobile) {
          throw ApiError.badRequest('Either Customer ID or Name & Mobile is required');
        }
        // Check if customer already exists in PlotCustomer by mobile
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

      // Resolve sponsor (null if direct / no sponsor)
      const finalSponsorId = sponsorId !== undefined
        ? (sponsorId || null)
        : (customer.sponsorId ? customer.sponsorId : null);

      // 3. Generate Booking number
      const bookingDateObj = bookingDate ? new Date(bookingDate) : new Date();
      const date = bookingDateObj;
      const month = date.getMonth(); // 0-indexed: 3 is April
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
        { new: true, upsert: true }
      );
      const bookingNumber = `${fyStr}${String(counter.sequence).padStart(3, '0')}`;

      // Create Booking Document
      const plotValue = plot.totalPlotValue;
      const discountVal = Number(discount) || 0;
      const remainingAmount = plotValue - discountVal;

      const booking = new PlotBooking({
        bookingNumber,
        bookingDate: bookingDateObj,
        customerId: finalCustomerId,
        sponsorId: finalSponsorId,
        plotId,
        plotValue,
        scheme,
        bookingAmount: 0,
        remainingAmount,
        status: bookingType === 'HOLD' ? 'HOLD' : 'ACTIVE',
        holdExpiryDate: bookingType === 'HOLD' ? new Date(bookingDateObj.getTime() + holdExpiryDays * 24 * 60 * 60 * 1000) : undefined,
        notes,
        discount: discountVal,
        oneTimeMonths: scheme === 'FULL_PAYMENT' ? Number(oneTimeMonths) || 1 : undefined,
      });
      await booking.save({ session });

      // Update plot status
      plot.status = bookingType === 'HOLD' ? 'HOLD' : 'BOOKED';
      await plot.save({ session });

      // ── SCHEME ENGINE LOGIC ──
      if (bookingType === 'BOOKING') {
        if (scheme === 'FULL_PAYMENT') {
          // Note: Weekly payout (money-back) will be initialized by the admin 
          // once the booking is fully paid (remainingAmount === 0).

          // Create a single installment for the full amount so it can be paid later
          const dueDate = new Date(bookingDateObj);
          if (oneTimeMonths && oneTimeMonths > 0) {
            dueDate.setMonth(dueDate.getMonth() + Number(oneTimeMonths));
          }
          const installments = [{
            installmentNumber: 1,
            bookingId: booking._id,
            dueDate,
            dueAmount: remainingAmount,
            paidAmount: 0,
            status: 'PENDING',
          }];
          await PlotInstallment.insertMany(installments, { session });

          // 5% instant Sponsor Commission
          const commissionAmount = Math.round((plotValue * 0.05) * 100) / 100;
          const commission = new PlotSponsorCommission({
            bookingId: booking._id,
            sponsorId: finalSponsorId,
            customerId: finalCustomerId,
            amount: commissionAmount,
            commissionPercent: 5,
            status: 'active',
          });
          await commission.save({ session });
        } else if (scheme === 'MONTHLY_INSTALLMENT') {
          // Scheme 2: Monthly installments.
          const installments = [];
          const downpaymentAmount = Number(bookingAmount) || 0;

          if (downpaymentAmount > 0) {
            // Installment #0 for the downpayment/final payment
            installments.push({
              installmentNumber: 0,
              bookingId: booking._id,
              dueDate: bookingDateObj,
              dueAmount: downpaymentAmount,
              paidAmount: 0,
              status: 'PENDING',
            });
          }

          const count = Number(installmentCount) || 100;
          let principalToDistribute = remainingAmount - downpaymentAmount;

          for (let i = 1; i <= count; i++) {
            const dueDate = new Date(bookingDateObj);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(1);
            dueDate.setHours(0, 0, 0, 0);

            let dueForThisInst = 0;
            if (i === count) {
              // Last installment takes the remainder to prevent rounding residue issues
              dueForThisInst = Math.round(principalToDistribute * 100) / 100;
            } else {
              dueForThisInst = installmentAmount ? Number(installmentAmount) : Math.floor((remainingAmount - downpaymentAmount) / count);
              dueForThisInst = Math.min(dueForThisInst, principalToDistribute);
            }
            dueForThisInst = Math.round(dueForThisInst * 100) / 100;
            principalToDistribute -= dueForThisInst;

            if (dueForThisInst > 0) {
              installments.push({
                installmentNumber: i,
                bookingId: booking._id,
                dueDate,
                dueAmount: dueForThisInst,
                paidAmount: 0,
                status: 'PENDING',
              });
            }
          }
          await PlotInstallment.insertMany(installments, { session });
        }
      }

      // Log action
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

      // Default grace period in days
      const gracePeriod = 15;

      // Loop through targetInstIds and apply payment amount
      const updatedInstallments = [];
      let totalPrincipalPaid = 0;
      let totalLateFinePaid = 0;

      for (const instId of targetInstIds) {
        if (remainingPaid <= 0 && remainingRebate <= 0) break;
        const installment = await PlotInstallment.findById(instId).session(session);
        if (!installment) continue;

        // Calculate late fine
        let calculatedFine = 0;
        if (booking.scheme === 'MONTHLY_INSTALLMENT' && installment.installmentNumber > 0) {
          const due = new Date(installment.dueDate);
          const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          const d2 = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
          const diffTime = d2 - d1;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (diffDays > gracePeriod) {
            calculatedFine = Math.round(installment.dueAmount * 0.0005 * diffDays);
          }
        }
        const effectiveFine = Math.max(installment.lateFine || 0, calculatedFine);
        installment.lateFine = effectiveFine;

        // 1. Distribute rebate first to the unpaid fine
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (installment.lateFinePaid || 0) - (installment.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        installment.lateFineRebate = (installment.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;

        // 2. Distribute payment: FIRST to principal, then to remaining late fine
        const unpaidPrincipal = Math.max(0, installment.dueAmount - installment.paidAmount);
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        installment.paidAmount += principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;
        totalPrincipalPaid += principalPaidThisTime;

        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (installment.lateFinePaid || 0) - (installment.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        installment.lateFinePaid += finePaidThisTime;
        totalLateFinePaid += finePaidThisTime;
        remainingPaid -= finePaidThisTime;

        installment.paidDate = paymentDate;
        installment.paymentMode = paymentMode;
        installment.receiptNumber = receiptNumber;
        installment.status = (installment.paidAmount >= installment.dueAmount && (installment.lateFinePaid + (installment.lateFineRebate || 0)) >= installment.lateFine) ? 'PAID' : 'PARTIAL';
        await installment.save({ session });

        updatedInstallments.push(installment);

        // Scheme 2: Sponsor Commission 15% on each paid installment principal amount
        if (booking.scheme === 'MONTHLY_INSTALLMENT' && principalPaidThisTime > 0) {
          const commPercent = 15;
          const commissionAmount = Math.round((principalPaidThisTime * 0.15) * 100) / 100;
          await new PlotSponsorCommission({
            bookingId: booking._id,
            installmentId: installment._id,
            sponsorId: booking.sponsorId,
            customerId: booking.customerId,
            amount: commissionAmount,
            commissionPercent: commPercent,
            status: 'active',
          }).save({ session });
        }
      }

      // Recalculate remaining balance on booking dynamically
      await this.recalculateBookingBalance(booking._id, session);

      // Scheme 1: For FULL_PAYMENT, if we pay the principal and there is a reversed commission, set it to 'active'
      if (booking.scheme === 'FULL_PAYMENT' && totalPrincipalPaid > 0) {
        await PlotSponsorCommission.updateMany(
          { bookingId: booking._id, status: 'reversed' },
          { $set: { status: 'active' } }
        ).session(session);
      }

      // Create Receipt
      const receipt = new PlotReceipt({
        receiptNumber,
        receiptType: 'INSTALLMENT',
        bookingId: booking._id,
        amount: Number(amountPaid),
        lateFinePaid: totalLateFinePaid,
        lateFineRebate: Number(lateFineRebate),
        paymentMode,
        transactionReference,
        remarks,
      });
      if (customDate) {
        receipt.createdAt = paymentDate;
      }
      await receipt.save({ session });

      // Rebuild entire ledger state for 100% accuracy
      await this.rebuildBookingInstallmentsState(booking._id, session);

      // Log event
      await new PlotAuditLog({
        action: 'COLLECT_INSTALLMENTS',
        modelName: 'PlotInstallment',
        documentId: booking._id,
        userId: processedBy,
        details: { amountPaid, receiptNumber, updatedCount: updatedInstallments.length },
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

      const gracePeriod = 15;
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

        // Calculate late fine
        let calculatedFine = 0;
        if (booking.scheme === 'MONTHLY_INSTALLMENT' && inst.installmentNumber > 0) {
          const due = new Date(inst.dueDate);
          const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          const d2 = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
          const diffTime = d2 - d1;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (diffDays > gracePeriod) {
            calculatedFine = Math.round(inst.dueAmount * 0.0005 * diffDays);
          }
        }
        const effectiveFine = Math.max(inst.lateFine || 0, calculatedFine);
        inst.lateFine = effectiveFine;

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

        // Re-generate Sponsor Commission if Scheme 2 (MONTHLY_INSTALLMENT) and we paid principal
        if (booking.scheme === 'MONTHLY_INSTALLMENT' && principalPaidThisTime > 0) {
          const commPercent = 15;
          const commissionAmount = Math.round((principalPaidThisTime * 0.15) * 100) / 100;
          await new PlotSponsorCommission({
            bookingId: booking._id,
            installmentId: inst._id,
            sponsorId: booking.sponsorId,
            customerId: booking.customerId,
            amount: commissionAmount,
            commissionPercent: commPercent,
            status: 'active',
          }).save({ session });
        }
      }

      // Recalculate remaining balance on booking dynamically
      await this.recalculateBookingBalance(booking._id, session);

      // For FULL_PAYMENT, if new payment amount > 0, ensure commission is 'active', otherwise 'reversed'
      if (booking.scheme === 'FULL_PAYMENT') {
        const status = newAmount > 0 ? 'active' : 'reversed';
        await PlotSponsorCommission.updateMany(
          { bookingId: booking._id },
          { $set: { status } }
        ).session(session);
      }

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

      // 2. Delete the receipt document itself
      await receipt.deleteOne({ session });

      // 3. Rebuild the entire installment ledger and balance from remaining active receipts
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

        // Release Plot
        await Plot.findByIdAndUpdate(hold.plotId, { status: 'AVAILABLE' }).session(session);

        // Save Audit Log
        await new PlotAuditLog({
          action: 'HOLD_EXPIRED',
          modelName: 'PlotBooking',
          documentId: hold._id,
          userId: hold.customerId, // System trigger, associated with customer
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

  // ── REPORTS & FILTERS ───────────────────────────────────────────
  async getBookings(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.scheme) query.scheme = filters.scheme;
    if (filters.customerId) query.customerId = filters.customerId;

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      PlotBooking.find(query)
        .populate('customerId', 'name mobile customerId')
        .populate('sponsorId', 'name customerId')
        .populate({
          path: 'plotId',
          populate: { path: 'seriesId' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PlotBooking.countDocuments(query),
    ]);

    // Recalculate balances for returned bookings to ensure 100% data consistency
    await Promise.all(bookings.map(b => this.recalculateBookingBalance(b._id)));

    return {
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async rebuildBookingInstallmentsState(bookingId, session = null) {
    if (!bookingId) return;
    const query = PlotBooking.findById(bookingId);
    if (session) query.session(session);
    const booking = await query;
    if (!booking) return;

    // 1. Reset all installments for this booking to zero state
    const instQuery = PlotInstallment.find({ bookingId }).sort({ installmentNumber: 1 });
    if (session) instQuery.session(session);
    const installments = await instQuery;

    for (const inst of installments) {
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

    // 2. Remove all sponsor commissions for monthly installment scheme to re-generate accurately
    if (booking.scheme === 'MONTHLY_INSTALLMENT') {
      const commQuery = PlotSponsorCommission.deleteMany({ bookingId });
      if (session) commQuery.session(session);
      await commQuery;
    }

    // 3. Fetch all active receipts for this booking sorted by createdAt ascending
    const receiptQuery = PlotReceipt.find({ bookingId }).sort({ createdAt: 1, _id: 1 });
    if (session) receiptQuery.session(session);
    const receipts = await receiptQuery;

    const gracePeriod = 15;

    // 4. Re-apply each receipt in chronological order
    for (const receipt of receipts) {
      let remainingPaid = Number(receipt.amount) || 0;
      let remainingRebate = Number(receipt.lateFineRebate) || 0;
      const paymentDate = new Date(receipt.createdAt);

      let totalLateFinePaidForReceipt = 0;

      for (const inst of installments) {
        if (remainingPaid <= 0 && remainingRebate <= 0) break;
        if (inst.status === 'PAID') continue;

        // Calculate late fine
        let calculatedFine = 0;
        if (booking.scheme === 'MONTHLY_INSTALLMENT' && inst.installmentNumber > 0) {
          const due = new Date(inst.dueDate);
          const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          const d2 = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate());
          const diffTime = d2 - d1;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (diffDays > gracePeriod) {
            calculatedFine = Math.round(inst.dueAmount * 0.0005 * diffDays);
          }
        }
        const effectiveFine = Math.max(inst.lateFine || 0, calculatedFine);
        inst.lateFine = effectiveFine;

        // Rebate
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        inst.lateFineRebate = (inst.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;

        // Principal First
        const unpaidPrincipal = Math.max(0, inst.dueAmount - inst.paidAmount);
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        inst.paidAmount += principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;

        // Late Fine
        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        inst.lateFinePaid += finePaidThisTime;
        totalLateFinePaidForReceipt += finePaidThisTime;
        remainingPaid -= finePaidThisTime;

        inst.paidDate = paymentDate;
        inst.paymentMode = receipt.paymentMode;
        inst.receiptNumber = receipt.receiptNumber;
        inst.status = (inst.paidAmount >= inst.dueAmount && (inst.lateFinePaid + (inst.lateFineRebate || 0)) >= inst.lateFine) ? 'PAID' : 'PARTIAL';

        if (session) await inst.save({ session });
        else await inst.save();

        // Re-generate Sponsor Commission if Scheme 2 (MONTHLY_INSTALLMENT) and we paid principal
        if (booking.scheme === 'MONTHLY_INSTALLMENT' && principalPaidThisTime > 0 && booking.sponsorId) {
          const commPercent = 15;
          const commissionAmount = Math.round((principalPaidThisTime * 0.15) * 100) / 100;
          const commDoc = new PlotSponsorCommission({
            bookingId: booking._id,
            installmentId: inst._id,
            sponsorId: booking.sponsorId,
            customerId: booking.customerId,
            amount: commissionAmount,
            commissionPercent: commPercent,
            status: 'active',
          });
          if (session) await commDoc.save({ session });
          else await commDoc.save();
        }
      }

      // Sync lateFinePaid back to receipt
      receipt.lateFinePaid = totalLateFinePaidForReceipt;
      if (session) await receipt.save({ session });
      else await receipt.save();
    }

    // 5. Recalculate remainingAmount on Booking
    await this.recalculateBookingBalance(bookingId, session);
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

  async getBookingById(id) {
    await this.rebuildBookingInstallmentsState(id);
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

  // ── DASHBOARD & REPORTS AGGREGATION ────────────────────────────
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
            totalCollection: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const plots = { AVAILABLE: 0, HOLD: 0, BOOKED: 0, CANCELLED: 0, REGISTERED: 0 };
    plotStats.forEach(stat => {
      if (plots[stat._id] !== undefined) plots[stat._id] = stat.count;
    });

    const bookings = bookingStats[0] || { totalValue: 0, bookingAmount: 0, remainingAmount: 0, count: 0 };
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
      const commissions = await PlotSponsorCommission.find({ status: 'active' })
        .populate('sponsorId', 'name email customerId mobile')
        .populate('customerId', 'name customerId')
        .populate('installmentId', 'dueAmount amount paidAmount')
        .populate({
          path: 'bookingId',
          populate: { path: 'plotId', select: 'plotNumber' }
        })
        .sort({ createdAt: -1 })
        .lean();

      // Fetch plot payout vouchers to calculate paid commission per sponsor if any
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
            customerId: sp.customerId,
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
        const paidInsts = insts.filter(i => i.status === 'PAID');
        const unpaidInsts = insts.filter(i => i.status !== 'PAID');

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
        b.totalInstallmentsCount = insts.length;
        b.paidInstallmentsCount = paidInsts.length;
        b.unpaidInstallmentsCount = unpaidInsts.length;
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

  async updateBooking(id, data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(id).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      const {
        notes, discount, bookingAmount, bookingDate, sponsorId, status, scheme,
        installmentCount, installmentAmount, oneTimeMonths, downpaymentMonths, agreementNumber,
        bookingType, holdExpiryDays, customerId, plotId, paymentMode, transactionReference
      } = data;

      if (notes !== undefined) booking.notes = notes;
      if (agreementNumber !== undefined) booking.agreementNumber = agreementNumber;
      if (paymentMode !== undefined) booking.paymentMode = paymentMode;
      if (transactionReference !== undefined) booking.transactionReference = transactionReference;
      if (downpaymentMonths !== undefined) booking.downpaymentMonths = Number(downpaymentMonths) || 1;

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
        // Release old plot
        const oldPlot = await Plot.findById(booking.plotId).session(session);
        if (oldPlot) {
          oldPlot.status = 'AVAILABLE';
          await oldPlot.save({ session });
        }
        // Reserve new plot
        booking.plotId = plotId;
        const newPlot = await Plot.findById(plotId).session(session);
        if (newPlot) {
          newPlot.status = (booking.status === 'HOLD' || booking.bookingType === 'HOLD') ? 'HOLD' : 'BOOKED';
          booking.plotValue = newPlot.totalValue || (newPlot.areaSqFt * newPlot.ratePerSqFt);
          await newPlot.save({ session });
        }
      }

      let installmentParamsChanged = false;

      if (scheme !== undefined && scheme !== booking.scheme) {
        booking.scheme = scheme;
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
        booking.sponsorId = sponsorId || null; // Null if direct / no sponsor
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

      if (amountChanged) {
        booking.remainingAmount = booking.plotValue - booking.discount - booking.bookingAmount;

        // Also update initial payment amount and receipt if they exist
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

      const targetCount = installmentCount !== undefined ? Number(installmentCount) : undefined;
      const targetAmount = installmentAmount !== undefined ? Number(installmentAmount) : undefined;

      if (installmentParamsChanged || targetCount !== undefined || targetAmount !== undefined) {
        // Delete all old installments
        await PlotInstallment.deleteMany({ bookingId: id }).session(session);

        const bookingDateObj = booking.bookingDate;
        const remainingAmount = booking.plotValue - booking.discount;

        if (booking.scheme === 'FULL_PAYMENT') {
          // Re-create single installment for full payment
          const dueDate = new Date(bookingDateObj);
          if (booking.oneTimeMonths && booking.oneTimeMonths > 0) {
            dueDate.setMonth(dueDate.getMonth() + Number(booking.oneTimeMonths));
          }
          const installments = [{
            installmentNumber: 1,
            bookingId: booking._id,
            dueDate,
            dueAmount: remainingAmount,
            paidAmount: 0,
            status: 'PENDING',
          }];
          await PlotInstallment.insertMany(installments, { session });
        } else if (booking.scheme === 'MONTHLY_INSTALLMENT') {
          // Re-create monthly installments
          const installments = [];
          const downpaymentAmount = booking.bookingAmount;

          if (downpaymentAmount > 0) {
            installments.push({
              installmentNumber: 0,
              bookingId: booking._id,
              dueDate: bookingDateObj,
              dueAmount: downpaymentAmount,
              paidAmount: 0,
              status: 'PENDING',
            });
          }

          const count = targetCount !== undefined ? targetCount : 100;
          let principalToDistribute = remainingAmount - downpaymentAmount;

          for (let i = 1; i <= count; i++) {
            const dueDate = new Date(bookingDateObj);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(1);
            dueDate.setHours(0, 0, 0, 0);

            let dueForThisInst = 0;
            if (i === count) {
              dueForThisInst = Math.round(principalToDistribute * 100) / 100;
            } else {
              dueForThisInst = targetAmount ? targetAmount : Math.floor((remainingAmount - downpaymentAmount) / count);
              dueForThisInst = Math.min(dueForThisInst, principalToDistribute);
            }
            dueForThisInst = Math.round(dueForThisInst * 100) / 100;
            principalToDistribute -= dueForThisInst;

            if (dueForThisInst > 0) {
              installments.push({
                installmentNumber: i,
                bookingId: booking._id,
                dueDate,
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

      // Log action
      await new PlotAuditLog({
        action: 'UPDATE_BOOKING',
        modelName: 'PlotBooking',
        documentId: booking._id,
        userId,
        details: { bookingNumber: booking.bookingNumber, updatedFields: data },
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

      // Revert plot status to AVAILABLE
      await Plot.findByIdAndUpdate(booking.plotId, { status: 'AVAILABLE' }).session(session);

      // Delete payments, receipts, and installments
      await PlotPayment.deleteMany({ bookingId: id }).session(session);
      await PlotReceipt.deleteMany({ bookingId: id }).session(session);
      await PlotInstallment.deleteMany({ bookingId: id }).session(session);
      await PlotSponsorCommission.deleteMany({ bookingId: id }).session(session);

      // Delete the booking itself
      await PlotBooking.findByIdAndDelete(id).session(session);

      // Log action
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

  // ── WEEKLY PAYOUT RETURN SCHEME (FULL PAYMENT RETURN SCHEME) ─────
  async initializePlotPayout(bookingId, startDate, weeklyAmount, userId) {
    const booking = await PlotBooking.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    // Check if fully paid
    if (booking.remainingAmount > 0) {
      throw ApiError.badRequest('Booking is not fully paid yet');
    }
    if (booking.scheme !== 'FULL_PAYMENT') {
      throw ApiError.badRequest('Weekly payout return is only available for FULL_PAYMENT scheme');
    }

    const start = new Date(startDate || Date.now());
    const amt = Math.round((booking.plotValue / 500) * 100) / 100;

    booking.payoutStatus = 'ACTIVE';
    booking.payoutStartDate = start;
    booking.payoutWeeklyAmount = amt;
    booking.payoutNextDueDate = new Date(start);

    // Delete any existing stray payout schedules for this booking
    await PlotPayoutSchedule.deleteMany({ bookingId });

    // Instantly accrue weeks that have already elapsed between start date and today
    const now = new Date();
    let weekCount = 0;
    while (now >= booking.payoutNextDueDate && weekCount < 500) {
      weekCount++;
      const nextSchedule = new PlotPayoutSchedule({
        bookingId: booking._id,
        weekNumber: weekCount,
        dueDate: new Date(booking.payoutNextDueDate),
        amount: amt,
        status: 'SCHEDULED',
      });
      await nextSchedule.save();

      // Advance by 7 days
      const nextDate = new Date(booking.payoutNextDueDate);
      nextDate.setDate(nextDate.getDate() + 7);
      booking.payoutNextDueDate = nextDate;
    }

    if (weekCount >= 500) {
      booking.payoutStatus = 'COMPLETED';
    }

    await booking.save();

    // Audit log
    await new PlotAuditLog({
      action: 'INITIALIZE_PAYOUT',
      modelName: 'PlotBooking',
      documentId: booking._id,
      userId,
      details: { startDate: start, weeklyAmount: amt, initialWeeksAccrued: weekCount },
    }).save();

    return booking;
  }

  async payoutCronJobLogic() {
    const bookings = await PlotBooking.find({ payoutStatus: 'ACTIVE' });
    console.log(`[PlotPayoutCron] Found ${bookings.length} active payout bookings.`);

    for (const booking of bookings) {
      const now = new Date();
      let accrued = false;

      while (now >= booking.payoutNextDueDate) {
        // Find current max weekNumber
        const lastSchedule = await PlotPayoutSchedule.findOne({ bookingId: booking._id }).sort({ weekNumber: -1 });
        const nextWeekNum = lastSchedule ? lastSchedule.weekNumber + 1 : 1;

        if (nextWeekNum > 500) {
          booking.payoutStatus = 'COMPLETED';
          accrued = true;
          break;
        }

        const newSchedule = new PlotPayoutSchedule({
          bookingId: booking._id,
          weekNumber: nextWeekNum,
          dueDate: new Date(booking.payoutNextDueDate),
          amount: booking.payoutWeeklyAmount || Math.round((booking.plotValue / 500) * 100) / 100,
          status: 'SCHEDULED',
        });
        await newSchedule.save();

        console.log(`[PlotPayoutCron] Accrued week #${nextWeekNum} of ₹${booking.payoutWeeklyAmount} for booking ${booking.bookingNumber}`);

        // Advance by 7 days
        const nextDate = new Date(booking.payoutNextDueDate);
        nextDate.setDate(nextDate.getDate() + 7);
        booking.payoutNextDueDate = nextDate;
        accrued = true;
      }

      if (accrued) {
        await booking.save();
      }
    }
  }

  async collectPlotPayoutPayment(bookingId, amountPaid, paymentMode, transactionReference, remarks, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      // Get all scheduled payouts sorted by due date
      const schedules = await PlotPayoutSchedule.find({
        bookingId,
        status: { $ne: 'PAID' }
      }).sort({ dueDate: 1 }).session(session);

      const totalDue = schedules.reduce((sum, s) => sum + (s.amount - s.paidAmount), 0);
      if (amountPaid <= 0) throw ApiError.badRequest('Amount paid must be greater than zero');
      if (amountPaid > totalDue) {
        throw ApiError.badRequest(`Amount paid (₹${amountPaid}) cannot exceed total accumulated due payout (₹${totalDue})`);
      }

      // Increment Sequence Counter for payout voucher (RO-PPV-YYMM-XXXX) using Mongoose Counter schema
      const now = new Date();
      const currentYear = now.getFullYear().toString().slice(-2);
      const nextYear = (now.getFullYear() + 1).toString().slice(-2);
      const yearStr = `${currentYear}${nextYear}`;

      const voucherNumber = await Counter.getNextSequence(`RO-PPV-${yearStr}`, session, 4);

      const voucher = new PlotPayoutVoucher({
        voucherNumber,
        bookingId,
        customerId: booking.customerId,
        amountPaid,
        paymentMode,
        transactionReference,
        remarks,
        payoutDate: new Date(),
        processedBy: userId,
      });
      await voucher.save({ session });

      // Distribute amountPaid across schedules FIFO
      let remaining = amountPaid;
      for (const s of schedules) {
        const unpaid = s.amount - s.paidAmount;
        if (remaining >= unpaid) {
          s.paidAmount = s.amount;
          s.status = 'PAID';
          s.paidDate = new Date();
          remaining -= unpaid;
        } else {
          s.paidAmount += remaining;
          s.status = 'SCHEDULED'; // still scheduled
          remaining = 0;
        }
        await s.save({ session });
        if (remaining <= 0) break;
      }

      await new PlotAuditLog({
        action: 'COLLECT_PAYOUT_PAYMENT',
        modelName: 'PlotPayoutVoucher',
        documentId: voucher._id,
        userId,
        details: { voucherNumber, amountPaid },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();

      return voucher;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getPlotPayoutLedger(bookingId) {
    const booking = await PlotBooking.findById(bookingId)
      .populate('customerId', 'name customerId mobile address')
      .populate('plotId', 'plotNumber plotSize plotType');
    if (!booking) throw ApiError.notFound('Booking not found');

    const schedules = await PlotPayoutSchedule.find({ bookingId }).sort({ weekNumber: 1 });
    const vouchers = await PlotPayoutVoucher.find({ bookingId })
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    const totalAccumulated = schedules.reduce((sum, s) => sum + s.amount, 0);
    const totalPaid = vouchers.reduce((sum, v) => sum + v.amountPaid, 0);
    const netDue = Math.max(0, totalAccumulated - totalPaid);

    return {
      booking,
      schedules,
      vouchers,
      summary: {
        totalAccumulated,
        totalPaid,
        netDue,
      }
    };
  }

  async getPlotPayoutVoucherById(id) {
    const voucher = await PlotPayoutVoucher.findById(id)
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customerId', select: 'name customerId mobile address' },
          { path: 'plotId', populate: { path: 'seriesId' } }
        ]
      })
      .populate('processedBy', 'name');
    if (!voucher) throw ApiError.notFound('Payout voucher not found');
    return voucher;
  }

  async deletePlotPayoutVoucher(voucherId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Find the voucher
      const voucher = await PlotPayoutVoucher.findById(voucherId).session(session);
      if (!voucher) throw ApiError.notFound('Payout voucher not found');

      const bookingId = voucher.bookingId;

      // 2. Delete the voucher
      await PlotPayoutVoucher.findByIdAndDelete(voucherId).session(session);

      // 3. Reset all schedules for this booking
      await PlotPayoutSchedule.updateMany(
        { bookingId },
        {
          $set: {
            paidAmount: 0,
            status: 'SCHEDULED',
            paidDate: null
          }
        }
      ).session(session);

      // 4. Fetch all remaining vouchers for this booking, sorted by payoutDate (ascending)
      const remainingVouchers = await PlotPayoutVoucher.find({ bookingId })
        .sort({ payoutDate: 1 })
        .session(session);

      // 5. Fetch all schedules for this booking, sorted by dueDate (ascending)
      const schedules = await PlotPayoutSchedule.find({ bookingId })
        .sort({ dueDate: 1 })
        .session(session);

      // 6. Re-apply remaining vouchers FIFO
      for (const v of remainingVouchers) {
        let remaining = v.amountPaid;
        for (const s of schedules) {
          const unpaid = s.amount - s.paidAmount;
          if (unpaid <= 0) continue;

          if (remaining >= unpaid) {
            s.paidAmount = s.amount;
            s.status = 'PAID';
            s.paidDate = v.payoutDate;
            remaining -= unpaid;
          } else {
            s.paidAmount += remaining;
            s.status = 'SCHEDULED';
            remaining = 0;
          }
          await s.save({ session });
          if (remaining <= 0) break;
        }
      }

      // 7. Write audit log
      await new PlotAuditLog({
        action: 'DELETE_PAYOUT_VOUCHER',
        modelName: 'PlotPayoutVoucher',
        documentId: voucherId,
        userId,
        details: { voucherNumber: voucher.voucherNumber, amountPaid: voucher.amountPaid },
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

  async updatePlotPayoutVoucher(voucherId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const voucher = await PlotPayoutVoucher.findById(voucherId).session(session);
      if (!voucher) throw ApiError.notFound('Payout voucher not found');

      const bookingId = voucher.bookingId;

      // Update fields
      if (updateData.amountPaid !== undefined) {
        // Validate amountPaid does not exceed total accumulated due payout
        const schedules = await PlotPayoutSchedule.find({ bookingId }).session(session);
        const totalAccumulated = schedules.reduce((sum, s) => sum + s.amount, 0);

        // Fetch all other vouchers to find total paid by other vouchers
        const otherVouchers = await PlotPayoutVoucher.find({
          bookingId,
          _id: { $ne: voucherId }
        }).session(session);
        const otherPaid = otherVouchers.reduce((sum, v) => sum + v.amountPaid, 0);

        const newAmountPaid = Number(updateData.amountPaid);
        if (newAmountPaid <= 0) throw ApiError.badRequest('Amount paid must be greater than zero');
        if (otherPaid + newAmountPaid > totalAccumulated) {
          throw ApiError.badRequest(`Updated amount (₹${newAmountPaid}) + other payments (₹${otherPaid}) cannot exceed total accumulated return (₹${totalAccumulated})`);
        }

        voucher.amountPaid = newAmountPaid;
      }

      if (updateData.paymentMode !== undefined) {
        voucher.paymentMode = updateData.paymentMode;
        if (updateData.paymentMode === 'cash') {
          voucher.transactionReference = '';
        } else if (updateData.transactionReference !== undefined) {
          voucher.transactionReference = updateData.transactionReference;
        }
      }

      if (updateData.remarks !== undefined) {
        voucher.remarks = updateData.remarks;
      }

      await voucher.save({ session });

      // Reset all schedules for this booking
      await PlotPayoutSchedule.updateMany(
        { bookingId },
        {
          $set: {
            paidAmount: 0,
            status: 'SCHEDULED',
            paidDate: null
          }
        }
      ).session(session);

      // Fetch all vouchers for this booking, sorted by payoutDate (ascending)
      const vouchers = await PlotPayoutVoucher.find({ bookingId })
        .sort({ payoutDate: 1 })
        .session(session);

      // Fetch all schedules for this booking, sorted by dueDate (ascending)
      const allSchedules = await PlotPayoutSchedule.find({ bookingId })
        .sort({ dueDate: 1 })
        .session(session);

      // Re-apply vouchers FIFO
      for (const v of vouchers) {
        let remaining = v.amountPaid;
        for (const s of allSchedules) {
          const unpaid = s.amount - s.paidAmount;
          if (unpaid <= 0) continue;

          if (remaining >= unpaid) {
            s.paidAmount = s.amount;
            s.status = 'PAID';
            s.paidDate = v.payoutDate;
            remaining -= unpaid;
          } else {
            s.paidAmount += remaining;
            s.status = 'SCHEDULED';
            remaining = 0;
          }
          await s.save({ session });
          if (remaining <= 0) break;
        }
      }

      // Write audit log
      await new PlotAuditLog({
        action: 'UPDATE_PAYOUT_VOUCHER',
        modelName: 'PlotPayoutVoucher',
        documentId: voucherId,
        userId,
        details: { voucherNumber: voucher.voucherNumber, updateData },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();
      return voucher;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // ── SPONSOR & CUSTOMER MANAGEMENT ───────────────────────────
  async getSponsors(query = {}) {
    const { search, page = 1, limit = 50 } = query;
    const filter = { role: { $in: ['sponsor', 'agent'] } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { sponsorCode: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const sponsors = await User.find(filter)
      .populate('sponsorId', 'name sponsorCode mobile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    return { sponsors, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } };
  }

  async createSponsor(data) {
    const { name, email, mobile, password, address, panCard, aadhaarCard, commissionRate, sponsorId } = data;

    if (!sponsorId) {
      throw new Error('Referring Sponsor / Direct Company selection is required');
    }

    // Default email to sponsorname@gn.com (lowercase without spaces) if not provided
    const userEmail = email && typeof email === 'string' && email.trim() ? email.trim() : undefined;
    
    if (userEmail) {
      const existing = await User.findOne({ email: userEmail });
      if (existing) {
        throw new Error('User with this email already exists');
      }
    }

    // Financial Year calculation (e.g., April 2026 -> 26-27)
    const now = new Date();
    const month = now.getMonth(); // 0-indexed, 3 is April
    const fullYear = now.getFullYear();
    let startYear = month >= 3 ? fullYear : fullYear - 1;
    let endYear = startYear + 1;
    const fyStr = `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;

    // Generate unique sequential Sponsor Code: GNE-{FY}-{INCREMENTAL}
    const prefix = `GNE-${fyStr}-`;
    const latestSponsor = await User.findOne({
      role: { $in: ['sponsor', 'agent'] },
      sponsorCode: new RegExp('^' + prefix)
    }).sort({ sponsorCode: -1 });

    let nextNum = 1;
    if (latestSponsor && latestSponsor.sponsorCode) {
      const parts = latestSponsor.sponsorCode.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }
    const sponsorCode = `${prefix}${String(nextNum).padStart(3, '0')}`;

    const sponsorData = {
      name,
      sponsorCode,
      sponsorId: sponsorId === 'company' || sponsorId === 'direct' ? null : sponsorId,
      password: password || '123456',
      mobile: mobile || '',
      role: 'sponsor',
      address,
      panCard,
      aadhaarCard,
      commissionRate: Number(commissionRate) || 0,
    };

    if (userEmail) {
      sponsorData.email = userEmail;
    }

    const sponsor = new User(sponsorData);
    await sponsor.save();
    return sponsor;
  }

  async updateSponsor(id, data) {
    const updateData = { ...data };
    if (updateData.sponsorId !== undefined) {
      if (updateData.sponsorId === 'company' || updateData.sponsorId === 'direct') {
        updateData.sponsorId = null;
      }
    }
    const sponsor = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).populate('sponsorId', 'name sponsorCode mobile email');
    return sponsor;
  }

  async deleteSponsor(id) {
    // Check if sponsor is assigned to any customer or booking
    const customerCount = await User.countDocuments({ sponsorId: id });
    if (customerCount > 0) {
      throw new Error(`Cannot delete sponsor. ${customerCount} customer(s) are assigned to this sponsor.`);
    }
    const bookingCount = await PlotBooking.countDocuments({ sponsorId: id });
    if (bookingCount > 0) {
      throw new Error(`Cannot delete sponsor. ${bookingCount} plot booking(s) are associated with this sponsor.`);
    }
    const sponsor = await User.findByIdAndDelete(id);
    if (!sponsor) {
      throw new Error('Sponsor not found');
    }
    return { message: 'Sponsor deleted successfully' };
  }

  async toggleSponsorBlock(id) {
    const sponsor = await User.findById(id);
    if (!sponsor) {
      throw new Error('Sponsor not found');
    }
    sponsor.isBlocked = !sponsor.isBlocked;
    await sponsor.save();
    return sponsor;
  }

  async syncLegacyUserCustomers() {
    try {
      const legacyCustomers = await User.find({ role: 'customer' });
      for (const legacy of legacyCustomers) {
        const exists = await PlotCustomer.findById(legacy._id);
        if (!exists) {
          await PlotCustomer.create({
            _id: legacy._id,
            customerId: legacy.customerCode || legacy.customerId || `CUST-${legacy._id.toString().slice(-6)}`,
            name: legacy.name,
            mobile: legacy.mobile || '',
            email: legacy.email || '',
            address: legacy.address || '',
            currentAddress: legacy.currentAddress || '',
            permanentAddress: legacy.permanentAddress || '',
            sameAsCurrentAddress: legacy.sameAsCurrentAddress || false,
            fatherOrHusbandName: legacy.fatherOrHusbandName || '',
            relationType: legacy.relationType || 'Son of',
            gender: legacy.gender || 'Male',
            age: legacy.age,
            dob: legacy.dob || '',
            occupation: legacy.occupation || '',
            panCard: legacy.panCard || '',
            aadhaarCard: legacy.aadhaarCard || '',
            nomineeName: legacy.nomineeName || '',
            nomineeRelation: legacy.nomineeRelation || '',
            nomineeAge: legacy.nomineeAge,
            accountHolderName: legacy.accountHolderName || '',
            bankName: legacy.bankName || '',
            bankBranch: legacy.bankBranch || '',
            accountNumber: legacy.accountNumber || '',
            ifscCode: legacy.ifscCode || '',
            isBlocked: legacy.isBlocked || false,
            createdAt: legacy.createdAt,
            updatedAt: legacy.updatedAt,
          });
        }
      }
    } catch (err) {
      console.error('Legacy customer sync notice:', err.message);
    }
  }

  async getCustomers(query = {}) {
    await this.syncLegacyUserCustomers();
    const { search, page = 1, limit = 50 } = query;
    const filter = {};
    if (search) {
      filter.$or = [
        { customerId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await PlotCustomer.countDocuments(filter);
    const customers = await PlotCustomer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    return { customers, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } };
  }

  async createCustomer(data) {
    const {
      name, email, mobile, gender, age, relationType, fatherOrHusbandName,
      address, currentAddress, permanentAddress, sameAsCurrentAddress, aadhaarCard, panCard,
      nomineeName, nomineeRelation, nomineeAge, accountHolderName, bankName, bankBranch, accountNumber, ifscCode
    } = data;

    const fyStr = `${new Date().getFullYear().toString().slice(-2)}${(new Date().getFullYear() + 1).toString().slice(-2)}`;
    const customerId = await Counter.getNextSequence(`RO-CUST-${fyStr}`, null, 5);

    const customer = new PlotCustomer({
      customerId,
      name,
      email: email || '',
      mobile: mobile || '',
      gender: gender || 'Male',
      age,
      relationType: relationType || 'Son of',
      fatherOrHusbandName: fatherOrHusbandName || '',
      address: currentAddress || address || '',
      currentAddress: currentAddress || address || '',
      permanentAddress: sameAsCurrentAddress ? (currentAddress || address || '') : (permanentAddress || ''),
      sameAsCurrentAddress: Boolean(sameAsCurrentAddress),
      aadhaarCard: aadhaarCard || '',
      panCard: panCard || '',
      nomineeName: nomineeName || '',
      nomineeRelation: nomineeRelation || '',
      nomineeAge,
      accountHolderName: accountHolderName || '',
      bankName: bankName || '',
      bankBranch: bankBranch || '',
      accountNumber: accountNumber || '',
      ifscCode: ifscCode || '',
    });
    await customer.save();
    return customer;
  }

  async updateCustomer(id, data) {
    const customer = await PlotCustomer.findByIdAndUpdate(id, data, { new: true });
    return customer;
  }

  async deleteCustomer(id) {
    const bookingCount = await PlotBooking.countDocuments({ customerId: id });
    if (bookingCount > 0) {
      throw new Error(`Cannot delete customer. ${bookingCount} plot booking(s) exist for this customer.`);
    }
    const customer = await User.findByIdAndDelete(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return { message: 'Customer deleted successfully' };
  }
}

module.exports = new PlotsService();
