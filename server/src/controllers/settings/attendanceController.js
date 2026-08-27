import { AttendanceRule } from '../../models/AttendanceRule.js'
import { AttendanceStatus } from '../../models/AttendanceStatus.js'
import { auditService } from '../../services/auditService.js'

export const attendanceController = {
  async listAttendanceRules(req, res) {
    try {
      const { schoolId } = req.body
      const items = await AttendanceRule.find({ schoolId })
      res.json(items)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createAttendanceRule(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, minAttendancePercentage, maxConsecutiveAbsenceDays, leavePolicy } = req.body

      const rule = new AttendanceRule({
        schoolId,
        name,
        minAttendancePercentage,
        maxConsecutiveAbsenceDays,
        leavePolicy
      })

      await rule.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'AttendanceRule',
        entityId: rule._id,
        description: `Created attendance rule: ${name}`,
        newValues: rule.toObject(),
        schoolId
      })

      res.status(201).json(rule)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateAttendanceRule(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const updateData = { ...req.body }
      delete updateData.schoolId
      delete updateData.userId

      const rule = await AttendanceRule.findById(id)
      if (!rule) return res.status(404).json({ message: 'Attendance rule not found' })

      const previousValues = rule.toObject()
      Object.assign(rule, updateData)
      await rule.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'AttendanceRule',
        entityId: id,
        description: `Updated attendance rule: ${rule.name}`,
        previousValues,
        newValues: rule.toObject(),
        schoolId
      })

      res.json(rule)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  // Attendance Statuses
  async listAttendanceStatuses(req, res) {
    try {
      const { schoolId } = req.body
      const items = await AttendanceStatus.find({ schoolId, isActive: true })
      res.json(items)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createAttendanceStatus(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { code, name, abbreviation, isPresent, color } = req.body

      const status = new AttendanceStatus({
        schoolId,
        code,
        name,
        abbreviation,
        isPresent,
        color
      })

      await status.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'AttendanceStatus',
        entityId: status._id,
        description: `Created attendance status: ${name}`,
        newValues: status.toObject(),
        schoolId
      })

      res.status(201).json(status)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
