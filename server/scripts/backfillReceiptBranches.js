require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const PlotReceipt = require('../models/PlotReceipt');
const User = require('../models/user');
const Employee = require('../models/employee');
const Branch = require('../models/branch');

const DB_URI = process.env.db;

async function backfill() {
  if (!DB_URI) {
    console.error('Error: process.env.db is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(DB_URI);
  console.log('Connected to MongoDB for PlotReceipt branch backfill');

  const defaultBranch = await Branch.findOne();
  if (!defaultBranch) {
    console.warn('Warning: No default branch found in database');
  }

  const receiptsWithoutBranch = await PlotReceipt.find({
    $or: [{ branchId: { $exists: false } }, { branchId: null }]
  });

  console.log(`Found ${receiptsWithoutBranch.length} receipts requiring branch backfill`);

  let updatedCount = 0;
  for (const receipt of receiptsWithoutBranch) {
    let resolvedBranchId = null;

    if (receipt.createdBy) {
      const user = await User.findById(receipt.createdBy);
      if (user?.branchIds?.length > 0) {
        resolvedBranchId = user.branchIds[0];
      } else if (user?.employeeId) {
        const emp = await Employee.findById(user.employeeId);
        if (emp?.branchId) resolvedBranchId = emp.branchId;
      }
    }

    if (!resolvedBranchId && defaultBranch) {
      resolvedBranchId = defaultBranch._id;
    }

    if (resolvedBranchId) {
      receipt.branchId = resolvedBranchId;
      await receipt.save();
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled branchId on ${updatedCount} receipts`);
  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
