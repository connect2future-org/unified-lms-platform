import mongoose from 'mongoose'

const attendanceStatusSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    abbreviation: {
      type: String,
      required: true,
      uppercase: true
    },
    description: String,
    isPresent: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: '#999999'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

attendanceStatusSchema.index({ schoolId: 1, code: 1 }, { unique: true })

export const AttendanceStatus = mongoose.model('AttendanceStatus', attendanceStatusSchema)
