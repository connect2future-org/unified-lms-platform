import { RegistrationLookup } from '../../models/RegistrationLookup.js'
import { asyncHandler } from '../../middleware/asyncHandler.js'
import { ApiError } from '../../utils/apiError.js'

const LOOKUP_TYPE_ALIAS_MAP = {
  college: 'college',
  department: 'department',
  progresstopic: 'progressTopic',
  'progress-topic': 'progressTopic'
}

const DEFAULT_LOOKUPS = {
  college: ['LMS College of Engineering, Mandya'],
  department: ['Computer Science and Engineering']
}

const normalizeLabel = (value) => String(value || '').trim().replace(/\s+/g, ' ')

const toProgressTopicKey = (label) => {
  const base = normalizeLabel(label)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return base || 'topic'
}

const ensureProgressTopicKeys = async () => {
  const rows = await RegistrationLookup.find({ type: 'progressTopic' })

  for (const row of rows) {
    if (row.key) {
      continue
    }

    const base = toProgressTopicKey(row.label)
    let candidate = base
    let counter = 2

    // Find a unique key for existing progress-topic rows.
    while (await RegistrationLookup.exists({ type: 'progressTopic', key: candidate, _id: { $ne: row._id } })) {
      candidate = `${base}-${counter}`
      counter += 1
    }

    row.key = candidate
    await row.save()
  }
}

const validateType = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  const type = LOOKUP_TYPE_ALIAS_MAP[normalized]
  if (!type) {
    throw new ApiError(400, 'Invalid lookup type')
  }
  return type
}

const ensureDefaultLookups = async () => {
  const defaults = []

  for (const type of Object.keys(DEFAULT_LOOKUPS)) {
    for (const rawLabel of DEFAULT_LOOKUPS[type]) {
      const label = normalizeLabel(rawLabel)
      if (!label) {
        continue
      }

      defaults.push({
        updateOne: {
          filter: {
            type,
            normalizedLabel: label.toLowerCase()
          },
          update: {
            $setOnInsert: {
              type,
              label,
              normalizedLabel: label.toLowerCase(),
              active: true,
              createdBy: 'system-default',
              updatedBy: 'system-default'
            }
          },
          upsert: true
        }
      })
    }
  }

  if (defaults.length > 0) {
    await RegistrationLookup.bulkWrite(defaults)
  }
}

const getLookupPayload = (rows) => ({
  colleges: rows
    .filter((row) => row.type === 'college' && row.active)
    .map((row) => row.label),
  departments: rows
    .filter((row) => row.type === 'department' && row.active)
    .map((row) => row.label),
  progressTopics: rows
    .filter((row) => row.type === 'progressTopic' && row.active)
    .map((row) => ({
      id: String(row._id),
      key: String(row.key || toProgressTopicKey(row.label)),
      label: row.label
    }))
})

export const getRegistrationLookups = asyncHandler(async (req, res) => {
  await ensureDefaultLookups()
  await ensureProgressTopicKeys()

  const rows = await RegistrationLookup.find({ active: true })
    .sort({ type: 1, label: 1 })
    .lean()

  res.json(getLookupPayload(rows))
})

export const getAdminRegistrationLookups = asyncHandler(async (req, res) => {
  await ensureDefaultLookups()
  await ensureProgressTopicKeys()

  const rows = await RegistrationLookup.find()
    .sort({ type: 1, label: 1 })
    .lean()

  res.json({
    colleges: rows.filter((row) => row.type === 'college'),
    departments: rows.filter((row) => row.type === 'department'),
    progressTopics: rows.filter((row) => row.type === 'progressTopic')
  })
})

export const createRegistrationLookup = asyncHandler(async (req, res) => {
  const type = validateType(req.params.type)
  const label = normalizeLabel(req.body?.label)

  if (!label) {
    throw new ApiError(400, 'Label is required')
  }

  try {
    let generatedKey = ''
    if (type === 'progressTopic') {
      const baseKey = toProgressTopicKey(label)
      generatedKey = baseKey
      let counter = 2

      while (await RegistrationLookup.exists({ type: 'progressTopic', key: generatedKey })) {
        generatedKey = `${baseKey}-${counter}`
        counter += 1
      }
    }

    const created = await RegistrationLookup.create({
      type,
      label,
      normalizedLabel: label.toLowerCase(),
      key: generatedKey,
      active: true,
      createdBy: String(req.admin?.username || 'admin'),
      updatedBy: String(req.admin?.username || 'admin')
    })

    res.status(201).json({
      message: `${type} added successfully`,
      item: created
    })
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, `${type} already exists`)
    }
    throw error
  }
})

export const updateRegistrationLookup = asyncHandler(async (req, res) => {
  const type = validateType(req.params.type)
  const label = normalizeLabel(req.body?.label)
  const hasActive = Object.prototype.hasOwnProperty.call(req.body || {}, 'active')

  if (!label && !hasActive) {
    throw new ApiError(400, 'Provide label or active status to update')
  }

  const item = await RegistrationLookup.findOne({ _id: req.params.id, type })
  if (!item) {
    throw new ApiError(404, 'Lookup item not found')
  }

  if (label) {
    item.label = label
    item.normalizedLabel = label.toLowerCase()

    if (item.type === 'progressTopic' && !item.key) {
      item.key = toProgressTopicKey(label)
    }
  }

  if (hasActive) {
    item.active = Boolean(req.body.active)
  }

  item.updatedBy = String(req.admin?.username || 'admin')

  try {
    await item.save()
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, `${type} already exists`)
    }
    throw error
  }

  res.json({
    message: `${type} updated successfully`,
    item
  })
})

export const deleteRegistrationLookup = asyncHandler(async (req, res) => {
  const type = validateType(req.params.type)
  const item = await RegistrationLookup.findOneAndDelete({ _id: req.params.id, type })

  if (!item) {
    throw new ApiError(404, 'Lookup item not found')
  }

  res.json({
    message: `${type} removed successfully`
  })
})
