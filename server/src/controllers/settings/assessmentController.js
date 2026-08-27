import { AssessmentType } from '../../models/AssessmentType.js'
import { ReportCardTemplate } from '../../models/ReportCardTemplate.js'
import { auditService } from '../../services/auditService.js'

export const assessmentController = {
  async listAssessmentTypes(req, res) {
    try {
      const { schoolId } = req.body
      const { page = 1, limit = 20, search } = req.query
      const skip = (page - 1) * limit

      const query = { schoolId, isActive: true }
      if (search) query.name = new RegExp(search, 'i')

      const items = await AssessmentType.find(query)
        .skip(skip)
        .limit(limit)

      const total = await AssessmentType.countDocuments(query)
      res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createAssessmentType(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, code, maxMarks, weightage, assessmentMethod } = req.body

      const type = new AssessmentType({
        schoolId,
        name,
        code: code || name.toUpperCase().replace(/\s+/g, '_'),
        maxMarks,
        weightage,
        assessmentMethod
      })

      await type.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'AssessmentType',
        entityId: type._id,
        description: `Created assessment type: ${name}`,
        newValues: type.toObject(),
        schoolId
      })

      res.status(201).json(type)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateAssessmentType(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const updateData = { ...req.body }
      delete updateData.schoolId
      delete updateData.userId

      const type = await AssessmentType.findById(id)
      if (!type) return res.status(404).json({ message: 'Assessment type not found' })

      const previousValues = type.toObject()
      Object.assign(type, updateData)
      await type.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'AssessmentType',
        entityId: id,
        description: `Updated assessment type: ${type.name}`,
        previousValues,
        newValues: type.toObject(),
        schoolId
      })

      res.json(type)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  // Report Card Templates
  async listReportCardTemplates(req, res) {
    try {
      const { schoolId } = req.body
      const { academicYearId } = req.query

      const query = { schoolId }
      if (academicYearId) query.academicYearId = academicYearId

      const items = await ReportCardTemplate.find(query)
        .populate('academicYearId', 'name')
        .populate('termId', 'name')

      res.json(items)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createReportCardTemplate(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, academicYearId, termId, template, reportStructure } = req.body

      const reportCard = new ReportCardTemplate({
        schoolId,
        name,
        academicYearId,
        termId,
        template,
        reportStructure
      })

      await reportCard.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'ReportCardTemplate',
        entityId: reportCard._id,
        description: `Created report card template: ${name}`,
        newValues: reportCard.toObject(),
        schoolId
      })

      res.status(201).json(reportCard)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
