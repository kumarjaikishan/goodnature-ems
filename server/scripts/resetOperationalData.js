/**
 * ============================================================================
 * Good Nature EMS — Operational Transactional Data Reset Script
 * ============================================================================
 * Resets:
 * 1. Plot Bookings (PlotBooking, Revisions, Installments, Payments, Closings,
 *    Schedules, Payout Vouchers, Commissions).
 * 2. Plots status reset to 'AVAILABLE'.
 * 3. Investment Bookings & Collections (PlotProductBooking, InvestmentAccount,
 *    InvestmentInstallment, InvestmentReceipt, InvestmentCommission).
 * 4. Collections & Receipts (PlotReceipt - Downpayments, EMIs, Collections).
 * 5. Vouchers & Fund Transfers (Voucher, FundTransfer).
 * 6. Transaction Counters (Booking numbers, Receipt numbers, Voucher numbers).
 * 7. Land Stock Allocations on KisanLandAgreement & LandStockLedger.
 * 8. Ledgers & Entries:
 *    - Removes all Entry records except 'kisan_agreement' initial entries.
 *    - Removes all KisanLedger payment / debit records.
 *    - Resets all bank, cash, user, branch, sponsor, custom ledgers to 0.
 *    - Retains Kisan / Seller initial agreement values.
 * ============================================================================
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Load Models
const PlotBooking = require('../models/PlotBooking');
const PlotBookingRevision = require('../models/PlotBookingRevision');
const PlotInstallment = require('../models/PlotInstallment');
const PlotPayment = require('../models/PlotPayment');
const PlotClosing = require('../models/PlotClosing');
const PlotPayoutSchedule = require('../models/PlotPayoutSchedule');
const PlotPayoutVoucher = require('../models/PlotPayoutVoucher');
const PlotSponsorCommission = require('../models/PlotSponsorCommission');
const Plot = require('../models/Plot');

const PlotProductBooking = require('../models/PlotProductBooking');
const InvestmentAccount = require('../models/InvestmentAccount');
const InvestmentInstallment = require('../models/InvestmentInstallment');
const InvestmentReceipt = require('../models/InvestmentReceipt');
const InvestmentCommission = require('../models/InvestmentCommission');

const PlotReceipt = require('../models/PlotReceipt');
const Voucher = require('../models/voucher');
const FundTransfer = require('../models/FundTransfer');
const Counter = require('../models/Counter');

const KisanLandAgreement = require('../models/KisanLandAgreement');
const LandStockLedger = require('../models/LandStockLedger');
const KisanLedger = require('../models/KisanLedger');
const Ledger = require('../models/ledger');
const Entry = require('../models/entry');
const AuditLog = require('../models/AuditLog');

async function runReset() {
  const uri = process.env.db || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emscopy';
  console.log('\n======================================================');
  console.log('   GOOD NATURE EMS — OPERATIONAL DATA RESET SCRIPT    ');
  console.log('======================================================');
  console.log(`[1/8] Connecting to MongoDB...`);
  await mongoose.connect(uri);
  console.log('      Connected successfully.\n');

  const stats = {};

  try {
    // ------------------------------------------------------------------------
    // 1. PLOT BOOKINGS & ASSOCIATED DATA
    // ------------------------------------------------------------------------
    console.log('[2/8] Resetting Plot Bookings & Commissions...');
    stats.plotBookings = (await PlotBooking.deleteMany({})).deletedCount;
    stats.plotBookingRevisions = (await PlotBookingRevision.deleteMany({})).deletedCount;
    stats.plotInstallments = (await PlotInstallment.deleteMany({})).deletedCount;
    stats.plotPayments = (await PlotPayment.deleteMany({})).deletedCount;
    stats.plotClosings = (await PlotClosing.deleteMany({})).deletedCount;
    stats.plotPayoutSchedules = (await PlotPayoutSchedule.deleteMany({})).deletedCount;
    stats.plotPayoutVouchers = (await PlotPayoutVoucher.deleteMany({})).deletedCount;
    stats.plotSponsorCommissions = (await PlotSponsorCommission.deleteMany({})).deletedCount;

    // Reset all plots back to AVAILABLE
    const plotUpdateResult = await Plot.updateMany(
      {},
      { $set: { status: 'AVAILABLE' } }
    );
    stats.plotsReset = plotUpdateResult.modifiedCount;
    console.log(`      ✓ Removed ${stats.plotBookings} Plot Bookings`);
    console.log(`      ✓ Removed ${stats.plotInstallments} Plot Installments & ${stats.plotPayments} Payments`);
    console.log(`      ✓ Removed ${stats.plotSponsorCommissions} Sponsor Commissions`);
    console.log(`      ✓ Reset ${stats.plotsReset} Plots to AVAILABLE status.`);

    // ------------------------------------------------------------------------
    // 2. INVESTMENT BOOKINGS & PRODUCT COLLECTIONS
    // ------------------------------------------------------------------------
    console.log('\n[3/8] Resetting Investment Bookings & Accounts...');
    stats.plotProductBookings = (await PlotProductBooking.deleteMany({})).deletedCount;
    stats.investmentAccounts = (await InvestmentAccount.deleteMany({})).deletedCount;
    stats.investmentInstallments = (await InvestmentInstallment.deleteMany({})).deletedCount;
    stats.investmentReceipts = (await InvestmentReceipt.deleteMany({})).deletedCount;
    stats.investmentCommissions = (await InvestmentCommission.deleteMany({})).deletedCount;
    console.log(`      ✓ Removed ${stats.plotProductBookings} Investment Bookings`);
    console.log(`      ✓ Removed ${stats.investmentAccounts} Investment Accounts`);
    console.log(`      ✓ Removed ${stats.investmentInstallments} Investment Installments`);

    // ------------------------------------------------------------------------
    // 3. COLLECTIONS & RECEIPTS (DOWNPAYMENT, EMI & PRODUCT COLLECTIONS)
    // ------------------------------------------------------------------------
    console.log('\n[4/8] Resetting Collections & Receipts (Downpayment, EMI, Products)...');
    stats.plotReceipts = (await PlotReceipt.deleteMany({})).deletedCount;
    console.log(`      ✓ Removed ${stats.plotReceipts} Receipts (Downpayment / EMI / Product Collections)`);

    // ------------------------------------------------------------------------
    // 4. VOUCHERS & FUND TRANSFERS
    // ------------------------------------------------------------------------
    console.log('\n[5/8] Resetting Vouchers & Fund Transfers...');
    stats.vouchers = (await Voucher.deleteMany({})).deletedCount;
    stats.fundTransfers = (await FundTransfer.deleteMany({})).deletedCount;
    console.log(`      ✓ Removed ${stats.vouchers} Vouchers`);
    console.log(`      ✓ Removed ${stats.fundTransfers} Fund Transfers`);

    // ------------------------------------------------------------------------
    // 5. LAND STOCK ALLOCATIONS & AGREEMENTS STOCK RESTORATION
    // ------------------------------------------------------------------------
    console.log('\n[6/8] Restoring Land Stock Allocations on Kisan Agreements...');
    stats.landStockLedgers = (await LandStockLedger.deleteMany({
      $or: [
        { bookingId: { $ne: null } },
        { transactionType: { $in: ['BOOKING_ALLOCATION', 'BOOKING_DEALLOCATION'] } }
      ]
    })).deletedCount;

    // Reset allocated land sqft back to 0 and available back to total agreed
    const agreements = await KisanLandAgreement.find({});
    let agreementsRestored = 0;
    for (const ag of agreements) {
      ag.unregisteredAllocatedSqFt = 0;
      ag.totalAllocatedSqFt = 0;
      ag.unregisteredAvailableSqFt = ag.unregisteredAgreedSqFt || ag.totalSqFt || 0;
      ag.totalAvailableSqFt = ag.totalSqFt || 0;
      await ag.save();
      agreementsRestored++;
    }
    stats.agreementsRestored = agreementsRestored;
    console.log(`      ✓ Removed ${stats.landStockLedgers} Booking Land Stock allocation entries`);
    console.log(`      ✓ Restored available land pool on ${agreementsRestored} Kisan Land Agreements`);

    // ------------------------------------------------------------------------
    // 6. LEDGERS & FINANCIAL ENTRIES RESET (PRESERVE INITIAL KISAN AGREEMENT VALUES)
    // ------------------------------------------------------------------------
    console.log('\n[7/8] Resetting Ledgers to ₹0 (Preserving Kisan Initial Agreement Values)...');

    // 6a. Remove all entry records except initial 'kisan_agreement' entries
    const deletedEntries = await Entry.deleteMany({
      source: { $ne: 'kisan_agreement' }
    });
    stats.deletedEntries = deletedEntries.deletedCount;

    // 6b. Retain only initial agreement credit in KisanLedger, delete any payment debit records
    const deletedKisanPayments = await KisanLedger.deleteMany({
      $or: [
        { type: 'DEBIT' },
        { paymentMode: { $ne: 'AGREEMENT_VALUE' } }
      ]
    });
    stats.deletedKisanPayments = deletedKisanPayments.deletedCount;

    // Ensure runningBalance matches amount on initial kisan entries
    await KisanLedger.updateMany(
      { paymentMode: 'AGREEMENT_VALUE' },
      [{ $set: { runningBalance: '$amount' } }]
    );

    // 6c. Reset all non-kisan ledgers (Cash, Bank, Sponsor, Branch, Expense/Custom) to 0 balance
    const nonKisanReset = await Ledger.updateMany(
      { ledgerType: { $ne: 'kisan' } },
      { $set: { advance: 0, openingBalance: 0 } }
    );
    stats.nonKisanLedgersReset = nonKisanReset.modifiedCount;

    // 6d. Recalculate each Kisan / Seller Ledger advance strictly from remaining kisan_agreement entries
    const kisanLedgers = await Ledger.find({ ledgerType: 'kisan' });
    let kisanLedgersUpdated = 0;
    for (const kl of kisanLedgers) {
      const kisanEntries = await Entry.find({
        ledgerId: kl._id,
        source: 'kisan_agreement'
      });
      const initialAgreementVal = kisanEntries.reduce((sum, e) => sum + (Number(e.credit) || 0) - (Number(e.debit) || 0), 0);
      kl.advance = initialAgreementVal;
      kl.openingBalance = 0;
      await kl.save();
      kisanLedgersUpdated++;
      console.log(`         • Retained Kisan Ledger "${kl.name}": ₹${initialAgreementVal.toLocaleString('en-IN')}`);
    }
    stats.kisanLedgersRetained = kisanLedgersUpdated;
    console.log(`      ✓ Cleared ${stats.deletedEntries} operational transaction entries`);
    console.log(`      ✓ Reset ${stats.nonKisanLedgersReset} Bank, Cash, Promoter & Expense Ledgers to ₹0`);
    console.log(`      ✓ Preserved initial agreement values on ${kisanLedgersUpdated} Kisan Ledgers.`);

    // ------------------------------------------------------------------------
    // 7. RESET NUMBERING COUNTERS (BOOKINGS, RECEIPTS, VOUCHERS, TRANSFERS)
    // ------------------------------------------------------------------------
    console.log('\n[8/8] Resetting Operational Numbering Counters...');
    const counterPattern = /^(BOOKING_FY|RO-REC-PLT|REC-PLT|VOUCHER_FY|TRF|PLOT_PRD_BOOKING|PLOT_PRD_RECEIPT)/;
    stats.countersReset = (await Counter.deleteMany({ _id: { $regex: counterPattern } })).deletedCount;
    console.log(`      ✓ Reset ${stats.countersReset} Sequence Counters (Bookings, Receipts, Vouchers) to #1.`);

    // Log Audit Trail
    try {
      await AuditLog.create({
        action: 'RESET_OPERATIONAL_DATA',
        module: 'system',
        details: 'Admin reset: plot bookings, investment bookings, receipts, vouchers, and ledgers reset to 0 (kisan agreements preserved).',
        ipAddress: '127.0.0.1'
      });
    } catch (_) {}

    console.log('\n======================================================');
    console.log('            OPERATIONAL RESET COMPLETED!              ');
    console.log('======================================================');
    console.table(stats);

  } catch (error) {
    console.error('\n❌ Error during operational data reset:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Execute if run directly
if (require.main === module) {
  runReset();
}

module.exports = runReset;

