const Leave = require('../models/leave');
const LeaveBalance = require('../models/leavebalance');
const LeaveTransaction = require('../models/leaveTransaction');
const LeavePolicy = require('../models/leavePolicy');
const Attendance = require('../models/attandence');
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const Notification = require('../models/notification');

class LeaveService {
  async applyLeave(leaveData, session) {
    const { employeeId, policyId, fromDate, toDate, reason, companyId, branchId } = leaveData;

    // Calculate duration
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const duration = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const balance = await LeaveBalance.findOne({ employeeId, policyId }).session(session);
    if (!balance || balance.remaining < duration) {
      // If not enough balance, we still allow application but it might be unpaid (handled at approval or payroll)
      // For now, let's just create the request.
    }

    const leaveRequest = new Leave({
      employeeId,
      policyId,
      companyId,
      branchId,
      fromDate,
      toDate,
      duration,
      reason,
      status: 'pending'
    });

    await leaveRequest.save({ session });
    return leaveRequest;
  }

  async approveLeave(leaveId, approvedBy, session) {
    const leaveRequest = await Leave.findById(leaveId).session(session);
    if (!leaveRequest || leaveRequest.status !== 'pending') {
      throw new Error('Invalid leave request');
    }

    let balance = await LeaveBalance.findOne({
      employeeId: leaveRequest.employeeId,
      policyId: leaveRequest.policyId
    }).session(session);

    if (!balance) {
      balance = new LeaveBalance({
        employeeId: leaveRequest.employeeId,
        policyId: leaveRequest.policyId,
        companyId: leaveRequest.companyId,
        branchId: leaveRequest.branchId,
        totalAllocated: 0,
        used: 0,
        remaining: 0
      });
    }

    const balanceBefore = balance.remaining;

    // Deduct balance
    balance.used += leaveRequest.duration;
    balance.remaining -= leaveRequest.duration;
    await balance.save({ session });

    // Create Leave Transaction
    const transaction = new LeaveTransaction({
      employeeId: leaveRequest.employeeId,
      policyId: leaveRequest.policyId,
      type: 'debit',
      days: leaveRequest.duration,
      balanceBefore,
      balanceAfter: balance.remaining,
      source: 'approval',
      referenceId: leaveRequest._id,
      remarks: `Leave approved for ${leaveRequest.duration} days`
    });
    await transaction.save({ session });

    // Update Request
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = approvedBy;
    await leaveRequest.save({ session });

    // Record Attendance
    const emp = await mongoose.model('employee').findById(leaveRequest.employeeId).session(session);

    let current = dayjs(leaveRequest.fromDate);
    const end = dayjs(leaveRequest.toDate);

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      await Attendance.findOneAndUpdate(
        {
          employeeId: leaveRequest.employeeId,
          date: current.startOf('day').toDate()
        },
        {
          $setOnInsert: {
            companyId: leaveRequest.companyId,
            branchId: leaveRequest.branchId,
            empId: emp?.empId || '',
          },
          $set: {
            status: 'leave',
            leave: leaveRequest._id,
            source: 'leaveApproval',
            dayType: 'normal' // default to normal, will be updated by holiday logic if needed? 
            // Actually, if it's already recorded as weekoff/holiday, we might want to keep it.
            // But usually leaves are on working days.
          }
        },
        { upsert: true, session }
      );
      current = current.add(1, 'day');
    }

    // Create Notification for the Employee
    try {
      const notification = new Notification({
        userId: emp.userid._id || emp.userid, // Assuming userid is populated or matches user model
        message: `Your leave request from ${dayjs(leaveRequest.fromDate).format('DD MMM')} to ${dayjs(leaveRequest.toDate).format('DD MMM')} has been approved.`,
        read: false,
        createdAt: new Date()
      });
      await notification.save({ session });
    } catch (notifError) {
      console.error("Failed to create leave approval notification:", notifError);
    }

    return leaveRequest;
  }

  async allocateLeaves(employeeId, policyId, days, source, session) {
    let balance = await LeaveBalance.findOne({ employeeId, policyId }).session(session);

    if (!balance) {
      const emp = await mongoose.model('employee').findById(employeeId).session(session);
      if (!emp) throw new Error('Employee not found');

      balance = new LeaveBalance({
        employeeId,
        policyId,
        companyId: emp.companyId,
        branchId: emp.branchId,
        totalAllocated: 0,
        used: 0,
        remaining: 0
      });
    }

    const balanceBefore = balance.remaining;
    balance.totalAllocated += days;
    balance.remaining += days;
    await balance.save({ session });

    const transaction = new LeaveTransaction({
      employeeId,
      policyId,
      type: 'credit',
      days,
      balanceBefore,
      balanceAfter: balance.remaining,
      source,
      remarks: `Allocated ${days} days`
    });
    await transaction.save({ session });

    return balance;
  }
}

module.exports = new LeaveService();
