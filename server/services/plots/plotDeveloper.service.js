const mongoose = require('mongoose');
const User = require('../../models/user');
const PlotCustomer = require('../../models/PlotCustomer');
const PlotBooking = require('../../models/PlotBooking');
const PlotProductBooking = require('../../models/PlotProductBooking');
const PlotReceipt = require('../../models/PlotReceipt');
const PlotSponsorCommission = require('../../models/PlotSponsorCommission');
const PlotPayoutVoucher = require('../../models/PlotPayoutVoucher');
const InvestmentCommission = require('../../models/InvestmentCommission');
const Ledger = require('../../models/ledger');
const Entry = require('../../models/entry');
const accountingService = require('../accountingService');
const CommissionPolicyConfig = require('../../models/CommissionPolicyConfig');
const Counter = require('../../models/Counter');
const ApiError = require('../../utils/apiError');
const plotConfigService = require('./plotConfig.service');

class PlotDeveloperService {
  // ── SPONSOR PERIOD BUSINESS VOLUME CALCULATOR ──────────────────
  async getSponsorPeriodVolume(sponsorId, date = new Date(), isTeam = false, session = null) {
    if (!sponsorId) return 0;
    const d = new Date(date);
    const startOfMonth = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));

    let sponsorIds = [new mongoose.Types.ObjectId(sponsorId.toString())];
    if (isTeam) {
      const subQuery = User.find({
        role: 'sponsor',
        sponsorId: sponsorId,
      }).select('_id');
      if (session) subQuery.session(session);
      const subSponsors = await subQuery.lean();
      sponsorIds = [...sponsorIds, ...subSponsors.map(s => s._id)];
    }

    const bookingQuery = PlotBooking.find({
      sponsorId: { $in: sponsorIds },
      status: { $ne: 'CANCELLED' }
    }).select('_id');
    if (session) bookingQuery.session(session);
    const bookings = await bookingQuery.lean();

    let total = 0;

    if (bookings.length > 0) {
      const bookingIds = bookings.map(b => b._id);
      const receiptQuery = PlotReceipt.find({
        bookingId: { $in: bookingIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: 'CANCELLED' }
      }).select('amount lateFinePaid');
      if (session) receiptQuery.session(session);
      const receipts = await receiptQuery.lean();

      total += receipts.reduce((acc, r) => {
        const principal = Math.max(0, Number(r.amount || 0) - Number(r.lateFinePaid || 0));
        return acc + principal;
      }, 0);
    }

    // Also include PlotProductBooking collections in volume
    const prdQuery = PlotProductBooking.find({
      sponsorId: { $in: sponsorIds },
      status: { $ne: 'CANCELLED' }
    }).select('downPayment bookingDate collections createdAt');
    if (session) prdQuery.session(session);
    const prdBookings = await prdQuery.lean();

    for (const pb of prdBookings) {
      if (pb.downPayment > 0) {
        const dpDate = new Date(pb.bookingDate || pb.createdAt);
        if (dpDate >= startOfMonth && dpDate <= endOfMonth) {
          total += Number(pb.downPayment);
        }
      }
      if (Array.isArray(pb.collections)) {
        for (const col of pb.collections) {
          const colDate = new Date(col.paymentDate || col.createdAt);
          if (colDate >= startOfMonth && colDate <= endOfMonth) {
            const principal = Number(col.principalPaid || col.amountPaid || 0);
            total += principal;
          }
        }
      }
    }

    return Math.round(total * 100) / 100;

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

      const receiptsForBkQuery = PlotReceipt.find({ bookingId: booking._id }).select('_id');
      if (session) receiptsForBkQuery.session(session);
      const receiptsForBk = await receiptsForBkQuery;
      const rcIds = receiptsForBk.map(r => r._id);
      if (rcIds.length > 0) {
        const orphanQuery = Entry.find({
          source: 'commission_fixed',
          referenceId: { $in: rcIds }
        });
        if (session) orphanQuery.session(session);
        const orphanEntries = await orphanQuery;
        for (const e of orphanEntries) {
          await accountingService.deleteLedgerEntry(e._id, session);
        }
      }
      return;
    }

    const sponsorQuery = User.findById(booking.sponsorId);
    if (session) sponsorQuery.session(session);
    const sponsorDoc = await sponsorQuery;
    if (!sponsorDoc) return;

    // Find existing commissions for this booking to preserve closingId and incentive tags
    const existingQuery = PlotSponsorCommission.find({ bookingId: booking._id });
    if (session) existingQuery.session(session);
    const existingComms = await existingQuery;
    const closingTagMap = {};
    const trackedReceiptIds = [];
    existingComms.forEach(c => {
      if (c.receiptId) {
        trackedReceiptIds.push(c.receiptId);
      }
      if (c.closingId && c.receiptId) {
        const key = `${c.receiptId.toString()}_${c.sponsorId.toString()}_${c.commissionRole}`;
        closingTagMap[key] = {
          closingId: c.closingId,
          incentivePercent: c.incentivePercent || 0,
          incentiveAmount: c.incentiveAmount || 0,
          slabLabel: c.slabLabel || ''
        };
      }
    });

    // Delete existing commissions for this booking to re-sync cleanly
    const delQuery = PlotSponsorCommission.deleteMany({ bookingId: booking._id });
    if (session) delQuery.session(session);
    await delQuery;

    // Load Active Plot Policy (Dynamic from database)
    const policyConfig = await plotConfigService.getCommissionPolicy('PLOT_SALE');

    // Fetch all approved receipts for this booking to calculate commission on collection basis
    const receiptQuery = PlotReceipt.find({ bookingId: booking._id, status: { $ne: 'REJECTED' } }).sort({ createdAt: 1 });
    if (session) receiptQuery.session(session);
    const receipts = await receiptQuery;

    receipts.forEach(r => trackedReceiptIds.push(r._id));

    const validEntryIds = new Set();

    for (const receipt of receipts) {
      const collectionPrincipal = Math.max(0, Number(receipt.amount || 0) - Number(receipt.lateFinePaid || 0));
      if (collectionPrincipal <= 0) continue;

      const receiptDate = receipt.createdAt ? new Date(receipt.createdAt) : new Date();

      const receiptTypeFormatted = receipt.receiptType === 'DOWNPAYMENT'
        ? 'Downpayment'
        : receipt.receiptType === 'INSTALLMENT'
        ? 'EMI'
        : receipt.receiptType === 'FULL_PAYMENT'
        ? 'Full Payment'
        : receipt.receiptType === 'BOOKING'
        ? 'Booking'
        : (receipt.receiptType || 'Collection');

      const colAmtFormatted = collectionPrincipal.toLocaleString('en-IN');

      if (!sponsorDoc.sponsorId) {
        // ── BUSINESS PARTNER DIRECT SALE ───────────────────────────────
        // Fixed: BA 5% + BP 2% = 7% Instant
        const combinedFixedPct = 7.0;
        const fixedAmt = Math.round(collectionPrincipal * (combinedFixedPct / 100) * 100) / 100;

        const key = `${receipt._id.toString()}_${sponsorDoc._id.toString()}_DIRECT_DEVELOPER`;
        const closedInfo = closingTagMap[key] || null;

        const incentivePct = closedInfo ? closedInfo.incentivePercent : 0;
        const incentiveAmt = closedInfo ? closedInfo.incentiveAmount : 0;
        const totalPct = +(combinedFixedPct + incentivePct).toFixed(3);
        const totalAmt = Math.round((fixedAmt + incentiveAmt) * 100) / 100;

        // Idempotent instant ledger posting
        let ledgerEntryId = null;
        const directRemarks = `F.Comm on ₹${colAmtFormatted} (${combinedFixedPct}%) [${receiptTypeFormatted}] Receipt #${receipt.receiptNumber || ''} (Booking #${booking.bookingNumber || ''})`;
        if (fixedAmt > 0 && receipt.status !== 'PENDING') {
          const sponsorLedger = await Ledger.findOne({ sponsorId: sponsorDoc._id }).session(session);
          let existingEntry = sponsorLedger ? await Entry.findOne({
            ledgerId: sponsorLedger._id,
            referenceId: receipt._id,
            source: 'commission_fixed',
            status: 'active'
          }).session(session) : null;

          if (existingEntry) {
            if (existingEntry.credit !== fixedAmt || existingEntry.particular !== directRemarks || (existingEntry.date && new Date(existingEntry.date).getTime() !== new Date(receiptDate).getTime())) {
              await accountingService.updateLedgerEntry(existingEntry._id, {
                credit: fixedAmt,
                particular: directRemarks,
                date: receiptDate
              }, session);
            }
            ledgerEntryId = existingEntry._id;
          } else {
            const entry = await accountingService.recordLedgerEntry({
              sponsorId: sponsorDoc._id,
              date: receiptDate,
              type: 'CREDIT',
              amount: fixedAmt,
              source: 'commission_fixed',
              referenceId: receipt._id,
              remarks: directRemarks
            }, session);
            ledgerEntryId = entry._id;
          }
          if (ledgerEntryId) validEntryIds.add(ledgerEntryId.toString());
        }

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
          fixedPercent: combinedFixedPct,
          incentivePercent: incentivePct,
          fixedAmount: fixedAmt,
          incentiveAmount: incentiveAmt,
          businessType: 'PLOT_SALE',
          periodVolume: 0,
          slabLabel: closedInfo ? closedInfo.slabLabel : 'Plot Sale Fixed 7% (Direct Partner)',
          tierTenureMonths: Number(booking.tenureMonths) || 0,
          status: 'active',
          closingId: closedInfo ? closedInfo.closingId : null,
          ledgerEntryId,
          createdAt: receiptDate,
        });
        if (session) await commDoc.save({ session });
        else await commDoc.save();
      } else {
        // ── BUSINESS ASSOCIATE (5% Fixed) + PARENT PARTNER (2% Fixed) ──
        // 1. Business Associate Commission (5% Instant)
        const baFixedPct = 5.0;
        const baFixedAmt = Math.round(collectionPrincipal * (baFixedPct / 100) * 100) / 100;

        const promoterKey = `${receipt._id.toString()}_${sponsorDoc._id.toString()}_PROMOTER`;
        const baClosedInfo = closingTagMap[promoterKey] || null;

        const baIncentivePct = baClosedInfo ? baClosedInfo.incentivePercent : 0;
        const baIncentiveAmt = baClosedInfo ? baClosedInfo.incentiveAmount : 0;
        const baTotalPct = +(baFixedPct + baIncentivePct).toFixed(3);
        const baTotalAmt = Math.round((baFixedAmt + baIncentiveAmt) * 100) / 100;

        let baLedgerEntryId = null;
        const baRemarks = `F.Comm on ₹${colAmtFormatted} (${baFixedPct}%) [${receiptTypeFormatted}] Receipt #${receipt.receiptNumber || ''} (Booking #${booking.bookingNumber || ''})`;
        if (baFixedAmt > 0 && receipt.status !== 'PENDING') {
          const baLedger = await Ledger.findOne({ sponsorId: sponsorDoc._id }).session(session);
          let existingEntry = baLedger ? await Entry.findOne({
            ledgerId: baLedger._id,
            referenceId: receipt._id,
            source: 'commission_fixed',
            status: 'active'
          }).session(session) : null;

          if (existingEntry) {
            if (existingEntry.credit !== baFixedAmt || existingEntry.particular !== baRemarks || (existingEntry.date && new Date(existingEntry.date).getTime() !== new Date(receiptDate).getTime())) {
              await accountingService.updateLedgerEntry(existingEntry._id, {
                credit: baFixedAmt,
                particular: baRemarks,
                date: receiptDate
              }, session);
            }
            baLedgerEntryId = existingEntry._id;
          } else {
            const entry = await accountingService.recordLedgerEntry({
              sponsorId: sponsorDoc._id,
              date: receiptDate,
              type: 'CREDIT',
              amount: baFixedAmt,
              source: 'commission_fixed',
              referenceId: receipt._id,
              remarks: baRemarks
            }, session);
            baLedgerEntryId = entry._id;
          }
          if (baLedgerEntryId) validEntryIds.add(baLedgerEntryId.toString());
        }

        const subCommission = new PlotSponsorCommission({
          bookingId: booking._id,
          receiptId: receipt._id,
          sponsorId: sponsorDoc._id,
          customerId: booking.customerId,
          collectionAmount: collectionPrincipal,
          plotValue: collectionPrincipal,
          amount: baTotalAmt,
          commissionPercent: baTotalPct,
          commissionRole: 'PROMOTER',
          fixedPercent: baFixedPct,
          incentivePercent: baIncentivePct,
          fixedAmount: baFixedAmt,
          incentiveAmount: baIncentiveAmt,
          businessType: 'PLOT_SALE',
          periodVolume: 0,
          slabLabel: baClosedInfo ? baClosedInfo.slabLabel : 'Plot Sale Fixed 5% (Business Associate)',
          tierTenureMonths: Number(booking.tenureMonths) || 0,
          status: 'active',
          closingId: baClosedInfo ? baClosedInfo.closingId : null,
          ledgerEntryId: baLedgerEntryId,
          createdAt: receiptDate,
        });
        if (session) await subCommission.save({ session });
        else await subCommission.save();

        // 2. Parent Partner Developer Override (2% Instant)
        const parentDevId = sponsorDoc.sponsorId._id || sponsorDoc.sponsorId;
        if (parentDevId) {
          const bpFixedPct = 2.0;
          const bpFixedAmt = Math.round(collectionPrincipal * (bpFixedPct / 100) * 100) / 100;

          const devKey = `${receipt._id.toString()}_${parentDevId.toString()}_DEVELOPER_OVERRIDE`;
          const bpClosedInfo = closingTagMap[devKey] || null;

          const bpIncentivePct = bpClosedInfo ? bpClosedInfo.incentivePercent : 0;
          const bpIncentiveAmt = bpClosedInfo ? bpClosedInfo.incentiveAmount : 0;
          const bpTotalPct = +(bpFixedPct + bpIncentivePct).toFixed(3);
          const bpTotalAmt = Math.round((bpFixedAmt + bpIncentiveAmt) * 100) / 100;

          let bpLedgerEntryId = null;
          const bpRemarks = `F.Comm on ₹${colAmtFormatted} (${bpFixedPct}%) [${receiptTypeFormatted}] Receipt #${receipt.receiptNumber || ''} (Booking #${booking.bookingNumber || ''}) — BA: ${sponsorDoc.name}`;
          if (bpFixedAmt > 0 && receipt.status !== 'PENDING') {
            const bpLedger = await Ledger.findOne({ sponsorId: parentDevId }).session(session);
            let existingEntry = bpLedger ? await Entry.findOne({
              ledgerId: bpLedger._id,
              referenceId: receipt._id,
              source: 'commission_fixed',
              status: 'active'
            }).session(session) : null;

            if (existingEntry) {
              if (existingEntry.credit !== bpFixedAmt || existingEntry.particular !== bpRemarks || (existingEntry.date && new Date(existingEntry.date).getTime() !== new Date(receiptDate).getTime())) {
                await accountingService.updateLedgerEntry(existingEntry._id, {
                  credit: bpFixedAmt,
                  particular: bpRemarks,
                  date: receiptDate
                }, session);
              }
              bpLedgerEntryId = existingEntry._id;
            } else {
              const entry = await accountingService.recordLedgerEntry({
                sponsorId: parentDevId,
                date: receiptDate,
                type: 'CREDIT',
                amount: bpFixedAmt,
                source: 'commission_fixed',
                referenceId: receipt._id,
                remarks: bpRemarks
              }, session);
              bpLedgerEntryId = entry._id;
            }
            if (bpLedgerEntryId) validEntryIds.add(bpLedgerEntryId.toString());
          }

          const devCommission = new PlotSponsorCommission({
            bookingId: booking._id,
            receiptId: receipt._id,
            sponsorId: parentDevId,
            customerId: booking.customerId,
            collectionAmount: collectionPrincipal,
            plotValue: collectionPrincipal,
            amount: bpTotalAmt,
            commissionPercent: bpTotalPct,
            commissionRole: 'DEVELOPER_OVERRIDE',
            fixedPercent: bpFixedPct,
            incentivePercent: bpIncentivePct,
            fixedAmount: bpFixedAmt,
            incentiveAmount: bpIncentiveAmt,
            businessType: 'PLOT_SALE',
            periodVolume: 0,
            slabLabel: bpClosedInfo ? bpClosedInfo.slabLabel : 'Plot Sale Fixed 2% (Business Partner)',
            tierTenureMonths: Number(booking.tenureMonths) || 0,
            status: 'active',
            closingId: bpClosedInfo ? bpClosedInfo.closingId : null,
            ledgerEntryId: bpLedgerEntryId,
            createdAt: receiptDate,
          });
          if (session) await devCommission.save({ session });
          else await devCommission.save();
        }
      }
    }

    // Clean up any orphan commission_fixed entries for deleted/rejected receipts
    if (trackedReceiptIds.length > 0) {
      const orphanEntriesQuery = Entry.find({
        source: 'commission_fixed',
        referenceId: { $in: trackedReceiptIds }
      });
      if (session) orphanEntriesQuery.session(session);
      const orphanEntries = await orphanEntriesQuery;
      for (const e of orphanEntries) {
        if (!validEntryIds.has(e._id.toString())) {
          await accountingService.deleteLedgerEntry(e._id, session);
        }
      }
    }
  }

  // ── PRODUCT BOOKING SPONSOR COMMISSION SYNCHRONIZATION ENGINE ──
  async syncProductBookingSponsorCommissions(productBookingId, session = null) {
    if (!productBookingId) return;
    const query = PlotProductBooking.findById(productBookingId);
    if (session) query.session(session);
    const booking = await query;
    if (!booking) return;

    // If no sponsor or booking is cancelled, clean up commissions and ledger entries
    if (!booking.sponsorId || booking.status === 'CANCELLED') {
      const delQuery = PlotSponsorCommission.deleteMany({ productBookingId: booking._id });
      if (session) delQuery.session(session);
      await delQuery;

      const orphanQuery = Entry.find({
        source: 'commission_fixed',
        referenceId: booking._id,
      });
      if (session) orphanQuery.session(session);
      const orphanEntries = await orphanQuery;
      for (const e of orphanEntries) {
        await accountingService.deleteLedgerEntry(e._id, session);
      }
      return;
    }

    const sponsorQuery = User.findById(booking.sponsorId);
    if (session) sponsorQuery.session(session);
    const sponsorDoc = await sponsorQuery;
    if (!sponsorDoc) return;

    // Find existing commissions for this product booking to preserve closingId and incentive tags
    const existingQuery = PlotSponsorCommission.find({ productBookingId: booking._id });
    if (session) existingQuery.session(session);
    const existingComms = await existingQuery;
    const closingTagMap = {};
    existingComms.forEach((c) => {
      if (c.closingId && (c.receiptNumber || c._id)) {
        const key = `${c.receiptNumber || c._id.toString()}_${c.sponsorId.toString()}_${c.commissionRole}`;
        closingTagMap[key] = {
          closingId: c.closingId,
          incentivePercent: c.incentivePercent || 0,
          incentiveAmount: c.incentiveAmount || 0,
          slabLabel: c.slabLabel || '',
        };
      }
    });

    // Delete existing commissions for this booking to re-sync cleanly
    const delQuery = PlotSponsorCommission.deleteMany({ productBookingId: booking._id });
    if (session) delQuery.session(session);
    await delQuery;

    // Collect all receipts / collections for this product booking
    const collectionsList = [];
    const seenReceipts = new Set();

    if (Array.isArray(booking.collections) && booking.collections.length > 0) {
      for (const col of booking.collections) {
        if (!col.receiptNumber || seenReceipts.has(col.receiptNumber)) continue;
        seenReceipts.add(col.receiptNumber);
        collectionsList.push({
          receiptNumber: col.receiptNumber,
          amountPaid: Number(col.amountPaid || 0),
          principalPaid: Number(col.principalPaid || col.amountPaid || 0),
          lateFinePaid: Number(col.lateFinePaid || 0),
          paymentDate: col.paymentDate || col.createdAt || booking.createdAt,
          receiptType: 'Product EMI',
        });
      }
    }

    if (Array.isArray(booking.installments)) {
      for (const inst of booking.installments) {
        if (inst.receiptNumber && !seenReceipts.has(inst.receiptNumber)) {
          seenReceipts.add(inst.receiptNumber);
          collectionsList.push({
            receiptNumber: inst.receiptNumber,
            amountPaid: Number(inst.paidAmount || 0),
            principalPaid: Number(inst.paidAmount || 0),
            lateFinePaid: Number(inst.lateFinePaid || 0),
            paymentDate: inst.paidDate || booking.createdAt,
            receiptType: 'Product EMI',
          });
        }
      }
    }

    if (booking.downPayment > 0 && !seenReceipts.has(`DP-${booking.bookingNumber}`)) {
      const dpReceipt = `DP-${booking.bookingNumber}`;
      seenReceipts.add(dpReceipt);
      collectionsList.push({
        receiptNumber: dpReceipt,
        amountPaid: Number(booking.downPayment),
        principalPaid: Number(booking.downPayment),
        lateFinePaid: 0,
        paymentDate: booking.bookingDate || booking.createdAt,
        receiptType: 'Product Downpayment',
      });
    }

    const validEntryIds = new Set();

    for (const col of collectionsList) {
      const collectionPrincipal = col.principalPaid > 0 ? col.principalPaid : Math.max(0, col.amountPaid - col.lateFinePaid);
      if (collectionPrincipal <= 0) continue;

      const receiptDate = col.paymentDate ? new Date(col.paymentDate) : new Date();
      const colAmtFormatted = collectionPrincipal.toLocaleString('en-IN');
      const receiptTypeFormatted = col.receiptType || 'Product Collection';

      if (!sponsorDoc.sponsorId) {
        // ── BUSINESS PARTNER DIRECT SALE ──
        // Fixed: 2.50% (BA) + 1.00% (BP) = 3.50% Immediate
        const combinedFixedPct = 3.50;
        const fixedAmt = Math.round(collectionPrincipal * (combinedFixedPct / 100) * 100) / 100;

        const key = `${col.receiptNumber}_${sponsorDoc._id.toString()}_DIRECT_DEVELOPER`;
        const closedInfo = closingTagMap[key] || null;

        const incentivePct = closedInfo ? closedInfo.incentivePercent : 0;
        const incentiveAmt = closedInfo ? closedInfo.incentiveAmount : 0;
        const totalPct = +(combinedFixedPct + incentivePct).toFixed(3);
        const totalAmt = Math.round((fixedAmt + incentiveAmt) * 100) / 100;

        let ledgerEntryId = null;
        const directRemarks = `F.Comm on ₹${colAmtFormatted} (${combinedFixedPct}%) [${receiptTypeFormatted}] Receipt #${col.receiptNumber} (Booking #${booking.bookingNumber})`;
        if (fixedAmt > 0) {
          const sponsorLedger = await Ledger.findOne({ sponsorId: sponsorDoc._id }).session(session);
          let existingEntry = sponsorLedger ? await Entry.findOne({
            ledgerId: sponsorLedger._id,
            referenceId: booking._id,
            particular: { $regex: col.receiptNumber },
            source: 'commission_fixed',
            status: 'active'
          }).session(session) : null;

          if (existingEntry) {
            if (existingEntry.credit !== fixedAmt || existingEntry.particular !== directRemarks || (existingEntry.date && new Date(existingEntry.date).getTime() !== new Date(receiptDate).getTime())) {
              await accountingService.updateLedgerEntry(existingEntry._id, {
                credit: fixedAmt,
                particular: directRemarks,
                date: receiptDate
              }, session);
            }
            ledgerEntryId = existingEntry._id;
          } else {
            const entry = await accountingService.recordLedgerEntry({
              sponsorId: sponsorDoc._id,
              date: receiptDate,
              type: 'CREDIT',
              amount: fixedAmt,
              source: 'commission_fixed',
              referenceId: booking._id,
              remarks: directRemarks
            }, session);
            ledgerEntryId = entry._id;
          }
          if (ledgerEntryId) validEntryIds.add(ledgerEntryId.toString());
        }

        const commDoc = new PlotSponsorCommission({
          productBookingId: booking._id,
          receiptNumber: col.receiptNumber,
          sponsorId: sponsorDoc._id,
          customerId: booking.customerId,
          collectionAmount: collectionPrincipal,
          plotValue: collectionPrincipal,
          amount: totalAmt,
          commissionPercent: totalPct,
          commissionRole: 'DIRECT_DEVELOPER',
          fixedPercent: combinedFixedPct,
          incentivePercent: incentivePct,
          fixedAmount: fixedAmt,
          incentiveAmount: incentiveAmt,
          businessType: 'PLOT_PRODUCT',
          periodVolume: 0,
          slabLabel: closedInfo ? closedInfo.slabLabel : 'Product Collection Fixed 3.50% (Direct Partner)',
          tierTenureMonths: Number(booking.tenureMonths) || 0,
          status: 'active',
          closingId: closedInfo ? closedInfo.closingId : null,
          ledgerEntryId,
          createdAt: receiptDate,
        });
        if (session) await commDoc.save({ session });
        else await commDoc.save();
      } else {
        // ── BUSINESS ASSOCIATE (2.50% Fixed) + PARENT PARTNER (1.00% Fixed) ──
        // 1. Business Associate Commission (2.50% Immediate)
        const baFixedPct = 2.50;
        const baFixedAmt = Math.round(collectionPrincipal * (baFixedPct / 100) * 100) / 100;

        const promoterKey = `${col.receiptNumber}_${sponsorDoc._id.toString()}_PROMOTER`;
        const baClosedInfo = closingTagMap[promoterKey] || null;

        const baIncentivePct = baClosedInfo ? baClosedInfo.incentivePercent : 0;
        const baIncentiveAmt = baClosedInfo ? baClosedInfo.incentiveAmount : 0;
        const baTotalPct = +(baFixedPct + baIncentivePct).toFixed(3);
        const baTotalAmt = Math.round((baFixedAmt + baIncentiveAmt) * 100) / 100;

        let baLedgerEntryId = null;
        const baRemarks = `F.Comm on ₹${colAmtFormatted} (${baFixedPct}%) [${receiptTypeFormatted}] Receipt #${col.receiptNumber} (Booking #${booking.bookingNumber})`;
        if (baFixedAmt > 0) {
          const baLedger = await Ledger.findOne({ sponsorId: sponsorDoc._id }).session(session);
          let existingEntry = baLedger ? await Entry.findOne({
            ledgerId: baLedger._id,
            referenceId: booking._id,
            particular: { $regex: col.receiptNumber },
            source: 'commission_fixed',
            status: 'active'
          }).session(session) : null;

          if (existingEntry) {
            if (existingEntry.credit !== baFixedAmt || existingEntry.particular !== baRemarks || (existingEntry.date && new Date(existingEntry.date).getTime() !== new Date(receiptDate).getTime())) {
              await accountingService.updateLedgerEntry(existingEntry._id, {
                credit: baFixedAmt,
                particular: baRemarks,
                date: receiptDate
              }, session);
            }
            baLedgerEntryId = existingEntry._id;
          } else {
            const entry = await accountingService.recordLedgerEntry({
              sponsorId: sponsorDoc._id,
              date: receiptDate,
              type: 'CREDIT',
              amount: baFixedAmt,
              source: 'commission_fixed',
              referenceId: booking._id,
              remarks: baRemarks
            }, session);
            baLedgerEntryId = entry._id;
          }
          if (baLedgerEntryId) validEntryIds.add(baLedgerEntryId.toString());
        }

        const subCommission = new PlotSponsorCommission({
          productBookingId: booking._id,
          receiptNumber: col.receiptNumber,
          sponsorId: sponsorDoc._id,
          customerId: booking.customerId,
          collectionAmount: collectionPrincipal,
          plotValue: collectionPrincipal,
          amount: baTotalAmt,
          commissionPercent: baTotalPct,
          commissionRole: 'PROMOTER',
          fixedPercent: baFixedPct,
          incentivePercent: baIncentivePct,
          fixedAmount: baFixedAmt,
          incentiveAmount: baIncentiveAmt,
          businessType: 'PLOT_PRODUCT',
          periodVolume: 0,
          slabLabel: baClosedInfo ? baClosedInfo.slabLabel : 'Product Collection Fixed 2.50% (Business Associate)',
          tierTenureMonths: Number(booking.tenureMonths) || 0,
          status: 'active',
          closingId: baClosedInfo ? baClosedInfo.closingId : null,
          ledgerEntryId: baLedgerEntryId,
          createdAt: receiptDate,
        });
        if (session) await subCommission.save({ session });
        else await subCommission.save();

        // 2. Parent Partner Developer Override (1.00% Immediate)
        const parentDevId = sponsorDoc.sponsorId._id || sponsorDoc.sponsorId;
        if (parentDevId) {
          const bpFixedPct = 1.00;
          const bpFixedAmt = Math.round(collectionPrincipal * (bpFixedPct / 100) * 100) / 100;

          const devKey = `${col.receiptNumber}_${parentDevId.toString()}_DEVELOPER_OVERRIDE`;
          const bpClosedInfo = closingTagMap[devKey] || null;

          const bpIncentivePct = bpClosedInfo ? bpClosedInfo.incentivePercent : 0;
          const bpIncentiveAmt = bpClosedInfo ? bpClosedInfo.incentiveAmount : 0;
          const bpTotalPct = +(bpFixedPct + bpIncentivePct).toFixed(3);
          const bpTotalAmt = Math.round((bpFixedAmt + bpIncentiveAmt) * 100) / 100;

          let bpLedgerEntryId = null;
          const bpRemarks = `F.Comm on ₹${colAmtFormatted} (${bpFixedPct}%) [${receiptTypeFormatted}] Receipt #${col.receiptNumber} (Booking #${booking.bookingNumber}) — BA: ${sponsorDoc.name}`;
          if (bpFixedAmt > 0) {
            const bpLedger = await Ledger.findOne({ sponsorId: parentDevId }).session(session);
            let existingEntry = bpLedger ? await Entry.findOne({
              ledgerId: bpLedger._id,
              referenceId: booking._id,
              particular: { $regex: col.receiptNumber },
              source: 'commission_fixed',
              status: 'active'
            }).session(session) : null;

            if (existingEntry) {
              if (existingEntry.credit !== bpFixedAmt || existingEntry.particular !== bpRemarks || (existingEntry.date && new Date(existingEntry.date).getTime() !== new Date(receiptDate).getTime())) {
                await accountingService.updateLedgerEntry(existingEntry._id, {
                  credit: bpFixedAmt,
                  particular: bpRemarks,
                  date: receiptDate
                }, session);
              }
              bpLedgerEntryId = existingEntry._id;
            } else {
              const entry = await accountingService.recordLedgerEntry({
                sponsorId: parentDevId,
                date: receiptDate,
                type: 'CREDIT',
                amount: bpFixedAmt,
                source: 'commission_fixed',
                referenceId: booking._id,
                remarks: bpRemarks
              }, session);
              bpLedgerEntryId = entry._id;
            }
            if (bpLedgerEntryId) validEntryIds.add(bpLedgerEntryId.toString());
          }

          const devCommission = new PlotSponsorCommission({
            productBookingId: booking._id,
            receiptNumber: col.receiptNumber,
            sponsorId: parentDevId,
            customerId: booking.customerId,
            collectionAmount: collectionPrincipal,
            plotValue: collectionPrincipal,
            amount: bpTotalAmt,
            commissionPercent: bpTotalPct,
            commissionRole: 'DEVELOPER_OVERRIDE',
            fixedPercent: bpFixedPct,
            incentivePercent: bpIncentivePct,
            fixedAmount: bpFixedAmt,
            incentiveAmount: bpIncentiveAmt,
            businessType: 'PLOT_PRODUCT',
            periodVolume: 0,
            slabLabel: bpClosedInfo ? bpClosedInfo.slabLabel : 'Product Collection Fixed 1.00% (Business Partner)',
            tierTenureMonths: Number(booking.tenureMonths) || 0,
            status: 'active',
            closingId: bpClosedInfo ? bpClosedInfo.closingId : null,
            ledgerEntryId: bpLedgerEntryId,
            createdAt: receiptDate,
          });
          if (session) await devCommission.save({ session });
          else await devCommission.save();
        }
      }
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

    const activeProductBookings = await PlotProductBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      sponsorId: sponsor._id,
    }).select('_id').lean();

    for (const pb of activeProductBookings) {
      await this.syncProductBookingSponsorCommissions(pb._id);
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
    let fixedCommissionEarned = 0;
    let incentiveEarned = 0;

    const monthlyTrendsMap = {};
    const recentCommissions = [];

    commissions.forEach((c, idx) => {
      const colAmt = Number(c.collectionAmount || 0);
      const earnAmt = Number(c.amount || 0);
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const fAmt = Number(c.fixedAmount || 0) || Math.round(earnAmt * (c.fixedPercent && c.commissionPercent ? (c.fixedPercent / c.commissionPercent) : 0.7));
      const iAmt = Number(c.incentiveAmount || 0) || Math.max(0, earnAmt - fAmt);

      totalCollectionVolume += colAmt;
      totalCommissionEarned += earnAmt;
      fixedCommissionEarned += fAmt;
      incentiveEarned += iAmt;

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
          fixedPercent: c.fixedPercent || 0,
          incentivePercent: c.incentivePercent || 0,
          slabLabel: c.slabLabel || '',
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

    const availableBalance = Math.max(0, closedCommission - totalDisbursedPayouts);
    const monthlyTrends = Object.values(monthlyTrendsMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

    const now = new Date();
    const currentMonthDirectVol = await this.getSponsorPeriodVolume(sponsor._id, now, false);
    const currentMonthTeamVol = await this.getSponsorPeriodVolume(sponsor._id, now, true);
    const plotPolicy = CommissionPolicyConfig.getDefaultPlotPolicy();
    const roleName = sponsor.sponsorId ? 'BUSINESS_ASSOCIATE' : 'BUSINESS_PARTNER';
    const evalVolume = sponsor.sponsorId ? currentMonthDirectVol : currentMonthTeamVol;
    const slabInfo = CommissionPolicyConfig.resolveSlab(plotPolicy, roleName, evalVolume);

    const targetTierInfo = {
      roleName,
      roleDisplay: sponsor.sponsorId ? 'Business Associate' : 'Business Partner',
      periodLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      currentMonthVolume: evalVolume,
      directVolume: currentMonthDirectVol,
      teamVolume: currentMonthTeamVol,
      currentSlab: slabInfo.slabLabel,
      fixedPercent: slabInfo.fixedPercent,
      incentivePercent: slabInfo.incentivePercent,
      totalPercent: slabInfo.totalPercent,
      nextSlabLabel: slabInfo.nextSlab ? slabInfo.nextSlab.label : null,
      nextSlabIncentive: slabInfo.nextSlab ? slabInfo.nextSlab.targetIncentivePercent : null,
      distanceToNextSlab: slabInfo.distanceToNextSlab,
    };

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
        fixedCommissionEarned: Math.round(fixedCommissionEarned * 100) / 100,
        incentiveEarned: Math.round(incentiveEarned * 100) / 100,
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
        subordinatesCount: subordinates.length,
        targetTierInfo
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

    const activeProductBookings = await PlotProductBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      sponsorId: sponsor._id,
    }).select('_id').lean();

    for (const pb of activeProductBookings) {
      await this.syncProductBookingSponsorCommissions(pb._id);
    }

    const subordinates = await User.find({
      role: 'sponsor',
      sponsorId: sponsor._id
    }).select('_id name sponsorCode customerId mobile email createdAt').lean();

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
      .populate({
        path: 'productBookingId',
        select: 'bookingNumber tenureMonths totalAmount remainingAmount productId bookingDate createdAt sponsorId',
        populate: [
          { path: 'productId', select: 'productName productCode dimensionLabel' },
          { path: 'sponsorId', select: 'name sponsorCode' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();


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

    if (typeFilter === 'SELF') {
      filteredCommissions = filteredCommissions.filter(c => c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER');
    } else if (typeFilter === 'SUBORDINATE') {
      filteredCommissions = filteredCommissions.filter(c => c.commissionRole === 'DEVELOPER_OVERRIDE');
    }

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

    let selfCollection = 0;
    let selfCommission = 0;
    let subCollection = 0;
    let subCommission = 0;
    let fixedCommissionTotal = 0;
    let incentiveCommissionTotal = 0;
    let plotCollectionTotal = 0;
    let plotCommissionTotal = 0;

    const items = filteredCommissions.map(c => {
      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const colAmt = Number(c.collectionAmount || 0);
      const earnAmt = Number(c.amount || 0);
      const fAmt = Number(c.fixedAmount || 0) || Math.round(earnAmt * (c.fixedPercent && c.commissionPercent ? (c.fixedPercent / c.commissionPercent) : 0.7));
      const iAmt = Number(c.incentiveAmount || 0) || Math.max(0, earnAmt - fAmt);

      if (isDirect) {
        selfCollection += colAmt;
        selfCommission += earnAmt;
      } else {
        subCollection += colAmt;
        subCommission += earnAmt;
      }

      fixedCommissionTotal += fAmt;
      incentiveCommissionTotal += iAmt;
      plotCollectionTotal += colAmt;
      plotCommissionTotal += earnAmt;

      const bookingSponsor = c.bookingId?.sponsorId;
      const isSubordinateSale = c.commissionRole === 'DEVELOPER_OVERRIDE';
      const isDirectDeveloper = c.commissionRole === 'DIRECT_DEVELOPER';

      let percentFormula = `${c.commissionPercent}%`;
      if (c.fixedPercent && c.incentivePercent) {
        percentFormula = `${c.fixedPercent}% Fix + ${c.incentivePercent}% Incentive`;
      } else if (isDirectDeveloper) {
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
        fixedPercent: c.fixedPercent || 0,
        incentivePercent: c.incentivePercent || 0,
        fixedAmount: fAmt,
        incentiveAmount: iAmt,
        slabLabel: c.slabLabel || '',
        businessType: c.businessType || 'PLOT_SALE',
        percentFormula,
        commissionEarned: earnAmt,
        isClosed: Boolean(c.closingId),
        closingNumber: c.closingId?.closingNumber || null,
        closingName: c.closingId?.closingName || null
      };
    });

    // Also fetch Investment Commissions (RD / FD) for this sponsor
    let investmentCollectionTotal = 0;
    let investmentCommissionTotal = 0;
    try {
      const invComms = await InvestmentCommission.find({
        sponsorId: sponsor._id,
        status: { $ne: 'CANCELLED' }
      })
        .populate('accountId', 'accountNumber customerName customerMobile schemeType')
        .populate('receiptId', 'receiptNumber paymentMode paymentDate amount')
        .lean();

      invComms.forEach(ic => {
        const iDate = ic.earnedDate || ic.createdAt;
        const dStr = new Date(iDate).toISOString().slice(0, 10);
        if (fromDate && dStr < fromDate) return;
        if (toDate && dStr > toDate) return;

        const isDirect = ic.sponsorRole === 'DIRECT_DEVELOPER' || ic.sponsorRole === 'PROMOTER';
        if (typeFilter === 'SELF' && !isDirect) return;
        if (typeFilter === 'SUBORDINATE' && isDirect) return;

        const col = Number(ic.collectedAmount || 0);
        const comm = Number(ic.commissionAmount || 0);
        const fAmt = Number(ic.fixedAmount || 0) || Math.round(comm * 0.7);
        const iAmt = Number(ic.incentiveAmount || 0) || Math.max(0, comm - fAmt);

        investmentCollectionTotal += col;
        investmentCommissionTotal += comm;
        fixedCommissionTotal += fAmt;
        incentiveCommissionTotal += iAmt;

        if (isDirect) {
          selfCollection += col;
          selfCommission += comm;
        } else {
          subCollection += col;
          subCommission += comm;
        }

        items.push({
          _id: ic._id,
          date: iDate,
          receiptNumber: ic.receiptId?.receiptNumber || '-',
          receiptType: 'INVESTMENT',
          paymentMode: ic.receiptId?.paymentMode || 'cash',
          bookingNumber: ic.accountId?.accountNumber || '-',
          plotNumber: `RD/FD (${ic.accountId?.schemeType || 'Deposit'})`,
          customerName: ic.accountId?.customerName || '-',
          customerCode: '-',
          customerMobile: ic.accountId?.customerMobile || '-',
          sourceType: isDirect ? 'SELF' : 'SUBORDINATE',
          subordinateName: null,
          subordinateCode: null,
          commissionRole: ic.sponsorRole,
          collectionAmount: col,
          commissionPercent: ic.commissionPercent,
          fixedPercent: ic.fixedPercent || 0,
          incentivePercent: ic.incentivePercent || 0,
          fixedAmount: fAmt,
          incentiveAmount: iAmt,
          slabLabel: ic.slabLabel || 'RD/FD Policy',
          businessType: 'INVESTMENT_RD_FD',
          percentFormula: `${ic.commissionPercent}% (RD/FD)`,
          commissionEarned: comm,
          isClosed: Boolean(ic.closingId),
          closingNumber: null,
          closingName: null
        });
      });
    } catch (e) {
      // Ignore if investment collection fails
    }

    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalCollection = selfCollection + subCollection;
    const totalCommission = selfCommission + subCommission;

    const now = new Date();
    const currentMonthDirectVol = await this.getSponsorPeriodVolume(sponsor._id, now, false);
    const currentMonthTeamVol = await this.getSponsorPeriodVolume(sponsor._id, now, true);
    const plotPolicy = CommissionPolicyConfig.getDefaultPlotPolicy();
    const roleName = sponsor.sponsorId ? 'BUSINESS_ASSOCIATE' : 'BUSINESS_PARTNER';
    const evalVolume = sponsor.sponsorId ? currentMonthDirectVol : currentMonthTeamVol;
    const slabInfo = CommissionPolicyConfig.resolveSlab(plotPolicy, roleName, evalVolume);

    const targetTierInfo = {
      roleName,
      roleDisplay: sponsor.sponsorId ? 'Business Associate' : 'Business Partner',
      periodLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      currentMonthVolume: evalVolume,
      directVolume: currentMonthDirectVol,
      teamVolume: currentMonthTeamVol,
      currentSlab: slabInfo.slabLabel,
      fixedPercent: slabInfo.fixedPercent,
      incentivePercent: slabInfo.incentivePercent,
      totalPercent: slabInfo.totalPercent,
      nextSlabLabel: slabInfo.nextSlab ? slabInfo.nextSlab.label : null,
      nextSlabIncentive: slabInfo.nextSlab ? slabInfo.nextSlab.targetIncentivePercent : null,
      distanceToNextSlab: slabInfo.distanceToNextSlab,
    };

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
        totalCollection: Math.round(totalCollection * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        selfCollection: Math.round(selfCollection * 100) / 100,
        selfCommission: Math.round(selfCommission * 100) / 100,
        subordinateCollection: Math.round(subCollection * 100) / 100,
        subordinateCommission: Math.round(subCommission * 100) / 100,
        fixedCommissionTotal: Math.round(fixedCommissionTotal * 100) / 100,
        incentiveCommissionTotal: Math.round(incentiveCommissionTotal * 100) / 100,
        plotCollectionTotal: Math.round(plotCollectionTotal * 100) / 100,
        plotCommissionTotal: Math.round(plotCommissionTotal * 100) / 100,
        investmentCollectionTotal: Math.round(investmentCollectionTotal * 100) / 100,
        investmentCommissionTotal: Math.round(investmentCommissionTotal * 100) / 100,
        transactionsCount: items.length,
        targetTierInfo
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

    const activeBookings = await PlotBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      $or: [{ sponsorId: sponsor._id }, { parentSponsorId: sponsor._id }]
    }).select('_id').lean();

    for (const b of activeBookings) {
      await this.syncBookingSponsorCommissions(b._id);
    }

    const activeProductBookings = await PlotProductBooking.find({
      status: { $in: ['ACTIVE', 'COMPLETED'] },
      sponsorId: sponsor._id,
    }).select('_id').lean();

    for (const pb of activeProductBookings) {
      await this.syncProductBookingSponsorCommissions(pb._id);
    }

    const commissions = await PlotSponsorCommission.find({
      sponsorId: sponsor._id,
      status: 'active'
    })
      .populate('customerId', 'name customerId customerCode mobile')
      .populate('closingId', 'closingName closingNumber startDate endDate')
      .populate('receiptId', 'receiptNumber amount paymentMode transactionReference createdAt receiptType')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber tenureMonths plotValue netValue discount plotId',
        populate: { path: 'plotId', select: 'plotNumber seriesId' }
      })
      .populate({
        path: 'productBookingId',
        select: 'bookingNumber tenureMonths totalAmount remainingAmount productId',
        populate: { path: 'productId', select: 'productName productCode dimensionLabel' }
      })
      .sort({ createdAt: 1 })
      .lean();


    const rawTransactions = [];
    let totalCredits = 0;
    let totalDebits = 0;
    let totalCollectionsBase = 0;
    let totalFixedCredited = 0;
    let totalIncentiveCredited = 0;

    // 1. Instant Fixed Commissions from collections
    commissions.forEach(c => {
      const colAmt = Number(c.collectionAmount || 0);
      const fAmt = Number(c.fixedAmount || 0) || Math.round(colAmt * ((c.fixedPercent || 5) / 100) * 100) / 100;
      if (fAmt <= 0) return;

      totalCredits += fAmt;
      totalFixedCredited += fAmt;
      totalCollectionsBase += colAmt;

      const rNum = c.receiptId?.receiptNumber || c.receiptNumber || '-';
      const bNum = c.bookingId?.bookingNumber || c.productBookingId?.bookingNumber || '-';
      const cName = c.customerId?.name || '-';
      let rType = 'Collection';
      if (c.businessType === 'PLOT_PRODUCT') {
        rType = 'Product Collection';
      } else if (c.receiptId?.receiptType === 'DOWNPAYMENT') {
        rType = 'Downpayment';
      } else if (c.receiptId?.receiptType === 'INSTALLMENT') {
        rType = 'EMI';
      } else if (c.receiptId?.receiptType === 'FULL_PAYMENT') {
        rType = 'Full Payment';
      } else if (c.receiptId?.receiptType === 'BOOKING') {
        rType = 'Booking';
      } else if (c.receiptId?.receiptType) {
        rType = c.receiptId.receiptType;
      }

      const isDirect = c.commissionRole === 'DIRECT_DEVELOPER' || c.commissionRole === 'PROMOTER';
      const isProduct = c.businessType === 'PLOT_PRODUCT';
      const roleStr = isDirect
        ? (c.commissionRole === 'DIRECT_DEVELOPER' ? (isProduct ? 'Direct Partner (3.5%)' : 'Direct Partner (7%)') : (isProduct ? 'Associate (2.5%)' : 'Associate (5%)'))
        : (isProduct ? 'Partner Override (1%)' : 'Partner Override (2%)');

      const desc = `F.Comm on ₹${colAmt.toLocaleString('en-IN')} (${c.fixedPercent || (isDirect ? (c.commissionRole === 'DIRECT_DEVELOPER' ? (isProduct ? 3.5 : 7) : (isProduct ? 2.5 : 5)) : (isProduct ? 1 : 2))}%) [${rType}] Receipt #${rNum} (Booking #${bNum})`;

      rawTransactions.push({
        id: c._id,
        date: c.receiptId?.createdAt || c.createdAt,
        type: 'CREDIT',
        category: 'COMMISSION_FIXED',
        role: c.commissionRole,
        roleLabel: roleStr,
        description: desc,
        bookingNumber: bNum,
        receiptNumber: rNum,
        customerName: cName,
        collectionAmount: colAmt,
        ratePercent: c.fixedPercent,
        credit: fAmt,
        debit: 0,
        status: 'CREDITED',
        businessType: c.businessType || 'PLOT_SALE'
      });

    });

    // 2. Periodic Target Incentive Closings
    const closingGroups = {};
    commissions.forEach(c => {
      if (!c.closingId || !c.closingId._id) return;
      const clsId = c.closingId._id.toString();
      const iAmt = Number(c.incentiveAmount || 0);
      if (iAmt <= 0) return;

      if (!closingGroups[clsId]) {
        closingGroups[clsId] = {
          closingId: c.closingId._id,
          closingName: c.closingId.closingName,
          closingNumber: c.closingId.closingNumber,
          startDate: c.closingId.startDate,
          endDate: c.closingId.endDate,
          incentiveCommission: 0,
          totalBusiness: 0,
          slabLabel: c.slabLabel || '',
          entries: [],
          latestDate: c.closingId.endDate || c.createdAt,
        };
      }

      closingGroups[clsId].incentiveCommission += iAmt;
      closingGroups[clsId].totalBusiness += Number(c.collectionAmount || 0);
      closingGroups[clsId].entries.push(c);
    });

    Object.values(closingGroups).forEach(cg => {
      totalCredits += cg.incentiveCommission;
      totalIncentiveCredited += cg.incentiveCommission;

      const desc = `Target Incentive for ${cg.closingName} [${cg.closingNumber}] — Period: ${new Date(cg.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} to ${new Date(cg.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. Achieved Target Incentive: ₹${cg.incentiveCommission.toLocaleString('en-IN')} (${cg.slabLabel || 'Periodic Slab'})`;

      rawTransactions.push({
        id: cg.closingId,
        date: cg.latestDate,
        type: 'CREDIT',
        category: 'COMMISSION_CLOSING',
        role: 'TARGET_INCENTIVE',
        roleLabel: cg.closingNumber,
        description: desc,
        closingId: cg.closingId,
        closingNumber: cg.closingNumber,
        closingName: cg.closingName,
        slabLabel: cg.slabLabel,
        collectionAmount: cg.totalBusiness,
        credit: cg.incentiveCommission,
        debit: 0,
        status: 'CLOSED',
        entriesCount: cg.entries.length,
      });
    });

    // 3. Payout Vouchers (Debits)
    const vouchers = await PlotPayoutVoucher.find({
      $or: [{ customerId: sponsor._id }, { sponsorId: sponsor._id }]
    }).sort({ payoutDate: 1 }).lean().catch(() => []);

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

    rawTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const computedTransactions = rawTransactions.map(tx => {
      runningBalance += (tx.credit - tx.debit);
      return {
        ...tx,
        balance: Math.round(runningBalance * 100) / 100
      };
    });

    computedTransactions.reverse();

    return {
      sponsor,
      summary: {
        totalCredits: Math.round(totalCredits * 100) / 100,
        totalDebits: Math.round(totalDebits * 100) / 100,
        availableBalance: Math.round((totalCredits - totalDebits) * 100) / 100,
        totalFixedCredited: Math.round(totalFixedCredited * 100) / 100,
        totalIncentiveCredited: Math.round(totalIncentiveCredited * 100) / 100,
        totalCollectionsBase: Math.round(totalCollectionsBase * 100) / 100,
        totalTransactions: computedTransactions.length
      },
      transactions: computedTransactions
    };
  }

  async getSponsors(query = {}) {
    const { search, branchId, roleType, page = 1, limit = 50 } = query;
    const filter = { role: { $in: ['sponsor', 'agent'] } };
    if (branchId && branchId !== 'all') {
      filter.branchIds = branchId;
    }
    if (roleType === 'partner') {
      filter.$or = [{ sponsorId: null }, { sponsorId: { $exists: false } }];
    } else if (roleType === 'associate') {
      filter.sponsorId = { $ne: null, $exists: true };
    }
    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { sponsorCode: { $regex: search, $options: 'i' } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const rawSponsors = await User.find(filter)
      .populate('sponsorId', 'name sponsorCode mobile email branchIds')
      .populate('branchIds', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const sponsorIds = rawSponsors.map(s => s._id);
    const ledgers = await Ledger.find({ sponsorId: { $in: sponsorIds } }).lean();
    const ledgerMap = new Map(ledgers.map(l => [l.sponsorId.toString(), l._id.toString()]));

    const sponsors = await Promise.all(
      rawSponsors.map(async (s) => {
        let ledgerId = ledgerMap.get(s._id.toString());
        if (!ledgerId) {
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
    const {
      name,
      email,
      mobile,
      password,
      address,
      currentAddress,
      permanentAddress,
      sameAsCurrentAddress,
      dob,
      occupation,
      gender,
      nomineeName,
      nomineeRelation,
      nomineeAge,
      panCard,
      aadhaarCard,
      commissionRate,
      sponsorId,
      branchId,
      branchIds,
    } = data;

    if (!sponsorId) {
      throw new Error('Referring Sponsor / Direct Company selection is required');
    }

    const userEmail = email && typeof email === 'string' && email.trim() ? email.trim() : undefined;
    
    if (userEmail) {
      const existing = await User.findOne({ email: userEmail });
      if (existing) {
        throw new Error('User with this email already exists');
      }
    }

    const resolvedParentId = sponsorId === 'company' || sponsorId === 'direct' ? null : sponsorId;

    const now = new Date();
    const month = now.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
    const fullYear = now.getFullYear();
    let startYear = month >= 3 ? fullYear : fullYear - 1;
    let endYear = startYear + 1;
    const fyStr = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;

    // P for Business Partner (Direct to company), A for Business Associate (Under Partner)
    const codeType = resolvedParentId ? 'A' : 'P';
    const counterKey = `GNE-${codeType}-${fyStr}`;
    const seqNum = await Counter.getNextSequence(counterKey, null, 3);
    const sponsorCode = `${codeType}/${fyStr}/${seqNum}`;

    let resolvedBranchIds = [];
    if (branchId) {
      resolvedBranchIds = [branchId];
    } else if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
      resolvedBranchIds = branchIds;
    }

    if (resolvedParentId) {
      const parentSponsor = await User.findById(resolvedParentId);
      if (!parentSponsor) {
        throw new Error('Referring sponsor not found');
      }
      if (parentSponsor.sponsorId) {
        throw new Error('Hierarchy limit reached: Sub-sponsors cannot have child sponsors under them. Referring sponsor must be a Developer Sponsor (Direct to Company).');
      }
      if (resolvedBranchIds.length === 0 && parentSponsor.branchIds && parentSponsor.branchIds.length > 0) {
        resolvedBranchIds = parentSponsor.branchIds;
      }
    }

    const sponsorData = {
      name,
      sponsorCode,
      sponsorId: resolvedParentId,
      branchIds: resolvedBranchIds,
      password: password || '123456',
      mobile: mobile || '',
      role: 'sponsor',
      address: address || currentAddress || '',
      currentAddress: currentAddress || address || '',
      permanentAddress: permanentAddress || '',
      sameAsCurrentAddress: Boolean(sameAsCurrentAddress),
      dob: dob || '',
      occupation: occupation || '',
      gender: gender || 'Male',
      nomineeName: nomineeName || '',
      nomineeRelation: nomineeRelation || '',
      nomineeAge: nomineeAge ? Number(nomineeAge) : undefined,
      panCard: panCard || '',
      aadhaarCard: aadhaarCard || '',
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
    if (updateData.branchId) {
      updateData.branchIds = [updateData.branchId];
      delete updateData.branchId;
    }
    if (updateData.sponsorId !== undefined) {
      if (updateData.sponsorId === 'company' || updateData.sponsorId === 'direct') {
        updateData.sponsorId = null;
      } else if (updateData.sponsorId) {
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

    if (updateData.password && updateData.password.trim()) {
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password.trim(), salt);
    } else {
      delete updateData.password;
    }

    const sponsor = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('sponsorId', 'name sponsorCode mobile email branchIds')
      .populate('branchIds', 'name location');
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
    const customerCount = await User.countDocuments({ sponsorId: id });
    if (customerCount > 0) {
      throw ApiError.badRequest(`Cannot delete business developer. ${customerCount} customer(s) are assigned to this developer.`);
    }
    const bookingCount = await PlotBooking.countDocuments({ sponsorId: id });
    if (bookingCount > 0) {
      throw ApiError.badRequest(`Cannot delete business developer. ${bookingCount} plot booking(s) are associated with this developer.`);
    }
    const sponsor = await User.findByIdAndDelete(id);
    if (!sponsor) {
      throw ApiError.notFound('Business developer not found');
    }
    return { message: 'Business developer deleted successfully' };
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

    let resolvedSponsorId = sponsorId === 'company' || sponsorId === 'direct' || !sponsorId ? null : sponsorId;
    if (resolvedSponsorId) {
      const sponsorDoc = await User.findById(resolvedSponsorId);
      if (!sponsorDoc) {
        throw new Error('Selected sponsor not found');
      }
      if (!sponsorDoc.sponsorId) {
        throw new Error('Customers can only be registered under a Business Associate (BA), not directly under a Business Partner (BP).');
      }
    }

    // Financial Year string: e.g. 2627 (April 1 to March 31)
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed, 3 = April
    const startYr = curMonth >= 3 ? curYear : curYear - 1;
    const endYr = startYr + 1;
    const fyStr = `${String(startYr).slice(-2)}${String(endYr).slice(-2)}`;

    const seq = await Counter.getNextSequence(`PLOT_CUST_FY_${fyStr}`, null, 3);
    const customerId = `C/${fyStr}/${seq}`;

    const customer = new PlotCustomer({
      customerId,
      sponsorId: resolvedSponsorId,
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
      const user = await User.findById(id).populate('sponsorId', 'name sponsorCode mobile email photo signature');
      if (user && user.role === 'customer') return user;
      throw new Error('Customer not found');
    }
    return customer;
  }

  async updateCustomer(id, data) {
    if (data.sponsorId === 'company' || data.sponsorId === 'direct') {
      data.sponsorId = null;
    } else if (data.sponsorId) {
      const sponsorDoc = await User.findById(data.sponsorId);
      if (!sponsorDoc) {
        throw new Error('Selected sponsor not found');
      }
      if (!sponsorDoc.sponsorId) {
        throw new Error('Customers can only be registered under a Business Associate (BA), not directly under a Business Partner (BP).');
      }
    }
    const customer = await PlotCustomer.findByIdAndUpdate(id, data, { new: true }).populate('sponsorId', 'name sponsorCode mobile email photo signature');
    return customer;
  }

  async deleteCustomer(id) {
    const bookingCount = await PlotBooking.countDocuments({ customerId: id });
    if (bookingCount > 0) {
      throw new Error(`Cannot delete customer. ${bookingCount} plot booking(s) exist for this customer.`);
    }
    let customer = await PlotCustomer.findByIdAndDelete(id);
    if (!customer) {
      customer = await User.findByIdAndDelete(id);
    }
    if (!customer) {
      throw new Error('Customer not found');
    }
    return { message: 'Customer deleted successfully' };
  }

  async searchCustomers(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return [];
    }
    const cleanTerm = searchTerm.trim();
    return PlotCustomer.find({
      $or: [
        { customerId: { $regex: cleanTerm, $options: 'i' } },
        { name: { $regex: cleanTerm, $options: 'i' } },
        { mobile: { $regex: cleanTerm, $options: 'i' } },
        { email: { $regex: cleanTerm, $options: 'i' } },
      ],
    })
      .populate('sponsorId', 'name sponsorCode mobile')
      .limit(20)
      .lean();
  }
}

module.exports = new PlotDeveloperService();
