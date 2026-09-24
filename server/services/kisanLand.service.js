const mongoose = require('mongoose');
const KisanLandAgreement = require('../models/KisanLandAgreement');
const LandStockLedger = require('../models/LandStockLedger');
const KisanLedger = require('../models/KisanLedger');
const KisanSeller = require('../models/KisanSeller');
const LandPurchaser = require('../models/LandPurchaser');
const Counter = require('../models/Counter');
const ApiError = require('../utils/apiError');
const { withTransaction } = require('../utils/transaction');

class KisanLandService {
  /**
   * Helper: Calculate financial year string (e.g. 2627)
   */
  getFyString(dateObj = new Date()) {
    const d = new Date(dateObj);
    const month = d.getMonth();
    const fullYear = d.getFullYear();
    let startYearVal, endYearVal;
    if (month >= 3) {
      startYearVal = fullYear;
      endYearVal = fullYear + 1;
    } else {
      startYearVal = fullYear - 1;
      endYearVal = fullYear;
    }
    return `${String(startYearVal).slice(-2)}${String(endYearVal).slice(-2)}`;
  }

  /**
   * 1. Create a new Kisan Land Agreement
   */
  async createAgreement(data, userId) {
    return withTransaction(async (session) => {
      const {
        agreementDate,
        agreementEndDate,
        landParcels,
        // Legacy single-parcel support
        mauja,
        thanaNumber,
        khataNumber,
        khesraNumber,
        jamabandiNumber,
        araziDismil,
        ratePerDismil,
        totalAgreementAmount,
        farmers,
        purchasers,
        attachments,
        remarks,
      } = data;

      // 1. Build parsed land parcels array
      let rawParcels = Array.isArray(landParcels) && landParcels.length > 0 ? landParcels : [];
      if (rawParcels.length === 0) {
        if (!mauja || !khataNumber || !khesraNumber) {
          throw ApiError.badRequest('Mauja, Khata Number, and Khesra Number are required');
        }
        const numDismil = Number(araziDismil);
        if (!numDismil || numDismil <= 0) {
          throw ApiError.badRequest('Valid Arazi (Area in Dismil) is required');
        }
        rawParcels = [
          {
            mauja: mauja.trim(),
            thanaNumber: thanaNumber ? thanaNumber.trim() : '',
            khataNumber: khataNumber.trim(),
            khesraNumber: khesraNumber.trim(),
            jamabandiNumber: jamabandiNumber ? jamabandiNumber.trim() : '',
            chaudhi: data.chaudhi || { north: '', south: '', east: '', west: '' },
            araziDismil: numDismil,
            ratePerDismil: Number(ratePerDismil) || 0,
            totalAmount: totalAgreementAmount !== undefined ? Number(totalAgreementAmount) : Math.round(numDismil * (Number(ratePerDismil) || 0)),
            remarks: remarks || '',
          },
        ];
      }

      const parsedParcels = rawParcels.map((p, idx) => {
        if (!p.mauja || !p.khataNumber || !p.khesraNumber) {
          throw ApiError.badRequest(`Parcel #${idx + 1}: Mauja, Khata Number, and Khesra/Plot Number are required`);
        }
        const pDismil = Number(p.araziDismil);
        if (!pDismil || pDismil <= 0) {
          throw ApiError.badRequest(`Parcel #${idx + 1} (${p.mauja}): Valid Arazi (Area in Dismil) is required`);
        }
        const pSqFt = Math.round(pDismil * 435.6 * 100) / 100;
        const pRate = Number(p.ratePerDismil) || 0;
        const pRateSqFt = pRate > 0 ? Math.round((pRate / 435.6) * 100) / 100 : (Number(p.ratePerSqFt) || 0);
        const pAmount = p.totalAmount !== undefined && p.totalAmount !== ''
          ? Number(p.totalAmount)
          : Math.round(pDismil * pRate);

        return {
          mauja: p.mauja.trim(),
          thanaNumber: p.thanaNumber ? p.thanaNumber.trim() : '',
          khataNumber: p.khataNumber.trim(),
          khesraNumber: p.khesraNumber.trim(),
          jamabandiNumber: p.jamabandiNumber ? p.jamabandiNumber.trim() : '',
          chaudhi: {
            north: p.chaudhi?.north ? p.chaudhi.north.trim() : '',
            south: p.chaudhi?.south ? p.chaudhi.south.trim() : '',
            east: p.chaudhi?.east ? p.chaudhi.east.trim() : '',
            west: p.chaudhi?.west ? p.chaudhi.west.trim() : '',
          },
          araziDismil: pDismil,
          totalSqFt: pSqFt,
          ratePerDismil: pRate,
          ratePerSqFt: pRateSqFt,
          totalAmount: pAmount,
          registeredDismil: 0,
          registeredSqFt: 0,
          unregisteredAgreedSqFt: pSqFt,
          unregisteredAllocatedSqFt: 0,
          unregisteredAvailableSqFt: pSqFt,
          allocatedSqFt: 0,
          availableSqFt: pSqFt,
          remarks: p.remarks || '',
        };
      });

      // Calculate Agreement Totals across all Parcels
      const totalAraziDismil = Math.round(parsedParcels.reduce((sum, p) => sum + p.araziDismil, 0) * 1000) / 1000;
      const totalSqFt = Math.round(parsedParcels.reduce((sum, p) => sum + p.totalSqFt, 0) * 100) / 100;
      const calcAgreementAmount = totalAgreementAmount !== undefined && totalAgreementAmount !== ''
        ? Number(totalAgreementAmount)
        : Math.round(parsedParcels.reduce((sum, p) => sum + p.totalAmount, 0));

      const avgRatePerDismil = totalAraziDismil > 0 ? Math.round(calcAgreementAmount / totalAraziDismil) : 0;

      // Primary descriptors for backward-compatible filters
      const primaryMauja = parsedParcels[0]?.mauja || '';
      const primaryKhata = parsedParcels.map((p) => p.khataNumber).filter(Boolean).join(', ');
      const primaryKhesra = parsedParcels.map((p) => p.khesraNumber).filter(Boolean).join(', ');
      const primaryThana = parsedParcels[0]?.thanaNumber || '';
      const primaryJamabandi = parsedParcels.map((p) => p.jamabandiNumber).filter(Boolean).join(', ');

      // Handle agreementNumber (manual input required or validated)
      let agreementNumber = data.agreementNumber ? data.agreementNumber.trim().toUpperCase() : '';
      if (!agreementNumber) {
        // Fallback sequence if not provided: AGR-2627-001
        const fyStr = this.getFyString(agreementDate);
        const prefix = `KISAN_AGR_FY_${fyStr}`;
        const counterOpts = { new: true, upsert: true };
        if (session) counterOpts.session = session;
        const counter = await Counter.findByIdAndUpdate(
          prefix,
          { $inc: { sequence: 1 } },
          counterOpts
        );
        agreementNumber = `AGR-${fyStr}-${String(counter.sequence).padStart(3, '0')}`;
      } else {
        const existing = await KisanLandAgreement.findOne({ agreementNumber }).session(session || null);
        if (existing) {
          throw ApiError.badRequest(`Agreement Number "${agreementNumber}" is already in use.`);
        }
      }

      // Initialize farmers array
      const parsedFarmers = Array.isArray(farmers) && farmers.length > 0
        ? farmers.map((f) => ({
            name: f.name ? f.name.trim() : 'Kisan',
            guardianName: f.guardianName || '',
            relation: f.relation || 'Father',
            mobile: f.mobile || '',
            aadhaarNumber: f.aadhaarNumber || '',
            panNumber: f.panNumber || '',
            sharePercent: Number(f.sharePercent) || 100,
            address: f.address || '',
            bankDetails: f.bankDetails || {},
          }))
        : [
            {
              name: 'Owner',
              guardianName: '',
              relation: 'Father',
              mobile: '',
              aadhaarNumber: '',
              panNumber: '',
              sharePercent: 100,
            },
          ];

      // Parse purchasers / buyers list
      const parsedPurchasers = Array.isArray(purchasers) && purchasers.length > 0
        ? purchasers
            .filter((p) => p && p.name && p.name.trim())
            .map((p) => ({
              name: p.name.trim(),
              contact: p.contact ? p.contact.trim() : (p.mobile ? p.mobile.trim() : ''),
              mobile: p.mobile ? p.mobile.trim() : (p.contact ? p.contact.trim() : ''),
              aadhaarNumber: p.aadhaarNumber ? p.aadhaarNumber.trim() : '',
              panNumber: p.panNumber ? p.panNumber.trim() : '',
              address: p.address ? p.address.trim() : '',
            }))
        : [];

      // Parse attachments list
      const parsedAttachments = Array.isArray(attachments)
        ? attachments
            .filter((att) => att.fileUrl && att.fileName)
            .map((att) => ({
              fileName: att.fileName.trim(),
              fileType: att.fileType ? att.fileType.trim() : 'Agreement Scan',
              fileUrl: att.fileUrl.trim(),
              fileSize: Number(att.fileSize) || 0,
              description: att.description || '',
              uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
              uploadedBy: userId,
            }))
        : [];

      const agreement = new KisanLandAgreement({
        agreementNumber,
        agreementDate: agreementDate ? new Date(agreementDate) : new Date(),
        agreementEndDate: agreementEndDate ? new Date(agreementEndDate) : null,
        landParcels: parsedParcels,
        mauja: primaryMauja,
        thanaNumber: primaryThana,
        khataNumber: primaryKhata,
        khesraNumber: primaryKhesra,
        jamabandiNumber: primaryJamabandi,
        araziDismil: totalAraziDismil,
        totalSqFt,
        ratePerDismil: avgRatePerDismil,
        totalAgreementAmount: calcAgreementAmount,
        farmers: parsedFarmers,
        purchasers: parsedPurchasers,
        attachments: parsedAttachments,
        registryDeeds: [],
        totalRegisteredDismil: 0,
        totalRegisteredSqFt: 0,
        unregisteredAgreedSqFt: totalSqFt,
        unregisteredAllocatedSqFt: 0,
        unregisteredAvailableSqFt: totalSqFt,
        totalAllocatedSqFt: 0,
        totalAvailableSqFt: totalSqFt,
        status: 'ACTIVE',
        remarks: remarks || '',
        createdBy: userId,
      });

      await agreement.save(session ? { session } : {});

      // Initial Stock Ledger entry
      const parcelSummary = parsedParcels.map((p) => `${p.mauja} (K:${p.khataNumber}/Kh:${p.khesraNumber}) - ${p.araziDismil} Dismil`).join('; ');
      const stockLedger = new LandStockLedger({
        agreementId: agreement._id,
        sourceType: 'AGREEMENT',
        deedId: null,
        deedNumber: '',
        transactionType: 'INITIAL_AGREEMENT',
        entryType: 'CREDIT',
        dismil: totalAraziDismil,
        sqFt: totalSqFt,
        runningAvailableSqFt: totalSqFt,
        date: agreement.agreementDate,
        remarks: `Initial Acquisition Agreement #${agreementNumber} (${parsedParcels.length} Parcels: ${parcelSummary}) Total: ${totalAraziDismil} Dismil (${totalSqFt} Sq Ft)`,
        performedBy: userId,
      });
      await stockLedger.save(session ? { session } : {});

      // If calcAgreementAmount > 0, post initial CREDIT to Kisan Ledger
      if (calcAgreementAmount > 0) {
        const primaryFarmer = parsedFarmers[0];
        const kLedger = new KisanLedger({
          agreementId: agreement._id,
          agreementNumber,
          farmerId: primaryFarmer?._id || null,
          farmerName: primaryFarmer?.name || 'Kisan',
          farmerMobile: primaryFarmer?.mobile || '',
          type: 'CREDIT',
          amount: calcAgreementAmount,
          runningBalance: calcAgreementAmount,
          paymentMode: 'AGREEMENT_VALUE',
          transactionReference: agreementNumber,
          date: agreement.agreementDate,
          remarks: `Total Agreed Land Value for ${totalAraziDismil} Dismil across ${parsedParcels.length} parcel(s)`,
          processedBy: userId,
        });
        await kLedger.save(session ? { session } : {});
      }

      return agreement;
    });
  }

  /**
   * 2. Convert a portion or all parcels of Agreement to Official Registry Deed
   */
  async addRegistryDeed(agreementId, deedData, userId) {
    return withTransaction(async (session) => {
      const q = KisanLandAgreement.findById(agreementId);
      if (session) q.session(session);
      const agreement = await q;
      if (!agreement) throw ApiError.notFound('Land Agreement not found');

      const { deedNumber, deedDate, subRegistrarOffice, registeredDismil, parcels, remarks } = deedData;
      if (!deedNumber) throw ApiError.badRequest('Registry Deed Number is required');

      // Check for duplicate deed number inside this agreement
      const existingDeed = agreement.registryDeeds.find(
        (d) => d.deedNumber.toUpperCase() === deedNumber.trim().toUpperCase()
      );
      if (existingDeed) {
        throw ApiError.badRequest(`Deed Number ${deedNumber} already registered under this agreement.`);
      }

      // Ensure landParcels exists (self-heal legacy single-parcel agreements if needed)
      if (!agreement.landParcels || agreement.landParcels.length === 0) {
        agreement.landParcels = [
          {
            mauja: agreement.mauja || 'Main',
            thanaNumber: agreement.thanaNumber || '',
            khataNumber: agreement.khataNumber || '',
            khesraNumber: agreement.khesraNumber || '',
            jamabandiNumber: agreement.jamabandiNumber || '',
            chaudhi: { north: '', south: '', east: '', west: '' },
            araziDismil: agreement.araziDismil || 0,
            totalSqFt: agreement.totalSqFt || 0,
            ratePerDismil: agreement.ratePerDismil || 0,
            totalAmount: agreement.totalAgreementAmount || 0,
            registeredDismil: agreement.totalRegisteredDismil || 0,
            registeredSqFt: agreement.totalRegisteredSqFt || 0,
            unregisteredAgreedSqFt: agreement.unregisteredAgreedSqFt || 0,
            unregisteredAllocatedSqFt: agreement.unregisteredAllocatedSqFt || 0,
            unregisteredAvailableSqFt: agreement.unregisteredAvailableSqFt || 0,
            allocatedSqFt: agreement.totalAllocatedSqFt || 0,
            availableSqFt: agreement.totalAvailableSqFt || 0,
          },
        ];
      }

      const deedParcelAllocations = [];
      let totalDeedDismil = 0;
      let totalDeedSqFt = 0;

      if (Array.isArray(parcels) && parcels.length > 0) {
        // Selective multi-parcel registration
        for (const item of parcels) {
          const itemDismil = Number(item.registeredDismil);
          if (!itemDismil || itemDismil <= 0) continue;

          const parcelDoc = agreement.landParcels.id(item.parcelId);
          if (!parcelDoc) {
            throw ApiError.badRequest(`Land parcel with ID ${item.parcelId} not found in this agreement.`);
          }

          const currentReg = parcelDoc.registeredDismil || 0;
          const maxAvailReg = Math.max(0, parcelDoc.araziDismil - currentReg);
          if (itemDismil > maxAvailReg + 0.001) {
            throw ApiError.badRequest(
              `Cannot register ${itemDismil} Dismil on parcel (Mauja: ${parcelDoc.mauja}, Khesra: ${parcelDoc.khesraNumber}). Max unregistered available is ${maxAvailReg.toFixed(3)} Dismil.`
            );
          }

          const itemSqFt = Math.round(itemDismil * 435.6 * 100) / 100;

          // Update parcel subdocument counters
          parcelDoc.registeredDismil = Math.round((currentReg + itemDismil) * 1000) / 1000;
          parcelDoc.registeredSqFt = Math.round(((parcelDoc.registeredSqFt || 0) + itemSqFt) * 100) / 100;
          parcelDoc.unregisteredAgreedSqFt = Math.max(0, Math.round((parcelDoc.totalSqFt - parcelDoc.registeredSqFt) * 100) / 100);
          parcelDoc.unregisteredAvailableSqFt = Math.max(
            0,
            Math.round((parcelDoc.unregisteredAgreedSqFt - (parcelDoc.unregisteredAllocatedSqFt || 0)) * 100) / 100
          );

          deedParcelAllocations.push({
            parcelId: parcelDoc._id,
            mauja: parcelDoc.mauja,
            khataNumber: parcelDoc.khataNumber,
            khesraNumber: parcelDoc.khesraNumber,
            thanaNumber: parcelDoc.thanaNumber || '',
            jamabandiNumber: parcelDoc.jamabandiNumber || '',
            chaudhi: parcelDoc.chaudhi || {},
            registeredDismil: itemDismil,
            registeredSqFt: itemSqFt,
          });

          totalDeedDismil += itemDismil;
          totalDeedSqFt += itemSqFt;
        }

        if (deedParcelAllocations.length === 0) {
          throw ApiError.badRequest('Please enter a positive registered dismil for at least one parcel.');
        }
      } else {
        // Flat/Legacy registration across agreement parcels
        const numRegDismil = Number(registeredDismil);
        if (!numRegDismil || numRegDismil <= 0) {
          throw ApiError.badRequest('Valid Registered Area in Dismil is required');
        }

        const remainingAgreementDismil = Math.max(
          0,
          agreement.araziDismil - (agreement.totalRegisteredDismil || 0)
        );
        if (numRegDismil > remainingAgreementDismil + 0.001) {
          throw ApiError.badRequest(
            `Cannot register ${numRegDismil} Dismil. Remaining unregistered agreement area is only ${remainingAgreementDismil.toFixed(3)} Dismil.`
          );
        }

        let neededDismil = numRegDismil;
        for (const parcelDoc of agreement.landParcels) {
          if (neededDismil <= 0) break;
          const currentReg = parcelDoc.registeredDismil || 0;
          const parcelUnreg = Math.max(0, parcelDoc.araziDismil - currentReg);
          if (parcelUnreg <= 0) continue;

          const allocDismil = Math.min(parcelUnreg, neededDismil);
          const allocSqFt = Math.round(allocDismil * 435.6 * 100) / 100;

          parcelDoc.registeredDismil = Math.round((currentReg + allocDismil) * 1000) / 1000;
          parcelDoc.registeredSqFt = Math.round(((parcelDoc.registeredSqFt || 0) + allocSqFt) * 100) / 100;
          parcelDoc.unregisteredAgreedSqFt = Math.max(0, Math.round((parcelDoc.totalSqFt - parcelDoc.registeredSqFt) * 100) / 100);
          parcelDoc.unregisteredAvailableSqFt = Math.max(
            0,
            Math.round((parcelDoc.unregisteredAgreedSqFt - (parcelDoc.unregisteredAllocatedSqFt || 0)) * 100) / 100
          );

          deedParcelAllocations.push({
            parcelId: parcelDoc._id,
            mauja: parcelDoc.mauja,
            khataNumber: parcelDoc.khataNumber,
            khesraNumber: parcelDoc.khesraNumber,
            thanaNumber: parcelDoc.thanaNumber || '',
            jamabandiNumber: parcelDoc.jamabandiNumber || '',
            chaudhi: parcelDoc.chaudhi || {},
            registeredDismil: allocDismil,
            registeredSqFt: allocSqFt,
          });

          neededDismil -= allocDismil;
        }

        totalDeedDismil = numRegDismil;
        totalDeedSqFt = Math.round(numRegDismil * 435.6 * 100) / 100;
      }

      totalDeedDismil = Math.round(totalDeedDismil * 1000) / 1000;
      totalDeedSqFt = Math.round(totalDeedSqFt * 100) / 100;

      // Create new Registry Deed object
      const newDeed = {
        deedNumber: deedNumber.trim().toUpperCase(),
        deedDate: deedDate ? new Date(deedDate) : new Date(),
        subRegistrarOffice: subRegistrarOffice ? subRegistrarOffice.trim() : '',
        registeredDismil: totalDeedDismil,
        registeredSqFt: totalDeedSqFt,
        allocatedSqFt: 0,
        availableSqFt: totalDeedSqFt,
        parcels: deedParcelAllocations,
        status: 'ACTIVE',
        remarks: remarks || '',
      };

      agreement.registryDeeds.push(newDeed);
      const insertedDeed = agreement.registryDeeds[agreement.registryDeeds.length - 1];

      // Update agreement registration counters
      agreement.totalRegisteredDismil = Math.round(
        agreement.landParcels.reduce((sum, p) => sum + (p.registeredDismil || 0), 0) * 1000
      ) / 1000;
      agreement.totalRegisteredSqFt = Math.round(
        agreement.landParcels.reduce((sum, p) => sum + (p.registeredSqFt || 0), 0) * 100
      ) / 100;
      agreement.unregisteredAgreedSqFt = Math.max(
        0,
        Math.round((agreement.totalSqFt - agreement.totalRegisteredSqFt) * 100) / 100
      );
      agreement.unregisteredAvailableSqFt = Math.max(
        0,
        Math.round((agreement.unregisteredAgreedSqFt - (agreement.unregisteredAllocatedSqFt || 0)) * 100) / 100
      );

      if (agreement.totalRegisteredSqFt >= agreement.totalSqFt - 1) {
        agreement.status = 'FULLY_REGISTERED';
      } else {
        agreement.status = 'PARTIALLY_REGISTERED';
      }

      await agreement.save(session ? { session } : {});

      return agreement;
    });
  }

  /**
   * 3. Record Payment to Kisan / Farmer (DEBIT)
   */
  async recordKisanPayment(agreementId, paymentData, userId) {
    return withTransaction(async (session) => {
      const q = KisanLandAgreement.findById(agreementId);
      if (session) q.session(session);
      const agreement = await q;
      if (!agreement) throw ApiError.notFound('Land Agreement not found');

      const { farmerId, farmerName, farmerMobile, amount, paymentMode, transactionReference, date, remarks } = paymentData;
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
        throw ApiError.badRequest('Valid payment amount is required');
      }

      // Calculate latest running balance from previous ledger entries
      const latestQuery = KisanLedger.findOne({ agreementId }).sort({ date: -1, createdAt: -1 });
      if (session) latestQuery.session(session);
      const latestEntry = await latestQuery;
      const prevBal = latestEntry ? latestEntry.runningBalance : agreement.totalAgreementAmount;
      const newRunningBal = Math.max(0, prevBal - numAmount);

      // Generate receipt number
      const fyStr = this.getFyString(date);
      const prefix = `KISAN_RCP_FY_${fyStr}`;
      const counterOpts = { new: true, upsert: true };
      if (session) counterOpts.session = session;
      const counter = await Counter.findByIdAndUpdate(
        prefix,
        { $inc: { sequence: 1 } },
        counterOpts
      );
      const receiptNumber = `KRCP-${fyStr}-${String(counter.sequence).padStart(4, '0')}`;

      const resolvedFarmerName = farmerName || agreement.farmers?.[0]?.name || 'Kisan';
      const resolvedFarmerMobile = farmerMobile || agreement.farmers?.[0]?.mobile || '';

      const kLedger = new KisanLedger({
        agreementId: agreement._id,
        agreementNumber: agreement.agreementNumber,
        farmerId: farmerId || agreement.farmers?.[0]?._id || null,
        farmerName: resolvedFarmerName,
        farmerMobile: resolvedFarmerMobile,
        type: 'DEBIT',
        amount: numAmount,
        runningBalance: newRunningBal,
        paymentMode: paymentMode || 'CASH',
        transactionReference: transactionReference || '',
        receiptNumber,
        date: date ? new Date(date) : new Date(),
        remarks: remarks || '',
        processedBy: userId,
      });

      await kLedger.save(session ? { session } : {});
      return kLedger;
    });
  }

  /**
   * 4. Get List of Land Agreements
   */
  async getAgreements(query = {}) {
    const filter = {};
    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { agreementNumber: { $regex: s, $options: 'i' } },
        { mauja: { $regex: s, $options: 'i' } },
        { khataNumber: { $regex: s, $options: 'i' } },
        { khesraNumber: { $regex: s, $options: 'i' } },
        { jamabandiNumber: { $regex: s, $options: 'i' } },
        { 'landParcels.mauja': { $regex: s, $options: 'i' } },
        { 'landParcels.khataNumber': { $regex: s, $options: 'i' } },
        { 'landParcels.khesraNumber': { $regex: s, $options: 'i' } },
        { 'farmers.name': { $regex: s, $options: 'i' } },
        { 'farmers.mobile': { $regex: s, $options: 'i' } },
        { 'purchasers.name': { $regex: s, $options: 'i' } },
        { 'purchasers.contact': { $regex: s, $options: 'i' } },
        { 'purchasers.mobile': { $regex: s, $options: 'i' } },
        { 'registryDeeds.deedNumber': { $regex: s, $options: 'i' } },
      ];
    }
    if (query.status) filter.status = query.status;

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [agreements, total] = await Promise.all([
      KisanLandAgreement.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KisanLandAgreement.countDocuments(filter),
    ]);

    // Attach financial summaries to each agreement
    const agreementIds = agreements.map((a) => a._id);
    const ledgers = await KisanLedger.find({ agreementId: { $in: agreementIds } }).lean();

    const enriched = agreements.map((agr) => {
      const agrLedgers = ledgers.filter((l) => String(l.agreementId) === String(agr._id));
      const totalCost = agr.totalAgreementAmount || 0;
      const totalPaid = agrLedgers
        .filter((l) => l.type === 'DEBIT')
        .reduce((sum, l) => sum + (l.amount || 0), 0);
      const balanceDue = Math.max(0, totalCost - totalPaid);

      return {
        ...agr,
        financialSummary: {
          totalCost,
          totalPaid,
          balanceDue,
          paymentCount: agrLedgers.filter((l) => l.type === 'DEBIT').length,
        },
      };
    });

    return {
      agreements: enriched,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    };
  }

  /**
   * 5. Get Agreement by ID
   */
  async getAgreementById(id) {
    const agreement = await KisanLandAgreement.findById(id).populate('createdBy', 'name email').lean();
    if (!agreement) throw ApiError.notFound('Agreement not found');

    const ledgers = await KisanLedger.find({ agreementId: id }).sort({ date: -1, createdAt: -1 }).lean();

    // Land Stock Ledger: only tracks Agreement initial pool and Plot Booking allocations/cancellations
    // Deeds are legal records and do NOT affect or create separate agreement stock
    const rawStockLedgers = await LandStockLedger.find({
      agreementId: id,
      transactionType: { $nin: ['REGISTRY_CONVERSION'] },
      sourceType: { $ne: 'REGISTRY_DEED' },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    let runningSqFt = 0;
    const stockLedgersWithBalance = rawStockLedgers.map((entry) => {
      if (entry.entryType === 'CREDIT') {
        runningSqFt += entry.sqFt || 0;
      } else if (entry.entryType === 'DEBIT') {
        runningSqFt = Math.max(0, runningSqFt - (entry.sqFt || 0));
      }
      return {
        ...entry,
        runningAvailableSqFt: runningSqFt,
      };
    });

    const stockLedgers = stockLedgersWithBalance.reverse();

    const totalCost = agreement.totalAgreementAmount || 0;
    const totalPaid = ledgers
      .filter((l) => l.type === 'DEBIT')
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const balanceDue = Math.max(0, totalCost - totalPaid);

    // Ensure agreement and parcel availability accurately reflect allocated bookings
    const calcAllocatedSqFt = agreement.totalAllocatedSqFt || 0;
    const calcTotalSqFt = agreement.totalSqFt || 0;
    const calcAvailSqFt = Math.max(0, calcTotalSqFt - calcAllocatedSqFt);

    const sanitizedParcels = (agreement.landParcels || []).map((p) => {
      const pTotal = p.totalSqFt || (p.araziDismil ? Math.round(p.araziDismil * 435.6) : 0);
      const pAlloc = p.allocatedSqFt || 0;
      const pAvail = p.availableSqFt !== undefined && p.availableSqFt !== null
        ? p.availableSqFt
        : Math.max(0, pTotal - pAlloc);
      return {
        ...p,
        totalSqFt: pTotal,
        allocatedSqFt: pAlloc,
        availableSqFt: pAvail,
      };
    });

    const sanitizedAgreement = {
      ...agreement,
      totalAllocatedSqFt: calcAllocatedSqFt,
      totalAvailableSqFt: calcAvailSqFt,
      landParcels: sanitizedParcels,
    };

    return {
      agreement: sanitizedAgreement,
      financialSummary: { totalCost, totalPaid, balanceDue },
      kisanLedgers: ledgers,
      stockLedgers,
    };
  }

  /**
   * 6. Get Available Land Stock Sources for Plot Booking Dropdowns
   */
  async getAvailableLandStockSources() {
    const agreements = await KisanLandAgreement.find({ status: { $ne: 'CANCELLED' } }).lean();
    const sources = [];

    for (const agr of agreements) {
      const availSqFt =
        agr.totalAvailableSqFt !== undefined && agr.totalAvailableSqFt !== null
          ? agr.totalAvailableSqFt
          : Math.max(0, (agr.totalSqFt || 0) - (agr.totalAllocatedSqFt || 0));

      if (availSqFt > 0) {
        const parcels = (agr.landParcels || []).map((p) => {
          const pAvail =
            p.availableSqFt !== undefined && p.availableSqFt !== null
              ? p.availableSqFt
              : Math.max(0, (p.totalSqFt || 0) - (p.allocatedSqFt || 0));
          return {
            parcelId: p._id,
            mauja: p.mauja || agr.mauja || '',
            thanaNumber: p.thanaNumber || agr.thanaNumber || '',
            khataNumber: p.khataNumber || agr.khataNumber || '',
            khesraNumber: p.khesraNumber || agr.khesraNumber || '',
            totalSqFt: p.totalSqFt || 0,
            allocatedSqFt: p.allocatedSqFt || 0,
            availableSqFt: pAvail,
            availableDismil: Math.round((pAvail / 435.6) * 100) / 100,
          };
        });

        sources.push({
          sourceType: 'AGREEMENT',
          agreementId: agr._id,
          agreementNumber: agr.agreementNumber,
          parcelId: null,
          deedId: null,
          deedNumber: '',
          label: agr.agreementNumber,
          mauja: agr.mauja || agr.landParcels?.[0]?.mauja || '',
          khataNumber: agr.khataNumber || agr.landParcels?.[0]?.khataNumber || '',
          khesraNumber: agr.khesraNumber || agr.landParcels?.[0]?.khesraNumber || '',
          thanaNumber: agr.thanaNumber || agr.landParcels?.[0]?.thanaNumber || '',
          availableSqFt: availSqFt,
          availableDismil: Math.round((availSqFt / 435.6) * 100) / 100,
          parcels: parcels.length > 0 ? parcels : [
            {
              parcelId: null,
              mauja: agr.mauja || '',
              thanaNumber: agr.thanaNumber || '',
              khataNumber: agr.khataNumber || '',
              khesraNumber: agr.khesraNumber || 'General Parcel',
              totalSqFt: agr.totalSqFt || availSqFt,
              allocatedSqFt: agr.totalAllocatedSqFt || 0,
              availableSqFt: availSqFt,
              availableDismil: Math.round((availSqFt / 435.6) * 100) / 100,
            }
          ],
        });
      }
    }
    return sources;
  }

  /**
   * 7. Update an existing Kisan Land Agreement (Parcels, Farmers, Attachments, Rates)
   */
  async updateAgreement(id, data, userId) {
    return withTransaction(async (session) => {
      const q = KisanLandAgreement.findById(id);
      if (session) q.session(session);
      const agreement = await q;
      if (!agreement) throw ApiError.notFound('Agreement not found');

      const {
        agreementNumber,
        agreementDate,
        agreementEndDate,
        landParcels,
        mauja,
        thanaNumber,
        khataNumber,
        khesraNumber,
        jamabandiNumber,
        araziDismil,
        ratePerDismil,
        totalAgreementAmount,
        remarks,
        farmers,
        purchasers,
        attachments,
      } = data;

      if (agreementNumber !== undefined && agreementNumber.trim() !== '') {
        const cleanAgrNo = agreementNumber.trim().toUpperCase();
        if (cleanAgrNo !== agreement.agreementNumber) {
          const existing = await KisanLandAgreement.findOne({ agreementNumber: cleanAgrNo, _id: { $ne: agreement._id } }).session(session || null);
          if (existing) {
            throw ApiError.badRequest(`Agreement Number "${cleanAgrNo}" is already in use.`);
          }
          agreement.agreementNumber = cleanAgrNo;
        }
      }

      if (agreementDate !== undefined) {
        agreement.agreementDate = agreementDate ? new Date(agreementDate) : agreement.agreementDate;
      }
      if (agreementEndDate !== undefined) {
        agreement.agreementEndDate = agreementEndDate ? new Date(agreementEndDate) : null;
      }

      // 1. Process Land Parcels if provided
      if (Array.isArray(landParcels) && landParcels.length > 0) {
        const existingParcelsMap = new Map();
        (agreement.landParcels || []).forEach((p) => {
          existingParcelsMap.set(String(p._id), p);
        });

        const updatedParcels = [];
        for (let idx = 0; idx < landParcels.length; idx++) {
          const p = landParcels[idx];
          if (!p.mauja || !p.khataNumber || !p.khesraNumber) {
            throw ApiError.badRequest(`Parcel #${idx + 1}: Mauja, Khata, and Khesra Number are required`);
          }
          const numDismil = Number(p.araziDismil);
          if (!numDismil || numDismil <= 0) {
            throw ApiError.badRequest(`Parcel #${idx + 1} (${p.mauja}): Dismil area must be greater than 0`);
          }

          const pSqFt = Math.round(numDismil * 435.6 * 100) / 100;
          const pRate = Number(p.ratePerDismil) || 0;
          const pRateSqFt = pRate > 0 ? Math.round((pRate / 435.6) * 100) / 100 : (Number(p.ratePerSqFt) || 0);
          const pAmount = p.totalAmount !== undefined && p.totalAmount !== ''
            ? Number(p.totalAmount)
            : Math.round(numDismil * pRate);

          const existingP = p._id ? existingParcelsMap.get(String(p._id)) : null;
          const regDismil = existingP ? (existingP.registeredDismil || 0) : 0;
          const regSqFt = existingP ? (existingP.registeredSqFt || 0) : 0;
          const unregAllocSqFt = existingP ? (existingP.unregisteredAllocatedSqFt || 0) : 0;

          if (numDismil < regDismil - 0.001) {
            throw ApiError.badRequest(
              `Cannot reduce parcel (Mauja: ${p.mauja}, Khesra: ${p.khesraNumber}) to ${numDismil} Dismil. Already registered in deeds: ${regDismil} Dismil.`
            );
          }

          const unregAgreedSqFt = Math.max(0, Math.round((pSqFt - regSqFt) * 100) / 100);
          if (unregAgreedSqFt < unregAllocSqFt - 0.5) {
            throw ApiError.badRequest(
              `Cannot reduce parcel (Mauja: ${p.mauja}, Khesra: ${p.khesraNumber}) below allocated plot booking stock (${unregAllocSqFt} Sq.Ft.).`
            );
          }

          const unregAvailSqFt = Math.max(0, Math.round((unregAgreedSqFt - unregAllocSqFt) * 100) / 100);

          updatedParcels.push({
            _id: existingP ? existingP._id : undefined,
            mauja: p.mauja.trim(),
            thanaNumber: p.thanaNumber ? p.thanaNumber.trim() : '',
            khataNumber: p.khataNumber.trim(),
            khesraNumber: p.khesraNumber.trim(),
            jamabandiNumber: p.jamabandiNumber ? p.jamabandiNumber.trim() : '',
            chaudhi: {
              north: p.chaudhi?.north ? p.chaudhi.north.trim() : '',
              south: p.chaudhi?.south ? p.chaudhi.south.trim() : '',
              east: p.chaudhi?.east ? p.chaudhi.east.trim() : '',
              west: p.chaudhi?.west ? p.chaudhi.west.trim() : '',
            },
            araziDismil: numDismil,
            totalSqFt: pSqFt,
            ratePerDismil: pRate,
            ratePerSqFt: pRateSqFt,
            totalAmount: pAmount,
            registeredDismil: regDismil,
            registeredSqFt: regSqFt,
            unregisteredAgreedSqFt: unregAgreedSqFt,
            unregisteredAllocatedSqFt: unregAllocSqFt,
            unregisteredAvailableSqFt: unregAvailSqFt,
            allocatedSqFt: (existingP?.allocatedSqFt || 0),
            availableSqFt: unregAvailSqFt,
            remarks: p.remarks || '',
          });
        }

        // Validate that deleted parcels don't have registered deeds or plot allocations
        const newParcelIds = new Set(updatedParcels.map((p) => p._id && String(p._id)).filter(Boolean));
        for (const [idStr, oldP] of existingParcelsMap.entries()) {
          if (!newParcelIds.has(idStr)) {
            if ((oldP.registeredDismil || 0) > 0 || (oldP.unregisteredAllocatedSqFt || 0) > 0) {
              throw ApiError.badRequest(
                `Cannot remove parcel (Mauja: ${oldP.mauja}, Khesra: ${oldP.khesraNumber}). It has registered deeds (${oldP.registeredDismil} Dismil) or active plot allocations (${oldP.unregisteredAllocatedSqFt} Sq.Ft.).`
              );
            }
          }
        }

        agreement.landParcels = updatedParcels;

        // Recalculate agreement aggregates
        agreement.araziDismil = Math.round(updatedParcels.reduce((s, p) => s + p.araziDismil, 0) * 1000) / 1000;
        agreement.totalSqFt = Math.round(updatedParcels.reduce((s, p) => s + p.totalSqFt, 0) * 100) / 100;
        agreement.mauja = updatedParcels[0]?.mauja || agreement.mauja;
        agreement.khataNumber = updatedParcels.map((p) => p.khataNumber).filter(Boolean).join(', ');
        agreement.khesraNumber = updatedParcels.map((p) => p.khesraNumber).filter(Boolean).join(', ');
        agreement.thanaNumber = updatedParcels[0]?.thanaNumber || agreement.thanaNumber;

        agreement.totalRegisteredDismil = Math.round(
          updatedParcels.reduce((s, p) => s + (p.registeredDismil || 0), 0) * 1000
        ) / 1000;
        agreement.totalRegisteredSqFt = Math.round(
          updatedParcels.reduce((s, p) => s + (p.registeredSqFt || 0), 0) * 100
        ) / 100;
        agreement.unregisteredAgreedSqFt = Math.max(
          0,
          Math.round((agreement.totalSqFt - agreement.totalRegisteredSqFt) * 100) / 100
        );
        agreement.unregisteredAvailableSqFt = Math.max(
          0,
          Math.round((agreement.unregisteredAgreedSqFt - (agreement.unregisteredAllocatedSqFt || 0)) * 100) / 100
        );
        agreement.totalAvailableSqFt = Math.max(
          0,
          Math.round((agreement.totalSqFt - (agreement.totalAllocatedSqFt || 0)) * 100) / 100
        );

        if (totalAgreementAmount !== undefined && totalAgreementAmount !== '' && totalAgreementAmount !== null) {
          agreement.totalAgreementAmount = Number(totalAgreementAmount) || 0;
        } else {
          agreement.totalAgreementAmount = Math.round(updatedParcels.reduce((s, p) => s + p.totalAmount, 0));
        }

        agreement.ratePerDismil = agreement.araziDismil > 0 ? Math.round(agreement.totalAgreementAmount / agreement.araziDismil) : 0;
      } else {
        // Single field edits
        if (mauja !== undefined) agreement.mauja = mauja.trim();
        if (thanaNumber !== undefined) agreement.thanaNumber = thanaNumber.trim();
        if (khataNumber !== undefined) agreement.khataNumber = khataNumber.trim();
        if (khesraNumber !== undefined) agreement.khesraNumber = khesraNumber.trim();
        if (jamabandiNumber !== undefined) agreement.jamabandiNumber = jamabandiNumber.trim();
        if (totalAgreementAmount !== undefined && totalAgreementAmount !== '' && totalAgreementAmount !== null) {
          agreement.totalAgreementAmount = Number(totalAgreementAmount) || 0;
        }
      }

      if (remarks !== undefined) agreement.remarks = remarks;

      // 2. Process Farmers
      if (Array.isArray(farmers) && farmers.length > 0) {
        agreement.farmers = farmers.map((f) => ({
          name: f.name ? f.name.trim() : 'Kisan',
          guardianName: f.guardianName || '',
          relation: f.relation || 'Father',
          mobile: f.mobile || '',
          aadhaarNumber: f.aadhaarNumber || '',
          panNumber: f.panNumber || '',
          sharePercent: Number(f.sharePercent) || 100,
          address: f.address || '',
          bankDetails: f.bankDetails || {},
        }));
      }

      // 2b. Process Purchasers / Buyers
      if (Array.isArray(purchasers)) {
        agreement.purchasers = purchasers
          .filter((p) => p && p.name && p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            contact: p.contact ? p.contact.trim() : (p.mobile ? p.mobile.trim() : ''),
            mobile: p.mobile ? p.mobile.trim() : (p.contact ? p.contact.trim() : ''),
            aadhaarNumber: p.aadhaarNumber ? p.aadhaarNumber.trim() : '',
            panNumber: p.panNumber ? p.panNumber.trim() : '',
            address: p.address ? p.address.trim() : '',
          }));
      }

      // 3. Process Attachments
      if (Array.isArray(attachments)) {
        agreement.attachments = attachments
          .filter((att) => att.fileUrl && att.fileName)
          .map((att) => ({
            fileName: att.fileName.trim(),
            fileType: att.fileType ? att.fileType.trim() : 'Agreement Scan',
            fileUrl: att.fileUrl.trim(),
            fileSize: Number(att.fileSize) || 0,
            description: att.description || '',
            uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
            uploadedBy: userId,
          }));
      }

      await agreement.save(session ? { session } : {});

      // 3. Sync LandStockLedger initial pool entry (Date, Dismil, SqFt, Remarks)
      const stockLedgerQuery = LandStockLedger.findOne({
        agreementId: id,
        transactionType: 'INITIAL_AGREEMENT',
      });
      if (session) stockLedgerQuery.session(session);
      const stockLedger = await stockLedgerQuery;

      const parcelSummary = (agreement.landParcels || [])
        .map((p) => `${p.mauja} (K:${p.khataNumber}/Kh:${p.khesraNumber}) - ${p.araziDismil} Dismil`)
        .join('; ');

      if (stockLedger) {
        stockLedger.date = agreement.agreementDate;
        stockLedger.dismil = agreement.araziDismil;
        stockLedger.sqFt = agreement.totalSqFt;
        stockLedger.runningAvailableSqFt = agreement.totalSqFt;
        stockLedger.remarks = `Initial Acquisition Agreement #${agreement.agreementNumber} (${agreement.landParcels?.length || 1} Parcels: ${parcelSummary}) Total: ${agreement.araziDismil} Dismil (${agreement.totalSqFt} Sq Ft)`;
        await stockLedger.save(session ? { session } : {});
      } else {
        const newStockLedger = new LandStockLedger({
          agreementId: agreement._id,
          sourceType: 'AGREEMENT',
          deedId: null,
          deedNumber: '',
          transactionType: 'INITIAL_AGREEMENT',
          entryType: 'CREDIT',
          dismil: agreement.araziDismil,
          sqFt: agreement.totalSqFt,
          runningAvailableSqFt: agreement.totalSqFt,
          date: agreement.agreementDate,
          remarks: `Initial Acquisition Agreement #${agreement.agreementNumber} (${agreement.landParcels?.length || 1} Parcels: ${parcelSummary}) Total: ${agreement.araziDismil} Dismil (${agreement.totalSqFt} Sq Ft)`,
          performedBy: userId,
        });
        await newStockLedger.save(session ? { session } : {});
      }

      // 4. Sync KisanLedger agreed amount & update running balances
      const primaryFarmer = agreement.farmers?.[0];
      const initialCreditQuery = KisanLedger.findOne({
        agreementId: id,
        paymentMode: 'AGREEMENT_VALUE',
        type: 'CREDIT',
      });
      if (session) initialCreditQuery.session(session);
      const initialCredit = await initialCreditQuery;

      if (initialCredit) {
        initialCredit.amount = agreement.totalAgreementAmount;
        initialCredit.farmerName = primaryFarmer?.name || initialCredit.farmerName || 'Kisan';
        initialCredit.farmerMobile = primaryFarmer?.mobile || initialCredit.farmerMobile || '';
        initialCredit.remarks = `Total Agreed Land Value for ${agreement.araziDismil} Dismil across ${agreement.landParcels?.length || 1} parcel(s)`;
        await initialCredit.save(session ? { session } : {});
      } else if (agreement.totalAgreementAmount > 0) {
        const newCredit = new KisanLedger({
          agreementId: agreement._id,
          agreementNumber: agreement.agreementNumber,
          farmerId: primaryFarmer?._id || null,
          farmerName: primaryFarmer?.name || 'Kisan',
          farmerMobile: primaryFarmer?.mobile || '',
          type: 'CREDIT',
          amount: agreement.totalAgreementAmount,
          runningBalance: agreement.totalAgreementAmount,
          paymentMode: 'AGREEMENT_VALUE',
          transactionReference: agreement.agreementNumber,
          date: agreement.agreementDate,
          remarks: `Total Agreed Land Value for ${agreement.araziDismil} Dismil across ${agreement.landParcels?.length || 1} parcel(s)`,
          processedBy: userId,
        });
        await newCredit.save(session ? { session } : {});
      }

      // Re-calculate all running balances in chronological order for this agreement's KisanLedger
      const allLedgersQuery = KisanLedger.find({ agreementId: id }).sort({ date: 1, createdAt: 1 });
      if (session) allLedgersQuery.session(session);
      const allLedgers = await allLedgersQuery;

      let currentBal = 0;
      for (const entry of allLedgers) {
        if (entry.type === 'CREDIT') {
          currentBal += entry.amount;
        } else if (entry.type === 'DEBIT') {
          currentBal = Math.max(0, currentBal - entry.amount);
        }
        entry.runningBalance = currentBal;
        await entry.save(session ? { session } : {});
      }

      return agreement;
    });
  }

  /**
   * 8. Delete a Kisan Land Agreement (only if no plot allocations or registered deeds exist)
   */
  async deleteAgreement(id, userId) {
    return withTransaction(async (session) => {
      const q = KisanLandAgreement.findById(id);
      if (session) q.session(session);
      const agreement = await q;
      if (!agreement) throw ApiError.notFound('Agreement not found');

      if ((agreement.totalAllocatedSqFt || 0) > 0) {
        throw ApiError.badRequest(
          `Cannot delete Agreement #${agreement.agreementNumber}. ${agreement.totalAllocatedSqFt} Sq.Ft. is actively allocated to plot bookings.`
        );
      }

      if (agreement.registryDeeds && agreement.registryDeeds.length > 0) {
        throw ApiError.badRequest(
          `Cannot delete Agreement #${agreement.agreementNumber}. It contains ${agreement.registryDeeds.length} Registry Deed(s). Delete the deeds first.`
        );
      }

      // Check if any payments exist
      const paymentsCount = await KisanLedger.countDocuments({ agreementId: id, type: 'DEBIT' });
      if (paymentsCount > 0) {
        throw ApiError.badRequest(
          `Cannot delete Agreement #${agreement.agreementNumber}. There are ${paymentsCount} payment transaction(s) recorded for this farmer.`
        );
      }

      // Clean up ledgers and agreement
      const delStock = LandStockLedger.deleteMany({ agreementId: id });
      const delKisan = KisanLedger.deleteMany({ agreementId: id });
      const delAgr = KisanLandAgreement.findByIdAndDelete(id);

      if (session) {
        delStock.session(session);
        delKisan.session(session);
        delAgr.session(session);
      }

      await delStock;
      await delKisan;
      await delAgr;

      return { success: true };
    });
  }

  /**
   * 9. Update an existing Registry Deed
   */
  async updateRegistryDeed(agreementId, deedId, data, userId) {
    return withTransaction(async (session) => {
      const q = KisanLandAgreement.findById(agreementId);
      if (session) q.session(session);
      const agreement = await q;
      if (!agreement) throw ApiError.notFound('Agreement not found');

      const deed = agreement.registryDeeds.id(deedId);
      if (!deed) throw ApiError.notFound('Registry Deed not found');

      const { deedNumber, deedDate, subRegistrarOffice, remarks, parcels, registeredDismil } = data;
      if (deedNumber !== undefined) deed.deedNumber = deedNumber.trim().toUpperCase();
      if (deedDate !== undefined) deed.deedDate = new Date(deedDate);
      if (subRegistrarOffice !== undefined) deed.subRegistrarOffice = subRegistrarOffice.trim();
      if (remarks !== undefined) deed.remarks = remarks;

      // Handle increasing / decreasing registered Dismil area
      if (Array.isArray(parcels) && parcels.length > 0) {
        let totalNewDeedDismil = 0;
        let totalNewDeedSqFt = 0;
        const newDeedParcels = [];

        for (const item of parcels) {
          const newDismil = Number(item.registeredDismil);
          if (isNaN(newDismil) || newDismil < 0) continue;

          const parcelDoc = agreement.landParcels.id(item.parcelId);
          if (!parcelDoc) continue;

          const oldDeedParcel = Array.isArray(deed.parcels)
            ? deed.parcels.find((dp) => String(dp.parcelId) === String(item.parcelId))
            : null;
          const oldDismil = oldDeedParcel ? Number(oldDeedParcel.registeredDismil) || 0 : 0;
          const diffDismil = Math.round((newDismil - oldDismil) * 1000) / 1000;

          // Check if increasing exceeds available parcel arazi
          const currentParcelReg = parcelDoc.registeredDismil || 0;
          const maxAvail = Math.max(0, parcelDoc.araziDismil - currentParcelReg + oldDismil);
          if (newDismil > maxAvail + 0.001) {
            throw ApiError.badRequest(
              `Cannot set ${newDismil} Dismil on parcel (Mauja: ${parcelDoc.mauja}, Khesra: ${parcelDoc.khesraNumber}). Max available is ${maxAvail.toFixed(3)} Dismil.`
            );
          }

          const itemSqFt = Math.round(newDismil * 435.6 * 100) / 100;
          parcelDoc.registeredDismil = Math.max(0, Math.round((currentParcelReg + diffDismil) * 1000) / 1000);
          parcelDoc.registeredSqFt = Math.round(parcelDoc.registeredDismil * 435.6 * 100) / 100;
          parcelDoc.unregisteredAgreedSqFt = Math.max(0, Math.round((parcelDoc.totalSqFt - parcelDoc.registeredSqFt) * 100) / 100);
          parcelDoc.unregisteredAvailableSqFt = Math.max(
            0,
            Math.round((parcelDoc.unregisteredAgreedSqFt - (parcelDoc.unregisteredAllocatedSqFt || 0)) * 100) / 100
          );

          if (newDismil > 0) {
            newDeedParcels.push({
              parcelId: parcelDoc._id,
              mauja: parcelDoc.mauja,
              khataNumber: parcelDoc.khataNumber,
              khesraNumber: parcelDoc.khesraNumber,
              thanaNumber: parcelDoc.thanaNumber || '',
              registeredDismil: newDismil,
              registeredSqFt: itemSqFt,
            });
            totalNewDeedDismil += newDismil;
            totalNewDeedSqFt += itemSqFt;
          }
        }

        if (totalNewDeedDismil > 0) {
          deed.parcels = newDeedParcels;
          deed.registeredDismil = Math.round(totalNewDeedDismil * 1000) / 1000;
          deed.registeredSqFt = Math.round(totalNewDeedSqFt * 100) / 100;
          deed.availableSqFt = Math.max(0, deed.registeredSqFt - (deed.allocatedSqFt || 0));

          // Recalculate agreement totals
          agreement.totalRegisteredDismil = Math.round(
            (agreement.landParcels || []).reduce((s, p) => s + (p.registeredDismil || 0), 0) * 1000
          ) / 1000;
          agreement.totalRegisteredSqFt = Math.round(
            (agreement.landParcels || []).reduce((s, p) => s + (p.registeredSqFt || 0), 0) * 100
          ) / 100;
          agreement.unregisteredAgreedSqFt = Math.max(
            0,
            Math.round((agreement.totalSqFt - agreement.totalRegisteredSqFt) * 100) / 100
          );
          agreement.unregisteredAvailableSqFt = Math.max(
            0,
            Math.round((agreement.unregisteredAgreedSqFt - (agreement.unregisteredAllocatedSqFt || 0)) * 100) / 100
          );
        }
      }

      await agreement.save(session ? { session } : {});
      return agreement;
    });
  }

  /**
   * 10. Delete a Registry Deed (revert converted stock back to unregistered agreement stock on each parcel)
   */
  async deleteRegistryDeed(agreementId, deedId, userId) {
    return withTransaction(async (session) => {
      const q = KisanLandAgreement.findById(agreementId);
      if (session) q.session(session);
      const agreement = await q;
      if (!agreement) throw ApiError.notFound('Agreement not found');

      const deed = agreement.registryDeeds.id(deedId);
      if (!deed) throw ApiError.notFound('Registry Deed not found');

      if ((deed.allocatedSqFt || 0) > 0) {
        throw ApiError.badRequest(
          `Cannot delete Registry Deed #${deed.deedNumber}. ${deed.allocatedSqFt} Sq.Ft. is actively allocated to plot customer bookings.`
        );
      }

      const deedSqFt = deed.registeredSqFt || 0;
      const deedDismil = deed.registeredDismil || 0;

      // Revert parcel-level registration counters if deed recorded parcel breakdown
      if (Array.isArray(deed.parcels) && deed.parcels.length > 0) {
        for (const item of deed.parcels) {
          const p = agreement.landParcels.id(item.parcelId);
          if (p) {
            p.registeredDismil = Math.max(0, Math.round(((p.registeredDismil || 0) - item.registeredDismil) * 1000) / 1000);
            p.registeredSqFt = Math.max(0, Math.round(((p.registeredSqFt || 0) - item.registeredSqFt) * 100) / 100);
            p.unregisteredAgreedSqFt = Math.round((p.totalSqFt - p.registeredSqFt) * 100) / 100;
            p.unregisteredAvailableSqFt = Math.max(0, Math.round((p.unregisteredAgreedSqFt - (p.unregisteredAllocatedSqFt || 0)) * 100) / 100);
          }
        }
      } else if (Array.isArray(agreement.landParcels) && agreement.landParcels.length > 0) {
        // Fallback for deeds created prior to multi-parcel breakdown
        let revertDismil = deedDismil;
        for (const p of agreement.landParcels) {
          if (revertDismil <= 0) break;
          const reg = p.registeredDismil || 0;
          if (reg <= 0) continue;
          const amountToRevert = Math.min(reg, revertDismil);
          const sqFtToRevert = Math.round(amountToRevert * 435.6 * 100) / 100;

          p.registeredDismil = Math.max(0, Math.round((reg - amountToRevert) * 1000) / 1000);
          p.registeredSqFt = Math.max(0, Math.round(((p.registeredSqFt || 0) - sqFtToRevert) * 100) / 100);
          p.unregisteredAgreedSqFt = Math.round((p.totalSqFt - p.registeredSqFt) * 100) / 100;
          p.unregisteredAvailableSqFt = Math.max(0, Math.round((p.unregisteredAgreedSqFt - (p.unregisteredAllocatedSqFt || 0)) * 100) / 100);

          revertDismil -= amountToRevert;
        }
      }

      // Remove deed
      deed.deleteOne();

      // Revert totals
      agreement.totalRegisteredDismil = Math.max(0, Math.round((agreement.totalRegisteredDismil - deedDismil) * 1000) / 1000);
      agreement.totalRegisteredSqFt = Math.max(0, Math.round((agreement.totalRegisteredSqFt - deedSqFt) * 100) / 100);
      agreement.unregisteredAgreedSqFt = Math.round((agreement.totalSqFt - agreement.totalRegisteredSqFt) * 100) / 100;
      agreement.unregisteredAvailableSqFt = Math.max(0, agreement.unregisteredAgreedSqFt - (agreement.unregisteredAllocatedSqFt || 0));

      if (agreement.totalRegisteredSqFt <= 0) {
        agreement.status = 'ACTIVE';
      } else if (agreement.totalRegisteredSqFt >= agreement.totalSqFt - 1) {
        agreement.status = 'FULLY_REGISTERED';
      } else {
        agreement.status = 'PARTIALLY_REGISTERED';
      }

      await agreement.save(session ? { session } : {});

      // Remove deed stock ledger entries
      const delStock = LandStockLedger.deleteMany({ agreementId, deedId });
      if (session) delStock.session(session);
      await delStock;

      return agreement;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── KISAN / SELLER DIRECTORY MASTER ──────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get all Kisan / Sellers (auto-syncs from existing agreements if empty)
   */
  async getKisanSellers(query = {}) {
    const count = await KisanSeller.countDocuments();
    if (count === 0) {
      // Auto-populate from existing Kisan agreements
      const agreements = await KisanLandAgreement.find().lean();
      const seen = new Set();
      const docsToInsert = [];
      for (const agr of agreements) {
        for (const f of agr.farmers || []) {
          if (!f.name || seen.has(f.name.trim().toLowerCase())) continue;
          seen.add(f.name.trim().toLowerCase());
          docsToInsert.push({
            name: f.name.trim(),
            guardianName: f.guardianName || '',
            relation: f.relation || 'Father',
            mobile: f.mobile || '',
            aadhaarNumber: f.aadhaarNumber || '',
            panNumber: f.panNumber || '',
            address: f.address || '',
            bankDetails: f.bankDetails || {},
          });
        }
      }
      if (docsToInsert.length > 0) {
        await KisanSeller.insertMany(docsToInsert);
      }
    }

    const filter = {};
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { mobile: regex },
        { aadhaarNumber: regex },
        { panNumber: regex },
        { guardianName: regex },
        { address: regex },
      ];
    }

    return await KisanSeller.find(filter).sort({ name: 1, createdAt: -1 }).lean();
  }

  /**
   * Create a new Kisan / Seller
   */
  async createKisanSeller(data, userId = null) {
    if (!data.name || !data.name.trim()) {
      throw new ApiError(400, 'Farmer / Seller name is required');
    }

    const doc = new KisanSeller({
      name: data.name.trim(),
      guardianName: data.guardianName ? data.guardianName.trim() : '',
      relation: data.relation || 'Father',
      mobile: data.mobile ? data.mobile.trim() : '',
      aadhaarNumber: data.aadhaarNumber ? data.aadhaarNumber.trim() : '',
      panNumber: data.panNumber ? data.panNumber.trim().toUpperCase() : '',
      address: data.address ? data.address.trim() : '',
      bankDetails: data.bankDetails || {},
      remarks: data.remarks || '',
      createdBy: userId,
    });

    return await doc.save();
  }

  /**
   * Update a Kisan / Seller
   */
  async updateKisanSeller(id, data, userId = null) {
    const doc = await KisanSeller.findById(id);
    if (!doc) {
      throw new ApiError(404, 'Kisan / Seller not found');
    }

    if (data.name) doc.name = data.name.trim();
    if (data.guardianName !== undefined) doc.guardianName = data.guardianName ? data.guardianName.trim() : '';
    if (data.relation !== undefined) doc.relation = data.relation || 'Father';
    if (data.mobile !== undefined) doc.mobile = data.mobile ? data.mobile.trim() : '';
    if (data.aadhaarNumber !== undefined) doc.aadhaarNumber = data.aadhaarNumber ? data.aadhaarNumber.trim() : '';
    if (data.panNumber !== undefined) doc.panNumber = data.panNumber ? data.panNumber.trim().toUpperCase() : '';
    if (data.address !== undefined) doc.address = data.address ? data.address.trim() : '';
    if (data.bankDetails !== undefined) doc.bankDetails = data.bankDetails;
    if (data.remarks !== undefined) doc.remarks = data.remarks;
    doc.updatedBy = userId;

    return await doc.save();
  }

  /**
   * Delete a Kisan / Seller
   */
  async deleteKisanSeller(id) {
    const doc = await KisanSeller.findByIdAndDelete(id);
    if (!doc) {
      throw new ApiError(404, 'Kisan / Seller not found');
    }
    return { message: 'Kisan / Seller deleted successfully' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ── PURCHASER / BUYER DIRECTORY MASTER ──────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get all Purchasers (auto-creates default Company buyer if empty)
   */
  async getPurchasers(query = {}) {
    const count = await LandPurchaser.countDocuments();
    if (count === 0) {
      // Auto-create default Good Nature company purchaser
      await LandPurchaser.create({
        name: 'Good Nature Developers Pvt Ltd',
        contact: 'Head Office',
        mobile: '',
        aadhaarNumber: '',
        panNumber: '',
        address: 'Patna, Bihar',
        isDefault: true,
      });
    }

    const filter = {};
    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { contact: regex },
        { mobile: regex },
        { aadhaarNumber: regex },
        { panNumber: regex },
      ];
    }

    return await LandPurchaser.find(filter).sort({ isDefault: -1, name: 1, createdAt: -1 }).lean();
  }

  /**
   * Create a new Purchaser / Buyer
   */
  async createPurchaser(data, userId = null) {
    if (!data.name || !data.name.trim()) {
      throw new ApiError(400, 'Purchaser / Buyer name is required');
    }

    if (data.isDefault) {
      await LandPurchaser.updateMany({}, { isDefault: false });
    }

    const doc = new LandPurchaser({
      name: data.name.trim(),
      contact: data.contact ? data.contact.trim() : '',
      mobile: data.mobile ? data.mobile.trim() : '',
      aadhaarNumber: data.aadhaarNumber ? data.aadhaarNumber.trim() : '',
      panNumber: data.panNumber ? data.panNumber.trim().toUpperCase() : '',
      address: data.address ? data.address.trim() : '',
      isDefault: Boolean(data.isDefault),
      remarks: data.remarks || '',
      createdBy: userId,
    });

    return await doc.save();
  }

  /**
   * Update a Purchaser / Buyer
   */
  async updatePurchaser(id, data, userId = null) {
    const doc = await LandPurchaser.findById(id);
    if (!doc) {
      throw new ApiError(404, 'Purchaser / Buyer not found');
    }

    if (data.isDefault) {
      await LandPurchaser.updateMany({ _id: { $ne: id } }, { isDefault: false });
      doc.isDefault = true;
    } else if (data.isDefault === false) {
      doc.isDefault = false;
    }

    if (data.name) doc.name = data.name.trim();
    if (data.contact !== undefined) doc.contact = data.contact ? data.contact.trim() : '';
    if (data.mobile !== undefined) doc.mobile = data.mobile ? data.mobile.trim() : '';
    if (data.aadhaarNumber !== undefined) doc.aadhaarNumber = data.aadhaarNumber ? data.aadhaarNumber.trim() : '';
    if (data.panNumber !== undefined) doc.panNumber = data.panNumber ? data.panNumber.trim().toUpperCase() : '';
    if (data.address !== undefined) doc.address = data.address ? data.address.trim() : '';
    if (data.remarks !== undefined) doc.remarks = data.remarks;
    doc.updatedBy = userId;

    return await doc.save();
  }

  /**
   * Set a purchaser as default
   */
  async setDefaultPurchaser(id) {
    await LandPurchaser.updateMany({}, { isDefault: false });
    const doc = await LandPurchaser.findByIdAndUpdate(id, { isDefault: true }, { new: true });
    if (!doc) {
      throw new ApiError(404, 'Purchaser not found');
    }
    return doc;
  }

  /**
   * Delete a Purchaser / Buyer
   */
  async deletePurchaser(id) {
    const doc = await LandPurchaser.findById(id);
    if (!doc) {
      throw new ApiError(404, 'Purchaser not found');
    }
    await doc.deleteOne();
    return { message: 'Purchaser deleted successfully' };
  }
}

module.exports = new KisanLandService();
