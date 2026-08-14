const mongoose = require('mongoose');

const weeklyOffLedgerSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  type: { 
    type: String, 
    enum: ['EARNED', 'PAYROLL_PAID', 'MANUAL_ADD', 'MANUAL_DEDUCT'], 
    required: true 
  },
  minutes: { type: Number, required: true },
  particulars: { type: String, required: true },
  month: { type: Number },
  year: { type: Number },
  date: { type: Date },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'attandence' },
  payrollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payroll' },
  createdBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyOffLedger', weeklyOffLedgerSchema);
