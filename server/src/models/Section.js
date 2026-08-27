import mongoose from 'mongoose'

const sectionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true
    },
    sectionCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      default: 45
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
)

sectionSchema.index({ classId: 1, schoolId: 1 })
sectionSchema.index({ sectionCode: 1, classId: 1 }, { unique: true })

export const Section = mongoose.model('Section', sectionSchema)
