import mongoose from 'mongoose'

const schoolSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    }
  },
  { timestamps: true }
)

schoolSchema.index({ name: 1 })

export const School = mongoose.model('School', schoolSchema)
