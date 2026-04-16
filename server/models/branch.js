const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  managerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  defaultsetting: { type: Boolean, default: true },

  // ✅ Make setting optional
  setting: {
    type: new mongoose.Schema({
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
      weeklyOffs: [Number],
      attendanceRules: {
        considerEarlyEntryBefore: { type: String, default: '09:50' },
        considerLateEntryAfter: { type: String, default: '10:10' },
        considerEarlyExitBefore: { type: String, default: '17:50' },
        considerLateExitAfter: { type: String, default: '18:15' },
        esslPunchInStart: { type: String, default: '00:00' },
        esslPunchInEnd: { type: String, default: '23:59' },
        esslPunchOutStart: { type: String, default: '00:00' },
        esslPunchOutEnd: { type: String, default: '23:59' },
        missingPunchIn: {
          enabled: { type: Boolean, default: false },
          checkTime: { type: String, default: '11:00' },
          action: { type: String, enum: ['markAbsent', 'autoPunchIn'], default: 'markAbsent' },
          autoPunchInTime: { type: String, default: '10:00' }
        }
      },
      overtimeRules: {
        holiday: {
          treatAllAsOvertime: { type: Boolean, default: true },
          minMinutesRequired: { type: Number, default: 0 } // optional future use
        },
        weeklyOff: {
          treatAllAsOvertime: { type: Boolean, default: true },
          minMinutesRequired: { type: Number, default: 0 }
        }
      }
    }, { _id: false }), // prevent creating _id for subdocs
    required: false     // ✅ entire setting object is optional
  }

}, { timestamps: true });

module.exports = mongoose.model("Branch", branchSchema);
