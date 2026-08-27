import mongoose from 'mongoose'

const communicationTemplateSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['email', 'sms', 'notification', 'announcement'],
      required: true
    },
    category: {
      type: String,
      enum: ['academic', 'attendance', 'event', 'circular', 'emergency'],
      default: 'circular'
    },
    subject: String,
    body: {
      type: String,
      required: true
    },
    variables: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
)

communicationTemplateSchema.index({ schoolId: 1, type: 1 })

export const CommunicationTemplate = mongoose.model('CommunicationTemplate', communicationTemplateSchema)
