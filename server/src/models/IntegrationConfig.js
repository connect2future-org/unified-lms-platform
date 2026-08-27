import mongoose from 'mongoose'

const integrationConfigSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    integrationName: {
      type: String,
      required: true
    },
    provider: {
      type: String,
      enum: ['google', 'microsoft', 'zoom', 'slack', 'stripe', 'mailchimp', 'custom'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    },
    credentials: {
      type: Map,
      of: String,
      select: false
    },
    webhookUrl: String,
    webhookSecret: String,
    lastSyncDate: Date,
    syncFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'manual'],
      default: 'daily'
    },
    settings: mongoose.Schema.Types.Mixed,
    errorLog: [{
      timestamp: Date,
      error: String,
      resolution: String
    }]
  },
  { timestamps: true }
)

integrationConfigSchema.index({ schoolId: 1, provider: 1 })

export const IntegrationConfig = mongoose.model('IntegrationConfig', integrationConfigSchema)
