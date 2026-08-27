import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema(
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
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true
    },
    headId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    email: String,
    phone: String
  },
  { timestamps: true }
)

departmentSchema.index({ schoolId: 1, code: 1 })

export const Department = mongoose.model('Department', departmentSchema)
