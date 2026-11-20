/**
 * Script: find_duplicate_customers.js
 * Purpose: Connect to MongoDB, scan PlotCustomer collection for duplicate Aadhaar numbers,
 *          identify the original (oldest/first) record and all duplicate records,
 *          and write a detailed duplicate report to a TXT file.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function normalizeAadhaar(aadhaar) {
  if (!aadhaar) return '';
  return String(aadhaar).replace(/\D/g, '').trim();
}

async function run() {
  const mongoUri = process.env.db;
  if (!mongoUri) {
    console.error('Error: "db" connection string missing from server/.env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully.');

  // Reference PlotCustomer and User (for sponsor populate)
  require('../models/user');
  const PlotCustomer = require('../models/PlotCustomer');

  console.log('Fetching customers...');
  // Sort by createdAt ascending (or _id ascending) so the first registered is considered the ORIGINAL
  const customers = await PlotCustomer.find({})
    .populate('sponsorId', 'name sponsorCode username')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  console.log(`Loaded ${customers.length} total customers.`);

  // Group by normalized Aadhaar number
  const aadhaarGroups = new Map();

  for (const c of customers) {
    const rawAadhaar = c.aadhaarCard || '';
    const cleanAadhaar = normalizeAadhaar(rawAadhaar);

    // Skip empty or invalid dummy numbers if less than 8-12 digits
    if (!cleanAadhaar) continue;

    if (!aadhaarGroups.has(cleanAadhaar)) {
      aadhaarGroups.set(cleanAadhaar, []);
    }
    aadhaarGroups.get(cleanAadhaar).push(c);
  }

  // Filter groups with > 1 customers
  const duplicateGroups = [];
  for (const [aadhaar, list] of aadhaarGroups.entries()) {
    if (list.length > 1) {
      duplicateGroups.push({ aadhaar, list });
    }
  }

  console.log(`Found ${duplicateGroups.length} unique Aadhaar numbers with duplicates.`);

  // Prepare TXT report
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outFileName = `duplicate_customers_aadhaar_${timestampStr}.txt`;
  const outFilePath = path.join(__dirname, outFileName);

  let totalDuplicateEntriesCount = 0;
  let reportLines = [];

  reportLines.push('================================================================================');
  reportLines.push('                     GOOD NATURE EMS - DUPLICATE CUSTOMER REPORT                ');
  reportLines.push('                         BASED ON SAME AADHAAR CARD NUMBER                      ');
  reportLines.push('================================================================================');
  reportLines.push(`Generated On: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`);
  reportLines.push(`Total Customers Scanned : ${customers.length}`);
  reportLines.push(`Duplicate Aadhaar Groups : ${duplicateGroups.length}`);
  reportLines.push('================================================================================\n');

  if (duplicateGroups.length === 0) {
    reportLines.push('✓ No duplicate customers found with the same Aadhaar Card Number.');
  } else {
    duplicateGroups.forEach((group, groupIdx) => {
      const { aadhaar, list } = group;
      const original = list[0];
      const duplicates = list.slice(1);
      totalDuplicateEntriesCount += duplicates.length;

      reportLines.push(`--------------------------------------------------------------------------------`);
      reportLines.push(`GROUP #${groupIdx + 1} | AADHAAR CARD: "${aadhaar}" (Total Matching: ${list.length})`);
      reportLines.push(`--------------------------------------------------------------------------------`);

      // Original Entry
      const origCreated = original.createdAt ? new Date(original.createdAt).toLocaleString('en-IN') : 'N/A';
      const origSponsor = original.sponsorId ? `${original.sponsorId.name || ''} (${original.sponsorId.sponsorCode || ''})` : 'Company (Direct)';
      reportLines.push(`  [ORIGINAL ENTRY - 1st Registered]`);
      reportLines.push(`    Customer ID    : ${original.customerId || original.customerCode || 'N/A'} (MongoDB _id: ${original._id})`);
      reportLines.push(`    Name           : ${original.name || 'N/A'}`);
      reportLines.push(`    Mobile         : ${original.mobile || 'N/A'}`);
      reportLines.push(`    Raw Aadhaar    : ${original.aadhaarCard || 'N/A'}`);
      reportLines.push(`    PAN Card       : ${original.panCard || 'N/A'}`);
      reportLines.push(`    Assigned BA/BP : ${origSponsor}`);
      reportLines.push(`    Created At     : ${origCreated}`);
      reportLines.push(``);

      // Duplicate Entries
      duplicates.forEach((dup, dupIdx) => {
        const dupCreated = dup.createdAt ? new Date(dup.createdAt).toLocaleString('en-IN') : 'N/A';
        const dupSponsor = dup.sponsorId ? `${dup.sponsorId.name || ''} (${dup.sponsorId.sponsorCode || ''})` : 'Company (Direct)';
        reportLines.push(`  [DUPLICATE #${dupIdx + 1} -> Duplicating Original: ${original.customerId || original._id}]`);
        reportLines.push(`    Customer ID    : ${dup.customerId || dup.customerCode || 'N/A'} (MongoDB _id: ${dup._id})`);
        reportLines.push(`    Name           : ${dup.name || 'N/A'}`);
        reportLines.push(`    Mobile         : ${dup.mobile || 'N/A'}`);
        reportLines.push(`    Raw Aadhaar    : ${dup.aadhaarCard || 'N/A'}`);
        reportLines.push(`    PAN Card       : ${dup.panCard || 'N/A'}`);
        reportLines.push(`    Assigned BA/BP : ${dupSponsor}`);
        reportLines.push(`    Created At     : ${dupCreated}`);
        reportLines.push(``);
      });
      reportLines.push(``);
    });

    reportLines.push('================================================================================');
    reportLines.push(`SUMMARY:`);
    reportLines.push(`  Unique Duplicate Aadhaar Numbers : ${duplicateGroups.length}`);
    reportLines.push(`  Total Redundant/Duplicate Records: ${totalDuplicateEntriesCount}`);
    reportLines.push('================================================================================\n');
  }

  const finalOutput = reportLines.join('\n');
  fs.writeFileSync(outFilePath, finalOutput, 'utf-8');

  console.log(`\nReport written to: ${outFilePath}`);
  console.log(`Total duplicate records found: ${totalDuplicateEntriesCount}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
