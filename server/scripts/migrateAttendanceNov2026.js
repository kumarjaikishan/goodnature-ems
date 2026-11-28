/**
 * Migration Script: Recalculate Attendance Records from 2026-11-01 to Today
 *
 * Updates dutyStart, dutyEnd, rulesSnapshot, punchInStatus, punchOutStatus,
 * workingMinutes, overtimeMinutes, shortMinutes, weeklyOffMinutes, dayType,
 * and status using the current Company / Branch attendance rules.
 *
 * Usage:
 *   Preview (dry run, no DB writes):
 *     node scripts/migrateAttendanceNov2026.js
 *
 *   Apply changes to DB:
 *     node scripts/migrateAttendanceNov2026.js --apply
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const Attendance = require('../models/attandence');
const Company = require('../models/company');
const Holiday = require('../models/holiday');
const { getRulesSnapshot } = require('../services/attendanceService');
const {
  getAttendanceDateUTC,
  getMinutesInAttendanceTimezone,
} = require('../utils/attendanceTime');

const APPLY = process.argv.includes('--apply');
const START_DATE_STR = '2026-11-01';

const parseTime = (str) => {
  if (!str || !String(str).includes(':')) return 0;
  const [h, m] = String(str).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

async function run() {
  const connStr = process.env.db || process.env.MONGO_URI || 'mongodb://localhost:27017/ems';
  console.log(`Mode: ${APPLY ? 'APPLY (writing to DB)' : 'DRY RUN (preview only, pass --apply to save)'}`);
  console.log('Connecting to MongoDB...');
  await mongoose.connect(connStr);
  console.log('Connected.');

  const startDate = new Date(`${START_DATE_STR}T00:00:00.000Z`);
  const endDate = getAttendanceDateUTC(new Date());

  console.log(`Date range: ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`);

  const companies = await Company.find({}).select('_id name');
  const snapshotCache = new Map();
  const holidayCache = new Map();

  const getCachedSnapshot = async (companyId, branchId) => {
    const key = `${companyId || 'none'}_${branchId || 'none'}`;
    if (!snapshotCache.has(key)) {
      snapshotCache.set(key, await getRulesSnapshot(companyId, branchId || null));
    }
    return snapshotCache.get(key);
  };

  const isHolidayDate = async (companyId, dateStr) => {
    const key = `${companyId}_${dateStr}`;
    if (!holidayCache.has(key)) {
      const hol = await Holiday.findOne({
        companyId,
        fromDate: { $lte: dateStr },
        toDate: { $gte: dateStr },
      }).lean();
      holidayCache.set(key, Boolean(hol));
    }
    return holidayCache.get(key);
  };

  const records = await Attendance.find({
    date: { $gte: startDate, $lte: endDate },
  });

  console.log(`Found ${records.length} attendance record(s) in range.`);

  let updatedCount = 0;
  let skippedCount = 0;
  const samples = [];

  for (const record of records) {
    const companyId = record.companyId ? String(record.companyId) : String(companies[0]?._id || '');
    const branchId = record.branchId ? String(record.branchId) : null;
    if (!companyId) {
      skippedCount++;
      continue;
    }

    const snapshot = await getCachedSnapshot(companyId, branchId);
    if (!snapshot) {
      skippedCount++;
      continue;
    }

    const before = {
      date: record.date?.toISOString().slice(0, 10),
      dutyEnd: record.dutyEnd,
      punchOutStatus: record.punchOutStatus,
      shortMinutes: record.shortMinutes,
      overtimeMinutes: record.overtimeMinutes,
      status: record.status,
    };

    record.rulesSnapshot = snapshot;
    record.dutyStart = snapshot?.officeTime?.in || '10:00';
    record.dutyEnd = snapshot?.officeTime?.out || '17:30';

    if (record.punchIn) {
      const earlyBefore = parseTime(snapshot?.attendanceRules?.considerEarlyEntryBefore || '09:50');
      const lateAfter = parseTime(snapshot?.attendanceRules?.considerLateEntryAfter || '10:10');
      const min = getMinutesInAttendanceTimezone(record.punchIn);
      if (min !== null) {
        if (min < earlyBefore) record.punchInStatus = 'early';
        else if (min > lateAfter) record.punchInStatus = 'late';
        else record.punchInStatus = 'onTime';
      }
    }

    if (record.punchOut) {
      const earlyExitBefore = parseTime(snapshot?.attendanceRules?.considerEarlyExitBefore || '17:20');
      const lateExitAfter = parseTime(snapshot?.attendanceRules?.considerLateExitAfter || '17:45');
      const min = getMinutesInAttendanceTimezone(record.punchOut);
      if (min !== null) {
        if (min < earlyExitBefore) record.punchOutStatus = 'early';
        else if (min > lateExitAfter) record.punchOutStatus = 'late';
        else record.punchOutStatus = 'onTime';
      }
    }

    if (record.punchIn && record.punchOut && record.punchOut > record.punchIn) {
      const workingMinutes = Math.floor((record.punchOut - record.punchIn) / (1000 * 60));
      record.workingMinutes = workingMinutes;

      const wm = snapshot.workingMinutes || {};
      const fullDay = Number(wm.fullDay) || 450;
      const halfDay = Number(wm.halfDay) || 225;
      const shortThreshold = Number(wm.shortDayThreshold) || 338;
      const otAfter = Number(wm.overtimeAfterMinutes) || (fullDay + 10);

      const dateStr = dayjs(record.date).format('YYYY-MM-DD');
      const isHoliday = await isHolidayDate(companyId, dateStr);
      const day = new Date(record.date).getUTCDay();
      const weeklyOffs = snapshot.weeklyOffs || [];
      const isWeeklyOff = weeklyOffs.includes(day);
      const overtimeRules = snapshot.overtimeRules || {};

      let overtimeMinutes = 0;
      let shortMinutes = 0;
      let weeklyOffMinutes = 0;

      if (isHoliday && overtimeRules?.holiday?.treatAllAsOvertime) {
        overtimeMinutes = workingMinutes;
        shortMinutes = 0;
      } else if (isWeeklyOff) {
        weeklyOffMinutes = workingMinutes;
        overtimeMinutes = 0;
        shortMinutes = 0;
      } else {
        if (workingMinutes > otAfter) {
          const otBase = wm.allowFullOvertime ? fullDay : otAfter;
          overtimeMinutes = Math.max(0, workingMinutes - otBase);
        }
        if (workingMinutes < shortThreshold) {
          const shortBase = wm.allowFullShort ? fullDay : shortThreshold;
          shortMinutes = Math.max(0, shortBase - workingMinutes);
        }
      }

      record.overtimeMinutes = parseFloat(overtimeMinutes.toFixed(2));
      record.shortMinutes = parseFloat(shortMinutes.toFixed(2));
      record.weeklyOffMinutes = parseFloat(weeklyOffMinutes.toFixed(2));
      record.dayType = isHoliday ? 'holiday' : (isWeeklyOff ? 'weekoff' : 'normal');

      // Only auto-set present/half day if not explicitly marked leave
      if (record.status !== 'leave') {
        record.status = workingMinutes < halfDay ? 'half day' : 'present';
      }
    }

    if (samples.length < 5 && (before.shortMinutes !== record.shortMinutes || before.punchOutStatus !== record.punchOutStatus || before.dutyEnd !== record.dutyEnd)) {
      samples.push({
        before,
        after: {
          date: before.date,
          dutyEnd: record.dutyEnd,
          punchOutStatus: record.punchOutStatus,
          shortMinutes: record.shortMinutes,
          overtimeMinutes: record.overtimeMinutes,
          status: record.status,
        },
      });
    }

    if (APPLY) {
      await record.save();
    }
    updatedCount++;
  }

  console.log(`Summary: ${updatedCount} record(s) ${APPLY ? 'updated' : 'would be updated'}, ${skippedCount} skipped.`);
  if (samples.length > 0) {
    console.log('Sample changes:', JSON.stringify(samples, null, 2));
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
