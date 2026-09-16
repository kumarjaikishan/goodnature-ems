const mongoose = require('mongoose');
const ApiError = require('../../utils/apiError');
const PlotBooking = require('../../models/PlotBooking');
const PlotPayoutSchedule = require('../../models/PlotPayoutSchedule');
const PlotPayoutVoucher = require('../../models/PlotPayoutVoucher');
const PlotAuditLog = require('../../models/PlotAuditLog');
const Counter = require('../../models/Counter');

class PlotPayoutService {
  async initializePlotPayout(bookingId, startDate, weeklyAmount, userId) {
    const booking = await PlotBooking.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');

    // Check if fully paid
    if (booking.remainingAmount > 0) {
      throw ApiError.badRequest('Booking is not fully paid yet');
    }
    if (booking.scheme !== 'FULL_PAYMENT') {
      throw ApiError.badRequest('Weekly payout return is only available for FULL_PAYMENT scheme');
    }

    const start = new Date(startDate || Date.now());
    const amt = Math.round((booking.plotValue / 500) * 100) / 100;

    booking.payoutStatus = 'ACTIVE';
    booking.payoutStartDate = start;
    booking.payoutWeeklyAmount = amt;
    booking.payoutNextDueDate = new Date(start);

    // Delete any existing stray payout schedules for this booking
    await PlotPayoutSchedule.deleteMany({ bookingId });

    // Instantly accrue weeks that have already elapsed between start date and today
    const now = new Date();
    let weekCount = 0;
    while (now >= booking.payoutNextDueDate && weekCount < 500) {
      weekCount++;
      const nextSchedule = new PlotPayoutSchedule({
        bookingId: booking._id,
        weekNumber: weekCount,
        dueDate: new Date(booking.payoutNextDueDate),
        amount: amt,
        status: 'SCHEDULED',
      });
      await nextSchedule.save();

      // Advance by 7 days
      const nextDate = new Date(booking.payoutNextDueDate);
      nextDate.setDate(nextDate.getDate() + 7);
      booking.payoutNextDueDate = nextDate;
    }

    if (weekCount >= 500) {
      booking.payoutStatus = 'COMPLETED';
    }

    await booking.save();

    // Audit log
    await new PlotAuditLog({
      action: 'INITIALIZE_PAYOUT',
      modelName: 'PlotBooking',
      documentId: booking._id,
      userId,
      details: { startDate: start, weeklyAmount: amt, initialWeeksAccrued: weekCount },
    }).save();

    return booking;
  }

  async payoutCronJobLogic() {
    const bookings = await PlotBooking.find({ payoutStatus: 'ACTIVE' });
    console.log(`[PlotPayoutCron] Found ${bookings.length} active payout bookings.`);

    for (const booking of bookings) {
      const now = new Date();
      let accrued = false;

      while (now >= booking.payoutNextDueDate) {
        // Find current max weekNumber
        const lastSchedule = await PlotPayoutSchedule.findOne({ bookingId: booking._id }).sort({ weekNumber: -1 });
        const nextWeekNum = lastSchedule ? lastSchedule.weekNumber + 1 : 1;

        if (nextWeekNum > 500) {
          booking.payoutStatus = 'COMPLETED';
          accrued = true;
          break;
        }

        const newSchedule = new PlotPayoutSchedule({
          bookingId: booking._id,
          weekNumber: nextWeekNum,
          dueDate: new Date(booking.payoutNextDueDate),
          amount: booking.payoutWeeklyAmount || Math.round((booking.plotValue / 500) * 100) / 100,
          status: 'SCHEDULED',
        });
        await newSchedule.save();

        console.log(`[PlotPayoutCron] Accrued week #${nextWeekNum} of ₹${booking.payoutWeeklyAmount} for booking ${booking.bookingNumber}`);

        // Advance by 7 days
        const nextDate = new Date(booking.payoutNextDueDate);
        nextDate.setDate(nextDate.getDate() + 7);
        booking.payoutNextDueDate = nextDate;
        accrued = true;
      }

      if (accrued) {
        await booking.save();
      }
    }
  }

  async collectPlotPayoutPayment(bookingId, amountPaid, paymentMode, transactionReference, remarks, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await PlotBooking.findById(bookingId).session(session);
      if (!booking) throw ApiError.notFound('Booking not found');

      // Get all scheduled payouts sorted by due date
      const schedules = await PlotPayoutSchedule.find({
        bookingId,
        status: { $ne: 'PAID' }
      }).sort({ dueDate: 1 }).session(session);

      const totalDue = schedules.reduce((sum, s) => sum + (s.amount - s.paidAmount), 0);
      if (amountPaid <= 0) throw ApiError.badRequest('Amount paid must be greater than zero');
      if (amountPaid > totalDue) {
        throw ApiError.badRequest(`Amount paid (₹${amountPaid}) cannot exceed total accumulated due payout (₹${totalDue})`);
      }

      // Increment Sequence Counter for payout voucher (RO-PPV-YYMM-XXXX) using Mongoose Counter schema
      const now = new Date();
      const currentYear = now.getFullYear().toString().slice(-2);
      const nextYear = (now.getFullYear() + 1).toString().slice(-2);
      const yearStr = `${currentYear}${nextYear}`;

      const voucherNumber = await Counter.getNextSequence(`RO-PPV-${yearStr}`, session, 4);

      const voucher = new PlotPayoutVoucher({
        voucherNumber,
        bookingId,
        customerId: booking.customerId,
        amountPaid,
        paymentMode,
        transactionReference,
        remarks,
        payoutDate: new Date(),
        processedBy: userId,
      });
      await voucher.save({ session });

      // Distribute amountPaid across schedules FIFO
      let remaining = amountPaid;
      for (const s of schedules) {
        const unpaid = s.amount - s.paidAmount;
        if (remaining >= unpaid) {
          s.paidAmount = s.amount;
          s.status = 'PAID';
          s.paidDate = new Date();
          remaining -= unpaid;
        } else {
          s.paidAmount += remaining;
          s.status = 'SCHEDULED';
          remaining = 0;
        }
        await s.save({ session });
        if (remaining <= 0) break;
      }

      await new PlotAuditLog({
        action: 'COLLECT_PAYOUT_PAYMENT',
        modelName: 'PlotPayoutVoucher',
        documentId: voucher._id,
        userId,
        details: { voucherNumber, amountPaid },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();

      return voucher;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getPlotPayoutLedger(bookingId) {
    const booking = await PlotBooking.findById(bookingId)
      .populate('customerId', 'name customerId mobile address')
      .populate('plotId', 'plotNumber plotSize plotType');
    if (!booking) throw ApiError.notFound('Booking not found');

    const schedules = await PlotPayoutSchedule.find({ bookingId }).sort({ weekNumber: 1 });
    const vouchers = await PlotPayoutVoucher.find({ bookingId })
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    const totalAccumulated = schedules.reduce((sum, s) => sum + s.amount, 0);
    const totalPaid = vouchers.reduce((sum, v) => sum + v.amountPaid, 0);
    const netDue = Math.max(0, totalAccumulated - totalPaid);

    return {
      booking,
      schedules,
      vouchers,
      summary: {
        totalAccumulated,
        totalPaid,
        netDue,
      }
    };
  }

  async getPlotPayoutVoucherById(id) {
    const voucher = await PlotPayoutVoucher.findById(id)
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customerId', select: 'name customerId mobile address' },
          { path: 'plotId', populate: { path: 'seriesId' } }
        ]
      })
      .populate('processedBy', 'name');
    if (!voucher) throw ApiError.notFound('Payout voucher not found');
    return voucher;
  }

  async deletePlotPayoutVoucher(voucherId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const voucher = await PlotPayoutVoucher.findById(voucherId).session(session);
      if (!voucher) throw ApiError.notFound('Payout voucher not found');

      const bookingId = voucher.bookingId;

      await PlotPayoutVoucher.findByIdAndDelete(voucherId).session(session);

      await PlotPayoutSchedule.updateMany(
        { bookingId },
        {
          $set: {
            paidAmount: 0,
            status: 'SCHEDULED',
            paidDate: null
          }
        }
      ).session(session);

      const remainingVouchers = await PlotPayoutVoucher.find({ bookingId })
        .sort({ payoutDate: 1 })
        .session(session);

      const schedules = await PlotPayoutSchedule.find({ bookingId })
        .sort({ dueDate: 1 })
        .session(session);

      for (const v of remainingVouchers) {
        let remaining = v.amountPaid;
        for (const s of schedules) {
          const unpaid = s.amount - s.paidAmount;
          if (unpaid <= 0) continue;

          if (remaining >= unpaid) {
            s.paidAmount = s.amount;
            s.status = 'PAID';
            s.paidDate = v.payoutDate;
            remaining -= unpaid;
          } else {
            s.paidAmount += remaining;
            s.status = 'SCHEDULED';
            remaining = 0;
          }
          await s.save({ session });
          if (remaining <= 0) break;
        }
      }

      await new PlotAuditLog({
        action: 'DELETE_PAYOUT_VOUCHER',
        modelName: 'PlotPayoutVoucher',
        documentId: voucherId,
        userId,
        details: { voucherNumber: voucher.voucherNumber, amountPaid: voucher.amountPaid },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async updatePlotPayoutVoucher(voucherId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const voucher = await PlotPayoutVoucher.findById(voucherId).session(session);
      if (!voucher) throw ApiError.notFound('Payout voucher not found');

      const bookingId = voucher.bookingId;

      if (updateData.amountPaid !== undefined) {
        const schedules = await PlotPayoutSchedule.find({ bookingId }).session(session);
        const totalAccumulated = schedules.reduce((sum, s) => sum + s.amount, 0);

        const otherVouchers = await PlotPayoutVoucher.find({
          bookingId,
          _id: { $ne: voucherId }
        }).session(session);
        const otherPaid = otherVouchers.reduce((sum, v) => sum + v.amountPaid, 0);

        const newAmountPaid = Number(updateData.amountPaid);
        if (newAmountPaid <= 0) throw ApiError.badRequest('Amount paid must be greater than zero');
        if (otherPaid + newAmountPaid > totalAccumulated) {
          throw ApiError.badRequest(`Updated amount (₹${newAmountPaid}) + other payments (₹${otherPaid}) cannot exceed total accumulated return (₹${totalAccumulated})`);
        }

        voucher.amountPaid = newAmountPaid;
      }

      if (updateData.paymentMode !== undefined) {
        voucher.paymentMode = updateData.paymentMode;
        if (updateData.paymentMode === 'cash') {
          voucher.transactionReference = '';
        } else if (updateData.transactionReference !== undefined) {
          voucher.transactionReference = updateData.transactionReference;
        }
      }

      if (updateData.remarks !== undefined) {
        voucher.remarks = updateData.remarks;
      }

      await voucher.save({ session });

      await PlotPayoutSchedule.updateMany(
        { bookingId },
        {
          $set: {
            paidAmount: 0,
            status: 'SCHEDULED',
            paidDate: null
          }
        }
      ).session(session);

      const vouchers = await PlotPayoutVoucher.find({ bookingId })
        .sort({ payoutDate: 1 })
        .session(session);

      const allSchedules = await PlotPayoutSchedule.find({ bookingId })
        .sort({ dueDate: 1 })
        .session(session);

      for (const v of vouchers) {
        let remaining = v.amountPaid;
        for (const s of allSchedules) {
          const unpaid = s.amount - s.paidAmount;
          if (unpaid <= 0) continue;

          if (remaining >= unpaid) {
            s.paidAmount = s.amount;
            s.status = 'PAID';
            s.paidDate = v.payoutDate;
            remaining -= unpaid;
          } else {
            s.paidAmount += remaining;
            s.status = 'SCHEDULED';
            remaining = 0;
          }
          await s.save({ session });
          if (remaining <= 0) break;
        }
      }

      await new PlotAuditLog({
        action: 'UPDATE_PAYOUT_VOUCHER',
        modelName: 'PlotPayoutVoucher',
        documentId: voucherId,
        userId,
        details: { voucherNumber: voucher.voucherNumber, updateData },
      }).save({ session });

      await session.commitTransaction();
      session.endSession();
      return voucher;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new PlotPayoutService();
