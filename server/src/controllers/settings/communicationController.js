import { CommunicationTemplate } from '../../models/CommunicationTemplate.js'
import { auditService } from '../../services/auditService.js'

export const communicationController = {
  async listCommunicationTemplates(req, res) {
    try {
      const { schoolId } = req.body
      const { type, category, page = 1, limit = 20 } = req.query
      const skip = (page - 1) * limit

      const query = { schoolId, isActive: true }
      if (type) query.type = type
      if (category) query.category = category

      const items = await CommunicationTemplate.find(query)
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)

      const total = await CommunicationTemplate.countDocuments(query)
      res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createCommunicationTemplate(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, type, category, subject, body, variables } = req.body

      const template = new CommunicationTemplate({
        schoolId,
        name,
        type,
        category,
        subject,
        body,
        variables,
        createdBy: userId
      })

      await template.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'CommunicationTemplate',
        entityId: template._id,
        description: `Created communication template: ${name}`,
        newValues: template.toObject(),
        schoolId
      })

      res.status(201).json(template)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateCommunicationTemplate(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const updateData = { ...req.body }
      delete updateData.schoolId
      delete updateData.userId

      const template = await CommunicationTemplate.findById(id)
      if (!template) return res.status(404).json({ message: 'Template not found' })

      const previousValues = template.toObject()
      Object.assign(template, updateData)
      await template.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'CommunicationTemplate',
        entityId: id,
        description: `Updated communication template: ${template.name}`,
        previousValues,
        newValues: template.toObject(),
        schoolId
      })

      res.json(template)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
