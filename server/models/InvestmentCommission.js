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
    payoutVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
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
