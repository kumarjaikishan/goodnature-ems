const mongoose = require('mongoose');

const investmentCommissionSchema = new mongoose.Schema(
  {
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentReceipt',
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentAccount',
      required: true,
      index: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sponsorRole: {
      type: String,
      enum: ['PROMOTER', 'DEVELOPER', 'DIRECT_DEVELOPER'],
      required: true,
    },
    collectedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    fixedPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    incentivePercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    fixedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    incentiveAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    slabLabel: {
      type: String,
      default: '',
    },
    rewardTitle: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['EARNED', 'HOLD', 'PAID', 'CANCELLED'],
      default: 'EARNED',
      index: true,
    },
    closingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotClosing',
      default: null,
      index: true,
    },
    extraClosingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotClosing',
      default: null,
      index: true,
    },
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
      default: null,
    },
    extraLedgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry',
      default: null,
    },
    payoutVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
    },
    extraIncentivePercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraIncentiveAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    earnedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvestmentCommission', investmentCommissionSchema);
