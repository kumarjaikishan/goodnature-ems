const mongoose = require('mongoose');

const plotPayoutScheduleSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlotBooking',
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'PAID', 'MISSED'],
      default: 'SCHEDULED',
    },
  },
  {
    timestamps: true,
  }
);

plotPayoutScheduleSchema.index({ bookingId: 1, weekNumber: 1 });
plotPayoutScheduleSchema.index({ status: 1 });

module.exports = mongoose.model('PlotPayoutSchedule', plotPayoutScheduleSchema);
