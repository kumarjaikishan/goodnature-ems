const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String }, // Optional, since we have title
  noticeType: { type: String, enum: ['Holiday', 'Policy', 'Event', 'Urgent'], default: 'Event' },
  employeeType: { type: String, enum: ['All', 'Staff', 'Manager', 'HR', 'Individual'], default: 'All' },
  targetEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee' }, // For individual notices
  date: { type: Date, default: Date.now },
  CreatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('notice', noticeSchema);
