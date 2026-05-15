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

    const from = dayjs(fromDate);
    const to = dayjs(toDate);
    
    // Fetch rules to calculate actual working days duration
    const Company = mongoose.model('Company');
    const Branch = mongoose.model('Branch');
    const Holiday = mongoose.model('Holiday');
    
    const companyData = await Company.findById(companyId).session(session);
    const branchData = await Branch.findById(branchId).session(session);
    
    const weeklyOffs = branchData?.defaultsetting ? (companyData?.weeklyOffs || []) : (branchData?.setting?.weeklyOffs || []);
    
    const holidays = await Holiday.find({
      companyId,
      fromDate: { $lte: to.format('YYYY-MM-DD') },
      toDate: { $gte: from.format('YYYY-MM-DD') }
    }).session(session);

    const holidayDates = new Set();
    holidays.forEach(h => {
      let curr = dayjs(h.fromDate);
      while (curr.isBefore(h.toDate) || curr.isSame(h.toDate, 'day')) {
        holidayDates.add(curr.format('YYYY-MM-DD'));
        curr = curr.add(1, 'day');
      }
    });

    let duration = 0;
    let current = from;
    while (current.isBefore(to) || current.isSame(to, 'day')) {
      const isWeeklyOff = weeklyOffs.includes(current.day());
      const isHoliday = holidayDates.has(current.format('YYYY-MM-DD'));
      
      if (!isWeeklyOff && !isHoliday) {
        duration++;
      }
      current = current.add(1, 'day');
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

    // 1. Manage Leave Balance
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
    balance.used += leaveRequest.duration;
    balance.remaining -= leaveRequest.duration;
    await balance.save({ session });

    // 2. Create Transaction
    const transaction = new LeaveTransaction({
      employeeId: leaveRequest.employeeId,
      policyId: leaveRequest.policyId,
      type: 'debit',
      days: leaveRequest.duration,
      balanceBefore,
      balanceAfter: balance.remaining,
      source: 'approval',
      referenceId: leaveRequest._id,
      remarks: `Leave approved for ${leaveRequest.duration} working days`
    });
    await transaction.save({ session });

    // 3. Update Request Status
    leaveRequest.status = 'approved';
    leaveRequest.approvedBy = approvedBy;
    await leaveRequest.save({ session });

    // 4. Update Attendance Records
    const Employee = mongoose.model('employee');
    const Company = mongoose.model('Company');
    const Branch = mongoose.model('Branch');
    const Holiday = mongoose.model('Holiday');

    const emp = await Employee.findById(leaveRequest.employeeId).session(session);
    const companyData = await Company.findById(leaveRequest.companyId).session(session);
    const branchData = await Branch.findById(leaveRequest.branchId).session(session);
    
    const weeklyOffs = branchData?.defaultsetting ? (companyData?.weeklyOffs || []) : (branchData?.setting?.weeklyOffs || []);

    let current = dayjs(leaveRequest.fromDate);
    const end = dayjs(leaveRequest.toDate);

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      const day = current.day();
      
      const isWeeklyOff = weeklyOffs.includes(day);
      const isHoliday = await Holiday.findOne({
        companyId: leaveRequest.companyId,
        fromDate: { $lte: dateStr },
        toDate: { $gte: dateStr }
      }).session(session);

      // Only mark as 'leave' if it's a working day
      if (!isWeeklyOff && !isHoliday) {
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
              dayType: 'normal'
            }
          },
          { upsert: true, session }
        );
      } else {
        // Optionally ensure the dayType is correctly marked as weekoff/holiday if record exists
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
              status: isHoliday ? 'holiday' : 'weekly off',
              dayType: isHoliday ? 'holiday' : 'weekoff'
            },
            $set: {
              leave: leaveRequest._id // Link to leave but don't change status to 'leave'
            }
          },
          { upsert: true, session }
        );
      }
      current = current.add(1, 'day');
    }

    // 5. Notification
    try {
      const notification = new Notification({
        userId: emp.userid._id || emp.userid,
        message: `Your leave request from ${dayjs(leaveRequest.fromDate).format('DD MMM')} to ${dayjs(leaveRequest.toDate).format('DD MMM')} (${leaveRequest.duration} working days) has been approved.`,
        read: false,
        createdAt: new Date()
      });
      await notification.save({ session });
    } catch (notifError) {
      console.error("Notification Error:", notifError);
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
