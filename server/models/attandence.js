const mongoose = require('mongoose');

// 🔹 Snapshot Schema (clean separation)
const rulesSnapshotSchema = new mongoose.Schema({
  officeTime: {
    in: String,
    out: String,
    breakMinutes: Number
  },
  gracePeriod: {
    lateEntryMinutes: Number,
    earlyExitMinutes: Number
  },
  workingMinutes: {
    fullDay: Number,
    halfDay: Number,
    shortDayThreshold: Number,
    overtimeAfterMinutes: Number
  },
  attendanceRules: {
    considerEarlyEntryBefore: String,
    considerLateEntryAfter: String,
    considerEarlyExitBefore: String,
    considerLateExitAfter: String
  },
  overtimeRules: {
    holiday: {
      treatAllAsOvertime: { type: Boolean, default: true },
      minMinutesRequired: { type: Number, default: 0 }
    },
    weeklyOff: {
      treatAllAsOvertime: { type: Boolean, default: true },
      minMinutesRequired: { type: Number, default: 0 }
    }
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employee', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  attendanceById: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

  date: { type: Date, required: true },
  empId: { type: String },

  punchIn: Date,
  punchOut: Date,

  punchInStatus: {
    type: String,
    enum: ['early', 'onTime', 'late']
  },
  punchOutStatus: {
    type: String,
    enum: ['early', 'onTime', 'late']
  },
  remarks: { type: String, default: null },
  dutyStart: String,
  dutyEnd: String,
  rulesSnapshot: rulesSnapshotSchema,

  workingMinutes: Number,
  overtimeMinutes: Number,
  shortMinutes: Number,

  status: {
    type: String,
    enum: ['present', 'absent', 'leave', 'half day', 'weekly off', 'holiday'],
    required: true
  },

  dayType: {
    type: String,
    enum: ['normal', 'weekoff', 'holiday'],
    default: 'normal'
  },
  leave: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave' },
  source: { type: String, enum: ['leaveApproval', 'manual', 'device', 'excel'], default: 'manual' }

}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);