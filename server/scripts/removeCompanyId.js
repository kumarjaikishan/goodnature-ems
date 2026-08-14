const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const collectionsToUpdate = [
  'attendances',
  'employees',
  'users',
  'departments',
  'branches',
  'leaves',
  'leavepolicies',
  'leavebalances',
  'payrolls',
  'ledgers',
  'entries',
  'vouchers',
  'advances',
  'notices',
  'holidays',
  'plots',
  'plotbookings',
  'plotcustomers',
  'plotinstallments',
  'plotpayments',
  'plotpayoutschedules',
  'plotpayoutvouchers',
  'plotrateconfigurations',
  'plotreceipts',
  'plotseriesmasters',
  'plotsponsorcommissions'
];

async function runMigration() {
  try {
    const mongoUri = process.env.db || process.env.MONGODB_URI || process.env.DATABASE || 'mongodb://localhost:27017/ems';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const db = mongoose.connection.db;

    // STEP 1: Purge all non-GOODFEEL test company data completely
    console.log('--- Phase 1: Cleaning up non-GOODFEEL test company data ---');
    const goodfeelCompany = await db.collection('companies').findOne({ name: 'GOODFEEL' });
    
    if (goodfeelCompany) {
      const goodfeelCompanyId = goodfeelCompany._id;
      console.log('Main Company GOODFEEL ID found:', goodfeelCompanyId);

      // Find GOODFEEL branch IDs
      const goodfeelBranches = await db.collection('branches').find({
        $or: [
          { companyId: goodfeelCompanyId },
          { companyId: { $exists: false } }
        ]
      }).toArray();
      const goodfeelBranchIds = goodfeelBranches.map(b => b._id);
      console.log(`Preserving ${goodfeelBranchIds.length} branches for GOODFEEL.`);

      // Delete test branches (companyId !== GOODFEEL)
      const delBranches = await db.collection('branches').deleteMany({
        companyId: { $exists: true, $ne: goodfeelCompanyId }
      });
      console.log(`Deleted ${delBranches.deletedCount} test company branches.`);

      // Find employees of GOODFEEL
      const goodfeelEmps = await db.collection('employees').find({
        $or: [
          { branchId: { $in: goodfeelBranchIds } },
          { companyId: goodfeelCompanyId },
          { companyId: { $exists: false } }
        ]
      }).toArray();
      const goodfeelEmpIds = goodfeelEmps.map(e => e._id);
      console.log(`Preserving ${goodfeelEmpIds.length} employees for GOODFEEL.`);

      // Delete test employees
      const delEmps = await db.collection('employees').deleteMany({
        companyId: { $exists: true, $ne: goodfeelCompanyId }
      });
      console.log(`Deleted ${delEmps.deletedCount} test company employees.`);

      // Delete attendances belonging to deleted test employees / test companies
      const delAtt = await db.collection('attendances').deleteMany({
        $or: [
          { companyId: { $exists: true, $ne: goodfeelCompanyId } },
          { employeeId: { $nin: goodfeelEmpIds } }
        ]
      });
      console.log(`Deleted ${delAtt.deletedCount} test company attendance records.`);

      // Delete test company records (non-GOODFEEL)
      const delComp = await db.collection('companies').deleteMany({
        _id: { $ne: goodfeelCompanyId }
      });
      console.log(`Deleted ${delComp.deletedCount} test company records.`);
    } else {
      console.log('No company with name GOODFEEL found. Skipping selective deletion.');
    }

    console.log('--- Phase 2: Removing companyId fields and indexes across all collections ---');

    for (const collName of collectionsToUpdate) {
      try {
        const result = await db.collection(collName).updateMany(
          { companyId: { $exists: true } },
          { $unset: { companyId: "" } }
        );
        console.log(`Collection '${collName}': Unset companyId in ${result.modifiedCount} documents.`);

        // Drop companyId indexes if present
        const indexes = await db.collection(collName).indexes();
        for (const idx of indexes) {
          if (idx.key && idx.key.companyId) {
            console.log(`Dropping index '${idx.name}' on collection '${collName}'...`);
            await db.collection(collName).dropIndex(idx.name);
          }
        }
      } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
          console.log(`Collection '${collName}' does not exist yet. Skipping.`);
        } else {
          console.error(`Error updating collection '${collName}':`, err.message);
        }
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
