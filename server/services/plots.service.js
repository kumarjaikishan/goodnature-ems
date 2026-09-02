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
const PlotClosing = require('../models/PlotClosing');
const PlotAuditLog = require('../models/PlotAuditLog');
const Counter = require('../models/Counter');
const User = require('../models/user');
const PlotCustomer = require('../models/PlotCustomer');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const accountingService = require('./accountingService');
const ApiError = require('../utils/apiError');

class PlotsService {
  // ── RATE CONFIGURATION ──────────────────────────────────────────
  async getRateConfig() {
    let config = await PlotRateConfiguration.findOne({ status: 'active' });
    if (!config) {
      config = new PlotRateConfiguration({
        baseSqFtRate: 1000,
        cornerExtraPercent: 20,
        interestRatePercent: 10.88,
        rateSlabs: PlotRateConfiguration.getDefaultRateSlabs(),
      });
      await config.save();
    } else {
      let needsSave = false;
      if (!config.rateSlabs || config.rateSlabs.length === 0) {
        config.rateSlabs = PlotRateConfiguration.getDefaultRateSlabs();
        needsSave = true;
      }
      if (config.interestRatePercent === undefined || config.interestRatePercent === null) {
        config.interestRatePercent = 10.88;
        needsSave = true;
      }
      if (needsSave) {
        await config.save();
      }
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
      config.interestRatePercent = data.interestRatePercent !== undefined ? Number(data.interestRatePercent) : (config.interestRatePercent ?? 10.88);
      if (data.rateSlabs && Array.isArray(data.rateSlabs)) {
        config.rateSlabs = data.rateSlabs;
      }
    }
    await config.save();
    return config;
  }

  // ── SERIES MASTER & BULK PLOT GENERATION ────────────────────────
  async createSeries(data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name, prefix, startNumber, endNumber, plotArea, defaultPlotType, numberFormat, remarks, defaultDimensions, defaultBoundaries } = data;

      // Create series master
      const series = new PlotSeriesMaster({
        name,
        prefix,
        startNumber,
        endNumber,
        plotArea,
        defaultPlotType,
        numberFormat,
        defaultDimensions: defaultDimensions || {},
        defaultBoundaries: defaultBoundaries || {},
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
          dimensions: defaultDimensions || { north: 0, south: 0, east: 0, west: 0 },
          boundaries: defaultBoundaries || { north: '', south: '', east: '', west: '' },
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
    if (data.defaultDimensions !== undefined) series.defaultDimensions = data.defaultDimensions;
    if (data.defaultBoundaries !== undefined) series.defaultBoundaries = data.defaultBoundaries;

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
          dimensions: series.defaultDimensions || { north: 0, south: 0, east: 0, west: 0 },
          boundaries: series.defaultBoundaries || { north: '', south: '', east: '', west: '' },
          baseRate,
          effectiveRate,
          totalPlotValue,
          status: 'AVAILABLE',
        }).save();
      } else if (plot.status === 'AVAILABLE' || plot.status === 'HOLD') {
        // When series defaults (dimensions, boundaries, plot size, plot type) are updated,
        // propagate them to all active unbooked (AVAILABLE/HOLD) plots in the series block
        if (data.defaultDimensions !== undefined) {
          plot.dimensions = {
            north: Number(data.defaultDimensions.north) || 0,
            south: Number(data.defaultDimensions.south) || 0,
            east: Number(data.defaultDimensions.east) || 0,
            west: Number(data.defaultDimensions.west) || 0,
          };
        }
        if (data.defaultBoundaries !== undefined) {
          plot.boundaries = {
            north: data.defaultBoundaries.north || '',
            south: data.defaultBoundaries.south || '',
            east: data.defaultBoundaries.east || '',
            west: data.defaultBoundaries.west || '',
          };
        }
        if (areaChanged || data.plotArea) {
          plot.plotSize = series.plotArea;
        }
        if (data.defaultPlotType) {
          plot.plotType = series.defaultPlotType;
        }

        let multiplier = 1;
        if (plot.plotType === 'CORNER') {
          multiplier = 1 + ((rateConfig.cornerExtraPercent ?? 20) / 100);
        }
        plot.effectiveRate = (plot.baseRate || baseRate) * multiplier;
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

  async createPlot(data, userId) {
    const { seriesId, plotNumber, plotSize, plotType, baseRate, sequenceNumber, remarks, dimensions, boundaries } = data;
    if (!plotNumber || !plotSize) {
      throw ApiError.badRequest('Plot Number and Plot Size are required');
    }

    const cleanPlotNumber = String(plotNumber).trim().toUpperCase();
    const existing = await Plot.findOne({ plotNumber: cleanPlotNumber });
    if (existing) {
      throw ApiError.badRequest(`Plot Number "${cleanPlotNumber}" already exists.`);
    }

    let series = null;
    if (seriesId) {
      series = await PlotSeriesMaster.findById(seriesId);
    }

    // Determine sequence number if not explicitly passed
    let seq = Number(sequenceNumber);
    if (!seq || isNaN(seq)) {
      if (series) {
        const highestPlot = await Plot.findOne({ seriesId: series._id }).sort({ sequenceNumber: -1 });
        seq = highestPlot ? (highestPlot.sequenceNumber || 0) + 1 : (series.endNumber || 0) + 1;
      } else {
        const count = await Plot.countDocuments();
        seq = count + 1;
      }
    }

    const rateConfig = await this.getRateConfig();
    const resolvedBaseRate = baseRate !== undefined && baseRate !== '' ? Number(baseRate) : rateConfig.baseSqFtRate;
    const resolvedPlotType = plotType === 'CORNER' ? 'CORNER' : 'NORMAL';

    let multiplier = 1;
    if (resolvedPlotType === 'CORNER') {
      multiplier = 1 + ((rateConfig.cornerExtraPercent ?? 20) / 100);
    }

    const effectiveRate = resolvedBaseRate * multiplier;
    const totalPlotValue = Number(plotSize) * effectiveRate;

    const newPlot = new Plot({
      plotNumber: cleanPlotNumber,
      seriesId: series ? series._id : undefined,
      sequenceNumber: seq,
      plotSize: Number(plotSize),
      plotType: resolvedPlotType,
      dimensions: dimensions || series?.defaultDimensions || { north: 0, south: 0, east: 0, west: 0 },
      boundaries: boundaries || series?.defaultBoundaries || { north: '', south: '', east: '', west: '' },
      baseRate: resolvedBaseRate,
      effectiveRate,
      totalPlotValue,
      status: 'AVAILABLE',
      remarks: remarks || '',
    });

    await newPlot.save();

    // Update series endNumber if the new plot exceeds current endNumber
    if (series && seq > (series.endNumber || 0)) {
      series.endNumber = seq;
      await series.save();
    }

    // Log action
    await new PlotAuditLog({
      action: 'CREATE_PLOT',
      modelName: 'Plot',
      documentId: newPlot._id,
      userId,
      details: { plotNumber: cleanPlotNumber, seriesId, plotSize, plotType: resolvedPlotType, totalPlotValue },
    }).save();

    return newPlot;
  }

  async getPlotById(id) {
    const plot = await Plot.findById(id).populate('seriesId');
    if (!plot) throw ApiError.notFound('Plot not found');
    return plot;
  }

  async updatePlot(id, data, userId) {
    const plot = await Plot.findById(id);
    if (!plot) throw ApiError.notFound('Plot not found');
    
    const isBookedOrRegistered = plot.status === 'BOOKED' || plot.status === 'REGISTERED';

    // If plot is booked or registered, size/corner/rate cannot be altered without cancelling or adjusting the booking contract
    if (isBookedOrRegistered) {
      const isAttemptingFinancialChange =
        (data.plotSize !== undefined && Number(data.plotSize) !== plot.plotSize) ||
        (data.plotType !== undefined && data.plotType !== plot.plotType) ||
        (data.baseRate !== undefined && Number(data.baseRate) !== plot.baseRate);

      if (isAttemptingFinancialChange) {
        throw ApiError.badRequest(
          `Cannot modify size, rate, or corner status for Plot ${plot.plotNumber} because it is currently ${plot.status}. Adjustments must be made through the Booking / Agreement module.`
        );
      }

      // Allow remarks, dimensions and boundaries updates on booked plots
      if (data.remarks !== undefined) plot.remarks = data.remarks;
      if (data.dimensions !== undefined) plot.dimensions = data.dimensions;
      if (data.boundaries !== undefined) plot.boundaries = data.boundaries;
      await plot.save();
      return plot;
    }

    plot.plotType = data.plotType ?? plot.plotType;
    plot.plotSize = data.plotSize ?? plot.plotSize;
    plot.baseRate = data.baseRate ?? plot.baseRate;
    if (data.dimensions !== undefined) plot.dimensions = data.dimensions;
    if (data.boundaries !== undefined) plot.boundaries = data.boundaries;

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
        bookingDate, // Custom bookingDate support
        oneTimeMonths = 1,
        tenureMonths,
        downpaymentMonths = 1,
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

      // 3. Rate Slab Lookup & Dynamic Plot Pricing
      const resolvedTenure = tenureMonths !== undefined
        ? Number(tenureMonths)
        : (scheme === 'FULL_PAYMENT' ? 0 : (Number(installmentCount) || 3));

      const rateConfig = await this.getRateConfig();
      const slabs = rateConfig.rateSlabs || PlotRateConfiguration.getDefaultRateSlabs();
      const slab = slabs.find(s => Number(s.tenureMonths) === resolvedTenure) || slabs[0];

      const basePlotRate = slab.plotRate || rateConfig.baseSqFtRate || 1000;
      const cornerExtraPercent = plot.plotType === 'CORNER' ? (rateConfig.cornerExtraPercent || 20) : 0;
      const effectiveSqFtRate = basePlotRate * (1 + cornerExtraPercent / 100);
      const plotValue = Math.round(plot.plotSize * effectiveSqFtRate);

      // 4. Generate Booking number
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
        { new: true, upsert: true, session }
      );
      const bookingNumber = `${fyStr}${String(counter.sequence).padStart(3, '0')}`;

      // Calculate Downpayment & EMI Breakdown
      const discountVal = Number(discount) || 0;
      const remainingAmount = Math.max(0, plotValue - discountVal);
      const resolvedScheme = resolvedTenure === 0 ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT';
      const resolvedDpBase = data.downpaymentCalculationBase === 'AFTER_DISCOUNT' ? 'AFTER_DISCOUNT' : 'BEFORE_DISCOUNT';

      let downpaymentAmt = 0;
      let emiPrincipalAmt = 0;
      let emiMonthlyAmt = 0;

      if (resolvedTenure === 0) {
        downpaymentAmt = remainingAmount;
        emiPrincipalAmt = 0;
        emiMonthlyAmt = 0;
      } else {
        const dpPercent = slab.downpaymentPercent ? slab.downpaymentPercent / 100 : 0.40;
        if (resolvedDpBase === 'BEFORE_DISCOUNT') {
          // 40% computed on Gross Plot Value (before discount)
          downpaymentAmt = Math.round(plotValue * dpPercent);
          emiPrincipalAmt = Math.max(0, remainingAmount - downpaymentAmt);
        } else {
          // 40% computed on Net Remaining Value (after discount)
          downpaymentAmt = Math.round(remainingAmount * dpPercent);
          emiPrincipalAmt = remainingAmount - downpaymentAmt;
        }
        emiMonthlyAmt = resolvedTenure > 0 ? Math.round(emiPrincipalAmt / resolvedTenure) : 0;
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
        basePlotRate,
        promoterCommissionPercent: slab.promoterCommissionPercent,
        developerCommissionPercent: slab.developerCommissionPercent,
        downpaymentMonths: Number(downpaymentMonths) || 1,
        downpaymentAmount: downpaymentAmt,
        emiPrincipalAmount: emiPrincipalAmt,
        emiMonthlyAmount: emiMonthlyAmt,
        downpaymentCalculationBase: resolvedDpBase,
      });
      await booking.save({ session });

      // Update plot status
      plot.status = bookingType === 'HOLD' ? 'HOLD' : 'BOOKED';
      await plot.save({ session });

      // ── SCHEME ENGINE & INSTALLMENT SCHEDULE LOGIC ──
      if (bookingType === 'BOOKING') {
        if (resolvedTenure === 0) {
          // One-Time / Full Payment: single installment for full amount due after oneTimeMonths
          const dueDate = new Date(bookingDateObj);
          dueDate.setMonth(dueDate.getMonth() + (Number(oneTimeMonths) || 1));

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
          // EMI Scheme: 40% Downpayment (Inst #0) + 60% Monthly EMIs (Inst #1..N)
          const installments = [];

          // Installment #0: Down Payment (40%)
          if (downpaymentAmt > 0) {
            const dpDueDate = new Date(bookingDateObj);
            dpDueDate.setMonth(dpDueDate.getMonth() + (Number(downpaymentMonths) || 1));

            installments.push({
              installmentNumber: 0,
              bookingId: booking._id,
              dueDate: dpDueDate,
              dueAmount: downpaymentAmt,
              paidAmount: 0,
              status: 'PENDING',
            });
          }

          // Monthly EMIs for the remaining 60%
          let principalToDistribute = emiPrincipalAmt;
          const count = resolvedTenure;

          for (let i = 1; i <= count; i++) {
            const dueDate = new Date(bookingDateObj);
            dueDate.setMonth(dueDate.getMonth() + (Number(downpaymentMonths) || 1) + i);
            dueDate.setDate(1);
            dueDate.setHours(0, 0, 0, 0);

            let dueForThisInst = 0;
            if (i === count) {
              // Last installment takes the remainder to prevent rounding residue issues
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
                dueDate,
                dueAmount: dueForThisInst,
                paidAmount: 0,
                status: 'PENDING',
              });
            }
          }
          await PlotInstallment.insertMany(installments, { session });
        }

        // ── SPONSOR COMMISSION DISTRIBUTION ENGINE ──
        await this.syncBookingSponsorCommissions(booking._id, session);
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

  // ── SPONSOR COMMISSION SYNCHRONIZATION ENGINE ────────────────────
  async syncBookingSponsorCommissions(bookingId, session = null) {
    if (!bookingId) return;
    const query = PlotBooking.findById(bookingId);
    if (session) query.session(session);
    const booking = await query;
    if (!booking) return;

    if (!booking.sponsorId || booking.status === 'HOLD' || booking.status === 'CANCELLED') {
      const delQuery = PlotSponsorCommission.deleteMany({ bookingId: booking._id });
      if (session) delQuery.session(session);
      await delQuery;
      return;
    }

    const sponsorQuery = User.findById(booking.sponsorId);
    if (session) sponsorQuery.session(session);
    const sponsorDoc = await sponsorQuery;
    if (!sponsorDoc) return;

    // Find existing commissions for this booking to preserve closingId tags
    const existingQuery = PlotSponsorCommission.find({ bookingId: booking._id });
    if (session) existingQuery.session(session);
    const existingComms = await existingQuery;
    const closingTagMap = {};
    existingComms.forEach(c => {
      if (c.closingId && c.receiptId) {
        const key = `${c.receiptId.toString()}_${c.sponsorId.toString()}_${c.commissionRole}`;
        closingTagMap[key] = c.closingId;
      }
    });

    // Delete existing commissions for this booking to re-sync cleanly
    const delQuery = PlotSponsorCommission.deleteMany({ bookingId: booking._id });
    if (session) delQuery.session(session);
    await delQuery;

    const plotValue = Number(booking.plotValue) || 0;
    let promoterPct = Number(booking.promoterCommissionPercent) || 0;
    let developerPct = Number(booking.developerCommissionPercent) || 0;
    const resolvedTenure = Number(booking.tenureMonths) || 0;

    // If commission percentages were not stored on the booking, resolve from rate config
    if (promoterPct === 0 && developerPct === 0) {
      const rateConfig = await this.getRateConfig();
      const slabs = rateConfig.rateSlabs || PlotRateConfiguration.getDefaultRateSlabs();
      const slab = slabs.find(s => Number(s.tenureMonths) === resolvedTenure) || slabs[0];
      promoterPct = slab.promoterCommissionPercent !== undefined ? slab.promoterCommissionPercent : (resolvedTenure === 9 ? 11.5 : 10);
      developerPct = slab.developerCommissionPercent !== undefined ? slab.developerCommissionPercent : 2.0;

      booking.promoterCommissionPercent = promoterPct;
      booking.developerCommissionPercent = developerPct;
      if (session) await booking.save({ session });
      else await booking.save();
    }

    // Fetch all receipts for this booking to calculate commission on collection basis
    const receiptQuery = PlotReceipt.find({ bookingId: booking._id }).sort({ createdAt: 1 });
    if (session) receiptQuery.session(session);
    const receipts = await receiptQuery;

    for (const receipt of receipts) {
      const collectionPrincipal = Math.max(0, Number(receipt.amount || 0) - Number(receipt.lateFinePaid || 0));
      if (collectionPrincipal <= 0) continue;

      const receiptDate = receipt.createdAt ? new Date(receipt.createdAt) : new Date();

      if (!sponsorDoc.sponsorId) {
        // Developer Sponsor direct to company -> gets Promoter % + Developer %
        const totalPct = +(promoterPct + developerPct).toFixed(2);
        const totalAmt = Math.round(collectionPrincipal * (totalPct / 100) * 100) / 100;
        const key = `${receipt._id.toString()}_${sponsorDoc._id.toString()}_DIRECT_DEVELOPER`;

        const commDoc = new PlotSponsorCommission({
          bookingId: booking._id,
          receiptId: receipt._id,
          sponsorId: sponsorDoc._id,
          customerId: booking.customerId,
          collectionAmount: collectionPrincipal,
          plotValue: collectionPrincipal,
          amount: totalAmt,
          commissionPercent: totalPct,
          commissionRole: 'DIRECT_DEVELOPER',
          tierTenureMonths: resolvedTenure,
          status: 'active',
          closingId: closingTagMap[key] || null,
          createdAt: receiptDate,
        });
        if (session) await commDoc.save({ session });
        else await commDoc.save();
      } else {
        // Sub-Sponsor -> gets Promoter % (e.g. 11.5%), Developer Sponsor gets Developer % (2.0%)
        const promoterAmt = Math.round(collectionPrincipal * (promoterPct / 100) * 100) / 100;
        const promoterKey = `${receipt._id.toString()}_${sponsorDoc._id.toString()}_PROMOTER`;
        const subCommission = new PlotSponsorCommission({
          bookingId: booking._id,
          receiptId: receipt._id,
          sponsorId: sponsorDoc._id,
          customerId: booking.customerId,
          collectionAmount: collectionPrincipal,
          plotValue: collectionPrincipal,
          amount: promoterAmt,
          commissionPercent: promoterPct,
          commissionRole: 'PROMOTER',
          tierTenureMonths: resolvedTenure,
          status: 'active',
          closingId: closingTagMap[promoterKey] || null,
          createdAt: receiptDate,
        });
        if (session) await subCommission.save({ session });
        else await subCommission.save();

        if (developerPct > 0 && sponsorDoc.sponsorId) {
          const devAmt = Math.round(collectionPrincipal * (developerPct / 100) * 100) / 100;
          const parentDevId = sponsorDoc.sponsorId._id || sponsorDoc.sponsorId;
          const devKey = `${receipt._id.toString()}_${parentDevId.toString()}_DEVELOPER_OVERRIDE`;
          const devCommission = new PlotSponsorCommission({
            bookingId: booking._id,
            receiptId: receipt._id,
            sponsorId: parentDevId,
            customerId: booking.customerId,
            collectionAmount: collectionPrincipal,
            plotValue: collectionPrincipal,
            amount: devAmt,
            commissionPercent: developerPct,
            commissionRole: 'DEVELOPER_OVERRIDE',
            tierTenureMonths: resolvedTenure,
            status: 'active',
            closingId: closingTagMap[devKey] || null,
            createdAt: receiptDate,
          });
          if (session) await devCommission.save({ session });
          else await devCommission.save();
        }
      }
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

      // Loop through targetInstIds and apply payment amount.
      // NOTE: none of the per-installment/commission writes in this loop
      // need to be persisted - rebuildBookingInstallmentsState() below
      // resets every installment for this booking and replays every
      // receipt (including the one we're about to create) from scratch,
      // so it is the single source of truth for final state. We still run
      // the loop in-memory because totalPrincipalPaid decides whether to
      // un-reverse FULL_PAYMENT commissions (which the rebuild does NOT
      // handle), and updatedInstallments.length feeds the audit log.
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

        updatedInstallments.push(installment);
        // (installment.save() intentionally skipped - see note above)
      }

      // Scheme 1: For FULL_PAYMENT, if we pay the principal and there is a reversed commission, set it to 'active'
      // (Scheme 2 commissions are regenerated from scratch by rebuildBookingInstallmentsState below.)
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
      }

      // Recalculate remaining balance on booking dynamically
      await this.recalculateBookingBalance(booking._id, session);

      // Re-sync sponsor commissions accurately with locked rate matrix & hierarchy
      await this.syncBookingSponsorCommissions(booking._id, session);

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

    if (filters.sponsorId) {
      // Find sub-sponsors if this is a developer sponsor
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

    // NOTE: this used to call recalculateBookingBalance() for every single
    // booking on every page load (each one doing its own extra findById +
    // installment scan, plus a conditional write) - on a 20-row page that
    // was up to ~60 extra DB round trips just to VIEW the list, on every
    // view. Every code path that can actually change a booking's balance
    // (collecting a payment, editing/deleting a receipt, editing a
    // booking's installment schedule) already keeps remainingAmount/status
    // correct at write time now, and getBookingById still self-heals a
    // single booking on open - so recomputing all of them here on every
    // list view was pure redundant work, not a correctness requirement.

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

    // 2. Fetch all realized / approved receipts for this booking sorted by createdAt ascending
    const receiptQuery = PlotReceipt.find({
      bookingId,
      status: { $in: ['APPROVED', undefined, null] }
    }).sort({ createdAt: 1, _id: 1 });
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
      }

      // Sync lateFinePaid back to receipt
      receipt.lateFinePaid = totalLateFinePaidForReceipt;
      if (session) await receipt.save({ session });
      else await receipt.save();
    }

    // 5. Recalculate remainingAmount on Booking
    await this.recalculateBookingBalance(bookingId, session);

    // 6. Re-sync sponsor commissions accurately with locked rate matrix & hierarchy
    await this.syncBookingSponsorCommissions(bookingId, session);
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
    // This is the self-healing entry point: it rebuilds the installment/
    // commission ledger from the receipt history before returning, so a
    // booking always shows correct state here even if something upstream
    // left it stale. Kept here (not on every list/installments call) so
    // the cost is paid once per booking view, not once per row of a list.
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
    // Unlike getBookingById, this is called directly by the collection
    // screen (InstallmentCollection.jsx) without going through a booking
    // detail view first - it drives the pre-filled amount the operator is
    // about to collect, so it keeps the full rebuild rather than trusting
    // upstream writers to have left things consistent.
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
      // Auto-sync active bookings with sponsors to ensure accurate locked rate slabs
      const activeBookings = await PlotBooking.find({
        status: { $in: ['ACTIVE', 'COMPLETED'] },
        sponsorId: { $ne: null }
      }).select('_id').lean();

      for (const b of activeBookings) {
        await this.syncBookingSponsorCommissions(b._id);
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
        tenureMonths, downpaymentCalculationBase, govtRate,
        installmentCount, installmentAmount, oneTimeMonths, downpaymentMonths, agreementNumber,
        bookingType, holdExpiryDays, customerId, plotId, paymentMode, transactionReference
      } = data;

      if (notes !== undefined) booking.notes = notes;
      if (agreementNumber !== undefined) booking.agreementNumber = agreementNumber;
      if (paymentMode !== undefined) booking.paymentMode = paymentMode;
      if (transactionReference !== undefined) booking.transactionReference = transactionReference;
      if (downpaymentMonths !== undefined) booking.downpaymentMonths = Number(downpaymentMonths) || 1;
      if (downpaymentCalculationBase !== undefined) booking.downpaymentCalculationBase = downpaymentCalculationBase;
      if (govtRate !== undefined) booking.govtRate = Number(govtRate) || 100;

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

      // Handle tenure change with rate slab snapshot updates
      if (tenureMonths !== undefined && Number(tenureMonths) !== booking.tenureMonths) {
        const resolvedTenure = Number(tenureMonths) || 0;
        booking.tenureMonths = resolvedTenure;
        booking.scheme = resolvedTenure === 0 ? 'FULL_PAYMENT' : 'MONTHLY_INSTALLMENT';
        
        // Find matching slab from rate config to snapshot locked rates
        const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session);
        const slabs = rateConfig?.rateSlabs?.length > 0 ? rateConfig.rateSlabs : PlotRateConfiguration.getDefaultRateSlabs();
        const slab = slabs.find(s => Number(s.tenureMonths) === resolvedTenure) || slabs[0];

        const plot = await Plot.findById(booking.plotId).session(session);
        const plotArea = plot ? (plot.plotSize || plot.area || plot.areaSqFt || 0) : 0;
        const isCorner = plot?.plotType === 'CORNER';
        const cornerExtra = isCorner ? (rateConfig?.cornerExtraPercent || 20) : 0;
        const baseRate = slab.plotRate || rateConfig?.baseSqFtRate || 1000;
        const effectiveRate = baseRate * (1 + cornerExtra / 100);

        booking.basePlotRate = baseRate;
        booking.promoterCommissionPercent = slab.promoterCommissionPercent ?? 10.0;
        booking.developerCommissionPercent = slab.developerCommissionPercent ?? 2.0;
        if (plotArea > 0) {
          booking.plotValue = Math.round(plotArea * effectiveRate);
        }

        installmentParamsChanged = true;
      } else if (scheme !== undefined && scheme !== booking.scheme) {
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

        const bookingDateObj = booking.bookingDate || new Date();
        const remainingAmount = booking.plotValue - booking.discount;
        const resolvedDpMonths = Number(booking.downpaymentMonths) || 1;

        if (booking.scheme === 'FULL_PAYMENT') {
          // Re-create single installment for full payment
          const dueDate = new Date(bookingDateObj);
          const otMonths = Number(booking.oneTimeMonths) || 1;
          dueDate.setMonth(dueDate.getMonth() + otMonths);

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
          const downpaymentAmount = booking.bookingAmount || booking.downpaymentAmount || 0;

          if (downpaymentAmount > 0) {
            const dpDueDate = new Date(bookingDateObj);
            dpDueDate.setMonth(dpDueDate.getMonth() + resolvedDpMonths);

            installments.push({
              installmentNumber: 0,
              bookingId: booking._id,
              dueDate: dpDueDate,
              dueAmount: downpaymentAmount,
              paidAmount: 0,
              status: 'PENDING',
            });
          }

          const count = targetCount !== undefined ? targetCount : (Number(booking.tenureMonths) || 3);
          let principalToDistribute = Math.max(0, remainingAmount - downpaymentAmount);

          for (let i = 1; i <= count; i++) {
            const dueDate = new Date(bookingDateObj);
            dueDate.setMonth(dueDate.getMonth() + resolvedDpMonths + i);
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

      // If we just deleted and recreated the installment schedule, the new
      // installments start at paidAmount=0/PENDING - replay every existing
      // receipt against them so payment history isn't lost. Without this,
      // the booking would show as unpaid until something else happened to
      // trigger a rebuild.
      if (installmentParamsChanged || targetCount !== undefined || targetAmount !== undefined) {
        await this.rebuildBookingInstallmentsState(id, session);
      }

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

      // Check if there are any collections / receipts recorded for this booking
      const receiptsCount = await PlotReceipt.countDocuments({ bookingId: id }).session(session);
      const paymentsCount = await PlotPayment.countDocuments({ bookingId: id }).session(session);

      if (receiptsCount > 0 || paymentsCount > 0) {
        throw ApiError.badRequest(
          `Cannot delete booking #${booking.bookingNumber}. There are ${receiptsCount || paymentsCount} collection receipt(s) recorded against this booking. Please delete or reverse all collections first before deleting the booking.`
        );
      }

      // Revert plot status to AVAILABLE
      await Plot.findByIdAndUpdate(booking.plotId, { status: 'AVAILABLE' }).session(session);

      // Clean up empty installments and commissions if any
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

  // ── SPONSOR PORTAL DASHBOARD ───────────────────────────────
  async getSponsorDashboardStats(sponsorId) {
    const sponsor = await User.findById(sponsorId)
      .populate('sponsorId', 'name sponsorCode customerId email mobile')
      .lean();
    if (!sponsor) {
      const err = new Error('Sponsor not found');
      err.status = 404;
      throw err;
    }

    // Auto-sync active bookings for this sponsor
    const activeBookings = await PlotBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      $or: [{ sponsorId: sponsor._id }, { parentSponsorId: sponsor._id }]
    }).select('_id').lean();

    for (const b of activeBookings) {
      await this.syncBookingSponsorCommissions(b._id);
    }

    // 1. Fetch Subordinates / Team Network
    const subordinates = await User.find({
      role: 'sponsor',
      sponsorId: sponsor._id
    }).select('_id name sponsorCode customerId mobile email createdAt profileImage isBlocked').lean();

    const subordinateIds = subordinates.map(s => s._id);

    // 2. Fetch Direct Bookings and Team Bookings
    const allRelevantBookings = await PlotBooking.find({
      $or: [
        { sponsorId: sponsor._id },
        { parentSponsorId: sponsor._id },
        { sponsorId: { $in: subordinateIds } }
      ]
    })
      .populate('customerId', 'name customerId customerCode mobile email')
      .populate('plotId', 'plotNumber plotSize plotType seriesId')
      .populate('sponsorId', 'name sponsorCode customerId mobile')
      .sort({ createdAt: -1 })
      .lean();

    let directBookingsCount = 0;
    let teamBookingsCount = 0;
    let directPlotValue = 0;
    let teamPlotValue = 0;
    let activeBookingsCount = 0;
    let completedBookingsCount = 0;

    const recentBookings = [];

    allRelevantBookings.forEach((b, idx) => {
      const isDirect = String(b.sponsorId?._id || b.sponsorId) === String(sponsor._id);
      const val = Number(b.netValue || b.plotValue || 0);

      if (isDirect) {
        directBookingsCount++;
        directPlotValue += val;
      } else {
        teamBookingsCount++;
        teamPlotValue += val;
      }

      if (b.status === 'ACTIVE') activeBookingsCount++;
      if (b.status === 'COMPLETED') completedBookingsCount++;

      if (idx < 5) {
        recentBookings.push({
          _id: b._id,
          bookingNumber: b.bookingNumber,
          bookingDate: b.bookingDate || b.createdAt,
          customerName: b.customerId?.name || 'Unknown',
          customerMobile: b.customerId?.mobile || '',
          plotNumber: b.plotId?.plotNumber || '-',
          plotSize: b.plotId?.plotSize || 0,
          plotValue: b.plotValue,
          netValue: b.netValue,
          status: b.status,
          isDirect,
          sponsorName: b.sponsorId?.name || 'Self',
          sponsorCode: b.sponsorId?.sponsorCode || ''
        });
      }
    });

    // 3. Commissions Breakdown & Financial Stats
    const commissions = await PlotSponsorCommission.find({
      sponsorId: sponsor._id,
      status: 'active'
    })
      .populate('customerId', 'name customerId customerCode')
      .populate('closingId', 'closingName closingNumber startDate endDate')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber plotId',
        populate: { path: 'plotId', select: 'plotNumber' }
      })
      .sort({ createdAt: -1 })
      .lean();

    let totalCommissionEarned = 0;
    let directCommissionEarned = 0;
    let teamCommissionEarned = 0;
    let totalCollectionVolume = 0;
    let closedCommission = 0;
    let unclosedCommission = 0;

    const monthlyTrendsMap = {};
    const recentCommissions = [];

    commissions.forEach((c, idx) => {
      const colAmt = Number(c.collectionAmount || 0);
      const earnAmt = Number(c.amount || 0);
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';

      totalCollectionVolume += colAmt;
      totalCommissionEarned += earnAmt;

      if (isDirect) {
        directCommissionEarned += earnAmt;
      } else {
        teamCommissionEarned += earnAmt;
      }

      if (c.closingId) {
        closedCommission += earnAmt;
      } else {
        unclosedCommission += earnAmt;
      }

      // Group by Month for Charts/Trends
      const d = new Date(c.receiptId?.createdAt || c.createdAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTrendsMap[monthKey]) {
        monthlyTrendsMap[monthKey] = {
          month: monthKey,
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          collection: 0,
          commission: 0,
          count: 0
        };
      }
      monthlyTrendsMap[monthKey].collection += colAmt;
      monthlyTrendsMap[monthKey].commission += earnAmt;
      monthlyTrendsMap[monthKey].count++;

      if (idx < 6) {
        recentCommissions.push({
          _id: c._id,
          date: c.receiptId?.createdAt || c.createdAt,
          receiptNumber: c.receiptId?.receiptNumber || '-',
          bookingNumber: c.bookingId?.bookingNumber || '-',
          plotNumber: c.bookingId?.plotId?.plotNumber || '-',
          customerName: c.customerId?.name || '-',
          collectionAmount: colAmt,
          commissionPercent: c.commissionPercent,
          commissionEarned: earnAmt,
          commissionRole: c.commissionRole,
          isClosed: Boolean(c.closingId),
          closingNumber: c.closingId?.closingNumber || null
        });
      }
    });

    // 4. Payout Vouchers and Running Balance
    const vouchers = await PlotPayoutVoucher.find({
      $or: [{ customerId: sponsor._id }, { sponsorId: sponsor._id }]
    }).sort({ payoutDate: -1 }).lean().catch(() => []);

    let totalDisbursedPayouts = 0;
    vouchers.forEach(v => {
      totalDisbursedPayouts += Number(v.amountPaid || 0);
    });

    // Available balance in wallet/ledger
    const availableBalance = Math.max(0, closedCommission - totalDisbursedPayouts);

    // Sort Monthly trends
    const monthlyTrends = Object.values(monthlyTrendsMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    return {
      sponsor: {
        _id: sponsor._id,
        name: sponsor.name,
        sponsorCode: sponsor.sponsorCode || sponsor.customerId || '',
        email: sponsor.email || '',
        mobile: sponsor.mobile || '',
        profileImage: sponsor.profileImage || '',
        isDeveloperSponsor: !sponsor.sponsorId,
        parentSponsor: sponsor.sponsorId || null,
        joinedDate: sponsor.createdAt
      },
      metrics: {
        totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
        directCommissionEarned: Math.round(directCommissionEarned * 100) / 100,
        teamCommissionEarned: Math.round(teamCommissionEarned * 100) / 100,
        closedCommission: Math.round(closedCommission * 100) / 100,
        unclosedCommission: Math.round(unclosedCommission * 100) / 100,
        totalDisbursedPayouts: Math.round(totalDisbursedPayouts * 100) / 100,
        availableBalance: Math.round(availableBalance * 100) / 100,
        totalCollectionVolume: Math.round(totalCollectionVolume * 100) / 100,
        totalBookingsCount: allRelevantBookings.length,
        directBookingsCount,
        teamBookingsCount,
        activeBookingsCount,
        completedBookingsCount,
        totalBusinessValue: directPlotValue + teamPlotValue,
        directPlotValue,
        teamPlotValue,
        subordinatesCount: subordinates.length
      },
      subordinates: subordinates.slice(0, 10),
      monthlyTrends,
      recentBookings,
      recentCommissions,
      recentVouchers: vouchers.slice(0, 5)
    };
  }

  // ── SPONSOR & CUSTOMER MANAGEMENT ───────────────────────────
  async getSponsorBusinessReport(sponsorId, filters = {}) {
    const sponsor = await User.findById(sponsorId)
      .populate('sponsorId', 'name sponsorCode customerId email mobile')
      .lean();
    if (!sponsor) {
      const err = new Error('Sponsor not found');
      err.status = 404;
      throw err;
    }

    // Auto-sync active bookings for this sponsor
    const activeBookings = await PlotBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      $or: [{ sponsorId: sponsor._id }, { parentSponsorId: sponsor._id }]
    }).select('_id').lean();

    for (const b of activeBookings) {
      await this.syncBookingSponsorCommissions(b._id);
    }

    // Find all subordinates (sub-sponsors who have this sponsor as their developer sponsor)
    const subordinates = await User.find({
      role: 'sponsor',
      sponsorId: sponsor._id
    }).select('_id name sponsorCode customerId mobile email createdAt').lean();

    // Query strictly for commissions where sponsorId === sponsor._id
    // This ensures only the exact commission earned by this sponsor is returned:
    // - DIRECT_DEVELOPER: Direct sale by developer sponsor (e.g., 12.5% or 13%)
    // - PROMOTER: Direct sale by sub-sponsor (e.g., 10.5% or 11%)
    // - DEVELOPER_OVERRIDE: Override earned from a subordinate sale (2%)
    const commQuery = {
      sponsorId: sponsor._id,
      status: 'active'
    };

    const commissions = await PlotSponsorCommission.find(commQuery)
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('closingId', 'closingName closingNumber startDate endDate')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId bookingDate createdAt sponsorId parentSponsorId',
        populate: [
          { path: 'plotId', select: 'plotNumber seriesId' },
          { path: 'sponsorId', select: 'name sponsorCode' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter by date range if provided (using receipt date / creation date)
    let filteredCommissions = commissions;
    const { fromDate, toDate, typeFilter, search } = filters;

    if (fromDate || toDate) {
      filteredCommissions = filteredCommissions.filter(c => {
        const itemDate = c.receiptId?.createdAt || c.createdAt;
        const dStr = new Date(itemDate).toISOString().slice(0, 10);
        if (fromDate && dStr < fromDate) return false;
        if (toDate && dStr > toDate) return false;
        return true;
      });
    }

    // Filter by direct self vs subordinate if specified
    if (typeFilter === 'SELF') {
      filteredCommissions = filteredCommissions.filter(c => c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER');
    } else if (typeFilter === 'SUBORDINATE') {
      filteredCommissions = filteredCommissions.filter(c => c.commissionRole === 'DEVELOPER_OVERRIDE');
    }

    // Search query filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filteredCommissions = filteredCommissions.filter(c => {
        const custName = (c.customerId?.name || '').toLowerCase();
        const custCode = (c.customerId?.customerCode || c.customerId?.customerId || '').toLowerCase();
        const bkNo = (c.bookingId?.bookingNumber || '').toLowerCase();
        const rcNo = (c.receiptId?.receiptNumber || '').toLowerCase();
        const subSpName = (c.bookingId?.sponsorId?.name || '').toLowerCase();
        const subSpCode = (c.bookingId?.sponsorId?.sponsorCode || '').toLowerCase();
        const plotNo = (c.bookingId?.plotId?.plotNumber || '').toLowerCase();
        return custName.includes(q) || custCode.includes(q) || bkNo.includes(q) || rcNo.includes(q) || subSpName.includes(q) || subSpCode.includes(q) || plotNo.includes(q);
      });
    }

    // Calculate Summary Metrics
    let selfCollection = 0;
    let selfCommission = 0;
    let subCollection = 0;
    let subCommission = 0;

    // Group items by transaction rows
    const items = filteredCommissions.map(c => {
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const colAmt = Number(c.collectionAmount || 0);
      const earnAmt = Number(c.amount || 0);

      if (isDirect) {
        selfCollection += colAmt;
        selfCommission += earnAmt;
      } else {
        subCollection += colAmt;
        subCommission += earnAmt;
      }

      const bookingSponsor = c.bookingId?.sponsorId;
      const isSubordinateSale = c.commissionRole === 'DEVELOPER_OVERRIDE';
      const isDirectDeveloper = c.commissionRole === 'DIRECT_DEVELOPER';

      let percentFormula = `${c.commissionPercent}%`;
      if (isDirectDeveloper) {
        const promoterPart = +(c.commissionPercent - 2).toFixed(2);
        percentFormula = `${promoterPart}% + 2%`;
      }

      return {
        _id: c._id,
        date: c.receiptId?.createdAt || c.createdAt,
        receiptNumber: c.receiptId?.receiptNumber || '-',
        receiptType: c.receiptId?.receiptType || 'PAYMENT',
        paymentMode: c.receiptId?.paymentMode || 'cash',
        bookingNumber: c.bookingId?.bookingNumber || '-',
        plotNumber: c.bookingId?.plotId?.plotNumber || '-',
        customerName: c.customerId?.name || '-',
        customerCode: c.customerId?.customerCode || c.customerId?.customerId || '-',
        customerMobile: c.customerId?.mobile || '-',
        sourceType: isDirect ? 'SELF' : 'SUBORDINATE',
        subordinateName: isSubordinateSale ? (bookingSponsor?.name || 'Sub-Sponsor') : null,
        subordinateCode: isSubordinateSale ? (bookingSponsor?.sponsorCode || '') : null,
        commissionRole: c.commissionRole,
        collectionAmount: colAmt,
        commissionPercent: c.commissionPercent,
        percentFormula,
        commissionEarned: earnAmt,
        isClosed: Boolean(c.closingId),
        closingNumber: c.closingId?.closingNumber || null,
        closingName: c.closingId?.closingName || null
      };
    });

    const totalCollection = selfCollection + subCollection;
    const totalCommission = selfCommission + subCommission;

    return {
      sponsor: {
        _id: sponsor._id,
        name: sponsor.name,
        sponsorCode: sponsor.sponsorCode || sponsor.customerId || '',
        email: sponsor.email || '',
        mobile: sponsor.mobile || '',
        isDeveloperSponsor: !sponsor.sponsorId,
        parentSponsor: sponsor.sponsorId || null
      },
      subordinatesCount: subordinates.length,
      subordinatesList: subordinates,
      summary: {
        totalCollection,
        totalCommission,
        selfCollection,
        selfCommission,
        subordinateCollection: subCollection,
        subordinateCommission: subCommission,
        transactionsCount: items.length
      },
      items
    };
  }

  async getSponsorLedger(sponsorId) {
    const sponsor = await User.findById(sponsorId)
      .populate('sponsorId', 'name sponsorCode customerId email mobile')
      .lean();
    if (!sponsor) {
      const err = new Error('Sponsor not found');
      err.status = 404;
      throw err;
    }

    // Auto-sync active bookings for this sponsor
    const activeBookings = await PlotBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      $or: [{ sponsorId: sponsor._id }, { parentSponsorId: sponsor._id }]
    }).select('_id').lean();

    for (const b of activeBookings) {
      await this.syncBookingSponsorCommissions(b._id);
    }

    // Fetch all closed commissions for this sponsor (commissions are credited to ledger strictly on Closing)
    const commissions = await PlotSponsorCommission.find({
      sponsorId: sponsor._id,
      status: 'active',
      closingId: { $ne: null }
    })
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('closingId', 'closingName closingNumber startDate endDate')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId',
        populate: { path: 'plotId', select: 'plotNumber seriesId' }
      })
      .sort({ createdAt: 1 })
      .lean();

    // Group commissions by Closing batch to credit the sponsor ledger per closing
    const closingGroups = {};
    commissions.forEach(c => {
      if (!c.closingId || !c.closingId._id) return;
      const clsId = c.closingId._id.toString();
      if (!closingGroups[clsId]) {
        closingGroups[clsId] = {
          closingId: c.closingId._id,
          closingName: c.closingId.closingName,
          closingNumber: c.closingId.closingNumber,
          startDate: c.closingId.startDate,
          endDate: c.closingId.endDate,
          directBusiness: 0,
          directCommission: 0,
          directRates: [],
          indirectBusiness: 0,
          indirectCommission: 0,
          indirectRates: [],
          totalBusiness: 0,
          totalCommission: 0,
          entries: [],
          latestDate: c.closingId.endDate || c.createdAt,
        };
      }

      const colAmt = Number(c.collectionAmount || 0);
      const commAmt = Number(c.amount || 0);
      const ratePct = Number(c.commissionPercent || 0);
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const isIndirect = c.commissionRole === 'DEVELOPER_OVERRIDE';

      if (isDirect) {
        closingGroups[clsId].directBusiness += colAmt;
        closingGroups[clsId].directCommission += commAmt;
        if (ratePct > 0 && !closingGroups[clsId].directRates.includes(ratePct)) {
          closingGroups[clsId].directRates.push(ratePct);
        }
      } else if (isIndirect) {
        closingGroups[clsId].indirectBusiness += colAmt;
        closingGroups[clsId].indirectCommission += commAmt;
        if (ratePct > 0 && !closingGroups[clsId].indirectRates.includes(ratePct)) {
          closingGroups[clsId].indirectRates.push(ratePct);
        }
      }

      closingGroups[clsId].totalBusiness += colAmt;
      closingGroups[clsId].totalCommission += commAmt;
      closingGroups[clsId].entries.push(c);
    });

    // Fetch all payout vouchers for this sponsor if any
    const vouchers = await PlotPayoutVoucher.find({
      $or: [{ customerId: sponsor._id }, { sponsorId: sponsor._id }]
    }).sort({ payoutDate: 1 }).lean().catch(() => []);

    let totalCredits = 0;
    let totalDebits = 0;
    let totalCollectionsBase = 0;

    const rawTransactions = [];

    // Push consolidated closing credit entries to ledger
    Object.values(closingGroups).forEach(cg => {
      totalCredits += cg.totalCommission;
      totalCollectionsBase += cg.totalBusiness;

      const directRatesStr = cg.directRates.length > 0 ? cg.directRates.map(r => `${r}%`).join(', ') : '0%';
      const indirectRatesStr = cg.indirectRates.length > 0 ? cg.indirectRates.map(r => `${r}%`).join(', ') : '2%';

      const parts = [];
      if (cg.directBusiness > 0) {
        parts.push(`Direct Collection: ₹${cg.directBusiness.toLocaleString('en-IN')} @ ${directRatesStr} = ₹${cg.directCommission.toLocaleString('en-IN')}`);
      }
      if (cg.indirectBusiness > 0) {
        parts.push(`Indirect Downline: ₹${cg.indirectBusiness.toLocaleString('en-IN')} @ ${indirectRatesStr} = ₹${cg.indirectCommission.toLocaleString('en-IN')}`);
      }

      const breakdownText = parts.join(' | ');
      const desc = `${cg.closingName} [${cg.closingNumber}] — Period: ${new Date(cg.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} to ${new Date(cg.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. Total Business: ₹${cg.totalBusiness.toLocaleString('en-IN')} (${breakdownText})`;

      rawTransactions.push({
        id: cg.closingId,
        date: cg.latestDate,
        type: 'CREDIT',
        category: 'COMMISSION_CLOSING',
        role: cg.indirectCommission > 0 && cg.directCommission > 0 ? 'HYBRID' : (cg.indirectCommission > 0 ? 'DEVELOPER_OVERRIDE' : 'PROMOTER'),
        roleLabel: `${cg.closingNumber}`,
        description: desc,
        closingId: cg.closingId,
        closingNumber: cg.closingNumber,
        closingName: cg.closingName,
        directBusiness: cg.directBusiness,
        directCommission: cg.directCommission,
        directRatesStr,
        indirectBusiness: cg.indirectBusiness,
        indirectCommission: cg.indirectCommission,
        indirectRatesStr,
        collectionAmount: cg.totalBusiness,
        credit: cg.totalCommission,
        debit: 0,
        status: 'CLOSED',
        entriesCount: cg.entries.length,
      });
    });

    vouchers.forEach(v => {
      const debitAmt = Number(v.amountPaid || 0);
      totalDebits += debitAmt;

      const vchNum = v.voucherNumber ? `Voucher #${v.voucherNumber}` : 'Payout Voucher';
      const mode = (v.paymentMode || 'cash').toUpperCase();
      const ref = v.transactionReference ? ` (Ref: ${v.transactionReference})` : '';
      const remarks = v.remarks ? ` - Note: ${v.remarks}` : '';
      const desc = `Commission Payout Disbursed via ${mode}${ref}${remarks} [${vchNum}]`;

      rawTransactions.push({
        id: v._id,
        date: v.payoutDate || v.createdAt,
        type: 'DEBIT',
        category: 'PAYOUT',
        role: 'PAYOUT',
        roleLabel: 'Commission Payout',
        description: desc,
        voucherId: v._id,
        voucherNumber: v.voucherNumber,
        paymentMode: v.paymentMode,
        transactionReference: v.transactionReference,
        remarks: v.remarks,
        credit: 0,
        debit: debitAmt,
        status: 'PAID'
      });
    });

    // Sort chronologically (oldest to newest) to compute running balances accurately
    rawTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const computedTransactions = rawTransactions.map(tx => {
      runningBalance += (tx.credit - tx.debit);
      return {
        ...tx,
        balance: runningBalance
      };
    });

    // Reverse so newest transactions are first in view
    computedTransactions.reverse();

    return {
      sponsor,
      summary: {
        totalCredits,
        totalDebits,
        availableBalance: totalCredits - totalDebits,
        totalCollectionsBase,
        totalTransactions: computedTransactions.length
      },
      transactions: computedTransactions
    };
  }

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
    const rawSponsors = await User.find(filter)
      .populate('sponsorId', 'name sponsorCode mobile email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Map each sponsor to their Ledger account ID
    const sponsorIds = rawSponsors.map(s => s._id);
    const ledgers = await Ledger.find({ sponsorId: { $in: sponsorIds } }).lean();
    const ledgerMap = new Map(ledgers.map(l => [l.sponsorId.toString(), l._id.toString()]));

    const sponsors = await Promise.all(
      rawSponsors.map(async (s) => {
        let ledgerId = ledgerMap.get(s._id.toString());
        if (!ledgerId) {
          // Auto-create ledger if not found
          const newLedger = new Ledger({
            name: s.name || 'Sponsor',
            sponsorId: s._id,
            empId: s.sponsorCode || s.customerId || '',
            profileImage: s.profileImage,
            ledgerType: 'sponsor',
            isVoucherLedger: true,
            advance: 0
          });
          await newLedger.save();
          ledgerId = newLedger._id.toString();
        }
        return {
          ...s,
          ledgerId
        };
      })
    );

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

    const resolvedParentId = sponsorId === 'company' || sponsorId === 'direct' ? null : sponsorId;
    if (resolvedParentId) {
      const parentSponsor = await User.findById(resolvedParentId);
      if (!parentSponsor) {
        throw new Error('Referring sponsor not found');
      }
      if (parentSponsor.sponsorId) {
        throw new Error('Hierarchy limit reached: Sub-sponsors cannot have child sponsors under them. Referring sponsor must be a Developer Sponsor (Direct to Company).');
      }
    }

    const sponsorData = {
      name,
      sponsorCode,
      sponsorId: resolvedParentId,
      password: password || '123456',
      mobile: mobile || '',
      role: 'sponsor',
      address,
      panCard,
      aadhaarCard,
      photo: data.photo || '',
      signature: data.signature || '',
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
      } else if (updateData.sponsorId) {
        // Prevent assigning a parent to a sponsor who already has children
        const hasChildren = await User.countDocuments({ sponsorId: id, role: { $in: ['sponsor', 'agent'] } });
        if (hasChildren > 0) {
          throw new Error('This Developer Sponsor already has sub-sponsors registered under them and cannot be converted into a Sub-Sponsor.');
        }

        const parentSponsor = await User.findById(updateData.sponsorId);
        if (!parentSponsor) {
          throw new Error('Parent sponsor not found');
        }
        if (parentSponsor.sponsorId) {
          throw new Error('Hierarchy limit reached: Sub-sponsors cannot have child sponsors. Referring sponsor must be a Developer Sponsor (Direct to Company).');
        }
      }
    }

    // If new password provided, hash it properly
    if (updateData.password && updateData.password.trim()) {
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password.trim(), salt);
    } else {
      delete updateData.password;
    }

    const sponsor = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).populate('sponsorId', 'name sponsorCode mobile email');
    return sponsor;
  }

  async resetSponsorPassword(id, newPassword) {
    const sponsor = await User.findById(id);
    if (!sponsor) {
      throw new Error('Sponsor not found');
    }
    const pwd = newPassword && newPassword.trim() ? newPassword.trim() : '123456';
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    sponsor.password = await bcrypt.hash(pwd, salt);
    await sponsor.save();
    return { message: `Password reset successfully for sponsor ${sponsor.name}`, defaultPassword: pwd };
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
            photo: legacy.photo || legacy.profileImage || '',
            signature: legacy.signature || '',
            sponsorId: legacy.sponsorId || null,
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
    const customers = await PlotCustomer.find(filter)
      .populate({
        path: 'sponsorId',
        select: 'name sponsorCode mobile email photo signature sponsorId',
        populate: {
          path: 'sponsorId',
          select: 'name sponsorCode mobile email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    return { customers, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } };
  }

  async createCustomer(data) {
    const {
      sponsorId, name, email, mobile, gender, age, relationType, fatherOrHusbandName,
      address, currentAddress, permanentAddress, sameAsCurrentAddress, aadhaarCard, panCard,
      nomineeName, nomineeRelation, nomineeAge, accountHolderName, bankName, bankBranch, accountNumber, ifscCode,
      photo, signature
    } = data;

    const fyStr = `${new Date().getFullYear().toString().slice(-2)}${(new Date().getFullYear() + 1).toString().slice(-2)}`;
    const customerId = await Counter.getNextSequence(`RO-CUST-${fyStr}`, null, 5);

    const customer = new PlotCustomer({
      customerId,
      sponsorId: sponsorId === 'company' || sponsorId === 'direct' || !sponsorId ? null : sponsorId,
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
      photo: photo || '',
      signature: signature || '',
    });
    await customer.save();
    return customer;
  }

  async getCustomerById(id) {
    const customer = await PlotCustomer.findById(id).populate('sponsorId', 'name sponsorCode mobile email photo signature');
    if (!customer) {
      // Fallback check in User model if legacy
      const user = await User.findById(id).populate('sponsorId', 'name sponsorCode mobile email photo signature');
      if (user && user.role === 'customer') return user;
      throw new Error('Customer not found');
    }
    return customer;
  }

  async updateCustomer(id, data) {
    if (data.sponsorId === 'company' || data.sponsorId === 'direct') {
      data.sponsorId = null;
    }
    const customer = await PlotCustomer.findByIdAndUpdate(id, data, { new: true }).populate('sponsorId', 'name sponsorCode mobile email photo signature');
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

  // ── PLOT COMMISSION CLOSING SYSTEM ──────────────────────────────

  /**
   * Helper to format/parse start and end date boundary for closing.
   * Start date at 00:00:00.000 UTC / local, End date at 23:59:59.999.
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
  async previewPlotClosing({ startDate, endDate, excludeClosingId = null }) {
    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate are required');
    }
    const { start, end } = this._normalizeClosingDateRange(startDate, endDate);

    // Sync all active bookings to ensure commission records exist for all collections
    const activeBookings = await PlotBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      sponsorId: { $ne: null }
    }).select('_id').lean();

    for (const b of activeBookings) {
      await this.syncBookingSponsorCommissions(b._id);
    }

    const query = {
      status: 'active',
      createdAt: { $gte: start, $lte: end },
    };

    if (excludeClosingId) {
      // When editing a closing, include commissions that are unclosed OR already in this closing
      query.$or = [{ closingId: null }, { closingId: excludeClosingId }];
    } else {
      query.closingId = null;
    }

    const commissions = await PlotSponsorCommission.find(query)
      .populate('sponsorId', 'name email sponsorCode customerId mobile sponsorId')
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId',
        populate: { path: 'plotId', select: 'plotNumber seriesId' }
      })
      .sort({ createdAt: 1 })
      .lean();

    let totalCollection = 0;
    let totalCommission = 0;
    let directBusinessTotal = 0;
    let directCommissionTotal = 0;
    let indirectBusinessTotal = 0;
    let indirectCommissionTotal = 0;

    const sponsorMap = {};

    commissions.forEach(c => {
      const sp = c.sponsorId;
      if (!sp || !sp._id) return;
      const spId = sp._id.toString();

      const colAmt = Number(c.collectionAmount || 0);
      const commAmt = Number(c.amount || 0);
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const isIndirect = c.commissionRole === 'DEVELOPER_OVERRIDE';

      totalCollection += colAmt;
      totalCommission += commAmt;

      if (!sponsorMap[spId]) {
        sponsorMap[spId] = {
          sponsorId: sp._id,
          sponsorName: sp.name || '',
          sponsorCode: sp.sponsorCode || '',
          customerId: sp.customerId || sp.sponsorCode || '',
          mobile: sp.mobile || '',
          isDeveloper: !sp.sponsorId,
          directBusiness: 0,
          directCommission: 0,
          indirectBusiness: 0,
          indirectCommission: 0,
          totalBusiness: 0,
          totalCommission: 0,
          transactionCount: 0,
          directRates: [],
          indirectRates: [],
          entries: [],
        };
      }

      const ratePct = Number(c.commissionPercent || 0);

      if (isDirect) {
        sponsorMap[spId].directBusiness += colAmt;
        sponsorMap[spId].directCommission += commAmt;
        if (ratePct > 0 && !sponsorMap[spId].directRates.includes(ratePct)) {
          sponsorMap[spId].directRates.push(ratePct);
        }
        directBusinessTotal += colAmt;
        directCommissionTotal += commAmt;
      } else if (isIndirect) {
        sponsorMap[spId].indirectBusiness += colAmt;
        sponsorMap[spId].indirectCommission += commAmt;
        if (ratePct > 0 && !sponsorMap[spId].indirectRates.includes(ratePct)) {
          sponsorMap[spId].indirectRates.push(ratePct);
        }
        indirectBusinessTotal += colAmt;
        indirectCommissionTotal += commAmt;
      }

      sponsorMap[spId].totalBusiness += colAmt;
      sponsorMap[spId].totalCommission += commAmt;
      sponsorMap[spId].transactionCount += 1;
      sponsorMap[spId].entries.push(c);
    });

    const sponsors = Object.values(sponsorMap).map(sp => {
      const directEffectivePct = sp.directBusiness > 0 ? +((sp.directCommission / sp.directBusiness) * 100).toFixed(2) : 0;
      const indirectEffectivePct = sp.indirectBusiness > 0 ? +((sp.indirectCommission / sp.indirectBusiness) * 100).toFixed(2) : 0;
      const totalEffectivePct = sp.totalBusiness > 0 ? +((sp.totalCommission / sp.totalBusiness) * 100).toFixed(2) : 0;
      return {
        ...sp,
        directEffectivePct,
        indirectEffectivePct,
        totalEffectivePct,
        directRatesStr: sp.directRates.length > 0 ? sp.directRates.map(r => `${r}%`).join(', ') : (directEffectivePct > 0 ? `${directEffectivePct}%` : '0%'),
        indirectRatesStr: sp.indirectRates.length > 0 ? sp.indirectRates.map(r => `${r}%`).join(', ') : (indirectEffectivePct > 0 ? `${indirectEffectivePct}%` : '2%'),
      };
    }).sort((a, b) => b.totalCommission - a.totalCommission);

    return {
      startDate: start,
      endDate: end,
      totalCollection: Math.round(totalCollection * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      directBusinessTotal: Math.round(directBusinessTotal * 100) / 100,
      directCommissionTotal: Math.round(directCommissionTotal * 100) / 100,
      indirectBusinessTotal: Math.round(indirectBusinessTotal * 100) / 100,
      indirectCommissionTotal: Math.round(indirectCommissionTotal * 100) / 100,
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
      // Calculate preview breakdown in period
      const preview = await this.previewPlotClosing({ startDate: start, endDate: end });

      if (preview.commissions.length === 0) {
        throw ApiError.badRequest('No unclosed commission or collection records found in the selected date range.');
      }

      // Generate sequence closing number
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
          totalBusiness: s.totalBusiness,
          totalCommission: s.totalCommission,
          directRatesStr: s.directRatesStr || '',
          directEffectivePct: s.directEffectivePct || 0,
          indirectRatesStr: s.indirectRatesStr || '',
          indirectEffectivePct: s.indirectEffectivePct || 0,
          totalEffectivePct: s.totalEffectivePct || 0,
          transactionCount: s.transactionCount,
        })),
        status: 'CLOSED',
        createdById: userId,
        remarks: remarks || '',
      });

      await closingDoc.save({ session });

      // Tag all included commission records with this closingId
      const commissionIds = preview.commissions.map(c => c._id);
      await PlotSponsorCommission.updateMany(
        { _id: { $in: commissionIds } },
        { $set: { closingId: closingDoc._id } }
      ).session(session);

      // Post CREDIT transaction to each sponsor's financial ledger
      for (const sp of closingDoc.sponsors) {
        if (sp.totalCommission > 0) {
          const directText = sp.directBusiness > 0 ? `Direct: ₹${sp.directBusiness.toLocaleString('en-IN')} (${sp.directRatesStr || `${sp.directEffectivePct}%`}) = ₹${sp.directCommission.toLocaleString('en-IN')}` : '';
          const indirectText = sp.indirectBusiness > 0 ? `Downline: ₹${sp.indirectBusiness.toLocaleString('en-IN')} (${sp.indirectRatesStr || `${sp.indirectEffectivePct}%`}) = ₹${sp.indirectCommission.toLocaleString('en-IN')}` : '';
          const parts = [directText, indirectText].filter(Boolean).join(' | ');
          const particular = `Commission credited for Closing ${closingDoc.closingNumber} (${closingDoc.closingName}) [Period: ${new Date(closingDoc.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${new Date(closingDoc.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}] — ${parts}`;

          await accountingService.recordLedgerEntry({
            sponsorId: sp.sponsorId,
            date: closingDoc.endDate || new Date(),
            type: 'CREDIT',
            amount: sp.totalCommission,
            source: 'commission_closing',
            referenceId: closingDoc._id,
            remarks: particular
          }, session);
        }
      }

      // Write audit log
      const log = new PlotAuditLog({
        action: 'CREATE_CLOSING',
        modelName: 'PlotClosing',
        documentId: closingDoc._id,
        userId,
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

  /**
   * Get list of all closing batches
   */
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

  /**
   * Get a single closing batch with detailed transactions
   */
  async getPlotClosingById(id) {
    const closing = await PlotClosing.findById(id).populate('createdById', 'name email').lean();
    if (!closing) {
      throw ApiError.notFound('Closing batch not found');
    }

    // Fetch linked commission records
    const commissions = await PlotSponsorCommission.find({ closingId: closing._id })
      .populate('sponsorId', 'name email sponsorCode customerId mobile sponsorId')
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId',
        populate: { path: 'plotId', select: 'plotNumber seriesId' }
      })
      .sort({ createdAt: 1 })
      .lean();

    return {
      ...closing,
      transactions: commissions,
    };
  }

  /**
   * Update closing batch dates or name.
   * Auto-reattributes commission records when date range changes.
   */
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
      // Calculate new preview with updated dates, allowing commissions already in this closing
      const preview = await this.previewPlotClosing({
        startDate: newStart,
        endDate: newEnd,
        excludeClosingId: closing._id,
      });

      // 1. Unlink commissions previously tagged to this closing that are now outside the new date range
      await PlotSponsorCommission.updateMany(
        { closingId: closing._id, createdAt: { $not: { $gte: newStart, $lte: newEnd } } },
        { $set: { closingId: null } }
      ).session(session);

      // 2. Link all valid commissions inside new date range
      const newCommissionIds = preview.commissions.map(c => c._id);
      if (newCommissionIds.length > 0) {
        await PlotSponsorCommission.updateMany(
          { _id: { $in: newCommissionIds } },
          { $set: { closingId: closing._id } }
        ).session(session);
      }

      // 3. Update closing document
      if (closingName) closing.closingName = closingName.trim();
      closing.startDate = newStart;
      closing.endDate = newEnd;
      closing.totalCollection = preview.totalCollection;
      closing.totalCommission = preview.totalCommission;
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
        directRatesStr: s.directRatesStr || '',
        directEffectivePct: s.directEffectivePct || 0,
        indirectBusiness: s.indirectBusiness,
        indirectCommission: s.indirectCommission,
        indirectRatesStr: s.indirectRatesStr || '',
        indirectEffectivePct: s.indirectEffectivePct || 0,
        totalBusiness: s.totalBusiness,
        totalCommission: s.totalCommission,
        totalEffectivePct: s.totalEffectivePct || 0,
        transactionCount: s.transactionCount,
      }));
      if (remarks !== undefined) closing.remarks = remarks;

      await closing.save({ session });

      // 4. Update Sponsor Ledger Entries for this closing batch
      // First remove previously posted entries for this closing
      const oldEntries = await Entry.find({ referenceId: closing._id, source: 'commission_closing' }).session(session);
      for (const oldEntry of oldEntries) {
        await accountingService.deleteLedgerEntry(oldEntry._id, session);
      }

      // Re-post updated CREDIT entries to sponsor ledgers
      for (const sp of closing.sponsors) {
        if (sp.totalCommission > 0) {
          const directText = sp.directBusiness > 0 ? `Direct: ₹${sp.directBusiness.toLocaleString('en-IN')} (${sp.directRatesStr || `${sp.directEffectivePct}%`}) = ₹${sp.directCommission.toLocaleString('en-IN')}` : '';
          const indirectText = sp.indirectBusiness > 0 ? `Downline: ₹${sp.indirectBusiness.toLocaleString('en-IN')} (${sp.indirectRatesStr || `${sp.indirectEffectivePct}%`}) = ₹${sp.indirectCommission.toLocaleString('en-IN')}` : '';
          const parts = [directText, indirectText].filter(Boolean).join(' | ');
          const particular = `Commission credited for Closing ${closing.closingNumber} (${closing.closingName}) [Period: ${new Date(closing.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${new Date(closing.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}] — ${parts}`;

          await accountingService.recordLedgerEntry({
            sponsorId: sp.sponsorId,
            date: closing.endDate || new Date(),
            type: 'CREDIT',
            amount: sp.totalCommission,
            source: 'commission_closing',
            referenceId: closing._id,
            remarks: particular
          }, session);
        }
      }

      // Audit log
      const log = new PlotAuditLog({
        action: 'UPDATE_CLOSING',
        modelName: 'PlotClosing',
        documentId: closing._id,
        userId,
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

  /**
   * Delete / Reverse a closing batch.
   * Completely unlinks all associated commissions so they return to open unclosed state.
   */
  async deletePlotClosing(id, userId) {
    const closing = await PlotClosing.findById(id);
    if (!closing) {
      throw ApiError.notFound('Closing batch not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Reverse & delete all associated financial ledger entries
      const oldEntries = await Entry.find({ referenceId: closing._id, source: 'commission_closing' }).session(session);
      for (const oldEntry of oldEntries) {
        await accountingService.deleteLedgerEntry(oldEntry._id, session);
      }

      // 2. Unlink all commission records associated with this closing
      await PlotSponsorCommission.updateMany(
        { closingId: closing._id },
        { $set: { closingId: null } }
      ).session(session);

      // 3. Audit log
      const log = new PlotAuditLog({
        action: 'DELETE_CLOSING',
        modelName: 'PlotClosing',
        documentId: closing._id,
        userId,
        details: {
          closingName: closing.closingName,
          closingNumber: closing.closingNumber,
          startDate: closing.startDate,
          endDate: closing.endDate,
          totalCommission: closing.totalCommission,
        },
      });
      await log.save({ session });

      // 4. Remove closing document
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

module.exports = new PlotsService();
