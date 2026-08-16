const WeeklyOffLedger = require("../models/weeklyOffLedger");
const Attendance = require("../models/attandence");
const Payroll = require("../models/payroll");
const Employee = require("../models/employee");

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Helper to sync weekly off minutes for a single day/attendance record in real-time
async function syncAttendanceDayWeeklyOff(attRecord) {
  try {
    if (!attRecord || !attRecord.employeeId) return;

    const employeeId = attRecord.employeeId._id || attRecord.employeeId;
    const emp = await Employee.findById(employeeId);
    if (!emp) return;

    const d = new Date(attRecord.date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[d.getDay()];
    const dateFormatted = `${String(d.getDate()).padStart(2, '0')} ${monthNames[month - 1]} ${year}`;

    const isWeekOff = attRecord.dayType === "weekoff" || attRecord.status === "weekly off" || (attRecord.weeklyOffMinutes && attRecord.weeklyOffMinutes > 0);
    const min = attRecord.weeklyOffMinutes || (isWeekOff && (attRecord.status === "present" || (attRecord.workingMinutes || 0) > 0) ? (attRecord.workingMinutes || 0) : 0);

    // Look for an existing ledger entry linked by attendanceId or (date + employeeId)
    let existing = null;
    if (attRecord._id) {
      existing = await WeeklyOffLedger.findOne({ attendanceId: attRecord._id });
    }
    if (!existing) {
      const startOfDay = new Date(year, month - 1, d.getDate(), 0, 0, 0);
      const endOfDay = new Date(year, month - 1, d.getDate(), 23, 59, 59);
      existing = await WeeklyOffLedger.findOne({
        employeeId,
        type: "EARNED",
        date: { $gte: startOfDay, $lte: endOfDay }
      });
    }

    if (isWeekOff && min > 0) {
      const particulars = `Worked on Weekly Off - ${dayName}, ${dateFormatted} (${min} min)`;
      if (!existing) {
        await WeeklyOffLedger.create({
          employeeId,
          branchId: attRecord.branchId || emp.branchId,
          type: "EARNED",
          minutes: min,
          particulars,
          date: attRecord.date,
          month,
          year,
          attendanceId: attRecord._id,
          createdBy: "System (Attendance Live)",
        });
      } else {
        existing.minutes = min;
        existing.particulars = particulars;
        existing.date = attRecord.date;
        existing.month = month;
        existing.year = year;
        if (attRecord._id) existing.attendanceId = attRecord._id;
        await existing.save();
      }
    } else if (existing) {
      // If attendance was cleared or no longer weekly off work, remove the entry
      await WeeklyOffLedger.findByIdAndDelete(existing._id);
    }
  } catch (err) {
    console.error("Error in syncAttendanceDayWeeklyOff:", err);
  }
}

// Function to rebuild/backfill all employees in one shot with 100% individual day entries
async function rebuildAllWeeklyOffLedgers() {
  try {
    const employees = await Employee.find({ status: true });
    let count = 0;

    for (const emp of employees) {
      // 0. Clean up old consolidated monthly EARNED entries without attendanceId (so no monthly lumps remain)
      await WeeklyOffLedger.deleteMany({
        employeeId: emp._id,
        type: "EARNED",
        attendanceId: { $exists: false }
      });

      // 1. Sync from ALL Attendance records (Per-Day individual entries)
      const attendanceRecords = await Attendance.find({
        employeeId: emp._id,
        $or: [
          { dayType: "weekoff" },
          { status: "weekly off" },
          { weeklyOffMinutes: { $gt: 0 } }
        ]
      });

      for (const att of attendanceRecords) {
        await syncAttendanceDayWeeklyOff(att);
      }

      // 2. Sync PAYROLL_PAID records if payrolls exist where weeklyOff was paid
      const payrolls = await Payroll.find({ employeeId: emp._id });
      for (const p of payrolls) {
        const isPaid = p.options?.addWeeklyOffWork;
        const paidMin = isPaid 
          ? (p.options?.adjustedWeeklyOffMin !== undefined ? Number(p.options.adjustedWeeklyOffMin) || 0 : (p.weeklyOffWork || 0))
          : 0;

        const existingPaid = await WeeklyOffLedger.findOne({ payrollId: p._id, type: "PAYROLL_PAID" });
        if (paidMin > 0) {
          const particulars = `Weekly Off Paid in Payroll - ${monthNames[p.month - 1]} ${p.year} (${paidMin} min)`;
          if (!existingPaid) {
            await WeeklyOffLedger.create({
              employeeId: emp._id,
              branchId: p.branchId || emp.branchId,
              type: "PAYROLL_PAID",
              minutes: paidMin,
              particulars,
              month: p.month,
              year: p.year,
              payrollId: p._id,
              createdBy: "System (Payroll Sync)",
            });
          } else if (existingPaid.minutes !== paidMin) {
            existingPaid.minutes = paidMin;
            existingPaid.particulars = particulars;
            await existingPaid.save();
          }
        } else if (existingPaid) {
          await WeeklyOffLedger.findByIdAndDelete(existingPaid._id);
        }
      }

      count++;
    }

    return { success: true, processedEmployees: count };
  } catch (err) {
    console.error("Error in rebuildAllWeeklyOffLedgers:", err);
    return { success: false, error: err.message };
  }
}

// Auto-run one-time background build on server start
// setTimeout(async () => {
//   try {
//     console.log("⚡ Auto-rebuilding Weekly Off Ledgers into individual daily entries...");
//     await rebuildAllWeeklyOffLedgers();
//     console.log("✅ Weekly Off Ledgers rebuilt with individual daily entries successfully!");
//   } catch (err) {
//     console.error("Failed to auto-rebuild weekly off ledgers:", err);
//   }
// }, 3000);

module.exports = {
  syncAttendanceDayWeeklyOff,
  rebuildAllWeeklyOffLedgers,
};
