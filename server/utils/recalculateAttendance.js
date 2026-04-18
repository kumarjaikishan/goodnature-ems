/**
 * Temporary utility script to recalculate attendance statistics.
 * This script updates all attendance records with the current company/branch settings
 * and recalculates overtime/shortage based strictly on the fullDay baseline.
 */

require("dotenv").config();
const mongoose = require('mongoose');
const Attendance = require('../models/attandence');
const Company = require('../models/company');
const Branch = require('../models/branch');
const Holiday = require('../models/holiday');
const dayjs = require('dayjs');
const { getRulesSnapshot } = require('../services/attendanceService');

// Use current connection logic or custom one
const connStr = process.env.db || "mongodb://localhost:27017/ems";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(connStr);
    console.log("Connected successfully.");

    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies.`);

    for (const company of companies) {
      console.log(`Processing company: ${company.name} (${company._id})`);

      // Get all branches for this company
      const branches = await Branch.find({ companyId: company._id });

      // Cache snapshots for each branch
      const branchSnapshots = {};
      for (const branch of branches) {
        branchSnapshots[branch._id.toString()] = await getRulesSnapshot(company._id, branch._id);
      }

      // Default company snapshot
      const defaultSnapshot = await getRulesSnapshot(company._id, null);

      // Fetch all attendance records for this company
      const records = await Attendance.find({ companyId: company._id });
      console.log(`Found ${records.length} attendance records for this company.`);

      let updateCount = 0;
      for (const record of records) {
        const branchId = record.branchId ? record.branchId.toString() : null;
        const snapshot = (branchId && branchSnapshots[branchId]) ? branchSnapshots[branchId] : defaultSnapshot;

        if (!snapshot) continue;

        // 1. Update Snapshot
        record.rulesSnapshot = snapshot;

        // 2. Recalculate working minutes if punchIn/Out exists
        if (record.punchIn && record.punchOut) {
          const workingMinutes = Math.floor((record.punchOut - record.punchIn) / (1000 * 60));
          record.workingMinutes = workingMinutes;

          const wm = snapshot.workingMinutes;
          const fullDay = wm.fullDay || 480; // Fallback to 8 hours if not set
          const halfDay = wm.halfDay || 240;

          const dateStr = dayjs(record.date).format('YYYY-MM-DD');
          const isHolidayRecord = await Holiday.findOne({
            companyId: company._id,
            fromDate: { $lte: dateStr },
            toDate: { $gte: dateStr }
          });
          const isHoliday = !!isHolidayRecord;

          const day = new Date(record.date).getUTCDay();
          const weeklyOffs = snapshot.weeklyOffs || [];
          const isWeeklyOff = weeklyOffs.includes(day);

          const overtimeRules = snapshot.overtimeRules || {};

          let overtimeMinutes = 0;
          let shortMinutes = 0;

          // Recalculation logic based on "Full Day" baseline as requested
          if (isHoliday && overtimeRules?.holiday?.treatAllAsOvertime) {
            overtimeMinutes = workingMinutes;
            shortMinutes = 0;
          } else if (isWeeklyOff && overtimeRules?.weeklyOff?.treatAllAsOvertime) {
            overtimeMinutes = workingMinutes;
            shortMinutes = 0;
          } else {
            // NORMAL DAY RECALCULATION
            if (workingMinutes > fullDay) {
              overtimeMinutes = workingMinutes - fullDay;
              shortMinutes = 0;
            } else if (workingMinutes < fullDay) {
              overtimeMinutes = 0;
              shortMinutes = fullDay - workingMinutes;
            } else {
              overtimeMinutes = 0;
              shortMinutes = 0;
            }
          }

          record.overtimeMinutes = parseFloat(overtimeMinutes.toFixed(2));
          record.shortMinutes = parseFloat(shortMinutes.toFixed(2));

          // 3. Update Status
          if (workingMinutes < halfDay) {
            record.status = "half day";
          } else {
            record.status = "present";
          }

          // 4. Update Day Type
          record.dayType = isHoliday ? "holiday" : (isWeeklyOff ? "weekoff" : "normal");
        }

        await record.save();
        updateCount++;
      }
      console.log(`Updated ${updateCount} records for ${company.name}.`);
    }

    console.log("Attendance recalculation complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error during recalculation:", err);
    process.exit(1);
  }
}

// run();
