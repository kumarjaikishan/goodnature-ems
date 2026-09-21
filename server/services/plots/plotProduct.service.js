const mongoose = require('mongoose');
const ApiError = require('../../utils/apiError');
const PlotProduct = require('../../models/PlotProduct');
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
const Plot = require('../../models/Plot');
const plotDeveloperService = require('./plotDeveloper.service');

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
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

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
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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
    if (query.search) {
      const q = query.search.trim();
      filter.$or = [
        { productName: { $regex: q, $options: 'i' } },
        { productCode: { $regex: q, $options: 'i' } },
        { dimensionLabel: { $regex: q, $options: 'i' } },
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

    const product = new PlotProduct({
      productName: productName.trim(),
      productCode,
      category: category.trim(),
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
        tenureMonths: s.tenureMonths,
        rdMaturityPercent: s.rdMaturityPercent,
        fdMaturityPercent: s.fdMaturityPercent,
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
    const totalArea = Math.round(qty * (product.areaSqFt || 2) * 100) / 100;
    const isFullPayment = paymentType === 'FULL_PAYMENT';
    const dp = isFullPayment ? totalAmount : 0;
    const remainingAmount = isFullPayment ? 0 : totalAmount;
    const tenure = Math.max(1, Number(tenureMonths) || 24);

    // Compute Monthly EMI in whole round figure (no decimals)
    const monthlyEmi = isFullPayment
      ? 0
      : Math.round(totalAmount / tenure);

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

    // Generate EMI installments schedule
    const installments = [];
    if (paymentType === 'MONTHLY_INSTALLMENT' && remainingAmount > 0) {
      let accumulated = 0;
      for (let i = 1; i <= tenure; i++) {
        const dueDate = new Date(bDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Adjust last installment for precision rounding
        const emiAmt = i === tenure
          ? Math.round((remainingAmount - accumulated) * 100) / 100
          : monthlyEmi;

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

    const bookingStatus = isFullPayment ? 'COMPLETED' : 'ACTIVE';

    const collections = [];
    if (dp > 0) {
      collections.push({
        receiptNumber: `PRD-DP-${bookingNumber}`,
        amountPaid: dp,
        principalPaid: dp,
        lateFinePaid: 0,
        lateFineRebate: 0,
        paymentMode: data.paymentMode || 'cash',
        transactionReference: data.transactionReference || '',
        paymentDate: bDate,
        installmentNumbers: [],
        remarks: isFullPayment ? 'Full Payment recorded at time of booking' : 'Initial Downpayment at booking',
        collectedById: userId || null,
      });
    }

    const bookingDoc = new PlotProductBooking({
      bookingNumber,
      bookingDate: bDate,
      productId: product._id,
      plotId: plotId || null,
      customerId: customer._id,
      sponsorId,
      quantity: qty,
      unitPrice,
      totalAmount,
      totalAreaSqFt: totalArea,
      dimensionsSnapshot: {
        north: product.dimensions?.north || 1,
        south: product.dimensions?.south || 1,
        east: product.dimensions?.east || 2,
        west: product.dimensions?.west || 2,
        unit: product.dimensions?.unit || 'feet',
        dimensionLabel: product.dimensionLabel || `${product.dimensions?.north || 1} ft x ${product.dimensions?.east || 2} ft`,
      },
      tenureMonths: tenure,
      paymentType,
      downPayment: dp,
      remainingAmount: isFullPayment ? 0 : remainingAmount,
      monthlyEmi: isFullPayment ? 0 : monthlyEmi,
      totalPaid: dp,
      installments,
      collections,
      landSourcing: processedSourcing,
      status: bookingStatus,
      remarks: remarks.trim(),
      createdById: userId,
    });

    await bookingDoc.save();

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
      bookingDate,
      status,
      remarks,
      paymentMode,
      transactionReference,
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
    const totalArea = Math.round(newQty * (targetProduct?.areaSqFt || 2) * 100) / 100;
    booking.totalAmount = totalAmount;
    booking.totalAreaSqFt = totalArea;

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
      const dp = isFullPayment ? totalAmount : 0;
      const remainingAmount = isFullPayment ? 0 : totalAmount;
      const monthlyEmi = isFullPayment ? 0 : Math.round(totalAmount / newTenure);

      booking.downPayment = dp;
      booking.remainingAmount = remainingAmount;
      booking.monthlyEmi = monthlyEmi;

      if (isFullPayment) {
        booking.totalPaid = dp;
        booking.installments = [];
        booking.collections = [{
          receiptNumber: `PRD-DP-${booking.bookingNumber}`,
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
        booking.collections = [];
        if (!status) booking.status = 'ACTIVE';

        const installments = [];
        let accumulated = 0;
        for (let i = 1; i <= newTenure; i++) {
          const dueDate = new Date(bDate);
          dueDate.setMonth(dueDate.getMonth() + i);

          const emiAmt = i === newTenure
            ? Math.round((remainingAmount - accumulated) * 100) / 100
            : monthlyEmi;

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
    await PlotSponsorCommission.deleteMany({ bookingId: booking._id });

    await PlotProductBooking.findByIdAndDelete(id);
    return { message: 'Product booking deleted successfully' };
  }

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

    // Save collection transaction history record
    const touchedInstNumbers = targetInsts.map((i) => i.installmentNumber);
    if (!booking.collections) {
      booking.collections = [];
    }
    booking.collections.push({
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
    });

    await booking.save();

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
          if (!col.receiptNumber) continue;
          seenReceipts.add(col.receiptNumber);
          allCollections.push({
            _id: col._id || `${b._id}-${col.receiptNumber}`,
            receiptNumber: col.receiptNumber,
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
            collectedBy: b.createdById || null,
          });
        }
      }

      // 3. Include Initial Downpayment if > 0 and no specific receipt already captured for it
      if (b.downPayment > 0 && !seenReceipts.has(`DP-${b.bookingNumber}`)) {
        const dpReceiptNum = `DP-${b.bookingNumber}`;
        if (!seenReceipts.has(dpReceiptNum)) {
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
    const summary = {
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
          { bookingNumber: receiptNumber.replace(/^DP-/, '') },
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
}

module.exports = new PlotProductService();

