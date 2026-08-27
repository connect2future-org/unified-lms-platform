import { AcademicYear } from '../../models/AcademicYear.js'
import { Term } from '../../models/Term.js'
import { Class } from '../../models/Class.js'
import { Section } from '../../models/Section.js'
import { Subject } from '../../models/Subject.js'
import { Department } from '../../models/Department.js'
import { GradeScale } from '../../models/GradeScale.js'
import { auditService } from '../../services/auditService.js'

export const academicController = {
  // Academic Years
  async listAcademicYears(req, res) {
    try {
      const { schoolId } = req.body
      const { page = 1, limit = 20, search } = req.query
      const skip = (page - 1) * limit

      const query = { schoolId }
      if (search) query.name = new RegExp(search, 'i')

      const items = await AcademicYear.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ startDate: -1 })

      const total = await AcademicYear.countDocuments(query)

      res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createAcademicYear(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, code, startDate, endDate, isCurrent } = req.body

      const newYear = new AcademicYear({
        schoolId,
        name,
        code: code || name.toUpperCase().replace(/\s+/g, ''),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent,
        status: 'draft'
      })

      await newYear.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'AcademicYear',
        entityId: newYear._id,
        description: `Created academic year: ${name}`,
        newValues: newYear.toObject(),
        schoolId
      })

      res.status(201).json(newYear)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async updateAcademicYear(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body
      const updateData = { ...req.body }
      delete updateData.schoolId
      delete updateData.userId

      const year = await AcademicYear.findById(id)
      if (!year) return res.status(404).json({ message: 'Academic year not found' })

      const previousValues = year.toObject()
      Object.assign(year, updateData)
      await year.save()

      await auditService.logAudit({
        userId,
        action: 'UPDATE',
        entityType: 'AcademicYear',
        entityId: id,
        description: `Updated academic year: ${year.name}`,
        previousValues,
        newValues: year.toObject(),
        schoolId
      })

      res.json(year)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  async deleteAcademicYear(req, res) {
    try {
      const { id } = req.params
      const { schoolId, userId } = req.body

      const year = await AcademicYear.findByIdAndDelete(id)
      if (!year) return res.status(404).json({ message: 'Academic year not found' })

      await auditService.logAudit({
        userId,
        action: 'DELETE',
        entityType: 'AcademicYear',
        entityId: id,
        description: `Deleted academic year: ${year.name}`,
        previousValues: year.toObject(),
        schoolId
      })

      res.json({ message: 'Academic year deleted' })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  // Departments
  async listDepartments(req, res) {
    try {
      const { schoolId } = req.body
      const { page = 1, limit = 20, search } = req.query
      const skip = (page - 1) * limit

      const query = { schoolId }
      if (search) query.name = new RegExp(search, 'i')

      const items = await Department.find(query)
        .populate('headId', 'name email')
        .skip(skip)
        .limit(limit)

      const total = await Department.countDocuments(query)
      res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createDepartment(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, code, headId, email, phone } = req.body

      const dept = new Department({
        schoolId,
        name,
        code: code || name.toUpperCase().replace(/\s+/g, '_'),
        headId,
        email,
        phone
      })

      await dept.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'Department',
        entityId: dept._id,
        description: `Created department: ${name}`,
        newValues: dept.toObject(),
        schoolId
      })

      res.status(201).json(dept)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  // Subjects
  async listSubjects(req, res) {
    try {
      const { schoolId } = req.body
      const { page = 1, limit = 20, search, departmentId } = req.query
      const skip = (page - 1) * limit

      const query = { schoolId }
      if (search) query.name = new RegExp(search, 'i')
      if (departmentId) query.departmentId = departmentId

      const items = await Subject.find(query)
        .populate('departmentId', 'name')
        .skip(skip)
        .limit(limit)

      const total = await Subject.countDocuments(query)
      res.json({ items, total, page: parseInt(page), limit: parseInt(limit) })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createSubject(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { subjectCode, name, departmentId, creditHours } = req.body

      const subject = new Subject({
        schoolId,
        subjectCode: subjectCode || name.toUpperCase(),
        name,
        departmentId,
        creditHours
      })

      await subject.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'Subject',
        entityId: subject._id,
        description: `Created subject: ${name}`,
        newValues: subject.toObject(),
        schoolId
      })

      res.status(201).json(subject)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },

  // Grade Scales
  async listGradeScales(req, res) {
    try {
      const { schoolId } = req.body
      const items = await GradeScale.find({ schoolId }).sort({ isDefault: -1 })
      res.json(items)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },

  async createGradeScale(req, res) {
    try {
      const { schoolId, userId } = req.body
      const { name, grades, passingPercentage } = req.body

      const scale = new GradeScale({
        schoolId,
        name,
        grades,
        passingPercentage
      })

      await scale.save()

      await auditService.logAudit({
        userId,
        action: 'CREATE',
        entityType: 'GradeScale',
        entityId: scale._id,
        description: `Created grade scale: ${name}`,
        newValues: scale.toObject(),
        schoolId
      })

      res.status(201).json(scale)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
