/**
 * Sync Attendance Records to Current Employee Details
 * ─────────────────────────────────────────────────────────────────────────────
 * Purpose:
 * When employees are moved to another branch or assigned an updated empId/company,
 * past attendance records retain older branchId or empId snapshots.
 *
 * This script:
 * 1. Reads all active & existing employees with their current branchId, empId, and companyId.
 * 2. Compares every employee's attendance records in the database.
 * 3. Supports --dry-run (default if no argument provided, or explicitly pass --dry-run).
 * 4. Pass --commit to apply actual bulk updates.
 *
 * Usage:
 *   Dry run:  node server/scripts/syncAttendanceEmployeeBranches.js
 *   Execute:  node server/scripts/syncAttendanceEmployeeBranches.js --commit
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
require('../models/branch');
require('../models/company');
const employee = require('../models/employee');
const Attendance = require('../models/attandence');

const DB_URI = process.env.db || 'mongodb://127.0.0.1:27017/goodfeel';
const isCommit = process.argv.includes('--commit');

async function syncAttendance() {
  try {
    console.log(`\n======================================================`);
    console.log(` Attendance Sync to Current Employee Data`);
    console.log(` Mode: ${isCommit ? '⚡ COMMIT (Will write to DB)' : '🔍 DRY-RUN (Preview only, no changes)'}`);
    console.log(`======================================================\n`);

    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch all employees with current branch, empId, and companyId
    const employees = await employee.find({})
      .select('_id employeeName empId branchId companyId')
      .populate('branchId', 'name')
      .lean();

    console.log(`📋 Found ${employees.length} employees in system.`);

    let totalDiscrepancies = 0;
    let updatedEmployeesCount = 0;
    const bulkOps = [];

    for (const emp of employees) {
      if (!emp.branchId) {
        console.warn(`⚠️ Employee [${emp.empId || emp._id}] ${emp.employeeName} has no branchId assigned. Skipping.`);
        continue;
      }

      const targetBranchId = emp.branchId._id || emp.branchId;
      const targetEmpId = emp.empId;

      // Find attendance records for this employee where branchId or empId differs
      const mismatchedRecords = await Attendance.find({
        employeeId: emp._id,
        $or: [
          { branchId: { $ne: targetBranchId } },
          { empId: { $ne: targetEmpId } }
        ]
      }).select('_id branchId empId date').lean();

      if (mismatchedRecords.length > 0) {
        totalDiscrepancies += mismatchedRecords.length;
        updatedEmployeesCount++;

        const branchName = emp.branchId.name || String(targetBranchId);
        console.log(`👉 Employee: ${emp.employeeName} (${targetEmpId || emp._id})`);
        console.log(`   Current Branch: ${branchName} (${targetBranchId})`);
        console.log(`   Out-of-sync Attendance Docs: ${mismatchedRecords.length}`);

        if (isCommit) {
          const updateFields = {
            branchId: targetBranchId
          };
          if (targetEmpId) {
            updateFields.empId = targetEmpId;
          }
          if (emp.companyId) {
            updateFields.companyId = emp.companyId;
          }

          bulkOps.push({
            updateMany: {
              filter: {
                employeeId: emp._id,
                $or: [
                  { branchId: { $ne: targetBranchId } },
                  { empId: { $ne: targetEmpId } }
                ]
              },
              update: { $set: updateFields }
            }
          });
        }
      }
    }

    console.log(`\n------------------------------------------------------`);
    console.log(` Summary:`);
    console.log(` Employees with mismatched records: ${updatedEmployeesCount}`);
    console.log(` Total attendance records out of sync: ${totalDiscrepancies}`);
    console.log(`------------------------------------------------------\n`);

    if (isCommit && bulkOps.length > 0) {
      console.log(`⏳ Executing ${bulkOps.length} bulk update operations...`);
      const result = await Attendance.bulkWrite(bulkOps);
      console.log(`✅ Bulk update complete:`);
      console.log(`   Matched count: ${result.matchedCount}`);
      console.log(`   Modified count: ${result.modifiedCount}`);
    } else if (!isCommit && totalDiscrepancies > 0) {
      console.log(`ℹ️ To apply these changes to the database, run:`);
      console.log(`   node server/scripts/syncAttendanceEmployeeBranches.js --commit\n`);
    } else if (totalDiscrepancies === 0) {
      console.log(`🎉 All attendance records are already in sync with current employees!`);
    }

  } catch (error) {
    console.error('❌ Error executing sync script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

syncAttendance();
