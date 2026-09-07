require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  const DB_URI = process.env.db;
  console.log('Connecting to:', DB_URI);
  await mongoose.connect(DB_URI);

  const Plot = require('../models/Plot');
  const PlotBooking = require('../models/PlotBooking');

  // Find all active bookings
  const activeBookings = await PlotBooking.find({ status: { $ne: 'CANCELLED' } }).lean();
  console.log(`Found ${activeBookings.length} active bookings.`);

  const bookedPlotIdSet = new Set();
  const holdPlotIdSet = new Set();

  for (const b of activeBookings) {
    if (!b.plotId) continue;
    const pid = String(b.plotId);
    if (b.status === 'HOLD' || b.bookingType === 'HOLD') {
      holdPlotIdSet.add(pid);
    } else {
      bookedPlotIdSet.add(pid);
    }
  }

  // Find all plots
  const allPlots = await Plot.find({});
  console.log(`Total plots in DB: ${allPlots.length}`);

  let updatedCount = 0;
  for (const plot of allPlots) {
    const pid = String(plot._id);
    let correctStatus = 'AVAILABLE';
    if (bookedPlotIdSet.has(pid)) {
      correctStatus = 'BOOKED';
    } else if (holdPlotIdSet.has(pid)) {
      correctStatus = 'HOLD';
    } else if (plot.status === 'REGISTERED') {
      // If marked registered without active booking, check
      correctStatus = plot.status;
    }

    if (plot.status !== correctStatus && (plot.status === 'BOOKED' || plot.status === 'HOLD')) {
      console.log(`Plot ${plot.plotNumber} (${plot._id}) status is "${plot.status}" but has no active booking. Resetting to "${correctStatus}".`);
      plot.status = correctStatus;
      await plot.save();
      updatedCount++;
    }
  }

  console.log(`Sync complete. Reconciled ${updatedCount} stuck/orphaned plot(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error running sync:', err);
  process.exit(1);
});
