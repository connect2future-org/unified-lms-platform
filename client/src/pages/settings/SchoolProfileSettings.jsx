import { useState, useEffect } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'
import { validationSchemas, validateForm, hasErrors } from '../../utils/formValidation'

export const SchoolProfileSettings = () => {
  const { data, loading, error, update } = useSettings('school')
  const [form, setForm] = useState({
    name: '',
    schoolId: '',
    address: '',
    contact: '',
    website: '',
    principal: ''
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (data?.items?.[0]) {
      setForm(data.items[0])
    }
  }, [data])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    
    // Clear error for this field when user starts typing
    if (touched[name]) {
      const fieldError = validationSchemas.schoolProfile[name]
        ?.reduce((err, validator) => err || validator(value), null)
      setErrors({ ...errors, [name]: fieldError })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched({ ...touched, [name]: true })
    
    // Validate field on blur
    const fieldRules = validationSchemas.schoolProfile[name]
    if (fieldRules) {
      const fieldError = fieldRules.reduce((err, validator) => err || validator(form[name]), null)
      setErrors({ ...errors, [name]: fieldError })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all fields
    const newErrors = {}
    for (const [fieldName, fieldRules] of Object.entries(validationSchemas.schoolProfile)) {
      const fieldError = fieldRules.reduce((err, validator) => err || validator(form[fieldName]), null)
      if (fieldError) {
        newErrors[fieldName] = fieldError
      }
    }
    
    setErrors(newErrors)
    
    if (Object.values(newErrors).some(err => err)) {
      setMessage('Please fix the errors below')
      return
    }
    
    try {
      await update(form._id, form)
      setMessage('School profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to update school profile')
    }
  }

  const isFormValid = !hasErrors(errors) && form.name && form.schoolId

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>School Profile</h2>
          <p>Configure your school's basic information</p>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {loading && <div className="loader">Loading...</div>}
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <label>
              School Name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>

            <label>
              School ID / Code *
              <input
                type="text"
                name="schoolId"
                value={form.schoolId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.schoolId ? 'error' : ''}
                disabled
              />
              {errors.schoolId && <span className="field-error">{errors.schoolId}</span>}
            </label>

            <label>
              Address
              <textarea
                name="address"
                value={form.address || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </label>

            <label>
              Contact Number
              <input
                type="tel"
                name="contact"
                value={form.contact || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.contact ? 'error' : ''}
              />
              {errors.contact && <span className="field-error">{errors.contact}</span>}
            </label>

            <label>
              Website
              <input
                type="url"
                name="website"
                value={form.website || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="https://example.com"
                className={errors.website ? 'error' : ''}
              />
              {errors.website && <span className="field-error">{errors.website}</span>}
            </label>

            <label>
              Principal Name
              <input
                type="text"
                name="principal"
                value={form.principal || ''}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !isFormValid}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </SettingsLayout>
  )
}
