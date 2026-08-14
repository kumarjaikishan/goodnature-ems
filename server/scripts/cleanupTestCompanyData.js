const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupData() {
  try {
    const mongoUri = process.env.db || process.env.MONGODB_URI || process.env.DATABASE;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;

    // 1. Identify GOODFEEL company ID and its branches
    const goodfeelCompany = await db.collection('companies').findOne({ name: 'GOODFEEL' });
    if (!goodfeelCompany) {
      console.error("GOODFEEL company not found!");
      process.exit(1);
    }
    const goodfeelCompanyId = goodfeelCompany._id;
    console.log("GOODFEEL Company ID:", goodfeelCompanyId);

    // Get branch IDs associated with GOODFEEL or with missing companyId
    const goodfeelBranches = await db.collection('branches').find({
      $or: [
        { companyId: goodfeelCompanyId },
        { companyId: { $exists: false } }
      ]
    }).toArray();

    const goodfeelBranchIds = goodfeelBranches.map(b => b._id);
    console.log("GOODFEEL Branches count:", goodfeelBranchIds.length);

    // Delete test company branches (companyId !== GOODFEEL)
    const deletedBranches = await db.collection('branches').deleteMany({
      companyId: { $exists: true, $ne: goodfeelCompanyId }
    });
    console.log("Deleted test company branches:", deletedBranches.deletedCount);

    // Delete test company record
    const deletedCompanies = await db.collection('companies').deleteMany({
      _id: { $ne: goodfeelCompanyId }
    });
    console.log("Deleted test company records:", deletedCompanies.deletedCount);

    // 2. Identify employees belonging to GOODFEEL branches (or unassigned/valid)
    const goodfeelEmployees = await db.collection('employees').find({
      $or: [
        { branchId: { $in: goodfeelBranchIds } },
        { branchId: { $exists: false } }
      ]
    }).toArray();

    const goodfeelEmployeeIds = goodfeelEmployees.map(e => e._id);
    console.log("GOODFEEL Employees count:", goodfeelEmployeeIds.length);

    // Delete test employees not in GOODFEEL branches
    const deletedEmployees = await db.collection('employees').deleteMany({
      branchId: { $exists: true, $nin: goodfeelBranchIds }
    });
    console.log("Deleted test company employees:", deletedEmployees.deletedCount);

    // 3. Clean up attendance records for non-GOODFEEL employees
    const deletedAttendances = await db.collection('attendances').deleteMany({
      employeeId: { $nin: goodfeelEmployeeIds }
    });
    console.log("Deleted test company attendances:", deletedAttendances.deletedCount);

    const remainingAttendances = await db.collection('attendances').countDocuments();
    console.log("Remaining attendances in database:", remainingAttendances);

    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
}

cleanupData();
