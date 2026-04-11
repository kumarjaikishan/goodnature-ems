// server/routes/attendance.js
const Attendance = require('../models/attandence');
const employee = require('../models/employee');
const Leave = require('../models/leave');
const LeavePolicy = require('../models/leavePolicy');
const User = require('../models/user');
const mongoose = require("mongoose");
const Holiday = require('../models/holiday');
const { sendToClients } = require('../utils/sse');
const { sendTelegramMessage, sendTelegramMessageseperate } = require('../utils/telegram');
const dayjs = require('dayjs');
const BranchModal = require('../models/branch');
const company = require('../models/company');

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

const webattandence = async (req, res, next) => {
  try {
    let { employeeId, departmentId, date, punchIn, punchOut, status } = req.body;

    // Validate required fields
    if (!employeeId || !departmentId || !date) {
      return res.status(400).json({ message: 'Missing required fields: employeeId, departmentId, or date' });
    }

    // Convert input to Date objects
    const dateObj = new Date(date);
    if (isNaN(dateObj)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const dateOnly = dateObj.toDateString(); // Used to match one date per day

    let attendance = await Attendance.findOne({ employeeId, date: dateOnly });

    // === PUNCH-OUT FLOW ===
    if (attendance) {
      if (attendance.punchOut) {
        return res.status(400).json({ message: 'Already punched out for this date' });
      }

      if (!punchOut) {
        return res.status(400).json({ message: 'Missing punchOut time for punch-out' });
      }

      const punchOutTime = new Date(punchOut);
      const punchInTime = new Date(attendance.punchIn);

      if (isNaN(punchOutTime) || isNaN(punchInTime)) {
        return res.status(400).json({ message: 'Invalid punchIn or punchOut time' });
      }

      attendance.punchOut = punchOutTime;
      attendance.status = status ?? attendance.status;

      const companyData = await company.findById(req.user.companyId);
      const branch = await BranchModal.findById(attendance.branchId);

      await calculateStats(attendance, companyData, branch);
      await attendance.save();

      const updatedRecord = await Attendance.findById(attendance._id)
        .populate({
          path: 'employeeId',
          select: 'userid profileimage',
          populate: {
            path: 'userid',
            select: 'name'
          }
        });

      // 🔹 Realtime update
      sendToClients(
        {
          type: 'attendance_update',
          payload: { action: 'checkOut', data: updatedRecord }
        },
        req.user.companyId,
        attendance.branchId || null
      );

      return res.json({ message: 'Punch-out recorded', attendance: updatedRecord });
    }

    // === PUNCH-IN FLOW ===
    const punchInTime = punchIn ? new Date(punchIn) : new Date();
    if (isNaN(punchInTime)) {
      return res.status(400).json({ message: 'Invalid punchIn time' });
    }
    const empDoc = await employee.findById(employeeId).select('branchId');
    if (!empDoc) return res.status(404).json({ message: 'Employee not found' });
    const snapshot = await getRulesSnapshot(req.user.companyId, empDoc.branchId);

    attendance = new Attendance({
      attendanceById: req.user.id,
      companyId: req.user.companyId,
      branchId: empDoc.branchId,
      employeeId,
      departmentId,
      date: dateOnly,
      punchIn: punchInTime,
      dutyStart: snapshot?.officeTime?.in || "10:00",
      dutyEnd: snapshot?.officeTime?.out || "18:00",
      rulesSnapshot: snapshot,
      status: status ?? "present",
    });

    await attendance.save();

    const updatedRecord = await Attendance.findById(attendance._id)
      .populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name'
        }
      });

    // 🔹 Realtime update
    sendToClients(
      {
        type: 'attendance_update',
        payload: { action: 'checkin', data: updatedRecord }
      },
      req.user.companyId,
      empDoc.branchId || null
    );

    return res.json({ message: 'Punch-in recorded', attendance: updatedRecord });

  } catch (error) {
    console.error("Attendance error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteattandence = async (req, res, next) => {
  try {
    const { attandanceId } = req.body;

    if (!Array.isArray(attandanceId) || attandanceId.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty attandanceId array' });
    }

    const result = await Attendance.deleteMany({ _id: { $in: attandanceId } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No records found to delete' });
    }

    return res.status(200).json({ message: `${result.deletedCount} Record(s) deleted successfully` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

const checkin = async (req, res) => {
  try {
    const { employeeId, date, punchIn, status, reason } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 🔹 Normalize date (UTC midnight)
    const parsedDate = new Date(date);
    const dateObj = new Date(Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate()
    ));

    // 🔹 Prevent duplicate attendance
    const existing = await Attendance.findOne({ employeeId, date: dateObj });
    if (existing) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    // 🔹 Get employee
    const emp = await employee.findById(employeeId).select('branchId empId');
    if (!emp) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // 🔹 Get company & branch
    const companyData = await company.findById(req.user.companyId);
    const branch = await BranchModal.findById(emp.branchId);

    // 🔹 Build snapshot
    let snapshot = {};

    if (branch?.defaultsetting) {
      snapshot = {
        officeTime: companyData.officeTime,
        gracePeriod: companyData.gracePeriod,
        workingMinutes: companyData.workingMinutes,
        attendanceRules: companyData.attendanceRules
      };
    } else {
      snapshot = {
        officeTime: branch.setting.officeTime,
        gracePeriod: branch.setting.gracePeriod,
        workingMinutes: branch.setting.workingMinutes,
        attendanceRules: branch.setting.attendanceRules
      };
    }

    // 🔹 PunchIn time & status (only for present/half-day)
    const normalizedStatusCheck = status?.toLowerCase();
    const isAbsentOrLeave = ['absent', 'leave'].includes(normalizedStatusCheck);

    let punchInTime = null;
    let punchInStatus = null;

    if (!isAbsentOrLeave) {
      punchInTime = punchIn ? new Date(punchIn) : new Date();

      if (isNaN(punchInTime)) {
        return res.status(400).json({ message: 'Invalid punchIn time' });
      }

      // 🔹 Helper functions
      const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();

      const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      // 🔹 Calculate punchInStatus
      const earlyBefore = parseTime(
        snapshot.attendanceRules.considerEarlyEntryBefore
      );

      const lateAfter = parseTime(
        snapshot.attendanceRules.considerLateEntryAfter
      );

      const punchInMin = getMinutes(punchInTime);

      punchInStatus = "onTime";

      if (punchInMin < earlyBefore) {
        punchInStatus = "early";
      } else if (punchInMin > lateAfter) {
        punchInStatus = "late";
      }
    }

    // 🔹 Prepare attendance data
    const attendanceData = {
      companyId: req.user.companyId,
      attendanceById: req.user.id,
      branchId: emp.branchId,
      empId: emp.empId,
      employeeId,

      date: dateObj,
      status,
      source: 'manual',

      ...(punchInTime && { punchIn: punchInTime }),
      ...(punchInStatus && { punchInStatus }),

      dutyStart: snapshot.officeTime?.in,
      dutyEnd: snapshot.officeTime?.out,

      rulesSnapshot: snapshot,

      workingMinutes: 0,
      overtimeMinutes: 0,
      shortMinutes: 0
    };

    // 🔹 Leave handling
    if (status === "leave") {
      // Fetch default leave policy
      let policy = await LeavePolicy.findOne({ 
        companyId: req.user.companyId, 
        name: { $regex: /^casual$/i } 
      });
      
      if (!policy) {
        policy = await LeavePolicy.findOne({ companyId: req.user.companyId });
      }

      if (!policy) {
        return res.status(400).json({ 
          message: 'No leave policy found for this company. Please create a leave policy (e.g., "Casual") first.' 
        });
      }

      const leaveDoc = await Leave.create({
        companyId: req.user.companyId,
        branchId: emp.branchId,
        employeeId,
        policyId: policy._id,
        type: policy.name,
        fromDate: dateObj,
        toDate: dateObj,
        duration: 1,
        reason,
        status: 'approved'
      });

      attendanceData.leave = leaveDoc._id;
    }

    // 🔹 Save attendance
    const attendance = await Attendance.create(attendanceData);

    // 🔹 Populate response
    const updatedRecord = await Attendance.findById(attendance._id)
      .populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name'
        }
      });

    // 🔹 Realtime update
    if (['present', 'absent', 'leave'].includes(normalizedStatusCheck)) {
      sendToClients(
        {
          type: 'attendance_update',
          payload: { 
            action: normalizedStatusCheck === 'present' ? 'checkin' : normalizedStatusCheck, 
            data: updatedRecord 
          }
        },
        req.user.companyId,
        emp.branchId || null
      );
    }

    return res.status(200).json({
      message: 'Punch-in recorded',
      attendance: updatedRecord
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

const checkout = async (req, res) => {
  try {
    const { employeeId, date, punchOut } = req.body;

    if (!employeeId || !date || !punchOut) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 🔹 Normalize date
    const parsedDate = new Date(date);
    const dateObj = new Date(Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate()
    ));

    // 🔹 Find record
    const record = await Attendance.findOne({ employeeId, date: dateObj });

    if (!record) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    if (record.punchOut) {
      return res.status(400).json({ message: 'Already checked out' });
    }

    if (!record.punchIn) {
      return res.status(400).json({ message: 'Punch-in missing' });
    }

    // 🔹 Parse punchOut
    const punchOutTime = new Date(punchOut);
    if (isNaN(punchOutTime)) {
      return res.status(400).json({ message: 'Invalid punchOut time' });
    }

    record.punchOut = punchOutTime;

    // 🔹 Helpers
    const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();
    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const companyData = await company.findById(req.user.companyId);
    const branch = await BranchModal.findById(record.branchId);

    await calculateStats(record, companyData, branch);

    const snapshot = record.rulesSnapshot;
    const wm = snapshot.workingMinutes;
    const workingMinutes = record.workingMinutes;

    // =========================
    // 🔹 PunchOut Status
    // =========================
    const punchOutMin = getMinutes(punchOutTime);

    const earlyExitBefore = parseTime(
      snapshot.attendanceRules.considerEarlyExitBefore
    );

    const lateExitAfter = parseTime(
      snapshot.attendanceRules.considerLateExitAfter
    );

    let punchOutStatus = "onTime";

    if (punchOutMin < earlyExitBefore) {
      punchOutStatus = "early";
    } else if (punchOutMin > lateExitAfter) {
      punchOutStatus = "late";
    }

    record.punchOutStatus = punchOutStatus;

    // Status is already handled by calculateStats, but we keep it here if we want to ensure consistency
    if (workingMinutes < wm.halfDay) {
      record.status = "half day";
    } else {
      record.status = "present";
    }

    await record.save();

    const updatedRecord = await Attendance.findById(record._id)
      .populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name'
        }
      });

    // 🔹 Realtime update
    sendToClients(
      {
        type: 'attendance_update',
        payload: {
          action: 'checkOut',
          data: updatedRecord
        }
      },
      req.user.companyId,
      record.branchId || null
    );

    return res.status(200).json({
      message: 'Punch-out recorded',
      record: updatedRecord
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

const recordAttendanceFromLogs = async (req, res, next) => {
  try {
    const { deviceUserId, recordTime } = req.body;

    // 1️⃣ Find employee by esslId
    const employeeDoc = await employee.findOne({ deviceUserId }).select('_id branchId empId companyId');
    if (!employeeDoc) {
      console.warn(`⚠️ No employee found with esslId ${deviceUserId}`);
      return;
    }

    // 2️⃣ Normalize punch time → strip seconds & ms
    const punchDate = new Date(recordTime);
    punchDate.setSeconds(0, 0); // ✅ keep only till minutes

    // 2.1️⃣ Normalize attendance date to UTC midnight
    const dateObj = new Date(Date.UTC(
      punchDate.getUTCFullYear(),
      punchDate.getUTCMonth(),
      punchDate.getUTCDate()
    ));

    // 3️⃣ Check existing attendance for same employee + date
    let attendance = await Attendance.findOne({
      employeeId: employeeDoc._id,
      date: dateObj
    });

    if (!attendance) {
      // 4️⃣ First punch → create Punch In
      attendance = new Attendance({
        companyId: employeeDoc.companyId,
        branchId: employeeDoc.branchId,
        empId: employeeDoc.empId,
        employeeId: employeeDoc._id,
        date: dateObj,
        status: 'present',
        punchIn: punchDate,
        source: 'device'
      });
      await attendance.save();

      const updatedRecord = await Attendance.findById(attendance._id)
        .populate({
          path: 'employeeId',
          select: 'userid profileimage',
          populate: {
            path: 'userid',
            select: 'name'
          }
        });

      sendToClients(
        {
          type: 'attendance_update',
          payload: { action: 'checkin', data: updatedRecord }
        },
        (employeeDoc?.companyId).toString(),
        (employeeDoc?.branchId).toString() || null
      );

      // sendTelegramMessage(`${updatedRecord?.employeeId?.userid?.name} has Punched In at ${dayjs(updatedRecord.punchIn).format("hh:mm A")}`)

      // console.log(`✅ Punch In recorded for employee ${employeeDoc.empId} on ${dateObj.toDateString()}`);
    } else {
      // 5️⃣ If already has punchIn but no punchOut → set Punch Out with calculations
      if (!attendance.punchOut) {
        attendance.punchOut = punchDate;

        // ✅ Get rules & calculate stats
        const companyData = await company.findById(employeeDoc.companyId);
        const branch = await BranchModal.findById(employeeDoc.branchId);

        // Ensure rulesSnapshot is available (if this was created via device, it might not be)
        if (!attendance.rulesSnapshot) {
          let snapshot = {};
          if (branch?.defaultsetting) {
            snapshot = { officeTime: companyData.officeTime, gracePeriod: companyData.gracePeriod, workingMinutes: companyData.workingMinutes, attendanceRules: companyData.attendanceRules, weeklyOffs: companyData.weeklyOffs, overtimeRules: companyData.overtimeRules };
          } else {
            snapshot = { officeTime: branch.setting.officeTime, gracePeriod: branch.setting.gracePeriod, workingMinutes: branch.setting.workingMinutes, attendanceRules: branch.setting.attendanceRules, weeklyOffs: branch.setting.weeklyOffs, overtimeRules: branch.setting.overtimeRules };
          }
          attendance.rulesSnapshot = snapshot;
        }

        await calculateStats(attendance, companyData, branch);
        await attendance.save();

        const updatedRecord = await Attendance.findById(attendance._id)
          .populate({
            path: 'employeeId',
            select: 'userid profileimage',
            populate: {
              path: 'userid',
              select: 'name'
            }
          });

        sendToClients(
          {
            type: 'attendance_update',
            payload: { action: 'checkOut', data: updatedRecord }
          },
          (employeeDoc?.companyId).toString(),
          (employeeDoc?.branchId).toString() || null
        );
        // sendTelegramMessage(`${updatedRecord?.employeeId?.userid?.name} has Punched Out at ${dayjs(updatedRecord.punchIn).format("hh:mm A")}`)
        console.log(
          // `✅ Punch Out recorded for employee ${employeeDoc.empId} on ${dateObj.toDateString()} | Working: ${attendance.workingMinutes} min | Short: ${attendance.shortMinutes} min`
        );
      } else {
        console.log(`ℹ️ Extra punch ignored for employee ${employeeDoc.empId} on ${dateObj.toDateString()}`);
      }
    }
  } catch (error) {
    console.error("❌ Error recording attendance:", error.message);
  }
};

const facecheckin = async (req, res, next) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    const whichemployee = await employee.findById(employeeId).select('branchId');
    // Get current time
    const now = new Date();

    // Normalize punchIn to HH:mm (zero seconds and milliseconds)
    const punchIn = new Date(now.setSeconds(0, 0));

    // Normalize date to UTC 00:00
    const dateObj = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    // Check if already checked in
    const existing = await Attendance.findOne({ employeeId, date: dateObj });
    if (existing) {
      return res.status(206).json({ message: 'Already checked in today', attendance: existing });
    }

    // Create attendance
    const snapshot = await getRulesSnapshot(req.user.companyId, whichemployee.branchId);

    const attendanceData = {
      companyId: req.user.companyId,
      branchId: whichemployee.branchId,
      employeeId,
      date: dateObj,
      punchIn: punchIn,
      rulesSnapshot: snapshot,
      status: 'present'
    };

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    const updatedRecord = await Attendance.findById(attendance._id)
      .populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name'
        }
      });

    // Notify clients
    sendToClients(
      {
        type: 'attendance_update',
        payload: {
          action: 'checkin',
          data: updatedRecord
        }
      },
      req.user.companyId,
      whichemployee.branchId || null
    );

    return res.status(200).json({ message: 'Punch-in recorded', attendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

function normalizeDateToUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const bulkMarkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ message: 'No attendance data provided.' });
    }

    const companyId = req.user.companyId;

    // 🔹 preload company
    const companyData = await company.findById(companyId);

    const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();

    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const bulkOps = [];

    for (const record of attendanceRecords) {
      let {
        employeeId,
        empId,
        branchId,
        date,
        punchIn,
        punchOut,
        status, // will be overridden
        source = 'manual'
      } = record;

      const parsedDate = new Date(date);
      const dateObj = normalizeDateToUTC(parsedDate);

      // 🔹 get branch
      const branch = await BranchModal.findById(branchId);

      // 🔹 SNAPSHOT (IMPORTANT)
      let snapshot = {};

      if (branch?.defaultsetting) {
        snapshot = {
          officeTime: companyData.officeTime,
          gracePeriod: companyData.gracePeriod,
          workingMinutes: companyData.workingMinutes,
          attendanceRules: companyData.attendanceRules,
          weeklyOffs: companyData.weeklyOffs,
          overtimeRules: companyData.overtimeRules
        };
      } else {
        snapshot = {
          officeTime: branch.setting.officeTime,
          gracePeriod: branch.setting.gracePeriod,
          workingMinutes: branch.setting.workingMinutes,
          attendanceRules: branch.setting.attendanceRules,
          weeklyOffs: branch.setting.weeklyOffs,
          overtimeRules: branch.setting.overtimeRules
        };
      }

      const punchInDate = punchIn ? new Date(punchIn) : null;
      const punchOutDate = punchOut ? new Date(punchOut) : null;

      let punchInStatus = null;
      let punchOutStatus = null;

      // =========================
      // 🔹 PunchIn Status
      // =========================
      if (punchInDate) {
        const earlyBefore = parseTime(snapshot.attendanceRules.considerEarlyEntryBefore);
        const lateAfter = parseTime(snapshot.attendanceRules.considerLateEntryAfter);

        const min = getMinutes(punchInDate);

        if (min < earlyBefore) punchInStatus = "early";
        else if (min > lateAfter) punchInStatus = "late";
        else punchInStatus = "onTime";
      }

      // =========================
      // 🔹 PunchOut Status
      // =========================
      if (punchOutDate) {
        const earlyExitBefore = parseTime(snapshot.attendanceRules.considerEarlyExitBefore);
        const lateExitAfter = parseTime(snapshot.attendanceRules.considerLateExitAfter);

        const min = getMinutes(punchOutDate);

        if (min < earlyExitBefore) punchOutStatus = "early";
        else if (min > lateExitAfter) punchOutStatus = "late";
        else punchOutStatus = "onTime";
      }

      // =========================
      // 🔹 WORKING + OT + SHORT
      // =========================
      let workingMinutes = 0;
      let overtimeMinutes = 0;
      let shortMinutes = 0;
      let remarks = null;

      const day = new Date(dateObj).getUTCDay();
      let isWeeklyOff = false;

      if (branch.defaultsetting) {
        isWeeklyOff = companyData.weeklyOffs.includes(day);
      } else {
        isWeeklyOff = branch.setting.weeklyOffs.includes(day);
      }

      const dateStr = dayjs(dateObj).format('YYYY-MM-DD');

      const isHolidayRecord = await Holiday.findOne({
        companyId: req.user.companyId,
        fromDate: { $lte: dateStr },
        toDate: { $gte: dateStr }
      });
      const isHoliday = !!isHolidayRecord;

      if (punchInDate && punchOutDate && punchOutDate > punchInDate) {
        workingMinutes = Math.floor((punchOutDate - punchInDate) / (1000 * 60));

        const wm = snapshot.workingMinutes;
        const overtimeRules = snapshot.overtimeRules || {};

        // 🔥 SAME AS CHECKOUT (NO MISMATCH)

        // =========================
        // 🔥 OVERTIME ENGINE
        // =========================
        if (isHoliday && overtimeRules?.holiday?.treatAllAsOvertime) {
          overtimeMinutes = workingMinutes;
        }
        else if (isWeeklyOff && overtimeRules?.weeklyOff?.treatAllAsOvertime) {
          overtimeMinutes = workingMinutes;
        }
        else {
          if (workingMinutes > wm.overtimeAfterMinutes) {
            overtimeMinutes = workingMinutes - wm.overtimeAfterMinutes;
          }

          if (workingMinutes < wm.fullDay) {
            shortMinutes = wm.fullDay - workingMinutes;
          }
        }

        // =========================
        // 🔹 REMARKS
        // =========================
        if (isHoliday && workingMinutes > 0) {
          remarks = "worked on holiday";
        }
        else if (isWeeklyOff && workingMinutes > 0) {
          remarks = "worked on weekly off";
        }
        else if (workingMinutes === 0) {
          remarks = "no work recorded";
        }

        // =========================
        // 🔹 STATUS (AUTO)
        // =========================
        if (workingMinutes < wm.halfDay) {
          status = "half day";
        } else {
          status = "present";
        }
      }

      // =========================
      // 🔹 BULK OPERATION
      // =========================
      bulkOps.push({
        updateOne: {
          filter: { employeeId, date: dateObj },
          update: {
            $set: {
              companyId,
              branchId,
              empId,

              punchIn: punchInDate,
              punchOut: punchOutDate,

              punchInStatus,
              punchOutStatus,

              dutyStart: snapshot.officeTime.in,
              dutyEnd: snapshot.officeTime.out,

              rulesSnapshot: snapshot,

              workingMinutes,
              overtimeMinutes,
              shortMinutes,
              remarks,
              dayType: isHoliday ? "holiday" : (isWeeklyOff ? "weekoff" : "normal"),
              status,
              source
            }
          },
          upsert: true
        }
      });
    }

    await Attendance.bulkWrite(bulkOps);

    // 🔹 Realtime update
    sendToClients(
      {
        type: 'attendance_update',
        payload: { action: 'bulk_update', message: `Attendance marked for ${attendanceRecords.length} employees.` }
      },
      companyId
    );

    return res.status(200).json({
      message: 'Bulk attendance marked successfully.'
    });

  } catch (error) {
    console.error('Bulk Attendance Error:', error);
    return res.status(500).json({
      message: 'Server error while marking attendance.'
    });
  }
};

const bulkMarkAttendanceExcel = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ message: 'No attendance data provided.' });
    }

    const companyId = req.user.companyId;
    const companyData = await company.findById(companyId);

    const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();
    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const bulkOps = [];

    for (const record of attendanceRecords) {
      let {
        empId,
        date,
        punchIn,
        punchOut,
        status,
        source = 'excel'
      } = record;

      if (!empId || !date) continue;

      const emp = await employee.findOne({ empId, companyId }).select('_id branchId empId');
      if (!emp) {
        console.warn(`Employee with empId ${empId} not found in company ${companyId}`);
        continue;
      }

      const parsedDate = new Date(date);
      const dateObj = normalizeDateToUTC(parsedDate);
      const branch = await BranchModal.findById(emp.branchId);

      let snapshot = {};
      if (branch?.defaultsetting) {
        snapshot = {
          officeTime: companyData.officeTime,
          gracePeriod: companyData.gracePeriod,
          workingMinutes: companyData.workingMinutes,
          attendanceRules: companyData.attendanceRules,
          weeklyOffs: companyData.weeklyOffs,
          overtimeRules: companyData.overtimeRules
        };
      } else {
        snapshot = {
          officeTime: branch.setting.officeTime,
          gracePeriod: branch.setting.gracePeriod,
          workingMinutes: branch.setting.workingMinutes,
          attendanceRules: branch.setting.attendanceRules,
          weeklyOffs: branch.setting.weeklyOffs,
          overtimeRules: branch.setting.overtimeRules
        };
      }

      const punchInDate = punchIn ? new Date(punchIn) : null;
      const punchOutDate = punchOut ? new Date(punchOut) : null;

      let punchInStatus = null;
      let punchOutStatus = null;

      if (punchInDate) {
        const earlyBefore = parseTime(snapshot.attendanceRules.considerEarlyEntryBefore);
        const lateAfter = parseTime(snapshot.attendanceRules.considerLateEntryAfter);
        const min = getMinutes(punchInDate);
        if (min < earlyBefore) punchInStatus = "early";
        else if (min > lateAfter) punchInStatus = "late";
        else punchInStatus = "onTime";
      }

      if (punchOutDate) {
        const earlyExitBefore = parseTime(snapshot.attendanceRules.considerEarlyExitBefore);
        const lateExitAfter = parseTime(snapshot.attendanceRules.considerLateExitAfter);
        const min = getMinutes(punchOutDate);
        if (min < earlyExitBefore) punchOutStatus = "early";
        else if (min > lateExitAfter) punchOutStatus = "late";
        else punchOutStatus = "onTime";
      }

      let workingMinutes = 0;
      let overtimeMinutes = 0;
      let shortMinutes = 0;
      let remarks = null;

      const day = new Date(dateObj).getUTCDay();
      let isWeeklyOff = false;
      if (branch.defaultsetting) {
        isWeeklyOff = companyData.weeklyOffs.includes(day);
      } else {
        isWeeklyOff = branch.setting.weeklyOffs.includes(day);
      }

      const dateStr = dayjs(dateObj).format('YYYY-MM-DD');

      const isHolidayRecord = await Holiday.findOne({
        companyId,
        fromDate: { $lte: dateStr },
        toDate: { $gte: dateStr }
      });
      const isHoliday = !!isHolidayRecord;

      if (punchInDate && punchOutDate && punchOutDate > punchInDate) {
        workingMinutes = Math.floor((punchOutDate - punchInDate) / (1000 * 60));
        const wm = snapshot.workingMinutes;
        const overtimeRules = snapshot.overtimeRules || {};

        if (isHoliday && overtimeRules?.holiday?.treatAllAsOvertime) {
          overtimeMinutes = workingMinutes;
        } else if (isWeeklyOff && overtimeRules?.weeklyOff?.treatAllAsOvertime) {
          overtimeMinutes = workingMinutes;
        } else {
          if (workingMinutes > wm.overtimeAfterMinutes) {
            overtimeMinutes = workingMinutes - wm.overtimeAfterMinutes;
          }
          if (workingMinutes < wm.fullDay) {
            shortMinutes = wm.fullDay - workingMinutes;
          }
        }

        if (isHoliday && workingMinutes > 0) remarks = "worked on holiday";
        else if (isWeeklyOff && workingMinutes > 0) remarks = "worked on weekly off";

        if (!status) {
          if (workingMinutes < wm.halfDay) status = "half day";
          else status = "present";
        }
      } else {
        if (!status) {
          if (isHoliday) status = "holiday";
          else if (isWeeklyOff) status = "weekly off";
          else status = "absent";
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { employeeId: emp._id, date: dateObj },
          update: {
            $set: {
              companyId,
              branchId: emp.branchId,
              empId: emp.empId,
              employeeId: emp._id,
              punchIn: punchInDate,
              punchOut: punchOutDate,
              punchInStatus,
              punchOutStatus,
              dutyStart: snapshot.officeTime.in,
              dutyEnd: snapshot.officeTime.out,
              rulesSnapshot: snapshot,
              workingMinutes,
              overtimeMinutes,
              shortMinutes,
              remarks,
              dayType: isHoliday ? "holiday" : (isWeeklyOff ? "weekoff" : "normal"),
              status,
              source
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);

      // 🔹 Realtime update
      sendToClients(
        {
          type: 'attendance_update',
          payload: { action: 'bulk_update', message: `${bulkOps.length} attendance records processed via Excel.` }
        },
        companyId
      );
    }

    return res.status(200).json({
      message: `${bulkOps.length} attendance records processed successfully.`
    });

  } catch (error) {
    console.error('Bulk Attendance Excel Error:', error);
    return res.status(500).json({
      message: 'Server error while processing Excel attendance.'
    });
  }
};

/**
 * Helper to calculate working, overtime, and short minutes based on rules.
 * Also determines status and remarks for holidays/weekly offs.
 */
async function calculateStats(record, companyData, branch) {
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
    isWeeklyOff = companyData.weeklyOffs.includes(day);
  } else {
    isWeeklyOff = branch.setting.weeklyOffs.includes(day);
  }
  const dateStr = dayjs(record.date).format('YYYY-MM-DD');

  const isHolidayRecord = await Holiday.findOne({
    companyId: companyData._id,
    fromDate: dateStr
  });
  // console.log("isHolidayRecord",isHolidayRecord)

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
    if (workingMinutes > wm.overtimeAfterMinutes) {
      overtimeMinutes = workingMinutes - wm.overtimeAfterMinutes;
    }
    if (workingMinutes < wm.fullDay) {
      shortMinutes = wm.fullDay - workingMinutes;
    }

    // Only clear holiday/weekly off remarks if not applicable (meaning not holiday/weekly off)
    if (!isHoliday && !isWeeklyOff) {
      if (remarks === "worked on holiday" || remarks === "worked on weekly off") {
        remarks = "";
      }
    }
  }

  record.overtimeMinutes = overtimeMinutes;
  record.shortMinutes = shortMinutes;
  record.remarks = remarks;

  if (workingMinutes < wm.halfDay) {
    record.status = "half day";
  } else {
    record.status = "present";
  }
}

const facecheckout = async (req, res, next) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const now = new Date();
    now.setSeconds(0, 0, 0);

    const dateObj = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const record = await Attendance.findOne({ employeeId, date: dateObj });

    if (!record) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    if (record.punchOut) {
      return res.status(206).json({ message: 'Already checked Out today', attendance: record });
    }

    record.punchOut = now;

    const companyData = await company.findById(req.user.companyId);
    const branch = await BranchModal.findById(record.branchId);

    await calculateStats(record, companyData, branch);

    await record.save();

    const populatedRecord = await Attendance.findById(record._id)
      .populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name'
        }
      });

    sendToClients(
      {
        type: 'attendance_update',
        payload: {
          action: 'checkOut',
          data: populatedRecord
        }
      },
      req.user.companyId,
      record.branchId || null
    );

    return res.status(200).json({ message: 'Punch-out recorded', attendance: populatedRecord });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get all attendance
const allAttandence = async (req, res, next) => {
  const data = await Attendance.find().populate('employeeId', 'name email');
  res.json(data);
};

const editattandence = async (req, res) => {
  try {
    const { id, punchIn, punchOut, status, leaveReason } = req.body;

    const data = await Attendance.findById(id).populate('employeeId', 'branchId');

    if (!data) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const wasPunchedIn = !!data.punchIn;
    const wasPunchedOut = !!data.punchOut;

    // 🔹 Manager access check
    if (req.user.role === 'manager') {
      const branchIdStr = data.employeeId.branchId.toString();
      if (!req.user.branchIds.includes(branchIdStr)) {
        return res.status(400).json({ message: "You can't edit this data" });
      }
    }

    const baseDate = new Date(data.date);

    const mergeDate = (date, time) => {
      const d = new Date(date);
      const t = new Date(time);
      d.setHours(t.getHours(), t.getMinutes(), 0, 0);
      return d;
    };

    // 🔹 Helpers
    const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();

    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const rules = data.rulesSnapshot;

    // 🔹 Reset
    data.workingMinutes = 0;
    data.overtimeMinutes = 0;
    data.shortMinutes = 0;
    data.remarks = null;
    data.punchInStatus = undefined;
    data.punchOutStatus = undefined;

    // =========================
    // 🔹 Punch IN
    // =========================
    if (punchIn) {
      if (isNaN(Date.parse(punchIn))) {
        return res.status(400).json({ message: 'Invalid punchIn time' });
      }

      data.punchIn = mergeDate(baseDate, punchIn);

      const min = getMinutes(data.punchIn);

      const earlyBefore = parseTime(rules.attendanceRules.considerEarlyEntryBefore);
      const lateAfter = parseTime(rules.attendanceRules.considerLateEntryAfter);

      if (min < earlyBefore) data.punchInStatus = "early";
      else if (min > lateAfter) data.punchInStatus = "late";
      else data.punchInStatus = "onTime";

    } else {
      data.punchIn = null;
    }

    // =========================
    // 🔹 Punch OUT
    // =========================
    if (punchOut) {
      if (isNaN(Date.parse(punchOut))) {
        return res.status(400).json({ message: 'Invalid punchOut time' });
      }

      data.punchOut = mergeDate(baseDate, punchOut);

      const min = getMinutes(data.punchOut);

      const earlyExitBefore = parseTime(rules.attendanceRules.considerEarlyExitBefore);
      const lateExitAfter = parseTime(rules.attendanceRules.considerLateExitAfter);

      if (min < earlyExitBefore) data.punchOutStatus = "early";
      else if (min > lateExitAfter) data.punchOutStatus = "late";
      else data.punchOutStatus = "onTime";

    } else {
      data.punchOut = null;
    }

    if (data.punchIn && data.punchOut) {
      // 🔥 FETCH LIVE CONFIG
      const companyData = await company.findById(req.user.companyId);
      const branch = await BranchModal.findById(data.branchId);

      await calculateStats(data, companyData, branch);
    }

    // =========================
    // 🔹 Manual Status Override
    // =========================
    if (status && !['present', 'half day'].includes(status)) {
      data.status = status;
      data.punchIn = null;
      data.punchOut = null;
      data.workingMinutes = 0;
      data.overtimeMinutes = 0;
      data.shortMinutes = 0;
      data.remarks = null;
    }

    // =========================
    // 🔹 Leave Handling
    // =========================
    if (status === "leave") {
      const existingLeave = await Leave.findByIdAndUpdate(
        req.body.leaveid,
        { reason: leaveReason }
      );

      if (!existingLeave) {
        // Fetch default leave policy
        let policy = await LeavePolicy.findOne({ 
          companyId: req.user.companyId, 
          name: { $regex: /^casual$/i } 
        });
        
        if (!policy) {
          policy = await LeavePolicy.findOne({ companyId: req.user.companyId });
        }

        if (!policy) {
          return res.status(400).json({ 
            message: 'No leave policy found for this company. Please create a leave policy (e.g., "Casual") first.' 
          });
        }

        const leaveDoc = await Leave.create({
          companyId: req.user.companyId,
          branchId: data.branchId,
          employeeId: data.employeeId,
          policyId: policy._id,
          type: policy.name,
          fromDate: data.date,
          toDate: data.date,
          duration: 1,
          reason: leaveReason,
          status: 'approved'
        });

        data.leave = leaveDoc._id;
      }
    }

    await data.save();

    const updatedRecord = await Attendance.findById(data._id)
      .populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name'
        }
      });

    // 🔹 Realtime update
    // 🔹 Realtime update
    let action = 'edit';
    const normalizedStatus = status?.toLowerCase();

    if (!wasPunchedOut && updatedRecord.punchOut) {
      action = 'checkOut';
    } else if (!wasPunchedIn && updatedRecord.punchIn) {
      action = 'checkin';
    } else if (normalizedStatus === 'absent') {
      action = 'absent';
    } else if (normalizedStatus === 'leave') {
      action = 'leave';
    }

    sendToClients(
      {
        type: 'attendance_update',
        payload: { action, data: updatedRecord }
      },
      req.user.companyId,
      data.branchId || null
    );

    return res.status(200).json({
      message: 'Edit successfully',
      attendance: updatedRecord
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Apply for leave
const leaveapply = async (req, res, next) => {
  const { employeeId, date, reason } = req.body;
  const leave = new Leave({ employeeId, date, reason });
  await leave.save();
  res.json(leave);
};

// Approve or reject leave (admin only)
const leaveupdate = async (req, res, next) => {
  const { leaveId, status } = req.body;
  const leave = await Leave.findByIdAndUpdate(leaveId, { status }, { new: true });
  res.json(leave);
};

// Get all leaves
const allleave = async (req, res, next) => {
  const data = await Leave.find().populate('employeeId', 'name email');
  res.json(data);
};

const employeeAttandence = async (req, res, next) => {
  const userid = req.query.userid;
  if (!userid) return res.status(400).json({ message: 'Employee Id is needed' });

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid Employee Id" });
  }

  try {
    const user = await User.findOne({ _id: userid });

    if (!user) {
      return res.status(403).json({ message: 'Employee Not Found' })
    }

    if (!user.companyId.equals(req.user.companyId)) {
      return res.status(403).json({ owner: false, message: "Forbidden: You don’t have access to this employee’s data." });
    }

    const employeedetail = await employee.findOne({ userid }).populate({
      path: 'branchId',
      select: 'name defaultsetting setting'
    });
    const attandence = await Attendance.find({ employeeId: employeedetail._id })
      .populate({
        path: 'leave',
        select: 'reason'
      }).sort({ date: -1 });

    return res.status(200).json({ user, employee: employeedetail, attandence });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
}


module.exports = { checkout, deleteattandence, bulkMarkAttendance, bulkMarkAttendanceExcel, facecheckin, recordAttendanceFromLogs, facecheckout, editattandence, employeeAttandence, checkin, webattandence, allAttandence, leaveapply, leaveupdate, allleave };
