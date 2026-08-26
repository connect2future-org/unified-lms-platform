import mongoose from 'mongoose'

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: [
      'school', 'academic', 'users', 'teaching', 'students', 'attendance',
      'assessments', 'content', 'assignments', 'timetable', 'communication',
      'finance', 'reports', 'data', 'integrations', 'security', 'audit', 'system'
    ],
    index: true
  },
  action: {
    type: String,
    enum: ['view', 'create', 'edit', 'delete', 'export', 'import', 'manage', 'publish', 'approve'],
    default: 'view'
  },
  resource: {
    type: String,
    required: true,
    lowercase: true
  }
}, { timestamps: true })

export const Permission = mongoose.model('Permission', permissionSchema)
