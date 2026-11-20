const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
(async () => {
  try {
    const uri = process.env.db || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goodfeel';
    await mongoose.connect(uri);
    const PlotBooking = mongoose.model('PlotBooking', new mongoose.Schema({}, { strict: false }));
    const InvestmentSchemeConfig = mongoose.model('InvestmentSchemeConfig', new mongoose.Schema({}, { strict: false }));
    const PlotReceipt = mongoose.model('PlotReceipt', new mongoose.Schema({}, { strict: false }));
    const PlotSponsorCommission = mongoose.model('PlotSponsorCommission', new mongoose.Schema({}, { strict: false }));

    const booking = await PlotBooking.findOne({ bookingNumber: /002$/ }).lean();
    console.log('BOOKING #002:', {
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      scheme: booking.scheme,
      paymentType: booking.paymentType,
      tenureMonths: booking.tenureMonths,
      planName: booking.planName,
      downpaymentPromoterCommissionPercent: booking.downpaymentPromoterCommissionPercent,
      downpaymentBpCommissionPercent: booking.downpaymentBpCommissionPercent,
      downpaymentBranchCommissionPercent: booking.downpaymentBranchCommissionPercent,
      emiPromoterCommissionPercent: booking.emiPromoterCommissionPercent,
      emiBpCommissionPercent: booking.emiBpCommissionPercent,
      emiBranchCommissionPercent: booking.emiBranchCommissionPercent,
      promoterCommissionPercent: booking.promoterCommissionPercent,
      bpCommissionPercent: booking.bpCommissionPercent,
      branchCommissionPercent: booking.branchCommissionPercent,
    });

    const cfg = await InvestmentSchemeConfig.findOne({ status: 'active' }).lean();
    console.log('ACTIVE SCHEME CONFIG SLABS:');
    if (cfg && cfg.slabs) {
      cfg.slabs.forEach(s => {
        console.log(`Plan: ${s.planName}, Tenure: ${s.tenureMonths}, BA DP: ${s.fdPromoterCommissionPercent}, BA EMI: ${s.rdPromoterCommissionPercent}, BP DP: ${s.bpFdCommissionPercent}, BP EMI: ${s.bpRdCommissionPercent}, Branch DP: ${s.branchFdCommissionPercent}, Branch EMI: ${s.branchRdCommissionPercent}`);
      });
    }

    const comms = await PlotSponsorCommission.find({ bookingId: booking._id }).lean();
    console.log('COMMISSIONS FOR BOOKING 002:');
    comms.forEach(c => {
      console.log(`Role: ${c.commissionRole}, FixedPct: ${c.fixedPercent}, FixedAmt: ${c.fixedAmount}, Amt: ${c.amount}, BaseCol: ${c.collectionAmount}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
})();
