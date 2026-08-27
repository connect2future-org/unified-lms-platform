import mongoose from 'mongoose'

const reportCardTemplateSchema = new mongoose.Schema(
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
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear'
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term'
    },
    template: {
      includeCGPA: Boolean,
      includeRank: Boolean,
      includeComments: Boolean,
      includeTeacherSignature: Boolean,
      includePrincipalSignature: Boolean
    },
    reportStructure: [{
      section: String,
      fields: [String]
    }],
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

reportCardTemplateSchema.index({ schoolId: 1, academicYearId: 1 })

export const ReportCardTemplate = mongoose.model('ReportCardTemplate', reportCardTemplateSchema)
