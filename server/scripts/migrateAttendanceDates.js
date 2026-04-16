/**
 * ONE-TIME Migration Script
 * ─────────────────────────────────────────────────────────────────────────
 * Problem: Old attendance records stored `date` as "IST midnight as UTC instant"
 *          e.g.  2026-04-10T18:30:00.000Z  → means April 11 IST midnight
 *
 * New format: store as UTC midnight of the IST date string
 *          e.g.  2026-04-11T00:00:00.000Z  → April 11 IST
 *
 * This script finds all records where date minutes/seconds are 30:00:00
 * (signature of the old format) and shifts them +5h30m → UTC midnight.
 *
 * Run once:  node server/scripts/migrateAttendanceDates.js
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const ATTENDANCE_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
const DB_URI = process.env.db;

async function migrate() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const Attendance = require('../models/attandence');

  // Find all records where the date is NOT at UTC midnight (i.e. old 18:30:00Z format)
  // Old format: minutes=30, seconds=0, hours=18 (UTC) → IST midnight of next calendar day
  const oldRecords = await Attendance.find({
    $expr: {
      $ne: [{ $minute: '$date' }, 0]  // old format has 30 minutes
    }
  }).select('_id date');

  // Also catch records that have hours=18 seconds=0 (belt and suspenders)
  const oldRecords2 = await Attendance.find({
    $expr: {
      $and: [
        { $eq: [{ $minute: '$date' }, 0] },
        { $ne: [{ $hour: '$date' }, 0] }   // hours != 0 means not UTC midnight
      ]
    }
  }).select('_id date');

  const allOld = [...oldRecords, ...oldRecords2];

  if (allOld.length === 0) {
    console.log('✅ No old-format records found. Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  console.log(`⚠️  Found ${allOld.length} records with old date format. Migrating...`);

  let updated = 0;
  let skipped = 0;

  for (const rec of allOld) {
    const oldDate = rec.date; // e.g. 2026-04-10T18:30:00Z

    // Get the IST calendar date for this UTC instant
    const istDateKey = dayjs(oldDate).tz(ATTENDANCE_TIMEZONE).format('YYYY-MM-DD');
    // New UTC midnight for that IST date
    const newDate = dayjs.utc(istDateKey).toDate(); // e.g. 2026-04-11T00:00:00Z

    // Check if a record already exists with the new date (to avoid duplicate key)
    const conflict = await Attendance.findOne({
      employeeId: (await Attendance.findById(rec._id).select('employeeId')).employeeId,
      date: newDate,
      _id: { $ne: rec._id }
    });

    if (conflict) {
      console.log(`  ⬛ Skip ${rec._id}: conflict with existing record on ${istDateKey}`);
      skipped++;
      continue;
    }

    await Attendance.updateOne({ _id: rec._id }, { $set: { date: newDate } });
    console.log(`  ✅ ${rec._id}: ${oldDate.toISOString()} → ${newDate.toISOString()} (${istDateKey} IST)`);
    updated++;
  }

  console.log(`\n🎉 Migration complete: ${updated} updated, ${skipped} skipped.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
