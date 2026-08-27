import mongoose from 'mongoose'

const attendanceRuleSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    minAttendancePercentage: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    minDaysToMarkAttendance: {
      type: Number,
      default: 1
    },
    maxConsecutiveAbsenceDays: {
      type: Number,
      default: 7
    },
    holidaysIncluded: {
      type: Boolean,
      default: false
    },
    leavePolicy: {
      casualLeaveDays: { type: Number, default: 5 },
      sickLeaveDays: { type: Number, default: 5 },
      studyLeaveDays: { type: Number, default: 5 }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

attendanceRuleSchema.index({ schoolId: 1 })

export const AttendanceRule = mongoose.model('AttendanceRule', attendanceRuleSchema)
