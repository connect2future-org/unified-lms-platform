import mongoose from 'mongoose'

const subjectSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: String,
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    creditHours: {
      type: Number,
      default: 3
    },
    isOptional: {
      type: Boolean,
      default: false
    },
    gradeScaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeScale'
    }
  },
  { timestamps: true }
)

subjectSchema.index({ schoolId: 1, subjectCode: 1 }, { unique: true })
subjectSchema.index({ departmentId: 1 })

export const Subject = mongoose.model('Subject', subjectSchema)
