import mongoose from 'mongoose'

const systemConfigSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true,
      index: true
    },
    systemName: String,
    logoUrl: String,
    faviconUrl: String,
    primaryColor: String,
    secondaryColor: String,
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    academicYearStartMonth: { type: Number, min: 1, max: 12, default: 4 },
    weekStartDay: {
      type: String,
      enum: ['Monday', 'Sunday'],
      default: 'Monday'
    },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: String,
    features: {
      attendanceModule: { type: Boolean, default: true },
      assessmentModule: { type: Boolean, default: true },
      communicationModule: { type: Boolean, default: true },
      financeModule: { type: Boolean, default: false },
      parentPortal: { type: Boolean, default: true },
      studentPortal: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
)

export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema)
