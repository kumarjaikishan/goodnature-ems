const mongoose = require('mongoose');

const plotSponsorCommissionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
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
  },
  {
    timestamps: true,
  }
);

plotSponsorCommissionSchema.index({ sponsorId: 1 });
plotSponsorCommissionSchema.index({ bookingId: 1 });
// Commission report sorts by createdAt and filters by status.
plotSponsorCommissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PlotSponsorCommission', plotSponsorCommissionSchema);
