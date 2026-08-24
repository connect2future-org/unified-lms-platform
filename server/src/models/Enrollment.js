import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['student', 'teacher'], default: 'student', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    sourcedId: { type: String, trim: true, sparse: true, index: true }
  },
  { timestamps: true }
)

enrollmentSchema.index({ classId: 1, userId: 1, role: 1 }, { unique: true })
enrollmentSchema.index({ classId: 1, status: 1 })

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema)