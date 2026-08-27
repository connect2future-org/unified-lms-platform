/**
 * Frontend form validation utilities for settings
 */

export const validators = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`
    }
    return null
  },

  email: (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  url: (value) => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Please enter a valid URL'
    }
  },

  minLength: (value, min) => {
    if (!value) return null
    if (value.toString().length < min) {
      return `Must be at least ${min} characters`
    }
    return null
  },

  maxLength: (value, max) => {
    if (!value) return null
    if (value.toString().length > max) {
      return `Must be no more than ${max} characters`
    }
    return null
  },

  minValue: (value, min) => {
    if (value === null || value === undefined || value === '') return null
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < min) {
      return `Must be at least ${min}`
    }
    return null
  },

  maxValue: (value, max) => {
    if (value === null || value === undefined || value === '') return null
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue > max) {
      return `Must be no more than ${max}`
    }
    return null
  },

  numeric: (value) => {
    if (!value && value !== 0) return null
    if (isNaN(parseFloat(value))) {
      return 'Must be a number'
    }
    return null
  },

  percentage: (value) => {
    if (value === null || value === undefined || value === '') return null
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      return 'Must be a percentage between 0 and 100'
    }
    return null
  },

  dateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start >= end) {
      return 'Start date must be before end date'
    }
    return null
  },

  futureDate: (value) => {
    if (!value) return null
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      return 'Date must be in the future'
    }
    return null
  },

  pastDate: (value) => {
    if (!value) return null
    const date = new Date(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) {
      return 'Date must be in the past'
    }
    return null
  },

  password: (value) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain number'
    if (!/[!@#$%^&*]/.test(value)) return 'Password must contain special character'
    return null
  },

  phone: (value) => {
    if (!value) return null
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      return 'Please enter a valid phone number'
    }
    return null
  },

  unique: async (value, checkFn) => {
    if (!value) return null
    try {
      const isUnique = await checkFn(value)
      if (!isUnique) {
        return 'This value already exists'
      }
      return null
    } catch (error) {
      console.error('Unique validation error:', error)
      return 'Unable to validate uniqueness'
    }
  }
}

/**
 * Validate a single field
 */
export const validateField = (name, value, rules) => {
  if (!rules[name]) return null

  const fieldRules = rules[name]
  for (const rule of fieldRules) {
    const error = rule(value)
    if (error) return error
  }
  return null
}

/**
 * Validate all form fields
 */
export const validateForm = (formData, rules) => {
  const errors = {}

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const value = formData[fieldName]
    const error = validateField(fieldName, value, rules)
    if (error) {
      errors[fieldName] = error
    }
  }

  return errors
}

/**
 * Check if form has any errors
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some(error => error !== null && error !== '')
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  schoolProfile: {
    name: [(v) => validators.required(v, 'School name')],
    schoolId: [(v) => validators.required(v, 'School ID')],
    address: [(v) => validators.required(v, 'Address')],
    website: [(v) => validators.url(v)]
  },

  academicYear: {
    name: [(v) => validators.required(v, 'Academic year name')],
    startDate: [(v) => validators.required(v, 'Start date')],
    endDate: [(v) => validators.required(v, 'End date')]
  },

  user: {
    name: [
      (v) => validators.required(v, 'Name'),
      (v) => validators.minLength(v, 2)
    ],
    email: [
      (v) => validators.required(v, 'Email'),
      (v) => validators.email(v)
    ],
    password: [
      (v) => validators.required(v, 'Password'),
      (v) => validators.password(v)
    ]
  },

  gradeScale: {
    name: [(v) => validators.required(v, 'Grade scale name')],
    passingPercentage: [
      (v) => validators.required(v, 'Passing percentage'),
      (v) => validators.percentage(v)
    ]
  },

  department: {
    name: [(v) => validators.required(v, 'Department name')],
    email: [(v) => validators.email(v)],
    phone: [(v) => validators.phone(v)]
  },

  subject: {
    subjectCode: [(v) => validators.required(v, 'Subject code')],
    name: [(v) => validators.required(v, 'Subject name')],
    creditHours: [
      (v) => validators.numeric(v),
      (v) => validators.minValue(v, 0)
    ]
  },

  assessmentType: {
    name: [(v) => validators.required(v, 'Assessment type name')],
    maxMarks: [
      (v) => validators.required(v, 'Maximum marks'),
      (v) => validators.numeric(v),
      (v) => validators.minValue(v, 0)
    ],
    weightage: [
      (v) => validators.percentage(v)
    ]
  },

  attendanceRule: {
    name: [(v) => validators.required(v, 'Rule name')],
    minAttendancePercentage: [
      (v) => validators.required(v, 'Minimum attendance %'),
      (v) => validators.percentage(v)
    ]
  },

  communicationTemplate: {
    name: [(v) => validators.required(v, 'Template name')],
    type: [(v) => validators.required(v, 'Template type')],
    body: [(v) => validators.required(v, 'Template body')]
  }
}
