import mongoose from 'mongoose'

const academicYearSchema = new mongoose.Schema(
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
      uppercase: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft'
    }
  },
  { timestamps: true }
)

academicYearSchema.index({ schoolId: 1, isCurrent: 1 })
academicYearSchema.index({ schoolId: 1, startDate: 1, endDate: 1 })

export const AcademicYear = mongoose.model('AcademicYear', academicYearSchema)
