const mongoose = require('mongoose');

const plotSponsorCommissionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
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

module.exports = mongoose.model('PlotSponsorCommission', plotSponsorCommissionSchema);
