const mongoose = require('mongoose');

const defaultRateSlabs = [
  { tenureMonths: 0, plotRate: 1000, downpaymentRate: 1000, emiRate: 0, downpaymentDays: 90, downpaymentPercent: 100, emiPercent: 0, effectiveLabel: 'Full Payment' },
  { tenureMonths: 6, plotRate: 1050, downpaymentRate: 500, emiRate: 550, downpaymentDays: 90, downpaymentPercent: 47.6, emiPercent: 52.4, effectiveLabel: '6 Months EMI' },
  { tenureMonths: 12, plotRate: 1100, downpaymentRate: 500, emiRate: 600, downpaymentDays: 90, downpaymentPercent: 45.5, emiPercent: 54.5, effectiveLabel: '12 Months EMI' },
  { tenureMonths: 18, plotRate: 1150, downpaymentRate: 500, emiRate: 650, downpaymentDays: 90, downpaymentPercent: 43.5, emiPercent: 56.5, effectiveLabel: '18 Months EMI' },
  { tenureMonths: 24, plotRate: 1200, downpaymentRate: 500, emiRate: 700, downpaymentDays: 90, downpaymentPercent: 41.7, emiPercent: 58.3, effectiveLabel: '24 Months EMI' },
  { tenureMonths: 30, plotRate: 1250, downpaymentRate: 500, emiRate: 750, downpaymentDays: 90, downpaymentPercent: 40.0, emiPercent: 60.0, effectiveLabel: '30 Months EMI' },
  { tenureMonths: 36, plotRate: 1300, downpaymentRate: 500, emiRate: 800, downpaymentDays: 90, downpaymentPercent: 38.5, emiPercent: 61.5, effectiveLabel: '36 Months EMI' },
  { tenureMonths: 42, plotRate: 1350, downpaymentRate: 500, emiRate: 850, downpaymentDays: 90, downpaymentPercent: 37.0, emiPercent: 63.0, effectiveLabel: '42 Months EMI' },
  { tenureMonths: 48, plotRate: 1400, downpaymentRate: 500, emiRate: 900, downpaymentDays: 90, downpaymentPercent: 35.7, emiPercent: 64.3, effectiveLabel: '48 Months EMI' },
  { tenureMonths: 54, plotRate: 1450, downpaymentRate: 500, emiRate: 950, downpaymentDays: 90, downpaymentPercent: 34.5, emiPercent: 65.5, effectiveLabel: '54 Months EMI' },
  { tenureMonths: 60, plotRate: 1500, downpaymentRate: 500, emiRate: 1000, downpaymentDays: 90, downpaymentPercent: 33.3, emiPercent: 66.7, effectiveLabel: '60 Months EMI' },
];

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/emscopy');
    console.log('Connected to MongoDB');
    const res = await mongoose.connection.db.collection('plotrateconfigurations').updateMany(
      {},
      { $set: { rateSlabs: defaultRateSlabs } }
    );
    console.log('Updated plotrateconfigurations count:', res.modifiedCount);
    process.exit(0);
  } catch (err) {
    console.error('Error updating rate slabs:', err);
    process.exit(1);
  }
}

run();
