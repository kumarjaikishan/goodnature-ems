const mongoose = require('mongoose');

const investmentAccountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['RD', 'FD'],
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotCustomer',
      required: true,
      index: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Deposit Figures
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    }, // Monthly amount for RD, Principal amount for FD
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    totalDepositExpected: {
      type: Number,
      required: true,
      min: 0,
    }, // Monthly * tenure for RD, Principal for FD
    maturityRatePercent: {
      type: Number,
      required: true,
      min: 0,
    },
    maturityAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidInstallmentsCount: {
      type: Number,
      default: 0,
    },
    totalInstallmentsCount: {
      type: Number,
      default: 1,
    },
    // Commission Rates Snapshot
    promoterCommissionPercent: {
      type: Number,
      default: 0,
    },
    developerCommissionPercent: {
      type: Number,
      default: 1.0,
    },
    // Dates
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    maturityDate: {
      type: Date,
      required: true,
    },
    // Nominee Details
    nominee: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      age: { type: Number, default: null },
      mobile: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    // Status
    status: {
      type: String,
      enum: ['ACTIVE', 'MATURED', 'PREMATURE_CLOSED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    settlementDetails: {
      settledAt: { type: Date, default: null },
      settledAmount: { type: Number, default: 0 },
      settlementType: { type: String, enum: ['MATURITY', 'PREMATURE', 'REFUND'], default: null },
      paymentMode: { type: String, default: '' },
      referenceNumber: { type: String, default: '' },
      remarks: { type: String, default: '' },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvestmentAccount', investmentAccountSchema);
