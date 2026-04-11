const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  type: {
    type: String,
    enum: ["National", "Religious","Public", "Other"],
    default: "Other"
  },
  description: { type: String, trim: true }
});

module.exports = mongoose.model('Holiday', holidaySchema);
