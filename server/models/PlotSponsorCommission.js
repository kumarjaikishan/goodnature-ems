const mongoose = require('mongoose');

const plotSponsorCommissionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: false,
    },
    productBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotProductBooking',
      default: null,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotReceipt',
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotInstallment',
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotCustomer',
      required: true,
    },
    collectionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercent: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRole: {
      type: String,
      enum: ['PROMOTER', 'DEVELOPER_OVERRIDE', 'DIRECT_DEVELOPER'],
      default: 'PROMOTER',
    },
    plotValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    tierTenureMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'reversed'],
      default: 'active',
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
    businessType: {
      type: String,
      enum: ['PLOT_SALE', 'INVESTMENT_RD_FD', 'PLOT_PRODUCT'],
      default: 'PLOT_SALE',
    },
    periodVolume: {
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
    closingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotClosing',
      default: null,
    },
    extraClosingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotClosing',
      default: null,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

plotSponsorCommissionSchema.index({ sponsorId: 1 });
plotSponsorCommissionSchema.index({ bookingId: 1 });
plotSponsorCommissionSchema.index({ closingId: 1, createdAt: -1 });
plotSponsorCommissionSchema.index({ extraClosingId: 1, createdAt: -1 });
plotSponsorCommissionSchema.index({ status: 1, closingId: 1, createdAt: 1 });
plotSponsorCommissionSchema.index({ status: 1, extraClosingId: 1, createdAt: 1 });
// Commission report sorts by createdAt and filters by status.
plotSponsorCommissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PlotSponsorCommission', plotSponsorCommissionSchema);
