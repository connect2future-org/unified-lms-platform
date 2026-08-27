import { TeacherSubject } from '../../models/TeacherSubject.js'
import { Subject } from '../../models/Subject.js'
import { auditService } from '../../services/auditService.js'

export const teachingController = {
  async listTeacherAssignments(req, res) {
    try {
      const { schoolId } = req.body
      const { page = 1, limit = 20, teacherId } = req.query
      const skip = (page - 1) * limit

      const query = { schoolId }
      if (teacherId) query.teacherId = teacherId

      const items = await TeacherSubject.find(query)
        .populate('teacherId', 'name email')
        .populate('subjectId', 'name')
        .populate('classId', 'name')
        .skip(skip)
        .limit(limit)

      const total = await TeacherSubject.countDocuments(query)
      res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async assignTeacherToSubject(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { teacherId, subjectId, classId, sectionId, academicYearId, hoursPerWeek } = req.body

      const assignment = new TeacherSubject({
        schoolId,
        teacherId,
        subjectId,
        classId,
        sectionId,
        academicYearId,
        hoursPerWeek
      })

      await assignment.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'TeacherSubject',
        entityId: assignment._id,
        description: `Assigned teacher to subject`,
        newValues: assignment.toObject(),
        schoolId
      })

      res.status(201).json(assignment)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateAssignment(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const updateData = { ...req.body }
      delete updateData.schoolId
      delete updateData.userId

      const assignment = await TeacherSubject.findById(id)
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

      const previousValues = assignment.toObject()
      Object.assign(assignment, updateData)
      await assignment.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'TeacherSubject',
        entityId: id,
        description: `Updated teacher assignment`,
        previousValues,
        newValues: assignment.toObject(),
        schoolId
      })

      res.json(assignment)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async removeAssignment(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body

      const assignment = await TeacherSubject.findByIdAndDelete(id)
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' })

      await auditService.logAudit({
        userId,
        action: 'DELETE',
        entityType: 'TeacherSubject',
        entityId: id,
        description: `Removed teacher assignment`,
        previousValues: assignment.toObject(),
        schoolId
      })

      res.json({ message: 'Assignment removed' })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
}
