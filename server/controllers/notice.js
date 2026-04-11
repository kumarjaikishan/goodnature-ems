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
      CreatedById: req.user.id,
      companyId: req.user.companyId
    });
    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

const getNotices = async (req, res, next) => {
  try {
    const { role, companyId, employeeId } = req.user;
    let filter = { companyId };

    // If not admin, filter notices based on audience
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
      // Add HR if needed, but for now we follow the UI's simple list

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
    const updatedNotice = await Notice.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedNotice);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notice.findByIdAndDelete(id);
    res.status(200).json({ message: 'Notice deleted' });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
};

module.exports = { createNotice, getNotices, updateNotice, deleteNotice };
