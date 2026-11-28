const crypto = require('crypto');
const Holiday = require('../models/holiday');
const company = require('../models/company');
const BranchModal = require('../models/branch');
const AttendanceRuleSnapshot = require('../models/attendanceRuleSnapshot');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// In-memory cache mapping `hash` -> ObjectId to avoid repeated DB lookups
const snapshotIdCache = new Map();
const MAX_SNAPSHOT_CACHE_SIZE = 500;

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function hashRulesSnapshot(rules) {
  return crypto.createHash('sha256').update(stableStringify(rules || {})).digest('hex');
}

/**
 * Helper to build a rules snapshot from branch/company settings.
 */
async function getRulesSnapshot(companyId, branchId) {
  const companyData = companyId ? await company.findById(companyId) : await company.findOne();
  const branch = branchId ? await BranchModal.findById(branchId) : null;

  if (!companyData) return null;

  if (branch && !branch.defaultsetting && branch.setting) {
    return {
      officeTime: branch.setting.officeTime,
      gracePeriod: branch.setting.gracePeriod,
      workingMinutes: branch.setting.workingMinutes,
      attendanceRules: branch.setting.attendanceRules,
      weeklyOffs: branch.setting.weeklyOffs,
      overtimeRules: branch.setting.overtimeRules
    };
  }

  return {
    officeTime: companyData.officeTime,
    gracePeriod: companyData.gracePeriod,
    workingMinutes: companyData.workingMinutes,
    attendanceRules: companyData.attendanceRules,
    weeklyOffs: companyData.weeklyOffs,
    overtimeRules: companyData.overtimeRules
  };
}

/**
 * Deduplicate rules snapshots by content hash and return { snapshotId, rules }.
 */
async function getOrCreateRuleSnapshotId(companyId, branchId, precomputedRules = null) {
  const rules = precomputedRules || await getRulesSnapshot(companyId, branchId);
  if (!rules) return { snapshotId: null, rules: null };

  const plainRules = JSON.parse(JSON.stringify(rules));
  const hash = hashRulesSnapshot(plainRules);

  if (snapshotIdCache.has(hash)) {
    return { snapshotId: snapshotIdCache.get(hash), rules: plainRules };
  }

  const doc = await AttendanceRuleSnapshot.findOneAndUpdate(
    { hash },
    { $setOnInsert: { hash, rules: plainRules } },
    { upsert: true, new: true }
  ).select('_id').lean();

  if (snapshotIdCache.size >= MAX_SNAPSHOT_CACHE_SIZE) {
    const firstKey = snapshotIdCache.keys().next().value;
    snapshotIdCache.delete(firstKey);
  }
  snapshotIdCache.set(hash, doc._id);

  return { snapshotId: doc._id, rules: plainRules };
}

/**
 * Resolve rules for an attendance record:
 * 1) Legacy embedded `record.rulesSnapshot` (if present and non-empty)
 * 2) Referenced `record.rulesSnapshotId` (populated or fetched)
 * 3) Live company/branch fallback
 */
async function resolveRecordRules(record, companyId, branchId) {
  if (record?.rulesSnapshot && record.rulesSnapshot.workingMinutes) {
    return record.rulesSnapshot;
  }
  if (record?.rulesSnapshotId) {
    if (record.rulesSnapshotId.rules) {
      return record.rulesSnapshotId.rules;
    }
    const snapDoc = await AttendanceRuleSnapshot.findById(record.rulesSnapshotId).select('rules').lean();
    if (snapDoc?.rules) return snapDoc.rules;
  }
  return getRulesSnapshot(companyId, branchId);
}

/**
 * Helper to calculate working, overtime, and short minutes based on rules.
 * Also determines status and remarks for holidays/weekly offs.
 */
async function calculateStats(record, companyData, branch) {
  if (!record.punchIn || !record.punchOut) return;

  const workingMinutes = Math.floor((record.punchOut - record.punchIn) / (1000 * 60));
  record.workingMinutes = workingMinutes;

  let snapshot = await resolveRecordRules(record, companyData._id, branch?._id || record.branchId);
  if (!snapshot) return; // Cannot calculate without rules

  if (!record.rulesSnapshotId && (!record.rulesSnapshot || !record.rulesSnapshot.workingMinutes)) {
    const { snapshotId } = await getOrCreateRuleSnapshotId(companyData._id, branch?._id || record.branchId, snapshot);
    if (snapshotId) record.rulesSnapshotId = snapshotId;
  }

  const wm = snapshot.workingMinutes;
  const overtimeRules = snapshot.overtimeRules || {};

  const day = new Date(record.date).getUTCDay();

  let isWeeklyOff = false;
  if (branch.defaultsetting) {
    isWeeklyOff = (companyData.weeklyOffs || []).includes(day);
  } else {
    isWeeklyOff = (branch.setting?.weeklyOffs || []).includes(day);
  }
  const dateStr = dayjs(record.date).format('YYYY-MM-DD');

  const isHolidayRecord = await Holiday.findOne({
    companyId: companyData._id,
    fromDate: { $lte: dateStr },
    toDate: { $gte: dateStr }
  });

  const isHoliday = !!isHolidayRecord;

  let overtimeMinutes = 0;
  let shortMinutes = 0;
  let weeklyOffMinutes = 0;
  let remarks = record.remarks || "";

  // =========================
  // 🔹 Day Type
  // =========================
  const dayType = isHoliday ? "holiday" : (isWeeklyOff ? "weekoff" : "normal");
  record.dayType = dayType;

  // =========================
  // 🔹 Holiday / Weekly Off Remarks
  // =========================
  if (isHoliday && workingMinutes > 0) {
    remarks = "worked on holiday";
  } else if (isWeeklyOff && workingMinutes > 0) {
    remarks = "worked on weekly off";
  }

  // =========================
  // 🔹 Overtime & Weekly Off Calculation
  // =========================
  if (isHoliday && overtimeRules?.holiday?.treatAllAsOvertime) {
    overtimeMinutes = workingMinutes;
    shortMinutes = 0;
  } else if (isWeeklyOff) {
    weeklyOffMinutes = workingMinutes;
    overtimeMinutes = 0;
    shortMinutes = 0;
  } else {
    if (workingMinutes > (wm.overtimeAfterMinutes || 0)) {
      // allowFullOvertime: count OT from fullDay baseline instead of the threshold
      const otBase = wm.allowFullOvertime ? (wm.fullDay || 0) : (wm.overtimeAfterMinutes || 0);
      overtimeMinutes = workingMinutes - otBase;
      if (overtimeMinutes < 0) overtimeMinutes = 0;
    }
    if (workingMinutes < (wm.shortDayThreshold || 0)) {
      // allowFullShort: count shortage from fullDay instead of shortDayThreshold
      const shortBase = wm.allowFullShort ? (wm.fullDay || 0) : (wm.shortDayThreshold || 0);
      shortMinutes = shortBase - workingMinutes;
      if (shortMinutes < 0) shortMinutes = 0;
    }

    // Only clear holiday/weekly off remarks if not applicable (meaning not holiday/weekly off)
    if (!isHoliday && !isWeeklyOff) {
      if (remarks === "worked on holiday" || remarks === "worked on weekly off") {
        remarks = "";
      }
    }
  }

  // =========================
  // 🔹 Punch In Status
  // =========================
  if (record.punchIn && !record.punchInStatus) {
    const parseTime = (t) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const earlyBefore = parseTime(snapshot.attendanceRules?.considerEarlyEntryBefore);
    const lateAfter = parseTime(snapshot.attendanceRules?.considerLateEntryAfter);

    // Helper for minutes from start of day in IST/Attendance Timezone
    const getMinutes = (date) => {
      const d = dayjs(date).tz(process.env.ATTENDANCE_TIMEZONE || "Asia/Kolkata");
      return d.hour() * 60 + d.minute();
    };

    const min = getMinutes(record.punchIn);
    if (earlyBefore !== null && min < earlyBefore) record.punchInStatus = "early";
    else if (lateAfter !== null && min > lateAfter) record.punchInStatus = "late";
    else record.punchInStatus = "onTime";
  }

  // =========================
  // 🔹 Punch Out Status
  // =========================
  if (record.punchOut && !record.punchOutStatus) {
    const parseTime = (t) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const earlyExitBefore = parseTime(snapshot.attendanceRules?.considerEarlyExitBefore);
    const lateExitAfter = parseTime(snapshot.attendanceRules?.considerLateExitAfter);

    const getMinutes = (date) => {
      const d = dayjs(date).tz(process.env.ATTENDANCE_TIMEZONE || "Asia/Kolkata");
      return d.hour() * 60 + d.minute();
    };

    const min = getMinutes(record.punchOut);
    if (earlyExitBefore !== null && min < earlyExitBefore) record.punchOutStatus = "early";
    else if (lateExitAfter !== null && min > lateExitAfter) record.punchOutStatus = "late";
    else record.punchOutStatus = "onTime";
  }

  record.overtimeMinutes = parseFloat(overtimeMinutes.toFixed(2));
  record.shortMinutes = parseFloat(shortMinutes.toFixed(2));
  record.weeklyOffMinutes = parseFloat(weeklyOffMinutes.toFixed(2));
  record.remarks = remarks;

  if (workingMinutes < (wm.halfDay || 0)) {
    record.status = "half day";
  } else {
    record.status = "present";
  }

  // Real-time Weekly Off Ledger sync (per-day entry)
  if (record.dayType === "weekoff" || record.weeklyOffMinutes > 0) {
    try {
      const { syncAttendanceDayWeeklyOff } = require("./weeklyOffService");
      syncAttendanceDayWeeklyOff(record).catch(console.error);
    } catch (e) {
      console.error("Weekly off ledger realtime sync error:", e);
    }
  }
}

module.exports = {
  getRulesSnapshot,
  getOrCreateRuleSnapshotId,
  resolveRecordRules,
  calculateStats
};
