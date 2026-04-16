const Attendance = require('../models/attandence');
const Employee = require('../models/employee');
const Company = require('../models/company');
const Branch = require('../models/branch');
const Holiday = require('../models/holiday');
const { sendToClients } = require('../utils/sse');
const {
  parseAttendanceDateTime,
  getAttendanceDateUTC,
  getAttendanceDateKey,
  getMinutesInAttendanceTimezone
} = require('../utils/attendanceTime');

let schedulerInterval = null;
let isRunning = false;
const processedRunKeys = new Set();

function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string') return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h * 60) + m;
}

function buildEffectiveSnapshot(companyDoc, branchDoc) {
  if (branchDoc && !branchDoc.defaultsetting && branchDoc.setting) {
    return {
      officeTime: branchDoc.setting.officeTime || {},
      gracePeriod: branchDoc.setting.gracePeriod || {},
      workingMinutes: branchDoc.setting.workingMinutes || {},
      attendanceRules: branchDoc.setting.attendanceRules || {},
      weeklyOffs: branchDoc.setting.weeklyOffs || [],
      overtimeRules: branchDoc.setting.overtimeRules || {}
    };
  }

  return {
    officeTime: companyDoc.officeTime || {},
    gracePeriod: companyDoc.gracePeriod || {},
    workingMinutes: companyDoc.workingMinutes || {},
    attendanceRules: companyDoc.attendanceRules || {},
    weeklyOffs: companyDoc.weeklyOffs || [],
    overtimeRules: companyDoc.overtimeRules || {}
  };
}

async function processBranchAutoAttendance(companyDoc, branchDoc, now) {
  const snapshot = buildEffectiveSnapshot(companyDoc, branchDoc);
  const missingPunchInRule = snapshot.attendanceRules?.missingPunchIn || {};

  if (!missingPunchInRule.enabled) return 0;

  const checkTime = missingPunchInRule.checkTime || snapshot.officeTime?.in || '11:00';
  const checkMinute = parseTimeToMinutes(checkTime);
  if (checkMinute === null) return 0;

  const nowMinute = getMinutesInAttendanceTimezone(now);
  // Run within a 2-minute window in case scheduler ticks slightly late.
  if (nowMinute < checkMinute || nowMinute > checkMinute + 1) return 0;

  const attendanceDateUTC = getAttendanceDateUTC(now);
  const attendanceDateKey = getAttendanceDateKey(now);
  const runKey = `${companyDoc._id}:${branchDoc._id}:${attendanceDateKey}:${checkMinute}`;
  if (processedRunKeys.has(runKey)) return 0;
  processedRunKeys.add(runKey);

  const weekday = new Date(attendanceDateUTC).getUTCDay();
  const isWeeklyOff = (snapshot.weeklyOffs || []).includes(weekday);
  if (isWeeklyOff) return 0;

  const isHoliday = await Holiday.findOne({
    companyId: companyDoc._id,
    fromDate: { $lte: attendanceDateKey },
    toDate: { $gte: attendanceDateKey }
  }).lean();
  if (isHoliday) return 0;

  const employees = await Employee.find({
    companyId: companyDoc._id,
    branchId: branchDoc._id,
    status: true,
    deviceUserId: { $nin: ['', null] }
  }).select('_id empId').lean();

  if (!employees.length) return 0;

  const employeeIds = employees.map((e) => e._id);
  const existingRecords = await Attendance.find({
    companyId: companyDoc._id,
    branchId: branchDoc._id,
    date: attendanceDateUTC,
    employeeId: { $in: employeeIds }
  }).select('employeeId').lean();

  const existingEmployeeSet = new Set(existingRecords.map((r) => String(r.employeeId)));
  const action = missingPunchInRule.action === 'autoPunchIn' ? 'autoPunchIn' : 'markAbsent';
  const docsToInsert = [];

  for (const emp of employees) {
    if (existingEmployeeSet.has(String(emp._id))) continue;

    if (action === 'markAbsent') {
      docsToInsert.push({
        companyId: companyDoc._id,
        branchId: branchDoc._id,
        empId: emp.empId,
        employeeId: emp._id,
        date: attendanceDateUTC,
        status: 'absent',
        source: 'device',
        dutyStart: snapshot.officeTime?.in,
        dutyEnd: snapshot.officeTime?.out,
        rulesSnapshot: snapshot,
        workingMinutes: 0,
        overtimeMinutes: 0,
        shortMinutes: 0,
        remarks: 'auto marked absent (no ESSL punch-in before cutoff)'
      });
      continue;
    }

    const configuredPunchInTime = missingPunchInRule.autoPunchInTime || checkTime;
    const punchInDate = parseAttendanceDateTime(`${attendanceDateKey} ${configuredPunchInTime}:00`);
    if (!punchInDate) continue;

    const earlyBefore = parseTimeToMinutes(snapshot.attendanceRules?.considerEarlyEntryBefore);
    const lateAfter = parseTimeToMinutes(snapshot.attendanceRules?.considerLateEntryAfter);
    const punchInMin = getMinutesInAttendanceTimezone(punchInDate);

    let punchInStatus = 'onTime';
    if (earlyBefore !== null && punchInMin < earlyBefore) punchInStatus = 'early';
    else if (lateAfter !== null && punchInMin > lateAfter) punchInStatus = 'late';

    docsToInsert.push({
      companyId: companyDoc._id,
      branchId: branchDoc._id,
      empId: emp.empId,
      employeeId: emp._id,
      date: attendanceDateUTC,
      punchIn: punchInDate,
      punchInStatus,
      status: 'present',
      source: 'device',
      dutyStart: snapshot.officeTime?.in,
      dutyEnd: snapshot.officeTime?.out,
      rulesSnapshot: snapshot,
      workingMinutes: 0,
      overtimeMinutes: 0,
      shortMinutes: 0,
      remarks: 'auto punch-in created by ESSL cutoff rule'
    });
  }

  if (!docsToInsert.length) return 0;

  try {
    await Attendance.insertMany(docsToInsert, { ordered: false });
  } catch (error) {
    // Ignore duplicates caused by races with live ESSL punches.
    if (error?.code !== 11000) throw error;
  }

  sendToClients(
    {
      type: 'attendance_update',
      payload: {
        action: 'bulk_update',
        message: `Auto attendance processed for ${docsToInsert.length} employee(s) in branch ${branchDoc.name || ''}.`
      }
    },
    String(companyDoc._id),
    String(branchDoc._id)
  );

  return docsToInsert.length;
}

async function runEsslAutoAttendanceSweep() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const companies = await Company.find({})
      .select('_id officeTime gracePeriod workingMinutes weeklyOffs attendanceRules overtimeRules')
      .lean();

    if (!companies.length) return;

    const branches = await Branch.find({})
      .select('_id name companyId defaultsetting setting')
      .lean();

    const branchByCompany = new Map();
    for (const br of branches) {
      const key = String(br.companyId);
      if (!branchByCompany.has(key)) branchByCompany.set(key, []);
      branchByCompany.get(key).push(br);
    }

    for (const companyDoc of companies) {
      const companyBranches = branchByCompany.get(String(companyDoc._id)) || [];
      for (const branchDoc of companyBranches) {
        await processBranchAutoAttendance(companyDoc, branchDoc, now);
      }
    }

    // Keep memory set small: retain only today's run keys.
    const todayPrefix = `${getAttendanceDateKey(now)}`;
    for (const key of processedRunKeys) {
      if (!key.includes(`:${todayPrefix}:`)) processedRunKeys.delete(key);
    }
  } catch (error) {
    console.error('ESSL auto attendance sweep error:', error);
  } finally {
    isRunning = false;
  }
}

function startEsslAutoAttendanceScheduler() {
  if (schedulerInterval) return;
  schedulerInterval = setInterval(runEsslAutoAttendanceSweep, 60 * 1000);
  runEsslAutoAttendanceSweep();
}

module.exports = {
  startEsslAutoAttendanceScheduler,
  runEsslAutoAttendanceSweep
};
