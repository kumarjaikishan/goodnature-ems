const Notice = require('../models/notice');

const createNotice = async (req, res, next) => {
  try {
    const { title, message, noticeType, employeeType, targetEmployeeId, date } = req.body;
    const notice = new Notice({
      title,
      message,
      noticeType,
      employeeType,
      targetEmployeeId: employeeType === 'Individual' ? targetEmployeeId : undefined,
      date,
      CreatedById: req.user.id
    });
    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

const getNotices = async (req, res, next) => {
  try {
    const { role, employeeId } = req.user;
    let filter = {};

    if (role !== 'admin' && role !== 'superadmin') {
      const orConditions = [
        { employeeType: 'All' }
      ];

      if (employeeId) {
        orConditions.push({ targetEmployeeId: employeeId });
      }

      if (role === 'manager') {
        orConditions.push({ employeeType: 'Manager' });
      } else if (role === 'employee') {
        orConditions.push({ employeeType: 'Staff' });
      }

      filter.$or = orConditions;
    }

    const notices = await Notice.find(filter).sort({ date: -1 });
    res.status(200).json(notices);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, message, noticeType, employeeType, targetEmployeeId, date } = req.body;
    const updatedNotice = await Notice.findByIdAndUpdate(
      id, 
      { title, message, noticeType, employeeType, targetEmployeeId, date }, 
      { new: true }
    );
    if (!updatedNotice) return res.status(404).json({ message: 'Notice not found' });
    res.status(200).json(updatedNotice);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Notice not found' });
    res.status(200).json({ message: 'Notice deleted' });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

module.exports = { createNotice, getNotices, updateNotice, deleteNotice };
