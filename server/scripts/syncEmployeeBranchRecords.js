/**
 * Sync All Employee-Linked Records to Current Employee Branch
 * ─────────────────────────────────────────────────────────────────────────────
 * Purpose:
 * When an employee is transferred to another branch, historical records in
 * Attendance, Ledger, Leave, LeaveBalance, WeeklyOffLedger, Advance, Payroll,
 * and Voucher may still point to the employee's previous branchId.
 * That prevents deleting the old branch cleanly.
 *
 * This script:
 * 1. Reads all employees and their current `branchId` (and `empId` / `companyId`).
 * 2. Scans all employee-linked collections for records whose `branchId` differs
 *    from the employee's current `branchId`.
 * 3. Defaults to --dry-run (preview only, no DB writes).
 * 4. Pass --commit to apply the bulk updates.
 *
 * Usage:
 *   Dry run:  node server/scripts/syncEmployeeBranchRecords.js
 *   Execute:  node server/scripts/syncEmployeeBranchRecords.js --commit
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
require('../models/branch');
require('../models/company');
const Employee = require('../models/employee');
const Attendance = require('../models/attandence');
const Ledger = require('../models/ledger');
const Leave = require('../models/leave');
const LeaveBalance = require('../models/leavebalance');
const WeeklyOffLedger = require('../models/weeklyOffLedger');
const Advance = require('../models/advance');
const Payroll = require('../models/payroll');
const Voucher = require('../models/voucher');

const DB_URI = process.env.db || 'mongodb://127.0.0.1:27017/goodfeel';
const isCommit = process.argv.includes('--commit');

const TARGET_MODELS = [
  { name: 'Attendance', model: Attendance, syncEmpId: true },
  { name: 'Ledger', model: Ledger, syncEmpId: true },
  { name: 'Leave', model: Leave, syncEmpId: false },
  { name: 'LeaveBalance', model: LeaveBalance, syncEmpId: false },
  { name: 'WeeklyOffLedger', model: WeeklyOffLedger, syncEmpId: false },
  { name: 'Advance', model: Advance, syncEmpId: false },
  { name: 'Payroll', model: Payroll, syncEmpId: false },
  { name: 'Voucher', model: Voucher, syncEmpId: false },
];

async function syncEmployeeBranchRecords() {
  try {
    console.log('\n==============================================================');
    console.log(' Sync Employee-Linked Records to Current Employee Branch');
    console.log(` Mode: ${isCommit ? 'COMMIT (Will write to DB)' : 'DRY-RUN (Preview only, no changes)'}`);
    console.log('==============================================================\n');

    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');

    const employees = await Employee.find({})
      .select('_id employeeName empId branchId companyId')
      .populate('branchId', 'name')
      .lean();

    console.log(`Found ${employees.length} employee(s).\n`);

    const summaryByModel = {};
    for (const entry of TARGET_MODELS) {
      summaryByModel[entry.name] = { matched: 0, modified: 0, bulkOps: [] };
    }

    let totalMismatchedDocs = 0;

    for (const emp of employees) {
      if (!emp.branchId) {
        console.warn(`Skipping employee [${emp.empId || emp._id}] ${emp.employeeName || 'Unknown'} — no branchId assigned.`);
        continue;
      }

      const targetBranchId = emp.branchId._id || emp.branchId;
      const targetBranchName = emp.branchId.name || String(targetBranchId);
      const empDiscrepancies = [];

      for (const { name, model, syncEmpId } of TARGET_MODELS) {
        const mismatchFilter = {
          employeeId: emp._id,
          branchId: { $ne: targetBranchId },
        };

        const count = await model.countDocuments(mismatchFilter);
        if (count > 0) {
          totalMismatchedDocs += count;
          summaryByModel[name].matched += count;
          empDiscrepancies.push(`${name}: ${count}`);

          if (isCommit) {
            const updateFields = { branchId: targetBranchId };
            if (syncEmpId && emp.empId) {
              updateFields.empId = emp.empId;
            }
            if (emp.companyId) {
              updateFields.companyId = emp.companyId;
            }

            summaryByModel[name].bulkOps.push({
              updateMany: {
                filter: mismatchFilter,
                update: { $set: updateFields },
              },
            });
          }
        }
      }

      if (empDiscrepancies.length > 0) {
        console.log(`Employee: ${emp.employeeName || 'Unnamed'} (${emp.empId || emp._id}) -> ${targetBranchName} (${targetBranchId})`);
        console.log(`   Mismatched records: ${empDiscrepancies.join(', ')}`);
      }
    }

    if (isCommit && totalMismatchedDocs > 0) {
      console.log('\nExecuting bulk updates...');
      for (const { name, model } of TARGET_MODELS) {
        const ops = summaryByModel[name].bulkOps;
        if (ops.length > 0) {
          const result = await model.bulkWrite(ops);
          summaryByModel[name].modified = result.modifiedCount || 0;
        }
      }
    }

    console.log('\n--------------------------------------------------------------');
    console.log(' Summary by Collection:');
    for (const { name } of TARGET_MODELS) {
      const s = summaryByModel[name];
      if (s.matched > 0 || isCommit) {
        console.log(`   ${name.padEnd(18)} | Out-of-sync: ${String(s.matched).padStart(4)}${isCommit ? ` | Updated: ${String(s.modified).padStart(4)}` : ''}`);
      }
    }
    console.log(` Total out-of-sync records: ${totalMismatchedDocs}`);
    console.log('--------------------------------------------------------------\n');

    if (!isCommit && totalMismatchedDocs > 0) {
      console.log('To apply these updates to the database, run:');
      console.log('  node server/scripts/syncEmployeeBranchRecords.js --commit\n');
    } else if (totalMismatchedDocs === 0) {
      console.log('All employee-linked records are already in sync with their current branch!');
    }
  } catch (error) {
    console.error('Error executing branch sync script:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

syncEmployeeBranchRecords();
