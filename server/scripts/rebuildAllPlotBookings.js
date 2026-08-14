/**
 * ONE-TIME Backfill Script
 * ─────────────────────────────────────────────────────────────────────────
 * Problem: updateBooking() could delete and recreate a booking's
 *          installment schedule (when scheme/discount/bookingDate/
 *          installment count etc. changed) WITHOUT replaying existing
 *          receipts back onto the new installments. Any booking that was
 *          edited that way could be left showing installments as unpaid
 *          even though receipts existed - until something else happened
 *          to trigger a full rebuild.
 *
 * Fix: updateBooking() now calls rebuildBookingInstallmentsState() itself
 *      whenever it recreates installments, so this can't happen going
 *      forward. Some read paths (the bookings list, the installments list
 *      used by the collection screen) also used to silently recompute/
 *      rebuild on every single view as a safety net - that net has been
 *      narrowed for performance, since every write path now maintains
 *      correct state on its own.
 *
 * This script is a one-time safety pass: it rebuilds every booking's
 * installment/commission state from its receipt history, so any booking
 * that was already left stale by the old bug (before this fix was
 * deployed) gets corrected once, up front, rather than relying on it
 * being opened individually later.
 *
 * Safe to run multiple times - rebuildBookingInstallmentsState() is
 * idempotent (it always recomputes from the receipt history, it doesn't
 * accumulate).
 *
 * Run once:  node server/scripts/rebuildAllPlotBookings.js
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const DB_URI = process.env.db;

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const PlotBooking = require('../models/PlotBooking');
  const plotsService = require('../services/plots.service');

  const bookings = await PlotBooking.find({ status: { $ne: 'HOLD' } }).select('_id bookingNumber').lean();
  console.log(`Found ${bookings.length} bookings to check.`);

  let ok = 0;
  let failed = 0;

  for (const b of bookings) {
    try {
      await plotsService.rebuildBookingInstallmentsState(b._id);
      ok++;
      if (ok % 50 === 0) console.log(`  ...${ok}/${bookings.length}`);
    } catch (err) {
      failed++;
      console.error(`❌ Failed for booking ${b.bookingNumber} (${b._id}):`, err.message);
    }
  }

  console.log(`\nDone. ${ok} rebuilt successfully, ${failed} failed.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
