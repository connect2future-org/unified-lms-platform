import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['system', 'custom'],
    default: 'system',
    index: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    index: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  scope: {
    type: String,
    enum: ['super-admin', 'admin', 'school', 'personal'],
    default: 'school'
  }
}, { timestamps: true })

roleSchema.index({ name: 1, type: 1 })

export const Role = mongoose.model('Role', roleSchema)
