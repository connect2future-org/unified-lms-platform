import mongoose from 'mongoose'

const termSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
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
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    assessmentStartDate: {
      type: Date
    },
    assessmentEndDate: {
      type: Date
    },
    resultPublishDate: {
      type: Date
    }
  },
  { timestamps: true }
)

termSchema.index({ academicYearId: 1, schoolId: 1 })
termSchema.index({ startDate: 1, endDate: 1 })

export const Term = mongoose.model('Term', termSchema)
