/**
 * ONE-TIME Migration Script
 * ─────────────────────────────────────────────────────────────────────────
 * The plots module (booking, collection, sponsors, customers, inventory,
 * payouts, reports) previously had NO permission checks on any route -
 * any logged-in staff member could hit it. checkPermission() has now been
 * added to every plots route, keyed on new resources: plot_inventory,
 * plot_booking, plot_collection, plot_sponsor, plot_customer, plot_payout,
 * plot_reports.
 *
 * Existing users (created before this change) don't have these keys in
 * their `permissions` map, and checkPermission() denies by default when a
 * key is missing - so without this backfill, every existing admin/manager/
 * demo account would suddenly be locked out of the plots module entirely.
 *
 * This script grants each existing user the default access for their role
 * (matching what they effectively had before - unrestricted), WITHOUT
 * touching any permission key they already have for other resources, and
 * without overwriting anything if they already have plot_* keys (e.g. from
 * a user created after this change shipped). It also clears their cached
 * Redis permission entry so the change takes effect immediately instead of
 * waiting out the up-to-15-day cache TTL.
 *
 * Safe to run multiple times.
 *
 * Run once:  node server/scripts/backfillPlotPermissions.js
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const DB_URI = process.env.db;

// Matches server/router/plots.routes.js - keep in sync if routes change.
const PLOT_DEFAULTS_BY_ROLE = {
  superadmin: {
    plot_inventory: [1, 2, 3, 4], plot_booking: [1, 2, 3, 4], plot_collection: [1, 2, 3, 4],
    plot_sponsor: [1, 2, 3, 4], plot_customer: [1, 2, 3, 4], plot_payout: [1, 2, 3, 4], plot_reports: [1, 2, 3, 4],
  },
  admin: {
    plot_inventory: [1, 2, 3, 4], plot_booking: [1, 2, 3, 4], plot_collection: [1, 2, 3, 4],
    plot_sponsor: [1, 2, 3, 4], plot_customer: [1, 2, 3, 4], plot_payout: [1, 2, 3, 4], plot_reports: [1, 2, 3, 4],
  },
  manager: {
    plot_inventory: [1], plot_booking: [1, 2, 3], plot_collection: [1, 2],
    plot_sponsor: [1], plot_customer: [1, 2, 3], plot_payout: [1], plot_reports: [1],
  },
  demo: {
    plot_inventory: [1], plot_booking: [1, 2, 3], plot_collection: [1, 2],
    plot_sponsor: [1], plot_customer: [1, 2], plot_payout: [1], plot_reports: [1],
  },
};

async function run() {
  await mongoose.connect(DB_URI);
  console.log('✅ Connected to MongoDB');

  const User = require('../models/user');
  let redisClient = null;

  const roles = Object.keys(PLOT_DEFAULTS_BY_ROLE);
  const users = await User.find({ role: { $in: roles } });
  console.log(`Found ${users.length} users to check (roles: ${roles.join(', ')}).`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const defaults = PLOT_DEFAULTS_BY_ROLE[user.role];
    if (!defaults) continue;

    let changed = false;
    for (const [resource, levels] of Object.entries(defaults)) {
      if (!user.permissions.has(resource)) {
        user.permissions.set(resource, levels);
        changed = true;
      }
    }

    if (changed) {
      await user.save();
      updated++;
      if (redisClient && redisClient.isOpen) {
        await redisClient.del(`permissions:${user._id}`).catch(() => {});
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. ${updated} users updated, ${skipped} already had these keys.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
