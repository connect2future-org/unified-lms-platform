import mongoose from 'mongoose'

const securityConfigSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true,
      index: true
    },
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: true },
      expiryDays: { type: Number, default: 90 }
    },
    sessionPolicy: {
      sessionTimeoutMinutes: { type: Number, default: 30 },
      maxConcurrentSessions: { type: Number, default: 3 },
      requireMFA: { type: Boolean, default: false }
    },
    ipWhitelist: [String],
    twoFactorRequired: Boolean,
    dataEncryptionEnabled: { type: Boolean, default: true },
    auditLoggingEnabled: { type: Boolean, default: true },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    gdprCompliant: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export const SecurityConfig = mongoose.model('SecurityConfig', securityConfigSchema)
