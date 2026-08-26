import { AuditLog } from '../models/AuditLog.js'

export const logAudit = async ({
  userId,
  action,
  entityType,
  entityId,
  description,
  previousValues = {},
  newValues = {},
  status = 'success',
  ipAddress = '',
  userAgent = '',
  schoolId = null
}) => {
  try {
    const changes = {}
    for (const key in newValues) {
      if (JSON.stringify(previousValues[key]) !== JSON.stringify(newValues[key])) {
        changes[key] = {
          from: previousValues[key],
          to: newValues[key]
        }
      }
    }

    return await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      changes,
      previousValues,
      newValues,
      status,
      ipAddress,
      userAgent,
      schoolId
    })
  } catch (error) {
    console.error('Audit logging failed:', error)
  }
}

export const getAuditLogs = async (filters = {}, page = 1, limit = 50) => {
  const skip = (page - 1) * limit
  const query = {}

  if (filters.userId) query.userId = filters.userId
  if (filters.entityType) query.entityType = filters.entityType
  if (filters.action) query.action = filters.action
  if (filters.schoolId) query.schoolId = filters.schoolId
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {}
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom)
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo)
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(query)
  ])

  return { logs, total, page, limit }
}
