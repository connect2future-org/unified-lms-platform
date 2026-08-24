import mongoose from 'mongoose'

const classSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: null },
    period: { type: String, trim: true, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    sourcedId: { type: String, trim: true, sparse: true, index: true }
  },
  { timestamps: true }
)

classSchema.index({ schoolId: 1, title: 1 }, { unique: true })
classSchema.index({ schoolId: 1, sourcedId: 1 }, { unique: true, sparse: true })

export const Class = mongoose.model('Class', classSchema)