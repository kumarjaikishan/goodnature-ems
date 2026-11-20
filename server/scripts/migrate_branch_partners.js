const path = require('path');
const mongoose = require('mongoose');

// Load environment variables reliably regardless of cwd
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch {
  // dotenv might already be loaded by node --env-file
}

/**
 * Migration Script: Migrate Branch Partner Ledgers & Commissions
 * -------------------------------------------------------------
 * Purpose:
 * In the new 3-tier hierarchy:
 *   Branch (Organization) -> Branch Partner (BRP) -> Business Partner (BP) -> Business Associate (BA)
 *
 * 1. Guarantees every Branch Partner has their own dedicated personal sponsor ledger (ledgerType: 'sponsor').
 * 2. Deduplicates any duplicate ledgers for each Branch Partner, consolidating all entries into one main ledger.
 * 3. Migrates any historical 'commission_branch' override entries from the Branch entity's ledger to the assigned
 *    Branch Partner's personal sponsor ledger.
 * 4. Updates PlotSponsorCommission records with the Branch Partner's user _id.
 * 5. Recalculates accurate running balances for all affected ledgers.
 * 
 * Safe to run multiple times (idempotent).
 */
(async () => {
  try {
    const uri = process.env.db || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/goodfeel';
    console.log(`[Migration] Connecting to database: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    await mongoose.connect(uri);

    const Ledger = mongoose.model('ledger', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Branch = mongoose.model('Branch', new mongoose.Schema({}, { strict: false }));
    const Entry = mongoose.model('Entry', new mongoose.Schema({}, { strict: false }));
    const PlotSponsorCommission = mongoose.model('PlotSponsorCommission', new mongoose.Schema({}, { strict: false }));
    const PlotBooking = mongoose.model('PlotBooking', new mongoose.Schema({}, { strict: false }));
    const PlotProductBooking = mongoose.model('PlotProductBooking', new mongoose.Schema({}, { strict: false }));

    console.log('=== STARTING BRANCH PARTNER LEDGER MIGRATION ===');

    // 1. Find all Branch Partners
    const branchPartners = await User.find({
      $or: [
        { isBranchPartner: true },
        { sponsorCode: { $regex: '^BRP-', $options: 'i' } }
      ]
    }).lean();

    console.log(`Found ${branchPartners.length} Branch Partner(s).`);

    for (const brp of branchPartners) {
      console.log(`\n--- Processing Branch Partner: ${brp.name} (${brp.sponsorCode || 'NO_CODE'}) [_id: ${brp._id}] ---`);

      // Ensure isBranchPartner is set to true on the user doc
      await User.findByIdAndUpdate(brp._id, { $set: { isBranchPartner: true } });

      // Find all existing sponsor ledgers for this partner
      const userLedgers = await Ledger.find({ sponsorId: brp._id }).sort({ createdAt: 1 });
      let mainLedger = userLedgers[0] || null;

      if (!mainLedger) {
        mainLedger = new Ledger({
          name: brp.name || 'Branch Partner',
          sponsorId: brp._id,
          empId: brp.sponsorCode || '',
          ledgerType: 'sponsor',
          isVoucherLedger: true,
          advance: 0
        });
        await mainLedger.save();
        console.log(`  ✓ Created personal sponsor ledger for ${brp.name}: ${mainLedger._id}`);
      } else {
        mainLedger.name = brp.name || mainLedger.name;
        mainLedger.empId = brp.sponsorCode || mainLedger.empId || '';
        mainLedger.ledgerType = 'sponsor';
        mainLedger.isVoucherLedger = true;
        await mainLedger.save();
        console.log(`  ✓ Found primary personal sponsor ledger: ${mainLedger._id}`);
      }

      // Deduplicate duplicate ledgers if any exist
      if (userLedgers.length > 1) {
        console.log(`  ! Found ${userLedgers.length - 1} duplicate ledger(s). Consolidating into ${mainLedger._id}...`);
        for (let i = 1; i < userLedgers.length; i++) {
          const dup = userLedgers[i];
          console.log(`    - Merging entries from duplicate ledger ${dup._id} to ${mainLedger._id}`);
          await Entry.updateMany({ ledgerId: dup._id }, { $set: { ledgerId: mainLedger._id } });
          await Ledger.findByIdAndDelete(dup._id);
        }
      }

      // Link User to their canonical ledger
      await User.findByIdAndUpdate(brp._id, { $set: { ledgerId: mainLedger._id } });

      // Find branches associated with this Branch Partner
      const branches = await Branch.find({
        $or: [
          { branchPartnerId: brp._id },
          { branchPartnerIds: brp._id },
          ...(brp.branchIds?.length > 0 ? [{ _id: { $in: brp.branchIds } }] : [])
        ]
      }).lean();

      for (const branch of branches) {
        console.log(`  Checking Branch "${branch.name}" (${branch.branchCode || 'N/A'})...`);

        // Find branch entity ledger
        const branchLedger = await Ledger.findOne({ branchId: branch._id });
        if (branchLedger) {
          // Find all commission_branch entries on this branch ledger
          const branchCommEntries = await Entry.find({
            ledgerId: branchLedger._id,
            source: 'commission_branch'
          });

          if (branchCommEntries.length > 0) {
            console.log(`    ✓ Migrating ${branchCommEntries.length} commission_branch entries from Branch ledger (${branchLedger._id}) to Partner personal ledger (${mainLedger._id})...`);
            await Entry.updateMany(
              { ledgerId: branchLedger._id, source: 'commission_branch' },
              { $set: { ledgerId: mainLedger._id } }
            );

            // Recalculate branch ledger running balance
            const remainingBranchEntries = await Entry.find({ ledgerId: branchLedger._id }).sort({ date: 1, createdAt: 1, _id: 1 });
            let brRunning = 0;
            for (const e of remainingBranchEntries) {
              brRunning += (Number(e.credit) || 0) - (Number(e.debit) || 0);
              if (e.balance !== brRunning) {
                await Entry.findByIdAndUpdate(e._id, { $set: { balance: brRunning } });
              }
            }
            branchLedger.advance = brRunning;
            await branchLedger.save();
            console.log(`    ✓ Recalculated Branch ledger balance: ₹${brRunning}`);
          }
        }

        // Update PlotSponsorCommission records for this branch
        const updatedComms = await PlotSponsorCommission.updateMany(
          {
            branchId: branch._id,
            commissionRole: 'BRANCH_OVERRIDE',
            $or: [{ sponsorId: null }, { sponsorId: { $exists: false } }]
          },
          { $set: { sponsorId: brp._id } }
        );
        if (updatedComms.modifiedCount > 0) {
          console.log(`    ✓ Updated ${updatedComms.modifiedCount} PlotSponsorCommission record(s) to sponsorId: ${brp._id}`);
        }

        // Update bookings without branchPartnerId
        await PlotBooking.updateMany(
          { branchId: branch._id, branchPartnerId: null },
          { $set: { branchPartnerId: brp._id } }
        );
        await PlotProductBooking.updateMany(
          { branchId: branch._id, branchPartnerId: null },
          { $set: { branchPartnerId: brp._id } }
        );
      }

      // Recalculate main personal ledger balances
      const partnerEntries = await Entry.find({ ledgerId: mainLedger._id }).sort({ date: 1, createdAt: 1, _id: 1 });
      let pRunning = 0;
      for (const e of partnerEntries) {
        pRunning += (Number(e.credit) || 0) - (Number(e.debit) || 0);
        if (e.balance !== pRunning) {
          await Entry.findByIdAndUpdate(e._id, { $set: { balance: pRunning } });
        }
      }
      mainLedger.advance = pRunning;
      await mainLedger.save();
      console.log(`  ✓ Recalculated Branch Partner ledger balance: ₹${pRunning} across ${partnerEntries.length} transaction(s).`);
    }

    console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Migration ERROR]:', err);
    process.exit(1);
  }
})();
