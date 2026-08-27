import mongoose from 'mongoose'

const assessmentTypeSchema = new mongoose.Schema(
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
    description: String,
    weightage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 0
    },
    minMarks: {
      type: Number,
      default: 0
    },
    passingMarks: {
      type: Number
    },
    assessmentMethod: {
      type: String,
      enum: ['written', 'practical', 'oral', 'project', 'assignment', 'participation'],
      default: 'written'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

assessmentTypeSchema.index({ schoolId: 1, code: 1 })

export const AssessmentType = mongoose.model('AssessmentType', assessmentTypeSchema)
