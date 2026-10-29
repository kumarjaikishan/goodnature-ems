const mongoose = require('mongoose');
const ApiError = require('../../utils/apiError');
const PlotProduct = require('../../models/PlotProduct');
const PlotProject = require('../../models/PlotProject');
const PlotProductBooking = require('../../models/PlotProductBooking');
const PlotCustomer = require('../../models/PlotCustomer');
const User = require('../../models/user');
const Counter = require('../../models/Counter');
const InvestmentSchemeConfig = require('../../models/InvestmentSchemeConfig');
const PlotReceipt = require('../../models/PlotReceipt');
const PlotRateConfiguration = require('../../models/PlotRateConfiguration');
const PlotAuditLog = require('../../models/PlotAuditLog');
const PlotSponsorCommission = require('../../models/PlotSponsorCommission');
const KisanLandAgreement = require('../../models/KisanLandAgreement');
const LandStockLedger = require('../../models/LandStockLedger');
const Voucher = require('../../models/voucher');
const Plot = require('../../models/Plot');
const Branch = require('../../models/branch');
const Ledger = require('../../models/ledger');
const Entry = require('../../models/entry');
const accountingService = require('../accountingService');
const plotDeveloperService = require('./plotDeveloper.service');
const { disburseRefundTransaction } = require('./plotRefundHelper');

class PlotProductService {

  // ─── LATE FINE & RATE CONFIGURATION ──────────────────────────────

  async getRateConfig() {
    let dpGracePeriod = 15;
    let emiGracePeriod = 15;
    let lateFineDailyPercent = 24 / 365;
    let lateFineRate = 24;
    let lateFineFrequency = 'YEARLY';

    try {
      const rateConfig = await PlotRateConfiguration.findOne({ status: 'active' }).lean();
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
        if (rateConfig.lateFineFrequency) lateFineFrequency = rateConfig.lateFineFrequency;
        if (rateConfig.lateFineRate !== undefined && rateConfig.lateFineRate !== null) {
          lateFineRate = Number(rateConfig.lateFineRate);
          if (lateFineFrequency === 'YEARLY') lateFineDailyPercent = lateFineRate / 365;
          else if (lateFineFrequency === 'MONTHLY') lateFineDailyPercent = lateFineRate / 30;
          else lateFineDailyPercent = lateFineRate;
        } else if (rateConfig.lateFineDailyPercent !== undefined && rateConfig.lateFineDailyPercent !== null) {
          lateFineDailyPercent = rateConfig.lateFineDailyPercent;
        }
      }
    } catch (e) {
      // Use defaults
    }

    return { dpGracePeriod, emiGracePeriod, lateFineDailyPercent, lateFineRate, lateFineFrequency };
  }

  computeInstallmentStats(inst, rateConfig, calculationDate = new Date()) {
    if (!inst || !inst.dueDate) {
      return {
        principalDue: 0,
        lateFine: 0,
        lateDays: 0,
        isOverdue: false,
      };
    }

    const principalDue = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0));
    const isPaid = inst.status === 'PAID' || principalDue <= 0;

    if (isPaid) {
      const storedUnpaidFine = Math.max(0, (inst.lateFine || 0) - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
      return {
        principalDue: 0,
        lateFine: storedUnpaidFine,
        lateDays: inst.lateDays || 0,
        isOverdue: false,
      };
    }

    const { emiGracePeriod, lateFineDailyPercent } = rateConfig;
    const rateMultiplier = (Number(lateFineDailyPercent) || (24 / 365)) / 100;
    const calcDate = new Date(calculationDate);
    const d2 = new Date(calcDate.getFullYear(), calcDate.getMonth(), calcDate.getDate());

    let newlyAccruedFine = 0;
    let lateDays = 0;
    let isOverdue = false;

    if (!inst.paidDate || !inst.paidAmount) {
      const due = new Date(inst.dueDate);
      const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      if (diffDays > 0) {
        isOverdue = true;
      }
      if (diffDays > emiGracePeriod) {
        lateDays = diffDays;
        newlyAccruedFine = Math.round(principalDue * rateMultiplier * diffDays);
      }
    } else {
      const lastPaid = new Date(inst.paidDate);
      const d1 = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
      const diffTime = d2 - d1;
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      if (diffDays > 0) {
        isOverdue = true;
        lateDays = diffDays;
        newlyAccruedFine = Math.round(principalDue * rateMultiplier * diffDays);
      }
    }

    const storedUnpaidFine = Math.max(0, (inst.lateFine || 0) - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
    const totalLateFine = storedUnpaidFine + newlyAccruedFine;

    return {
      principalDue,
      lateFine: totalLateFine,
      lateDays,
      isOverdue,
    };
  }

  enrichBookingWithDues(booking, rateConfig, calculationDate = new Date()) {
    if (!booking) return booking;
    const installments = booking.installments || [];

    let totalOverduePrincipal = 0;
    let totalAccruedLateFine = 0;
    let overdueCount = 0;
    let pendingCount = 0;
    let nextUpcomingInstallment = null;

    const enrichedInstallments = installments.map((ins) => {
      const stats = this.computeInstallmentStats(ins, rateConfig, calculationDate);
      if (ins.status !== 'PAID') {
        pendingCount += 1;
        if (stats.isOverdue && stats.principalDue > 0) {
          overdueCount += 1;
          totalOverduePrincipal += stats.principalDue;
        } else if (!nextUpcomingInstallment) {
          nextUpcomingInstallment = ins;
        }
      }
      totalAccruedLateFine += stats.lateFine;

      return {
        ...ins,
        computedPrincipalDue: stats.principalDue,
        computedLateFine: stats.lateFine,
        computedLateDays: stats.lateDays,
        isOverdue: stats.isOverdue,
      };
    });

    const totalDueToday = totalOverduePrincipal + totalAccruedLateFine;

    return {
      ...booking,
      installments: enrichedInstallments,
      rateConfig,
      overdueCount,
      pendingCount,
      totalOverduePrincipal,
      totalAccruedLateFine,
      totalDueToday,
      nextUpcomingInstallment,
    };
  }
  // ─── PRODUCT MASTER CRUD ──────────────────────────────────────────

  async getProducts(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.projectId) filter.projectId = query.projectId;
    if (query.search) {
      const q = query.search.trim();
      filter.$or = [
        { productName: { $regex: q, $options: 'i' } },
        { productCode: { $regex: q, $options: 'i' } },
        { dimensionLabel: { $regex: q, $options: 'i' } },
        { projectName: { $regex: q, $options: 'i' } },
      ];
    }

    return PlotProduct.find(filter)
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getProductById(id) {
    const product = await PlotProduct.findById(id).populate('createdById', 'name email').lean();
    if (!product) {
      throw ApiError.notFound('Plot product not found');
    }
    return product;
  }

  async createProduct(data, userId) {
    const {
      productName,
      north = 1,
      south = 1,
      east = 2,
      west = 2,
      unit = 'feet',
      areaSqFt,
      unitPrice = 5000,
      totalUnitsAvailable = 1000,
      description = '',
      category = 'MICRO_PLOT',
    } = data;

    if (!productName || !productName.trim()) {
      throw ApiError.badRequest('Product Name is required');
    }

    const n = Number(north) || 0;
    const s = Number(south) || 0;
    const e = Number(east) || 0;
    const w = Number(west) || 0;
    const price = Number(unitPrice);
    if (price <= 0) {
      throw ApiError.badRequest('Unit price must be greater than 0');
    }

    // Auto-compute area if not provided (average width * average length)
    const avgLen = (n + s) / 2 || 1;
    const avgWidth = (e + w) / 2 || 2;
    const computedArea = areaSqFt !== undefined && areaSqFt !== '' ? Number(areaSqFt) : Math.round(avgLen * avgWidth * 100) / 100;
    const dimensionLabel = `${n} ${unit} x ${e} ${unit} (N/S: ${n} ${unit}, E/W: ${e} ${unit})`;

    // Generate product code
    const seq = await Counter.getNextSequence('PLOT_PRODUCT_CODE', null, 3);
    const productCode = `PRD-${seq}`;

    let resolvedProjectId = data.projectId || null;
    let resolvedProjectName = data.projectName || '';
    if (resolvedProjectId && !resolvedProjectName) {
      const proj = await PlotProject.findById(resolvedProjectId);
      if (proj) resolvedProjectName = proj.name;
    } else if (!resolvedProjectId && resolvedProjectName) {
      const proj = await PlotProject.findOne({ name: { $regex: `^${resolvedProjectName.trim()}$`, $options: 'i' } });
      if (proj) {
        resolvedProjectId = proj._id;
        resolvedProjectName = proj.name;
      }
    }

    if (!resolvedProjectId) {
      throw ApiError.badRequest('Project selection is required. Please choose a valid Project.');
    }

    const product = new PlotProduct({
      productName: productName.trim(),
      productCode,
      category: category.trim(),
      projectId: resolvedProjectId,
      projectName: resolvedProjectName,
      dimensions: {
        north: n,
        south: s,
        east: e,
        west: w,
        unit: unit || 'feet',
      },
      dimensionLabel,
      areaSqFt: computedArea,
      unitPrice: price,
      totalUnitsAvailable: Number(totalUnitsAvailable) || 1000,
      unitsSold: 0,
      description: description.trim(),
      status: 'ACTIVE',
      createdById: userId,
    });

    await product.save();
    return product;
  }

  async updateProduct(id, data) {
    const product = await PlotProduct.findById(id);
    if (!product) {
      throw ApiError.notFound('Plot product not found');
    }

    if (data.productName) product.productName = data.productName.trim();
    if (data.category) product.category = data.category.trim();
    if (data.description !== undefined) product.description = data.description.trim();
    if (data.status) product.status = data.status;

    if (data.projectId !== undefined) {
      if (!data.projectId) {
        throw ApiError.badRequest('Project selection is required. Please choose a valid Project.');
      }
      product.projectId = data.projectId;
      if (data.projectName) {
        product.projectName = data.projectName.trim();
      } else {
        const proj = await PlotProject.findById(data.projectId);
        if (proj) product.projectName = proj.name;
      }
    } else if (data.projectName !== undefined) {
      const pName = data.projectName ? data.projectName.trim() : '';
      if (!pName) {
        throw ApiError.badRequest('Project selection is required. Please choose a valid Project.');
      }
      const proj = await PlotProject.findOne({ name: { $regex: `^${pName}$`, $options: 'i' } });
      if (!proj) {
        throw ApiError.badRequest(`Project "${pName}" not found.`);
      }
      product.projectId = proj._id;
      product.projectName = proj.name;
    }

    if (data.unitPrice !== undefined) {
      const price = Number(data.unitPrice);
      if (price <= 0) throw ApiError.badRequest('Unit price must be greater than 0');
      product.unitPrice = price;
    }

    if (data.totalUnitsAvailable !== undefined) {
      product.totalUnitsAvailable = Math.max(product.unitsSold, Number(data.totalUnitsAvailable) || 0);
    }

    if (data.north !== undefined || data.south !== undefined || data.east !== undefined || data.west !== undefined) {
      const n = data.north !== undefined ? Number(data.north) : product.dimensions.north;
      const s = data.south !== undefined ? Number(data.south) : product.dimensions.south;
      const e = data.east !== undefined ? Number(data.east) : product.dimensions.east;
      const w = data.west !== undefined ? Number(data.west) : product.dimensions.west;
      const unit = data.unit || product.dimensions.unit || 'feet';

      product.dimensions = { north: n, south: s, east: e, west: w, unit };
      const avgLen = (n + s) / 2 || 1;
      const avgWidth = (e + w) / 2 || 2;
      product.areaSqFt = data.areaSqFt !== undefined ? Number(data.areaSqFt) : Math.round(avgLen * avgWidth * 100) / 100;
      product.dimensionLabel = `${n} ${unit} x ${e} ${unit} (N/S: ${n} ${unit}, E/W: ${e} ${unit})`;
    } else if (data.areaSqFt !== undefined) {
      product.areaSqFt = Number(data.areaSqFt);
    }

    await product.save();
    return product;
  }

  async deleteProduct(id) {
    const bookingsCount = await PlotProductBooking.countDocuments({ productId: id });
    if (bookingsCount > 0) {
      throw ApiError.badRequest(`Cannot delete product. ${bookingsCount} active booking/sales exist for this product.`);
    }

    const product = await PlotProduct.findByIdAndDelete(id);
    if (!product) {
      throw ApiError.notFound('Plot product not found');
    }
    return { message: 'Plot product deleted successfully' };
  }

  // ─── AVAILABLE TENURE SLABS (from RD/FD Scheme Config) ─────────────

  async getAvailableTenures() {
    const config = await InvestmentSchemeConfig.findOne({ status: 'active' }).lean();
    if (config && config.slabs && config.slabs.length > 0) {
      return config.slabs.map((s) => ({
        _id: s._id ? String(s._id) : undefined,
        planName: s.planName || '',
        planType:
          s.planType ||
          (Number(s.rdMaturityPercent) === 0 && Number(s.fdMaturityPercent) === 0
            ? 'REGISTRY_SALE'
            : 'INVESTMENT_BUYBACK'),
        annualInterestRate: s.annualInterestRate ?? s.rdAnnualInterestRate ?? 10.5,
        rdAnnualInterestRate: s.rdAnnualInterestRate ?? s.annualInterestRate ?? 10.5,
        fdAnnualInterestRate: s.fdAnnualInterestRate ?? s.annualInterestRate ?? 10.5,
        tenureMonths: s.tenureMonths,
        rdMaturityPercent: s.rdMaturityPercent,
        fdMaturityPercent: s.fdMaturityPercent,
        rdPromoterCommissionPercent: Number(s.rdPromoterCommissionPercent ?? 4.0),
        fdPromoterCommissionPercent: Number(s.fdPromoterCommissionPercent ?? 5.0),
        bpRdCommissionPercent: Number(s.bpRdCommissionPercent ?? 1.0),
        bpFdCommissionPercent: Number(s.bpFdCommissionPercent ?? 1.0),
        branchRdCommissionPercent: Number(s.branchRdCommissionPercent ?? 0),
        branchFdCommissionPercent: Number(s.branchFdCommissionPercent ?? 0),
        developerCommissionPercent: Number(s.developerCommissionPercent ?? 1.0),
        showInAddBooking: Boolean(s.showInAddBooking),
      }));
    }
    // Standard default tenures fallback
    return [
      { tenureMonths: 12, rdMaturityPercent: 106, fdMaturityPercent: 110 },
      { tenureMonths: 24, rdMaturityPercent: 112, fdMaturityPercent: 121 },
      { tenureMonths: 36, rdMaturityPercent: 118, fdMaturityPercent: 133 },
      { tenureMonths: 48, rdMaturityPercent: 124, fdMaturityPercent: 145 },
      { tenureMonths: 60, rdMaturityPercent: 130, fdMaturityPercent: 160 },
    ];
  }

  // ─── PRODUCT SALES & BOOKINGS ─────────────────────────────────────

  async getProductBookings(query = {}) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.productId) filter.productId = query.productId;
    if (query.sponsorId) filter.sponsorId = query.sponsorId;
    if (query.plotId) filter.plotId = query.plotId;

    if (query.search) {
      const q = query.search.trim();
      filter.$or = [
        { bookingNumber: { $regex: q, $options: 'i' } },
      ];
    }

    const bookings = await PlotProductBooking.find(filter)
      .populate('productId', 'productName productCode dimensions dimensionLabel areaSqFt unitPrice')
      .populate('plotId', 'plotNumber plotSize plotType seriesId dimensions')
      .populate('projectId', 'name code location')
      .populate('customerId', 'name customerId customerCode mobile email address fatherOrHusbandName')
      .populate('landSourcing.agreementId', 'agreementNumber mauja khataNumber khesraNumber thanaNumber')
      .populate({
        path: 'sponsorId',
        select: 'name sponsorCode mobile email photo sponsorId',
        populate: {
          path: 'sponsorId',
          select: 'name sponsorCode mobile',
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const rateConfig = await this.getRateConfig();
    const calculationDate = new Date();

    return bookings.map((b) => this.enrichBookingWithDues(b, rateConfig, calculationDate));
  }

  async getProductBookingById(id) {
    const booking = await PlotProductBooking.findById(id)
      .populate('productId')
      .populate('plotId')
      .populate('projectId', 'name code location')
      .populate('customerId')
      .populate('landSourcing.agreementId', 'agreementNumber mauja khataNumber khesraNumber thanaNumber')
      .populate({
        path: 'sponsorId',
        select: 'name sponsorCode mobile email photo sponsorId',
        populate: {
          path: 'sponsorId',
          select: 'name sponsorCode mobile',
        },
      })
      .populate('createdById', 'name email')
      .lean();

    if (!booking) {
      throw ApiError.notFound('Product booking not found');
    }

    const rateConfig = await this.getRateConfig();
    return this.enrichBookingWithDues(booking, rateConfig, new Date());
  }

  async createProductBooking(data, userId) {
    const {
      productId,
      plotId = null,
      customerId,
      quantity = 1,
      customUnitPrice,
      tenureMonths = 24,
      paymentType = 'MONTHLY_INSTALLMENT',
      downPayment = 0,
      downpaymentAmount,
      downpaymentDays = 90,
      downpaymentMonths,
      emiFrequency = 'MONTHLY',
      installmentCount,
      dpType = 'PERCENT',
      dpVal = 0,
      bookingDate = new Date(),
      remarks = '',
      landSourcing = [],
    } = data;

    if (!productId) throw ApiError.badRequest('Product is required');
    if (!customerId) throw ApiError.badRequest('Customer is required');

    const product = await PlotProduct.findById(productId);
    if (!product || product.status !== 'ACTIVE') {
      throw ApiError.badRequest('Active plot product not found');
    }

    const customer = await PlotCustomer.findById(customerId);
    if (!customer) {
      throw ApiError.badRequest('Customer not found');
    }

    // Auto-link customer's assigned Business Associate
    const sponsorId = customer.sponsorId || null;

    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = customUnitPrice !== undefined && Number(customUnitPrice) > 0
      ? Number(customUnitPrice)
      : product.unitPrice;

    const totalAmount = Math.round(qty * unitPrice * 100) / 100;

    // Support custom dimension calculation: e.g. 30 North-South x 40 East-West = 1200 Sq.Ft
    const customDims = data.customDimensions || (data.dimensionsSnapshot ? data.dimensionsSnapshot : null);
    const customArea = (customDims?.northSouth && customDims?.eastWest)
      ? Math.round(Number(customDims.northSouth) * Number(customDims.eastWest) * 100) / 100
      : (customDims?.totalAreaSqFt ? Number(customDims.totalAreaSqFt) : (Number(data.totalAreaSqFt) || null));

    const totalArea = customArea || Math.round(qty * (product.areaSqFt || 2) * 100) / 100;
    const isFullPayment = paymentType === 'FULL_PAYMENT';
    const resolvedDpDays = Number(downpaymentDays) || (Number(downpaymentMonths) ? Number(downpaymentMonths) * 30 : 90);
    const resolvedDpMonths = downpaymentMonths !== undefined ? Number(downpaymentMonths) : Math.max(1, Math.round(resolvedDpDays / 30));

    const emiFreq = emiFrequency || 'MONTHLY';
    const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;
    const numInstallments = Number(installmentCount) || 0;
    const resolvedTenure = tenureMonths !== undefined
      ? Number(tenureMonths)
      : (isFullPayment ? 0 : (numInstallments > 0 ? numInstallments * freqMultiplier : 24));

    let dp = 0;
    if (isFullPayment) {
      dp = totalAmount;
    } else {
      const explicitDp = downpaymentAmount !== undefined
        ? Number(downpaymentAmount)
        : (downPayment !== undefined ? Number(downPayment) : 0);
      dp = Math.min(totalAmount, Math.max(0, explicitDp));
    }

    const remainingAmount = isFullPayment ? 0 : Math.max(0, totalAmount - dp);
    const count = isFullPayment ? 0 : (numInstallments > 0 ? numInstallments : Math.max(1, Math.round(resolvedTenure / freqMultiplier)));
    const emiPerInstallment = (count > 0 && remainingAmount > 0) ? Math.round(remainingAmount / count) : 0;
    const monthlyEmi = emiPerInstallment;

    // Process & Deduct Land Stock from KisanLandAgreement if provided
    const processedSourcing = [];
    if (Array.isArray(landSourcing) && landSourcing.length > 0) {
      for (const item of landSourcing) {
        const numSqFt = Number(item.allocatedSqFt) || 0;
        if (numSqFt <= 0) continue;

        const agr = await KisanLandAgreement.findById(item.agreementId);
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

        let selectedParcel = null;
        if (item.parcelId && Array.isArray(agr.landParcels)) {
          selectedParcel = agr.landParcels.find((p) => String(p._id) === String(item.parcelId));
        } else if (item.khesraNumber && Array.isArray(agr.landParcels)) {
          selectedParcel = agr.landParcels.find((p) => p.khesraNumber === item.khesraNumber);
        }

        if (selectedParcel) {
          selectedParcel.allocatedSqFt = (selectedParcel.allocatedSqFt || 0) + numSqFt;
          selectedParcel.availableSqFt = Math.max(0, (selectedParcel.totalSqFt || 0) - selectedParcel.allocatedSqFt);
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
        await agr.save();

        processedSourcing.push({
          sourceType: 'AGREEMENT',
          agreementId: agr._id,
          agreementNumber: agr.agreementNumber,
          parcelId: selectedParcel ? selectedParcel._id : (item.parcelId || null),
          deedId: null,
          deedNumber: '',
          mauja: selectedParcel?.mauja || item.mauja || agr.mauja || agr.landParcels?.[0]?.mauja || '',
          thanaNumber: selectedParcel?.thanaNumber || item.thanaNumber || agr.thanaNumber || agr.landParcels?.[0]?.thanaNumber || '',
          khataNumber: selectedParcel?.khataNumber || item.khataNumber || agr.khataNumber || agr.landParcels?.[0]?.khataNumber || '',
          khesraNumber: selectedParcel?.khesraNumber || item.khesraNumber || agr.khesraNumber || agr.landParcels?.[0]?.khesraNumber || '',
          allocatedSqFt: numSqFt,
          allocatedDismil: Math.round((numSqFt / 435.6) * 1000) / 1000,
        });
      }
    }

    // Generate Financial Year Booking Number: e.g. PRD-BK-2627-001
    const bDate = new Date(bookingDate);
    const curYear = bDate.getFullYear();
    const curMonth = bDate.getMonth();
    const startYr = curMonth >= 3 ? curYear : curYear - 1;
    const endYr = startYr + 1;
    const fyStr = `${String(startYr).slice(-2)}${String(endYr).slice(-2)}`;

    const seq = await Counter.getNextSequence(`PLOT_PRD_BOOKING_${fyStr}`, null, 3);
    const bookingNumber = `PRD-BK-${fyStr}-${seq}`;

    // Generate installments schedule
    const installments = [];
    if (!isFullPayment) {
      if (dp > 0) {
        const dpDueDate = new Date(bDate.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);
        installments.push({
          installmentNumber: 0,
          dueDate: dpDueDate,
          amount: dp,
          paidAmount: 0,
          status: 'PENDING',
          lateFine: 0,
          lateFinePaid: 0,
          lateFineRebate: 0,
          lateDays: 0,
        });
      }

      if (remainingAmount > 0 && count > 0) {
        let accumulated = 0;
        for (let i = 1; i <= count; i++) {
          const dueDate = new Date(bDate);
          dueDate.setMonth(dueDate.getMonth() + (i * freqMultiplier));

          const emiAmt = i === count
            ? Math.round((remainingAmount - accumulated) * 100) / 100
            : emiPerInstallment;

          accumulated += emiAmt;

          installments.push({
            installmentNumber: i,
            dueDate,
            amount: emiAmt,
            paidAmount: 0,
            status: 'PENDING',
            lateFine: 0,
            lateFinePaid: 0,
            lateFineRebate: 0,
            lateDays: 0,
          });
        }
      }
    }

    const bookingStatus = isFullPayment ? 'COMPLETED' : 'ACTIVE';

    const collections = [];
    let resolvedDpLedgerId = null;
    if (isFullPayment && dp > 0) {
      const isCash = String(data.paymentMode || 'cash').toLowerCase() === 'cash';
      if (isCash) {
        // Cash receipts ALWAYS enter the physical custody of the collecting cashier
        const userCashLedger = await Ledger.findOne({ assignedUserId: userId, ledgerType: 'user_cash' });
        resolvedDpLedgerId = userCashLedger?._id || data.ledgerId || null;
      } else {
        resolvedDpLedgerId = data.ledgerId || null;
        if (!resolvedDpLedgerId) {
          const defaultBank = await Ledger.findOne({ ledgerType: 'bank', status: 'active' });
          if (defaultBank) resolvedDpLedgerId = defaultBank._id;
        }
      }

      collections.push({
        receiptNumber: `DP-${bookingNumber}`,
        amountPaid: dp,
        principalPaid: dp,
        lateFinePaid: 0,
        lateFineRebate: 0,
        paymentMode: data.paymentMode || 'cash',
        transactionReference: data.transactionReference || '',
        paymentDate: bDate,
        installmentNumbers: [],
        remarks: 'Full Payment recorded at time of booking',
        collectedById: userId || null,
        ledgerId: resolvedDpLedgerId,
      });
    }

    const resolvedProjectId = data.projectId || product.projectId || null;
    let resolvedProjectName = data.projectName || product.projectName || '';
    if (resolvedProjectId && !resolvedProjectName) {
      const proj = await PlotProject.findById(resolvedProjectId);
      if (proj) resolvedProjectName = proj.name;
    }

    let resolvedBranchId = data.branchId || null;
    let resolvedBranchPartnerId = data.branchPartnerId || null;
    if (sponsorId && (!resolvedBranchId || !resolvedBranchPartnerId)) {
      const spUser = await User.findById(sponsorId).select('branchIds sponsorId');
      if (!resolvedBranchId && spUser?.branchIds?.length > 0) {
        resolvedBranchId = spUser.branchIds[0];
      }
      if (!resolvedBranchId && spUser?.sponsorId) {
        const parentSp = await User.findById(spUser.sponsorId).select('branchIds');
        if (parentSp?.branchIds?.length > 0) resolvedBranchId = parentSp.branchIds[0];
      }
    }
    if (resolvedBranchId && !resolvedBranchPartnerId) {
      const bDoc = await Branch.findById(resolvedBranchId).select('branchPartnerId');
      if (bDoc?.branchPartnerId) resolvedBranchPartnerId = bDoc.branchPartnerId;
    }

    // Resolve scheme-configured commissions if not explicitly provided
    let resolvedPromoterCommissionPercent = data.promoterCommissionPercent !== undefined && data.promoterCommissionPercent !== null ? Number(data.promoterCommissionPercent) : undefined;
    let resolvedBpCommissionPercent = data.bpCommissionPercent !== undefined && data.bpCommissionPercent !== null ? Number(data.bpCommissionPercent) : undefined;
    let resolvedDeveloperCommissionPercent = data.developerCommissionPercent !== undefined && data.developerCommissionPercent !== null ? Number(data.developerCommissionPercent) : resolvedBpCommissionPercent;
    let resolvedBranchCommissionPercent = data.branchCommissionPercent !== undefined && data.branchCommissionPercent !== null ? Number(data.branchCommissionPercent) : undefined;

    if (resolvedPromoterCommissionPercent === undefined || resolvedBpCommissionPercent === undefined || resolvedBranchCommissionPercent === undefined) {
      try {
        const schemeConfig = await InvestmentSchemeConfig.findOne({ status: 'active' }) || await InvestmentSchemeConfig.findOne().sort({ createdAt: -1 });
        if (schemeConfig && Array.isArray(schemeConfig.slabs) && schemeConfig.slabs.length > 0) {
          let matchedSlab = null;
          if (data.planName) {
            matchedSlab = schemeConfig.slabs.find((s) => s.planName === data.planName);
          }
          if (!matchedSlab) {
            matchedSlab = schemeConfig.slabs.find((s) => Number(s.tenureMonths) === Number(resolvedTenure));
          }
          if (!matchedSlab) {
            const sortedSlabs = [...schemeConfig.slabs].sort((a, b) => Number(a.tenureMonths) - Number(b.tenureMonths));
            matchedSlab = sortedSlabs.find((s) => Number(s.tenureMonths) >= Number(resolvedTenure)) || sortedSlabs[sortedSlabs.length - 1];
          }

          if (matchedSlab) {
            if (isFullPayment) {
              if (resolvedPromoterCommissionPercent === undefined) {
                resolvedPromoterCommissionPercent = Number(matchedSlab.fdPromoterCommissionPercent ?? matchedSlab.rdPromoterCommissionPercent ?? 5.0);
              }
              if (resolvedBpCommissionPercent === undefined) {
                resolvedBpCommissionPercent = Number(matchedSlab.bpFdCommissionPercent ?? matchedSlab.bpRdCommissionPercent ?? matchedSlab.developerCommissionPercent ?? 1.0);
              }
              if (resolvedBranchCommissionPercent === undefined) {
                resolvedBranchCommissionPercent = Number(matchedSlab.branchFdCommissionPercent ?? matchedSlab.branchRdCommissionPercent ?? 0.5);
              }
            } else {
              if (resolvedPromoterCommissionPercent === undefined) {
                resolvedPromoterCommissionPercent = Number(matchedSlab.rdPromoterCommissionPercent ?? 4.0);
              }
              if (resolvedBpCommissionPercent === undefined) {
                resolvedBpCommissionPercent = Number(matchedSlab.bpRdCommissionPercent ?? matchedSlab.developerCommissionPercent ?? 1.0);
              }
              if (resolvedBranchCommissionPercent === undefined) {
                resolvedBranchCommissionPercent = Number(matchedSlab.branchRdCommissionPercent ?? 0.5);
              }
            }
            if (resolvedDeveloperCommissionPercent === undefined) {
              resolvedDeveloperCommissionPercent = resolvedBpCommissionPercent;
            }
          }
        }
      } catch (err) {
        console.error('Error looking up scheme config for booking commission defaults:', err);
      }
    }

    const bookingDoc = new PlotProductBooking({
      bookingNumber,
      bookingDate: bDate,
      productId: product._id,
      plotId: plotId || null,
      projectId: resolvedProjectId,
      projectName: resolvedProjectName,
      customerId: customer._id,
      sponsorId,
      branchId: resolvedBranchId || null,
      branchPartnerId: resolvedBranchPartnerId || null,
      quantity: qty,
      unitPrice,
      totalAmount,
      totalAreaSqFt: totalArea,
      dimensionsSnapshot: {
        north: Number(customDims?.north ?? customDims?.northSouth ?? product.dimensions?.north ?? 1),
        south: Number(customDims?.south ?? customDims?.northSouth ?? product.dimensions?.south ?? 1),
        east: Number(customDims?.east ?? customDims?.eastWest ?? product.dimensions?.east ?? 2),
        west: Number(customDims?.west ?? customDims?.eastWest ?? product.dimensions?.west ?? 2),
        northSouth: Number(customDims?.northSouth ?? customDims?.north ?? product.dimensions?.north ?? 1),
        eastWest: Number(customDims?.eastWest ?? customDims?.east ?? product.dimensions?.east ?? 2),
        totalAreaSqFt: totalArea,
        unit: customDims?.unit || product.dimensions?.unit || 'feet',
        dimensionLabel: customDims?.dimensionLabel || customDims?.label || (
          customDims?.northSouth && customDims?.eastWest
            ? `${customDims.northSouth} ft x ${customDims.eastWest} ft (N/S: ${customDims.northSouth} ft, E/W: ${customDims.eastWest} ft)`
            : (product.dimensionLabel || `${product.dimensions?.north || 1} ft x ${product.dimensions?.east || 2} ft`)
        ),
      },
      planName: data.planName || '',
      tenureMonths: resolvedTenure,
      promoterCommissionPercent: resolvedPromoterCommissionPercent,
      developerCommissionPercent: resolvedDeveloperCommissionPercent,
      bpCommissionPercent: resolvedBpCommissionPercent,
      branchCommissionPercent: resolvedBranchCommissionPercent,
      rdMaturityPercent: data.rdMaturityPercent !== undefined ? Number(data.rdMaturityPercent) : 0,
      fdMaturityPercent: data.fdMaturityPercent !== undefined ? Number(data.fdMaturityPercent) : 0,
      annualInterestRate: data.annualInterestRate !== undefined ? Number(data.annualInterestRate) : 0,
      paymentType,
      downPayment: dp,
      downpaymentDays: resolvedDpDays,
      downpaymentMonths: resolvedDpMonths,
      emiFrequency: emiFreq,
      installmentCount: count,
      dpType,
      dpVal: Number(dpVal) || 0,
      emiPrincipalAmount: remainingAmount,
      remainingAmount: isFullPayment ? 0 : totalAmount,
      monthlyEmi: isFullPayment ? 0 : monthlyEmi,
      totalPaid: isFullPayment ? dp : 0,
      installments,
      collections,
      landSourcing: processedSourcing,
      status: bookingStatus,
      remarks: remarks.trim(),
      createdById: userId,
    });

    await bookingDoc.save();

    // Auto-record double-entry credit in treasury ledger for downpayment (if full payment)
    if (isFullPayment && resolvedDpLedgerId && dp > 0) {
      try {
        await accountingService.recordLedgerEntry({
          ledgerId: resolvedDpLedgerId,
          date: bDate,
          type: 'CREDIT',
          amount: dp,
          source: 'receipt',
          referenceId: bookingDoc._id,
          remarks: `Product Booking Full Payment: PRD-DP-${bookingNumber} - Customer: ${customer.name || 'Customer'}`
        });
      } catch (e) {
        console.error('Error recording ledger entry for product booking DP:', e);
      }
    }

    // Auto-sync sponsor fixed commission if sponsor is linked and downPayment / full payment > 0
    if (bookingDoc.sponsorId) {
      try {
        await plotDeveloperService.syncProductBookingSponsorCommissions(bookingDoc._id);
      } catch (e) {
        console.error('Error syncing product booking sponsor commission on create:', e);
      }
    }

    // Update Product units sold
    product.unitsSold = (product.unitsSold || 0) + qty;
    await product.save();

    const rateConfig = await this.getRateConfig();
    return this.enrichBookingWithDues(bookingDoc.toObject(), rateConfig, new Date());
  }

  async updateProductBooking(id, data, userId) {
    const booking = await PlotProductBooking.findById(id);
    if (!booking) {
      throw ApiError.notFound('Product booking not found');
    }

    const {
      productId,
      customerId,
      quantity,
      customUnitPrice,
      tenureMonths,
      paymentType,
      downPayment,
      downpaymentAmount,
      downpaymentDays,
      downpaymentMonths,
      emiFrequency,
      installmentCount,
      dpType,
      dpVal,
      bookingDate,
      status,
      remarks,
      paymentMode,
      transactionReference,
      projectId,
      projectName,
      planName,
      promoterCommissionPercent,
      developerCommissionPercent,
      bpCommissionPercent,
      branchCommissionPercent,
      rdMaturityPercent,
      fdMaturityPercent,
      annualInterestRate,
      landSourcing,
      branchId,
      branchPartnerId,
    } = data;

    // Check if installments or collections exist beyond downpayment
    const hasCollections = Array.isArray(booking.collections) && booking.collections.length > 0;
    const paidInstallments = Array.isArray(booking.installments) && booking.installments.some((i) => i.status === 'PAID' || i.paidAmount > 0);
    const hasFinancialTransactions = (hasCollections && booking.collections.length > (booking.paymentType === 'FULL_PAYMENT' ? 1 : 0)) || paidInstallments;

    const oldQty = Math.max(1, Number(booking.quantity) || 1);
    const oldProductId = String(booking.productId);

    // If financial transactions exist (installments paid), prevent changing product, quantity, tenure, customer, paymentType
    if (hasFinancialTransactions) {
      if (productId && String(productId) !== oldProductId) {
        throw ApiError.badRequest('Cannot change Product because payment installments have already been recorded.');
      }
      if (customerId && String(customerId) !== String(booking.customerId)) {
        throw ApiError.badRequest('Cannot change Customer because payment installments have already been recorded.');
      }
      if (quantity && Number(quantity) !== oldQty) {
        throw ApiError.badRequest('Cannot change Quantity because payment installments have already been recorded.');
      }
      if (tenureMonths && Number(tenureMonths) !== Number(booking.tenureMonths)) {
        throw ApiError.badRequest('Cannot change Tenure Months because payment installments have already been recorded.');
      }
      if (paymentType && paymentType !== booking.paymentType) {
        throw ApiError.badRequest('Cannot change Payment Plan because payment installments have already been recorded.');
      }
    }

    // Resolve Product & Customer
    let targetProduct = null;
    if (productId) {
      targetProduct = await PlotProduct.findById(productId);
      if (!targetProduct) throw ApiError.badRequest('Product not found');
      booking.productId = targetProduct._id;
      booking.dimensionsSnapshot = {
        north: targetProduct.dimensions?.north || 1,
        south: targetProduct.dimensions?.south || 1,
        east: targetProduct.dimensions?.east || 2,
        west: targetProduct.dimensions?.west || 2,
        unit: targetProduct.dimensions?.unit || 'feet',
        dimensionLabel: targetProduct.dimensionLabel || `${targetProduct.dimensions?.north || 1} ft x ${targetProduct.dimensions?.east || 2} ft`,
      };
    } else {
      targetProduct = await PlotProduct.findById(booking.productId);
    }

    if (customerId) {
      const targetCustomer = await PlotCustomer.findById(customerId);
      if (!targetCustomer) throw ApiError.badRequest('Customer not found');
      booking.customerId = targetCustomer._id;
      booking.sponsorId = targetCustomer.sponsorId || null;
    }

    // Recalculate quantities, valuation, tenure, paymentType if changed
    const newQty = quantity !== undefined ? Math.max(1, Number(quantity) || 1) : oldQty;
    booking.quantity = newQty;

    const unitPrice = customUnitPrice !== undefined && Number(customUnitPrice) > 0
      ? Number(customUnitPrice)
      : (targetProduct?.unitPrice || booking.unitPrice || 5000);
    booking.unitPrice = unitPrice;

    const totalAmount = Math.round(newQty * unitPrice * 100) / 100;
    const customDims = data.customDimensions || (data.dimensionsSnapshot ? data.dimensionsSnapshot : null);
    const customArea = (customDims?.northSouth && customDims?.eastWest)
      ? Math.round(Number(customDims.northSouth) * Number(customDims.eastWest) * 100) / 100
      : (customDims?.totalAreaSqFt ? Number(customDims.totalAreaSqFt) : (Number(data.totalAreaSqFt) || null));

    const totalArea = customArea || Math.round(newQty * (targetProduct?.areaSqFt || 2) * 100) / 100;
    booking.totalAmount = totalAmount;
    booking.totalAreaSqFt = totalArea;

    if (customDims) {
      booking.dimensionsSnapshot = {
        north: Number(customDims.north ?? customDims.northSouth ?? targetProduct?.dimensions?.north ?? 1),
        south: Number(customDims.south ?? customDims.northSouth ?? targetProduct?.dimensions?.south ?? 1),
        east: Number(customDims.east ?? customDims.eastWest ?? targetProduct?.dimensions?.east ?? 2),
        west: Number(customDims.west ?? customDims.eastWest ?? targetProduct?.dimensions?.west ?? 2),
        northSouth: Number(customDims.northSouth ?? customDims.north ?? targetProduct?.dimensions?.north ?? 1),
        eastWest: Number(customDims.eastWest ?? customDims.east ?? targetProduct?.dimensions?.east ?? 2),
        totalAreaSqFt: totalArea,
        unit: customDims.unit || targetProduct?.dimensions?.unit || 'feet',
        dimensionLabel: customDims.dimensionLabel || customDims.label || (
          customDims.northSouth && customDims.eastWest
            ? `${customDims.northSouth} ft x ${customDims.eastWest} ft (N/S: ${customDims.northSouth} ft, E/W: ${customDims.eastWest} ft)`
            : (targetProduct?.dimensionLabel || `${targetProduct?.dimensions?.north || 1} ft x ${targetProduct?.dimensions?.east || 2} ft`)
        ),
      };
    }

    const newPaymentType = paymentType || booking.paymentType || 'MONTHLY_INSTALLMENT';
    booking.paymentType = newPaymentType;
    const isFullPayment = newPaymentType === 'FULL_PAYMENT';

    const newTenure = tenureMonths !== undefined ? Math.max(1, Number(tenureMonths) || 24) : (booking.tenureMonths || 24);
    booking.tenureMonths = newTenure;

    if (bookingDate) {
      booking.bookingDate = new Date(bookingDate);
    }
    const bDate = new Date(booking.bookingDate);

    if (status) booking.status = status;
    if (remarks !== undefined) booking.remarks = remarks;

    // Project selection
    if (projectId !== undefined) booking.projectId = projectId || null;
    if (projectName !== undefined) booking.projectName = projectName || '';
    if (booking.projectId && !booking.projectName) {
      const proj = await PlotProject.findById(booking.projectId);
      if (proj) booking.projectName = proj.name;
    }

    if (branchId !== undefined) booking.branchId = branchId || null;
    if (branchPartnerId !== undefined) booking.branchPartnerId = branchPartnerId || null;

    // Scheme, commission & return rates
    if (planName !== undefined) booking.planName = planName;
    if (promoterCommissionPercent !== undefined) booking.promoterCommissionPercent = Number(promoterCommissionPercent);
    if (developerCommissionPercent !== undefined) booking.developerCommissionPercent = Number(developerCommissionPercent);
    if (bpCommissionPercent !== undefined) booking.bpCommissionPercent = Number(bpCommissionPercent);
    if (branchCommissionPercent !== undefined) booking.branchCommissionPercent = Number(branchCommissionPercent);
    if (rdMaturityPercent !== undefined) booking.rdMaturityPercent = Number(rdMaturityPercent);
    if (fdMaturityPercent !== undefined) booking.fdMaturityPercent = Number(fdMaturityPercent);
    if (annualInterestRate !== undefined) booking.annualInterestRate = Number(annualInterestRate);

    // Land Sourcing re-allocation if provided
    if (landSourcing !== undefined && Array.isArray(landSourcing)) {
      // 1. Release existing land allocations
      if (Array.isArray(booking.landSourcing) && booking.landSourcing.length > 0) {
        for (const src of booking.landSourcing) {
          if (!src.agreementId || !src.allocatedSqFt) continue;
          const agr = await KisanLandAgreement.findById(src.agreementId);
          if (agr) {
            agr.totalAllocatedSqFt = Math.max(0, (agr.totalAllocatedSqFt || 0) - src.allocatedSqFt);
            agr.totalAvailableSqFt = Math.min(agr.totalSqFt || 0, (agr.totalAvailableSqFt || 0) + src.allocatedSqFt);

            if (src.parcelId && Array.isArray(agr.landParcels)) {
              const p = agr.landParcels.find((pr) => String(pr._id) === String(src.parcelId));
              if (p) {
                p.allocatedSqFt = Math.max(0, (p.allocatedSqFt || 0) - src.allocatedSqFt);
                p.availableSqFt = Math.min(p.totalSqFt || 0, (p.availableSqFt || 0) + src.allocatedSqFt);
              }
            }
            await agr.save();
          }
        }
      }

      // 2. Process and allocate new land sourcing items
      const processedSourcing = [];
      for (const item of landSourcing) {
        if (!item.agreementId || !item.allocatedSqFt) continue;
        const numSqFt = Number(item.allocatedSqFt);
        if (numSqFt <= 0) continue;

        const agr = await KisanLandAgreement.findById(item.agreementId);
        if (!agr) throw ApiError.badRequest(`Agreement #${item.agreementNumber || item.agreementId} not found`);

        let selectedParcel = null;
        if (item.parcelId && Array.isArray(agr.landParcels)) {
          selectedParcel = agr.landParcels.find((p) => String(p._id) === String(item.parcelId));
        }

        agr.totalAllocatedSqFt = (agr.totalAllocatedSqFt || 0) + numSqFt;
        agr.totalAvailableSqFt = Math.max(0, (agr.totalSqFt || 0) - agr.totalAllocatedSqFt);

        if (selectedParcel) {
          selectedParcel.allocatedSqFt = (selectedParcel.allocatedSqFt || 0) + numSqFt;
          selectedParcel.availableSqFt = Math.max(0, (selectedParcel.totalSqFt || 0) - selectedParcel.allocatedSqFt);
        } else {
          agr.unregisteredAllocatedSqFt = Math.min(
            agr.unregisteredAgreedSqFt || 0,
            (agr.unregisteredAllocatedSqFt || 0) + numSqFt
          );
          agr.unregisteredAvailableSqFt = Math.max(0, agr.unregisteredAgreedSqFt - agr.unregisteredAllocatedSqFt);
        }
        await agr.save();

        processedSourcing.push({
          sourceType: 'AGREEMENT',
          agreementId: agr._id,
          agreementNumber: agr.agreementNumber,
          parcelId: selectedParcel ? selectedParcel._id : (item.parcelId || null),
          deedId: null,
          deedNumber: '',
          mauja: selectedParcel?.mauja || item.mauja || agr.mauja || agr.landParcels?.[0]?.mauja || '',
          thanaNumber: selectedParcel?.thanaNumber || item.thanaNumber || agr.thanaNumber || agr.landParcels?.[0]?.thanaNumber || '',
          khataNumber: selectedParcel?.khataNumber || item.khataNumber || agr.khataNumber || agr.landParcels?.[0]?.khataNumber || '',
          khesraNumber: selectedParcel?.khesraNumber || item.khesraNumber || agr.khesraNumber || agr.landParcels?.[0]?.khesraNumber || '',
          allocatedSqFt: numSqFt,
          allocatedDismil: Math.round((numSqFt / 435.6) * 1000) / 1000,
        });
      }
      booking.landSourcing = processedSourcing;
    }

    // Adjust product unitsSold count if product or quantity changed
    if (String(oldProductId) !== String(booking.productId) || oldQty !== newQty) {
      if (String(oldProductId) === String(booking.productId)) {
        const delta = newQty - oldQty;
        if (delta !== 0) {
          await PlotProduct.findByIdAndUpdate(booking.productId, { $inc: { unitsSold: delta } });
        }
      } else {
        await PlotProduct.findByIdAndUpdate(oldProductId, { $inc: { unitsSold: -oldQty } });
        await PlotProduct.findByIdAndUpdate(booking.productId, { $inc: { unitsSold: newQty } });
      }
    }

    // Recalculate schedule if no installments were paid yet
    if (!paidInstallments) {
      const resolvedDpDays = Number(downpaymentDays !== undefined ? downpaymentDays : (booking.downpaymentDays || 90));
      const resolvedDpMonths = downpaymentMonths !== undefined ? Number(downpaymentMonths) : Math.max(1, Math.round(resolvedDpDays / 30));
      const emiFreq = emiFrequency || booking.emiFrequency || 'MONTHLY';
      const freqMultiplier = emiFreq === 'QUARTERLY' ? 3 : emiFreq === 'HALF_YEARLY' ? 6 : emiFreq === 'YEARLY' ? 12 : 1;
      const numInstallments = Number(installmentCount !== undefined ? installmentCount : (booking.installmentCount || 0));
      const count = isFullPayment ? 0 : (numInstallments > 0 ? numInstallments : Math.max(1, Math.round(newTenure / freqMultiplier)));

      let dp = 0;
      if (isFullPayment) {
        dp = totalAmount;
      } else {
        const explicitDp = downpaymentAmount !== undefined
          ? Number(downpaymentAmount)
          : (downPayment !== undefined ? Number(downPayment) : (booking.downPayment || 0));
        dp = Math.min(totalAmount, Math.max(0, explicitDp));
      }

      const remainingAmount = isFullPayment ? 0 : Math.max(0, totalAmount - dp);
      const emiAmtPerInst = (count > 0 && remainingAmount > 0) ? Math.round(remainingAmount / count) : 0;

      booking.downPayment = dp;
      booking.downpaymentDays = resolvedDpDays;
      booking.downpaymentMonths = resolvedDpMonths;
      booking.emiFrequency = emiFreq;
      booking.installmentCount = count;
      if (dpType !== undefined) booking.dpType = dpType;
      if (dpVal !== undefined) booking.dpVal = Number(dpVal);
      booking.emiPrincipalAmount = remainingAmount;
      booking.monthlyEmi = emiAmtPerInst;

      if (isFullPayment) {
        booking.totalPaid = dp;
        booking.remainingAmount = 0;
        booking.installments = [];
        booking.collections = [{
          receiptNumber: `DP-${booking.bookingNumber}`,
          amountPaid: dp,
          principalPaid: dp,
          lateFinePaid: 0,
          lateFineRebate: 0,
          paymentMode: paymentMode || 'cash',
          transactionReference: transactionReference || '',
          paymentDate: bDate,
          installmentNumbers: [],
          remarks: 'Full Payment recorded at time of booking (Updated)',
          collectedById: userId || null,
        }];
        if (!status) booking.status = 'COMPLETED';
      } else {
        booking.totalPaid = 0;
        booking.remainingAmount = totalAmount;
        booking.collections = [];
        if (!status) booking.status = 'ACTIVE';

        const installments = [];
        if (dp > 0) {
          const dpDueDate = new Date(bDate.getTime() + resolvedDpDays * 24 * 60 * 60 * 1000);
          installments.push({
            installmentNumber: 0,
            dueDate: dpDueDate,
            amount: dp,
            paidAmount: 0,
            status: 'PENDING',
            lateFine: 0,
            lateFinePaid: 0,
            lateFineRebate: 0,
            lateDays: 0,
          });
        }

        if (remainingAmount > 0 && count > 0) {
          let accumulated = 0;
          for (let i = 1; i <= count; i++) {
            const dueDate = new Date(bDate);
            dueDate.setMonth(dueDate.getMonth() + (i * freqMultiplier));

            const emiAmt = i === count
              ? Math.round((remainingAmount - accumulated) * 100) / 100
              : emiAmtPerInst;

            accumulated += emiAmt;

            installments.push({
              installmentNumber: i,
              dueDate,
              amount: emiAmt,
              paidAmount: 0,
              status: 'PENDING',
              lateFine: 0,
              lateFinePaid: 0,
              lateFineRebate: 0,
              lateDays: 0,
            });
          }
        }
        booking.installments = installments;
      }
    }

    await booking.save();

    // Re-sync commissions
    if (booking.sponsorId) {
      try {
        await plotDeveloperService.syncProductBookingSponsorCommissions(booking._id);
      } catch (e) {
        console.error('Error syncing product booking sponsor commission on edit:', e);
      }
    }

    const rateConfig = await this.getRateConfig();
    return this.enrichBookingWithDues(booking.toObject(), rateConfig, new Date());
  }

  async deleteProductBooking(id) {
    const booking = await PlotProductBooking.findById(id);
    if (!booking) {
      throw ApiError.notFound('Product booking not found');
    }

    // Check if installments or collections exist beyond downpayment
    const hasCollections = Array.isArray(booking.collections) && booking.collections.length > 0;
    const paidInstallments = Array.isArray(booking.installments) && booking.installments.some((i) => i.status === 'PAID' || i.paidAmount > 0);

    if (hasCollections || paidInstallments) {
      throw ApiError.badRequest('Cannot delete product booking because payment collections/installments have already been recorded. Please cancel the booking instead.');
    }

    // Release allocated land stock back to KisanLandAgreement
    if (Array.isArray(booking.landSourcing) && booking.landSourcing.length > 0) {
      for (const src of booking.landSourcing) {
        if (!src.agreementId || !src.allocatedSqFt) continue;
        const agr = await KisanLandAgreement.findById(src.agreementId);
        if (agr) {
          agr.totalAllocatedSqFt = Math.max(0, (agr.totalAllocatedSqFt || 0) - src.allocatedSqFt);
          agr.totalAvailableSqFt = Math.min(agr.totalSqFt || 0, (agr.totalAvailableSqFt || 0) + src.allocatedSqFt);

          if (src.parcelId && Array.isArray(agr.landParcels)) {
            const p = agr.landParcels.find((pr) => String(pr._id) === String(src.parcelId));
            if (p) {
              p.allocatedSqFt = Math.max(0, (p.allocatedSqFt || 0) - src.allocatedSqFt);
              p.availableSqFt = Math.min(p.totalSqFt || 0, (p.availableSqFt || 0) + src.allocatedSqFt);
            }
          }
          await agr.save();
        }
      }
    }

    // Restore unitsSold on Product
    if (booking.productId) {
      await PlotProduct.findByIdAndUpdate(booking.productId, {
        $inc: { unitsSold: -Math.max(1, Number(booking.quantity) || 1) }
      });
    }

    // Remove any synced commissions
    await PlotSponsorCommission.deleteMany({ productBookingId: booking._id });

    await PlotProductBooking.findByIdAndDelete(id);
    return { message: 'Product booking deleted successfully' };
  }

  // ─── PRODUCT INSTALLMENT COLLECTION & MAKER-CHECKER WORKFLOW ───

  async collectProductInstallment(bookingId, data, userId) {
    const {
      installmentIds = [],
      installmentNumber,
      amount,
      amountPaid,
      lateFineRebate = 0,
      paymentMode = 'cash',
      transactionReference = '',
      paymentDate = new Date(),
      remarks = '',
    } = data;

    const booking = await PlotProductBooking.findById(bookingId).populate('customerId').populate('productId');
    if (!booking) throw ApiError.notFound('Product booking not found');

    const colAmount = Number(amountPaid !== undefined && amountPaid !== '' ? amountPaid : amount);
    if (colAmount <= 0) throw ApiError.badRequest('Collection amount must be greater than 0');

    const isCash = String(paymentMode).toLowerCase() === 'cash';

    // REQUIREMENT: Reference / Cheque number is required for bank and online transactions
    if (!isCash) {
      if (!transactionReference || !transactionReference.trim()) {
        throw ApiError.badRequest('Transaction Reference / UTR / Cheque number is required for bank and online transactions');
      }
      if (String(paymentMode).toLowerCase() === 'cheque') {
        const cleanCheque = transactionReference.trim();
        if (!/^\d{6}$/.test(cleanCheque)) {
          throw ApiError.badRequest('Cheque number must be exactly 6 numeric digits (e.g. 045123)');
        }
      }
    }

    const rebateAmount = Number(lateFineRebate) || 0;
    const pDate = new Date(paymentDate);

    // Generate receipt number: e.g. PRD-RCP-2627-001
    const curYear = pDate.getFullYear();
    const curMonth = pDate.getMonth();
    const startYr = curMonth >= 3 ? curYear : curYear - 1;
    const endYr = startYr + 1;
    const fyStr = `${String(startYr).slice(-2)}${String(endYr).slice(-2)}`;

    const seq = await Counter.getNextSequence(`PLOT_PRD_RECEIPT_${fyStr}`, null, 3);
    const receiptNumber = `PRD-RCP-${fyStr}-${seq}`;

    // Target installments: if specific IDs given, match those. Otherwise, find all pending installments.
    let targetInsts = [];
    if (Array.isArray(installmentIds) && installmentIds.length > 0) {
      targetInsts = booking.installments.filter((ins) => installmentIds.map(String).includes(String(ins._id)));
    } else if (installmentNumber !== undefined && installmentNumber !== null && installmentNumber !== '') {
      const single = booking.installments.find((ins) => ins.installmentNumber === Number(installmentNumber));
      if (single) targetInsts = [single];
    }

    if (targetInsts.length === 0) {
      targetInsts = booking.installments.filter((ins) => ins.status !== 'PAID');
    }

    targetInsts.sort((a, b) => a.installmentNumber - b.installmentNumber);
    const touchedInstNumbers = targetInsts.map((i) => i.installmentNumber);

    // Resolve target Bank or Cash Ledger
    let resolvedLedgerId = null;
    if (isCash) {
      // Cash receipts ALWAYS enter the physical custody of the collecting cashier
      const userCashLedger = await Ledger.findOne({ assignedUserId: userId, ledgerType: 'user_cash' });
      resolvedLedgerId = userCashLedger?._id || data.ledgerId || null;
    } else {
      if (userId) {
        const collector = await User.findById(userId).select('bankPermissions role').lean();
        if (collector && collector.role !== 'developer') {
          const bPerm = collector.bankPermissions;
          if (bPerm) {
            if (bPerm.accessScope === 'none' || bPerm.allowReceipts === false) {
              throw ApiError.badRequest('You do not have authorization to collect payments into corporate bank accounts. Please collect in cash.');
            }
            if (bPerm.accessScope === 'selected' && data.ledgerId) {
              const allowedIds = (bPerm.allowedBankIds || []).map(id => id.toString());
              if (!allowedIds.includes(data.ledgerId.toString())) {
                throw ApiError.badRequest('You are not authorized to collect payments into this designated bank account.');
              }
            }
          }
        }
      }
      resolvedLedgerId = data.ledgerId || null;
      if (!resolvedLedgerId) {
        const defaultBank = await Ledger.findOne({ ledgerType: 'bank', status: 'active' });
        if (defaultBank) resolvedLedgerId = defaultBank._id;
      }
    }

    // Save collection transaction history record
    if (!booking.collections) {
      booking.collections = [];
    }

    // Status: Cash is auto-approved ('APPROVED'), online/bank/cheque is created as 'PENDING'
    const initialStatus = isCash ? 'APPROVED' : 'PENDING';
    const newCollection = {
      receiptNumber,
      amountPaid: colAmount,
      principalPaid: 0,
      lateFinePaid: 0,
      lateFineRebate: rebateAmount,
      paymentMode,
      transactionReference: transactionReference?.trim() || '',
      paymentDate: pDate,
      installmentNumbers: touchedInstNumbers,
      remarks,
      collectedById: userId || null,
      ledgerId: resolvedLedgerId,
      status: initialStatus,
      approvedBy: isCash ? (userId || null) : null,
      approvedAt: isCash ? new Date() : null,
      rejectionReason: '',
    };
    booking.collections.push(newCollection);
    await booking.save();

    // Rebuild installments & totals based on approved collections only
    await this.rebuildProductBookingInstallmentsState(booking._id);

    if (isCash) {

      if (resolvedLedgerId && colAmount > 0) {
        try {
          await accountingService.recordLedgerEntry({
            ledgerId: resolvedLedgerId,
            date: pDate,
            type: 'CREDIT',
            amount: colAmount,
            source: 'receipt',
            referenceId: booking._id,
            remarks: `Product EMI Receipt: ${receiptNumber} (${booking.bookingNumber || ''}) - Customer: ${booking.customerId?.name || 'Customer'}`
          });
        } catch (err) {
          console.error('Error recording ledger entry for product installment collection:', err);
        }
      }

      if (booking.sponsorId) {
        try {
          await plotDeveloperService.syncProductBookingSponsorCommissions(booking._id);
        } catch (e) {
          console.error('Error syncing product booking sponsor commission on installment collection:', e);
        }
      }
    }

    // Reload booking with updated state
    const updatedBooking = await PlotProductBooking.findById(booking._id).populate('customerId').populate('productId');
    const rateConfig = await this.getRateConfig();
    const enriched = this.enrichBookingWithDues(updatedBooking.toObject(), rateConfig, pDate);

    const savedCol = (updatedBooking.collections || []).find((c) => c.receiptNumber === receiptNumber) || newCollection;

    return {
      _id: savedCol._id,
      booking: enriched,
      receiptNumber,
      collectedAmount: colAmount,
      principalPaid: savedCol.principalPaid || 0,
      lateFinePaid: savedCol.lateFinePaid || 0,
      lateFineRebate: savedCol.lateFineRebate || 0,
      paymentDate: pDate,
      paymentMode,
      transactionReference: transactionReference?.trim() || '',
      remarks,
      status: initialStatus,
    };
  }

  // Rebuild installments & totals for a product booking by applying only APPROVED receipts chronologically
  async rebuildProductBookingInstallmentsState(bookingId, session = null) {
    let query = PlotProductBooking.findById(bookingId);
    if (session) query = query.session(session);
    const booking = await query;
    if (!booking) return null;

    const rateConfig = await this.getRateConfig();

    // Reset all installments to pending initial state
    if (Array.isArray(booking.installments)) {
      for (const inst of booking.installments) {
        inst.paidAmount = 0;
        inst.paidDate = null;
        inst.receiptNumber = '';
        inst.status = 'PENDING';
        inst.lateDays = 0;
        inst.lateFine = 0;
        inst.lateFinePaid = 0;
        inst.lateFineRebate = 0;
      }
    }

    // Apply only APPROVED collections in chronological order
    const approvedCollections = (booking.collections || [])
      .filter((c) => (c.status ? c.status === 'APPROVED' : String(c.paymentMode).toLowerCase() === 'cash'))
      .slice()
      .sort((a, b) => new Date(a.paymentDate || a.createdAt || 0) - new Date(b.paymentDate || b.createdAt || 0));

    // Zero out realized amounts on pending or rejected collections
    for (const col of (booking.collections || [])) {
      if (col.status === 'PENDING' || col.status === 'REJECTED') {
        col.principalPaid = 0;
        col.lateFinePaid = 0;
      }
    }

    let totalPrincipal = Number(booking.paymentType === 'FULL_PAYMENT' ? (booking.totalAmount || 0) : 0);
    let totalFinePaid = 0;
    let totalFineRebate = 0;

    for (const col of approvedCollections) {
      if (booking.paymentType === 'FULL_PAYMENT' && (col.receiptNumber?.startsWith('DP-') || col.receiptNumber?.startsWith('PRD-DP-'))) {
        col.principalPaid = booking.totalAmount || col.amountPaid;
        continue;
      }

      let remainingPaid = Number(col.amountPaid) || 0;
      let remainingRebate = Number(col.lateFineRebate) || 0;
      const pDate = new Date(col.paymentDate || col.createdAt || Date.now());

      let targetInsts = [];
      if (Array.isArray(col.installmentNumbers) && col.installmentNumbers.length > 0) {
        targetInsts = (booking.installments || []).filter((i) => col.installmentNumbers.includes(i.installmentNumber));
      }
      if (targetInsts.length === 0) {
        targetInsts = (booking.installments || []).filter((i) => i.status !== 'PAID');
      }
      targetInsts.sort((a, b) => a.installmentNumber - b.installmentNumber);

      let colPrincipal = 0;
      let colFine = 0;
      let colRebate = 0;

      for (const inst of targetInsts) {
        if (remainingPaid <= 0 && remainingRebate <= 0) break;
        if (inst.status === 'PAID') continue;

        const stats = this.computeInstallmentStats(inst, rateConfig, pDate);
        const effectiveFine = stats.lateFine;
        inst.lateFine = effectiveFine;
        inst.lateDays = stats.lateDays;

        // 1. Rebate against unpaid late fine
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        inst.lateFineRebate = (inst.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;
        colRebate += fineRebateThisTime;

        // 2. Payment against late fine
        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        inst.lateFinePaid = (inst.lateFinePaid || 0) + finePaidThisTime;
        remainingPaid -= finePaidThisTime;
        colFine += finePaidThisTime;

        // 3. Payment against principal
        const unpaidPrincipal = Math.max(0, inst.amount - (inst.paidAmount || 0));
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        inst.paidAmount = (inst.paidAmount || 0) + principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;
        colPrincipal += principalPaidThisTime;

        inst.paidDate = pDate;
        inst.receiptNumber = col.receiptNumber;

        const isFullyPaid =
          inst.paidAmount >= inst.amount &&
          (inst.lateFinePaid + (inst.lateFineRebate || 0)) >= inst.lateFine;
        inst.status = isFullyPaid ? 'PAID' : 'PARTIAL';
      }

      col.principalPaid = colPrincipal;
      col.lateFinePaid = colFine;
      col.lateFineRebate = colRebate;

      totalPrincipal += colPrincipal;
      totalFinePaid += colFine;
      totalFineRebate += colRebate;
    }

    if (booking.paymentType !== 'FULL_PAYMENT') {
      booking.totalPaid = totalPrincipal;
      booking.totalLateFinePaid = totalFinePaid;
      booking.totalLateFineRebate = totalFineRebate;
      booking.remainingAmount = Math.max(0, (booking.totalAmount || 0) - booking.totalPaid);

      if (booking.remainingAmount <= 0 && (booking.totalAmount || 0) > 0) {
        booking.status = 'COMPLETED';
      } else if (booking.status === 'COMPLETED' && booking.remainingAmount > 0) {
        booking.status = 'ACTIVE';
      }
    }

    if (session) {
      await booking.save({ session });
    } else {
      await booking.save();
    }

    return booking;
  }

  // Approve Pending Product Collection (Admin / Branch Manager Action)
  async approveProductCollection(bookingId, receiptNumber, userOrId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let booking = null;
      if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await PlotProductBooking.findById(bookingId).populate('customerId').session(session);
      }
      if (!booking) {
        booking = await PlotProductBooking.findOne({
          $or: [
            { 'collections.receiptNumber': receiptNumber },
            ...(mongoose.Types.ObjectId.isValid(receiptNumber) ? [{ 'collections._id': receiptNumber }] : []),
          ],
        }).populate('customerId').session(session);
      }

      if (!booking) {
        throw ApiError.notFound('Product booking or collection receipt not found');
      }

      const col = (booking.collections || []).find(
        (c) => c.receiptNumber === receiptNumber || c._id?.toString() === receiptNumber
      );

      if (!col) {
        throw ApiError.notFound('Collection receipt not found');
      }

      if (col.status === 'APPROVED') {
        throw ApiError.badRequest('Receipt is already approved');
      }

      const adminUserId = userOrId?._id || userOrId?.id || userOrId;
      if (userOrId && typeof userOrId === 'object' && userOrId.role) {
        const userRole = userOrId.role;
        const isGlobalAdmin = ['superadmin', 'developer', 'admin', 'grant'].includes(userRole);
        const isBranchManager = userRole === 'manager';

        if (!isGlobalAdmin && !isBranchManager) {
          throw ApiError.forbidden('Permission denied: Only administrators or branch managers can approve receipts');
        }
      }

      col.status = 'APPROVED';
      col.approvedBy = adminUserId;
      col.approvedAt = new Date();
      col.rejectionReason = '';

      // Realize collection into ledger
      let targetLedgerId = col.ledgerId;
      if (!targetLedgerId) {
        const defaultBank = await Ledger.findOne({ ledgerType: 'bank', status: 'active' }).session(session);
        if (defaultBank) {
          targetLedgerId = defaultBank._id;
          col.ledgerId = defaultBank._id;
        }
      }

      if (targetLedgerId) {
        const existingBankEntry = await Entry.findOne({
          ledgerId: targetLedgerId,
          referenceId: booking._id,
          remarks: { $regex: col.receiptNumber },
          source: 'receipt',
          status: 'active',
        }).session(session);

        if (!existingBankEntry) {
          await accountingService.recordLedgerEntry(
            {
              ledgerId: targetLedgerId,
              date: col.paymentDate || new Date(),
              type: 'CREDIT',
              amount: Number(col.amountPaid),
              source: 'receipt',
              referenceId: booking._id,
              remarks: `Product EMI Receipt: ${col.receiptNumber} (${booking.bookingNumber || ''}) - Customer: ${booking.customerId?.name || 'Customer'}`,
            },
            session
          );
        }
      }

      await booking.save({ session });

      // Rebuild installments state to realize this collection
      await this.rebuildProductBookingInstallmentsState(booking._id, session);

      // Sync commissions
      if (booking.sponsorId) {
        try {
          await plotDeveloperService.syncProductBookingSponsorCommissions(booking._id, session);
        } catch (e) {
          console.error('Error syncing commissions on product receipt approval:', e);
        }
      }

      // Audit log
      try {
        await new PlotAuditLog({
          action: 'APPROVE_PRODUCT_RECEIPT',
          modelName: 'PlotProductBooking',
          documentId: booking._id,
          userId: adminUserId,
          details: { receiptNumber: col.receiptNumber, amount: col.amountPaid, paymentMode: col.paymentMode },
        }).save({ session });
      } catch (err) {
        console.error('Error writing audit log for product receipt approval:', err);
      }

      await session.commitTransaction();

      const updated = await PlotProductBooking.findById(booking._id).populate('customerId').populate('productId');
      const rateConfig = await this.getRateConfig();
      return {
        _id: col._id,
        receiptNumber: col.receiptNumber,
        status: 'APPROVED',

        booking: this.enrichBookingWithDues(updated.toObject(), rateConfig, new Date()),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Reject Pending Product Collection (Admin / Branch Manager Action)
  async rejectProductCollection(bookingId, receiptNumber, rejectionReason, userOrId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let booking = null;
      if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await PlotProductBooking.findById(bookingId).populate('customerId').session(session);
      }
      if (!booking) {
        booking = await PlotProductBooking.findOne({
          $or: [
            { 'collections.receiptNumber': receiptNumber },
            ...(mongoose.Types.ObjectId.isValid(receiptNumber) ? [{ 'collections._id': receiptNumber }] : []),
          ],
        }).populate('customerId').session(session);
      }

      if (!booking) {
        throw ApiError.notFound('Product booking or collection receipt not found');
      }

      const col = (booking.collections || []).find(
        (c) => c.receiptNumber === receiptNumber || c._id?.toString() === receiptNumber
      );

      if (!col) {
        throw ApiError.notFound('Collection receipt not found');
      }

      if (col.status === 'REJECTED') {
        throw ApiError.badRequest('Receipt is already rejected');
      }

      const adminUserId = userOrId?._id || userOrId?.id || userOrId;
      if (userOrId && typeof userOrId === 'object' && userOrId.role) {
        const userRole = userOrId.role;
        const isGlobalAdmin = ['superadmin', 'developer', 'admin', 'grant'].includes(userRole);
        const isBranchManager = userRole === 'manager';

        if (!isGlobalAdmin && !isBranchManager) {
          throw ApiError.forbidden('Permission denied: Only administrators or branch managers can reject receipts');
        }
      }

      col.status = 'REJECTED';
      col.rejectionReason = rejectionReason || 'Rejected by Admin';
      col.approvedBy = adminUserId;
      col.approvedAt = new Date();

      // Clean up any ledger entry that was created if this was previously credited
      const existingBankEntries = await Entry.find({
        source: 'receipt',
        referenceId: booking._id,
        remarks: { $regex: col.receiptNumber },
      }).session(session);

      for (const e of existingBankEntries) {
        await accountingService.deleteLedgerEntry(e._id, session);
      }

      await booking.save({ session });

      // Rebuild installments state to revert any effects
      await this.rebuildProductBookingInstallmentsState(booking._id, session);

      // Sync commissions
      if (booking.sponsorId) {
        try {
          await plotDeveloperService.syncProductBookingSponsorCommissions(booking._id, session);
        } catch (e) {
          console.error('Error syncing commissions on product receipt rejection:', e);
        }
      }

      // Audit log
      try {
        await new PlotAuditLog({
          action: 'REJECT_PRODUCT_RECEIPT',
          modelName: 'PlotProductBooking',
          documentId: booking._id,
          userId: adminUserId,
          details: { receiptNumber: col.receiptNumber, amount: col.amountPaid, rejectionReason },
        }).save({ session });
      } catch (err) {
        console.error('Error writing audit log for product receipt rejection:', err);
      }

      await session.commitTransaction();

      const updated = await PlotProductBooking.findById(booking._id).populate('customerId').populate('productId');
      const rateConfig = await this.getRateConfig();
      return {
        _id: col._id,
        receiptNumber: col.receiptNumber,
        status: 'REJECTED',
        rejectionReason: col.rejectionReason,
        booking: this.enrichBookingWithDues(updated.toObject(), rateConfig, new Date()),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /* ── LEGACY COLLECT REMOVED ──
  async collectProductInstallment_legacy(bookingId, data, userId) {
    const {
      installmentIds = [],
      installmentNumber,
      amount,
      amountPaid,
      lateFineRebate = 0,
      paymentMode = 'cash',
      transactionReference = '',
      paymentDate = new Date(),
      remarks = '',
    } = data;

    const booking = await PlotProductBooking.findById(bookingId).populate('customerId').populate('productId');
    if (!booking) throw ApiError.notFound('Product booking not found');

    const colAmount = Number(amountPaid !== undefined && amountPaid !== '' ? amountPaid : amount);
    if (colAmount <= 0) throw ApiError.badRequest('Collection amount must be greater than 0');

    const rebateAmount = Number(lateFineRebate) || 0;
    const pDate = new Date(paymentDate);
    const rateConfig = await this.getRateConfig();

    // Generate receipt number: e.g. PRD-RCP-2627-001
    const curYear = pDate.getFullYear();
    const curMonth = pDate.getMonth();
    const startYr = curMonth >= 3 ? curYear : curYear - 1;
    const endYr = startYr + 1;
    const fyStr = `${String(startYr).slice(-2)}${String(endYr).slice(-2)}`;

    const seq = await Counter.getNextSequence(`PLOT_PRD_RECEIPT_${fyStr}`, null, 3);
    const receiptNumber = `PRD-RCP-${fyStr}-${seq}`;

    // Target installments: if specific IDs given, match those. Otherwise, find all pending installments.
    let targetInsts = [];
    if (Array.isArray(installmentIds) && installmentIds.length > 0) {
      targetInsts = booking.installments.filter((ins) => installmentIds.map(String).includes(String(ins._id)));
    } else if (installmentNumber !== undefined && installmentNumber !== null && installmentNumber !== '') {
      const single = booking.installments.find((ins) => ins.installmentNumber === Number(installmentNumber));
      if (single) targetInsts = [single];
    }

    if (targetInsts.length === 0) {
      targetInsts = booking.installments.filter((ins) => ins.status !== 'PAID');
    }

    targetInsts.sort((a, b) => a.installmentNumber - b.installmentNumber);

    let remainingPaid = colAmount;
    let remainingRebate = rebateAmount;
    let totalLateFinePaidForReceipt = 0;
    let totalPrincipalPaidForReceipt = 0;

    for (const inst of targetInsts) {
      if (remainingPaid <= 0 && remainingRebate <= 0) break;
      if (inst.status === 'PAID') continue;

      const stats = this.computeInstallmentStats(inst, rateConfig, pDate);
      const effectiveFine = stats.lateFine;
      inst.lateFine = effectiveFine;
      inst.lateDays = stats.lateDays;

      // 1. Apply rebate first against unpaid late fine
      const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
      const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
      inst.lateFineRebate = (inst.lateFineRebate || 0) + fineRebateThisTime;
      remainingRebate -= fineRebateThisTime;

      // 2. Distribute payment: FIRST to remaining late fine
      const unpaidFineAfterRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
      const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
      inst.lateFinePaid = (inst.lateFinePaid || 0) + finePaidThisTime;
      totalLateFinePaidForReceipt += finePaidThisTime;
      remainingPaid -= finePaidThisTime;

      // 3. Distribute payment: SECOND to remaining principal
      const unpaidPrincipal = Math.max(0, inst.amount - (inst.paidAmount || 0));
      const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
      inst.paidAmount = (inst.paidAmount || 0) + principalPaidThisTime;
      totalPrincipalPaidForReceipt += principalPaidThisTime;
      remainingPaid -= principalPaidThisTime;

      inst.paidDate = pDate;
      inst.receiptNumber = receiptNumber;

      const isFullyPaid =
        inst.paidAmount >= inst.amount &&
        (inst.lateFinePaid + (inst.lateFineRebate || 0)) >= inst.lateFine;
      inst.status = isFullyPaid ? 'PAID' : 'PARTIAL';
    }

    booking.totalPaid = (booking.totalPaid || 0) + totalPrincipalPaidForReceipt;
    booking.totalLateFinePaid = (booking.totalLateFinePaid || 0) + totalLateFinePaidForReceipt;
    booking.totalLateFineRebate = (booking.totalLateFineRebate || 0) + (rebateAmount - remainingRebate);
    booking.remainingAmount = Math.max(0, booking.totalAmount - booking.totalPaid);

    if (booking.remainingAmount <= 0) {
      booking.status = 'COMPLETED';
    }

    // Resolve target Bank or Cash Ledger
    const isCash = String(paymentMode).toLowerCase() === 'cash';
    let resolvedLedgerId = null;
    if (isCash) {
      // Cash receipts ALWAYS enter the physical custody of the collecting cashier
      const userCashLedger = await Ledger.findOne({ assignedUserId: userId, ledgerType: 'user_cash' });
      resolvedLedgerId = userCashLedger?._id || data.ledgerId || null;
    } else {
      if (userId) {
        const User = mongoose.model('user');
        const collector = await User.findById(userId).select('bankPermissions role').lean();
        if (collector && collector.role !== 'developer') {
          const bPerm = collector.bankPermissions;
          if (bPerm) {
            if (bPerm.accessScope === 'none' || bPerm.allowReceipts === false) {
              throw ApiError.badRequest('You do not have authorization to collect payments into corporate bank accounts. Please collect in cash.');
            }
            if (bPerm.accessScope === 'selected' && data.ledgerId) {
              const allowedIds = (bPerm.allowedBankIds || []).map(id => id.toString());
              if (!allowedIds.includes(data.ledgerId.toString())) {
                throw ApiError.badRequest('You are not authorized to collect payments into this designated bank account.');
              }
            }
          }
        }
      }
      resolvedLedgerId = data.ledgerId || null;
      if (!resolvedLedgerId) {
        const defaultBank = await Ledger.findOne({ ledgerType: 'bank', status: 'active' });
        if (defaultBank) resolvedLedgerId = defaultBank._id;
      }
    }

    // Save collection transaction history record
    const touchedInstNumbers = targetInsts.map((i) => i.installmentNumber);
    if (!booking.collections) {
      booking.collections = [];
    }
    const newCollection = {
      receiptNumber,
      amountPaid: colAmount,
      principalPaid: totalPrincipalPaidForReceipt,
      lateFinePaid: totalLateFinePaidForReceipt,
      lateFineRebate: rebateAmount - remainingRebate,
      paymentMode,
      transactionReference,
      paymentDate: pDate,
      installmentNumbers: touchedInstNumbers,
      remarks,
      collectedById: userId || null,
      ledgerId: resolvedLedgerId,
    };
    booking.collections.push(newCollection);

    await booking.save();

    const savedCollection = (booking.collections || []).find((c) => c.receiptNumber === receiptNumber);
    const collectionId = savedCollection?._id || newCollection._id;

    if (resolvedLedgerId && colAmount > 0) {
      try {
        await accountingService.recordLedgerEntry({
          ledgerId: resolvedLedgerId,
          date: pDate,
          type: 'CREDIT',
          amount: colAmount,
          source: 'receipt',
          referenceId: booking._id,
          remarks: `Product EMI Receipt: ${receiptNumber} (${booking.bookingNumber || ''}) - Customer: ${booking.customerId?.name || 'Customer'}`
        });
      } catch (err) {
        console.error('Error recording ledger entry for product installment collection:', err);
      }
    }

    // Auto-sync sponsor fixed commission if sponsor is linked to this product booking
    if (booking.sponsorId) {
      try {
        await plotDeveloperService.syncProductBookingSponsorCommissions(booking._id);
      } catch (e) {
        console.error('Error syncing product booking sponsor commission on installment collection:', e);
      }
    }

    const enriched = this.enrichBookingWithDues(booking.toObject(), rateConfig, pDate);


    return {
      _id: collectionId,
      booking: enriched,
      receiptNumber,
      collectedAmount: colAmount,
      principalPaid: totalPrincipalPaidForReceipt,
      lateFinePaid: totalLateFinePaidForReceipt,
      lateFineRebate: rebateAmount - remainingRebate,
      paymentDate: pDate,
      paymentMode,
      transactionReference,
      remarks,
    };
  }

  */

  async getProductCollections(query = {}) {
    const filter = {};
    if (query.bookingId) filter._id = query.bookingId;
    if (query.customerId) filter.customerId = query.customerId;

    const bookings = await PlotProductBooking.find(filter)
      .populate('productId', 'productName productCode dimensions dimensionLabel areaSqFt unitPrice')
      .populate('customerId', 'name customerId customerCode mobile email address fatherOrHusbandName')
      .populate({
        path: 'sponsorId',
        select: 'name sponsorCode mobile email photo sponsorId',
        populate: {
          path: 'sponsorId',
          select: 'name sponsorCode mobile',
        },
      })
      .populate('createdById', 'name email')
      .lean();

    const allCollections = [];
    const seenReceipts = new Set();

    for (const b of bookings) {
      // 1. Check explicitly saved collections
      if (Array.isArray(b.collections) && b.collections.length > 0) {
        for (const col of b.collections) {
          if (!col.receiptNumber || seenReceipts.has(col.receiptNumber)) continue;
          seenReceipts.add(col.receiptNumber);
          allCollections.push({
            _id: col._id || `${b._id}-${col.receiptNumber}`,
            receiptNumber: col.receiptNumber,
            status: 'APPROVED',
            bookingId: b._id,
            bookingNumber: b.bookingNumber,
            bookingDate: b.bookingDate,
            product: b.productId || {},
            customer: b.customerId || {},
            sponsor: b.sponsorId || null,
            quantity: b.quantity || 1,
            unitPrice: b.unitPrice || 0,
            totalAmount: b.totalAmount || 0,
            tenureMonths: b.tenureMonths || 24,
            monthlyEmi: b.monthlyEmi || 0,
            amountPaid: col.amountPaid || 0,
            principalPaid: col.principalPaid || 0,
            lateFinePaid: col.lateFinePaid || 0,
            lateFineRebate: col.lateFineRebate || 0,
            paymentMode: col.paymentMode || 'cash',
            transactionReference: col.transactionReference || '',
            paymentDate: col.paymentDate || col.createdAt || b.createdAt,
            installmentNumbers: col.installmentNumbers || [],
            remarks: col.remarks || '',
            collectedBy: col.collectedById || b.createdById || null,
            status: col.status || (String(col.paymentMode).toLowerCase() === 'cash' ? 'APPROVED' : 'PENDING'),
            approvedBy: col.approvedBy || null,
            approvedAt: col.approvedAt || null,
            rejectionReason: col.rejectionReason || '',
          });
        }
      }

      // 2. Fallback / Merge from installments with receiptNumbers not in collections
      if (Array.isArray(b.installments)) {
        const receiptGroups = {};
        for (const inst of b.installments) {
          if (inst.receiptNumber && !seenReceipts.has(inst.receiptNumber)) {
            if (!receiptGroups[inst.receiptNumber]) {
              receiptGroups[inst.receiptNumber] = {
                receiptNumber: inst.receiptNumber,
                principalPaid: 0,
                lateFinePaid: 0,
                lateFineRebate: 0,
                installmentNumbers: [],
                paymentDate: inst.paidDate || b.createdAt,
              };
            }
            receiptGroups[inst.receiptNumber].principalPaid += Number(inst.paidAmount || 0);
            receiptGroups[inst.receiptNumber].lateFinePaid += Number(inst.lateFinePaid || 0);
            receiptGroups[inst.receiptNumber].lateFineRebate += Number(inst.lateFineRebate || 0);
            receiptGroups[inst.receiptNumber].installmentNumbers.push(inst.installmentNumber);
            if (inst.paidDate) {
              receiptGroups[inst.receiptNumber].paymentDate = inst.paidDate;
            }
          }
        }

        for (const rNum in receiptGroups) {
          const rg = receiptGroups[rNum];
          seenReceipts.add(rNum);
          allCollections.push({
            _id: `${b._id}-${rNum}`,
            receiptNumber: rNum,
            bookingId: b._id,
            bookingNumber: b.bookingNumber,
            bookingDate: b.bookingDate,
            product: b.productId || {},
            customer: b.customerId || {},
            sponsor: b.sponsorId || null,
            quantity: b.quantity || 1,
            unitPrice: b.unitPrice || 0,
            totalAmount: b.totalAmount || 0,
            tenureMonths: b.tenureMonths || 24,
            monthlyEmi: b.monthlyEmi || 0,
            amountPaid: rg.principalPaid + rg.lateFinePaid,
            principalPaid: rg.principalPaid,
            lateFinePaid: rg.lateFinePaid,
            lateFineRebate: rg.lateFineRebate,
            paymentMode: 'cash',
            transactionReference: '',
            paymentDate: rg.paymentDate,
            installmentNumbers: rg.installmentNumbers,
            remarks: '',
            status: 'APPROVED',

            approvedBy: b.createdById || null,
            approvedAt: rg.paymentDate || b.createdAt,
            rejectionReason: '',
            collectedBy: b.createdById || null,
          });
        }
      }

      // 3. Include Initial Downpayment ONLY if > 0 and no specific receipt already captured for it
      const hasDpCaptured =
        seenReceipts.has(`PRD-DP-${b.bookingNumber}`) ||
        seenReceipts.has(`DP-${b.bookingNumber}`) ||
        (Array.isArray(b.collections) &&
          b.collections.some(
            (c) =>
              c.receiptNumber === `PRD-DP-${b.bookingNumber}` ||
              c.receiptNumber === `DP-${b.bookingNumber}` ||
              c.receiptNumber?.startsWith('PRD-DP-') ||
              c.receiptNumber?.startsWith('DP-') ||
              (Array.isArray(c.installmentNumbers) && c.installmentNumbers.includes(0)) ||
              c.remarks?.toLowerCase()?.includes('downpayment') ||
              (b.paymentType === 'FULL_PAYMENT' && Number(c.amountPaid) >= Number(b.totalAmount || 0))
          ));

      if (b.downPayment > 0 && !hasDpCaptured) {
        const dpReceiptNum = `PRD-DP-${b.bookingNumber}`;
        if (!seenReceipts.has(dpReceiptNum) && !seenReceipts.has(`DP-${b.bookingNumber}`)) {
          seenReceipts.add(dpReceiptNum);
          allCollections.push({
            _id: `dp-${b._id}`,
            receiptNumber: dpReceiptNum,
            bookingId: b._id,
            bookingNumber: b.bookingNumber,
            bookingDate: b.bookingDate,
            product: b.productId || {},
            customer: b.customerId || {},
            sponsor: b.sponsorId || null,
            quantity: b.quantity || 1,
            unitPrice: b.unitPrice || 0,
            totalAmount: b.totalAmount || 0,
            tenureMonths: b.tenureMonths || 24,
            monthlyEmi: b.monthlyEmi || 0,
            amountPaid: b.downPayment,
            principalPaid: b.downPayment,
            lateFinePaid: 0,
            lateFineRebate: 0,
            paymentMode: 'cash',
            transactionReference: 'Initial Downpayment',
            paymentDate: b.bookingDate || b.createdAt,
            installmentNumbers: [0],
            remarks: 'Downpayment at Booking',
            status: 'APPROVED',

            approvedBy: b.createdById || null,
            approvedAt: b.bookingDate || b.createdAt,
            rejectionReason: '',
            collectedBy: b.createdById || null,
          });
        }
      }
    }

    // Filter by search text (Receipt #, Customer Name, Customer Code, Mobile, Booking #, Product Name)
    let filtered = allCollections;
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      filtered = filtered.filter((c) => {
        const rMatch = c.receiptNumber?.toLowerCase().includes(q);
        const bMatch = c.bookingNumber?.toLowerCase().includes(q);
        const cNameMatch = c.customer?.name?.toLowerCase().includes(q);
        const cCodeMatch = c.customer?.customerCode?.toLowerCase().includes(q) || c.customer?.customerId?.toLowerCase().includes(q);
        const cMobileMatch = c.customer?.mobile?.includes(q);
        const pNameMatch = c.product?.productName?.toLowerCase().includes(q);
        return rMatch || bMatch || cNameMatch || cCodeMatch || cMobileMatch || pNameMatch;
      });
    }

    // Filter by status if provided
    if (query.status && query.status !== 'ALL') {
      filtered = filtered.filter((c) => (c.status || 'APPROVED').toUpperCase() === query.status.toUpperCase());
    }

    // Filter by payment mode
    if (query.paymentMode && query.paymentMode !== 'ALL') {
      filtered = filtered.filter((c) => c.paymentMode?.toLowerCase() === query.paymentMode.toLowerCase());
    }

    // Filter by date range if provided
    if (query.startDate) {
      const s = new Date(query.startDate);
      filtered = filtered.filter((c) => new Date(c.paymentDate) >= s);
    }
    if (query.endDate) {
      const e = new Date(query.endDate + 'T23:59:59');
      filtered = filtered.filter((c) => new Date(c.paymentDate) <= e);
    }

    // Sort descending by payment date
    filtered.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Calculate KPI Totals
    const approvedList = filtered.filter((c) => (c.status || 'APPROVED').toUpperCase() === 'APPROVED');
    const summary = {
      totalCollected: approvedList.reduce((acc, c) => acc + (Number(c.amountPaid) || 0), 0),
      totalPrincipalPaid: approvedList.reduce((acc, c) => acc + (Number(c.principalPaid) || 0), 0),
      totalLateFinePaid: approvedList.reduce((acc, c) => acc + (Number(c.lateFinePaid) || 0), 0),
      totalLateFineRebate: approvedList.reduce((acc, c) => acc + (Number(c.lateFineRebate) || 0), 0),
      totalReceiptsCount: filtered.length,
      pendingCount: filtered.filter((c) => (c.status || 'APPROVED').toUpperCase() === 'PENDING').length,
    };
    /* LEGACY_SUMMARY_REPLACED */
    const legacy_summary_ignored = {
      totalCollected: filtered.reduce((acc, c) => acc + (Number(c.amountPaid) || 0), 0),
      totalPrincipalPaid: filtered.reduce((acc, c) => acc + (Number(c.principalPaid) || 0), 0),
      totalLateFinePaid: filtered.reduce((acc, c) => acc + (Number(c.lateFinePaid) || 0), 0),
      totalLateFineRebate: filtered.reduce((acc, c) => acc + (Number(c.lateFineRebate) || 0), 0),
      totalReceiptsCount: filtered.length,
    };

    return {
      collections: filtered,
      summary,
    };
  }

  async getProductReceiptById(id, user = null) {
    if (!id) throw ApiError.badRequest('Receipt identifier is required');

    let booking = null;
    let collection = null;

    // 1. Try finding by collections._id if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await PlotProductBooking.findOne({ 'collections._id': id })
        .populate('productId')
        .populate('customerId')
        .populate({
          path: 'sponsorId',
          select: 'name sponsorCode mobile email photo sponsorId',
          populate: { path: 'sponsorId', select: 'name sponsorCode mobile' },
        })
        .populate('createdById', 'name email role');

      if (booking) {
        collection = booking.collections.id(id);
      }
    }

    // 2. If not found by collections._id, try finding by receiptNumber or bookingNumber
    if (!collection) {
      booking = await PlotProductBooking.findOne({
        $or: [
          { 'collections.receiptNumber': id },
          { 'installments.receiptNumber': id },
          { bookingNumber: id.replace(/^(PRD-)?DP-/, '') },
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
        ],
      })
        .populate('productId')
        .populate('customerId')
        .populate({
          path: 'sponsorId',
          select: 'name sponsorCode mobile email photo sponsorId',
          populate: { path: 'sponsorId', select: 'name sponsorCode mobile' },
        })
        .populate('createdById', 'name email role');

      if (booking) {
        collection = (booking.collections || []).find(
          (c) => c.receiptNumber === id || c._id?.toString() === id
        );
      }
    }

    if (!booking) {
      throw ApiError.notFound('Product collection receipt not found');
    }

    // If still no collection found, check if it's an initial downpayment receipt
    if (!collection) {
      const isDp =
        id.startsWith('PRD-DP-') ||
        id.startsWith('DP-') ||
        id === `dp-${booking._id}` ||
        id.toString() === booking._id.toString();

      if (isDp && booking.downPayment > 0) {
        collection = {
          _id: `dp-${booking._id}`,
          receiptNumber: id.startsWith('PRD-DP-') || id.startsWith('DP-') ? id : `PRD-DP-${booking.bookingNumber}`,
          amountPaid: booking.downPayment,
          principalPaid: booking.downPayment,
          lateFinePaid: 0,
          lateFineRebate: 0,
          paymentMode: 'cash',
          transactionReference: 'Initial Downpayment',
          paymentDate: booking.bookingDate || booking.createdAt,
          installmentNumbers: [0],
          remarks: 'Initial Downpayment at booking',
          collectedById: booking.createdById?._id || booking.createdById || null,
        };
      }
    }

    if (!collection) {
      throw ApiError.notFound('Product collection receipt record not found');
    }

    const colObj = collection.toObject ? collection.toObject() : { ...collection };

    // Format into standard receipt shape compatible with ReceiptViewer
    return {
      _id: colObj._id || `${booking._id}-${colObj.receiptNumber}`,
      receiptNumber: colObj.receiptNumber,
      receiptType: (colObj.installmentNumbers || []).includes(0) ? 'DOWNPAYMENT' : 'EMI',
      amount: colObj.amountPaid || 0,
      lateFinePaid: colObj.lateFinePaid || 0,
      lateFineRebate: colObj.lateFineRebate || 0,
      paymentMode: colObj.paymentMode || 'cash',
      transactionReference: colObj.transactionReference || '',
      remarks: colObj.remarks || '',
      createdAt: colObj.paymentDate || colObj.createdAt || booking.bookingDate,

      isProductReceipt: true,
      status: colObj.status || (String(colObj.paymentMode).toLowerCase() === 'cash' ? 'APPROVED' : 'PENDING'),
      approvedBy: colObj.approvedBy || null,
      approvedAt: colObj.approvedAt || null,
      rejectionReason: colObj.rejectionReason || '',
      productDetails: {
        product: booking.productId || {},
        quantity: booking.quantity || 1,
        unitPrice: booking.unitPrice || 0,
        totalAmount: booking.totalAmount || 0,
        tenureMonths: booking.tenureMonths || 24,
        planName: booking.planName || '',
        dimensions: booking.dimensionsSnapshot || {},
        totalAreaSqFt: booking.totalAreaSqFt || (booking.quantity * (booking.productId?.areaSqFt || 1)),
        monthlyEmi: booking.monthlyEmi || 0,
        installmentNumbers: colObj.installmentNumbers || [],
      },
      bookingId: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        bookingDate: booking.bookingDate,
        customerName: booking.customerId?.name,
        customerId: booking.customerId,
        sponsorId: booking.sponsorId,
        remainingAmount: booking.remainingAmount || 0,
        plotValue: booking.totalAmount || 0,
        downpaymentAmount: booking.downPayment || 0,
        product: booking.productId,
        dimensionsSnapshot: booking.dimensionsSnapshot || {},
        totalAreaSqFt: booking.totalAreaSqFt || (booking.quantity * (booking.productId?.areaSqFt || 1)),
      },
      createdBy: colObj.collectedById || booking.createdById,
    };
  }

  async deleteProductCollection(bookingId, receiptNumber, processedBy) {
    if (!receiptNumber) {
      throw ApiError.badRequest('Receipt number is required');
    }

    // Find the product booking
    let booking = null;
    if (bookingId) {
      booking = await PlotProductBooking.findById(bookingId);
    }
    if (!booking) {
      booking = await PlotProductBooking.findOne({
        $or: [
          { 'collections.receiptNumber': receiptNumber },
          { 'installments.receiptNumber': receiptNumber },
          { bookingNumber: receiptNumber.replace(/^(PRD-)?DP-/, '') },
        ],
      });
    }

    if (!booking) {
      throw ApiError.notFound('Product booking or collection receipt not found');
    }

    // Check if any sponsor commission from this receipt is already locked in a closed monthly closing
    const lockedCommission = await PlotSponsorCommission.findOne({
      productBookingId: booking._id,
      receiptNumber,
      closingId: { $ne: null },
    });
    if (lockedCommission) {
      throw ApiError.badRequest(
        'Cannot delete receipt: This collection has already been processed and locked in a Monthly Payout Closing.'
      );
    }

    const isDpReceipt =
      receiptNumber === `DP-${booking.bookingNumber}` ||
      receiptNumber.startsWith('PRD-DP-') ||
      receiptNumber.startsWith('DP-');

    // Remove from booking.collections
    if (Array.isArray(booking.collections)) {
      booking.collections = booking.collections.filter(
        (col) => col.receiptNumber !== receiptNumber
      );
    }

    // Clean up corresponding treasury ledger entry if any
    try {
      const entryToDelete = await Entry.findOne({
        referenceId: booking._id,
        remarks: { $regex: receiptNumber }
      });
      if (entryToDelete) {
        await accountingService.deleteLedgerEntry(entryToDelete._id);
      }
    } catch (e) {
      console.error('Error deleting product receipt ledger entry:', e);
    }

    // If it was down payment receipt
    if (isDpReceipt) {
      booking.downPayment = 0;
    }

    // Rebuild installment ledger from remaining collections
    const rateConfig = await this.getRateConfig();

    // Reset all installments
    if (Array.isArray(booking.installments)) {
      for (const inst of booking.installments) {
        inst.paidAmount = 0;
        inst.paidDate = null;
        inst.receiptNumber = '';
        inst.status = 'PENDING';
        inst.lateDays = 0;
        inst.lateFine = 0;
        inst.lateFinePaid = 0;
        inst.lateFineRebate = 0;
      }
    }

    let totalPrincipal = Number(booking.downPayment || 0);
    let totalFinePaid = 0;
    let totalFineRebate = 0;

    // Sort remaining collections chronologically
    const remainingCollections = (booking.collections || []).slice().sort(
      (a, b) => new Date(a.paymentDate || a.createdAt || 0) - new Date(b.paymentDate || b.createdAt || 0)
    );

    for (const col of remainingCollections) {
      if (col.status === 'PENDING' || col.status === 'REJECTED') continue;
      let remainingPaid = Number(col.amountPaid) || 0;
      let remainingRebate = Number(col.lateFineRebate) || 0;
      const pDate = new Date(col.paymentDate || col.createdAt || Date.now());
      const rNum = col.receiptNumber;

      const targetInsts =
        col.installmentNumbers && col.installmentNumbers.length > 0
          ? booking.installments.filter((i) => col.installmentNumbers.includes(i.installmentNumber))
          : booking.installments.filter((i) => i.status !== 'PAID');

      let colPrincipal = 0;
      let colFine = 0;
      let colRebate = 0;

      for (const inst of targetInsts) {
        if (remainingPaid <= 0 && remainingRebate <= 0) break;
        if (inst.status === 'PAID') continue;

        const stats = this.computeInstallmentStats(inst, rateConfig, pDate);
        const effectiveFine = stats.lateFine;
        inst.lateFine = effectiveFine;
        inst.lateDays = stats.lateDays;

        // 1. Apply rebate first against unpaid late fine
        const unpaidFineBeforeRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const fineRebateThisTime = Math.min(unpaidFineBeforeRebate, remainingRebate);
        inst.lateFineRebate = (inst.lateFineRebate || 0) + fineRebateThisTime;
        remainingRebate -= fineRebateThisTime;
        colRebate += fineRebateThisTime;

        // 2. Distribute payment: FIRST to remaining late fine
        const unpaidFineAfterRebate = Math.max(0, effectiveFine - (inst.lateFinePaid || 0) - (inst.lateFineRebate || 0));
        const finePaidThisTime = Math.min(unpaidFineAfterRebate, remainingPaid);
        inst.lateFinePaid = (inst.lateFinePaid || 0) + finePaidThisTime;
        remainingPaid -= finePaidThisTime;
        colFine += finePaidThisTime;

        // 3. Distribute payment: SECOND to remaining principal
        const unpaidPrincipal = Math.max(0, inst.amount - (inst.paidAmount || 0));
        const principalPaidThisTime = Math.min(unpaidPrincipal, remainingPaid);
        inst.paidAmount = (inst.paidAmount || 0) + principalPaidThisTime;
        remainingPaid -= principalPaidThisTime;
        colPrincipal += principalPaidThisTime;

        inst.paidDate = pDate;
        inst.receiptNumber = rNum;

        const isFullyPaid =
          inst.paidAmount >= inst.amount &&
          inst.lateFinePaid + (inst.lateFineRebate || 0) >= inst.lateFine;
        inst.status = isFullyPaid ? 'PAID' : 'PARTIAL';
      }

      col.principalPaid = colPrincipal;
      col.lateFinePaid = colFine;
      col.lateFineRebate = colRebate;

      totalPrincipal += colPrincipal;
      totalFinePaid += colFine;
      totalFineRebate += colRebate;
    }

    booking.totalPaid = totalPrincipal;
    booking.totalLateFinePaid = totalFinePaid;
    booking.totalLateFineRebate = totalFineRebate;
    booking.remainingAmount = Math.max(0, booking.totalAmount - booking.totalPaid);
    booking.status = booking.remainingAmount <= 0 ? 'COMPLETED' : 'ACTIVE';

    await booking.save();

    // Auto sync commissions for sponsor
    if (booking.sponsorId) {
      try {
        await plotDeveloperService.syncProductBookingSponsorCommissions(booking._id);
      } catch (e) {
        console.error('Error syncing product booking sponsor commission on collection deletion:', e);
      }
    }

    // Log audit
    try {
      await new PlotAuditLog({
        action: 'DELETE_PRODUCT_COLLECTION_RECEIPT',
        modelName: 'PlotProductBooking',
        documentId: booking._id,
        userId: processedBy || null,
        details: { receiptNumber, bookingNumber: booking.bookingNumber },
      }).save();
    } catch (e) {
      console.error('Failed to write audit log for product collection deletion:', e);
    }

    return {
      success: true,
      receiptNumber,
      bookingNumber: booking.bookingNumber,
      message: `Receipt ${receiptNumber} deleted and ledger updated successfully`,
    };
  }

  // ─── CANCELLATION, SETTLEMENT & REFUND ENGINE ───────────────────────

  async cancelProductBookingAndRefund(bookingId, refundData, userId) {
    const {
      settlementType = 'INTEREST_RETURN', // 'INTEREST_RETURN' or 'DEDUCTION_PENALTY'
      deductionType = 'PERCENT',          // 'PERCENT' or 'FLAT'
      deductionPercent = 0,
      deductionAmount = 0,
      interestRate = 0,
      interestAmount = 0,
      refundDate = new Date(),
      remarks = '',
      initialPaymentAmount = 0,
      paymentMode = 'BANK_TRANSFER',
      paymentLedgerId = null,
      transactionReference = '',
    } = refundData;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const booking = await PlotProductBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Product booking not found');
      if (booking.status === 'CANCELLED') {
        throw ApiError.badRequest('Booking is already cancelled and settled');
      }

      // Calculate total principal paid (excluding late fines)
      let totalCollected = Number(booking.totalPaid || 0);
      if (Array.isArray(booking.collections) && booking.collections.length > 0) {
        totalCollected = booking.collections.reduce(
          (sum, c) => sum + (Number(c.principalPaid) || Math.max(0, (Number(c.amountPaid) || 0) - (Number(c.lateFinePaid) || 0))),
          0
        );
      }

      let netRefund = totalCollected;
      let numDeduction = 0;
      let numInterest = 0;

      if (settlementType === 'INTEREST_RETURN') {
        numInterest = Number(interestAmount) || 0;
        netRefund = Math.round((totalCollected + numInterest) * 100) / 100;
        booking.refundSettlementType = 'INTEREST_RETURN';
        booking.refundInterestRate = Number(interestRate) || 0;
        booking.refundInterestAmount = numInterest;
        booking.refundDeduction = 0;
        booking.refundDeductionPercent = 0;
      } else {
        // DEDUCTION_PENALTY
        numDeduction = Number(deductionAmount) || 0;
        netRefund = Math.max(0, Math.round((totalCollected - numDeduction) * 100) / 100);
        booking.refundSettlementType = 'DEDUCTION_PENALTY';
        booking.refundDeductionType = deductionType;
        booking.refundDeductionPercent = Number(deductionPercent) || 0;
        booking.refundDeduction = numDeduction;
        booking.refundInterestRate = 0;
        booking.refundInterestAmount = 0;
      }

      // 1. Restore Product Stock
      const bookingQty = Math.max(1, Number(booking.quantity) || 1);
      await PlotProduct.findByIdAndUpdate(
        booking.productId,
        { $inc: { unitsSold: -bookingQty } },
        { session }
      );

      // 2. Restore Kisan land agreement stock if allocated
      if (Array.isArray(booking.landSourcing) && booking.landSourcing.length > 0) {
        for (const src of booking.landSourcing) {
          const numSqFt = Number(src.allocatedSqFt) || 0;
          if (numSqFt <= 0) continue;

          const agr = await KisanLandAgreement.findById(src.agreementId).session(session);
          if (agr) {
            if (src.sourceType === 'REGISTRY_DEED') {
              const deed = agr.registryDeeds.find(
                (d) => String(d._id) === String(src.deedId) || d.deedNumber === src.deedNumber
              );
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
              remarks: `Restored ${numSqFt} SqFt due to Customer Refund & Cancellation of Product Booking #${booking.bookingNumber}`,
              performedBy: userId,
            }).save({ session });
          }
        }
      }

      // 3. Commission Reversal to Associate / Partner / Branch Ledgers
      const shouldReverseCommission = Boolean(refundData.reverseCommission);
      let reversedCommissionCount = 0;
      let reversedCommissionTotal = 0;

      if (shouldReverseCommission) {
        const activeComms = await PlotSponsorCommission.find({
          productBookingId: booking._id,
          status: 'active',
        }).session(session);

        for (const comm of activeComms) {
          const commAmt = Number(comm.fixedAmount || comm.amount || 0);
          if (commAmt > 0 && (comm.sponsorId || comm.branchId)) {
            const pct = comm.commissionPercent || comm.fixedPercent || 0;
            const colAmt = Number(comm.collectionAmount || comm.plotValue || 0);
            let rcNum = comm.receiptNumber;
            if (!rcNum && comm.receiptId) {
              const rc = await PlotReceipt.findById(comm.receiptId).session(session);
              if (rc) rcNum = rc.receiptNumber;
            }
            rcNum = rcNum || 'N/A';

            const roleLabel = comm.commissionRole === 'BRANCH_OVERRIDE'
              ? 'Branch Override'
              : comm.commissionRole === 'DEVELOPER_OVERRIDE'
                ? 'Partner Override'
                : comm.commissionRole === 'DIRECT_DEVELOPER'
                  ? 'Direct Partner'
                  : 'Business Associate';

            const reversalRemarks = `Reversal: Commission (${pct}%) on ₹${colAmt.toLocaleString('en-IN')} | Plot Product | Receipt #${rcNum} | Booking #${booking.bookingNumber} | ${roleLabel} | Cancellation Reversal`;

            const reversalEntry = await accountingService.recordLedgerEntry({
              sponsorId: comm.sponsorId || null,
              branchId: comm.branchId || null,
              date: new Date(refundDate),
              type: 'DEBIT',
              amount: commAmt,
              source: comm.commissionRole === 'BRANCH_OVERRIDE' ? 'commission_branch' : 'commission_fixed',
              referenceId: comm._id,
              remarks: reversalRemarks,
            }, session);

            comm.status = 'reversed';
            comm.reversedAt = new Date(refundDate);
            comm.reversalLedgerEntryId = reversalEntry._id;
            await comm.save({ session });

            reversedCommissionCount++;
            reversedCommissionTotal += commAmt;
          } else {
            comm.status = 'reversed';
            comm.reversedAt = new Date(refundDate);
            await comm.save({ session });
          }
        }

        booking.commissionReversed = true;
        booking.commissionReversalDate = new Date(refundDate);
        booking.commissionReversalCount = reversedCommissionCount;
        booking.commissionReversalAmount = reversedCommissionTotal;
      } else {
        booking.commissionReversed = false;
        booking.commissionReversalCount = 0;
        booking.commissionReversalAmount = 0;
      }

      // 4. Update Booking Status & Refund metadata
      booking.status = 'CANCELLED';
      booking.refundStatus = 'PROCESSED';
      booking.refundAmount = netRefund;
      booking.refundDate = new Date(refundDate);
      booking.refundNotes = remarks || '';
      booking.refundPayments = [];

      // 5. Initial refund payment disbursement (if any)
      const initPay = Number(initialPaymentAmount) || 0;
      if (initPay > 0) {
        const { paymentEntry, voucher } = await disburseRefundTransaction({
          booking,
          isProduct: true,
          amount: initPay,
          paymentMode,
          paymentLedgerId: refundData.paymentLedgerId,
          transactionReference,
          remarks: remarks || 'Initial refund payment at cancellation',
          paymentDate: refundDate,
          userId,
          session,
        });
        booking.refundVoucherId = voucher._id;
        booking.refundPayments.push(paymentEntry);
      }

      await booking.save({ session });

      // 6. Audit Log
      try {
        await new PlotAuditLog({
          action: 'PROCESS_PRODUCT_CUSTOMER_REFUND',
          modelName: 'PlotProductBooking',
          documentId: booking._id,
          userId,
          details: {
            totalCollected,
            settlementType,
            deductionAmount: numDeduction,
            interestAmount: numInterest,
            netRefund,
            initPay,
          },
        }).save({ session });
      } catch (auditErr) {
        console.warn('[ProductCustomerRefund] Audit log skipped:', auditErr.message);
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        netSettlementAmount: netRefund,
        totalRefundPaid: initPay,
        pendingSettlementBalance: Math.max(0, netRefund - initPay),
        message: `Product booking #${booking.bookingNumber} successfully cancelled with settlement amount ₹${netRefund.toLocaleString('en-IN')}`,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async addProductRefundPartPayment(bookingId, paymentData, userId) {
    const {
      amount,
      paymentMode = 'BANK_TRANSFER',
      paymentLedgerId = null,
      transactionReference = '',
      remarks = '',
      paymentDate = new Date(),
    } = paymentData;

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than 0');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotProductBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Product booking not found');
      if (booking.status !== 'CANCELLED') {
        throw ApiError.badRequest('Refund part-payments can only be recorded for CANCELLED bookings');
      }

      const netSettlement = Number(booking.refundAmount || 0);
      const alreadyPaid = (booking.refundPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        + (booking.refundVoucherId && !booking.refundPayments?.length ? Number(booking.refundAmount || 0) : 0);
      const remainingSettlement = Math.max(0, netSettlement - alreadyPaid);

      if (payAmt > remainingSettlement + 0.01) {
        throw ApiError.badRequest(
          `Payment amount ₹${payAmt} exceeds remaining settlement liability of ₹${remainingSettlement}`
        );
      }

      const { paymentEntry, voucher } = await disburseRefundTransaction({
        booking,
        isProduct: true,
        amount: payAmt,
        paymentMode,
        paymentLedgerId,
        transactionReference,
        remarks: remarks || `Refund part payment #${(booking.refundPayments?.length || 0) + 1}`,
        paymentDate,
        userId,
        session,
      });

      if (!Array.isArray(booking.refundPayments)) {
        booking.refundPayments = [];
      }
      booking.refundPayments.push(paymentEntry);
      await booking.save({ session });

      await session.commitTransaction();

      const totalRefundPaid = alreadyPaid + payAmt;
      const pendingSettlementBalance = Math.max(0, netSettlement - totalRefundPaid);

      return {
        success: true,
        bookingNumber: booking.bookingNumber,
        amountPaid: payAmt,
        voucherNumber: voucher.voucherNo,
        voucherId: voucher._id,
        totalRefundPaid,
        pendingSettlementBalance,
        isFullySettled: pendingSettlementBalance <= 0,
        payment: paymentEntry,
        message: `Recorded refund part-payment of ₹${payAmt.toLocaleString('en-IN')}. Remaining: ₹${pendingSettlementBalance.toLocaleString('en-IN')}`,
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getProductCustomerLedger(bookingId) {
    const booking = await PlotProductBooking.findById(bookingId)
      .populate('customerId')
      .populate('productId')
      .populate('sponsorId', 'name sponsorCode mobile')
      .lean();

    if (!booking) throw ApiError.notFound('Product booking not found');

    const totalAmount = Number(booking.totalAmount || 0);
    const totalPaid = Number(booking.totalPaid || 0);
    const isCancelled = booking.status === 'CANCELLED';

    const ledgerEntries = [];
    let runningBalance = 0;

    // 1. Initial Booking Contract Valuation (Debit)
    runningBalance += totalAmount;
    ledgerEntries.push({
      date: booking.bookingDate || booking.createdAt,
      type: 'DEBIT',
      category: 'SALE_CONTRACT',
      particulars: `Plot Product Sale Booking #${booking.bookingNumber} (${booking.quantity || 1} Unit @ ₹${booking.unitPrice || 0})`,
      referenceNumber: booking.bookingNumber,
      paymentMode: 'CONTRACT',
      debit: totalAmount,
      credit: 0,
      balance: runningBalance,
      notes: `Product: ${booking.productId?.productName || 'Micro Plot Unit'} • Tenure: ${booking.tenureMonths || 24} Months`,
    });

    // 2. Collections (Credits)
    const collections = (booking.collections || []).slice().sort(
      (a, b) => new Date(a.paymentDate || a.createdAt || 0) - new Date(b.paymentDate || b.createdAt || 0)
    );

    collections.forEach((col, idx) => {
      const paid = Number(col.amountPaid || 0);
      runningBalance -= paid;
      ledgerEntries.push({
        _id: col._id,
        date: col.paymentDate || col.createdAt,
        type: 'CREDIT',
        category: 'COLLECTION_RECEIPT',
        particulars: `Collection Receipt (${col.paymentMode?.toUpperCase() || 'CASH'})${col.transactionReference ? ` - Ref: ${col.transactionReference}` : ''}`,
        referenceNumber: col.receiptNumber || `RCP-${idx + 1}`,
        paymentMode: col.paymentMode || 'cash',
        transactionReference: col.transactionReference || '',
        debit: 0,
        credit: paid,
        balance: runningBalance,
        notes: col.remarks || 'Customer payment received',
      });
    });

    // 3. If Cancelled, append Cancellation Reversal, Settlement Adjustment, and Refund Part-Payments
    if (isCancelled) {
      const cancelDate = booking.refundDate || booking.updatedAt || new Date();

      // A. Contract Reversal (Credit: reverses the initial debit valuation)
      runningBalance -= totalAmount;
      ledgerEntries.push({
        date: cancelDate,
        type: 'CREDIT',
        category: 'CANCELLATION_REVERSAL',
        particulars: `Booking Cancellation Contract Reversal #${booking.bookingNumber}`,
        referenceNumber: 'CNCL-REV',
        paymentMode: 'ADJUSTMENT',
        debit: 0,
        credit: totalAmount,
        balance: runningBalance,
        notes: `Contract value reversed upon booking cancellation. Customer deposits held: ₹${totalPaid.toLocaleString('en-IN')}`,
      });

      // B. Settlement Adjustment
      if (booking.refundSettlementType === 'INTEREST_RETURN' && Number(booking.refundInterestAmount) > 0) {
        const intAmt = Number(booking.refundInterestAmount);
        runningBalance -= intAmt;
        ledgerEntries.push({
          date: cancelDate,
          type: 'CREDIT',
          category: 'SETTLEMENT_INTEREST',
          particulars: `Maturity / Cancellation Growth Return (${booking.refundInterestRate}% P.A.)`,
          referenceNumber: 'INT-ADJ',
          paymentMode: 'ADJUSTMENT',
          debit: 0,
          credit: intAmt,
          balance: runningBalance,
          notes: 'Customer return accrued on deposits as per scheme matrix',
        });
      } else if (booking.refundSettlementType === 'DEDUCTION_PENALTY' && Number(booking.refundDeduction) > 0) {
        const dedAmt = Number(booking.refundDeduction);
        runningBalance += dedAmt;
        const dedLabel = booking.refundDeductionType === 'PERCENT'
          ? `Cancellation Deduction Penalty (${booking.refundDeductionPercent}%)`
          : `Cancellation Deduction Penalty (Flat ₹${dedAmt})`;
        ledgerEntries.push({
          date: cancelDate,
          type: 'DEBIT',
          category: 'SETTLEMENT_DEDUCTION',
          particulars: dedLabel,
          referenceNumber: 'PENALTY-ADJ',
          paymentMode: 'ADJUSTMENT',
          debit: dedAmt,
          credit: 0,
          balance: runningBalance,
          notes: 'Deducted from customer deposits as per cancellation terms',
        });
      }

      // C. Refund Part-Payments to Customer
      if (Array.isArray(booking.refundPayments) && booking.refundPayments.length > 0) {
        booking.refundPayments.forEach((p, pIdx) => {
          const pAmt = Number(p.amount || 0);
          runningBalance += pAmt;
          ledgerEntries.push({
            _id: p._id,
            date: p.date || cancelDate,
            type: 'DEBIT',
            category: 'REFUND_PAYOUT',
            particulars: `Settlement Refund Paid to Customer (Part ${pIdx + 1})${p.paymentMode ? ` via ${p.paymentMode}` : ''}${p.transactionReference ? ` (Ref: ${p.transactionReference})` : ''}`,
            referenceNumber: p.voucherNumber || `REF-PART-${pIdx + 1}`,
            paymentMode: p.paymentMode || 'BANK_TRANSFER',
            transactionReference: p.transactionReference || '',
            debit: pAmt,
            credit: 0,
            balance: runningBalance,
            notes: p.remarks || 'Refund disbursement paid to customer',
          });
        });
      } else if (Number(booking.refundAmount) > 0 && booking.refundVoucherId && !booking.refundPayments?.length) {
        const legacyAmt = Number(booking.refundAmount);
        runningBalance += legacyAmt;
        ledgerEntries.push({
          date: cancelDate,
          type: 'DEBIT',
          category: 'REFUND_PAYOUT',
          particulars: `Customer Cancellation Refund Paid via ${booking.refundNotes || 'Bank/Cash'}`,
          referenceNumber: 'REFUND-PAID',
          paymentMode: 'REFUND',
          debit: legacyAmt,
          credit: 0,
          balance: runningBalance,
          notes: 'Full refund disbursed to customer',
        });
      }
    }

    const totalRefundPaid = (booking.refundPayments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      + (booking.refundVoucherId && !booking.refundPayments?.length ? Number(booking.refundAmount || 0) : 0);
    const netSettlementAmount = Number(booking.refundAmount || 0);
    const pendingSettlementBalance = Math.max(0, netSettlementAmount - totalRefundPaid);

    return {
      booking,
      ledgerEntries,
      summary: {
        totalAmount,
        totalPaid,
        outstandingBalance: isCancelled ? pendingSettlementBalance : Math.max(0, runningBalance),
        isCancelled,
        status: booking.status,
        refundSettlementType: booking.refundSettlementType || 'NONE',
        refundDeduction: Number(booking.refundDeduction || 0),
        refundDeductionPercent: Number(booking.refundDeductionPercent || 0),
        refundInterestRate: Number(booking.refundInterestRate || 0),
        refundInterestAmount: Number(booking.refundInterestAmount || 0),
        netSettlementAmount,
        totalRefundPaid,
        pendingSettlementBalance,
        isFullySettled: isCancelled && pendingSettlementBalance <= 0,
      },
    };
  }
}

module.exports = new PlotProductService();

