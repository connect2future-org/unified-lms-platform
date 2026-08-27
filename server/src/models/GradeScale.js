import mongoose from 'mongoose'

const gradeScaleSchema = new mongoose.Schema(
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
    description: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    grades: [{
      name: {
        type: String,
        required: true
      },
      minPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      maxPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      gradePoint: {
        type: Number,
        default: 0
      }
    }],
    passingPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
)

gradeScaleSchema.index({ schoolId: 1, isDefault: 1 })

export const GradeScale = mongoose.model('GradeScale', gradeScaleSchema)
