const mongoose = require('mongoose');

const schemeSlabSchema = new mongoose.Schema(
  {
    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    rdMaturityPercent: {
      type: Number,
      required: true,
      min: 100, // e.g., 112 for 112%
    },
    fdMaturityPercent: {
      type: Number,
      required: true,
      min: 100, // e.g., 121 for 121%
    },
    rdPromoterCommissionPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    fdPromoterCommissionPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    developerCommissionPercent: {
      type: Number,
      default: 1.0, // 1% override for business developer
      min: 0,
    },
  },
  { _id: false }
);

const investmentSchemeConfigSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    minRdAmount: {
      type: Number,
      default: 1000,
    },
    rdStepAmount: {
      type: Number,
      default: 1000,
    },
    minFdAmount: {
      type: Number,
      default: 10000,
    },
    fdStepAmount: {
      type: Number,
      default: 10000,
    },
    prematureAnnualInterestPercent: {
      type: Number,
      default: 6.0, // fallback
    },
    rdPrematureAnnualInterestPercent: {
      type: Number,
      default: 6.0, // R.D. simple interest rate for premature settlement
    },
    fdPrematureAnnualInterestPercent: {
      type: Number,
      default: 6.0, // F.D. simple interest rate for premature settlement
    },
    slabs: {
      type: [schemeSlabSchema],
      default: [
        {
          tenureMonths: 24,
          rdMaturityPercent: 112,
          fdMaturityPercent: 121,
          rdPromoterCommissionPercent: 4.0,
          fdPromoterCommissionPercent: 5.0,
          developerCommissionPercent: 1.0,
        },
        {
          tenureMonths: 36,
          rdMaturityPercent: 120,
          fdMaturityPercent: 135,
          rdPromoterCommissionPercent: 5.0,
          fdPromoterCommissionPercent: 7.0,
          developerCommissionPercent: 1.0,
        },
        {
          tenureMonths: 48,
          rdMaturityPercent: 130,
          fdMaturityPercent: 150,
          rdPromoterCommissionPercent: 6.0,
          fdPromoterCommissionPercent: 9.0,
          developerCommissionPercent: 1.0,
        },
        {
          tenureMonths: 60,
          rdMaturityPercent: 140,
          fdMaturityPercent: 175,
          rdPromoterCommissionPercent: 8.0,
          fdPromoterCommissionPercent: 11.0,
          developerCommissionPercent: 1.0,
        },
        {
          tenureMonths: 72,
          rdMaturityPercent: 150,
          fdMaturityPercent: 200,
          rdPromoterCommissionPercent: 10.0,
          fdPromoterCommissionPercent: 13.0,
          developerCommissionPercent: 1.0,
        },
        {
          tenureMonths: 120,
          rdMaturityPercent: 200,
          fdMaturityPercent: 350,
          rdPromoterCommissionPercent: 12.0,
          fdPromoterCommissionPercent: 15.0,
          developerCommissionPercent: 1.0,
        },
      ],
    },
    rulesAndRegulations: {
      type: [String],
      default: [
        'Certificate of Deposit must be preserved and submitted during maturity or premature claim.',
        'Recurring Deposit (R.D.) installments must be deposited by the 10th of every calendar month.',
        'Fixed Deposit (F.D.) returns are guaranteed at the agreed maturity percentage upon completion of tenure.',
        'Premature closure before completion of full tenure will be subject to company premature settlement terms and applicable deductions.',
        'Nominee claims will require valid death certificate, identity proof, and verification of succession.',
      ],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvestmentSchemeConfig', investmentSchemeConfigSchema);
