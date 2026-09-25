const mongoose = require('mongoose');
const PlotSeriesMaster = require('../../models/PlotSeriesMaster');
const Plot = require('../../models/Plot');
const PlotProject = require('../../models/PlotProject');
const PlotBooking = require('../../models/PlotBooking');
const PlotRateConfiguration = require('../../models/PlotRateConfiguration');
const PlotAuditLog = require('../../models/PlotAuditLog');
const ApiError = require('../../utils/apiError');
const plotConfigService = require('./plotConfig.service');

class PlotInventoryService {
  // ── SERIES MASTER & BULK PLOT GENERATION ────────────────────────
  async createSeries(data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { name, prefix, startNumber, endNumber, plotArea, defaultPlotType, defaultPremiumHeads, numberFormat, remarks, defaultDimensions, defaultBoundaries, dpGracePeriodDays, emiGracePeriodDays, gracePeriodDays, lateFineFrequency, lateFineRate, lateFineDailyPercent } = data;

      // Get current rate configuration
      const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).session(session) || {
        baseSqFtRate: 500,
        cornerExtraPercent: 20,
        dpGracePeriodDays: 15,
        emiGracePeriodDays: 15,
        lateFineGraceDays: 15,
        lateFineFrequency: 'YEARLY',
        lateFineRate: 24,
        lateFineDailyPercent: 24 / 365,
      };

      const resolvedDpGrace = dpGracePeriodDays !== undefined && dpGracePeriodDays !== '' ? Math.max(0, Number(dpGracePeriodDays)) : (rateConfig.dpGracePeriodDays ?? rateConfig.lateFineGraceDays ?? 15);
      const resolvedEmiGrace = emiGracePeriodDays !== undefined && emiGracePeriodDays !== '' ? Math.max(0, Number(emiGracePeriodDays)) : (gracePeriodDays !== undefined && gracePeriodDays !== '' ? Math.max(0, Number(gracePeriodDays)) : (rateConfig.emiGracePeriodDays ?? rateConfig.lateFineGraceDays ?? 15));
      const resolvedFreq = lateFineFrequency || rateConfig.lateFineFrequency || 'YEARLY';
      const resolvedRate = lateFineRate !== undefined && lateFineRate !== '' ? Math.max(0, Number(lateFineRate)) : (rateConfig.lateFineRate ?? 24);
      let resolvedDailyPercent = 24 / 365;
      if (resolvedFreq === 'YEARLY') resolvedDailyPercent = resolvedRate / 365;
      else if (resolvedFreq === 'MONTHLY') resolvedDailyPercent = resolvedRate / 30;
      else resolvedDailyPercent = resolvedRate;

      let resolvedProjectId = data.projectId || null;
      let resolvedProjectName = data.projectName || '';
      if (resolvedProjectId && !resolvedProjectName) {
        const proj = await PlotProject.findById(resolvedProjectId).session(session);
        if (proj) resolvedProjectName = proj.name;
      } else if (!resolvedProjectId && resolvedProjectName) {
        const proj = await PlotProject.findOne({ name: { $regex: `^${resolvedProjectName.trim()}$`, $options: 'i' } }).session(session);
        if (proj) {
          resolvedProjectId = proj._id;
          resolvedProjectName = proj.name;
        }
      }

      // Create series master
      const series = new PlotSeriesMaster({
        name,
        projectId: resolvedProjectId,
        projectName: resolvedProjectName,
        prefix,
        startNumber,
        endNumber,
        plotArea,
        defaultPlotType: defaultPlotType || 'NORMAL',
        defaultPremiumHeads: Array.isArray(defaultPremiumHeads) ? defaultPremiumHeads : [],
        numberFormat,
        defaultDimensions: defaultDimensions || {},
        defaultBoundaries: defaultBoundaries || {},
        remarks,
        dpGracePeriodDays: resolvedDpGrace,
        emiGracePeriodDays: resolvedEmiGrace,
        gracePeriodDays: resolvedEmiGrace,
        lateFineFrequency: resolvedFreq,
        lateFineRate: resolvedRate,
        lateFineDailyPercent: resolvedDailyPercent,
      });
      await series.save({ session });

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

        // Calculate rate based on premium heads or type
        const multiplier = plotConfigService.calculatePlotMultiplier({ defaultPlotType, defaultPremiumHeads }, rateConfig);
        const effectiveRate = Math.round(baseRate * multiplier * 100) / 100;
        const totalPlotValue = Math.round(plotArea * effectiveRate);

        plotsToCreate.push({
          plotNumber,
          seriesId: series._id,
          projectId: resolvedProjectId,
          projectName: resolvedProjectName,
          sequenceNumber: i,
          plotSize: plotArea,
          plotType: defaultPlotType || 'NORMAL',
          premiumHeads: Array.isArray(defaultPremiumHeads) ? defaultPremiumHeads : [],
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
    if (data.dpGracePeriodDays !== undefined && data.dpGracePeriodDays !== '') {
      series.dpGracePeriodDays = Math.max(0, Number(data.dpGracePeriodDays));
    }
    if (data.emiGracePeriodDays !== undefined && data.emiGracePeriodDays !== '') {
      series.emiGracePeriodDays = Math.max(0, Number(data.emiGracePeriodDays));
      series.gracePeriodDays = series.emiGracePeriodDays;
    } else if (data.gracePeriodDays !== undefined && data.gracePeriodDays !== '') {
      series.gracePeriodDays = Math.max(0, Number(data.gracePeriodDays));
      series.emiGracePeriodDays = series.gracePeriodDays;
    }
    if (data.defaultPremiumHeads !== undefined && Array.isArray(data.defaultPremiumHeads)) {
      series.defaultPremiumHeads = data.defaultPremiumHeads;
    }
    if (data.lateFineFrequency !== undefined && data.lateFineFrequency !== '') {
      series.lateFineFrequency = ['DAILY', 'MONTHLY', 'YEARLY'].includes(data.lateFineFrequency) ? data.lateFineFrequency : 'YEARLY';
    }
    if (data.lateFineRate !== undefined && data.lateFineRate !== '') {
      series.lateFineRate = Math.max(0, Number(data.lateFineRate));
      const freq = series.lateFineFrequency || 'YEARLY';
      if (freq === 'YEARLY') series.lateFineDailyPercent = series.lateFineRate / 365;
      else if (freq === 'MONTHLY') series.lateFineDailyPercent = series.lateFineRate / 30;
      else series.lateFineDailyPercent = series.lateFineRate;
    } else if (data.lateFineDailyPercent !== undefined && data.lateFineDailyPercent !== '') {
      series.lateFineDailyPercent = Math.max(0, Number(data.lateFineDailyPercent));
    }

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

        const multiplier = plotConfigService.calculatePlotMultiplier(series, rateConfig);
        const effectiveRate = Math.round(baseRate * multiplier * 100) / 100;
        const totalPlotValue = Math.round(series.plotArea * effectiveRate);

        await new Plot({
          plotNumber,
          seriesId: series._id,
          sequenceNumber: i,
          plotSize: series.plotArea,
          plotType: series.defaultPlotType || 'NORMAL',
          premiumHeads: Array.isArray(series.defaultPremiumHeads) ? series.defaultPremiumHeads : [],
          dimensions: series.defaultDimensions || { north: 0, south: 0, east: 0, west: 0 },
          boundaries: series.defaultBoundaries || { north: '', south: '', east: '', west: '' },
          baseRate,
          effectiveRate,
          totalPlotValue,
          status: 'AVAILABLE',
        }).save();
      } else if (plot.status === 'AVAILABLE' || plot.status === 'HOLD') {
        // When series defaults are updated, propagate to all active unbooked plots
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
        if (data.defaultPremiumHeads !== undefined && Array.isArray(data.defaultPremiumHeads)) {
          plot.premiumHeads = data.defaultPremiumHeads;
        }

        const multiplier = plotConfigService.calculatePlotMultiplier(plot, rateConfig);
        plot.effectiveRate = Math.round((plot.baseRate || baseRate) * multiplier * 100) / 100;
        plot.totalPlotValue = Math.round(plot.plotSize * plot.effectiveRate);
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
    if (filters.projectId) query.projectId = filters.projectId;
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
        .limit(limit)
        .lean(),
      Plot.countDocuments(query),
    ]);

    // Attach active booking and land sourcing details for booked/held plots
    const bookedPlotIds = plots
      .filter((p) => p.status === 'BOOKED' || p.status === 'HOLD' || p.status === 'REGISTERED')
      .map((p) => p._id);

    if (bookedPlotIds.length > 0) {
      const activeBookings = await PlotBooking.find({
        plotId: { $in: bookedPlotIds },
        status: { $ne: 'CANCELLED' },
      })
        .select('bookingNumber customerName customerMobile sponsorName landSourcing status bookingDate plotId')
        .populate('customerId', 'name mobile customerId customerCode')
        .lean();

      const bookingMap = new Map();
      for (const b of activeBookings) {
        bookingMap.set(String(b.plotId), b);
      }

      const orphanedPlotIds = [];
      for (const p of plots) {
        const b = bookingMap.get(String(p._id));
        if (b) {
          p.activeBooking = {
            _id: b._id,
            bookingNumber: b.bookingNumber,
            customerName: b.customerId?.name || b.customerName,
            customerMobile: b.customerId?.mobile || b.customerMobile,
            customerCode: b.customerId?.customerCode || b.customerId?.customerId,
            landSourcing: b.landSourcing || [],
            status: b.status,
            bookingDate: b.bookingDate,
          };
        } else if (p.status === 'BOOKED' || p.status === 'HOLD') {
          p.status = 'AVAILABLE';
          orphanedPlotIds.push(p._id);
        }
      }

      if (orphanedPlotIds.length > 0) {
        Plot.updateMany({ _id: { $in: orphanedPlotIds } }, { $set: { status: 'AVAILABLE' } }).catch((err) => {
          console.error('Failed to reconcile orphaned plot status:', err);
        });
      }
    }

    return {
      plots,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createPlot(data, userId) {
    const { seriesId, plotNumber, plotSize, plotType, premiumHeads, baseRate, sequenceNumber, remarks, dimensions, boundaries } = data;
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

    const rateConfig = await plotConfigService.getRateConfig();
    const resolvedBaseRate = baseRate !== undefined && baseRate !== '' ? Number(baseRate) : rateConfig.baseSqFtRate;
    const resolvedPlotType = plotType === 'CORNER' ? 'CORNER' : 'NORMAL';
    const resolvedPremiumHeads = Array.isArray(premiumHeads) ? premiumHeads : (resolvedPlotType === 'CORNER' ? [{ name: 'Corner Plot', extraPercent: rateConfig.cornerExtraPercent ?? 20 }] : []);

    const multiplier = plotConfigService.calculatePlotMultiplier({ plotType: resolvedPlotType, premiumHeads: resolvedPremiumHeads }, rateConfig);
    const effectiveRate = Math.round(resolvedBaseRate * multiplier * 100) / 100;
    const totalPlotValue = Math.round(Number(plotSize) * effectiveRate);

    const newPlot = new Plot({
      plotNumber: cleanPlotNumber,
      seriesId: series ? series._id : undefined,
      sequenceNumber: seq,
      plotSize: Number(plotSize),
      plotType: resolvedPlotType,
      premiumHeads: resolvedPremiumHeads,
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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Plot not found');
    }
    const plot = await Plot.findById(id).populate('seriesId');
    if (!plot) throw ApiError.notFound('Plot not found');
    return plot;
  }

  async updatePlot(id, data, userId) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Plot not found');
    }
    const plot = await Plot.findById(id);
    if (!plot) throw ApiError.notFound('Plot not found');
    
    const isBookedOrRegistered = plot.status === 'BOOKED' || plot.status === 'REGISTERED';

    if (isBookedOrRegistered) {
      const isAttemptingFinancialChange =
        (data.plotSize !== undefined && Number(data.plotSize) !== plot.plotSize) ||
        (data.plotType !== undefined && data.plotType !== plot.plotType) ||
        (data.premiumHeads !== undefined && JSON.stringify(data.premiumHeads) !== JSON.stringify(plot.premiumHeads || [])) ||
        (data.baseRate !== undefined && Number(data.baseRate) !== plot.baseRate);

      if (isAttemptingFinancialChange) {
        throw ApiError.badRequest(
          `Cannot modify size, rate, or premium heads for Plot ${plot.plotNumber} because it is currently ${plot.status}. Adjustments must be made through the Booking / Agreement module.`
        );
      }

      if (data.remarks !== undefined) plot.remarks = data.remarks;
      if (data.dimensions !== undefined) plot.dimensions = data.dimensions;
      if (data.boundaries !== undefined) plot.boundaries = data.boundaries;
      await plot.save();
      return plot;
    }

    if (data.plotType !== undefined) plot.plotType = data.plotType;
    if (data.premiumHeads !== undefined && Array.isArray(data.premiumHeads)) {
      plot.premiumHeads = data.premiumHeads;
      const hasCorner = data.premiumHeads.some(h => /corner/i.test(h.name));
      plot.plotType = hasCorner ? 'CORNER' : 'NORMAL';
    }
    plot.plotSize = data.plotSize ?? plot.plotSize;
    plot.baseRate = data.baseRate ?? plot.baseRate;
    if (data.dimensions !== undefined) plot.dimensions = data.dimensions;
    if (data.boundaries !== undefined) plot.boundaries = data.boundaries;

    // Recalculate values
    const rateConfig = await plotConfigService.getRateConfig();
    const multiplier = plotConfigService.calculatePlotMultiplier(plot, rateConfig);

    plot.effectiveRate = Math.round(plot.baseRate * multiplier * 100) / 100;
    plot.totalPlotValue = Math.round(plot.plotSize * plot.effectiveRate);
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
}

module.exports = new PlotInventoryService();
