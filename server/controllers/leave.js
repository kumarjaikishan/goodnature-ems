
const employee = require('../models/employee');
const Leave = require('../models/leave');
const notificationmodal = require('../models/notification')
const attendanceModal = require('../models/attandence');
const companySchema = require('../models/company')
const holidayschema = require('../models/holiday')
const LeavePolicy = require('../models/leavePolicy');
const LeaveBalance = require('../models/leavebalance');
const noticeModal = require('../models/notice');
const leaveService = require('../services/leaveService');
const mongoose = require('mongoose');


const addleave = async (req, res, next) => {
  let { policyId, fromDate, toDate, reason } = req.body;

  if (!fromDate || !reason) {
    return res.status(400).json({ message: 'Fields are required' });
  }

  // If toDate is not provided, treat it as a single-day leave
  if (!toDate) {
    toDate = fromDate;
  }

  try {
    const whichemployee = await employee.findOne({ userid: req.user.id });

    // Calculate duration in days (inclusive)
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const timeDiff = to.getTime() - from.getTime();
    const duration = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    const leave = new Leave({
      companyId: whichemployee.companyId,
      branchId: whichemployee.branchId,
      employeeId: whichemployee._id,
      policyId,
      fromDate,
      toDate,
      duration,
      reason,
    });

    await leave.save();
    return res.json({ message: 'Record Added Successfully' });

  } catch (error) {
    console.error("Leave error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getleave = async (req, res, next) => {
  try {
    const whichemployee = await employee.findOne({ userid: req.user.id })
    const leaves = await Leave.find({ employeeId: whichemployee._id }).populate('policyId').sort({ createdAt: -1 })

    return res.status(200).json(leaves);
  } catch (error) {
    console.error("Attendance error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const fetchleave = async (req, res, next) => {
  try {
    let leave;
    if (req.user.role == 'manager') {
      leave = await Leave.find({ companyId: req.user.companyId, branchId: { $in: req.user.branchIds } }).populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name email'
        }
      });
    } else {
      leave = await Leave.find({ companyId: req.user.companyId }).populate({
        path: 'employeeId',
        select: 'userid profileimage',
        populate: {
          path: 'userid',
          select: 'name email'
        }
      });
    }
    return res.json({ leave });

  } catch (error) {
    console.error("Attendance error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const employeefetch = async (req, res, next) => {
  try {
    const notification = await notificationmodal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const attendance = await attendanceModal.find({ employeeId: req.user.employeeId }).sort({ date: -1 });
    const leave = await Leave.find({ employeeId: req.user.employeeId }).populate('policyId');
    const employeeee = await employee.findById(req.user.employeeId)
      .populate('branchId')
      .populate('department')
      .populate('userid');

    const holiday = await holidayschema.find({ companyId: employeeee.branchId.companyId });
    const companySetting = await companySchema.findById(employeeee.branchId.companyId);

    // Fetch targeted notices
    const { role, employeeId } = req.user;
    const orConditions = [{ employeeType: 'All' }];
    if (employeeId) orConditions.push({ targetEmployeeId: employeeId });
    if (role === 'manager') orConditions.push({ employeeType: 'Manager' });
    else orConditions.push({ employeeType: 'Staff' });

    const notices = await noticeModal.find({ 
      companyId: employeeee.branchId.companyId, 
      $or: orConditions 
    }).sort({ date: -1 });

    return res.status(200).json({ 
      profile: employeeee, 
      holiday, 
      notification, 
      leave, 
      attendance, 
      companySetting,
      notices 
    });

  } catch (error) {
    console.error("Attendance error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const updatenotification = async (req, res, next) => {

  try {
    await notificationmodal.updateMany(
      { userId: req.user.id }, // condition
      { $set: { read: true } } // update
    );


    return res.status(200).json({ message: "Marked Read" });

  } catch (error) {
    console.error("Attendance error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const createLeavePolicy = async (req, res, next) => {
  try {
    const { name, allocationType, totalLeaves, carryForward, encashable, probationRule } = req.body;
    const policy = new LeavePolicy({
      companyId: req.user.companyId,
      name,
      allocationType,
      totalLeaves,
      carryForward,
      encashable,
      probationRule
    });
    await policy.save();
    return res.status(201).json({ message: 'Policy Created', policy });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

const getPolicies = async (req, res, next) => {
  try {
    const policies = await LeavePolicy.find({ companyId: req.user.companyId });
    return res.status(200).json(policies);
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

const approveLeave = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { leaveid } = req.params;
    const leave = await leaveService.approveLeave(leaveid, req.user.id, session);
    await session.commitTransaction();
    return res.status(200).json({ message: 'Leave Approved', leave });
  } catch (error) {
    await session.abortTransaction();
    return next({ status: 500, message: error.message });
  } finally {
    session.endSession();
  }
};

const updateLeavePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const policy = await LeavePolicy.findByIdAndUpdate(id, updateData, { new: true });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    return res.status(200).json({ message: 'Policy Updated', policy });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

const deleteLeavePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const policy = await LeavePolicy.findByIdAndDelete(id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    return res.status(200).json({ message: 'Policy Deleted' });
  } catch (error) {
    return next({ status: 500, message: error.message });
  }
};

module.exports = { 
  employeefetch, 
  addleave, 
  fetchleave, 
  updatenotification, 
  getleave,
  createLeavePolicy,
  getPolicies,
  updateLeavePolicy,
  deleteLeavePolicy,
  approveLeave
};
