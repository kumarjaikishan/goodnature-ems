const mongoose = require('mongoose');

const rulesSchema = new mongoose.Schema({
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
    overtimeAfterMinutes: Number,
    allowFullOvertime: Boolean,
    allowFullShort: Boolean
  },
  attendanceRules: {
    considerEarlyEntryBefore: String,
    considerLateEntryAfter: String,
    considerEarlyExitBefore: String,
    considerLateExitAfter: String,
    esslPunchInStart: String,
    esslPunchInEnd: String,
    esslPunchOutStart: String,
    esslPunchOutEnd: String,
    missingPunchIn: {
      enabled: { type: Boolean, default: false },
      checkTime: String,
      action: { type: String, enum: ['markAbsent', 'autoPunchIn'] },
      autoPunchInTime: String
    }
  },
  weeklyOffs: [Number],
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

const attendanceRuleSnapshotSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  rules: { type: rulesSchema, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AttendanceRuleSnapshot', attendanceRuleSnapshotSchema);
