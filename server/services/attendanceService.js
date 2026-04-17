const Holiday = require('../models/holiday');
const company = require('../models/company');
const BranchModal = require('../models/branch');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Helper to build a rules snapshot from branch/company settings.
 */
async function getRulesSnapshot(companyId, branchId) {
  const companyData = await company.findById(companyId);
  const branch = await BranchModal.findById(branchId);

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
 * Helper to calculate working, overtime, and short minutes based on rules.
 * Also determines status and remarks for holidays/weekly offs.
 */
async function calculateStats(record, companyData, branch) {
  if (!record.punchIn || !record.punchOut) return;

  const workingMinutes = Math.floor((record.punchOut - record.punchIn) / (1000 * 60));
  record.workingMinutes = workingMinutes;

  let snapshot = record.rulesSnapshot;
  if (!snapshot) {
    // Fallback for existing records: fetch current rules
    snapshot = await getRulesSnapshot(companyData._id, branch._id);
    record.rulesSnapshot = snapshot;
  }
  if (!snapshot) return; // Cannot calculate without rules

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
  // 🔹 Overtime Calculation
  // =========================
  if (isHoliday && overtimeRules?.holiday?.treatAllAsOvertime) {
    overtimeMinutes = workingMinutes;
    shortMinutes = 0;
  } else if (isWeeklyOff && overtimeRules?.weeklyOff?.treatAllAsOvertime) {
    overtimeMinutes = workingMinutes;
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
  record.remarks = remarks;

  if (workingMinutes < (wm.halfDay || 0)) {
    record.status = "half day";
  } else {
    record.status = "present";
  }
}

module.exports = {
  getRulesSnapshot,
  calculateStats
};
